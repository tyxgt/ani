<template>
  <view :class="styles.minePage">
    <view :class="styles.content">
      <view :class="styles.userSection">
        <view :class="styles.userInfo">
          <PinyinText v-if="douyinUserInfo?.nickName" :text="douyinUserInfo.nickName"
            :charStyle="{ fontSize: '48rpx', fontWeight: 'bold', color: '#2C3E50' }"
            :pinyinStyle="{ fontSize: '28rpx', color: '#5D6D7E' }" />
          <view v-else :class="styles.loginTip" @click="openProfileModal">
            <PinyinText text="点击登录" display-mode="vertical"
              :charStyle="{ fontSize: '36rpx', fontWeight: '500', color: '#4A90D9' }"
              :pinyinStyle="{ fontSize: '24rpx', color: '#4A90D9' }" />
          </view>
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
        <view :class="styles.loginModalTitleBox">
          <PinyinText text="登录" display-mode="vertical"
            :charStyle="{ fontSize: '40rpx', fontWeight: 'bold', color: '#2C3E50' }"
            :pinyinStyle="{ fontSize: '26rpx', color: '#5D6D7E' }" />
        </view>
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
          <PinyinText text="确认" display-mode="vertical"
            :charStyle="{ fontSize: '32rpx', fontWeight: 'bold', color: '#fff' }"
            :pinyinStyle="{ fontSize: '22rpx', color: '#fff' }" />
        </view>
        <view :class="styles.loginModalSkip" @click="skipProfile">
          <PinyinText text="跳过" display-mode="vertical"
            :charStyle="{ fontSize: '28rpx', color: '#999' }"
            :pinyinStyle="{ fontSize: '20rpx', color: '#999' }" />
        </view>
      </view>
    </view>

    <!-- 退出登录确认弹窗（自定义，替代原生 uni.showModal，以支持拼音） -->
    <view v-if="showLogoutConfirm" :class="styles.loginModal" @click="cancelLogout">
      <view :class="styles.loginModalContent" @click.stop>
        <view :class="styles.loginModalTitleBox">
          <PinyinText text="提示" display-mode="vertical"
            :charStyle="{ fontSize: '40rpx', fontWeight: 'bold', color: '#2C3E50' }"
            :pinyinStyle="{ fontSize: '26rpx', color: '#5D6D7E' }" />
        </view>
        <view :class="styles.confirmDesc">
          <PinyinText text="确定要退出登录吗？下次进入需要重新登录。"
            :charStyle="{ fontSize: '28rpx', color: '#666' }"
            :pinyinStyle="{ fontSize: '20rpx', color: '#999' }" />
        </view>
        <view :class="styles.confirmBtnRow">
          <view :class="[styles.confirmBtn, styles.confirmBtnCancel]" @click="cancelLogout">
            <PinyinText text="取消" display-mode="vertical"
              :charStyle="{ fontSize: '30rpx', color: '#666' }"
              :pinyinStyle="{ fontSize: '20rpx', color: '#999' }" />
          </view>
          <view :class="[styles.confirmBtn, styles.confirmBtnOk]" @click="confirmLogout">
            <PinyinText text="确定" display-mode="vertical"
              :charStyle="{ fontSize: '30rpx', fontWeight: 'bold', color: '#fff' }"
              :pinyinStyle="{ fontSize: '20rpx', color: '#fff' }" />
          </view>
        </view>
      </view>
    </view>
  </view>
  <CustomTabBar current="/pages/mine/index" />
</template>

<script setup lang="ts">
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

// 退出登录确认弹窗状态
const showLogoutConfirm = ref(false)

// 未登录时不显示"退出登录"项；登录后才追加
const displayMenuList = computed<MenuItem[]>(() => {
  const baseList = [...MENU_LIST]
  if (isLoggedIn.value) {
    baseList.push({
      id: 999,
      name: '退出登录',
      icon: 'logout',
      action: 'logout',
    })
  }
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

const skipProfile = async () => {
  showProfileModal.value = false
  // 未登录时点"跳过"：走一次无昵称的静默登录，让用户能直接进入应用，
  // 后续可再从"点击登录"补昵称。已登录时只需关闭弹窗。
  if (!isLoggedIn.value) {
    try {
      await store.login('')
    } catch (e) {
      console.error('[Mine] 跳过昵称登录失败:', e)
    }
  }
}

const cancelLogout = () => {
  showLogoutConfirm.value = false
}

const confirmLogout = () => {
  store.logout()
  showLogoutConfirm.value = false
  uni.showToast({ title: '已退出登录', icon: 'none' })
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
      showLogoutConfirm.value = true
      break;
  }
};
</script>

<style lang="less" src="./index.less" module="styles"></style>
