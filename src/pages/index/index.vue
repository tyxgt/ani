<template>
  <view class="home-page">
    <image class="background" :src="backgroundUrl" mode="aspectFill" />

    <image class="panda" :src="pandaUrl" mode="aspectFit" />

    <view class="main-btn" @click="startExplore">
      <image class="btn-icon" :src="btnIconUrl" mode="aspectFit" />
      <PinyinText 
        text="开始探索吧" 
        display-mode="vertical"
        :charStyle="{ fontSize: '28px', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }"
        :pinyinStyle="{ fontSize: '18px', color: '#fff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }"
      />
    </view>

    <CustomTabBar :current="0" />
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CustomTabBar from "../../components/CustomTabBar";
import PinyinText from "../../components/PinyinText";

const backgroundUrl = ref(
  "https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/image.png"
);
const pandaUrl = ref(
  "https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/doctorpanda.png"
);
const audioIconUrl = ref(
  "https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/voiceSwitch.png"
);
const btnIconUrl = ref(
  "https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/moutain.png"
);

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
    url: "/pages/map/index"
  });
};
</script>

<style lang="less" src="./index.less"></style>
