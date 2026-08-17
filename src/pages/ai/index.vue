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

    <scroll-view :class="styles.chatList" scroll-y :scroll-top="scrollTop" :scroll-into-view="scrollToId">
      <view :class="styles.chatListInner">
        <MessageItem v-for="msg in messages" :key="msg.id" :message="msg" />
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
import { ref, nextTick, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import PinyinText from '../../components/PinyinText'
import MessageItem from '../../components/MessageItem'
import { AI_BACKGROUND_URL, AI_INPUT_PANDA_URL, AI_CHAT_CLOUD_FUNCTION, AI_CHAT_MAX_HISTORY_ROUNDS, AI_TYPEWRITER_SPEED } from '../../constants'
import { callFunction } from '../../utils/cloud'
import { useUserStore } from '../../stores/user'
import type { ChatMessage } from '../../types'

const STORAGE_KEY = 'chat_messages'

function getWelcomeMessage(): ChatMessage {
  return {
    id: Date.now(),
    role: 'assistant',
    content: '你好呀，小朋友！我是大熊猫博士，专门为你讲解中国地理和动物知识！你有什么想知道的，尽管问我吧！',
    time: getTimeString(),
  }
}

const messages = ref<ChatMessage[]>([])

// 从本地存储恢复历史对话
try {
  const saved = uni.getStorageSync(STORAGE_KEY)
  if (saved) {
    const parsed = JSON.parse(saved) as ChatMessage[]
    if (Array.isArray(parsed) && parsed.length > 0) {
      messages.value = parsed
    } else {
      messages.value.push(getWelcomeMessage())
    }
  } else {
    messages.value.push(getWelcomeMessage())
  }
} catch {
  messages.value.push(getWelcomeMessage())
}

const inputValue = ref('')
const scrollTop = ref(99999)
const scrollToId = ref('')
const loading = ref(false)
const sessionId = ref<string>('')

const userStore = useUserStore()
const { isLoggedIn } = storeToRefs(userStore)

let typingTimer: ReturnType<typeof setInterval> | null = null
let currentTypingMsgIndex: number | null = null
let fullReplyContent: string = ''

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

function getTimeString() {
  const now = new Date()
  return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
}

function scrollToBottom() {
  nextTick(() => {
    if (messages.value.length > 0) {
      scrollToId.value = `msg-${messages.value[messages.value.length - 1].id}`
    }
    scrollTop.value = 99999
  })
}

function stopTyping() {
  if (typingTimer) {
    clearInterval(typingTimer)
    typingTimer = null
  }
  if (currentTypingMsgIndex !== null) {
    if (fullReplyContent) {
      messages.value[currentTypingMsgIndex].content = fullReplyContent
      messages.value[currentTypingMsgIndex].typing = false
    }
    currentTypingMsgIndex = null
    fullReplyContent = ''
  }
}

function typeWriter(fullContent: string, msgId: number) {
  const msgIndex = messages.value.findIndex(m => m.id === msgId)
  if (msgIndex === -1) return

  const chars = Array.from(fullContent)
  let charIndex = 0
  messages.value[msgIndex].content = ''
  messages.value[msgIndex].typing = true
  currentTypingMsgIndex = msgIndex
  fullReplyContent = fullContent

  typingTimer = setInterval(() => {
    if (charIndex < chars.length) {
      messages.value[msgIndex].content += chars[charIndex]
      charIndex++
      if (charIndex % 3 === 0 || charIndex === chars.length) {
        scrollToBottom()
      }
    } else {
      clearInterval(typingTimer!)
      typingTimer = null
      messages.value[msgIndex].typing = false
      currentTypingMsgIndex = null
      fullReplyContent = ''
      scrollToBottom()
    }
  }, AI_TYPEWRITER_SPEED)
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

  inputValue.value = ''

  scrollToBottom()

  try {
    const recentHistory = messages.value.slice(-AI_CHAT_MAX_HISTORY_ROUNDS * 2).filter(m => !m.typing || m.role === 'user')

    const res = await callFunction(AI_CHAT_CLOUD_FUNCTION, {
      message: content,
      history: recentHistory,
      sessionId: sessionId.value,
    })

    if (res.code === 0 && res.data && res.data.reply) {
      sessionId.value = res.data.sessionId || sessionId.value

      const reply = res.data.reply
      typeWriter(reply, assistantMsgId)
    } else {
      const msgIndex = messages.value.findIndex(m => m.id === assistantMsgId)
      if (msgIndex !== -1) {
        messages.value.splice(msgIndex, 1)
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
    const msgIndex = messages.value.findIndex(m => m.id === assistantMsgId)
    if (msgIndex !== -1) {
      messages.value.splice(msgIndex, 1)
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
