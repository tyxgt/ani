<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { initCloud } from "./utils/cloud";
import { preloadLearnData } from "./utils/preload";

onLaunch(() => {
  console.log("App Launch");
  // #ifdef MP-TOUTIAO
  initCloud();
  // #endif
  // #ifdef MP-WEIXIN
  initCloud();
  // #endif
  // 提前把"学习"页要用的数据请求发出去，不等待，用户切到学习 tab 时大概率已经拿到结果
  preloadLearnData();
});

onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="less">
@import './styles/h5-override.less';
</style>
