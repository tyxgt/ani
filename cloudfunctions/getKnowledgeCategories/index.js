const cloud = require('wx-server-sdk')
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

exports.main = async (event, context) => {
  const payload = verifyToken(event.token)
  if (!payload) {
    return { code: 401, msg: '未登录或登录已过期', data: null }
  }

  try {
    const categories = [
      {
        id: 1,
        name: '地形',
        icon: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/learn/icon_terrain.png',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
      },
      {
        id: 2,
        name: '气候',
        icon: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/learn/icon_climate.png',
        color: '#42A5F5',
        bgColor: '#E3F2FD',
      },
      {
        id: 3,
        name: '动物',
        icon: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/learn/icon_animal.png',
        color: '#FF9800',
        bgColor: '#FFF3E0',
      },
    ]

    return {
      code: 0,
      msg: '',
      data: categories,
    }
  } catch (err) {
    return {
      code: -1,
      msg: err.message,
      data: null,
    }
  }
}
