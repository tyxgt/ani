const cloud = require('wx-server-sdk')
const jwt = require('jsonwebtoken')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const TOKEN_EXPIRES_IN = 7 * 24 * 3600

// 生产环境必须在云开发控制台为本函数配置 JWT_SECRET 环境变量；
// 未配置时使用固定兜底值仅方便本地联调，不能用于线上。
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-please-set-JWT_SECRET'

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
}

exports.main = async (event, context) => {
  const { code } = event
  const { OPENID, APPID, UNIONID } = cloud.getWXContext()

  console.log('[login] 收到请求, code:', !!code)
  console.log('[login] OPENID:', OPENID)
  console.log('[login] APPID:', APPID)
  console.log('[login] UNIONID:', UNIONID)

  if (!OPENID) {
    return {
      code: -1,
      msg: '登录失败: 获取 openid 失败',
      data: null,
    }
  }

  const expiresAt = Date.now() + TOKEN_EXPIRES_IN * 1000
  const token = generateToken({ openid: OPENID, unionid: UNIONID || null })

  console.log('[login] 登录成功, openid:', OPENID)

  const response = {
    code: 0,
    msg: '',
    data: {
      token,
      openid: OPENID,
      unionid: UNIONID,
      expiresAt,
    },
  }

  console.log('[login] 返回响应:', JSON.stringify(response))

  return response
}
