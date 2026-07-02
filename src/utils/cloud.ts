import type { CloudFunctionResult } from '../types'
import { ERROR_CODE, CLOUD_ENV, CLOUD_SERVICE_ID, CLOUD_FUNCTION_PATH } from '../constants'

let cloudInstance: any = null

function normalizeCloudResponse(rawData: any, res: any): CloudFunctionResult {
  if (!rawData) {
    return {
      errCode: ERROR_CODE.GENERAL_ERROR,
      errMsg: '响应数据为空',
      data: null,
    }
  }

  if (typeof rawData === 'object' && 'errCode' in rawData && 'errMsg' in rawData) {
    if (rawData.data !== undefined) {
      return rawData as CloudFunctionResult
    }
    return {
      errCode: rawData.errCode,
      errMsg: rawData.errMsg,
      data: rawData.result || rawData.data || null,
    }
  }

  if (typeof rawData === 'object' && typeof rawData.code === 'number' && !('errCode' in rawData)) {
    return {
      errCode: rawData.code,
      errMsg: rawData.msg || '',
      data: rawData.data || null,
    }
  }

  if (typeof rawData === 'object' && rawData.result && typeof rawData.result === 'object') {
    const inner = rawData.result
    if ('errCode' in inner) {
      return {
        errCode: inner.errCode,
        errMsg: inner.errMsg || '',
        data: inner.data || null,
      }
    }
    return {
      errCode: ERROR_CODE.SUCCESS,
      errMsg: 'success',
      data: inner,
    }
  }

  if (res && res.statusCode === 200) {
    return {
      errCode: ERROR_CODE.SUCCESS,
      errMsg: 'success',
      data: rawData,
    }
  }

  return {
    errCode: ERROR_CODE.GENERAL_ERROR,
    errMsg: '未知响应格式',
    data: rawData,
  }
}

export function initCloud(): void {
  // #ifdef MP-TOUTIAO
  if (cloudInstance) return
  try {
    cloudInstance = tt.createCloud({
      envID: CLOUD_ENV,
      serviceID: CLOUD_SERVICE_ID,
    })
    console.log('[Cloud] 云服务初始化成功')
  } catch (error) {
    console.error('[Cloud] 云服务初始化失败:', error)
  }
  // #endif
}

export async function callFunction(
  name: string,
  data: Record<string, any> = {}
): Promise<CloudFunctionResult> {
  // #ifdef MP-TOUTIAO
  try {
    if (!cloudInstance) {
      initCloud()
    }
    if (!cloudInstance) {
      throw new Error('云服务未初始化')
    }

    console.log(`[Cloud] 调用云函数 [${name}]:`, data)

    return await new Promise<CloudFunctionResult>((resolve, reject) => {
      cloudInstance.callContainer({
        path: CLOUD_FUNCTION_PATH,
        init: {
          method: 'POST',
          header: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(data),
          timeout: 60000,
        },
        success: (res: any) => {
          try {
            console.log(`[Cloud] 云函数 [${name}] 完整响应:`, res)
            console.log(`[Cloud] 云函数 [${name}] res.statusCode:`, res.statusCode)
            console.log(`[Cloud] 云函数 [${name}] res.header:`, res.header)
            console.log(`[Cloud] 云函数 [${name}] res.data 类型:`, typeof res.data)
            console.log(`[Cloud] 云函数 [${name}] res.data 内容:`, res.data)

            let rawData = res.data
            if (typeof rawData === 'string') {
              try {
                rawData = JSON.parse(rawData)
              } catch (e) {
                console.log(`[Cloud] 云函数 [${name}] res.data JSON解析失败，按纯文本处理`)
              }
            }

            console.log(`[Cloud] 云函数 [${name}] 解析后原始数据:`, rawData)

            let result = normalizeCloudResponse(rawData, res)

            console.log(`[Cloud] 云函数 [${name}] 标准化后响应:`, result)

            if (result.errCode === -1 && !result.data && result.errMsg === 'success') {
              console.warn(
                `[Cloud] ⚠️  检测到异常响应：errCode=-1 但 errMsg=success。` +
                `这通常意味着请求没有到达预期的服务端处理逻辑。` +
                `请检查云托管服务是否已正确部署，以及部署的代码版本是否正确。`
              )
            }

            if (result.errCode === -2) {
              console.warn(
                `[Cloud] ⚠️  服务端返回 404 路由未匹配。` +
                `请检查请求路径配置 (CLOUD_FUNCTION_PATH) 是否正确。`
              )
            }

            resolve(result as CloudFunctionResult)
          } catch (parseError) {
            console.error(`[Cloud] 云函数 [${name}] 响应解析失败:`, parseError)
            reject(new Error('响应数据解析失败'))
          }
        },
        fail: (err: any) => {
          console.error(`[Cloud] 云函数 [${name}] 调用失败:`, err)
          reject(err)
        },
      })
    })
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
