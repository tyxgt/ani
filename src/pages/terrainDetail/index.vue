<template>
  <view :class="styles.detailPage" :style="{ '--detail-bg': detail.pageBg }">
    <!-- 自定义导航栏 -->
    <view :class="styles.detailNavHeader">
      <view :class="styles.backBtn" @click="goBack" @tap="goBack">
        <image :class="styles.backIcon" src="/static/icons/back.svg" mode="aspectFit" />
      </view>
      <view :class="styles.headerTitle">
        <PinyinText
          :text="detail.name"
          :char-style="{ fontSize: '16px', fontWeight: 'bold', color: '#333' }"
          :pinyin-style="{ fontSize: '12px', color: '#666' }"
        />
      </view>
      <view :class="styles.headerPlaceholder"></view>
    </view>

    <scroll-view scroll-y :class="styles.scrollView">
      <!-- 顶部大图 -->
      <view :class="styles.heroImageWrap">
        <image :class="styles.heroImage" :src="detail.image" mode="aspectFill" />
      </view>

      <!-- 标题与拼音 -->
      <view :class="styles.titleSection">
        <PinyinText
          :text="detail.name"
          :char-style="{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#2E7D32',
          }"
          :pinyin-style="{ fontSize: '16px', color: '#81C784' }"
        />
      </view>

      <!-- 4 个属性卡片 -->
      <view :class="styles.attributeCards">
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[0] }"
        >
          <view :class="styles.cardIcon">🏔️</view>
          <PinyinText
            :text="'地形特征'"
            :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#2E7D32' }"
            :pinyin-style="{ fontSize: '10px', color: '#66BB6A' }"
          />
          <text :class="styles.cardValue">{{ detail.features }}</text>
        </view>
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[1] }"
        >
          <view :class="styles.cardIcon">❄️</view>
          <PinyinText
            :text="'气候'"
            :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#E65100' }"
            :pinyin-style="{ fontSize: '10px', color: '#FFB74D' }"
          />
          <text :class="styles.cardValue">{{ detail.climate }}</text>
        </view>
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[2] }"
        >
          <view :class="styles.cardIcon">🌲</view>
          <PinyinText
            :text="'植被'"
            :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#1565C0' }"
            :pinyin-style="{ fontSize: '10px', color: '#64B5F6' }"
          />
          <text :class="styles.cardValue">{{ detail.vegetation }}</text>
        </view>
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[3] }"
        >
          <view :class="styles.cardIcon">📍</view>
          <PinyinText
            :text="'代表地區'"
            :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#C2185B' }"
            :pinyin-style="{ fontSize: '10px', color: '#F48FB1' }"
          />
          <text :class="styles.cardValue">{{ detail.region }}</text>
        </view>
      </view>

      <!-- 总结横幅 -->
      <view :class="styles.summaryBanner">
        <text :class="styles.bannerIcon">{{ detail.bannerIcon }}</text>
        <text :class="styles.bannerText">{{ detail.summary }}</text>
      </view>

      <!-- 底部双按钮 -->
      <view :class="styles.actionBar">
        <view :class="[styles.actionBtn, styles.listenBtn]" @click="onListen" @tap="onListen">
          <text :class="styles.actionIcon">🔊</text>
          <text>听介绍</text>
        </view>
        <view :class="[styles.actionBtn, styles.askBtn]" @click="onAsk" @tap="onAsk">
          <text :class="styles.actionIcon">🤖</text>
          <text>问博士</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PinyinText from '../../components/PinyinText'
import { TERRAIN_DETAILS } from '../../data/learnDetails'
import { callFunction } from '../../utils/cloud'
import { TERRAIN_DISPLAY_CONFIG } from '../../constants'
import type { TerrainItem } from '../../types'

const detail = ref<TerrainItem>(TERRAIN_DETAILS['山地'])

const cardBg = computed(() => [
  '#E8F5E9', // 地形特征 - 绿
  '#FFF8E1', // 气候 - 黄
  '#E3F2FD', // 植被 - 蓝
  '#FCE4EC', // 代表地区 - 粉
])

const displayConfig = computed(() => {
  return TERRAIN_DISPLAY_CONFIG[detail.value.name] || {
    bannerIcon: '🏔️',
    pageBg: '#FFF8E1',
  }
})

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/learn/index' })
  }
}

function onListen() {
  uni.showToast({ title: '语音介绍开发中', icon: 'none' })
}

function onAsk() {
  uni.switchTab({ url: '/pages/ai/index' })
}

async function loadDetail(name: string) {
  try {
    const res = await callFunction('getTerrainDetail', { name })
    if (res.code === 0 && res.data) {
      const config = TERRAIN_DISPLAY_CONFIG[name] || {
        bannerIcon: '🏔️',
        pageBg: '#FFF8E1',
      }
      detail.value = {
        ...res.data,
        pinyin: '',
        bannerIcon: config.bannerIcon,
        pageBg: config.pageBg,
      }
    }
  } catch (error) {
    console.error('加载地形详情失败:', error)
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.options || {}
  const name = options.name || '山地'

  loadDetail(name)

  if (!detail.value || !detail.value.id) {
    detail.value = TERRAIN_DETAILS[name] || TERRAIN_DETAILS['山地']
  }
})
</script>

<style lang="less" src="./index.less" module="styles"></style>
