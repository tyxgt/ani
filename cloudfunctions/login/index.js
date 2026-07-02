const express = require('express')
const crypto = require('crypto')
const axios = require('axios')

const config = {
  appid: process.env.DOUYIN_APPID || '',
  secret: process.env.DOUYIN_SECRET || '',
  tokenExpiresIn: Number(process.env.TOKEN_EXPIRES_IN) || 7 * 24 * 3600,
}

console.log('AppID loaded:', !!config.appid)
console.log('Secret loaded:', !!config.secret)

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

const app = express()

app.use(express.json())

app.use((req, res, next) => {
  console.log('[login] ===== 请求进入 method:', req.method, 'path:', req.path, 'url:', req.originalUrl)
  console.log('[login] 请求 headers:', JSON.stringify(req.headers))
  console.log('[login] 请求 body:', JSON.stringify(req.body))
  next()
})

async function handleLogin(req, res) {
  console.log('[login] 收到请求，req.body:', JSON.stringify(req.body))

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ code: -1, msg: '请求体格式错误，应为 JSON 对象' })
  }

  const { code } = req.body || {}

  console.log('[login] code:', !!code)

  if (!code) {
    return res.json({ code: -1, msg: '缺少登录 code' })
  }

  if (!config.appid || !config.secret) {
    return res.json({ code: -1, msg: '服务端配置缺失' })
  }

  try {
    console.log('[login] Calling code2session...')
    const { data: apiRes } = await axios.post(
      'https://open-sandbox.douyin.com/api/apps/v2/jscode2session',
      {
        appid: config.appid,
        secret: config.secret,
        code,
      },
      { timeout: 10000 }
    )
    console.log('[login] API response:', JSON.stringify(apiRes))

    if (apiRes.err_no !== 0 || !apiRes.data) {
      return res.json({
        code: -1,
        msg: `登录失败: ${apiRes.err_tips || '未知错误'}`,
      })
    }

    const { openid, session_key: sessionKey } = apiRes.data
    const token = generateToken()
    const expiresAt = Date.now() + config.tokenExpiresIn * 1000

    console.log('[login] 登录成功 openid:', openid)

    return res.json({
      code: 0,
      msg: '登录成功',
      data: { token, openid, expiresAt },
    })
  } catch (error) {
    console.error('[login] Error:', error)
    return res.json({
      code: -1,
      msg: '服务器内部错误',
      detail: String(error),
    })
  }
}

app.post('/', handleLogin)
app.post('/index', handleLogin)

app.get('/', (req, res) => {
  res.json({
    code: 0,
    msg: 'login service is running',
    data: null,
  })
})

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'login',
  })
})

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('[login] 未捕获异常:', err)
  res.status(500).json({
    code: -1,
    msg: '服务器内部错误',
    detail: String(err),
  })
})

app.use((req, res) => {
  console.log('[login] 404 Not Found - method:', req.method, 'path:', req.path, 'originalUrl:', req.originalUrl)
  res.status(404).json({
    code: -1,
    msg: '404 Not Found - 路由未匹配',
    data: {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
    },
  })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log('[login] ========================================')
  console.log('[login] 服务启动成功')
  console.log('[login] 监听端口:', PORT)
  console.log('[login] 环境变量 PORT:', process.env.PORT)
  console.log('[login] ========================================')
})

module.exports = app
