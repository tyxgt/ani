import { CHAT_STREAM_COLLECTION } from '../constants'
import { generateStreamId } from './streamId'

// ─── AI 对话流式展示 ─────────────────────────────────────────────
// chat 云函数把 AI 回复的增量节流写入 chatStream 集合的一条记录（见
// cloudfunctions/chat/index.js 的 createStreamWriter），这里用小程序数据库
// 原生 watch() 实时监听这条记录，边收到增量边渲染，取代原来"等 callFunction
// 整体返回再用 setInterval 模拟打字机"的假流式效果。

export interface ChatStreamHandlers {
  onContent: (content: string) => void
  onDone: (finalContent: string) => void
  onError: (err?: any) => void
}

export interface ChatStreamWatcher {
  close: () => void
}

// streamId 生成逻辑跟 chat 没有实质耦合，ttsStream.ts 也要用同一个，
// 已经提到 streamId.ts 里，这里保留 re-export 避免调用方 import 路径改动。
export { generateStreamId }

// 监听一条流式记录的增量。streamId 为空串时直接返回一个空操作的 watcher，
// 调用方不需要为"当前平台是否支持流式"写任何特判代码。
export function watchChatStream(streamId: string, handlers: ChatStreamHandlers): ChatStreamWatcher {
  // #ifdef MP-WEIXIN
  if (!streamId) {
    return { close() {} }
  }

  let closed = false
  let lastContent = ''

  const db = wx.cloud.database()
  const watcher = db.collection(CHAT_STREAM_COLLECTION).doc(streamId).watch({
    onChange(snapshot: any) {
      if (closed) return

      // 记录还没建好（云函数还没跑到 ensureCreated 那一步），忽略，等下一次 onChange。
      const doc = snapshot && snapshot.docs && snapshot.docs[0]
      if (!doc) return

      if (typeof doc.content === 'string' && doc.content !== lastContent) {
        lastContent = doc.content
        handlers.onContent(doc.content)
      }

      if (doc.status === 'done') {
        handlers.onDone(doc.content || '')
        close()
      } else if (doc.status === 'error') {
        handlers.onError(new Error('AI 回复失败'))
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
