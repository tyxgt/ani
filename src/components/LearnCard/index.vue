<template>
  <view :class="styles.card" :style="{ borderColor: item.borderColor }" @click="onClick">
    <view :class="styles.imgWrap">
      <view v-if="!loaded" :class="styles.skeleton" />
      <image :class="styles.img" :src="item.image" mode="aspectFill" @load="onLoad" />
    </view>
    <view :class="styles.info">
      <view :class="styles.nameRow">
        <PinyinText :text="item.name" displayMode="horizontal" align="left"
          :char-style="{ fontSize: '18px', fontWeight: 'bold', color: '#333' }"
          :pinyin-style="{ fontSize: '12px', color: '#666' }" />
      </view>
      <view :class="styles.tag" :style="{
        backgroundColor: item.tagBgColor,
        borderColor: item.tagBorderColor,
      }">
        <PinyinText :text="item.tagText" displayMode="horizontal" align="left" :char-style="{
          fontSize: '12px',
          marginBottom: '2px',
          fontWeight: '600',
          color: item.tagTextColor,
        }" :pinyin-style="{
          fontSize: '9px',
          color: '#888',
        }" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import PinyinText from '../PinyinText'
import type { LearnCardItem } from '../../types'
import { ref } from 'vue'

const props = defineProps<{
  item: LearnCardItem
}>()

const emit = defineEmits<{
  click: []
}>()

const loaded = ref(false)

function onLoad() {
  loaded.value = true
}

function onClick() {
  emit('click')
}
</script>

<style lang="less" src="./index.less" module="styles"></style>
