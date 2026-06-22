<template>
  <view class="custom-tab-bar">
    <view class="tab-bar-wrapper">
      <view 
        v-for="(item, index) in tabList" 
        :key="index" 
        class="tab-item"
        :class="{ active: currentIndex === index }"
        @click="navigateTo(index)"
      >
        <view class="tab-icon">
          <view v-if="index === 0" class="icon-home" :class="{ active: currentIndex === index }"></view>
          <view v-else-if="index === 1" class="icon-ai" :class="{ active: currentIndex === index }"></view>
          <view v-else-if="index === 2" class="icon-book" :class="{ active: currentIndex === index }"></view>
          <view v-else-if="index === 3" class="icon-panda" :class="{ active: currentIndex === index }"></view>
        </view>
        <text class="tab-text">{{ item.text }}</text>
        <view v-if="currentIndex === index" class="tab-indicator"></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  current: number
}>()

const currentIndex = ref(props.current)

const tabList = [
  { pagePath: '/pages/index/index', text: '探索' },
  { pagePath: '/pages/ai/index', text: 'AI小助手' },
  { pagePath: '/pages/learn/index', text: '学习' },
  { pagePath: '/pages/mine/index', text: '我的' }
]

const navigateTo = (index: number) => {
  if (currentIndex.value === index) return
  currentIndex.value = index
  uni.navigateTo({
    url: tabList[index].pagePath
  })
}

onMounted(() => {
  currentIndex.value = props.current
})
</script>

<style lang="less" scoped>
.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  padding: 0 20px 40px;
}

.tab-bar-wrapper {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #FFFFFF;
  border-radius: 30px;
  padding: 10px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
  position: relative;
  
  &.active {
    .tab-text {
      color: #2C7A7A;
    }
  }
}

.tab-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 8px;
}

.icon-home {
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999999'%3E%3Cpath d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  
  &.active {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF9F00'%3E%3Cpath d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'/%3E%3C/svg%3E");
  }
}

.icon-ai {
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999999'%3E%3Cpath d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  
  &.active {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232C7A7A'%3E%3Cpath d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'/%3E%3C/svg%3E");
  }
}

.icon-book {
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999999'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  
  &.active {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232C7A7A'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E");
  }
}

.icon-panda {
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999999'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Ccircle cx='8' cy='12' r='3'/%3E%3Ccircle cx='16' cy='12' r='3'/%3E%3Ccircle cx='12' cy='16' r='5'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  
  &.active {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232C7A7A'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Ccircle cx='8' cy='12' r='3'/%3E%3Ccircle cx='16' cy='12' r='3'/%3E%3Ccircle cx='12' cy='16' r='5'/%3E%3C/svg%3E");
  }
}

.tab-text {
  font-size: 18px;
  color: #999999;
}

.tab-indicator {
  position: absolute;
  bottom: 5px;
  width: 30px;
  height: 4px;
  background: #2C7A7A;
  border-radius: 2px;
}
</style>