<template>
  <view :class="styles.wrap">
    <view :class="styles.spinner" />
    <text :class="styles.text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string
  }>(),
  {
    text: '加载中...',
  }
)
</script>

<style lang="less" src="./index.less" module="styles"></style>
