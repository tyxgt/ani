<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { authManager } from "./utils/auth";

onLaunch(async () => {
  console.log("App Launch");
  try {
    const userInfo = await authManager.silentLogin();
    if (userInfo) {
      console.log("静默登录成功:", userInfo);
    } else {
      console.log("未登录，等待用户主动登录");
    }
  } catch (error) {
    console.error("静默登录失败:", error);
  }
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
