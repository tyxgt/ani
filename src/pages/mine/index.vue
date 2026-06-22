<template>
  <view class="mine-page">
    <view class="user-info">
      <image class="avatar" src="https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20panda%20avatar%20cartoon%20style&image_size=square" mode="aspectFit" />
      <text class="nickname">小探险家</text>
    </view>
    <view class="menu-list">
      <view class="menu-item" v-for="item in menuList" :key="item.id">
        <text>{{ item.name }}</text>
        <text class="arrow">></text>
      </view>
    </view>
    <CustomTabBar :current="3" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomTabBar from '../../components/CustomTabBar.vue'
const menuList = ref([
  { id: 1, name: '我的收藏' },
  { id: 2, name: '学习记录' },
  { id: 3, name: '设置' },
  { id: 4, name: '关于我们' },
])
</script>

<style lang="less" src="./index.less"></style>