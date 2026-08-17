<template>
  <template v-if="isLoggedIn">
    <slot />
  </template>
  <view v-else :class="styles.gate">
    <LoadingSpinner v-if="!authReady" text="登录中..." />
    <view v-else :class="styles.retry" @click="handleRetry">
      <text :class="styles.retryIcon">🐼</text>
      <text :class="styles.retryText">网络异常，点击重试登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useCssModule } from 'vue'
import { storeToRefs } from 'pinia'
import LoadingSpinner from '../LoadingSpinner'
import { useUserStore } from '../../stores/user'

const styles = useCssModule('styles') as Record<string, string>

// 使用任何功能前都必须先登录：本组件包裹在每个页面根节点外层，
// 未完成登录前只展示 loading/重试态，不渲染页面真实内容（slot）。
const store = useUserStore()
const { isLoggedIn, authReady } = storeToRefs(store)

const handleRetry = () => {
  store.silentLogin()
}
</script>

<style lang="less" src="./index.less" module="styles"></style>
