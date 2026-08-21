<template>
  <AuthGate>
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
      <LoadingSpinner v-if="loading && !detail.id" />
      <template v-else>
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
          <view :class="styles.cardHeader">
            <view :class="styles.cardIcon">🎋</view>
            <PinyinText
              :text="'栖息地'"
              :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#2E7D32' }"
              :pinyin-style="{ fontSize: '10px', color: '#66BB6A' }"
            />
          </view>
          <PinyinText
            :text="detail.habitat"
            :char-style="{ fontSize: '14px', color: '#555', lineHeight: '1.5' }"
            :pinyin-style="{ fontSize: '9px', color: '#999' }"
          />
        </view>
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[1] }"
        >
          <view :class="styles.cardHeader">
            <view :class="styles.cardIcon">🎋</view>
            <PinyinText
              :text="'爱吃的食物'"
              :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#E65100' }"
              :pinyin-style="{ fontSize: '10px', color: '#FFB74D' }"
            />
          </view>
          <PinyinText
            :text="detail.food"
            :char-style="{ fontSize: '14px', color: '#555', lineHeight: '1.5' }"
            :pinyin-style="{ fontSize: '9px', color: '#999' }"
          />
        </view>
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[2] }"
        >
          <view :class="styles.cardHeader">
            <view :class="styles.cardIcon">💤</view>
            <PinyinText
              :text="'生活习性'"
              :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#1565C0' }"
              :pinyin-style="{ fontSize: '10px', color: '#64B5F6' }"
            />
          </view>
          <PinyinText
            :text="detail.habits"
            :char-style="{ fontSize: '14px', color: '#555', lineHeight: '1.5' }"
            :pinyin-style="{ fontSize: '9px', color: '#999' }"
          />
        </view>
        <view
          :class="styles.attributeCard"
          :style="{ background: cardBg[3] }"
        >
          <view :class="styles.cardHeader">
            <view :class="styles.cardIcon">🐼</view>
            <PinyinText
              :text="'有趣的小秘密'"
              :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#C2185B' }"
              :pinyin-style="{ fontSize: '10px', color: '#F48FB1' }"
            />
          </view>
          <PinyinText
            :text="detail.secret"
            :char-style="{ fontSize: '14px', color: '#555', lineHeight: '1.5' }"
            :pinyin-style="{ fontSize: '9px', color: '#999' }"
          />
        </view>
      </view>

      <!-- 总结横幅：按保护等级变色 -->
      <view
        :class="styles.summaryBanner"
        :style="{
          background: detail.protectionBgColor,
          borderColor: detail.borderColor,
        }"
      >
        <text :class="styles.bannerIcon">🛡️</text>
        <PinyinText
          :text="detail.protectionLevel"
          :char-style="{ fontSize: '20px', fontWeight: 'bold', color: detail.protectionTextColor, textShadow: '1px 1px 0 #fff' }"
          :pinyin-style="{ fontSize: '11px', color: detail.protectionTextColor }"
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
import { callFunction } from '../../utils/cloud'
import { PROTECTION_COLOR_MAP, ANIMAL_DISPLAY_CONFIG, AI_CHAT_ENABLED } from '../../constants'
import { useUserStore } from '../../stores/user'
import { useChatStore } from '../../stores/chat'
import type { AnimalDetailItem } from '../../types'

const { isVip } = storeToRefs(useUserStore())

// 动物内容全部来自云函数 getAnimalDetail，这里只是数据到达前的占位默认值，不预置任何具体动物的真实内容
const EMPTY_DETAIL: AnimalDetailItem = {
  id: 0,
  name: '',
  pinyin: '',
  image: '',
  habitat: '',
  food: '',
  habits: '',
  secret: '',
  protectionLevel: '',
  protectionBgColor: '#F5F5F5',
  protectionTextColor: '#757575',
  borderColor: '#E0E0E0',
  pageBg: '#F5F5F5',
}

const detail = ref<AnimalDetailItem>({ ...EMPTY_DETAIL })
const loading = ref(false)

const cardBg = computed(() => [
  '#E8F5E9', // 栖息地 - 绿
  '#FFF8E1', // 爱吃的食物 - 黄
  '#E3F2FD', // 生活习性 - 蓝
  '#FCE4EC', // 有趣的小秘密 - 粉
])

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
  useChatStore().setPendingAsk({ entityType: '动物', entityName: detail.value.name })
  uni.switchTab({ url: '/pages/ai/index' })
}

async function loadDetail(name: string) {
  loading.value = true
  try {
    const res = await callFunction('getAnimalDetail', { name })
    if (res.code === 0 && res.data) {
      const colorConfig = PROTECTION_COLOR_MAP[res.data.protectionLevel] || {
        bgColor: '#F5F5F5',
        textColor: '#757575',
        borderColor: '#E0E0E0',
      }
      const displayConfig = ANIMAL_DISPLAY_CONFIG[name] || {
        bannerIcon: '🐼',
        pageBg: '#F1F8E9',
      }
      detail.value = {
        ...res.data,
        pinyin: '',
        protectionBgColor: colorConfig.bgColor,
        protectionTextColor: colorConfig.textColor,
        borderColor: colorConfig.borderColor,
        pageBg: displayConfig.pageBg,
      }
    } else {
      uni.showToast({ title: '加载失败，请检查网络', icon: 'none' })
    }
  } catch (error) {
    console.error('加载动物详情失败:', error)
    uni.showToast({ title: '加载失败，请检查网络', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.options || {}
  // options.name 正常导航时会被小程序框架自动 decode；但开发者工具"编译模式"里手动配置的
  // 启动参数是原样透传的，如果那里填的是从 URL 里拷出来的已编码字符串（如 %E7%BE%8A%E9%A9%BC），
  // 就会带着 % 编码原样传给云函数，导致按精确匹配查库查不到。这里兜底再 decode 一次，
  // 未编码的普通文本 decode 是无副作用的
  let rawName = options.name || '羊驼'
  try {
    rawName = decodeURIComponent(rawName)
  } catch (e) {
    // 不是合法的 URI 编码，说明本来就是普通文本，原样使用即可
  }
  // 未带 name 参数时（比如开发者工具里直接编译预览本页面），给一个云端确实存在的默认动物名，
  // 避免拿空字符串去查库、弹出误导性的"未找到该动物"提示
  const name = rawName

  loadDetail(name)
})
</script>

<style lang="less" src="./index.less" module="styles"></style>
