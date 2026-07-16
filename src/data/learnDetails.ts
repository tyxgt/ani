import type { TerrainItem, ClimateItem, AnimalDetailItem } from '../types'

const img = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`

// ─── 地形详情数据 ─────────────────────────────────────────────
export const TERRAIN_DETAILS: Record<string, TerrainItem> = {
  高山地形: {
    id: 1,
    name: '高山地形',
    pinyin: 'gāo shān dì xíng',
    image: img(
      'cute alpine mountain landscape watercolor cartoon style snow peaks blue sky eagle flying goat marmot wildflowers'
    ),
    features: '高聳陡峭，海拔高',
    climate: '寒冷，氧氣稀薄',
    vegetation: '稀疏，適應高寒環境',
    region: '喜馬拉雅山、青藏高原',
    summary: '獨特的高山生態系統',
    bannerIcon: '🛡️',
    pageBg: '#FFF8E1',
  },
  平原: {
    id: 2,
    name: '平原',
    pinyin: 'píng yuán',
    image: img(
      'cute vast green plain landscape watercolor cartoon style farmland river village blue sky'
    ),
    features: '地勢平坦開闊，土地肥沃',
    climate: '溫和濕潤，四季分明',
    vegetation: '農田密佈，莊稼茂盛',
    region: '東北平原、華北平原、長江中下游平原',
    summary: '孕育文明的肥沃土地',
    bannerIcon: '🌾',
    pageBg: '#E8F5E9',
  },
  盆地: {
    id: 3,
    name: '盆地',
    pinyin: 'pén dì',
    image: img(
      'cute basin landscape watercolor cartoon style surrounded mountains warm colors village river'
    ),
    features: '四周高、中間低，像大盆子',
    climate: '溫暖濕潤，少風沙',
    vegetation: '亞熱帶植物豐富',
    region: '四川盆地、塔里木盆地',
    summary: '群山環抱的天府之國',
    bannerIcon: '⛰️',
    pageBg: '#E3F2FD',
  },
  高原: {
    id: 4,
    name: '高原',
    pinyin: 'gāo yuán',
    image: img(
      'cute high plateau landscape watercolor cartoon style grassland blue sky yaks distant mountains'
    ),
    features: '海拔高，面積大，地面開闊',
    climate: '氣候寒冷，日照充足',
    vegetation: '草原廣闊，高山草甸',
    region: '青藏高原、內蒙古高原、雲貴高原',
    summary: '離天空最近的地方',
    bannerIcon: '🌄',
    pageBg: '#F3E5F5',
  },
}

// ─── 气候详情数据 ─────────────────────────────────────────────
export const CLIMATE_DETAILS: Record<string, ClimateItem> = {
  温带气候: {
    id: 1,
    name: '温带气候',
    pinyin: 'wēn dài qì hòu',
    image: img(
      'cute four seasons landscape watercolor cartoon style spring summer autumn winter trees'
    ),
    temperature: '四季分明，溫暖舒適',
    precipitation: '四季均勻分佈，適度降雨',
    characteristics: '春暖夏熱 秋涼冬冷',
    region: '中國東部、日本、歐洲',
    summary: '適合多種生物生存',
    bannerIcon: '🌱',
    pageBg: '#FFF3E0',
  },
  热带气候: {
    id: 2,
    name: '热带气候',
    pinyin: 'rè dài qì hòu',
    image: img(
      'cute tropical rainforest landscape watercolor cartoon style coconut palm monkey colorful birds'
    ),
    temperature: '全年高溫，炎熱潮濕',
    precipitation: '雨水豐沛，分旱雨兩季',
    characteristics: '陽光充足，植物常綠',
    region: '中國華南、海南、雲南南部',
    summary: '陽光與雨林的家園',
    bannerIcon: '🌴',
    pageBg: '#E8F5E9',
  },
  寒带气候: {
    id: 3,
    name: '寒带气候',
    pinyin: 'hán dài qì hòu',
    image: img(
      'cute cold polar landscape watercolor cartoon style snow forest aurora bear blue tone'
    ),
    temperature: '全年寒冷，冬季漫長',
    precipitation: '降水稀少，以雪為主',
    characteristics: '冰雪覆蓋，針葉林為主',
    region: '中國東北北部、俄羅斯西伯利亞',
    summary: '冰雪精靈的故鄉',
    bannerIcon: '❄️',
    pageBg: '#E3F2FD',
  },
  高原气候: {
    id: 4,
    name: '高原气候',
    pinyin: 'gāo yuán qì hòu',
    image: img(
      'cute high plateau climate landscape watercolor cartoon style bright sun thin air yaks tents'
    ),
    temperature: '氣溫低，日夜溫差大',
    precipitation: '降水少，空氣稀薄乾燥',
    characteristics: '陽光強烈，輻射強',
    region: '青藏高原、帕米爾高原',
    summary: '離太陽最近的天空',
    bannerIcon: '☀️',
    pageBg: '#FFF8E1',
  },
}

// ─── 动物详情数据 ─────────────────────────────────────────────
export const ANIMAL_DETAILS: Record<string, AnimalDetailItem> = {
  大熊貓: {
    id: 1,
    name: '大熊貓',
    pinyin: 'dà xióng māo',
    image: img(
      'cute giant panda sitting eating bamboo watercolor cartoon style green bamboo forest'
    ),
    habitat: '生活在霧氣繚繞的竹林中',
    food: '最愛大口大口吃竹子',
    habits: '喜歡睡覺，睡很久',
    secret: '剛出生的熊貓寶寶好小好小！',
    protectionLevel: '國家一級保護動物',
    protectionBgColor: '#E8F5E9',
    protectionTextColor: '#2E7D32',
    borderColor: '#66BB6A',
    pageBg: '#F1F8E9',
  },
  东北虎: {
    id: 2,
    name: '东北虎',
    pinyin: 'dōng běi hǔ',
    image: img(
      'cute siberian tiger cub sitting grass watercolor cartoon style warm colors'
    ),
    habitat: '生活在東北的森林和山區',
    food: '喜歡吃鹿、野豬等動物',
    habits: '喜歡獨來獨往，是森林之王',
    secret: '虎紋和人一樣，每隻都不一樣！',
    protectionLevel: '國家一級保護動物',
    protectionBgColor: '#FFF3E0',
    protectionTextColor: '#E65100',
    borderColor: '#FFA726',
    pageBg: '#FFF3E0',
  },
  金丝猴: {
    id: 3,
    name: '金丝猴',
    pinyin: 'jīn sī hóu',
    image: img(
      'cute golden snub nosed monkey sitting on branch snow mountain background watercolor cartoon style'
    ),
    habitat: '棲息在雲霧繚繞的高山森林',
    food: '最愛吃嫩葉、嫩芽和野果',
    habits: '喜歡成群結隊在樹上跳躍',
    secret: '它們沒有鼻孔，下雨要低頭！',
    protectionLevel: '國家一級保護動物',
    protectionBgColor: '#E3F2FD',
    protectionTextColor: '#1565C0',
    borderColor: '#42A5F5',
    pageBg: '#E3F2FD',
  },
  亚洲象: {
    id: 4,
    name: '亚洲象',
    pinyin: 'yà zhōu xiàng',
    image: img(
      'cute asian elephant standing grassland watercolor cartoon style green trees background'
    ),
    habitat: '生活在南方的熱帶雨林',
    food: '喜歡吃樹葉、果實和竹子',
    habits: '喜歡用長鼻子洗澡玩水',
    secret: '象的記憶力超強，能記住十幾年前的事！',
    protectionLevel: '國家一級保護動物',
    protectionBgColor: '#EDE7F6',
    protectionTextColor: '#4527A0',
    borderColor: '#9575CD',
    pageBg: '#EDE7F6',
  },
  丹顶鹤: {
    id: 5,
    name: '丹顶鹤',
    pinyin: 'dān dǐng hè',
    image: img(
      'cute red crowned crane standing in water reeds watercolor cartoon style blue sky background'
    ),
    habitat: '棲息在沼澤和濕地',
    food: '愛吃魚、蝦和水生植物',
    habits: '喜歡翩翩起舞，姿態優雅',
    secret: '丹頂鶴的頭頂是鮮紅色的"丹頂"！',
    protectionLevel: '國家一級保護動物',
    protectionBgColor: '#FCE4EC',
    protectionTextColor: '#C2185B',
    borderColor: '#F48FB1',
    pageBg: '#FCE4EC',
  },
}
