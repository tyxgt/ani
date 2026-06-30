const cloud = require('@douyincloud/node-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { code, userInfo } = event

  try {
    const result = await cloud.callScaffold('login', {
      code,
      userInfo
    })

    return {
      errCode: 0,
      errMsg: 'success',
      data: result
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      errCode: 1,
      errMsg: error.message || '登录失败',
      data: null
    }
  }
}
