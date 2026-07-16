<template>
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
      <view :class="styles.terrainList">
        <view
          v-for="item in terrainList"
          :key="item.id"
          :class="styles.terrainCard"
          @click="onTerrainClick(item)"
        >
          <image :class="styles.terrainImg" :src="item.image" mode="aspectFill" />
          <view :class="styles.terrainInfo">
            <PinyinText
              :text="item.name"
              displayMode="horizontal"
              align="left"
              :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#333' }"
              :pinyin-style="{ fontSize: '13px', color: '#666' }"
            />
            <text :class="styles.terrainDesc">{{ item.features }}</text>
          </view>
          <text :class="styles.arrowIcon">›</text>
        </view>
        <view :class="styles.listBottom"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PinyinText from '../../components/PinyinText'
import { TERRAIN_DETAILS } from '../../data/learnDetails'
import type { TerrainItem } from '../../types'

const terrainList = ref<TerrainItem[]>([])

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

onMounted(() => {
  terrainList.value = Object.values(TERRAIN_DETAILS)
})
</script>

<style lang="less" src="./index.less" module="styles"></style>
