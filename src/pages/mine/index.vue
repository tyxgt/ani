<template>
  <view class="mine-page">
    <view class="content">
      <view class="user-section">
        <view class="avatar-wrapper" @click="changeAvatar">
          <image class="avatar" :src="userInfo.avatar" mode="aspectFill" />
          <view class="avatar-edit-icon">
            <text class="edit-icon">+</text>
          </view>
        </view>
        <view class="user-info">
          <PinyinText
            text="小黄鸭"
            :charStyle="{ fontSize: '48rpx', fontWeight: 'bold', color: '#2C3E50' }"
            :pinyinStyle="{ fontSize: '28rpx', color: '#5D6D7E' }"
          />
        </view>
      </view>
      <view class="menu-card">
        <view
          class="menu-item"
          v-for="item in menuList"
          :key="item.id"
          @click="handleMenuClick(item)"
        >
          <view class="menu-icon" :class="item.iconClass">
            <image v-if="item.icon === 'settings'" src="/static/icons/settings.svg" mode="aspectFit" class="icon-image" />
            <image v-else-if="item.icon === 'about'" src="/static/icons/about.svg" mode="aspectFit" class="icon-image" />
            <image v-else-if="item.icon === 'feedback'" src="/static/icons/feedback.svg" mode="aspectFit" class="icon-image" />
            <image v-else-if="item.icon === 'share'" src="/static/icons/share.svg" mode="aspectFit" class="icon-image" />
          </view>
          <view class="menu-text">
            <PinyinText
              :text="item.name"
              align="left"
              :charStyle="{ fontSize: '40rpx', color: '#666' }"
              :pinyinStyle="{ fontSize: '34rpx', color: '#666' }"
            />
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
    <CustomTabBar :current="3" />
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CustomTabBar from "../../components/CustomTabBar";
import PinyinText from "../../components/PinyinText";

const userInfo = ref({
  avatar:
    "https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20yellow%20duck%20wearing%20explorer%20hat%20cartoon%20style&image_size=square",
  nickname: "小黄鸭",
  description: "热爱探索的小探险家",
});

const menuList = ref([
  {
    id: 1,
    name: "设置",
    icon: "settings",
    iconClass: "icon-settings",
    action: "settings",
  },
  { id: 2, name: "关于我们", icon: "about", iconClass: "icon-about", action: "about" },
  {
    id: 3,
    name: "意见反馈",
    icon: "feedback",
    iconClass: "icon-feedback",
    action: "feedback",
  },
  { id: 4, name: "分享", icon: "share", iconClass: "icon-share", action: "share" },
]);

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

<style lang="less" src="./index.less"></style>
