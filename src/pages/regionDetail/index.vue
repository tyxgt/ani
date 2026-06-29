<template>
  <view :class="styles.regionDetailPage" v-if="regionDetail">
    <scroll-view scroll-y :class="styles.scrollView">
      <view :class="styles.header">
        <view :class="styles.backBtn" @click="goBack">
          <text :class="styles.backIcon">←</text>
        </view>
        <view :class="styles.titleWrap">
          <PinyinText
            :text="regionDetail.name"
            display-mode="horizontal"
            :char-style="{ fontSize: '36px', fontWeight: 'bold' }"
            :pinyin-style="{ fontSize: '18px' }"
            :char-class="styles.titleChar"
          />
        </view>
        <view :class="styles.locationBtn">
          <text :class="styles.locationIcon">📍</text>
        </view>
      </view>

      <view :class="styles.heroImageWrap">
        <image
          :class="styles.heroImage"
          :src="REGION_IMAGE_URLS[regionDetail.name]"
          mode="aspectFill"
        />
      </view>

      <view :class="styles.introCard">
        <view :class="styles.sectionTitle">
          <text :class="styles.titleIcon">🍃</text>
          <text :class="styles.titleText">地區介紹</text>
          <text :class="styles.titleIcon">🍃</text>
        </view>
        <text :class="styles.introText">
          {{ regionDetail.description }}
        </text>
      </view>

      <view :class="styles.divider">
        <view :class="styles.dashLine"></view>
        <text :class="styles.dividerIcon">🏔️</text>
        <text :class="styles.dividerText">地理特色</text>
        <view :class="styles.dashLine"></view>
      </view>

      <view :class="styles.geoFeatures">
        <view
          :class="styles.geoFeatureCard"
          v-for="(feature, index) in regionDetail.geoFeatures"
          :key="index"
          :style="{ background: feature.bgColor }"
        >
          <text :class="styles.geoFeatureIcon">{{ feature.icon }}</text>
          <text :class="styles.geoFeatureName">{{ feature.name }}</text>
        </view>
      </view>

      <view :class="styles.divider">
        <view :class="styles.dashLine"></view>
        <text :class="styles.dividerIcon">🐾</text>
        <text :class="styles.dividerText">代表動物</text>
        <view :class="styles.dashLine"></view>
      </view>

      <scroll-view scroll-x :class="styles.animalsScroll" show-scrollbar="false">
        <view :class="styles.animalsList">
          <view
            :class="styles.animalCard"
            v-for="(animal, index) in regionDetail.animals"
            :key="index"
          >
            <view :class="styles.animalImageWrap">
              <image
                :class="styles.animalImage"
                :src="animal.image"
                mode="aspectFill"
              />
            </view>
            <view :class="styles.animalInfo">
              <PinyinText
                :text="animal.name"
                display-mode="horizontal"
                :char-style="{ fontSize: '18px', fontWeight: 'bold' }"
                :pinyin-style="{ fontSize: '12px' }"
              />
              <view
                :class="styles.animalLocation"
                :style="{ background: animal.locationColor + '20', color: animal.locationColor }"
              >
                <text :class="styles.locationDot">📍</text>
                <text :class="styles.locationText">{{ animal.location }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view :class="styles.bottomSpacer"></view>
    </scroll-view>

    <CustomTabBar :current="0" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CustomTabBar from '../../components/CustomTabBar'
import PinyinText from '../../components/PinyinText'
import { REGION_IMAGE_URLS } from '../../constants'
import { REGION_DETAILS } from '../../data/regionDetail'
import type { RegionDetail } from '../../types'

const regionDetail = ref<RegionDetail | null>(null)

const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.options || {}
  const regionName = options.name || '西南地区'
  regionDetail.value = REGION_DETAILS[regionName] || REGION_DETAILS['西南地区']
})
</script>

<style lang="less" src="./index.less" module="styles"></style>
