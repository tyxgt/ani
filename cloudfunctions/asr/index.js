const cloud = require('wx-server-sdk')
const https = require('https')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

function verifyToken(token) {
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-only-insecure-secret-please-set-JWT_SECRET')
  } catch (e) {
    return null
  }
}

// ─── 腾讯云语音识别(ASR) 一句话识别 SentenceRecognition ───────────
// 文档: https://cloud.tencent.com/document/product/1093/35646
// 密钥来自腾讯云控制台「访问管理 - API密钥管理」，通过环境变量注入，绝不写死在代码里：
//   TENCENT_SECRET_ID / TENCENT_SECRET_KEY（与 tts 云函数共用同一对密钥）
const ASR_HOST = 'asr.tencentcloudapi.com'
const ASR_SERVICE = 'asr'
const ASR_VERSION = '2019-06-14'
const ASR_ACTION = 'SentenceRecognition'
const ASR_REGION = 'ap-guangzhou'

function hmac256(message, secret, encoding) {
  return crypto.createHmac('sha256', secret).update(message, 'utf8').digest(encoding)
}

function sha256Hex(message) {
  return crypto.createHash('sha256').update(message, 'utf8').digest('hex')
}

function getUtcDate(timestamp) {
  const date = new Date(timestamp * 1000)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 生成腾讯云 API 3.0 (TC3-HMAC-SHA256) 签名
// 参考: https://cloud.tencent.com/document/api/213/30654
function buildAuthorization({ secretId, secretKey, payload, timestamp }) {
  const date = getUtcDate(timestamp)

  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${ASR_HOST}\nx-tc-action:${ASR_ACTION.toLowerCase()}\n`
  const signedHeaders = 'content-type;host;x-tc-action'
  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeaders,
    sha256Hex(payload),
  ].join('\n')

  const credentialScope = `${date}/${ASR_SERVICE}/tc3_request`
  const stringToSign = [
    'TC3-HMAC-SHA256',
    timestamp,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  const secretDate = hmac256(date, 'TC3' + secretKey)
  const secretService = hmac256(ASR_SERVICE, secretDate)
  const secretSigning = hmac256('tc3_request', secretService)
  const signature = hmac256(stringToSign, secretSigning, 'hex')

  return `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

function generateUsrAudioKey() {
  return 'asr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function requestSentenceRecognition({ audioBase64, voiceFormat, secretId, secretKey }) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000)
    // DataLen 要求是原始音频的字节数（不是 base64 字符串长度），Buffer.byteLength
    // 按 base64 解码计算最准确，避免因为 base64 padding 导致长度对不上被腾讯云拒绝。
    const dataLen = Buffer.from(audioBase64, 'base64').length
    const payload = JSON.stringify({
      ProjectId: 0,
      SubServiceType: 2,
      EngSerViceType: '16k_zh',
      SourceType: 1,
      VoiceFormat: voiceFormat,
      UsrAudioKey: generateUsrAudioKey(),
      Data: audioBase64,
      DataLen: dataLen,
    })

    const authorization = buildAuthorization({ secretId, secretKey, payload, timestamp })

    const options = {
      hostname: ASR_HOST,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Host: ASR_HOST,
        'X-TC-Action': ASR_ACTION,
        'X-TC-Version': ASR_VERSION,
        'X-TC-Timestamp': String(timestamp),
        'X-TC-Region': ASR_REGION,
        Authorization: authorization,
      },
      timeout: 15000,
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          if (json.Response && json.Response.Error) {
            reject(new Error(json.Response.Error.Message || '腾讯云语音识别调用失败'))
            return
          }
          resolve(json.Response)
        } catch (e) {
          reject(new Error('解析腾讯云语音识别响应失败: ' + e.message))
        }
      })
    })

    req.on('error', (e) => reject(new Error('腾讯云语音识别请求错误: ' + e.message)))
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('腾讯云语音识别请求超时'))
    })

    req.write(payload)
    req.end()
  })
}

exports.main = async (event, context) => {
  const { audio, format } = event

  const payload = verifyToken(event.token)
  if (!payload) {
    return { code: 401, msg: '未登录或登录已过期', data: null }
  }

  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  if (!OPENID) {
    return { code: -1, msg: '无法获取用户身份', data: null }
  }

  if (!audio || !String(audio).trim()) {
    return { code: -1, msg: '录音数据不能为空', data: null }
  }

  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY
  if (!secretId || !secretKey) {
    console.error('[asr] 缺少 TENCENT_SECRET_ID / TENCENT_SECRET_KEY 环境变量，请在云开发控制台配置')
    return { code: -1, msg: '语音识别服务未配置密钥', data: null }
  }

  try {
    const resp = await requestSentenceRecognition({
      audioBase64: audio,
      voiceFormat: format || 'mp3',
      secretId,
      secretKey,
    })

    return {
      code: 0,
      msg: '',
      data: {
        text: (resp && resp.Result) || '', // 没听清/静音时腾讯云通常返回空字符串，原样透传给前端判断
      },
    }
  } catch (error) {
    console.error('[asr] 调用失败:', error)
    return {
      code: -1,
      msg: error.message || '语音识别服务暂时不可用',
      data: null,
    }
  }
}
