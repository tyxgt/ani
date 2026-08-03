<template>
  <view :class="styles.minePage">
    <view :class="styles.content">
      <view :class="styles.userSection">
        <view :class="styles.userInfo">
          <PinyinText v-if="isLoggedIn && douyinUserInfo?.nickName" :text="douyinUserInfo.nickName"
            :charStyle="{ fontSize: '48rpx', fontWeight: 'bold', color: '#2C3E50' }"
            :pinyinStyle="{ fontSize: '28rpx', color: '#5D6D7E' }" />
          <text v-else :class="styles.loginTip" @click="handleLogin">
            {{ !ready ? '加载中...' : '点击登录' }}
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

    <!-- 登录弹窗 -->
    <view v-if="showLoginModal" :class="styles.loginModal" @click="closeLoginModal">
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
        <view :class="styles.loginModalBtn" @click="confirmLogin">
          <text :class="styles.loginModalBtnText">确认登录</text>
        </view>
        <text :class="styles.loginModalSkip" @click="skipLogin">跳过</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
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
const { isLoggedIn, userInfo: douyinUserInfo } = storeToRefs(store)

// 页面是否已就绪
const ready = ref(true)

// 登录弹窗状态
const showLoginModal = ref(false)
const tempNickName = ref('')

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

const handleLogin = () => {
  tempNickName.value = ''
  showLoginModal.value = true
}

const closeLoginModal = () => {
  showLoginModal.value = false
}

const onNicknameInput = (e: any) => {
  tempNickName.value = e.detail.value || ''
}

const onNicknameInputH5 = (e: any) => {
  tempNickName.value = e.detail.value || ''
}

const confirmLogin = async () => {
  try {
    uni.showLoading({ title: '登录中...' })
    const nickName = tempNickName.value || ''
    const userInfo = await store.login(nickName)
    if (userInfo) {
      showLoginModal.value = false
      uni.showToast({ title: '登录成功', icon: 'success' })
    } else {
      uni.showToast({ title: '登录失败', icon: 'none' })
    }
  } catch (error) {
    console.error('登录失败:', error)
    uni.showToast({ title: (error as Error).message || '登录失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const skipLogin = async () => {
  try {
    uni.showLoading({ title: '登录中...' })
    const userInfo = await store.login('')
    if (userInfo) {
      showLoginModal.value = false
      uni.showToast({ title: '登录成功', icon: 'success' })
    } else {
      uni.showToast({ title: '登录失败', icon: 'none' })
    }
  } catch (error) {
    console.error('登录失败:', error)
    uni.showToast({ title: (error as Error).message || '登录失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
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
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            store.logout()
            uni.showToast({ title: '已退出登录', icon: 'success' })
          }
        },
      })
      break;
  }
};
</script>

<style lang="less" src="./index.less" module="styles"></style>
