<template>
  <view :class="styles.learnPage">
    <view :class="styles.header">
      <view :class="styles.titleRow">
        <!-- <text :class="styles.starIcon">⭐</text> -->
        <text :class="styles.pageTitle">动物知识库</text>
        <!-- <text :class="styles.leafIcon">🌿</text> -->
      </view>
    </view>

    <view :class="styles.content">
      <view :class="styles.sideNav">
        <view v-for="cat in categories" :key="cat.id"
          :class="[styles.navItem, { [styles.navItemActive]: activeCategory === cat.id }]" :style="{
            '--nav-color': cat.color,
            '--nav-bg': cat.bgColor,
          }" @click="activeCategory = cat.id">
          <PinyinText :class="styles.navName" :text="cat.name"
            :char-style="{ fontSize: '18px', fontWeight: 'bold', color: 'var(--nav-color)' }"
            :pinyin-style="{ fontSize: '12px', color: 'var(--nav-color)' }" />
          <!-- <view v-if="activeCategory === cat.id" :class="styles.navArrow"></view> -->
        </view>
      </view>

      <scroll-view scroll-y :class="styles.animalList">
        <view v-for="animal in animals" :key="animal.id" :class="styles.animalCard"
          :style="{ '--card-border': animal.borderColor }">
          <image :class="styles.animalImg" :src="animal.image" mode="aspectFill" />
          <view :class="styles.animalInfo">
            <view :class="styles.animalNameRow">
              <PinyinText :text="animal.name" displayMode="horizontal" align="left"
                :char-style="{ fontSize: '14px', fontWeight: 'bold', color: '#333' }"
                :pinyin-style="{ fontSize: '12px', color: '#666' }" />
              <!-- <text :class="styles.leafSmall">🌿</text> -->
            </view>
            <view :class="styles.protectionTag" :style="{
              backgroundColor: animal.protectionBgColor,
              borderColor: animal.borderColor,
            }">
              <!-- <text :class="styles.shieldIcon">🛡️</text> -->
              <text :class="styles.protectionText" :style="{ color: animal.protectionTextColor }">
                {{ animal.protectionLevel }}
              </text>
            </view>
          </view>
          <!-- <text :class="styles.arrowIcon" :style="{ color: animal.borderColor }">›</text> -->
        </view>
        <view :class="styles.listBottom"></view>
      </scroll-view>
    </view>

    <CustomTabBar :current="2" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomTabBar from '../../components/CustomTabBar'
import PinyinText from '../../components/PinyinText'
import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_ANIMALS } from '../../constants'

const categories = ref(KNOWLEDGE_CATEGORIES)
const animals = ref(KNOWLEDGE_ANIMALS)
const activeCategory = ref(3)
</script>

<style lang="less" src="./index.less" module="styles"></style>