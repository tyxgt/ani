<template>
  <AuthGate>
  <view :class="styles.aiPage">
    <image :class="styles.bgImage" :src="AI_BACKGROUND_URL" mode="aspectFill" />

    <view :class="styles.aiHeader">
      <view :class="styles.backBtn" @click="goBack">
        <image :class="styles.backIcon" src="/static/icons/back.svg" mode="aspectFit" />
      </view>
      <view :class="styles.headerTitle">
        <PinyinText text="与大熊猫博士聊天" :charStyle="titleCharStyle" :pinyinStyle="titlePinyinStyle" />
      </view>
      <view :class="styles.headerPlaceholder"></view>
    </view>

    <scroll-view :class="styles.chatList" scroll-y :scroll-top="scrollTop">
      <view :class="styles.chatListInner">
        <template v-for="item in chatListItems" :key="item.key">
          <view v-if="item.type === 'divider'" :class="styles.dateDivider">
            <text :class="styles.dateDividerText">{{ item.label }}</text>
          </view>
          <MessageItem v-else :message="item.message" />
        </template>
      </view>
    </scroll-view>

    <view :class="styles.inputArea">
      <view :class="styles.inputWrapper">
        <image :class="styles.inputPanda" :src="AI_INPUT_PANDA_URL" mode="aspectFit" />
        <input
          :class="styles.chatInput"
          v-model="inputValue"
          type="text"
          confirm-type="send"
          @confirm="sendMessage"
          :disabled="loading"
        />
        <view :class="[styles.sendBtn, { [styles.sendBtnDisabled]: loading }]" @click="sendMessage">
          <text :class="styles.sendIcon">&#x27a4;</text>
        </view>
      </view>
    </view>
  </view>
  </AuthGate>
</template>

<script setup lang="ts">
import AuthGate from '../../components/AuthGate'
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import PinyinText from '../../components/PinyinText'
import MessageItem from '../../components/MessageItem'
import { AI_BACKGROUND_URL, AI_INPUT_PANDA_URL, AI_CHAT_CLOUD_FUNCTION, GET_CHAT_HISTORY_CLOUD_FUNCTION, AI_CHAT_MAX_HISTORY_ROUNDS, ERROR_CODE } from '../../constants'
import { callFunction } from '../../utils/cloud'
import { generateStreamId, watchChatStream } from '../../utils/chatStream'
import type { ChatStreamWatcher } from '../../utils/chatStream'
import { useUserStore } from '../../stores/user'
import { useChatStore } from '../../stores/chat'
import type { ChatMessage, PendingAskContext, RemoteChatMessage } from '../../types'

// 从详情页带着上下文进来时，针对不同实体类型给的引导语提示词
const ASK_HINT_BY_TYPE: Record<PendingAskContext['entityType'], string> = {
  动物: '它生活在哪里、爱吃什么，还是有什么小秘密',
  地形: '它是怎么形成的、长什么样',
  气候: '这种气候什么样、会怎么影响我们的生活',
}

const STORAGE_KEY = 'chat_messages'

function getWelcomeMessage(): ChatMessage {
  return {
    id: Date.now(),
    role: 'assistant',
    content: '你好呀，小朋友！我是大熊猫博士，专门为你讲解中国地理和动物知识！你有什么想知道的，尽管问我吧！',
    time: getTimeString(),
  }
}

// 修复历史存档里残留的"打字中"占位气泡：如果上次退出小程序时正好卡在逐字动画
// 中途（或者请求成功但还没来得及把完整内容存下来就被杀进程），本地存储里会留下
// 一条 typing:true 且内容为空/不完整的助手消息，重新进入时只会一直显示"..."转圈，
// 且再也不会更新。这里统一收尾：有部分内容的直接定格显示，没内容的（真没收到
// 回复）直接丢弃，不留一个永远转圈的空气泡。
function sanitizeRestoredMessages(list: ChatMessage[]): ChatMessage[] {
  return list
    .map(msg => (msg.typing ? { ...msg, typing: false } : msg))
    .filter(msg => msg.role !== 'assistant' || msg.content)
}

const messages = ref<ChatMessage[]>([])

// 本地历史是不是空的（只有兜底插入的欢迎语）——是的话说明这台设备/这次安装
// 没有可用历史，onShow 时要去服务端拉一次云端存档看看能不能补回来。
let needsRemoteHistorySync = false
// 不管拉取成功与否，一次会话内只尝试一次，避免每次切 tab 回来都打一次数据库。
let remoteHistoryFetchAttempted = false

