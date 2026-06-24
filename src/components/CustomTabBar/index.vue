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
          <view
            v-if="index === 0"
            class="icon-home"
            :class="{ active: currentIndex === index }"
          ></view>
          <view
            v-else-if="index === 1"
            class="icon-ai"
            :class="{ active: currentIndex === index }"
          ></view>
          <view
            v-else-if="index === 2"
            class="icon-book"
            :class="{ active: currentIndex === index }"
          ></view>
          <view
            v-else-if="index === 3"
            class="icon-panda"
            :class="{ active: currentIndex === index }"
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
  if (currentIndex.value === index) return;
  currentIndex.value = index;
  uni.navigateTo({
    url: tabList[index].pagePath,
  });
};

onMounted(() => {
  currentIndex.value = props.current;
});
</script>

<style lang="less" src="./index.less" scoped></style>
