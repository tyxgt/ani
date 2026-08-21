import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PendingAskContext } from '../types'

/**
 * 「问博士」上下文桥接 Store
 * - pages/ai/index 同时注册为 tabBar 页，switchTab 无法带 query 参数，
 *   所以详情页点"问博士"时先把想问的实体存进这里，AI 页 onShow 时读取消费。
 * - consumePendingAsk 读完立即清空，避免用户后续手动切换 tab 回到 AI 页时被重复触发。
 */
export const useChatStore = defineStore('chat', () => {
  const pendingAsk = ref<PendingAskContext | null>(null)

  function setPendingAsk(context: PendingAskContext): void {
    pendingAsk.value = context
  }

  function consumePendingAsk(): PendingAskContext | null {
    const context = pendingAsk.value
    pendingAsk.value = null
    return context
  }

  return {
    pendingAsk,
    setPendingAsk,
    consumePendingAsk,
  }
})
