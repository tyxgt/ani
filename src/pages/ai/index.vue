<template>
  <view :class="styles.aiPage">
    <view :class="styles.aiHeader">
      <image :class="styles.aiAvatar" :src="pandaUrl" mode="aspectFit" />
      <PinyinText text="AI小助手" />
    </view>
    <view :class="styles.aiContent">
      <PinyinText text="大熊猫博士随时为您服务！" />
    </view>
    <CustomTabBar :current="1" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomTabBar from '../../components/CustomTabBar'
import PinyinText from '../../components/PinyinText'
import { AI_PANDA_URL } from '../../constants'

const pandaUrl = ref(AI_PANDA_URL)
</script>

<style lang="less" src="./index.less" module="styles"></style>