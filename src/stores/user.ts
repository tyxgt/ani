import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { authManager } from '../utils/auth'
import type { DouyinUserInfo } from '../types'

/**
 * 用户认证状态 Store
 * - 全局响应式状态，各页面共享同一实例
 * - 持久化委托 AuthManager 处理
 */
export const useUserStore = defineStore('user', () => {
  // ─── State ───────────────────────────────────────────────────
  const isLoggedIn = ref(authManager.isLoggedIn(true))
  const userInfo = ref<DouyinUserInfo | null>(authManager.getUserInfo(true))
  // 是否已经完成过一次启动时的静默登录尝试（无论成功与否）。
  // AuthGate 组件靠这个状态区分"登录中"和"登录失败需要重试"。
  const authReady = ref(isLoggedIn.value)

  // 初始化状态修复：如果 storage 有 userInfo 但 isLoggedIn 为 false，强制修复
  if (!isLoggedIn.value) {
    const storedToken = uni.getStorageSync('token')
    if (storedToken) {
      console.log('[UserStore] 修复: storage 有 token 但 isLoggedIn 为 false')
      isLoggedIn.value = true
    }
    if (!userInfo.value) {
      const storedUserInfo = uni.getStorageSync('userInfo')
      if (storedUserInfo) {
        try {
          userInfo.value = typeof storedUserInfo === 'string'
            ? JSON.parse(storedUserInfo)
            : storedUserInfo
        } catch {}
      }
    }
  }

  console.log('[UserStore] 初始化:', { isLoggedIn: isLoggedIn.value, userInfo: userInfo.value })

  // ─── 监听状态变化 ────────────────────────────────────────────
  watch(isLoggedIn, (val) => console.log('[UserStore] isLoggedIn 变化 →', val))
  watch(userInfo, (val) => console.log('[UserStore] userInfo 变化 →', val ? { ...val } : null))

  // ─── Actions ───────────────────────────────────────────────────

  function refreshState() {
    const newLoggedIn = authManager.isLoggedIn(true)
    const newUserInfo = authManager.getUserInfo(true)

    // 兜底：如果 AuthManager 说未登录但 storage 有 token，优先用 storage
    const finalLoggedIn = newLoggedIn || !!uni.getStorageSync('token')

    isLoggedIn.value = finalLoggedIn

    if (newUserInfo) {
      userInfo.value = newUserInfo
    } else {
      const stored = uni.getStorageSync('userInfo')
      if (stored) {
        try {
          userInfo.value = typeof stored === 'string' ? JSON.parse(stored) : stored
        } catch {}
      }
    }

    console.log('[UserStore] refreshState:', {
      isLoggedIn: isLoggedIn.value,
      userInfo: userInfo.value ? { ...userInfo.value } : null,
    })
  }

  async function login(nickName: string, avatarUrl = ''): Promise<DouyinUserInfo | null> {
    console.log('[UserStore] login:', { nickName })
    const result = await authManager.login({ nickName, avatarUrl })
    if (result) refreshState()
    console.log('[UserStore] login 结果:', result ? '成功' : '失败')
    return result
  }

  // 登录本身已经在 App 启动时静默完成，这里只用于登录后"完善资料"
  // （昵称/头像），不重新触发 wx.login。
  function updateProfile(nickName: string, avatarUrl = ''): DouyinUserInfo | null {
    console.log('[UserStore] updateProfile:', { nickName })
    const result = authManager.updateUserProfile({ nickName, avatarUrl })
    if (result) refreshState()
    return result
  }

  async function silentLogin(): Promise<void> {
    console.log('[UserStore] silentLogin 开始')
    try {
      await authManager.silentLogin()
    } catch (e) {
      console.error('[UserStore] 静默登录失败:', e)
    } finally {
      refreshState()
      authReady.value = true
      console.log('[UserStore] silentLogin 完成:', { isLoggedIn: isLoggedIn.value })
    }
  }

  function logout(): void {
    console.log('[UserStore] logout')
    authManager.logout()
    refreshState()
  }

  // 供 401 自愈流程调用：把状态打回"登录中"，触发页面上的 AuthGate 重新展示 loading，
  // 随后调用方应当再次调用 silentLogin() 重新换取 token。
  function markAuthPending(): void {
    authReady.value = false
    isLoggedIn.value = false
  }

  return { isLoggedIn, userInfo, authReady, refreshState, login, updateProfile, silentLogin, logout, markAuthPending }
})
