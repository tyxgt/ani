<template>
  <view
    :class="styles.card"
    :style="{ borderColor: item.borderColor }"
    @click="onClick"
  >
    <image :class="styles.img" :src="item.image" mode="aspectFill" />
    <view :class="styles.info">
      <view :class="styles.nameRow">
        <PinyinText
          :text="item.name"
          displayMode="horizontal"
          align="left"
          :char-style="{ fontSize: '14px', fontWeight: 'bold', color: '#333' }"
          :pinyin-style="{ fontSize: '12px', color: '#666' }"
        />
      </view>
      <view
        :class="styles.tag"
        :style="{
          backgroundColor: item.tagBgColor,
          borderColor: item.tagBorderColor,
        }"
      >
        <text :class="styles.tagText" :style="{ color: item.tagTextColor }">
          {{ item.tagText }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import PinyinText from '../PinyinText'
import type { LearnCardItem } from '../../types'

const props = defineProps<{
  item: LearnCardItem
}>()

const emit = defineEmits<{
  click: []
}>()

function onClick() {
  emit('click')
}
</script>

<style lang="less" src="./index.less" module="styles"></style>
