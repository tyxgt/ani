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
      <view :class="styles.msgTime">
        {{ message.time }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useCssModule } from 'vue'
import PinyinText from '../PinyinText'
import { AI_PANDA_URL } from '../../constants'
import type { ChatMessage } from '../../types'

const styles = useCssModule('styles') as Record<string, string>

const USER_AVATAR_URL = 'https://api.dicebear.com/7.x/avataaars/svg?seed=child'

defineProps<{
  message: ChatMessage
}>()

const msgCharStyle = { fontSize: '18px', color: '#333', lineHeight: '1.6' }
const msgPinyinStyle = { fontSize: '12px', color: '#888', lineHeight: '1.2' }
</script>

<style lang="less" src="./index.less" module="styles"></style>
