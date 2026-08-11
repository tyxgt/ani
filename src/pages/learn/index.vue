<template>
  <view :class="styles.learnPage">
    <view :class="styles.header">
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

    <CustomTabBar :current="1" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
import { preloadLearnData } from '../../utils/preload'
import type { LearnCardItem, KnowledgeCategory } from '../../types'

const categories = ref<KnowledgeCategory[]>(KNOWLEDGE_CATEGORIES)
const animals = ref(KNOWLEDGE_ANIMALS)
const terrains = ref(Object.values(TERRAIN_DETAILS))
const climates = ref(Object.values(CLIMATE_DETAILS))
const activeCategory = ref(3)
const loading = ref(true)

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
</script>

<style lang="less" src="./index.less" module="styles"></style>
