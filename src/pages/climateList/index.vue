<template>
  <AuthGate>
  <view :class="styles.climateListPage">
    <!-- 自定义导航栏 -->
    <view :class="styles.listNavHeader" :style="navHeaderStyle">
      <view :class="styles.backBtn" @click="goBack" @tap="goBack">
        <image :class="styles.backIcon" src="/static/icons/back.svg" mode="aspectFit" />
      </view>
      <view :class="styles.headerTitle">
        <PinyinText
          :text="'气候百科'"
          :char-style="{ fontSize: '16px', fontWeight: 'bold', color: '#1565C0' }"
          :pinyin-style="{ fontSize: '12px', color: '#42A5F5' }"
        />
      </view>
      <view :class="styles.headerPlaceholder"></view>
    </view>

    <!-- 滚动内容区域 -->
    <scroll-view scroll-y :class="styles.scrollView">
      <CardSkeleton v-if="loading" />
      <view v-else :class="styles.climateList">
        <view
          v-for="item in climateList"
          :key="item.id"
          :class="styles.climateCard"
          @click="onClimateClick(item)"
        >
          <image :class="styles.climateImg" :src="item.image" mode="aspectFill" lazy-load="true" />
          <view :class="styles.climateInfo">
            <PinyinText
              :text="item.name"
              displayMode="horizontal"
              align="left"
              :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#333' }"
              :pinyin-style="{ fontSize: '13px', color: '#666' }"
            />
            <text :class="styles.climateDesc">{{ item.temperature }}</text>
          </view>
          <text :class="styles.arrowIcon">›</text>
        </view>
        <view :class="styles.listBottom"></view>
      </view>
    </scroll-view>
  </view>
  </AuthGate>
</template>

<script setup lang="ts">
import AuthGate from '../../components/AuthGate'
import { ref, onMounted } from 'vue'
import PinyinText from '../../components/PinyinText'
import CardSkeleton from '../../components/CardSkeleton'
import { CLIMATE_DETAILS } from '../../data/learnDetails'
import { callFunction } from '../../utils/cloud'
import { getCustomNavStyle } from '../../utils/navBar'
import type { ClimateItem } from '../../types'

const navHeaderStyle = getCustomNavStyle()

const climateList = ref<ClimateItem[]>([])
const loading = ref(true)

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/learn/index' })
  }
}

function onClimateClick(item: ClimateItem) {
  uni.navigateTo({
    url: '/pages/climateDetail/index?name=' + encodeURIComponent(item.name),
  })
}

async function loadData() {
  loading.value = true
  try {
    const res = await callFunction('getClimateList')
    if (res.code === 0 && res.data) {
      climateList.value = res.data
    } else {
      uni.showToast({ title: '加载失败，请检查网络', icon: 'none' })
      climateList.value = Object.values(CLIMATE_DETAILS)
    }
  } catch (error) {
    console.error('加载气候数据失败:', error)
    uni.showToast({ title: '加载失败，请检查网络', icon: 'none' })
    climateList.value = Object.values(CLIMATE_DETAILS)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="less" src="./index.less" module="styles"></style>
