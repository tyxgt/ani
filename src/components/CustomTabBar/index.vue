<template>
  <view :class="styles.customTabBar">
    <view :class="styles.tabBarWrapper">
      <view
        v-for="(item, index) in tabList"
        :key="index"
        :class="[styles.tabItem, { [styles.active]: currentIndex === index }]"
        @click="navigateTo(index)"
      >
        <view :class="styles.tabIcon">
          <view
            v-if="index === 0"
            :class="[styles.iconHome, { [styles.active]: currentIndex === index }]"
          ></view>
          <view
            v-else-if="index === 1"
            :class="[styles.iconAi, { [styles.active]: currentIndex === index }]"
          ></view>
          <view
            v-else-if="index === 2"
            :class="[styles.iconBook, { [styles.active]: currentIndex === index }]"
          ></view>
          <view
            v-else-if="index === 3"
            :class="[styles.iconPanda, { [styles.active]: currentIndex === index }]"
          ></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = defineProps<{
  current: number;
}>();

const currentIndex = ref(props.current);

const tabList = [
  { pagePath: "/pages/index/index", text: "探索" },
  { pagePath: "/pages/ai/index", text: "AI" },
  { pagePath: "/pages/learn/index", text: "学习" },
  { pagePath: "/pages/mine/index", text: "我的" },
];

const navigateTo = (index: number) => {
  const pages = getCurrentPages();
  if (pages.length > 0) {
    const currentPage = '/' + pages[pages.length - 1].route;
    if (currentPage === tabList[index].pagePath) return;
  }
  currentIndex.value = index;
  uni.switchTab({
    url: tabList[index].pagePath,
  });
};

onMounted(() => {
  currentIndex.value = props.current;
});
</script>

<style lang="less" src="./index.less" module="styles"></style>
