<template>
  <AuthGate :manualLogin="true">
    <view :class="styles.minePage">
      <view :class="styles.content">
        <view :class="styles.userSection">
          <view :class="styles.userInfo">
            <PinyinText v-if="douyinUserInfo?.nickName" :text="douyinUserInfo.nickName"
              :charStyle="{ fontSize: '48rpx', fontWeight: 'bold', color: '#2C3E50' }"
              :pinyinStyle="{ fontSize: '28rpx', color: '#5D6D7E' }" />
            <text v-else :class="styles.loginTip" @click="openProfileModal">
              点击登录
            </text>
            <view v-if="userCode" :class="styles.userCode" @click="copyUserCode">
              <text :class="styles.userCodeLabel">ID：</text>
              <text :class="styles.userCodeValue">{{ userCode }}</text>
            </view>
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
              <PinyinText :text="item.name"  display-mode="vertical"
                :charStyle="{ fontSize: '40rpx', color: '#666' }"
                :pinyinStyle="{ fontSize: '34rpx', color: '#666' }"
                charGroupWidth="80rpx" />
            </view>
            <text :class="styles.arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 登录/完善个人信息弹窗（登录本身已完成，这里负责昵称头像） -->
      <view v-if="showProfileModal" :class="styles.loginModal" @click="closeProfileModal">
        <view :class="styles.loginModalContent" @click.stop>
          <text :class="styles.loginModalTitle">登录</text>
          <!-- #ifdef MP-WEIXIN -->
          <view :class="styles.nicknameField">
            <input type="nickname" :class="styles.nicknameInput" placeholder="请输入昵称" :value="tempNickName"
              @input="onNicknameInput" @blur="onNicknameInput" />
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
  <CustomTabBar current="/pages/mine/index" />
</template>

<script setup lang="ts">
import AuthGate from "../../components/AuthGate";
import { ref, computed, useCssModule } from "vue";
import { onShow } from "@dcloudio/uni-app";
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
const { userInfo: douyinUserInfo, userCode, isLoggedIn } = storeToRefs(store)

const copyUserCode = () => {
  if (!userCode.value) return
  uni.setClipboardData({
    data: userCode.value,
    success: () => {
      uni.showToast({ title: '已复制', icon: 'none' })
    },
  })
}

// 静默刷新会员状态：不弹提示，只是让 tabBar 上的 AI 入口能及时反映最新状态
onShow(() => {
  store.refreshMembership()
})

// 登录/完善资料弹窗状态（登录由用户手动触发，这里负责昵称头像）
const showProfileModal = ref(false)
const tempNickName = ref('')

// 退出登录：清除本地 token 与用户信息，回到可手动登录状态，不自动重登
const displayMenuList = computed<MenuItem[]>(() => {
  const baseList = [...MENU_LIST]
  baseList.push({
    id: 999,
    name: '退出登录',
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

const confirmSubmitting = ref(false)

const confirmProfile = async () => {
  const nickName = (tempNickName.value || '').trim()
  if (!nickName) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  if (confirmSubmitting.value) return
  confirmSubmitting.value = true
  uni.showLoading({ title: '保存中...', mask: true })
  try {
    // 正常情况下这里只是"补昵称"（登录早已在 AuthGate 完成）。
    // 但如果此时其实还没有登录成功（token/用户信息缺失，比如登录态过期后
    // 用户没有重新走登录），只补资料是没有意义的——直接带上刚输入的昵称
    // 走一次完整登录，一步到位，避免用户点确认却因为"未登录"静默失败。
    const result = isLoggedIn.value
      ? store.updateProfile(nickName)
      : await store.login(nickName)
    if (result) {
      showProfileModal.value = false
      uni.showToast({ title: '保存成功', icon: 'success' })
    } else {
      uni.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  } catch (e) {
    console.error('[Mine] 保存昵称失败:', e)
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
    confirmSubmitting.value = false
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
        content: "确定要退出登录吗？下次进入需要重新登录。",
        success: (res) => {
          if (res.confirm) {
            store.logout()
            uni.showToast({ title: '已退出登录', icon: 'none' })
            // 不再自动重新登录，用户手动点 AuthGate 的"登录"按钮才会重新登录
          }
        },
      })
      break;
  }
};
</script>

<style lang="less" src="./index.less" module="styles"></style>
