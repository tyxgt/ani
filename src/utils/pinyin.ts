import { pinyin } from 'pinyin-pro'

const cache = new Map<string, string>()

export function getPinyin(text: string): string {
  if (!text) return ''
  if (cache.has(text)) {
    return cache.get(text)!
  }

  const result = pinyin(text, {
    toneType: 'symbol',
    type: 'string',
    separator: ' '
  })

  cache.set(text, result)
  return result
}

export function getPinyinArray(text: string): Array<{ char: string; pinyin: string }> {
  // 云函数返回的数据字段可能缺失（脏数据/字段未配置），text 可能是 undefined/null，
  // 这里兜底为空数组，避免 PinyinText 渲染时因 undefined.split 直接崩溃。
  if (!text) return []
  const chars = text.split('')
  return chars.map(char => ({
    char,
    pinyin: /[\u4e00-\u9fa5]/.test(char) ? pinyin(char, { toneType: 'symbol' }) : ''
  }))
}

export function getPinyinWithToneNumber(text: string): string {
  if (!text) return ''
  return pinyin(text, {
    toneType: 'num',
    type: 'string',
    separator: ' '
  })
}