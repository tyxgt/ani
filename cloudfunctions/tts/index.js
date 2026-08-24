const cloud = require('wx-server-sdk')
const https = require('https')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()
const _ = db.command

function verifyToken(token) {
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-only-insecure-secret-please-set-JWT_SECRET')
  } catch (e) {
    return null
  }
}

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

const TTS_STREAM_TTL_MS = 5 * 60 * 1000 // 只是"播放窗口"用的临时记录，几分钟够覆盖一次朗读，配合 TTL 索引自动清理

// 分片流式推送：合成完一段就往数据库记录里追加一段，前端 watch() 到新增的
// 分段就能立刻播放，不用等全部分段合成完。streamId 为空（前端未传，或非
// 小程序平台不支持数据库实时推送）时整个对象退化成空操作，exports.main 的
// 行为跟改造前完全一致。
// 每段音频是独立的播放单元，跟文本增量不一样不能"只看最新值覆盖"——用
// db.command.push 原子追加到 chunks 数组，前端按数组长度 diff 消费，哪怕
// 中间某次 onChange 推送被合并/跳过也不会漏播某一段。
function createTtsStreamWriter(streamId, openid) {
  if (!streamId) {
    return { pushChunk: async () => {}, markDone: async () => {}, markError: async () => {} }
  }

  let created = false

  async function ensureCreated(totalChunks) {
    if (created) return
    created = true
    try {
      await db.collection('ttsStream').add({
        data: {
          _id: streamId,
          openid,
          chunks: [],
          totalChunks,
          codec: 'mp3',
          status: 'streaming',
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
          expireAt: new Date(Date.now() + TTS_STREAM_TTL_MS),
        },
      })
    } catch (e) {
      console.warn('[tts] ttsStream 创建失败:', e)
    }
  }

  async function pushChunk(chunkBase64, totalChunks) {
    await ensureCreated(totalChunks)
    try {
      await db.collection('ttsStream').doc(streamId).update({
        data: { chunks: _.push([chunkBase64]), updatedAt: db.serverDate() },
      })
    } catch (e) {
      console.warn('[tts] ttsStream 追加分段失败:', e)
    }
  }

  async function markDone() {
    if (!created) return
    try {
      await db.collection('ttsStream').doc(streamId).update({
        data: { status: 'done', updatedAt: db.serverDate() },
      })
    } catch (e) {
      console.warn('[tts] ttsStream 收尾失败:', e)
    }
  }

  async function markError() {
    // 记录从未建过（比如失败发生在登录校验阶段）说明前端压根没开始 watch，
    // 不需要补写任何状态。
    if (!created) return
    try {
      await db.collection('ttsStream').doc(streamId).update({
        data: { status: 'error', updatedAt: db.serverDate() },
      })
    } catch (e) {
      console.warn('[tts] ttsStream 置错失败:', e)
    }
  }

  return { pushChunk, markDone, markError }
}

exports.main = async (event, context) => {
  const { text, streamId } = event

  const payload = verifyToken(event.token)
  if (!payload) {
    return { code: 401, msg: '未登录或登录已过期', data: null }
  }

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

  // 声明在 try 外层，好让 catch 块也能拿到它去标记 ttsStream 记录为 error；
  // 这里创建的只是一个还没真正写库的空壳（真正的 add() 延迟到第一次
  // pushChunk 才发生），markError 内部会判断 created 直接跳过未创建的记录。
  const streamWriter = createTtsStreamWriter(streamId, OPENID)

  try {
    const chunks = splitText(String(text).trim())
    const audioList = []

    // 依次合成各分段（腾讯云 TextToVoice 单次请求限制中文最长150字），
    // 每合成完一段就推一段给 streamWriter，前端不用等全部分段都合成完。
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
      await streamWriter.pushChunk(resp.Audio, chunks.length)
    }

    await streamWriter.markDone()

    return {
      code: 0,
      msg: '',
      data: {
        audioList, // base64 编码的 mp3 音频分段数组，流式链路失效时的完整兜底
        codec: 'mp3',
      },
    }
  } catch (error) {
    console.error('[tts] 调用失败:', error)
    await streamWriter.markError()
    return {
      code: -1,
      msg: error.message || 'TTS 服务暂时不可用',
      data: null,
    }
  }
}