// 从本地存储恢复历史对话
try {
  const saved = uni.getStorageSync(STORAGE_KEY)
  if (saved) {
    const parsed = JSON.parse(saved) as ChatMessage[]
    const sanitized = Array.isArray(parsed) ? sanitizeRestoredMessages(parsed) : []
    if (sanitized.length > 0) {
      messages.value = sanitized
    } else {
      messages.value.push(getWelcomeMessage())
      needsRemoteHistorySync = true
    }
  } else {
    messages.value.push(getWelcomeMessage())
    needsRemoteHistorySync = true
  }
} catch {
  messages.value.push(getWelcomeMessage())
  needsRemoteHistorySync = true
}

// 聊天记录按日期分组展示用：message.id 在所有创建路径上（本地新建/服务端历史拉取）
// 都是毫秒级时间戳，直接拿来算日期，不需要给 ChatMessage 额外加字段。
function getDateLabel(date: Date): string {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000)
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  const sameYear = date.getFullYear() === now.getFullYear()
  return sameYear ? `${date.getMonth() + 1}月${date.getDate()}日` : `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 把 messages 拍平成"日期分割线 + 消息"混合列表，供模板一次性 v-for，
// 不引入会话概念，纯展示层分组。
type ChatListItem =
  | { type: 'divider'; key: string; label: string }
  | { type: 'message'; key: number; message: ChatMessage }

const chatListItems = computed<ChatListItem[]>(() => {
  const items: ChatListItem[] = []
  let lastLabel = ''
  for (const msg of messages.value) {
    const label = getDateLabel(new Date(msg.id))
    if (label !== lastLabel) {
      items.push({ type: 'divider', key: `divider-${msg.id}`, label })
      lastLabel = label
    }
    items.push({ type: 'message', key: msg.id, message: msg })
  }
  return items
})

const inputValue = ref('')
const scrollTop = ref(0)
let scrollTopSeq = 0
const loading = ref(false)
const sessionId = ref<string>('')

const userStore = useUserStore()
const { isLoggedIn, isVip } = storeToRefs(userStore)
const chatStore = useChatStore()

// 当前会话正在围绕哪个实体提问（来自详情页"问博士"）：非持久化，只在
// 本次页面存活期间生效，每条消息发送时会带给云函数做上下文注入。
const activeAskContext = ref<PendingAskContext | null>(null)

// 消费详情页传来的待处理上下文：插入一条引导气泡 + 预填输入框。
// 只在这里读取一次并清空，避免用户后续手动切 tab 回来时被重复触发。
function consumeAskContext() {
  const context = chatStore.consumePendingAsk()
  if (!context) return

  activeAskContext.value = context
  stopTyping()

  const hint = ASK_HINT_BY_TYPE[context.entityType] || '有什么想知道的'
  messages.value.push({
    id: Date.now(),
    role: 'assistant',
    content: `想问关于「${context.entityName}」的什么呀？${hint}，尽管问我吧！`,
    time: getTimeString(),
  })
  saveMessages()
  scrollToBottom()

  inputValue.value = `关于${context.entityName}，`
}

// 本地历史为空时，去服务端把之前存档的聊天记录拉回来（换设备/重装小程序场景）。
// 只是"本地为空时补一次"，不是多端实时同步——同一账号在另一台设备上产生的
// 新消息，不会实时同步过来，只有本地存储为空时才会去查一次云端。
async function maybeSyncRemoteHistory() {
  if (remoteHistoryFetchAttempted || !needsRemoteHistorySync) return
  remoteHistoryFetchAttempted = true

  try {
    const res = await callFunction(GET_CHAT_HISTORY_CLOUD_FUNCTION, {})
    if (res.code === 0 && Array.isArray(res.data) && res.data.length > 0) {
      messages.value = (res.data as RemoteChatMessage[]).map(item => ({
        id: item.id,
        role: item.role,
        content: item.content,
        time: getTimeString(new Date(item.time)),
      }))
      saveMessages()
      scrollToBottom()
      // 一次性替换成最多 200 条历史消息属于大批量更新，渲染层排版比一次
      // 普通追加要慢，nextTick 不一定等得够，200ms 后再补一次兜底滚动。
      setTimeout(scrollToBottom, 200)
    }
    // res.data 是空数组：真正的第一次聊天，保留本地已插入的欢迎语，不做任何事
  } catch (e) {
    console.error('[Chat] 拉取云端历史失败:', e)
    // 静默降级为只用欢迎语，不弹 toast——跟 getMembership 失败按"非会员"静默兜底同一风格
  }
}

// 页面级兜底：非会员不允许停留在这个页面（入口已经在 tabBar/详情页隐藏，
// 这里防的是页面实例被缓存住、或者非常规方式直接跳转过来的情况）。
// 静默跳走，不做任何提示。
onShow(async () => {
  if (isLoggedIn.value) {
    await userStore.refreshMembership()
  }
  if (isLoggedIn.value && !isVip.value) {
    uni.switchTab({ url: '/pages/index/index' })
    return
  }
  await maybeSyncRemoteHistory()
  consumeAskContext()
})

// 当前正在流式展示的助手消息 + 对应的数据库 watcher：sendMessage 发起请求时设置，
// finalizeAssistantMessage/stopTyping 收尾时清空，确保任意时刻只有一个 watcher 存活。
let currentTypingMsgIndex: number | null = null
let currentWatcher: ChatStreamWatcher | null = null
let activeStreamId: string = ''

const titleCharStyle = { fontSize: '16px', fontWeight: 'bold', color: '#333' }
const titlePinyinStyle = { fontSize: '12px', color: '#666' }

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

function getTimeString(date: Date = new Date()) {
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

// scroll-top 会被 scroll-view 自动 clamp 到内容实际可滚动的最大距离，具体
// 数值多大不重要；关键是每次调用都必须是一个新值，否则小程序认为"没变化"
// 就不会触发滚动（之前反复赋值同一个 99999 正是一直不生效的原因）。
function scrollToBottom() {
  nextTick(() => {
    scrollTopSeq += 1
    scrollTop.value = 999999999 + scrollTopSeq
  })
}

function closeCurrentWatcher() {
  currentWatcher?.close()
  currentWatcher = null
  // 一并失效当前 streamId：watcher.close() 之后理论上不会再有回调，但异步场景下
  // 不能完全排除"close() 执行时回调已经在路上"这种竞态，回调内部靠比对 activeStreamId
  // 再兜底一层保护，避免过期回调污染已经切走的消息。
  activeStreamId = ''
}

// 打断上一条还在流式展示中的助手消息：有部分内容就直接定格显示，完全没收到过
// 任何内容（真没来得及展示）就丢弃这条占位气泡，跟 sanitizeRestoredMessages
// 对"残缺 typing 消息"的兜底策略保持一致。
function stopTyping() {
  closeCurrentWatcher()
  if (currentTypingMsgIndex !== null) {
    const msg = messages.value[currentTypingMsgIndex]
    if (msg && msg.typing) {
      if (msg.content) {
        msg.typing = false
      } else {
        messages.value.splice(currentTypingMsgIndex, 1)
      }
    }
    currentTypingMsgIndex = null
  }
}

// 流式展示收尾：把消息内容定格为最终文本、关闭 watcher、落本地存储。onDone 回调
// 和 callFunction 成功返回都会调用这里，两次调用内容理应一致，重复调用是安全的。
function finalizeAssistantMessage(msgId: number, content: string) {
  const idx = messages.value.findIndex(m => m.id === msgId)
  if (idx !== -1) {
    messages.value[idx].content = content
    messages.value[idx].typing = false
    if (currentTypingMsgIndex === idx) {
      currentTypingMsgIndex = null
    }
  }
  closeCurrentWatcher()
  scrollToBottom()
  saveMessages()
}

function saveMessages() {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(messages.value))
  } catch (e) {
    console.error('[Chat] 保存消息失败:', e)
  }
}

async function sendMessage() {
  const content = inputValue.value.trim()
  if (!content || loading.value) return

  if (!isLoggedIn.value) {
    uni.showModal({
      title: '提示',
      content: '登录后才能和大熊猫博士聊天哦~',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.switchTab({ url: '/pages/mine/index' })
        }
      },
    })
    return
  }

  stopTyping()

  loading.value = true

  const timeStr = getTimeString()

  const userMsg: ChatMessage = {
    id: Date.now(),
    role: 'user',
    content,
    time: timeStr,
  }
  messages.value.push(userMsg)
  saveMessages()

  const assistantMsgId = Date.now() + 1
  const assistantMsg: ChatMessage = {
    id: assistantMsgId,
    role: 'assistant',
    content: '',
    time: getTimeString(),
    typing: true,
  }
  messages.value.push(assistantMsg)
  currentTypingMsgIndex = messages.value.length - 1

  inputValue.value = ''

  scrollToBottom()

  // 在发起 callFunction 之前就先开始 watch：不能等 callFunction 的 Promise resolve
  // 才开始监听，那样跟现在"整体等完"没区别。chat 云函数即使还没跑到建库那一步，
  // watch 也能在记录创建后正常收到 onChange，不需要前端等云函数确认记录已存在。
  const streamId = generateStreamId()
  activeStreamId = streamId
  currentWatcher = watchChatStream(streamId, {
    onContent(text) {
      if (streamId !== activeStreamId) return // 过期回调（新消息已经开始/页面已经收尾），丢弃
      const idx = messages.value.findIndex(m => m.id === assistantMsgId)
      if (idx !== -1) {
        messages.value[idx].content = text
        scrollToBottom()
      }
    },
    onDone(finalContent) {
      if (streamId !== activeStreamId) return
      finalizeAssistantMessage(assistantMsgId, finalContent)
    },
    onError() {
      // 不单独弹 toast，避免和下面 callFunction 的报错分支重复弹两次；
      // 安静地等 callFunction 的返回来统一收尾 UI。
    },
  })

  try {
    const recentHistory = messages.value.slice(-AI_CHAT_MAX_HISTORY_ROUNDS * 2).filter(m => !m.typing || m.role === 'user')

    const res = await callFunction(AI_CHAT_CLOUD_FUNCTION, {
      message: content,
      history: recentHistory,
      sessionId: sessionId.value,
      entityType: activeAskContext.value?.entityType,
      entityName: activeAskContext.value?.entityName,
      streamId,
    })

    if (res.code === 0 && res.data && res.data.reply) {
      sessionId.value = res.data.sessionId || sessionId.value

      // 兜底收尾：即使某次数据库 onChange 因网络抖动没送达，callFunction 的返回值
      // 本身也能让消息正确定格，不会卡在"打字中"。finalizeAssistantMessage 是幂等的，
      // 和 onDone 重复调用没有副作用。
      finalizeAssistantMessage(assistantMsgId, res.data.reply)
    } else if (res.code === ERROR_CODE.NEED_MEMBERSHIP) {
      // 服务端二次校验拦截：理论上走不到这里（入口已隐藏、onShow 已拦截），
      // 出现说明本地会员状态短暂过期了——静默撤回占位消息，不弹任何提示，
      // 刷新会员状态后离开页面。
      closeCurrentWatcher()
      const msgIndex = messages.value.findIndex(m => m.id === assistantMsgId)
      if (msgIndex !== -1) {
        messages.value.splice(msgIndex, 1)
        currentTypingMsgIndex = null
      }
      await userStore.refreshMembership()
      uni.switchTab({ url: '/pages/index/index' })
    } else {
      closeCurrentWatcher()
      const msgIndex = messages.value.findIndex(m => m.id === assistantMsgId)
      if (msgIndex !== -1) {
        messages.value.splice(msgIndex, 1)
        currentTypingMsgIndex = null
      }

      // 检测默认模板响应（未部署自定义云函数代码）
      if (res.code === -1 && (res.msg === '未知响应格式' || res.msg === '响应数据为空')) {
        uni.showToast({
          title: 'chat 云函数未部署，请上传部署后再试',
          icon: 'none',
          duration: 3000,
        })
      } else {
        uni.showToast({
          title: res.msg || '大熊猫博士正在思考，请再试一次',
          icon: 'none',
          duration: 2000,
        })
      }
    }
  } catch (error) {
    closeCurrentWatcher()
    const msgIndex = messages.value.findIndex(m => m.id === assistantMsgId)
    if (msgIndex !== -1) {
      messages.value.splice(msgIndex, 1)
      currentTypingMsgIndex = null
    }
    uni.showToast({
      title: '网络开小差了，请稍后再试',
      icon: 'none',
      duration: 2000,
    })
  } finally {
    loading.value = false
    saveMessages()
  }
}

onUnmounted(() => {
  stopTyping()
  saveMessages()
})
</script>
<style lang="less" src="./index.less" module="styles"></style>
