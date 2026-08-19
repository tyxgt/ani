<template>
  <view :class="styles.customTabBar">
    <view :class="styles.tabBarWrapper">
      <view
        v-for="item in tabList"
        :key="item.pagePath"
        :class="[styles.tabItem, { [styles.active]: activePagePath === item.pagePath }]"
        @click="navigateTo(item)"
      >
        <view :class="styles.tabIcon">
          <view
            v-if="item.icon === 'home'"
            :class="[styles.iconHome, { [styles.active]: activePagePath === item.pagePath }]"
          ></view>
          <view
            v-else-if="item.icon === 'ai'"
            :class="[styles.iconAi, { [styles.active]: activePagePath === item.pagePath }]"
          ></view>
          <view
            v-else-if="item.icon === 'book'"
            :class="[styles.iconBook, { [styles.active]: activePagePath === item.pagePath }]"
          ></view>
          <view
            v-else-if="item.icon === 'panda'"
            :class="[styles.iconPanda, { [styles.active]: activePagePath === item.pagePath }]"
          ></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { AI_CHAT_ENABLED } from "../../constants";
import { useUserStore } from "../../stores/user";

const props = defineProps<{
  current: string;
}>();

const activePagePath = ref(props.current);

const userStore = useUserStore();
const { isVip } = storeToRefs(userStore);

// 图标按 item.icon 匹配，而不是按数组下标匹配：这样 tabList 无论按开关过滤成
// 几项、AI 项在不在里面，其余项的图标和高亮都不会跟着错位。
const ALL_TABS = [
  { pagePath: "/pages/index/index", text: "探索", icon: "home" },
  { pagePath: "/pages/ai/index", text: "AI", icon: "ai" },
  { pagePath: "/pages/learn/index", text: "学习", icon: "book" },
  { pagePath: "/pages/mine/index", text: "我的", icon: "panda" },
];

// 对话/AI 功能本版本暂不发布时（AI_CHAT_ENABLED 为 false）不渲染 AI 这个 tab；
// 已发布时还要叠加会员状态判断——非会员同样看不到这个入口。
// 用 computed 而不是普通 const：tabBar 页面常驻内存不会重新执行 setup，
// isVip 变化（比如 onShow 静默刷新后）必须能让这里响应式重新计算。
const tabList = computed(() =>
  ALL_TABS.filter((tab) => AI_CHAT_ENABLED && (tab.icon !== "ai" || isVip.value))
);

const navigateTo = (item: (typeof ALL_TABS)[number]) => {
  const pages = getCurrentPages();
  if (pages.length > 0) {
    const currentPage = '/' + pages[pages.length - 1].route;
    if (currentPage === item.pagePath) return;
  }
  activePagePath.value = item.pagePath;
  uni.switchTab({
    url: item.pagePath,
  });
};

onMounted(() => {
  activePagePath.value = props.current;
});
</script>

<style lang="less" src="./index.less" module="styles"></style>
