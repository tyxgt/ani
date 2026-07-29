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
        errCode: -1,
        errMsg: '参数错误：缺少 name',
        data: null,
      }
    }

    const result = await db.collection('climate')
      .where({ name })
      .get()

    if (result.data.length === 0) {
      return {
        errCode: -1,
        errMsg: '未找到该气候',
        data: null,
      }
    }

    return {
      errCode: 0,
      errMsg: 'success',
      data: result.data[0],
    }
  } catch (err) {
    return {
      errCode: -1,
      errMsg: err.message,
      data: null,
    }
  }
}
