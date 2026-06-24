import { pinyin } from 'pinyin-pro'

const cache = new Map<string, string>()

export function getPinyin(text: string): string {
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
  const chars = text.split('')
  return chars.map(char => ({
    char,
    pinyin: /[\u4e00-\u9fa5]/.test(char) ? pinyin(char, { toneType: 'symbol' }) : ''
  }))
}

export function getPinyinWithToneNumber(text: string): string {
  return pinyin(text, {
    toneType: 'num',
    type: 'string',
    separator: ' '
  })
}