<template>
  <AuthGate>
  <view :class="styles.homePage">
    <image :class="styles.background" :src="backgroundUrl" mode="aspectFill" />

    <image :class="styles.panda" :src="pandaUrl" mode="aspectFit" />

    <view :class="styles.mainBtn" @click="startExplore">
      <image :class="styles.btnIcon" :src="btnIconUrl" mode="aspectFit" />
      <PinyinText
        text="开始探索吧"
        display-mode="vertical"
        :charStyle="{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }"
        :pinyinStyle="{
          fontSize: '18px',
          color: '#fff',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
        }"
      />
    </view>

    <CustomTabBar current="/pages/index/index" />
  </view>
  </AuthGate>
</template>

<script setup lang="ts">
import AuthGate from "../../components/AuthGate";
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import CustomTabBar from "../../components/CustomTabBar";
import PinyinText from "../../components/PinyinText";
import { HOME_BACKGROUND_URL, HOME_PANDA_URL, AUDIO_ICON_URL, BTN_ICON_URL } from "../../constants";
import { useUserStore } from "../../stores/user";

const userStore = useUserStore();

// 静默刷新会员状态：不弹提示，只是让 tabBar 上的 AI 入口能及时反映最新状态
onShow(() => {
  userStore.refreshMembership();
});

const backgroundUrl = ref(HOME_BACKGROUND_URL);
const pandaUrl = ref(HOME_PANDA_URL);
const audioIconUrl = ref(AUDIO_ICON_URL);
const btnIconUrl = ref(BTN_ICON_URL);

const isAudioPlaying = ref(false);

const toggleAudio = () => {
  isAudioPlaying.value = !isAudioPlaying.value;
  if (isAudioPlaying.value) {
    uni.showToast({ title: "播放中", icon: "none" });
  } else {
    uni.showToast({ title: "已暂停", icon: "none" });
  }
};

const startExplore = () => {
  uni.navigateTo({
    url: "/pages/map/index",
  });
};
</script>

<style lang="less" src="./index.less" module="styles"></style>
