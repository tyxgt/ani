const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { name } = event

    if (!name) {
      return {
        code: -1,
        msg: '参数错误：缺少 name',
        data: null,
      }
    }

    const result = await db.collection('animal')
      .where({ name })
      .get()

    if (result.data.length === 0) {
      return {
        code: -1,
        msg: '未找到该动物',
        data: null,
      }
    }

    return {
      code: 0,
      msg: '',
      data: result.data[0],
    }
  } catch (err) {
    return {
      code: -1,
      msg: err.message,
      data: null,
    }
  }
}
