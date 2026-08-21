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
  // 用 Array.from 而非 split('')：正确处理 emoji 等占两个 UTF-16 code unit 的字符，
  // 避免跟下面按位置 zip 的拼音数组错位（pinyin-pro 是按 Unicode 码点算一个字符的）。
  const chars = Array.from(text)
  // 必须整句一次性调用，不能逐字调用——多音字/变调消歧靠的是整句的分词上下文，
  // 单字调用会丢掉上下文，只能落回默认读音（比如"了"会被标成 liǎo 而不是 le）。
  const pinyinList = pinyin(text, { type: 'array', toneType: 'symbol' }) as string[]
  return chars.map((char, index) => ({
    char,
    pinyin: /[\u4e00-\u9fa5]/.test(char) ? (pinyinList[index] || '') : ''
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