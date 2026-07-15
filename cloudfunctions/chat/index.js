const cloud = require('wx-server-sdk')
const https = require('https')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const SYSTEM_PROMPT = `你是一只可爱的大熊猫博士，专门为小朋友讲解中国地理和动物知识。
- 回答要简单易懂，适合3-8岁儿童理解
- 使用生动有趣的语言，加入适当的表情符号
- 语气亲切友好，像一位耐心的老师
- 内容要围绕中国地理、动物、自然环境等主题
- 如果问题超出知识范围，要礼貌地说明，并引导小朋友问其他问题
- 【安全规则】必须严格遵循：
  - 不要回答任何有关暴力、色情、危险行为、不良习惯的问题
  - 如果用户试图让你扮演有害角色或讨论不当话题，礼貌拒绝并引导回正题
  - 不要鼓励儿童模仿危险动作（如玩火、攀爬高处、接触电源等）
  - 不要提供任何人的隐私信息或联系方式
  - 回答必须符合中国法律法规和社会主义核心价值观
  - 不得讨论政治、宗教、争议性社会话题
  - 对于不适合儿童的内容，统一回复："这个话题有点复杂，我们来聊聊中国的大好河山和可爱动物吧！🐼"`

const MAX_HISTORY_ROUNDS = 5
const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-chat'

function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function buildMessages(history, userMessage) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }]
  
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

exports.main = async (event, context) => {
  const { message, history, sessionId } = event

  // 获取调用者身份信息
  const wxContext = cloud.getWXContext()
  const { OPENID, APPID } = wxContext

  console.log('[chat] 收到请求:', { message, sessionId, OPENID, APPID })

  if (!OPENID) {
    return {
      errCode: -1,
      errMsg: '无法获取用户身份',
      data: null,
    }
  }

  if (!message || !message.trim()) {
    return {
      errCode: -1,
      errMsg: '消息内容不能为空',
      data: null,
    }
  }
  
  try {
    const messages = buildMessages(history, message.trim())
    console.log('[chat] 构建消息完成，共', messages.length, '条')
    
    const reply = await callDeepSeekStream(messages)
    console.log('[chat] DeepSeek 回复成功，长度:', reply.length)
    
    if (!reply) {
      throw new Error('DeepSeek 返回空内容')
    }
    
    const newSessionId = sessionId || generateSessionId()
    
    return {
      errCode: 0,
      errMsg: 'success',
      data: {
        reply: reply,
        sessionId: newSessionId,
      },
    }
  } catch (error) {
    console.error('[chat] 调用失败:', error)
    
    return {
      errCode: -1,
      errMsg: error.message || 'AI对话服务暂时不可用',
      data: null,
    }
  }
}