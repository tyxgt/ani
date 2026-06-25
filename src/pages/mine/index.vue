<template>
  <view :class="styles.minePage">
    <view :class="styles.content">
      <view :class="styles.userSection">
        <view :class="styles.avatarWrapper" @click="changeAvatar">
          <image :class="styles.avatar" :src="userInfo.avatar" mode="aspectFill" />
          <view :class="styles.avatarEditIcon">
            <text :class="styles.editIcon">+</text>
          </view>
        </view>
        <view :class="styles.userInfo">
          <PinyinText
            text="小黄鸭"
            :charStyle="{ fontSize: '48rpx', fontWeight: 'bold', color: '#2C3E50' }"
            :pinyinStyle="{ fontSize: '28rpx', color: '#5D6D7E' }"
          />
        </view>
      </view>
      <view :class="styles.menuCard">
        <view
          :class="styles.menuItem"
          v-for="item in menuList"
          :key="item.id"
          @click="handleMenuClick(item)"
        >
          <view :class="[styles.menuIcon, iconStyleMap[item.icon]]">
            <image v-if="item.icon === 'settings'" src="/static/icons/settings.svg" mode="aspectFit" :class="styles.iconImage" />
            <image v-else-if="item.icon === 'about'" src="/static/icons/about.svg" mode="aspectFit" :class="styles.iconImage" />
            <image v-else-if="item.icon === 'feedback'" src="/static/icons/feedback.svg" mode="aspectFit" :class="styles.iconImage" />
            <image v-else-if="item.icon === 'share'" src="/static/icons/share.svg" mode="aspectFit" :class="styles.iconImage" />
          </view>
          <view :class="styles.menuText">
            <PinyinText
              :text="item.name"
              align="left"
              :charStyle="{ fontSize: '40rpx', color: '#666' }"
              :pinyinStyle="{ fontSize: '34rpx', color: '#666' }"
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
import { ref, useCssModule } from "vue";
import CustomTabBar from "../../components/CustomTabBar";
import PinyinText from "../../components/PinyinText";
import { DEFAULT_USER_INFO, MENU_LIST, ICON_STYLE_MAP } from "../../constants";
import type { UserInfo, MenuItem } from "../../types";

const styles = useCssModule('styles') as Record<string, string>

const iconStyleMap = ICON_STYLE_MAP

const userInfo = ref<UserInfo>({
  avatar: DEFAULT_USER_INFO.avatar,
  nickname: DEFAULT_USER_INFO.nickname,
  description: DEFAULT_USER_INFO.description,
});

const menuList = ref<MenuItem[]>([...MENU_LIST]);

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
            userInfo.value.avatar = res.tempFilePaths[0];
          },
        });
      } else {
        uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album"],
          success: (res) => {
            userInfo.value.avatar = res.tempFilePaths[0];
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
  }
};
</script>

<style lang="less" src="./index.less" module="styles"></style>
