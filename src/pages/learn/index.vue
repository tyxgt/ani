<template>
  <AuthGate>
  <view :class="styles.learnPage">
    <view :class="styles.header" :style="navHeaderStyle">
      <view :class="styles.titleRow">
        <image
          :class="styles.pageTitle"
          src="https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/learn/baike.png"
          mode="aspectFit"
        />
      </view>
    </view>

    <view :class="styles.content">
      <view :class="styles.sideNav">
        <view v-for="cat in categories" :key="cat.id"
          :class="[styles.navItem, { [styles.navItemActive]: activeCategory === cat.id }]"
          :style="{
            '--nav-color': cat.color,
          }" @click="onCategoryClick(cat)">
          <image :class="styles.navIcon" :src="cat.icon" mode="aspectFit" />
          <PinyinText :class="styles.navName" :text="cat.name"
            :char-style="{ fontSize: '14px', fontWeight: 'bold', color: 'var(--nav-color)' }"
            :pinyin-style="{ fontSize: '10px', color: 'var(--nav-color)' }" />
        </view>
      </view>

      <scroll-view scroll-y :class="styles.animalList" :scroll-top="0">
        <CardSkeleton v-if="loading" />
        <template v-else>
          <LearnCard
            v-for="card in cardList"
            :key="activeCategory + '-' + card.id"
            :item="card"
            @click="onCardClick(card)"
          />
          <view :class="styles.listBottom"></view>
        </template>
      </scroll-view>
    </view>

    <CustomTabBar current="/pages/learn/index" />
  </view>
  </AuthGate>
</template>

<script setup lang="ts">
import AuthGate from '../../components/AuthGate'
import { ref, computed, onMounted, watch } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import CustomTabBar from '../../components/CustomTabBar'
import PinyinText from '../../components/PinyinText'
import LearnCard from '../../components/LearnCard'
import CardSkeleton from '../../components/CardSkeleton'
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_ANIMALS,
  PROTECTION_COLOR_MAP,
} from '../../constants'
import { TERRAIN_DETAILS, CLIMATE_DETAILS } from '../../data/learnDetails'
import { preloadLearnData, invalidateLearnData } from '../../utils/preload'
import { getCustomNavStyle } from '../../utils/navBar'
import { useUserStore } from '../../stores/user'
import type { LearnCardItem, KnowledgeCategory } from '../../types'

const categories = ref<KnowledgeCategory[]>(KNOWLEDGE_CATEGORIES)
const animals = ref(KNOWLEDGE_ANIMALS)
const terrains = ref(Object.values(TERRAIN_DETAILS))
const climates = ref(Object.values(CLIMATE_DETAILS))
const activeCategory = ref(1)
const loading = ref(true)

const navHeaderStyle = getCustomNavStyle()

// ─── 登录态变化触发的数据重载 ────────────────────────────────────
// 登录成功（isLoggedIn false→true）后清空预加载缓存并重新拉取数据。
const userStore = useUserStore()
const { isLoggedIn } = storeToRefs(userStore)
// 标记是否需要重载：watch 在隐藏态触发时置 true，待 onShow 时执行
const needReload = ref(false)
// 标记页面当前是否处于显示态：控制 watch 内是否立即拉取，避免隐藏态并发请求
const isActive = ref(false)

const cardList = computed<LearnCardItem[]>(() => {
  if (activeCategory.value === 1) {
    return terrains.value.map(item => ({
      id: item.id,
      name: item.name,
      image: item.image,
      tagText: item.features || item.summary || item.description || '',
      tagBgColor: '#E8F5E9',
      tagBorderColor: '#66BB6A',
      tagTextColor: '#2E7D32',
      borderColor: '#66BB6A',
    }))
  }
  if (activeCategory.value === 2) {
    return climates.value.map(item => ({
      id: item.id,
      name: item.name,
      image: item.image,
      tagText: item.climate,
      tagBgColor: '#E3F2FD',
      tagBorderColor: '#42A5F5',
      tagTextColor: '#1565C0',
      borderColor: '#42A5F5',
    }))
  }
  return animals.value.map(item => ({
    id: item.id,
    name: item.name,
    image: item.image,
    tagText: item.protectionLevel,
    tagBgColor: item.protectionBgColor || '#F5F5F5',
    tagBorderColor: item.borderColor || '#E0E0E0',
    tagTextColor: item.protectionTextColor || '#757575',
    borderColor: item.borderColor || '#E0E0E0',
  }))
})

function onCategoryClick(cat: { id: number; name: string }) {
  activeCategory.value = cat.id
}

function onCardClick(card: LearnCardItem) {
  const name = encodeURIComponent(card.name)
  if (activeCategory.value === 1) {
    uni.navigateTo({ url: '/pages/terrainDetail/index?name=' + name })
  } else if (activeCategory.value === 2) {
    uni.navigateTo({ url: '/pages/climateDetail/index?name=' + name })
  } else {
    uni.navigateTo({ url: '/pages/animalDetail/index?name=' + name })
  }
}

async function loadData() {
  // 未登录时不发起请求（请求也只会 401），等登录成功后由 watch 或 onShow 触发重取
  if (!isLoggedIn.value) return
  loading.value = true
  try {
    const [catRes, terrainRes, climateRes, animalRes] = await preloadLearnData()

    if (catRes.code === 0 && catRes.data) {
      categories.value = catRes.data
    }

    if (terrainRes.code === 0 && terrainRes.data) {
      terrains.value = terrainRes.data
    }

    if (climateRes.code === 0 && climateRes.data) {
      climates.value = climateRes.data
    }

    if (animalRes.code === 0 && animalRes.data) {
      animals.value = animalRes.data.map((item: any) => ({
        ...item,
        protectionBgColor:
          PROTECTION_COLOR_MAP[item.protectionLevel]?.bgColor || '#F5F5F5',
        protectionTextColor:
          PROTECTION_COLOR_MAP[item.protectionLevel]?.textColor || '#757575',
        borderColor:
          PROTECTION_COLOR_MAP[item.protectionLevel]?.borderColor || '#E0E0E0',
      }))
    }
  } catch (error) {
    console.error('加载知识库数据失败:', error)
    uni.showToast({ title: '加载失败，请检查网络', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// 登录态从 false→true 时（首次登录成功、401 自愈后重新登录）清空预加载缓存并重取
watch(isLoggedIn, (val, old) => {
  if (!old && val) {
    invalidateLearnData()
    needReload.value = true
    // 页面当前显示态则立即重载；隐藏态则等 onShow 时执行，避免并发
    if (isActive.value) {
      loadData()
      needReload.value = false
    }
  }
})

onShow(() => {
  isActive.value = true
  // 静默刷新会员状态：不弹提示，只是让 tabBar 上的 AI 入口能及时反映最新状态
  userStore.refreshMembership()
  // 兜底：watch 在隐藏态触发并置 needReload 时，切回本 tab 执行重载
  if (needReload.value) {
    loadData()
    needReload.value = false
  }
})

onHide(() => {
  isActive.value = false
})
</script>

<style lang="less" src="./index.less" module="styles"></style>
