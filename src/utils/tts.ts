import { AI_TTS_CLOUD_FUNCTION } from '../constants'
import { callFunction } from './cloud'
import { generateStreamId } from './streamId'
import { watchTtsStream } from './ttsStream'
import type { TtsStreamWatcher } from './ttsStream'

// ─── TTS 播放状态 ─────────────────────────────────────────────
export type TTSStatus = 'idle' | 'loading' | 'playing' | 'paused'

// ─── TTS 播放选项 ─────────────────────────────────────────────
export interface TTSOptions {
  content: string // 要朗读的文本
  onStart?: () => void // 开始播放回调
  onEnd?: () => void // 播放结束回调
  onError?: (err: any) => void // 错误回调
}

// ─── 全局状态管理 ─────────────────────────────────────────────
let currentStatus: TTSStatus = 'idle'
let audioContext: any = null
let currentSpeechUtterance: SpeechSynthesisUtterance | null = null

// 长文本分段相关（音频分段 - 腾讯云路径的队列播放逻辑）
let audioQueue: string[] = []
let isPlayingQueue = false
// 当前正在监听的 ttsStream watcher：stopSpeaking() 中途打断播放时要一并关掉，
// 避免用户点了停止之后数据库 watch 还留在后台。
let currentTtsWatcher: TtsStreamWatcher | null = null

/**
 * 检测当前平台是否支持TTS
 */
export function isTTSSupported(): boolean {
  // #ifdef MP-WEIXIN
  // 朗读能力依赖腾讯云 TTS 云函数，微信小程序下始终可用
  return true
  // #endif

  // #ifdef H5
  return typeof window !== 'undefined' && 'speechSynthesis' in window
  // #endif

  // #ifdef MP-TOUTIAO
  return false
  // #endif

  return false
}

/**
 * 获取当前播放状态
 */
export function getTTSStatus(): TTSStatus {
  return currentStatus
}

/**
 * 腾讯云语音合成 - 通过云函数代理调用（密钥在服务端，前端不接触）
 * 云函数: cloudfunctions/tts，需在云开发控制台配置 TENCENT_SECRET_ID / TENCENT_SECRET_KEY
 * 文档：https://cloud.tencent.com/document/product/1073/37995
 */
