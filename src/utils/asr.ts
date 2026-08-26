import { AI_ASR_CLOUD_FUNCTION } from '../constants'
import { callFunction } from './cloud'

// ─── 语音输入（ASR）──────────────────────────────────────────
// 目前仅微信小程序支持：录音走 uni.getRecorderManager()，识别走云函数
// cloudfunctions/asr 代理调用腾讯云"一句话识别"。其他平台 isASRSupported()
// 返回 false，调用方应据此隐藏语音入口，不要直接调用 start/stop。

// 录音时长小于这个阈值视为误触（长按太短），直接判定失败，不发起识别请求
const MIN_RECORDING_DURATION_MS = 500

// 单次录音最长时长：跟腾讯云"一句话识别"60 秒的时长上限对齐，超过自动停止
const MAX_RECORDING_DURATION_MS = 60000

// 真机上 start() 到麦克风真正开始采集之间有一点原生延迟；如果长按时间特别短，
// 松手时录音其实还没真正启动，此时调用 stop() 有可能被静默忽略——既不触发
// onStop 也不触发 onError，导致识别流程卡在"识别中"再也回不来。这里松手后
// 最多等一小段时间让 onStart 先落地，再去调 stop()。
const WAIT_FOR_START_INTERVAL_MS = 30
const WAIT_FOR_START_TIMEOUT_MS = 300

// 整个"停止录音 + 识别"流程的硬超时：不管上面的规避是否覆盖了所有情况，
// 到点了都必须让 Promise 落地，绝不能让调用方（UI）永远卡在识别中状态。
const STOP_RECORDING_TIMEOUT_MS = 8000

export const VOICE_RECORDING_TOO_SHORT = 'duration-too-short'

// #ifdef MP-WEIXIN
// uni-app 通用类型定义里 RecorderManager 没有 offStop/offError——跟
// InnerAudioContext 不一样，微信 RecorderManager 本身就不提供 off 系列方法
// （真机上调用会报 "manager.offStop is not a function"）。onStop/onError
// 只能整个生命周期绑定一次，这里用 currentStopHandler/currentErrorHandler
// 这两个"当前处理者"引用把事件转发给正在进行的那一轮 stopVoiceRecording()，
// 而不是每次 bind/unbind。
let recorderManager: any = null
let hasRecordingStarted = false
let currentStopHandler: ((res: any) => void) | null = null
let currentErrorHandler: ((err: any) => void) | null = null

function getRecorderManager(): any {
  if (!recorderManager) {
    recorderManager = uni.getRecorderManager()
    recorderManager.onStart(() => {
      console.log('[ASR] onStart 触发，录音已真正开始')
      hasRecordingStarted = true
    })
    recorderManager.onStop((res: any) => {
      console.log('[ASR] onStop 触发:', res)
      currentStopHandler?.(res)
    })
    recorderManager.onError((err: any) => {
      console.error('[ASR] onError 触发:', err)
      currentErrorHandler?.(err)
    })
  }
  return recorderManager
}
// #endif

/**
 * 检测当前平台是否支持语音输入
 */
export function isASRSupported(): boolean {
  // #ifdef MP-WEIXIN
  return true
  // #endif

  return false
}

/**
 * 开始录音（长按说话按下时调用）
 */
export function startVoiceRecording(): void {
  // #ifdef MP-WEIXIN
  hasRecordingStarted = false
  console.log('[ASR] 调用 start()')
  getRecorderManager().start({
    format: 'mp3',
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 48000,
    duration: MAX_RECORDING_DURATION_MS,
  })
  // #endif
}

/**
 * 结束录音并发起识别（长按说话松开时调用）
 * resolve 识别出的文字（可能是空字符串，代表没听清/静音），
 * reject 代表真正的失败：录音时长太短（VOICE_RECORDING_TOO_SHORT）、
 * 录音本身出错（多数是麦克风权限被拒绝）、识别超时、或云函数调用失败。
 * 无论哪种情况，这个 Promise 保证会在有限时间内 settle，不会让调用方永远
 * 卡在"识别中"状态。
 */
export function stopVoiceRecording(): Promise<string> {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    const manager = getRecorderManager()
    let settled = false

    const onStop = async (res: { tempFilePath: string; duration: number }) => {
      cleanup()

      if (!res || res.duration < MIN_RECORDING_DURATION_MS) {
        settleReject(new Error(VOICE_RECORDING_TOO_SHORT))
        return
      }

      try {
        const base64 = uni.getFileSystemManager().readFileSync(res.tempFilePath, 'base64') as string
        const result = await callFunction(AI_ASR_CLOUD_FUNCTION, { audio: base64, format: 'mp3' })
        if (result.code === 0) {
          settleResolve((result.data && result.data.text) || '')
        } else {
          settleReject(new Error(result.msg || '语音识别失败'))
        }
      } catch (error) {
        settleReject(error instanceof Error ? error : new Error('语音识别失败'))
      }
    }

    const onError = (err: any) => {
      cleanup()
      console.error('[ASR] 录音失败:', err)
      settleReject(err instanceof Error ? err : new Error((err && err.errMsg) || '录音失败'))
    }

    function cleanup() {
      // 只清空"当前处理者"引用，不调用 off 系列方法（RecorderManager 没有）
      if (currentStopHandler === onStop) currentStopHandler = null
      if (currentErrorHandler === onError) currentErrorHandler = null
      clearTimeout(safetyTimer)
    }

    function settleResolve(text: string) {
      if (settled) return
      settled = true
      resolve(text)
    }

    function settleReject(error: Error) {
      if (settled) return
      settled = true
      reject(error)
    }

    // 安全兜底：onStop/onError 因为各种原生边界情况（stop() 在录音真正开始前
    // 被静默忽略、设备异常等）迟迟不触发时，到点强制结束，避免 UI 永久卡住。
    const safetyTimer = setTimeout(() => {
      cleanup()
      settleReject(new Error('语音识别超时，请重试'))
    }, STOP_RECORDING_TIMEOUT_MS)

    currentStopHandler = onStop
    currentErrorHandler = onError

    // 松手时如果录音还没真正开始（onStart 未触发），先等它一小会儿再 stop()，
    // 避免过早调用被静默吞掉；最多等 WAIT_FOR_START_TIMEOUT_MS，超时也强制停止。
    if (hasRecordingStarted) {
      console.log('[ASR] 录音已开始，直接调用 stop()')
      manager.stop()
    } else {
      console.log('[ASR] 录音尚未开始，等待 onStart 后再 stop()')
      let waited = 0
      const waitTimer = setInterval(() => {
        waited += WAIT_FOR_START_INTERVAL_MS
        if (hasRecordingStarted || waited >= WAIT_FOR_START_TIMEOUT_MS) {
          clearInterval(waitTimer)
          console.log(`[ASR] 等待结束（等了 ${waited}ms，hasRecordingStarted=${hasRecordingStarted}），调用 stop()`)
          manager.stop()
        }
      }, WAIT_FOR_START_INTERVAL_MS)
    }
  })
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('当前平台不支持语音输入'))
  // #endif
}
