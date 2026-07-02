<template>
  <view :class="styles.minePage">
    <view :class="styles.content">
      <view :class="styles.userSection">
        <view :class="styles.avatarWrapper" @click="handleAvatarClick">
          <image
            :class="styles.avatar"
            :src="displayAvatar"
            mode="aspectFill"
          />
          <view v-if="isLoggedIn" :class="styles.avatarEditIcon">
            <text :class="styles.editIcon">+</text>
          </view>
        </view>
        <view :class="styles.userInfo">
          <PinyinText
            v-if="isLoggedIn && douyinUserInfo?.nickName"
            :text="douyinUserInfo.nickName"
            :charStyle="{ fontSize: '48rpx', fontWeight: 'bold', color: '#2C3E50' }"
            :pinyinStyle="{ fontSize: '28rpx', color: '#5D6D7E' }"
          />
          <text v-else :class="styles.loginTip" @click="handleLogin">
            {{ isLoggedIn ? '设置昵称' : '点击登录' }}
          </text>
        </view>
      </view>

      <view :class="styles.menuCard">
        <view
          :class="styles.menuItem"
          v-for="item in displayMenuList"
          :key="item.id"
          @click="handleMenuClick(item)"
        >
          <view :class="[styles.menuIcon, iconStyleMap[item.icon]]">
            <image v-if="item.icon === 'settings'" src="/static/icons/settings.svg" mode="aspectFit" :class="styles.iconImage" />
            <image v-else-if="item.icon === 'about'" src="/static/icons/about.svg" mode="aspectFit" :class="styles.iconImage" />
            <image v-else-if="item.icon === 'feedback'" src="/static/icons/feedback.svg" mode="aspectFit" :class="styles.iconImage" />
            <image v-else-if="item.icon === 'share'" src="/static/icons/share.svg" mode="aspectFit" :class="styles.iconImage" />
            <image v-else-if="item.icon === 'logout'" src="/static/icons/settings.svg" mode="aspectFit" :class="styles.iconImage" />
          </view>
          <view :class="styles.menuText">
            <PinyinText
              :text="item.name"
              align="left"
              :charStyle="{ fontSize: '40rpx', color: item.action === 'logout' ? '#E74C3C' : '#666' }"
              :pinyinStyle="{ fontSize: '34rpx', color: item.action === 'logout' ? '#E74C3C' : '#666' }"
            />
          </view>
          <text :class="styles.arrow">›</text>
        </view>
      </view>
    </view>
    <CustomTabBar :current="3" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useCssModule } from "vue";
import { onShow } from "@dcloudio/uni-app";
import CustomTabBar from "../../components/CustomTabBar";
import PinyinText from "../../components/PinyinText";
import { DEFAULT_USER_INFO, MENU_LIST, ICON_STYLE_MAP } from "../../constants";
import { authManager } from "../../utils/auth";
import type { DouyinUserInfo, MenuItem } from "../../types";

const styles = useCssModule('styles') as Record<string, string>

const iconStyleMap = ICON_STYLE_MAP

const isLoggedIn = ref(false)
const douyinUserInfo = ref<DouyinUserInfo | null>(null)

const displayAvatar = computed(() => {
  if (douyinUserInfo.value?.avatarUrl) {
    return douyinUserInfo.value.avatarUrl
  }
  return DEFAULT_USER_INFO.avatar
})

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

const refreshLoginState = () => {
  isLoggedIn.value = authManager.isLoggedIn()
  douyinUserInfo.value = authManager.getUserInfo()
}

onMounted(() => {
  refreshLoginState()
})

onShow(() => {
  refreshLoginState()
})

const handleAvatarClick = () => {
  if (!isLoggedIn.value) {
    handleLogin()
    return
  }
  changeAvatar()
}

const handleLogin = async () => {
  try {
    uni.showLoading({ title: '登录中...' })
    const userInfo = await authManager.login()
    if (userInfo) {
      refreshLoginState()
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

const changeAvatar = () => {
  uni.showActionSheet({
    itemList: ["拍照", "从相册选择"],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["camera"],
          success: (res) => {
            if (douyinUserInfo.value) {
              douyinUserInfo.value.avatarUrl = res.tempFilePaths[0]
            }
          },
        });
      } else {
        uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album"],
          success: (res) => {
            if (douyinUserInfo.value) {
              douyinUserInfo.value.avatarUrl = res.tempFilePaths[0]
            }
          },
        });
      }
    },
  });
};

const handleMenuClick = (item: { action: string; name: string }) => {
  switch (item.action) {
    case "settings":
      uni.showModal({
        title: "设置",
        content: "修改头像、修改名字等设置功能",
        showCancel: false,
      });
      break;
    case "about":
      uni.showModal({
        title: "关于我们",
        content: "名称：3D中国地理-儿童专属版\n版本：1.0.0",
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
            authManager.logout()
            refreshLoginState()
            uni.showToast({ title: '已退出登录', icon: 'success' })
          }
        },
      })
      break;
  }
};
</script>

<style lang="less" src="./index.less" module="styles"></style>
