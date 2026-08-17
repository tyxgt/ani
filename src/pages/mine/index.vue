<template>
  <AuthGate>
  <view :class="styles.minePage">
    <view :class="styles.content">
      <view :class="styles.userSection">
        <view :class="styles.userInfo">
          <PinyinText v-if="douyinUserInfo?.nickName" :text="douyinUserInfo.nickName"
            :charStyle="{ fontSize: '48rpx', fontWeight: 'bold', color: '#2C3E50' }"
            :pinyinStyle="{ fontSize: '28rpx', color: '#5D6D7E' }" />
          <text v-else :class="styles.loginTip" @click="openProfileModal">
            点击完善资料
          </text>
        </view>
      </view>

      <view :class="styles.menuCard">
        <view :class="styles.menuItem" v-for="item in displayMenuList" :key="item.id" @click="handleMenuClick(item)">
          <view :class="[styles.menuIcon, iconStyleMap[item.icon]]">
            <image v-if="item.icon === 'settings'" src="/static/icons/settings.svg" mode="aspectFit"
              :class="styles.iconImage" />
            <image v-else-if="item.icon === 'about'" src="/static/icons/about.svg" mode="aspectFit"
              :class="styles.iconImage" />
            <image v-else-if="item.icon === 'feedback'" src="/static/icons/feedback.svg" mode="aspectFit"
              :class="styles.iconImage" />
            <image v-else-if="item.icon === 'share'" src="/static/icons/share.svg" mode="aspectFit"
              :class="styles.iconImage" />
            <image v-else-if="item.icon === 'logout'" src="/static/icons/settings.svg" mode="aspectFit"
              :class="styles.iconImage" />
          </view>
          <view :class="styles.menuText">
            <PinyinText :text="item.name" align="left" :charStyle="{ fontSize: '40rpx', color: '#666' }"
              :pinyinStyle="{ fontSize: '34rpx', color: '#666' }" />
          </view>
          <text :class="styles.arrow">›</text>
        </view>
      </view>
    </view>

    <CustomTabBar :current="2" />

    <!-- 完善资料弹窗（登录已在 App 启动时自动完成，这里只填昵称，不阻塞功能使用） -->
    <view v-if="showProfileModal" :class="styles.loginModal" @click="closeProfileModal">
      <view :class="styles.loginModalContent" @click.stop>
        <text :class="styles.loginModalTitle">完善个人信息</text>
        <!-- #ifdef MP-WEIXIN -->
        <view :class="styles.nicknameField">
          <input type="nickname" :class="styles.nicknameInput" placeholder="请输入昵称" :value="tempNickName"
            @blur="onNicknameInput" />
        </view>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <view :class="styles.nicknameField">
          <input type="text" :class="styles.nicknameInput" placeholder="请输入昵称" :value="tempNickName"
            @input="onNicknameInputH5" />
        </view>
        <!-- #endif -->
        <view :class="styles.loginModalBtn" @click="confirmProfile">
          <text :class="styles.loginModalBtnText">确认</text>
        </view>
        <text :class="styles.loginModalSkip" @click="skipProfile">跳过</text>
      </view>
    </view>
  </view>
  </AuthGate>
</template>

<script setup lang="ts">
import AuthGate from "../../components/AuthGate";
import { ref, computed, useCssModule } from "vue";
import { storeToRefs } from "pinia";
import CustomTabBar from "../../components/CustomTabBar";
import PinyinText from "../../components/PinyinText";
import { MENU_LIST, ICON_STYLE_MAP } from "../../constants";
import { useUserStore } from "../../stores/user";
import type { MenuItem } from "../../types";

const styles = useCssModule('styles') as Record<string, string>

const iconStyleMap = ICON_STYLE_MAP

// ─── 全局响应式状态 ─────────────────────────────────────────────
const store = useUserStore()
const { userInfo: douyinUserInfo } = storeToRefs(store)

// 完善资料弹窗状态（登录本身已在 App 启动时静默完成，这里只负责昵称）
const showProfileModal = ref(false)
const tempNickName = ref('')

// 使用任何功能前都需要登录，登录本身不可退出（会自动重新登录），
// 这里保留的是"清除本地资料"（昵称等），而不是真正意义上的登出
const displayMenuList = computed<MenuItem[]>(() => {
  const baseList = [...MENU_LIST]
  baseList.push({
    id: 999,
    name: '清除本地资料',
    icon: 'logout',
    action: 'logout',
  })
  return baseList
})

const openProfileModal = () => {
  tempNickName.value = ''
  showProfileModal.value = true
}

const closeProfileModal = () => {
  showProfileModal.value = false
}

const onNicknameInput = (e: any) => {
  tempNickName.value = e.detail.value || ''
}

const onNicknameInputH5 = (e: any) => {
  tempNickName.value = e.detail.value || ''
}

const confirmProfile = () => {
  const nickName = tempNickName.value || ''
  const result = store.updateProfile(nickName)
  showProfileModal.value = false
  if (result) {
    uni.showToast({ title: '保存成功', icon: 'success' })
  }
}

const skipProfile = () => {
  showProfileModal.value = false
}

const handleMenuClick = (item: { action: string; name: string }) => {
  switch (item.action) {
    case "settings":
      uni.showModal({
        title: "设置",
        content: "修改名字等设置功能",
        showCancel: false,
      });
      break;
    case "about":
      uni.showModal({
        title: "关于我们",
        content: "名称：大熊猫博士-儿童专属版\n版本：1.0.0",
        showCancel: false,
      });
      break;
    case "feedback":
      uni.showModal({
        title: "意见反馈",
        content: "感谢您的反馈，我们会认真听取每一条建议！",
        showCancel: false,
      });
      break;
    case "share":
      uni.showShareMenu({
        withShareTicket: true,
        success: () => {
          uni.showToast({
            title: "请选择分享方式",
            icon: "none",
          });
        },
      });
      break;
    case "logout":
      uni.showModal({
        title: "提示",
        content: "确定要清除本地资料吗？清除后会重新静默登录。",
        success: (res) => {
          if (res.confirm) {
            store.logout()
            uni.showToast({ title: '已清除，正在重新登录', icon: 'none' })
            // 使用任何功能前都需要登录：清除本地资料后立刻重新静默登录，
            // 不让用户停留在"未登录"状态
            store.silentLogin()
          }
        },
      })
      break;
  }
};
</script>

<style lang="less" src="./index.less" module="styles"></style>
