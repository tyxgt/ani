<template>
  <view :class="styles.list">
    <view v-for="i in count" :key="i" :class="styles.card">
      <view :class="styles.imgSkeleton" />
      <view :class="styles.info">
        <view :class="styles.lineSkeleton" />
        <view :class="[styles.lineSkeleton, styles.tagSkeleton]" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 6,
  }
)
</script>

<style lang="less" src="./index.less" module="styles"></style>
