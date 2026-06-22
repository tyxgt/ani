<template>
  <view class="ai-page">
    <view class="ai-header">
      <image class="ai-avatar" :src="pandaUrl" mode="aspectFit" />
      <text class="ai-title">AI小助手</text>
    </view>
    <view class="ai-content">
      <text>大熊猫博士随时为您服务！</text>
    </view>
    <CustomTabBar :current="1" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomTabBar from '../../components/CustomTabBar.vue'
const pandaUrl = ref('https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20panda%20wearing%20doctor%20coat%20stethoscope%20friendly%20waving%20cartoon%20style%20transparent%20background&image_size=square')
</script>

<style lang="less" src="./index.less"></style>