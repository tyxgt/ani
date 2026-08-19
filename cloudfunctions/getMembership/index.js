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

function isVipActive(user) {
  return !!(user && user.vipExpireAt && user.vipExpireAt > Date.now())
}

// 纯查询会员状态，供前端在 tabBar 页面 onShow 时静默刷新调用，不做任何写操作。
// 身份校验方式与其余云函数保持一致：校验 token，再取云上下文的 OPENID。
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
    const result = await db.collection('user').where({ openid: OPENID }).get()
    const user = result.data && result.data[0]

    return {
      code: 0,
      msg: '',
      data: {
        isVip: isVipActive(user),
        vipExpireAt: (user && user.vipExpireAt) || null,
        vipType: (user && user.vipType) || null,
      },
    }
  } catch (err) {
    console.error('[getMembership] 查询失败:', err)
    // 查询失败按"非会员"兜底，不让异常向上抛出导致前端误判
    return {
      code: 0,
      msg: '',
      data: {
        isVip: false,
        vipExpireAt: null,
        vipType: null,
      },
    }
  }
}
