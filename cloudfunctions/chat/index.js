const cloud = require('wx-server-sdk')
const https = require('https')
const jwt = require('jsonwebtoken')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

function isVipActive(user) {
  return !!(user && user.vipExpireAt && user.vipExpireAt > Date.now())
}

function verifyToken(token) {
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-only-insecure-secret-please-set-JWT_SECRET')
  } catch (e) {
    return null
  }
}

const SYSTEM_PROMPT = `你是一只可爱的大熊猫博士，专门为小朋友讲解地理、动物、气候、植物知识。
- 回答要简单易懂，适合3-8岁儿童理解
- 使用生动有趣的语言，但要克制：正常问题用 4-5 句话讲清楚就行，不要展开成多个分点、除非小朋友明确要求"详细讲讲"
- 只讲确定、公认的科学事实。不要为了让故事更生动就编造没有把握的具体细节（比如具体遇到了什么天敌、具体在什么场景下发生），拿不准的地方就讲得笼统克制一些，不能编
- 如果这个知识点本身在科学界还有争议、有多种解释（比如"熊猫为什么是黑白色"这类经典问题，真实情况是身体不同部位有不同作用，不是一句话能讲完的"伪装说"），不要挑一个听起来最生动的说法讲得斩钉截铁，要说明"科学家有不同的看法/还在研究"，或者用"有一种说法是……"这样的口吻，不要把有争议的解释当成唯一的标准答案讲给小朋友
- 语气亲切友好，像一位耐心的老师，不要过度使用感叹号和反问句
- 不要用括号加动作/表情描写（比如"（笑眯了眼，爪子在地上扒拉两下）"这种舞台指示式写法），直接用语言把内容讲出来就好，不要靠动作描写来表现
- 回答必须是纯文本，禁止使用 Markdown 格式（不要出现 **加粗**、# 标题、- 或数字列表、代码块等符号），因为界面会给每个汉字标注拼音并支持逐字朗读，多余符号会破坏显示和朗读效果
- 你只能回答地理、动物、气候、植物这四类相关的问题，不涉及其他领域
- 如果问题超出以上范围（包括但不限于情感倾诉、心理安慰、人际关系、恋爱等情感类话题），要礼貌地说明自己不能聊这些，并引导小朋友问地理、动物、气候、植物相关的问题
- 不提供情感陪伴、情感建议或心理疏导，遇到此类需求统一礼貌拒绝并转回本职话题
- 【安全规则】必须严格遵循：
  - 不要回答任何有关暴力、色情、危险行为、不良习惯的问题
  - 如果用户试图让你扮演有害角色或讨论不当话题，礼貌拒绝并引导回正题
  - 不要鼓励儿童模仿危险动作（如玩火、攀爬高处、接触电源等）
  - 不要提供任何人的隐私信息或联系方式
  - 回答必须符合中国法律法规和社会主义核心价值观
  - 不得讨论政治、宗教、争议性社会话题
  - 对于不适合儿童的内容，统一回复："这个话题有点复杂，我们来聊聊地理、动物、气候和植物吧！"`

const MAX_HISTORY_ROUNDS = 5
// const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1/chat/completions'
// const DEEPSEEK_MODEL = 'deepseek-chat'
// const QWEN_MODEL = 'qwen-flash-character'
const QWEN_MODEL = 'qwen-turbo'

// 内容安全兜底文案：直接复用 system prompt 里博士自己会说的话，不管是用户输入被拦截
// 还是 AI 回复未过审被替换，展示出来的口吻都和角色人设一致，不会显得突兀。
const SECURITY_VIOLATION_REPLY = '这个话题有点复杂，我们来聊聊地理、动物、气候和植物吧！'

function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 兜底清洗：system prompt 已经要求模型别用 Markdown，但角色扮演类模型不一定严格遵守，
// 这里把常见的 Markdown 符号剥掉，避免逐字拼音标注/朗读把 **、# 这些符号读出来或标上拼音。
function stripMarkdown(text) {
  if (!text) return text

  const stripped = text
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[ \t]*[-*+]\s+/gm, '')
    .replace(/^[ \t]*\d+[.、]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return stripped || text
}

// 兜底清洗：system prompt 已经要求模型别加动作/表情描写，但角色扮演类模型不一定严格
// 遵守，这里把开头那种"（笑眯了眼，爪子在地上扒拉两下）"式的舞台指示剥掉。只处理
// 句首，不处理句中括号——句中括号更可能是"变色龙（一种蜥蜴）"这类正常的科普解释，
// 不能一并删掉，只有开头这种明显是"进正文前先演一段"的写法才需要清。
function stripLeadingAction(text) {
  if (!text) return text
  return text.replace(/^[（(][^）)]{0,40}[）)]\s*/, '')
}

