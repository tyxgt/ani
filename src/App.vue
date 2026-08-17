<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { initCloud } from "./utils/cloud";

onLaunch(() => {
  console.log("App Launch");
  // #ifdef MP-TOUTIAO
  initCloud();
  // #endif
  // #ifdef MP-WEIXIN
  initCloud();
  // #endif

  // 启动不做任何自动登录/预加载动作：
  // - token 有效期内：storage 有 token → UserStore 初始化同步 isLoggedIn=true → 正常进应用
  // - 无 token / 已过期：isLoggedIn=false, authReady=true → AuthGate 弹窗 → 到"我的"页手动登录
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
