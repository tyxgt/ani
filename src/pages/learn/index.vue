<template>
  <view :class="styles.learnPage">
    <view :class="styles.header">
      <view :class="styles.titleRow">
        <text :class="styles.pageTitle">动物知识库</text>
      </view>
    </view>

    <view :class="styles.content">
      <view :class="styles.sideNav">
        <view v-for="cat in categories" :key="cat.id"
          :class="[styles.navItem, { [styles.navItemActive]: activeCategory === cat.id }]" :style="{
            '--nav-color': cat.color,
            '--nav-bg': cat.bgColor,
          }" @click="onCategoryClick(cat)">
          <PinyinText :class="styles.navName" :text="cat.name"
            :char-style="{ fontSize: '14px', fontWeight: 'bold', color: 'var(--nav-color)' }"
            :pinyin-style="{ fontSize: '10px', color: 'var(--nav-color)' }" />
        </view>
      </view>

      <scroll-view scroll-y :class="styles.animalList">
        <LearnCard
          v-for="card in cardList"
          :key="card.id"
          :item="card"
          @click="onCardClick(card)"
        />
        <view :class="styles.listBottom"></view>
      </scroll-view>
    </view>

    <CustomTabBar :current="2" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CustomTabBar from '../../components/CustomTabBar'
import PinyinText from '../../components/PinyinText'
import LearnCard from '../../components/LearnCard'
import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_ANIMALS } from '../../constants'
import { TERRAIN_DETAILS, CLIMATE_DETAILS } from '../../data/learnDetails'
import type { LearnCardItem } from '../../types'

const categories = ref(KNOWLEDGE_CATEGORIES)
const animals = ref(KNOWLEDGE_ANIMALS)
const terrains = ref(Object.values(TERRAIN_DETAILS))
const climates = ref(Object.values(CLIMATE_DETAILS))
const activeCategory = ref(3)

const cardList = computed<LearnCardItem[]>(() => {
  if (activeCategory.value === 1) {
    return terrains.value.map(item => ({
      id: item.id,
      name: item.name,
      image: item.image,
      tagText: item.features,
      tagBgColor: '#E8F5E9',
      tagBorderColor: '#66BB6A',
      tagTextColor: '#2E7D32',
      // borderColor: '#66BB6A',
    }))
  }
  if (activeCategory.value === 2) {
    return climates.value.map(item => ({
      id: item.id,
      name: item.name,
      image: item.image,
      tagText: item.temperature,
      tagBgColor: '#E3F2FD',
      tagBorderColor: '#42A5F5',
      tagTextColor: '#1565C0',
      // borderColor: '#42A5F5',
    }))
  }
  return animals.value.map(item => ({
    id: item.id,
    name: item.name,
    image: item.image,
    tagText: item.protectionLevel,
    tagBgColor: item.protectionBgColor,
    tagBorderColor: item.borderColor,
    tagTextColor: item.protectionTextColor,
    // borderColor: item.borderColor,
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
</script>

<style lang="less" src="./index.less" module="styles"></style>
