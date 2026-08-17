import type { CloudFunctionResult } from '../types'
import { ERROR_CODE, CLOUD_ENV, CLOUD_SERVICE_ID, CLOUD_FUNCTION_PATH, WX_CLOUD_ENV, TOKEN_KEY } from '../constants'
import { authManager } from './auth'
import { useUserStore } from '../stores/user'

let cloudInstance: any = null
let wxCloudInitialized = false

function normalizeCloudResponse(rawData: any, res: any, functionName?: string): CloudFunctionResult {
  if (!rawData) {
    return {
      code: ERROR_CODE.GENERAL_ERROR,
      msg: '响应数据为空',
      data: null,
    }
  }

  // ─── 标准 code/msg 格式（改造后云函数返回） ───────────────────
  if (typeof rawData === 'object' && 'code' in rawData && 'msg' in rawData) {
    if (rawData.data !== undefined) {
      return rawData as CloudFunctionResult
    }
    return {
      code: rawData.code,
      msg: rawData.msg,
      data: rawData.result || rawData.data || null,
    }
  }

  // ─── 兼容旧 errCode/errMsg 格式（未部署的旧版云函数） ──────────
  if (typeof rawData === 'object' && 'errCode' in rawData && 'errMsg' in rawData) {
    return {
      code: rawData.errCode,
      msg: rawData.errMsg,
      data: rawData.data || rawData.result || null,
    }
  }

  // ─── 内层 result 携带标准格式 ──────────────────────────────────
  if (typeof rawData === 'object' && rawData.result && typeof rawData.result === 'object') {
    const inner = rawData.result
    if ('code' in inner) {
      return {
        code: inner.code,
        msg: inner.msg || '',
        data: inner.data || null,
      }
    }
    if ('errCode' in inner) {
      return {
        code: inner.errCode,
        msg: inner.errMsg || '',
        data: inner.data || null,
      }
    }
    return {
      code: ERROR_CODE.SUCCESS,
      msg: '',
      data: inner,
    }
  }

  // ─── 登录函数专用检测（仅对 login 函数启用） ──────────────────
  if (functionName === 'login') {
    if (typeof rawData === 'object' && rawData.userInfo && rawData.userInfo.openId) {
      return {
        code: ERROR_CODE.SUCCESS,
        msg: '',
        data: {
          openid: rawData.userInfo.openId,
          appid: rawData.userInfo.appId,
          unionid: rawData.userInfo.unionId || null,
        },
      }
    }

    if (typeof rawData === 'object' && (rawData.openId || rawData.openid)) {
      return {
        code: ERROR_CODE.SUCCESS,
        msg: '',
        data: {
          openid: rawData.openId || rawData.openid,
          appid: rawData.appId || rawData.appid || null,
          unionid: rawData.unionId || rawData.unionid || null,
        },
      }
    }
  }

  // ─── 根据 HTTP 状态码兜底 ─────────────────────────────────────
  if (res && res.statusCode === 200) {
    return {
      code: ERROR_CODE.SUCCESS,
      msg: '',
      data: rawData,
    }
  }

  return {
    code: ERROR_CODE.GENERAL_ERROR,
    msg: '未知响应格式',
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

  // #ifdef MP-WEIXIN
  if (wxCloudInitialized) return
  try {
    wx.cloud.init({
      env: WX_CLOUD_ENV,
      traceUser: true,
    })
    wxCloudInitialized = true
    console.log('[Cloud] 微信云服务初始化成功')
  } catch (error) {
    console.error('[Cloud] 微信云服务初始化失败:', error)
    console.warn('[Cloud] 请确保已在微信开发者工具中配置云环境，WX_CLOUD_ENV 不能为空')
  }
  // #endif
}

// 使用任何功能前都需要登录：除 login 自身外，所有云函数调用统一注入本地保存的
// token，由各云函数校验；调用方不需要在每个调用点手动传 token。
function withToken(name: string, data: Record<string, any>): Record<string, any> {
  if (name === 'login') return data
  return { ...data, token: uni.getStorageSync(TOKEN_KEY) || '' }
}

async function callFunctionRaw(
  name: string,
  rawData: Record<string, any> = {}
): Promise<CloudFunctionResult> {
  const data = withToken(name, rawData)
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
            console.log(`[Cloud] 云函数 [${name}] 原始数据字段:`, typeof rawData === 'object' ? Object.keys(rawData) : typeof rawData)

            let result = normalizeCloudResponse(rawData, res, name)

            console.log(`[Cloud] 云函数 [${name}] 标准化后响应:`, result)

            if (result.code === -1 && !result.data && result.msg === 'success') {
              console.warn(
                `[Cloud] ⚠️  检测到异常响应：code=-1 但 msg=success。` +
                `这通常意味着请求没有到达预期的服务端处理逻辑。` +
                `请检查云托管服务是否已正确部署，以及部署的代码版本是否正确。`
              )
            }

            if (result.code === -2) {
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
      code: ERROR_CODE.GENERAL_ERROR,
      msg: (error as Error).message || '网络请求失败',
      data: null,
    }
  }
  // #endif

  // #ifdef MP-WEIXIN
  try {
    if (!wxCloudInitialized) {
      initCloud()
    }

    console.log(`[Cloud] 调用微信云函数 [${name}]:`, data)

    const res = await wx.cloud.callFunction({
      name,
      data,
    })

    console.log(`[Cloud] 微信云函数 [${name}] 响应:`, res)

    let rawData = res.result || res
    if (typeof rawData === 'string') {
      try {
        rawData = JSON.parse(rawData)
      } catch (e) {
        console.log(`[Cloud] 微信云函数 [${name}] res.result JSON解析失败，按纯文本处理`)
      }
    }

    // 调试：打印原始数据字段名，便于定位响应格式问题
    console.log(`[Cloud] 微信云函数 [${name}] 原始数据类型:`, typeof rawData)
    if (typeof rawData === 'object') {
      console.log(`[Cloud] 微信云函数 [${name}] 原始数据字段:`, Object.keys(rawData))
    }

    let result = normalizeCloudResponse(rawData, res, name)

    console.log(`[Cloud] 微信云函数 [${name}] 标准化后响应:`, result)

    return result as CloudFunctionResult
  } catch (error) {
    console.error(`云函数调用失败 [${name}]:`, error)
    return {
      code: ERROR_CODE.GENERAL_ERROR,
      msg: (error as Error).message || '网络请求失败',
      data: null,
    }
  }
  // #endif

  // #ifndef MP-TOUTIAO
  // #ifndef MP-WEIXIN
  return {
    code: ERROR_CODE.GENERAL_ERROR,
    msg: '当前平台不支持云函数',
    data: null,
  }
  // #endif
  // #endif
}

