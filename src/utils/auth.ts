import type { DouyinUserInfo, LoginData } from '../types'
import { TOKEN_KEY, USER_INFO_KEY, EXPIRES_AT_KEY, VIP_INFO_KEY, LOGIN_CLOUD_FUNCTION, GET_MEMBERSHIP_CLOUD_FUNCTION } from '../constants'
import { callFunction } from './cloud'

export interface VipInfo {
  userCode: string | null
  isVip: boolean
  vipExpireAt: number | null
  vipType: 'week' | 'month' | null
}

const EMPTY_VIP_INFO: VipInfo = { userCode: null, isVip: false, vipExpireAt: null, vipType: null }

class AuthManager {
  private _token: string = ''
  private _userInfo: DouyinUserInfo | null = null
  private _expiresAt: number = 0
  private _vipInfo: VipInfo = { ...EMPTY_VIP_INFO }
  private _loginPromise: Promise<DouyinUserInfo | null> | null = null

  constructor() {
    this._token = uni.getStorageSync(TOKEN_KEY) || ''
    this._userInfo = uni.getStorageSync(USER_INFO_KEY) || null
    this._expiresAt = uni.getStorageSync(EXPIRES_AT_KEY) || 0
    this._checkTokenExpired()
    this._userInfo = this._parseUserInfo(this._userInfo)
    this._vipInfo = this._parseVipInfo(uni.getStorageSync(VIP_INFO_KEY))
    console.log('[Auth] 构造函数:', {
      hasToken: !!this._token,
      userInfo: this._userInfo,
      expiresAt: this._expiresAt,
      vipInfo: this._vipInfo,
    })
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
      const stored = uni.getStorageSync(USER_INFO_KEY)
      this._userInfo = this._parseUserInfo(stored)
    }
    return this._userInfo
  }

  private _parseUserInfo(stored: any): DouyinUserInfo | null {
    if (!stored) return null
    if (typeof stored === 'object') return stored as DouyinUserInfo
    if (typeof stored === 'string') {
      try { return JSON.parse(stored) as DouyinUserInfo } catch {}
    }
    return null
  }

  getVipInfo(fresh = false): VipInfo {
    if (fresh) {
      this._vipInfo = this._parseVipInfo(uni.getStorageSync(VIP_INFO_KEY))
    }
    return this._vipInfo
  }

  private _parseVipInfo(stored: any): VipInfo {
    if (!stored) return { ...EMPTY_VIP_INFO }
    const obj = typeof stored === 'string' ? (() => { try { return JSON.parse(stored) } catch { return null } })() : stored
    if (!obj || typeof obj !== 'object') return { ...EMPTY_VIP_INFO }
    return {
      userCode: obj.userCode ?? null,
      isVip: !!obj.isVip,
      vipExpireAt: obj.vipExpireAt ?? null,
      vipType: obj.vipType ?? null,
    }
  }

  private _setVipInfo(loginData: Partial<LoginData>): void {
    this._vipInfo = {
      userCode: loginData.userCode ?? null,
      isVip: !!loginData.isVip,
      vipExpireAt: loginData.vipExpireAt ?? null,
      vipType: loginData.vipType ?? null,
    }
    try {
      uni.setStorageSync(VIP_INFO_KEY, JSON.stringify(this._vipInfo))
    } catch (e) {
      console.error('[Auth] 会员状态存储失败:', e)
    }
  }

  // 静默刷新会员状态：不依赖 token 是否过期，随时可调用（供 tabBar 页面
  // onShow 时调用），失败时保留当前状态，不抛出到 UI。
  async refreshMembership(): Promise<VipInfo> {
    if (!this.isLoggedIn(true)) {
      return this._vipInfo
    }
    try {
      const result = await callFunction(GET_MEMBERSHIP_CLOUD_FUNCTION, {})
      if (result.code === 0 && result.data) {
        this._setVipInfo(result.data)
      }
    } catch (e) {
      console.error('[Auth] 刷新会员状态失败:', e)
    }
    return this._vipInfo
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
    // 正常情况下 _userInfo 在登录成功后就已经存在（哪怕昵称是空的）。
    // 这里做一层兜底：只要本地已经拿到 token（说明登录态是有效的），
    // 即使实例上的 _userInfo 因为某些边界情况丢失了，也不要静默失败，
    // 而是补建一个最小可用的对象，保证昵称能正常保存。
    if (!this._userInfo) {
      if (!this._token) {
        return null
      }
      const stored = this._parseUserInfo(uni.getStorageSync(USER_INFO_KEY))
      this._userInfo = stored || { openid: '', nickName: '', avatarUrl: '' }
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

      if (result.code === 0 && result.data) {
        const loginData = result.data as LoginData
        this._token = loginData.token || ('local_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2))
        this._expiresAt = loginData.expiresAt || (Date.now() + 7 * 24 * 3600 * 1000)
        let nickName = userProfile ? userProfile.nickName : ''
        let avatarUrl = userProfile ? userProfile.avatarUrl : ''
        if (!userProfile && this._userInfo) {
          nickName = this._userInfo.nickName
          avatarUrl = this._userInfo.avatarUrl
        }
        this._userInfo = {
          openid: loginData.openid,
          nickName,
          avatarUrl,
        }
        this._setVipInfo(loginData)
        this._saveToStorage()
        console.log('登录成功:', this._token)
        return this._userInfo
      } else {
        console.error('登录失败:', result.msg || '未知错误')
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

      if (result.code === 0 && result.data) {
        console.log('[Auth] result.data 原始内容:', JSON.stringify(result.data))
        const loginData = result.data as LoginData;
        console.log('[Auth] loginData.token:', loginData?.token, 'loginData.openid:', loginData?.openid)

        // 兼容云函数不返回 token 的情况（仅返回 {openid, appid, unionid}）
        this._token = loginData.token || ('local_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2))
        this._expiresAt = loginData.expiresAt || (Date.now() + 7 * 24 * 3600 * 1000)

        let nickName = ''
        let avatarUrl = ''
        if (userProfile) {
          nickName = userProfile.nickName
          avatarUrl = userProfile.avatarUrl
        } else if (this._userInfo) {
          // silentLogin 时保留已有用户信息
          nickName = this._userInfo.nickName
          avatarUrl = this._userInfo.avatarUrl
        }

        this._userInfo = {
          openid: loginData.openid,
          nickName,
          avatarUrl,
        }
        this._setVipInfo(loginData)
        this._saveToStorage()
        console.log('微信登录成功:', this._token)
        return this._userInfo
      } else {
        console.error('微信登录失败:', result.msg || '未知错误')
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
    this._vipInfo = { ...EMPTY_VIP_INFO }
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_INFO_KEY)
    uni.removeStorageSync(EXPIRES_AT_KEY)
    uni.removeStorageSync(VIP_INFO_KEY)
  }

  private _saveToStorage(): void {
    try {
      uni.setStorageSync(TOKEN_KEY, this._token)
      uni.setStorageSync(USER_INFO_KEY, JSON.stringify(this._userInfo || ''))
      uni.setStorageSync(EXPIRES_AT_KEY, this._expiresAt)
      console.log('[Auth] 存储成功:', { hasToken: !!this._token, userInfo: this._userInfo })
    } catch (e) {
      console.error('[Auth] 存储失败:', e)
    }
  }
}

export const authManager = new AuthManager()
