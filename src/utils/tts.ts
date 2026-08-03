import { TTS_MAX_LENGTH } from '../constants'

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

// 长文本分段相关
let textQueue: string[] = []
let isPlayingQueue = false

/**
 * 检测当前平台是否支持TTS
 */
export function isTTSSupported(): boolean {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && typeof wx.createSynthesizeVoice === 'function') {
    return true
  }
  return false
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
 * 微信TTS实现 - 使用原生API
 */
function speakTextWechatNative(options: TTSOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const { content, onStart, onEnd, onError } = options

    if (typeof wx === 'undefined' || typeof wx.createSynthesizeVoice !== 'function') {
      reject(new Error('原生TTS API不可用'))
      return
    }

    // 分段处理（避免单次合成过长文本）
    textQueue = []
    const text = content.trim()
    for (let i = 0; i < text.length; i += 200) {
      textQueue.push(text.slice(i, i + 200))
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

      wx.createSynthesizeVoice({
        content: chunk,
        success: (res: any) => {
          if (!res.tempFilePath) {
            console.error('[TTS] 合成失败：无文件')
            currentStatus = 'idle'
            isPlayingQueue = false
            reject(new Error('语音合成失败'))
            return
          }

          // 播放合成的音频
          audioContext = uni.createInnerAudioContext()
          audioContext.src = res.tempFilePath

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
  try {
    // 使用原生API
    if (typeof wx !== 'undefined' && typeof wx.createSynthesizeVoice === 'function') {
      console.log('[TTS] 使用原生createSynthesizeVoice')
      await speakTextWechatNative({
        content: textToSpeak,
        onStart,
        onEnd,
        onError,
      })
      return
    }

    // 不可用
    throw new Error('当前环境不支持微信TTS')
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
