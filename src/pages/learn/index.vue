<template>
  <view class="learn-page">
    <PinyinText text="学习中心" char-class="learn-title" />
    <view class="learn-grid">
      <view class="learn-item" v-for="item in learnList" :key="item.id">
        <image class="learn-icon" :src="item.icon" mode="aspectFit" />
        <PinyinText :text="item.name" />
      </view>
    </view>
    <CustomTabBar :current="2" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomTabBar from '../../components/CustomTabBar'
import PinyinText from '../../components/PinyinText'

const learnList = ref([
  { id: 1, name: '动物百科', icon: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20animal%20panda%20icon%20cartoon&image_size=square' },
  { id: 2, name: '地理知识', icon: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=mountain%20globe%20geography%20icon%20cartoon&image_size=square' },
  { id: 3, name: '有趣故事', icon: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=book%20story%20fairy%20tale%20icon%20cartoon&image_size=square' },
  { id: 4, name: '趣味问答', icon: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=question%20quiz%20puzzle%20icon%20cartoon&image_size=square' },
])
</script>

<style lang="less" src="./index.less"></style>