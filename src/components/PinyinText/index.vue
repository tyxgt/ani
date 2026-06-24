<template>
  <view class="pinyin-text" :class="[`align-${align}`, { vertical: displayMode === 'vertical' }]">
    <template v-if="displayMode === 'vertical'">
      <view class="char-group" v-for="(item, index) in pinyinData" :key="index">
        <text class="pinyin" :class="pinyinClass" :style="pinyinStyle">{{ item.pinyin }}</text>
        <text class="char" :class="charClass" :style="charStyle">{{ item.char }}</text>
      </view>
    </template>
    <template v-else>
      <view class="pinyin-row">
        <text class="pinyin" :class="pinyinClass" :style="pinyinStyle" v-for="(item, index) in pinyinData" :key="index">
          {{ item.pinyin || '\u00A0' }}
        </text>
      </view>
      <view class="text-row">
        <text class="char" :class="charClass" :style="charStyle">{{ text }}</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getPinyinArray } from '../../utils/pinyin'

const props = withDefaults(defineProps<{
  text: string
  displayMode?: 'horizontal' | 'vertical'
  align?: 'left' | 'center' | 'right'
  charClass?: string
  pinyinClass?: string
  charStyle?: Record<string, string>
  pinyinStyle?: Record<string, string>
}>(), {
  displayMode: 'horizontal',
  align: 'center',
  charClass: '',
  pinyinClass: '',
  charStyle: () => ({}),
  pinyinStyle: () => ({})
})

const pinyinData = computed(() => getPinyinArray(props.text))
</script>

<style lang="less" src="./index.less"></style>