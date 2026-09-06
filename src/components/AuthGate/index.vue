<template>
  <!-- 登录态：只渲染 slot -->
  <slot v-if="isLoggedIn" />

  <template v-else>
    <!-- 未登录（除了 !authReady / manualLogin）：slot 始终渲染，真实页面内容在下面可见 -->
    <slot />
    <!-- 覆盖层：在真实页面内容上方显示 loading/弹窗 -->
    <view v-if="!authReady" :class="styles.gate">
      <LoadingSpinner text="登录中..." />
    </view>
    <!-- 手动登录模式（用于"我的"页）：全屏 gate 背景 + 居中登录卡片 -->
    <view v-else-if="manualLogin" :class="styles.gate">
      <view :class="styles.loginModalContent">
        <text :class="styles.loginModalIcon">🐼</text>
        <view :class="styles.loginModalTitle">
          <PinyinText text="未登录" display-mode="vertical"
            :charStyle="{ fontSize: '40rpx', fontWeight: 'bold', color: '#2C3E50' }"
            :pinyinStyle="{ fontSize: '26rpx', color: '#5D6D7E' }" />
        </view>
        <view :class="styles.loginModalDesc">
          <PinyinText text="请登录后查看个人中心"
            :charStyle="{ fontSize: '28rpx', color: '#999' }"
            :pinyinStyle="{ fontSize: '20rpx', color: '#999' }" />
        </view>
        <view :class="styles.loginModalBtn" @click="handleManualLogin">
          <PinyinText :text="submitting ? '登录中' : '登录'" display-mode="vertical"
            :charStyle="{ fontSize: '32rpx', fontWeight: 'bold', color: '#fff' }"
            :pinyinStyle="{ fontSize: '22rpx', color: '#fff' }" />
        </view>
      </view>
    </view>
    <!-- 默认模式：弹窗作为覆盖层（fixed + z-index），下面 slot 的"开始探索吧"等内容可见 -->
    <view v-else :class="styles.loginModal" @click="goLogin">
      <view :class="styles.loginModalContent" @click.stop>
        <text :class="styles.loginModalIcon">🐼</text>
        <view :class="styles.loginModalTitle">
          <PinyinText text="请先登录" display-mode="vertical"
            :charStyle="{ fontSize: '40rpx', fontWeight: 'bold', color: '#2C3E50' }"
            :pinyinStyle="{ fontSize: '26rpx', color: '#5D6D7E' }" />
        </view>
        <view :class="styles.loginModalDesc">
          <PinyinText text="登录后即可查看全部内容"
            :charStyle="{ fontSize: '28rpx', color: '#999' }"
            :pinyinStyle="{ fontSize: '20rpx', color: '#999' }" />
        </view>
        <view :class="styles.loginModalBtn" @click="goLogin">
          <PinyinText text="去登录" display-mode="vertical"
            :charStyle="{ fontSize: '32rpx', fontWeight: 'bold', color: '#fff' }"
            :pinyinStyle="{ fontSize: '22rpx', color: '#fff' }" />
        </view>
      </view>
    </view>
  </template>
</template>

<script setup lang="ts">
import { useCssModule, ref } from 'vue'
import { storeToRefs } from 'pinia'
import LoadingSpinner from '../LoadingSpinner'
import PinyinText from '../PinyinText'
import { useUserStore } from '../../stores/user'

// manualLogin=true（用于"我的"页）：未登录时显示登录按钮，由用户手动点击触发登录。
const props = defineProps<{ manualLogin?: boolean }>()

const styles = useCssModule('styles') as Record<string, string>
const store = useUserStore()
const { isLoggedIn, authReady } = storeToRefs(store)

const submitting = ref(false)

const goLogin = () => {
  uni.switchTab({ url: '/pages/mine/index' })
}

const handleManualLogin = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    await store.silentLogin()
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="less" src="./index.less" module="styles"></style>