function speakTextTencentCloud(options: TTSOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const { content, onStart, onEnd, onError } = options

    currentStatus = 'loading'
    audioQueue = []
    isPlayingQueue = true

    let settled = false // resolve/reject 只能触发一次，流式和 callFunction 兜底两条路径都可能触发收尾
    let streamDone = false // 服务端已合成完全部分段（不代表播完，只代表队列不会再有新分段进来）
    let isPlayerBusy = false // 当前是否正在播放/准备播放某一段，避免并发触发 tryPlayNext
    let enqueuedCount = 0 // 已经入队过的分段数量，callFunction 兜底时只补没收到过的那部分，避免重复播放

    function finishSuccess() {
      if (settled) return
      settled = true
      currentStatus = 'idle'
      isPlayingQueue = false
      onEnd?.()
      resolve()
    }

    function finishError(err: any) {
      if (settled) return
      settled = true
      currentStatus = 'idle'
      isPlayingQueue = false
      reject(err)
    }

    // 队列暂时空只代表"还没等到下一段"，只有 streamDone（服务端确认不会再有
    // 新分段）且队列也空了，才是真的播完了——不能像原来那样一空就直接收尾。
    function tryPlayNext() {
      if (settled || !isPlayingQueue || isPlayerBusy) return

      const chunk = audioQueue.shift()
      if (!chunk) {
        if (streamDone) finishSuccess()
        return
      }

      isPlayerBusy = true

      // 真机（尤其 iOS）上 InnerAudioContext.src 不支持直接播放 data: base64 URI，
      // 会报 errCode 10001 / INNERERRCODE:-1100（在此服务器上找不到所请求的URL），
      // 开发者工具模拟器里因为走 PC 端 WebView 反而不会暴露这个问题。
      // 这里先把 base64 落地成本地临时文件，再用文件路径播放，真机和模拟器都能正常工作。
      // codec 服务端固定传 mp3（从未真正用过 wav），直接写死后缀，不用再等
      // callFunction 返回才知道 codec，减少一层没必要的时序依赖。
      const tempFilePath = `${wx.env.USER_DATA_PATH}/tts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`

      try {
        wx.getFileSystemManager().writeFileSync(tempFilePath, chunk, 'base64')
      } catch (err) {
        console.error('[TTS] 音频临时文件写入失败:', err)
        isPlayerBusy = false
        finishError(err)
        return
      }

      const cleanupTempFile = () => {
        wx.getFileSystemManager().unlink({
          filePath: tempFilePath,
          fail: () => {},
        })
      }

      audioContext = uni.createInnerAudioContext()
      audioContext.src = tempFilePath

      audioContext.onPlay(() => {
        currentStatus = 'playing'
        console.log('[TTS] 腾讯云段落开始播放')
        onStart?.()
      })

      audioContext.onEnded(() => {
        console.log('[TTS] 腾讯云段落播放完毕')
        try {
          audioContext.destroy()
        } catch (e) {}
        audioContext = null
        cleanupTempFile()
        isPlayerBusy = false
        tryPlayNext()
      })

      audioContext.onError((err: any) => {
        console.error('[TTS] 腾讯云音频播放错误:', err)
        cleanupTempFile()
        isPlayerBusy = false
        finishError(err)
      })

      audioContext.play()
    }

    function enqueueChunk(chunkBase64: string) {
      audioQueue.push(chunkBase64)
      enqueuedCount++
      tryPlayNext()
    }

    // 在发起 callFunction 之前就先开始 watch：不能等 callFunction 的 Promise
    // resolve 才开始监听，那样跟"整体等完"没区别。tts 云函数即使还没合成完
    // 第一段，watch 也能在记录创建后正常收到 onChange，收到一段就能立刻播放。
    const streamId = generateStreamId()
    currentTtsWatcher = watchTtsStream(streamId, {
      onChunk(chunkBase64) {
        enqueueChunk(chunkBase64)
      },
      onDone() {
        streamDone = true
        tryPlayNext() // 万一最后一段到达时队列恰好已经播完，需要重新判定一次收尾
      },
      onError() {
        // 不单独处理，避免和下面 callFunction 的报错分支重复触发；安静地等
        // callFunction 的返回来统一收尾。
      },
    })

    callFunction(AI_TTS_CLOUD_FUNCTION, { text: content, streamId })
      .then((res) => {
        currentTtsWatcher?.close()
        currentTtsWatcher = null

        if (
          res.code !== 0 ||
          !res.data ||
          !Array.isArray(res.data.audioList) ||
          res.data.audioList.length === 0
        ) {
          finishError(new Error(res.msg || '腾讯云 TTS 合成失败'))
          return
        }

        // 兜底补全：正常情况下流式推送应该已经把所有分段都 enqueue 过了；这里
        // 只补那些因为非小程序平台 / watch 失败等原因没能通过流式收到的剩余
        // 分段，保证不管流式链路是否生效，最终这段话都会被完整播放——跟
        // ai/index.vue 里 finalizeAssistantMessage 的兜底收尾同一个思路。
        const audioList: string[] = res.data.audioList
        for (let i = enqueuedCount; i < audioList.length; i++) {
          enqueueChunk(audioList[i])
        }
        streamDone = true
        tryPlayNext()
      })
      .catch((err) => {
        currentTtsWatcher?.close()
        currentTtsWatcher = null
        finishError(err)
      })
  })
}

/**
 * H5端TTS实现
 */
function speakTextH5(options: TTSOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const { content, onStart, onEnd, onError } = options

    if (!('speechSynthesis' in window)) {
      reject(new Error('当前浏览器不支持语音合成'))
      return
    }

    const utterance = new SpeechSynthesisUtterance(content.trim())
    utterance.lang = 'zh-CN'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => {
      currentStatus = 'playing'
      onStart?.()
    }

    utterance.onend = () => {
      currentStatus = 'idle'
      onEnd?.()
      resolve()
    }

    utterance.onerror = (event) => {
      currentStatus = 'idle'
      reject(event)
    }

    currentSpeechUtterance = utterance
    window.speechSynthesis.speak(utterance)
  })
}

