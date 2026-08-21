<template>
  <view :id="`msg-${message.id}`" :class="[styles.messageItem, message.role === 'user' ? styles.userMsg : styles.assistantMsg]">
    <image
      v-if="message.role === 'user'"
      :class="styles.avatar"
      :src="USER_AVATAR_URL"
      mode="aspectFit"
    />
    <image
      v-if="message.role === 'assistant'"
      :class="styles.avatar"
      :src="AI_PANDA_URL"
      mode="aspectFit"
    />

    <view :class="styles.messageContent">
      <view :class="[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]">
        <view :class="styles.bubbleContent">
          <PinyinText
            :text="message.content"
            align="left"
            :charStyle="msgCharStyle"
            :pinyinStyle="msgPinyinStyle"
          />
          <view v-if="message.typing" :class="styles.typingCursor"></view>
        </view>
      </view>
      <!-- 底部区域：时间戳 + 朗读按钮 -->
      <view :class="styles.messageFooter">
        <view :class="styles.msgTime">
          {{ message.time }}
        </view>
        <!-- AI消息的朗读按钮 -->
        <view
          v-if="message.role === 'assistant' && !message.typing"
          :class="styles.speakBtn"
          @click="handleSpeak"
          @tap="handleSpeak"
        >
          <image
            :class="styles.speakIcon"
            :src="isPlaying ? '/static/icons/speaker-stop.svg' : '/static/icons/speaker.svg'"
            mode="aspectFit"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useCssModule } from 'vue'
import PinyinText from '../PinyinText'
import { AI_PANDA_URL } from '../../constants'
import { speakText, stopSpeaking, isTTSSupported } from '../../utils/tts'
import type { ChatMessage } from '../../types'

const styles = useCssModule('styles') as Record<string, string>

const USER_AVATAR_URL = 'https://api.dicebear.com/7.x/avataaars/svg?seed=child'

const props = defineProps<{
  message: ChatMessage
}>()

const msgCharStyle = { fontSize: '18px', color: '#333', lineHeight: '1.6' }
const msgPinyinStyle = { fontSize: '12px', color: '#888', lineHeight: '1.2' }

const isPlaying = ref(false)

function handleSpeak() {
  if (isPlaying.value) {
    // 正在播放，点击停止
    stopSpeaking()
    isPlaying.value = false
  } else {
    // 未播放，点击开始朗读
    speakText({
      content: props.message.content,
      onStart: () => {
        isPlaying.value = true
      },
      onEnd: () => {
        isPlaying.value = false
      },
      onError: (err) => {
        isPlaying.value = false
        console.error('[MessageItem] 朗读失败:', err)
        uni.showToast({
          title: '朗读失败，请重试',
          icon: 'none',
          duration: 2000,
        })
      },
    })
  }
}

// 组件卸载时停止播放
onUnmounted(() => {
  if (isPlaying.value) {
    stopSpeaking()
  }
})
</script>

<style lang="less" src="./index.less" module="styles"></style>
