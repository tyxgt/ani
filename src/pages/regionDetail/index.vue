<template>
  <view :class="styles.regionDetailPage" v-if="regionDetail">
    <scroll-view scroll-y :class="styles.scrollView">
      <view :class="styles.header">
        <view :class="styles.backBtn" @click="goBack">
          <image :class="styles.backIcon" src="/static/icons/back.svg" mode="aspectFit" />
        </view>
        <view :class="styles.titleWrap">
          <PinyinText
            :text="regionDetail.name"
            display-mode="horizontal"
            :char-style="{ fontSize: '20px', fontWeight: 'bold' }"
            :pinyin-style="{ fontSize: '18px' }"
            :char-class="styles.titleChar"
          />
        </view>
        <!-- <view :class="styles.locationBtn">
          <text :class="styles.locationIcon">📍</text>
        </view> -->
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
          <PinyinText
            :text="'地区介绍'"
            :char-style="{ fontSize: '26px', fontWeight: 'bold', color: '#2E7D32', lineHeight: '1.2' }"
            :pinyin-style="{ fontSize: '16px', color: '#81C784', lineHeight: '1.2' }"
          />
          <text :class="styles.titleIcon">🍃</text>
        </view>
        <view :class="styles.introText">
          <PinyinText
            :text="regionDetail.description"
            :char-style="{ fontSize: '18px', color: '#5D4037' }"
            :pinyin-style="{ fontSize: '12px', color: '#A1887F' }"
          />
        </view>
      </view>

      <view :class="styles.divider">
        <view :class="styles.dashLine"></view>
        <text :class="styles.dividerIcon">🏔️</text>
        <PinyinText
          :text="'地理特色'"
          :char-style="{ fontSize: '26px', fontWeight: 'bold', color: '#2E7D32' }"
          :pinyin-style="{ fontSize: '14px', color: '#81C784' }"
        />
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
          <PinyinText
            :text="feature.name"
            :char-style="{ fontSize: '14px', fontWeight: 'bold', color: '#2E7D32' }"
            :pinyin-style="{ fontSize: '12px', color: '#81C784' }"
          />
        </view>
      </view>

      <view :class="styles.divider">
        <view :class="styles.dashLine"></view>
        <text :class="styles.dividerIcon">🐾</text>
        <PinyinText
          :text="'代表动物'"
          :char-style="{ fontSize: '26px', fontWeight: 'bold', color: '#2E7D32' }"
          :pinyin-style="{ fontSize: '14px', color: '#81C784' }"
        />
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
                <PinyinText
                  :text="animal.location"
                  :char-style="{ fontSize: '13px', fontWeight: 'bold', color: animal.locationColor }"
                  :pinyin-style="{ fontSize: '10px', color: animal.locationColor, opacity: 0.7 }"
                />
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view :class="styles.bottomSpacer"></view>
    </scroll-view>

    <!-- <CustomTabBar :current="0" /> -->
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import CustomTabBar from '../../components/CustomTabBar'
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
