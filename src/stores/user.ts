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

  async function silentLogin(): Promise<void> {
    console.log('[UserStore] silentLogin 开始')
    try {
      await authManager.silentLogin()
    } catch (e) {
      console.error('[UserStore] 静默登录失败:', e)
    }
    refreshState()
    console.log('[UserStore] silentLogin 完成')
  }

  function logout(): void {
    console.log('[UserStore] logout')
    authManager.logout()
    refreshState()
  }

  return { isLoggedIn, userInfo, refreshState, login, silentLogin, logout }
})
