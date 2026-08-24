import { TTS_STREAM_COLLECTION } from '../constants'

// ─── TTS 分片流式播放 ─────────────────────────────────────────────
// tts 云函数每合成完一段音频就把 base64 追加写入 ttsStream 集合的一条记录
// （见 cloudfunctions/tts/index.js 的 createTtsStreamWriter），这里用小程序
// 数据库原生 watch() 实时监听这条记录，收到一段就能立刻播放，取代原来
// "等全部分段合成完、整个 audioList 一次性传回"才开始播的等待。

export interface TtsStreamHandlers {
  onChunk: (chunkBase64: string) => void // 新出现的一个音频分段，按序到达
  onDone: () => void
  onError: (err?: any) => void
}

export interface TtsStreamWatcher {
  close: () => void
}

// 监听一条 TTS 流式记录的分段追加。streamId 为空串时直接返回一个空操作的
// watcher，调用方不需要为"当前平台是否支持流式"写任何特判代码。
export function watchTtsStream(streamId: string, handlers: TtsStreamHandlers): TtsStreamWatcher {
  // #ifdef MP-WEIXIN
  if (!streamId) {
    return { close() {} }
  }

  let closed = false
  // 已经消费过的 chunks 数组长度：每次 onChange 只把新增出现的分段依次回调
  // 出去，哪怕一次性看到数组跳了好几个新元素（某次推送被合并/跳过）也不会
  // 漏播——这跟 chatStream.ts 靠"整段最新文本"做 diff 不同，音频分段是互相
  // 独立、不可合并的播放单元，必须靠数组长度 diff 才能保证一段不漏。
  let deliveredCount = 0

  const db = wx.cloud.database()
  const watcher = db.collection(TTS_STREAM_COLLECTION).doc(streamId).watch({
    onChange(snapshot: any) {
      if (closed) return

      const doc = snapshot && snapshot.docs && snapshot.docs[0]
      if (!doc) return

      const chunks: string[] = Array.isArray(doc.chunks) ? doc.chunks : []
      while (deliveredCount < chunks.length) {
        handlers.onChunk(chunks[deliveredCount])
        deliveredCount++
      }

      if (doc.status === 'done') {
        handlers.onDone()
        close()
      } else if (doc.status === 'error') {
        handlers.onError(new Error('语音合成失败'))
        close()
      }
    },
    onError(err: any) {
      if (closed) return
      handlers.onError(err)
      close()
    },
  })

  function close() {
    if (closed) return
    closed = true
    try {
      watcher.close()
    } catch (e) {
      // 关闭失败不影响业务，调用方也不会再用这个 watcher
    }
  }

  return { close }
  // #endif

  // #ifndef MP-WEIXIN
  return { close() {} }
  // #endif
}
