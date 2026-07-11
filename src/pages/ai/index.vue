<template>
  <view :class="styles.aiPage">
    <!-- 背景图 -->
    <image :class="styles.bgImage" :src="AI_BACKGROUND_URL" mode="aspectFill" />

    <!-- 头部导航 -->
    <view :class="styles.aiHeader">
      <view :class="styles.backBtn" @click="goBack">
        <image :class="styles.backIcon" src="/static/icons/back.svg" mode="aspectFit" />
      </view>
      <view :class="styles.headerTitle">
        <PinyinText text="与大熊猫博士聊天" :charStyle="titleCharStyle" :pinyinStyle="titlePinyinStyle" />
      </view>
      <view :class="styles.headerPlaceholder"></view>
    </view>

    <!-- 聊天消息列表 -->
    <scroll-view :class="styles.chatList" scroll-y :scroll-top="scrollTop">
      <view :class="styles.chatListInner">
        <MessageItem v-for="msg in messages" :key="msg.id" :message="msg" />
      </view>
    </scroll-view>

    <!-- 底部输入框 -->
    <view :class="styles.inputArea">
      <view :class="styles.inputWrapper">
        <image :class="styles.inputPanda" :src="AI_INPUT_PANDA_URL" mode="aspectFit" />
        <input
          :class="styles.chatInput"
          v-model="inputValue"
          type="text"
          confirm-type="send"
          @confirm="sendMessage"
        />
        <view :class="styles.sendBtn" @click="sendMessage">
          <text :class="styles.sendIcon">&#x27a4;</text>
        </view>
      </view>
    </view>

    <CustomTabBar :current="1" />
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import CustomTabBar from '../../components/CustomTabBar'
import PinyinText from '../../components/PinyinText'
import MessageItem from '../../components/MessageItem'
import { AI_BACKGROUND_URL, AI_INPUT_PANDA_URL } from '../../constants'
import type { ChatMessage } from '../../types'

// 预置示例对话
const messages = ref<ChatMessage[]>([
  {
    id: 1,
    role: 'user',
    content: '吐鲁番为什么那么热呀？',
    time: '10:30',
  },
  {
    id: 2,
    role: 'assistant',
    content: '好问题！\uD83D\uDE04 吐鲁番被称为"火洲"，因为它在盆地里，四周被高山环绕，热空气出不去，太阳一晒，温度就升得特别高啦！',
    time: '10:31',
  },
  {
    id: 3,
    role: 'user',
    content: '哇！那那里的葡萄为什么那么甜呢？',
    time: '10:32',
  },
  {
    id: 4,
    role: 'assistant',
    content: '因为那里日照时间特别长，白天热量足，晚上又很凉爽，葡萄吸收了满满的阳光能量，糖分自然就高啦！\uD83C\uDF47',
    time: '10:33',
  },
  {
    id: 5,
    role: 'assistant',
    content: '小朋友，这就是自然的奇妙之处！每个地方都有自己的特点，多观察、多思考，你也会成为小小科学家哦！\uD83C\uDF08',
    time: '10:34',
  },
])

const inputValue = ref('')
const scrollTop = ref(99999)

// PinyinText 样式配置
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

function sendMessage() {
  const content = inputValue.value.trim()
  if (!content) return

  const now = new Date()
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content,
    time: timeStr,
  })

  inputValue.value = ''

  // 滚动到底部
  nextTick(() => {
    scrollTop.value = scrollTop.value + 1
  })
}
</script>
<style lang="less" src="./index.less" module="styles"></style>