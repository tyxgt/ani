<template>
  <view :class="[styles.pinyinText, alignClass, { [styles.vertical]: displayMode === 'vertical' }]">
    <template v-if="displayMode === 'vertical'">
      <view :class="styles.charGroup" v-for="(item, index) in pinyinData" :key="index">
        <text :class="[styles.pinyin, pinyinClass]" :style="pinyinStyle">{{ item.pinyin }}</text>
        <text :class="[styles.char, charClass]" :style="charStyle">{{ item.char }}</text>
      </view>
    </template>
    <template v-else>
      <view :class="styles.pinyinRow">
        <text :class="[styles.pinyin, pinyinClass]" :style="pinyinStyle" v-for="(item, index) in pinyinData" :key="index">
          {{ item.pinyin || '\u00A0' }}
        </text>
      </view>
      <view :class="styles.textRow">
        <text :class="[styles.char, charClass]" :style="charStyle">{{ text }}</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, useCssModule } from 'vue'
import { getPinyinArray } from '../../utils/pinyin'

const styles = useCssModule('styles') as Record<string, string>

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

const alignClass = computed(() => {
  const map: Record<string, string> = {
    left: styles.alignLeft,
    center: '',
    right: styles.alignRight,
  }
  return map[props.align] || ''
})
</script>

<style lang="less" src="./index.less" module="styles"></style>