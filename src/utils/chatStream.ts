import { CHAT_STREAM_COLLECTION } from '../constants'

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

// 生成一个前端持有的流式记录主键，随请求一起传给 chat 云函数：前端要在
// 云函数真正建好这条数据库记录之前就能确定 watch 哪条记录，所以不能用云函数
// 自己生成的 _id，必须由前端先生成好再传下去。
export function generateStreamId(): string {
  // #ifdef MP-WEIXIN
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  // #endif

  // 非微信小程序（如字节跳动小程序）没有对应的原生数据库实时推送能力，返回空串——
  // chat 云函数收到空 streamId 会跳过建流式记录，整体退化为"等 callFunction
  // 整体返回"这一条路径，不影响功能，只是没有中途增量展示。
  return ''
}

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
