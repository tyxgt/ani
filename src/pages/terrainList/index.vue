<template>
  <AuthGate>
  <view :class="styles.terrainListPage">
    <!-- 自定义导航栏 -->
    <view :class="styles.listNavHeader">
      <view :class="styles.backBtn" @click="goBack" @tap="goBack">
        <image :class="styles.backIcon" src="/static/icons/back.svg" mode="aspectFit" />
      </view>
      <view :class="styles.headerTitle">
        <PinyinText
          :text="'地形百科'"
          :char-style="{ fontSize: '16px', fontWeight: 'bold', color: '#2E7D32' }"
          :pinyin-style="{ fontSize: '12px', color: '#66BB6A' }"
        />
      </view>
      <view :class="styles.headerPlaceholder"></view>
    </view>

    <!-- 滚动内容区域 -->
    <scroll-view scroll-y :class="styles.scrollView">
      <CardSkeleton v-if="loading" />
      <view v-else :class="styles.terrainList">
        <view
          v-for="item in terrainList"
          :key="item.id"
          :class="styles.terrainCard"
          @click="onTerrainClick(item)"
        >
          <image :class="styles.terrainImg" :src="item.image" mode="aspectFill" lazy-load="true" />
          <view :class="styles.terrainInfo">
            <PinyinText
              :text="item.name"
              displayMode="horizontal"
              align="left"
              :char-style="{ fontSize: '18px', fontWeight: 'bold' }"
              :pinyin-style="{ fontSize: '13px' }"
            />
            <text :class="styles.terrainDesc">{{ item.features }}</text>
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
import { TERRAIN_DETAILS } from '../../data/learnDetails'
import { callFunction } from '../../utils/cloud'
import type { TerrainItem } from '../../types'

const terrainList = ref<TerrainItem[]>([])
const loading = ref(true)

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/learn/index' })
  }
}

function onTerrainClick(item: TerrainItem) {
  uni.navigateTo({
    url: '/pages/terrainDetail/index?name=' + encodeURIComponent(item.name),
  })
}

async function loadData() {
  loading.value = true
  try {
    const res = await callFunction('getTerrainList')
    if (res.code === 0 && res.data) {
      terrainList.value = res.data
    } else {
      uni.showToast({ title: '加载失败，请检查网络', icon: 'none' })
      terrainList.value = Object.values(TERRAIN_DETAILS)
    }
  } catch (error) {
    console.error('加载地形数据失败:', error)
    uni.showToast({ title: '加载失败，请检查网络', icon: 'none' })
    terrainList.value = Object.values(TERRAIN_DETAILS)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="less" src="./index.less" module="styles"></style>