/**
 * 朗读文本 - 按平台分发（微信小程序走腾讯云 TTS，H5 走浏览器原生合成）
 */
export async function speakText(options: TTSOptions): Promise<void> {
  const { content, onStart, onEnd, onError } = options

  // 验证文本内容
  if (!content || !content.trim()) {
    console.warn('[TTS] 文本内容为空，不执行朗读')
    return
  }

  // 如果正在播放，先停止
  if (currentStatus === 'playing' || currentStatus === 'paused') {
    stopSpeaking()
  }

  const textToSpeak = content.trim()

  // #ifdef MP-WEIXIN
  try {
    await speakTextTencentCloud({
      content: textToSpeak,
      onStart,
      onEnd,
      onError,
    })
  } catch (error) {
    currentStatus = 'idle'
    console.error('[TTS] 朗读失败:', error)
    uni.showToast({
      title: '朗读功能暂不可用',
      icon: 'none',
      duration: 2000,
    })
    onError?.(error)
  }
  // #endif

  // #ifdef H5
  try {
    await speakTextH5({
      content: textToSpeak,
      onStart,
      onEnd,
      onError,
    })
  } catch (error) {
    currentStatus = 'idle'
    console.error('[TTS] H5朗读失败:', error)
    uni.showToast({
      title: '朗读功能暂不可用',
      icon: 'none',
      duration: 2000,
    })
    onError?.(error)
  }
  // #endif

  // #ifdef MP-TOUTIAO
  currentStatus = 'idle'
  uni.showToast({
    title: '朗读功能暂不支持',
    icon: 'none',
    duration: 2000,
  })
  onError?.(new Error('抖音小程序不支持TTS'))
  // #endif
}

/**
 * 停止朗读
 */
export function stopSpeaking(): void {
  isPlayingQueue = false
  audioQueue = []
  // 无论当前处于哪个状态都尝试关闭：正在等第一段合成完（loading）时中途叫停，
  // 这时可能还没播放过任何一段、audioContext 还是 null，但 watcher 已经在
  // 后台监听了，必须一并关掉，否则新分段还会继续被推进来。
  currentTtsWatcher?.close()
  currentTtsWatcher = null

  if (currentStatus === 'idle') {
    return
  }

  // #ifdef MP-WEIXIN
  if (audioContext) {
    try {
      audioContext.stop()
      audioContext.destroy()
      audioContext = null
    } catch (error) {
      console.error('[TTS] 停止播放失败:', error)
    }
  }
  // #endif

  // #ifdef H5
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
    currentSpeechUtterance = null
  }
  // #endif

  currentStatus = 'idle'
  console.log('[TTS] 已停止播放')
}

/**
 * 暂停朗读
 */
export function pauseSpeaking(): void {
  if (currentStatus !== 'playing') {
    return
  }

  // #ifdef MP-WEIXIN
  if (audioContext) {
    try {
      audioContext.pause()
      currentStatus = 'paused'
      console.log('[TTS] 已暂停播放')
    } catch (error) {
      console.error('[TTS] 暂停播放失败:', error)
    }
  }
  // #endif

  // #ifdef H5
  if (window.speechSynthesis) {
    window.speechSynthesis.pause()
    currentStatus = 'paused'
    console.log('[TTS] H5 已暂停播放')
  }
  // #endif
}

/**
 * 恢复朗读
 */
export function resumeSpeaking(): void {
  if (currentStatus !== 'paused') {
    return
  }

  // #ifdef MP-WEIXIN
  if (audioContext) {
    try {
      audioContext.play()
      currentStatus = 'playing'
      console.log('[TTS] 已恢复播放')
    } catch (error) {
      console.error('[TTS] 恢复播放失败:', error)
    }
  }
  // #endif

  // #ifdef H5
  if (window.speechSynthesis) {
    window.speechSynthesis.resume()
    currentStatus = 'playing'
    console.log('[TTS] H5 已恢复播放')
  }
  // #endif
}
