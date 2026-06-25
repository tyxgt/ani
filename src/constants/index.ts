import type { UserInfo, MenuItem } from '../types'

// ─── 地图常量 ──────────────────────────────────────────────────
export const MAP_BACKGROUND_URL =
  'https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/mapBackground.png'

export const REGION_COLORS: Record<string, string> = {
  东北地区: '#7CB342',
  华北地区: '#FFB300',
  西北地区: '#FFA726',
  西南地区: '#5C6BC0',
  华中地区: '#EF5350',
  华东地区: '#FF7043',
  华南地区: '#AB47BC',
  台湾: '#4CAF50',
}

export const SELECTED_COLOR = '#FFD54F'
export const BORDER_COLOR = '#fff'
export const BORDER_WIDTH = 1
export const SELECTED_BORDER_WIDTH = 2

export const REGIONS = [
  {
    name: '东北地区',
    description: '这里有茂密的森林和肥沃的黑土地，冬天会下大雪哦！',
    image: '',
  },
  {
    name: '华北地区',
    description: '这里有雄伟的长城和广阔的平原，是中华文明的发源地之一。',
    image: '',
  },
  {
    name: '西北地区',
    description: '这里有大片的沙漠和美丽的绿洲，还有高高的天山呢！',
    image: '',
  },
  {
    name: '西南地区',
    description: '这里山很多，森林茂密，就像大熊猫的秘密花园！',
    image: '',
  },
  {
    name: '华中地区',
    description: '这里有很多湖泊和大河，是鱼米之乡，物产丰富！',
    image: '',
  },
  {
    name: '华东地区',
    description: '这里有江南水乡和美丽的海岸，经济发达，风景如画！',
    image: '',
  },
  {
    name: '华南地区',
    description: '这里天气炎热，有很多热带水果，还有美丽的海滩！',
    image: '',
  },
]

/** 手动调整各地区文字位置的偏移配置 (x, y, angle) */
export const LABEL_OFFSET_CONFIG: Record<string, { x: number; y: number; angle?: number }> = {
  东北地区: { x: 12, y: 0, angle: 0 },
  华北地区: { x: -18, y: 18, angle: 0 },
  西北地区: { x: 30, y: 10, angle: 0 },
  西南地区: { x: 40, y: 0, angle: 0 },
  华中地区: { x: -5, y: 0, angle: 0 },
  华东地区: { x: 5, y: 0, angle: 0 },
  华南地区: { x: 0, y: 0, angle: 0 },
}

// 地理边界坐标
export const GEO_WEST = 73.5
export const GEO_EAST = 135.1
export const GEO_SOUTH = 18.1
export const GEO_NORTH = 53.6

// 布局偏移
export const HEADER_BOTTOM = 140
export const INFO_CARD_TOP_OFFSET = 250

// 缩放比例限制
export const MIN_SCALE = 0.5
export const MAX_SCALE = 5

// 纬度拉伸系数
export const LAT_STRETCH = 1.3

// ─── 首页常量 ──────────────────────────────────────────────────
export const HOME_BACKGROUND_URL =
  'https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/backgroundView.png'
export const HOME_PANDA_URL =
  'https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/doctorpanda.png'
export const AUDIO_ICON_URL =
  'https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/voiceSwitch.png'
export const BTN_ICON_URL =
  'https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/moutain.png'

// ─── AI 助手常量 ──────────────────────────────────────────────────
export const AI_PANDA_URL =
  'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20panda%20wearing%20doctor%20coat%20stethoscope%20friendly%20waving%20cartoon%20style%20transparent%20background&image_size=square'

// ─── 用户数据 ──────────────────────────────────────────────────
export const DEFAULT_USER_INFO: UserInfo = {
  avatar:
    'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20yellow%20duck%20wearing%20explorer%20hat%20cartoon%20style&image_size=square',
  nickname: '小黄鸭',
  description: '热爱探索的小探险家',
}

export const MENU_LIST: MenuItem[] = [
  {
    id: 1,
    name: '设置',
    icon: 'settings',
    action: 'settings',
  },
  { id: 2, name: '关于我们', icon: 'about', action: 'about' },
  {
    id: 3,
    name: '意见反馈',
    icon: 'feedback',
    action: 'feedback',
  },
  { id: 4, name: '分享', icon: 'share', action: 'share' },
]

export const ICON_STYLE_MAP: Record<string, string> = {
  settings: '',
  about: '',
  feedback: '',
  share: '',
}

// ─── 学习数据 ──────────────────────────────────────────────────
export const LEARN_LIST = [
  {
    id: 1,
    name: '动物百科',
    icon: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20animal%20panda%20icon%20cartoon&image_size=square',
  },
  {
    id: 2,
    name: '地理知识',
    icon: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=mountain%20globe%20geography%20icon%20cartoon&image_size=square',
  },
  {
    id: 3,
    name: '有趣故事',
    icon: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=book%20story%20fairy%20tale%20icon%20cartoon&image_size=square',
  },
  {
    id: 4,
    name: '趣味问答',
    icon: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=question%20quiz%20puzzle%20icon%20cartoon&image_size=square',
  },
]
