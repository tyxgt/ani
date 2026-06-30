import type { DouyinUserInfo, CloudFunctionResult, LoginData } from '../types'
import { TOKEN_KEY, USER_INFO_KEY, LOGIN_CLOUD_FUNCTION, ERROR_CODE } from '../constants'
import { callFunction } from './cloud'

class AuthManager {
  private _token: string = ''
  private _userInfo: DouyinUserInfo | null = null
  private _loginPromise: Promise<DouyinUserInfo | null> | null = null

  constructor() {
    this._token = uni.getStorageSync(TOKEN_KEY) || ''
    this._userInfo = uni.getStorageSync(USER_INFO_KEY) || null
  }

  isLoggedIn(): boolean {
    return !!this._token
  }

  getToken(): string {
    return this._token
  }

  getUserInfo(): DouyinUserInfo | null {
    return this._userInfo
  }

  async silentLogin(): Promise<DouyinUserInfo | null> {
    if (this.isLoggedIn()) {
      return this._userInfo
    }
    return this._doLogin(false)
  }

  async login(): Promise<DouyinUserInfo | null> {
    return this._doLogin(true)
  }

  private async _doLogin(force: boolean): Promise<DouyinUserInfo | null> {
    if (this._loginPromise) {
      return this._loginPromise
    }

    this._loginPromise = this._executeLogin(force).finally(() => {
      this._loginPromise = null
    })

    return this._loginPromise
  }

  private async _executeLogin(force: boolean): Promise<DouyinUserInfo | null> {
    // #ifdef MP-TOUTIAO
    try {
      const code = await this._ttLogin(force)
      if (!code) {
        return null
      }

      const result = await callFunction(LOGIN_CLOUD_FUNCTION, {
        action: 'loginByCode',
        code,
      })

      if (result.errCode === ERROR_CODE.SUCCESS && result.data) {
        const loginData = result.data as LoginData
        this._token = loginData.token
        this._userInfo = loginData.user
        this._saveToStorage()
        return this._userInfo
      } else {
        console.error('登录失败:', result.errMsg)
        return null
      }
    } catch (error) {
      console.error('登录失败:', error)
      return null
    }
    // #endif

    // #ifndef MP-TOUTIAO
    console.log('当前平台不支持抖音登录')
    return null
    // #endif
  }

  // #ifdef MP-TOUTIAO
  private _ttLogin(force: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
      tt.login({
        force,
        success: (res: any) => {
          if (res.isLogin && res.code) {
            resolve(res.code)
          } else {
            reject(new Error('用户未登录抖音'))
          }
        },
        fail: (err: any) => {
          reject(err)
        },
      })
    })
  }
  // #endif

  async updateProfile(encryptedData: string, iv: string): Promise<DouyinUserInfo | null> {
    if (!this._token) {
      throw new Error('请先登录')
    }

    const result = await callFunction(LOGIN_CLOUD_FUNCTION, {
      action: 'updateProfile',
      token: this._token,
      encryptedData,
      iv,
    })

    if (result.errCode === ERROR_CODE.UNAUTHORIZED) {
      this.logout()
      throw new Error('登录已过期，请重新登录')
    }

    if (result.errCode === ERROR_CODE.SUCCESS && result.data) {
      this._userInfo = (result.data as any).user
      this._saveToStorage()
      return this._userInfo
    }

    throw new Error(result.errMsg || '更新用户信息失败')
  }

  async bindPhone(phoneCode: string): Promise<DouyinUserInfo | null> {
    if (!this._token) {
      throw new Error('请先登录')
    }

    const result = await callFunction(LOGIN_CLOUD_FUNCTION, {
      action: 'bindPhone',
      token: this._token,
      phoneCode,
    })

    if (result.errCode === ERROR_CODE.UNAUTHORIZED) {
      this.logout()
      throw new Error('登录已过期，请重新登录')
    }

    if (result.errCode === ERROR_CODE.SUCCESS && result.data) {
      this._userInfo = (result.data as any).user
      this._saveToStorage()
      return this._userInfo
    }

    throw new Error(result.errMsg || '绑定手机号失败')
  }

  logout(): void {
    this._token = ''
    this._userInfo = null
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_INFO_KEY)
  }

  private _saveToStorage(): void {
    if (this._token) {
      uni.setStorageSync(TOKEN_KEY, this._token)
    }
    if (this._userInfo) {
      uni.setStorageSync(USER_INFO_KEY, this._userInfo)
    }
  }
}

export const authManager = new AuthManager()