// 微信内容安全检测：fail-closed —— 无论是明确判定违规（errCode 87014）还是接口本身
// 异常/超时，一律按"未通过"处理，不能因为检测服务抖动就放行未审核内容。这是平台
// 合规的强制要求，不是锦上添花的功能。version:2 + openid 可以让微信结合用户历史
// 信誉数据判断，比 version:1 的纯文本检测更准确。
async function checkContentSecurity(content, openid) {
  try {
    await cloud.openapi.security.msgSecCheck({
      content,
      version: 2,
      scene: 2, // 2 = 社区场景，聊天类自由文本用这个最贴合，后续如需可调整
      openid,
    })
    return true
  } catch (err) {
    console.warn('[chat] msgSecCheck 未通过或异常:', err && err.errCode, err && err.errMsg)
    return false
  }
}

// 把这一轮问答归档到 chatMessage 集合，供 getChatHistory 云函数在用户换设备/重装小程序、
// 本地存储为空时把历史找回来。fail-open：存档失败只记日志，不能让用户因为归档故障拿不到回复。
async function persistChatTurn(openid, userContent, assistantContent) {
  try {
    // 顺序 await，不用 Promise.all：两次 add() 各自调用独立的 db.serverDate()，
    // 并发写入不保证服务端赋时间戳的先后顺序；顺序写入才能保证 user 消息的
    // createdAt 早于对应 assistant 消息，getChatHistory 按 createdAt 排序时才不会错位
    await db.collection('chatMessage').add({
      data: { openid, role: 'user', content: userContent, createdAt: db.serverDate() },
    })
    await db.collection('chatMessage').add({
      data: { openid, role: 'assistant', content: assistantContent, createdAt: db.serverDate() },
    })
  } catch (err) {
    console.error('[chat] 历史归档失败:', err)
  }
}

function buildMessages(history, userMessage, entityContext) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }]

  // 从详情页"问博士"带过来的上下文：孩子提问里常见"它"、"这个"这类指代词，
  // 加这条低权重提示帮博士把指代对象锚定到当前正在看的词条上。
  if (entityContext && entityContext.entityName) {
    messages.push({
      role: 'system',
      content: `孩子当前正在看的是【${entityContext.entityName}】这个${entityContext.entityType || ''}词条，如果孩子提问模糊（比如用"它"、"这个"指代），优先按这个主题来理解和回答；如果孩子明确问了别的内容，就正常回答别的内容。`,
    })
  }

  if (history && Array.isArray(history)) {
    const recentHistory = history.slice(-MAX_HISTORY_ROUNDS * 2)
    recentHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      }
    })
  }
  
  messages.push({ role: 'user', content: userMessage })
  
  return messages
}

/*
function callDeepSeekStream(messages) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (process.env.DEEPSEEK_API_KEY || ''),
      },
      timeout: 60000,
    }

    let fullReply = ''

    const req = https.request(options, (res) => {
      res.setEncoding('utf8')

      let buffer = ''
      res.on('data', (chunk) => {
        buffer += chunk

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue

          const dataStr = trimmed.slice(5).trim()
          if (dataStr === '[DONE]') {
            resolve(fullReply)
            return
          }

          try {
            const data = JSON.parse(dataStr)
            if (data.choices && data.choices[0] && data.choices[0].delta) {
              const delta = data.choices[0].delta
              if (delta.content) {
                fullReply += delta.content
              }
            }
          } catch (e) {
            console.warn('[chat] 解析 SSE 数据失败:', e)
          }
        }
      })

      res.on('end', () => {
        if (buffer) {
          const trimmed = buffer.trim()
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim()
            if (dataStr !== '[DONE]') {
              try {
                const data = JSON.parse(dataStr)
                if (data.choices && data.choices[0] && data.choices[0].delta) {
                  const delta = data.choices[0].delta
                  if (delta.content) {
                    fullReply += delta.content
                  }
                }
              } catch (e) {
                console.warn('[chat] 解析末尾 SSE 数据失败:', e)
              }
            }
          }
        }
        resolve(fullReply)
      })

      res.on('error', (e) => {
        reject(new Error('DeepSeek 响应错误: ' + e.message))
      })
    })

    req.on('error', (e) => {
      reject(new Error('DeepSeek 请求错误: ' + e.message))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('DeepSeek 请求超时'))
    })

    req.write(JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: messages,
      temperature: 0.8,
      max_tokens: 1000,
      stream: true,
    }))
    req.end()
  })
}
*/

