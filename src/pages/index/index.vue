<template>
  <view class="home-page">
    <image class="background" :src="backgroundUrl" mode="aspectFill" />
    
    <view class="audio-btn" :style="{ backgroundImage: `url(${audioIconUrl})` }" @click="toggleAudio"></view>
    
    <image class="panda" :src="pandaUrl" mode="aspectFit" />
    
    <view class="main-btn" @click="startExplore">
      <image class="btn-icon" :src="btnIconUrl" mode="aspectFit" />
      <text class="btn-text">开始探索吧！</text>
    </view>
    
    <CustomTabBar :current="0" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomTabBar from '../../components/CustomTabBar.vue'

const backgroundUrl = ref('../../static/image.png')
const pandaUrl = ref('../../static/doctor.png')
const audioIconUrl = ref('../../static/icons/voiceSwitch.png')
const btnIconUrl = ref('../../static/icons/moutain.png')

const isAudioPlaying = ref(false)

const toggleAudio = () => {
  isAudioPlaying.value = !isAudioPlaying.value
  if (isAudioPlaying.value) {
    uni.showToast({ title: '播放中', icon: 'none' })
  } else {
    uni.showToast({ title: '已暂停', icon: 'none' })
  }
}

const startExplore = () => {
  uni.showToast({ title: '开始探索！', icon: 'none' })
}
</script>

<style lang="less" src="./index.less"></style>