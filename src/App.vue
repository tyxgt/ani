<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { initCloud } from "./utils/cloud";
import { preloadLearnData } from "./utils/preload";
import { useUserStore } from "./stores/user";

onLaunch(() => {
  console.log("App Launch");
  // #ifdef MP-TOUTIAO
  initCloud();
  // #endif
  // #ifdef MP-WEIXIN
  initCloud();
  // #endif

  // 使用任何功能前必须先登录：wx.login() 本身是静默的，无需用户点击授权，
  // 所以直接在启动时自动换取 token。各页面通过 AuthGate 组件读取
  // store.authReady / store.isLoggedIn 来决定是否展示内容，不需要在这里等待。
  const userStore = useUserStore();
  userStore.silentLogin();

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
