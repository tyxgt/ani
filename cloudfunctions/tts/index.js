const cloud = require('wx-server-sdk')
const https = require('https')
const crypto = require('crypto')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

// ─── 腾讯云语音合成(TTS) TextToVoice ─────────────────────────────
// 文档: https://cloud.tencent.com/document/product/1073/37995
// 密钥来自腾讯云控制台「访问管理 - API密钥管理」，通过环境变量注入，绝不写死在代码里：
//   TENCENT_SECRET_ID / TENCENT_SECRET_KEY
const TTS_HOST = 'tts.tencentcloudapi.com'
const TTS_SERVICE = 'tts'
const TTS_VERSION = '2019-08-23'
const TTS_ACTION = 'TextToVoice'
const TTS_REGION = 'ap-guangzhou'

// Text 参数限制：中文最大支持150个汉字（全角标点算1个），这里留一点余量分段
const TEXT_CHUNK_SIZE = 140

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

  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${TTS_HOST}\nx-tc-action:${TTS_ACTION.toLowerCase()}\n`
  const signedHeaders = 'content-type;host;x-tc-action'
  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeaders,
    sha256Hex(payload),
  ].join('\n')

  const credentialScope = `${date}/${TTS_SERVICE}/tc3_request`
  const stringToSign = [
    'TC3-HMAC-SHA256',
    timestamp,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  const secretDate = hmac256(date, 'TC3' + secretKey)
  const secretService = hmac256(TTS_SERVICE, secretDate)
  const secretSigning = hmac256('tc3_request', secretService)
  const signature = hmac256(stringToSign, secretSigning, 'hex')

  return `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

function requestTextToVoice({ text, sessionId, secretId, secretKey }) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000)
    const payload = JSON.stringify({
      Text: text,
      SessionId: sessionId,
      Volume: 0,
      Speed: 0,
      SampleRate: 16000,
      Codec: 'mp3',
      PrimaryLanguage: 1,
    })

    const authorization = buildAuthorization({ secretId, secretKey, payload, timestamp })

    const options = {
      hostname: TTS_HOST,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Host: TTS_HOST,
        'X-TC-Action': TTS_ACTION,
        'X-TC-Version': TTS_VERSION,
        'X-TC-Timestamp': String(timestamp),
        'X-TC-Region': TTS_REGION,
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
            reject(new Error(json.Response.Error.Message || '腾讯云 TTS 调用失败'))
            return
          }
          resolve(json.Response)
        } catch (e) {
          reject(new Error('解析腾讯云 TTS 响应失败: ' + e.message))
        }
      })
    })

    req.on('error', (e) => reject(new Error('腾讯云 TTS 请求错误: ' + e.message)))
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('腾讯云 TTS 请求超时'))
    })

    req.write(payload)
    req.end()
  })
}

function splitText(text) {
  const chunks = []
  for (let i = 0; i < text.length; i += TEXT_CHUNK_SIZE) {
    chunks.push(text.slice(i, i + TEXT_CHUNK_SIZE))
  }
  return chunks
}

function generateSessionId() {
  return 'tts-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

exports.main = async (event, context) => {
  const { text } = event

  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  if (!OPENID) {
    return { code: -1, msg: '无法获取用户身份', data: null }
  }

  if (!text || !String(text).trim()) {
    return { code: -1, msg: '朗读文本不能为空', data: null }
  }

  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY
  if (!secretId || !secretKey) {
    console.error('[tts] 缺少 TENCENT_SECRET_ID / TENCENT_SECRET_KEY 环境变量，请在云开发控制台配置')
    return { code: -1, msg: 'TTS 服务未配置密钥', data: null }
  }

  try {
    const chunks = splitText(String(text).trim())
    const audioList = []

    // 依次合成各分段（腾讯云 TextToVoice 单次请求限制中文最长150字）
    for (const chunk of chunks) {
      const resp = await requestTextToVoice({
        text: chunk,
        sessionId: generateSessionId(),
        secretId,
        secretKey,
      })
      if (!resp || !resp.Audio) {
        throw new Error('腾讯云 TTS 未返回音频数据')
      }
      audioList.push(resp.Audio)
    }

    return {
      code: 0,
      msg: '',
      data: {
        audioList, // base64 编码的 mp3 音频分段数组，前端按序播放
        codec: 'mp3',
      },
    }
  } catch (error) {
    console.error('[tts] 调用失败:', error)
    return {
      code: -1,
      msg: error.message || 'TTS 服务暂时不可用',
      data: null,
    }
  }
}