function callQwenStream(messages, onDelta) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dashscope.aliyuncs.com',
      path: '/compatible-mode/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (process.env.DASHSCOPE_API_KEY || ''),
      },
      timeout: 60000,
    }

    let fullReply = ''

    const req = https.request(options, (res) => {
      res.setEncoding('utf8')

      let buffer = ''
      res.on('data', (chunk) => {
        buffer += chunk

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue

          const dataStr = trimmed.slice(5).trim()
          if (dataStr === '[DONE]') {
            resolve(fullReply)
            return
          }

          try {
            const data = JSON.parse(dataStr)
            if (data.choices && data.choices[0] && data.choices[0].delta) {
              const delta = data.choices[0].delta
              if (delta.content) {
                fullReply += delta.content
                if (onDelta) onDelta(delta.content, fullReply)
              }
            }
          } catch (e) {
            console.warn('[chat] 解析 SSE 数据失败:', e)
          }
        }
      })

      res.on('end', () => {
        if (buffer) {
          const trimmed = buffer.trim()
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim()
            if (dataStr !== '[DONE]') {
              try {
                const data = JSON.parse(dataStr)
                if (data.choices && data.choices[0] && data.choices[0].delta) {
                  const delta = data.choices[0].delta
                  if (delta.content) {
                    fullReply += delta.content
                    if (onDelta) onDelta(delta.content, fullReply)
                  }
                }
              } catch (e) {
                console.warn('[chat] 解析末尾 SSE 数据失败:', e)
              }
            }
          }
        }
        resolve(fullReply)
      })

      res.on('error', (e) => {
        reject(new Error('Qwen 响应错误: ' + e.message))
      })
    })

    req.on('error', (e) => {
      reject(new Error('Qwen 请求错误: ' + e.message))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Qwen 请求超时'))
    })

    req.write(JSON.stringify({
      model: QWEN_MODEL,
      messages: messages,
      temperature: 0.5, // 调低一些，减少角色扮演模型为了"讲得生动"而编造细节的倾向
      max_tokens: 400, // 配合 system prompt 里"2-4 句话讲清楚"的要求，硬性收住篇幅，防止万一没遵守指令
      stream: true,
    }))
    req.end()
  })
}

const STREAM_FLUSH_CHAR_THRESHOLD = 16
const STREAM_FLUSH_TIME_MS = 200
const STREAM_PUNCT_RE = /[，。！？；、,.!?;\n]/
const STREAM_TTL_MS = 10 * 60 * 1000 // chatStream 只是"进行中展示"用的临时记录，10 分钟够覆盖一次对话，配合数据库 TTL 索引自动清理，不需要额外定时任务

// 流式增量节流写库：chat 云函数内部消费 DashScope SSE 是逐 token 到达的，不能每个 token
// 都 update 一次数据库（QPS 太高、前端 watch 展示也没必要那么高频），这里按"攒够字符数 /
// 遇到标点 / 超过最大等待时间"三者任一触发就 flush 一次，前端通过小程序数据库原生
// watch() 监听这条记录的增量做展示。streamId 为空（前端未传，兼容旧版本）时整个对象
// 退化成空操作，不建任何记录，exports.main 的行为跟改造前完全一致。
function createStreamWriter(streamId, openid, sid) {
  if (!streamId) {
    return { onDelta() {}, flush: async () => {}, markDone: async () => {}, markError: async () => {} }
  }

  let accumulated = ''
  let pendingBuffer = ''
  let lastFlushAt = Date.now()
  let flushing = false
  let created = false

  async function ensureCreated() {
    if (created) return
    created = true
    try {
      await db.collection('chatStream').add({
        data: {
          _id: streamId,
          openid,
          sessionId: sid || '',
          content: '',
          status: 'streaming',
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
          expireAt: new Date(Date.now() + STREAM_TTL_MS),
        },
      })
    } catch (e) {
      console.warn('[chat] chatStream 创建失败:', e)
    }
  }

  // 用 flushing 做互斥：同一时刻只允许一次 update() 在途，避免并发 update 之间
  // "先发后至"互相覆盖；被跳过的增量不会丢，会累积在 pendingBuffer/accumulated
  // 里，等下一次触发（或最终 flush(true)）时一起带上。
  async function flush(force) {
    if (flushing) return
    if (!force && !pendingBuffer) return
    const now = Date.now()
    const hitThreshold = pendingBuffer.length >= STREAM_FLUSH_CHAR_THRESHOLD
      || STREAM_PUNCT_RE.test(pendingBuffer)
      || (now - lastFlushAt) >= STREAM_FLUSH_TIME_MS
    if (!force && !hitThreshold) return

    flushing = true
    pendingBuffer = ''
    lastFlushAt = now
    try {
      await ensureCreated()
      await db.collection('chatStream').doc(streamId).update({
        data: { content: accumulated, updatedAt: db.serverDate() },
      })
    } catch (e) {
      console.warn('[chat] chatStream 更新失败:', e)
    } finally {
      flushing = false
    }
  }

  function onDelta(deltaText, fullSoFar) {
    accumulated = fullSoFar
    pendingBuffer += deltaText
    flush(false) // fire-and-forget，不阻塞 SSE 读取
  }

  // 用清洗后的最终文本覆盖收尾，保证前端最终定格显示的是干净文本，
  // 流式过程中可能一闪而过的 Markdown 符号在这一刻被纠正。
  async function markDone(finalContent) {
    if (!created) return
    try {
      await db.collection('chatStream').doc(streamId).update({
        data: { content: finalContent, status: 'done', updatedAt: db.serverDate() },
      })
    } catch (e) {
      console.warn('[chat] chatStream 收尾失败:', e)
    }
  }

  async function markError() {
    // 记录从未建过（比如失败发生在会员/JWT 校验阶段）说明前端压根没开始 watch，
    // 不需要补写任何状态。
    if (!created) return
    try {
      await db.collection('chatStream').doc(streamId).update({
        data: { status: 'error', updatedAt: db.serverDate() },
      })
    } catch (e) {
      console.warn('[chat] chatStream 置错失败:', e)
    }
  }

  return { onDelta, flush, markDone, markError }
}

