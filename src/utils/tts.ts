import { TTS_MAX_LENGTH, AI_TTS_CLOUD_FUNCTION } from '../constants'
import { callFunction } from './cloud'

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

// 长文本分段相关（文本分段 - 微信插件路径 / 音频分段 - 腾讯云路径复用同一套队列播放逻辑）
let textQueue: string[] = []
let audioQueue: string[] = []
let isPlayingQueue = false

/**
 * 检测当前平台是否支持TTS
 */
export function isTTSSupported(): boolean {
  // #ifdef MP-WEIXIN
  // 语音合成依赖「微信同声传译」插件（需在 manifest.json 声明 + 小程序后台添加插件）
  try {
    return typeof requirePlugin === 'function' && !!requirePlugin('WechatSI')
  } catch (e) {
    return false
  }
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

    callFunction(AI_TTS_CLOUD_FUNCTION, { text: content })
      .then((res) => {
        if (
          res.code !== 0 ||
          !res.data ||
          !Array.isArray(res.data.audioList) ||
          res.data.audioList.length === 0
        ) {
          currentStatus = 'idle'
          reject(new Error(res.msg || '腾讯云 TTS 合成失败'))
          return
        }

        const audioList: string[] = res.data.audioList
        const codec: string = res.data.codec || 'mp3'
        const mimeType = codec === 'wav' ? 'audio/wav' : 'audio/mp3'

        audioQueue = audioList.slice()
        isPlayingQueue = true

        const playNext = () => {
          if (currentStatus === 'idle' || !isPlayingQueue) {
            resolve()
            return
          }

          const chunk = audioQueue.shift()
          if (!chunk) {
            currentStatus = 'idle'
            isPlayingQueue = false
            onEnd?.()
            resolve()
            return
          }

          audioContext = uni.createInnerAudioContext()
          audioContext.src = `data:${mimeType};base64,${chunk}`

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

            if (audioQueue.length > 0) {
              setTimeout(playNext, 80)
            } else {
              currentStatus = 'idle'
              isPlayingQueue = false
              onEnd?.()
              resolve()
            }
          })

          audioContext.onError((err: any) => {
            console.error('[TTS] 腾讯云音频播放错误:', err)
            currentStatus = 'idle'
            isPlayingQueue = false
            reject(err)
          })

          audioContext.play()
        }

        playNext()
      })
      .catch((err) => {
        currentStatus = 'idle'
        reject(err)
      })
  })
}

/**
 * 微信TTS实现 - 使用「微信同声传译」插件 (WechatSI) 的 textToSpeech
 * 文档：https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/extended/translator.html
 * 注意：单次合成内容限制 50 个字符，需分段；分段大小见 TTS_MAX_LENGTH
 */
function speakTextWechatNative(options: TTSOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const { content, onStart, onEnd, onError } = options

    let plugin: any = null
    try {
      plugin = typeof requirePlugin === 'function' ? requirePlugin('WechatSI') : null
    } catch (e) {
      plugin = null
    }

    if (!plugin || typeof plugin.textToSpeech !== 'function') {
      reject(new Error('同声传译插件不可用，请检查 manifest.json 插件声明及小程序后台插件添加情况'))
      return
    }

    // 分段处理（textToSpeech 单次限制 50 个字符）
    textQueue = []
    const text = content.trim()
    for (let i = 0; i < text.length; i += TTS_MAX_LENGTH) {
      textQueue.push(text.slice(i, i + TTS_MAX_LENGTH))
    }

    if (textQueue.length === 0) {
      resolve()
      return
    }

    currentStatus = 'loading'
    isPlayingQueue = true

    const playNext = () => {
      if (currentStatus === 'idle' || !isPlayingQueue) {
        resolve()
        return
      }

      const chunk = textQueue.shift()
      if (!chunk) {
        // 所有段落播放完毕
        currentStatus = 'idle'
        isPlayingQueue = false
        onEnd?.()
        resolve()
        return
      }

      plugin.textToSpeech({
        lang: 'zh_CN',
        content: chunk,
        success: (res: any) => {
          if (res.retcode !== 0 || !res.filename) {
            console.error('[TTS] 合成失败：', res)
            currentStatus = 'idle'
            isPlayingQueue = false
            reject(new Error('语音合成失败'))
            return
          }

          // 播放合成的音频
          audioContext = uni.createInnerAudioContext()
          audioContext.src = res.filename

          audioContext.onPlay(() => {
            currentStatus = 'playing'
            console.log('[TTS] 开始播放段落')
            onStart?.()
          })

          audioContext.onEnded(() => {
            console.log('[TTS] 段落播放完毕')
            try {
              audioContext.destroy()
            } catch (e) {}
            audioContext = null

            if (textQueue.length > 0) {
              // 继续播放下一段
              setTimeout(playNext, 100)
            } else {
              // 全部播放完毕
              currentStatus = 'idle'
              isPlayingQueue = false
              onEnd?.()
              resolve()
            }
          })

          audioContext.onError((err: any) => {
            console.error('[TTS] 播放错误:', err)
            currentStatus = 'idle'
            isPlayingQueue = false
            reject(err)
          })

          audioContext.play()
        },
        fail: (err: any) => {
          console.error('[TTS] 合成失败:', err)
          currentStatus = 'idle'
          isPlayingQueue = false
          reject(err)
        },
      })
    }

    playNext()
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
 * 朗读文本 - 多级降级策略
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
  // 优先使用腾讯云 TTS（音质更好、无 50 字限制），失败后降级到微信同声传译插件
  try {
    console.log('[TTS] 优先尝试腾讯云 TTS')
    await speakTextTencentCloud({
      content: textToSpeak,
      onStart,
      onEnd,
      onError,
    })
    return
  } catch (cloudError) {
    console.warn('[TTS] 腾讯云 TTS 调用失败，降级到微信同声传译插件:', cloudError)
  }

  try {
    await speakTextWechatNative({
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
  textQueue = []
  audioQueue = []

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
