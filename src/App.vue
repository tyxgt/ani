<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { initCloud } from "./utils/cloud";

onLaunch(() => {
  console.log("App Launch");
  // #ifdef MP-TOUTIAO
  initCloud();
  // #endif
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
