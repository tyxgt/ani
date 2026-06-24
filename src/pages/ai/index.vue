<template>
  <view class="ai-page">
    <view class="ai-header">
      <image class="ai-avatar" :src="pandaUrl" mode="aspectFit" />
      <PinyinText text="AI小助手" />
    </view>
    <view class="ai-content">
      <PinyinText text="大熊猫博士随时为您服务！" />
    </view>
    <CustomTabBar :current="1" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomTabBar from '../../components/CustomTabBar'
import PinyinText from '../../components/PinyinText'

const pandaUrl = ref('https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20panda%20wearing%20doctor%20coat%20stethoscope%20friendly%20waving%20cartoon%20style%20transparent%20background&image_size=square')
</script>

<style lang="less" src="./index.less"></style>