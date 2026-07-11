import type { DouyinUserInfo, LoginData } from '../types'
import { TOKEN_KEY, USER_INFO_KEY, EXPIRES_AT_KEY, LOGIN_CLOUD_FUNCTION } from '../constants'
import { callFunction } from './cloud'

class AuthManager {
  private _token: string = ''
  private _userInfo: DouyinUserInfo | null = null
  private _expiresAt: number = 0
  private _loginPromise: Promise<DouyinUserInfo | null> | null = null

  constructor() {
    this._token = uni.getStorageSync(TOKEN_KEY) || ''
    this._userInfo = uni.getStorageSync(USER_INFO_KEY) || null
    this._expiresAt = uni.getStorageSync(EXPIRES_AT_KEY) || 0
    this._checkTokenExpired()
  }

  private _checkTokenExpired(): void {
    if (!this._token || !this._expiresAt) return
    
    let expiresAtMs = this._expiresAt
    if (this._expiresAt < 10000000000) {
      expiresAtMs = this._expiresAt * 1000
    }
    
    if (Date.now() > expiresAtMs) {
      console.log('[Auth] token 已过期，清除登录状态')
      this.logout()
    }
  }

  isLoggedIn(skipCheck = false): boolean {
    if (!skipCheck) {
      this._checkTokenExpired()
    }
    return !!this._token
  }

  getToken(): string {
    return this._token
  }

  getUserInfo(fresh = false): DouyinUserInfo | null {
    if (fresh || !this._userInfo) {
      this._userInfo = uni.getStorageSync(USER_INFO_KEY) || null
    }
    return this._userInfo
  }

  async silentLogin(): Promise<DouyinUserInfo | null> {
    const storedToken = uni.getStorageSync(TOKEN_KEY) || ''
    if (storedToken && this.isLoggedIn(true)) {
      return this.getUserInfo(true)
    }
    return this._doLogin(false)
  }

  async login(userProfile?: { nickName: string; avatarUrl: string }): Promise<DouyinUserInfo | null> {
    if (this._loginPromise) {
      const result = await this._loginPromise
      if (result && userProfile) {
        return this.updateUserProfile(userProfile)
      }
      return result
    }
    return this._doLogin(true, userProfile)
  }

  updateUserProfile(userProfile: { nickName: string; avatarUrl: string }): DouyinUserInfo | null {
    if (!this._userInfo) {
      return null
    }
    this._userInfo.nickName = userProfile.nickName
    this._userInfo.avatarUrl = userProfile.avatarUrl
    this._saveToStorage()
    return this._userInfo
  }

  private async _doLogin(
    force: boolean,
    userProfile?: { nickName: string; avatarUrl: string }
  ): Promise<DouyinUserInfo | null> {
    if (this._loginPromise) {
      return this._loginPromise
    }

    this._loginPromise = this._executeLogin(force, userProfile).finally(() => {
      this._loginPromise = null
    })

    return this._loginPromise
  }

  private async _executeLogin(
    force: boolean,
    userProfile?: { nickName: string; avatarUrl: string }
  ): Promise<DouyinUserInfo | null> {
    // #ifdef MP-TOUTIAO
    try {
      const code = await this._ttLogin(force);
      console.log('获取登录code成功:', code)

      if (!code) {
        return null
      }

      const result = await callFunction(LOGIN_CLOUD_FUNCTION, {
        code,
      })

      if (result.errCode === 0 && result.data) {
        const loginData = result.data as LoginData
        this._token = loginData.token
        this._expiresAt = loginData.expiresAt
        this._userInfo = {
          openid: loginData.openid,
          nickName: '探索者',
          avatarUrl: '',
        }
        this._saveToStorage()
        console.log('登录成功:', this._token)
        return this._userInfo
      } else {
        console.error('登录失败:', result.errMsg || '未知错误')
        return null
      }
    } catch (error) {
      console.error('登录失败:', (error as Error).message || error)
      return null
    }
    // #endif

    // #ifdef MP-WEIXIN
    try {
      const code = await this._wxLogin()
      console.log('获取微信登录code成功:', code)

      if (!code) {
        return null
      }

      const result = await callFunction(LOGIN_CLOUD_FUNCTION, {
        code,
      })

      if (result.errCode === 0 && result.data) {
        const loginData = result.data as LoginData;
        console.log('微信登录成功-------:', loginData)
        this._token = loginData.token
        this._expiresAt = loginData.expiresAt

        let nickName = '探索者'
        let avatarUrl = ''
        if (userProfile) {
          nickName = userProfile.nickName
          avatarUrl = userProfile.avatarUrl
        }

        this._userInfo = {
          openid: loginData.openid,
          nickName,
          avatarUrl,
        }
        this._saveToStorage()
        console.log('微信登录成功:', this._token)
        return this._userInfo
      } else {
        console.error('微信登录失败:', result.errMsg || '未知错误')
        return null
      }
    } catch (error) {
      console.error('微信登录失败:', (error as Error).message || error)
      return null
    }
    // #endif

    // #ifndef MP-TOUTIAO
    // #ifndef MP-WEIXIN
    console.log('当前平台不支持云登录')
    return null
    // #endif
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

  // #ifdef MP-WEIXIN
  private _wxLogin(): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res: any) => {
          if (res.code) {
            resolve(res.code)
          } else {
            reject(new Error('获取登录凭证失败'))
          }
        },
        fail: (err: any) => {
          reject(err)
        },
      })
    })
  }

  // #endif

  logout(): void {
    this._token = ''
    this._userInfo = null
    this._expiresAt = 0
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_INFO_KEY)
    uni.removeStorageSync(EXPIRES_AT_KEY)
  }

  private _saveToStorage(): void {
    uni.setStorageSync(TOKEN_KEY, this._token)
    uni.setStorageSync(USER_INFO_KEY, this._userInfo || '')
    uni.setStorageSync(EXPIRES_AT_KEY, this._expiresAt)
  }
}

export const authManager = new AuthManager()
