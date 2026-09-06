<template>
  <AuthGate>
  <view :class="styles.detailPage" :style="{ '--detail-bg': detail.pageBg }">
    <!-- 自定义导航栏 -->
    <view :class="styles.detailNavHeader" :style="navHeaderStyle">
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
      <LoadingSpinner v-if="loading && !detail.id" />
      <template v-else>
      <!-- 顶部大图 -->
      <view :class="styles.heroImageWrap">
        <image :class="styles.heroImage" :src="detail.image" mode="aspectFill" />
      </view>

      <!-- 标题与拼音 -->
      <!-- <view :class="styles.titleSection">
        <PinyinText
          :text="detail.name"
          :char-style="{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#2E7D32',
          }"
          :pinyin-style="{ fontSize: '16px', color: '#81C784' }"
        />
      </view> -->

      <!-- 4 个属性卡片 -->
      <view :class="styles.attributeCards">
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[0] }"
        >
          <view :class="styles.cardHeader">
            <view :class="styles.cardIcon">🏔️</view>
            <PinyinText
              :text="'地形特征'"
              :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#2E7D32' }"
              :pinyin-style="{ fontSize: '10px', color: '#66BB6A' }"
            />
          </view>
          <PinyinText
            :text="detail.features"
            :char-style="{ fontSize: '14px', color: '#555', lineHeight: '1.5' }"
            :pinyin-style="{ fontSize: '9px', color: '#999' }"
          />
        </view>
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[1] }"
        >
          <view :class="styles.cardHeader">
            <view :class="styles.cardIcon">❄️</view>
            <PinyinText
              :text="'气候'"
              :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#E65100' }"
              :pinyin-style="{ fontSize: '10px', color: '#FFB74D' }"
            />
          </view>
          <PinyinText
            :text="detail.climate"
            :char-style="{ fontSize: '14px', color: '#555', lineHeight: '1.5' }"
            :pinyin-style="{ fontSize: '9px', color: '#999' }"
          />
        </view>
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[2] }"
        >
          <view :class="styles.cardHeader">
            <view :class="styles.cardIcon">🌲</view>
            <PinyinText
              :text="'植被'"
              :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#1565C0' }"
              :pinyin-style="{ fontSize: '10px', color: '#64B5F6' }"
            />
          </view>
          <PinyinText
            :text="detail.vegetation"
            :char-style="{ fontSize: '14px', color: '#555', lineHeight: '1.5' }"
            :pinyin-style="{ fontSize: '9px', color: '#999' }"
          />
        </view>
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[3] }"
        >
          <view :class="styles.cardHeader">
            <view :class="styles.cardIcon">📍</view>
            <PinyinText
              :text="'代表地区'"
              :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#C2185B' }"
              :pinyin-style="{ fontSize: '10px', color: '#F48FB1' }"
            />
          </view>
          <PinyinText
            :text="detail.region"
            :char-style="{ fontSize: '14px', color: '#555', lineHeight: '1.5' }"
            :pinyin-style="{ fontSize: '9px', color: '#999' }"
          />
        </view>
      </view>

      <!-- 总结横幅 -->
      <view :class="styles.summaryBanner">
        <text :class="styles.bannerIcon">{{ detail.bannerIcon }}</text>
        <PinyinText
          :text="detail.summary"
          :char-style="{ fontSize: '20px', fontWeight: 'bold', color: '#AD1457', textShadow: '1px 1px 0 #fff' }"
          :pinyin-style="{ fontSize: '11px', color: '#F06292' }"
        />
      </view>

      <!-- "听介绍"/"问博士"（对话功能）由 AI_CHAT_ENABLED 开关 + 会员状态共同控制 -->
      <view v-if="AI_CHAT_ENABLED && isVip" :class="styles.actionBar">
        <view :class="[styles.actionBtn, styles.listenBtn]" @click="onListen" @tap="onListen">
          <text :class="styles.actionIcon">🔊</text>
          <PinyinText
            :text="'听介绍'"
            display-mode="horizontal"
            :char-style="{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }"
            :pinyin-style="{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }"
          />
        </view>
        <view :class="[styles.actionBtn, styles.askBtn]" @click="onAsk" @tap="onAsk">
          <text :class="styles.actionIcon">🤖</text>
          <PinyinText
            :text="'问博士'"
            display-mode="horizontal"
            :char-style="{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }"
            :pinyin-style="{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }"
          />
        </view>
      </view>
      </template>
    </scroll-view>
  </view>
  </AuthGate>
</template>

<script setup lang="ts">
import AuthGate from '../../components/AuthGate'
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import PinyinText from '../../components/PinyinText'
import LoadingSpinner from '../../components/LoadingSpinner'
import { TERRAIN_DETAILS } from '../../data/learnDetails'
import { callFunction } from '../../utils/cloud'
import { TERRAIN_DISPLAY_CONFIG, AI_CHAT_ENABLED } from '../../constants'
import { getCustomNavStyle } from '../../utils/navBar'
import { useUserStore } from '../../stores/user'
import { useChatStore } from '../../stores/chat'
import type { TerrainItem } from '../../types'

const { isVip } = storeToRefs(useUserStore())

const navHeaderStyle = getCustomNavStyle()

const detail = ref<TerrainItem>(TERRAIN_DETAILS['山地'])
const loading = ref(false)

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
  useChatStore().setPendingAsk({ entityType: '地形', entityName: detail.value.name })
  uni.switchTab({ url: '/pages/ai/index' })
}

async function loadDetail(name: string) {
  loading.value = true
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
    } else {
      uni.showToast({ title: '加载失败，请检查网络', icon: 'none' })
    }
  } catch (error) {
    console.error('加载地形详情失败:', error)
    uni.showToast({ title: '加载失败，请检查网络', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.options || {}
  // options.name 正常导航时会被小程序框架自动 decode；开发者工具"编译模式"里手动配置的
  // 启动参数是原样透传的，这里兜底再 decode 一次，避免带着 % 编码去查库查不到
  let name = options.name || '山地'
  try {
    name = decodeURIComponent(name)
  } catch (e) {
    // 不是合法的 URI 编码，说明本来就是普通文本，原样使用即可
  }

  loadDetail(name)

  if (!detail.value || !detail.value.id) {
    detail.value = TERRAIN_DETAILS[name] || TERRAIN_DETAILS['山地']
  }
})
</script>

<style lang="less" src="./index.less" module="styles"></style>
