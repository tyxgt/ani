<template>
  <AuthGate>
  <view :class="styles.regionDetailPage">
    <!-- 自定义导航栏头部 -->
    <view :class="styles.regionNavHeader">
      <view :class="styles.backBtn" @click="goBack">
        <image :class="styles.backIcon" src="/static/icons/back.svg" mode="aspectFit" />
      </view>
      <view :class="styles.headerTitle">
        <PinyinText
          :text="pageTitle"
          :char-style="{ fontSize: '16px', fontWeight: 'bold', color: '#333' }"
          :pinyin-style="{ fontSize: '12px', color: '#666' }"
        />
      </view>
      <view :class="styles.headerPlaceholder"></view>
    </view>

    <!-- 可滚动内容区域 -->
    <scroll-view scroll-y :class="styles.scrollView">
      <template v-if="!loading">
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
              char-group-width="46px"
              :char-style="{ fontSize: '26px', fontWeight: 'bold', color: '#2E7D32', lineHeight: '1.2' }"
              :pinyin-style="{ fontSize: '16px', color: '#81C784', lineHeight: '1.2' }"
            />
            <text :class="styles.titleIcon">🍃</text>
          </view>
          <view :class="styles.introText">
            <PinyinText
              :text="regionDetail.description"
              :char-style="{ fontSize: '18px', color: '#5D4037', lineHeight: '1.2' }"
              :pinyin-style="{ fontSize: '12px', color: '#A1887F', lineHeight: '1.2' }"
            />
          </view>
        </view>

        <view :class="styles.divider">
          <view :class="styles.dashLine"></view>
          <text :class="styles.dividerIcon">🏔️</text>
          <PinyinText
            :text="'地理特色'"
            char-group-width="42px"
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
            <PinyinText
              :text="feature.name"
              :char-style="{ fontSize: '16px', fontWeight: 'bold', color: '#2E7D32' }"
              :pinyin-style="{ fontSize: '8px', color: '#81C784' }"
            />
          </view>
        </view>

        <view :class="styles.divider">
          <view :class="styles.dashLine"></view>
          <text :class="styles.dividerIcon">📍</text>
          <PinyinText
            :text="'包含省份'"
            char-group-width="42px"
            :char-style="{ fontSize: '26px', fontWeight: 'bold', color: '#2E7D32' }"
            :pinyin-style="{ fontSize: '14px', color: '#81C784' }"
          />
          <view :class="styles.dashLine"></view>
        </view>

        <view :class="styles.provincesWrap">
          <view
            :class="styles.provinceChip"
            v-for="(province, index) in regionDetail.provinces"
            :key="index"
          >
            <PinyinText
              :text="province"
              display-mode="horizontal"
              :char-style="{ fontSize: '16px', fontWeight: 'bold', color: '#2E7D32' }"
              :pinyin-style="{ fontSize: '10px', color: '#81C784' }"
            />
          </view>
        </view>

        <view :class="styles.bottomSpacer"></view>
      </template>

      <view v-else :class="styles.loadingWrap">
        <view :class="styles.loadingSkeleton" />
        <text :class="styles.loadingText">加载中...</text>
      </view>
    </scroll-view>

    <!-- <CustomTabBar :current="0" /> -->
  </view>
  </AuthGate>
</template>

<script setup lang="ts">
import AuthGate from '../../components/AuthGate'
import { ref, computed, onMounted } from 'vue'
import PinyinText from '../../components/PinyinText'
import { REGION_IMAGE_URLS } from '../../constants'
import { REGION_DETAILS } from '../../data/regionDetail'
import { callFunction } from '../../utils/cloud'
import type { RegionDetail } from '../../types'

const regionDetail = ref<RegionDetail>(REGION_DETAILS['西南地区'])
const loading = ref(true)

const pageTitle = computed(() => regionDetail.value.name || '地区详情')

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

async function fetchRegionDetail(regionName: string) {
  loading.value = true
  try {
    const result = await callFunction('getRegionDetail', { name: regionName })
    if (result && result.code === 0 && result.data) {
      regionDetail.value = result.data
    } else {
      console.warn('[RegionDetail] 云函数返回失败，使用本地数据:', result?.msg)
      regionDetail.value = REGION_DETAILS[regionName] || REGION_DETAILS['西南地区']
    }
  } catch (err) {
    console.warn('[RegionDetail] 云函数调用失败，使用本地数据:', err)
    regionDetail.value = REGION_DETAILS[regionName] || REGION_DETAILS['西南地区']
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.options || {}
  // options.name 正常导航时会被小程序框架自动 decode；但开发者工具"编译模式"里手动配置的
  // 启动参数是原样透传的，如果那里填的是从 URL 里拷出来的已编码字符串（如 %E5%8D%8E%E4%B8%AD%E5%9C%B0%E5%8C%BA），
  // 就会带着 % 编码原样传给云函数，导致按精确匹配查库查不到。这里兜底再 decode 一次，
  // 未编码的普通文本 decode 是无副作用的
  let regionName = options.name || '西南地区'
  try {
    regionName = decodeURIComponent(regionName)
  } catch (e) {
    // 不是合法的 URI 编码，说明本来就是普通文本，原样使用即可
  }
  fetchRegionDetail(regionName)
})
</script>

<style lang="less" src="./index.less" module="styles"></style>
