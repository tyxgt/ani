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

exports.main = async (event, context) => {
  const payload = verifyToken(event.token)
  if (!payload) {
    return { code: 401, msg: '未登录或登录已过期', data: null }
  }

  try {
    const result = await db.collection('animal')
      .orderBy('id', 'asc')
      .get()

    return {
      code: 0,
      msg: '',
      data: result.data,
    }
  } catch (err) {
    return {
      code: -1,
      msg: err.message,
      data: null,
    }
  }
}
