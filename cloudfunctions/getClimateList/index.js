const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const result = await db.collection('climate')
      .orderBy('id', 'asc')
      .get()

    return {
      errCode: 0,
      errMsg: 'success',
      data: result.data,
    }
  } catch (err) {
    return {
      errCode: -1,
      errMsg: err.message,
      data: null,
    }
  }
}
