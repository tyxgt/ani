// 生成一个前端持有的流式记录主键，随请求一起传给云函数：前端要在云函数真正建好
// 这条数据库记录之前就能确定 watch 哪条记录，所以不能用云函数自己生成的 _id，
// 必须由前端先生成好再传下去。chat / tts 两条流式链路（分别见 chatStream.ts /
// ttsStream.ts）共用这一个生成器。
export function generateStreamId(): string {
  // #ifdef MP-WEIXIN
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  // #endif

  // 非微信小程序（如字节跳动小程序）没有对应的原生数据库实时推送能力，返回空串——
  // 调用方收到空 streamId 会跳过建流式记录，整体退化为"等 callFunction 整体返回"
  // 这一条路径，不影响功能，只是没有中途增量展示。
  return ''
}