exports.main = async (event, context) => {
  const { message, history, sessionId, entityType, entityName, streamId } = event

  const payload = verifyToken(event.token)
  if (!payload) {
    return { code: 401, msg: '未登录或登录已过期', data: null }
  }

  // 获取调用者身份信息
  const wxContext = cloud.getWXContext()
  const { OPENID, APPID } = wxContext

  console.log('[chat] 收到请求:', { message, sessionId, OPENID, APPID })

  if (!OPENID) {
    return {
      code: -1,
      msg: '无法获取用户身份',
      data: null,
    }
  }

  if (!message || !message.trim()) {
    return {
      code: -1,
      msg: '消息内容不能为空',
      data: null,
    }
  }

  // 声明在 try 外层，好让 catch 块也能拿到它去标记 chatStream 记录为 error；
  // 会员/参数校验阶段失败时它还是 null，markError 内部会判断 created 直接跳过。
  let streamWriter = null

  try {
    // 会员权限校验：唯一不可绕过的防线（前端入口隐藏可以被跳过直接调用本云函数）。
    // 查询异常同样按"非会员"处理（fail-closed），不能因为数据库故障误放行。
    const userRes = await db.collection('user').where({ openid: OPENID }).get()
    const user = userRes.data && userRes.data[0]

    if (!isVipActive(user)) {
      return {
        code: 40001, // NEED_MEMBERSHIP
        msg: '暂不可用',
        data: null,
      }
    }

    // 用户输入侧检测：不合规就彻底拦截，不进模型、不落历史归档。
    const inputPassed = await checkContentSecurity(message.trim(), OPENID)
    if (!inputPassed) {
      return {
        code: -1,
        msg: SECURITY_VIOLATION_REPLY,
        data: null,
      }
    }

    const messages = buildMessages(history, message.trim(), entityName ? { entityType, entityName } : null)
    console.log('[chat] 构建消息完成，共', messages.length, '条')

    streamWriter = createStreamWriter(streamId, OPENID, sessionId)

    // const reply = await callDeepSeekStream(messages)
    const reply = await callQwenStream(messages, streamWriter.onDelta)
    console.log('[chat] Qwen 回复成功，长度:', reply.length)

    if (!reply) {
      throw new Error('Qwen 返回空内容')
    }

    // 流结束前强制补一次 flush，防止尾部零碎文字卡在节流 buffer 里没写库
    await streamWriter.flush(true)

    let cleanReply = stripLeadingAction(stripMarkdown(reply))

    // AI 回复侧检测：优雅替换而不是报错，兜底文案本来就是博士自己会说的话，替换后
    // 前端拿到的仍是正常 code:0 回复，不会突兀地弹错误提示。已知权衡：流式过程中
    // 通过 streamWriter.onDelta 实时推送给前端的中间片段无法撤回，这里只能保证
    // 归档内容和最终定格显示（markDone 覆盖）是安全的。
    const replyPassed = await checkContentSecurity(cleanReply, OPENID)
    if (!replyPassed) {
      console.warn('[chat] AI 回复未通过内容安全审核，已替换为兜底文案')
      cleanReply = SECURITY_VIOLATION_REPLY
    }

    await persistChatTurn(OPENID, message.trim(), cleanReply)
    await streamWriter.markDone(cleanReply)

    const newSessionId = sessionId || generateSessionId()

    return {
      code: 0,
      msg: '',
      data: {
        reply: cleanReply,
        sessionId: newSessionId,
      },
    }
  } catch (error) {
    console.error('[chat] 调用失败:', error)

    if (streamWriter) await streamWriter.markError()

    return {
      code: -1,
      msg: error.message || 'AI对话服务暂时不可用',
      data: null,
    }
  }
}