/**
 * 统一云函数调用入口：自动注入 token（见 withToken），并在服务端返回 401
 * （未登录/登录已过期）时自动触发登录自愈——清空本地登录态、把 Pinia 的
 * authReady/isLoggedIn 打回"登录中"，并重新静默登录。页面侧的 AuthGate
 * 组件会因为 store 状态变化自动重新展示 loading，登录成功后自动恢复，
 * 调用方不需要额外处理 401。
 */
export async function callFunction(
  name: string,
  data: Record<string, any> = {}
): Promise<CloudFunctionResult> {
  const result = await callFunctionRaw(name, data)
  if (name !== 'login') {
    handleCloudError(result)
  }
  return result
}

export function handleCloudError(result: CloudFunctionResult): boolean {
  if (result.code === ERROR_CODE.UNAUTHORIZED) {
    console.warn('[Cloud] 收到 401，登录已过期，提示用户手动重新登录')
    authManager.logout()
    const userStore = useUserStore()
    // 清登录态后同步 Pinia 为未登录，但 authReady 保持 true，
    // 让 AuthGate 显示"请先登录"弹窗，而不是"登录中..."loading。
    // 不自动调 silentLogin，交给用户手动登录。
    userStore.refreshState()
    uni.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none',
    })
    return true
  }
  return false
}
