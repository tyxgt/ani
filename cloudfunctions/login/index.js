const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const TOKEN_EXPIRES_IN = 7 * 24 * 3600

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
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

  const token = generateToken()
  const expiresAt = Date.now() + TOKEN_EXPIRES_IN * 1000

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
