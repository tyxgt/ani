const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

exports.main = async (event, context) => {
  try {
    const categories = [
      { id: 1, name: '地形', icon: '🏔️', color: '#4CAF50', bgColor: '#E8F5E9' },
      { id: 2, name: '气候', icon: '🌤️', color: '#42A5F5', bgColor: '#E3F2FD' },
      { id: 3, name: '动物', icon: '🦊', color: '#FF9800', bgColor: '#FFF3E0' },
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
