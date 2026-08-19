const cloud = require('wx-server-sdk')
const jwt = require('jsonwebtoken')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

const TOKEN_EXPIRES_IN = 7 * 24 * 3600

// 生产环境必须在云开发控制台为本函数配置 JWT_SECRET 环境变量；
// 未配置时使用固定兜底值仅方便本地联调，不能用于线上。
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-please-set-JWT_SECRET'

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
}

// 生成 6 位数字识别码，用于用户线下向管理员报身份、管理员在数据库里定位记录
function generateUserCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function isVipActive(user) {
  return !!(user && user.vipExpireAt && user.vipExpireAt > Date.now())
}

// 确保 user 集合里存在该 openid 的记录，不存在则创建（生成识别码），
// 存在则只刷新 updatedAt / 补齐 unionid。返回最新的用户记录。
async function upsertUser(openid, unionid) {
  const existing = await db.collection('user').where({ openid }).get()

  if (existing.data && existing.data.length > 0) {
    const user = existing.data[0]
    const patch = { updatedAt: db.serverDate() }
    if (unionid && !user.unionid) {
      patch.unionid = unionid
    }
    await db.collection('user').doc(user._id).update({ data: patch })
    return { ...user, ...patch }
  }

  // 生成识别码，极小概率冲突时重试几次
  let userCode = generateUserCode()
  for (let i = 0; i < 5; i++) {
    const dup = await db.collection('user').where({ userCode }).get()
    if (!dup.data || dup.data.length === 0) break
    userCode = generateUserCode()
  }

  const newUser = {
    openid,
    unionid: unionid || null,
    userCode,
    vipExpireAt: null,
    vipType: null,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate(),
  }
  await db.collection('user').add({ data: newUser })
  return newUser
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

  // 会员信息的读写失败不应该阻断登录本身：数据库异常时按"非会员"兜底，
  // 用户仍然可以正常登录使用免费功能，只是会员态暂时判定为未开通。
  let userCode = null
  let isVip = false
  let vipExpireAt = null
  let vipType = null
  try {
    const user = await upsertUser(OPENID, UNIONID)
    userCode = user.userCode
    vipExpireAt = user.vipExpireAt || null
    vipType = user.vipType || null
    isVip = isVipActive(user)
  } catch (err) {
    console.error('[login] upsertUser 失败:', err)
  }

  const response = {
    code: 0,
    msg: '',
    data: {
      token,
      openid: OPENID,
      unionid: UNIONID,
      expiresAt,
      userCode,
      isVip,
      vipExpireAt,
      vipType,
    },
  }

  console.log('[login] 返回响应:', JSON.stringify(response))

  return response
}
