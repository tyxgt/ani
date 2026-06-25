<template>
  <view :class="styles.learnPage">
    <view :class="styles.learnTitleWrapper">
      <PinyinText text="学习中心" />
    </view>
    <view :class="styles.learnGrid">
      <view :class="styles.learnItem" v-for="item in learnList" :key="item.id">
        <image :class="styles.learnIcon" :src="item.icon" mode="aspectFit" />
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
import { LEARN_LIST } from '../../constants'

const learnList = ref([...LEARN_LIST])
</script>

<style lang="less" src="./index.less" module="styles"></style>