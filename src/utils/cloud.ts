import type { CloudFunctionResult } from '../types'
import { ERROR_CODE } from '../constants'

export async function callFunction(
  name: string,
  data: Record<string, any> = {}
): Promise<CloudFunctionResult> {
  // #ifdef MP-TOUTIAO
  try {
    const result = await tt.cloud.callFunction({
      name,
      data,
    })
    return result.result as CloudFunctionResult
  } catch (error) {
    console.error(`云函数调用失败 [${name}]:`, error)
    return {
      errCode: ERROR_CODE.GENERAL_ERROR,
      errMsg: (error as Error).message || '网络请求失败',
      data: null,
    }
  }
  // #endif

  // #ifndef MP-TOUTIAO
  return {
    errCode: ERROR_CODE.GENERAL_ERROR,
    errMsg: '当前平台不支持云函数',
    data: null,
  }
  // #endif
}

export function handleCloudError(result: CloudFunctionResult): boolean {
  if (result.errCode === ERROR_CODE.UNAUTHORIZED) {
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none',
    })
    return true
  }
  return false
}
