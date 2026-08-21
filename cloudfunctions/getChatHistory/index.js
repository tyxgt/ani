const cloud = require('wx-server-sdk')
const jwt = require('jsonwebtoken')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

function verifyToken(token) {
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-only-insecure-secret-please-set-JWT_SECRET')
  } catch (e) {
    return null
  }
}

const HISTORY_LIMIT = 200 // 只需要"换设备/重装时把历史找回来"，不做无限回溯，够用且控制查询量
const PAGE_SIZE = 100 // 微信云开发单次 .get() 上限是 100 条，超过要循环 skip 分批查

// 服务端内部分批突破 100 条上限，对前端始终是一次调用拿到全部（最近 HISTORY_LIMIT 条）
async function fetchRecentMessages(openid, limit) {
  const collected = []
  let skip = 0
  while (collected.length < limit) {
    const pageSize = Math.min(PAGE_SIZE, limit - collected.length)
    const res = await db.collection('chatMessage')
      .where({ openid })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
    collected.push(...res.data)
    if (res.data.length < pageSize) break // 没有更多数据了
    skip += res.data.length
  }
  return collected.reverse() // desc 取最近 N 条 → reverse 成时间正序，匹配前端渲染顺序
}

// 纯查询，供前端在本地聊天记录为空（换设备/重装小程序）时把历史找回来。
// 只校验登录态，不重复校验 VIP：这里只读该用户已产生的存档，不消耗新的 AI 调用；
// ai/index.vue 的 onShow 已经把非会员挡在页面之外了，这里再拦一次没有额外收益。
exports.main = async (event, context) => {
  const payload = verifyToken(event.token)
  if (!payload) {
    return { code: 401, msg: '未登录或登录已过期', data: null }
  }

  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return {
      code: -1,
      msg: '无法获取用户身份',
      data: null,
    }
  }

  try {
    const list = await fetchRecentMessages(OPENID, HISTORY_LIMIT)

    return {
      code: 0,
      msg: '',
      data: list.map(doc => ({
        id: doc.createdAt.getTime(), // 合成前端需要的 number id
        role: doc.role,
        content: doc.content,
        time: doc.createdAt.getTime(), // 返回时间戳，格式化交给前端统一处理（跟 getTimeString 保持唯一实现）
      })),
    }
  } catch (err) {
    console.error('[getChatHistory] 查询失败:', err)
    return {
      code: -1,
      msg: err.message || '获取历史记录失败',
      data: null,
    }
  }
}
