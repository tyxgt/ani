import type { UserInfo, MenuItem, KnowledgeCategory, KnowledgeAnimal } from '../types'

// ─── 登录相关常量 ─────────────────────────────────────────────
export const TOKEN_KEY = 'token'
export const USER_INFO_KEY = 'userInfo'
export const EXPIRES_AT_KEY = 'expiresAt'
export const LOGIN_CLOUD_FUNCTION = 'login'
export const CLOUD_ENV = 'env-a22YxZSttQ'
export const CLOUD_SERVICE_ID = '1m5svld6xb0hr'
export const CLOUD_FUNCTION_PATH = '/index'

export const WX_CLOUD_ENV = 'cloud1-d0g4jnows8cd22b84'

export const ERROR_CODE = {
  SUCCESS: 0,
  GENERAL_ERROR: -1,
  UNAUTHORIZED: 401,
}

// ─── 地图常量 ──────────────────────────────────────────────────
export const MAP_BACKGROUND_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/mapBackground.png'

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

export const REGION_IMAGE_URLS: Record<string, string> = {
  东北地区: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/map/northeast.png',
  华北地区: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/map/north.png',
  华东地区: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/map/east.png',
  华中地区: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/map/central.png',
  华南地区: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/map/south.png',
  西南地区: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/map/southwest.png',
  西北地区: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/map/northwest.png',
}

export interface RegionImageConfig {
  offsetX: number
  offsetY: number
  scale: number
  fit: 'cover' | 'contain' | 'fill'
}

export const REGION_IMAGE_CONFIG: Record<string, RegionImageConfig> = {
  东北地区: { offsetX: 0, offsetY: 0, scale: 1, fit: 'cover' },
  华北地区: { offsetX: 0, offsetY: 0, scale: 1, fit: 'cover' },
  华东地区: { offsetX: 0, offsetY: 0, scale: 1, fit: 'cover' },
  华中地区: { offsetX: 0, offsetY: 0, scale: 1, fit: 'cover' },
  华南地区: { offsetX: 0, offsetY: 0, scale: 1, fit: 'cover' },
  西南地区: { offsetX: 0, offsetY: 0, scale: 1, fit: 'cover' },
  西北地区: { offsetX: 0, offsetY: 0, scale: 1, fit: 'cover' },
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
    description: '这里有大片的沙漠和美丽的绿洲,还有高高的天山呢!',
    image: '/static/one.png',
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
export const INFO_CARD_TOP_OFFSET = 280

// 缩放比例限制
export const MIN_SCALE = 0.5
export const MAX_SCALE = 5

// 纬度拉伸系数
export const LAT_STRETCH = 1.3

// ─── 首页常量 ──────────────────────────────────────────────────
export const HOME_BACKGROUND_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/backgroundView.png'
export const HOME_PANDA_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/doctorpanda.png'
export const AUDIO_ICON_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/voiceSwitch.png'
export const BTN_ICON_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/moutain.png'

// ─── AI 助手常量 ──────────────────────────────────────────────────
export const AI_PANDA_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/chatsys.png'

export const AI_BACKGROUND_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/aiback.png'

export const AI_INPUT_PANDA_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/panda.png'

// ─── 用户数据 ──────────────────────────────────────────────────
export const DEFAULT_USER_INFO: UserInfo = {
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

// ─── 知识库数据 ──────────────────────────────────────────────────

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    id: 1,
    name: '地形',
    icon: '🏔️',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
  },
  {
    id: 2,
    name: '气候',
    icon: '🌤️',
    color: '#42A5F5',
    bgColor: '#E3F2FD',
  },
  {
    id: 3,
    name: '动物',
    icon: '🦊',
    color: '#FF9800',
    bgColor: '#FFF3E0',
  },
]

const PANDA_IMG =
  'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20giant%20panda%20sitting%20eating%20bamboo%20watercolor%20cartoon%20style%20green%20forest%20background&image_size=square_hd'
const TIGER_IMG =
  'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20siberian%20tiger%20cub%20sitting%20grass%20watercolor%20cartoon%20style%20warm%20colors&image_size=square_hd'
const MONKEY_IMG =
  'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20golden%20snub%20nosed%20monkey%20sitting%20on%20branch%20snow%20mountain%20background%20watercolor%20cartoon%20style&image_size=square_hd'
const ELEPHANT_IMG =
  'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20asian%20elephant%20standing%20grassland%20watercolor%20cartoon%20style%20green%20trees%20background&image_size=square_hd'
const CRANE_IMG =
  'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20red%20crowned%20crane%20standing%20in%20water%20reeds%20watercolor%20cartoon%20style%20blue%20sky%20background&image_size=square_hd'

export const KNOWLEDGE_ANIMALS: KnowledgeAnimal[] = [
  {
    id: 1,
    name: '大熊猫',
    image: PANDA_IMG,
    protectionLevel: '国家一级保护动物',
    protectionBgColor: '#E8F5E9',
    protectionTextColor: '#2E7D32',
    borderColor: '#66BB6A',
  },
  {
    id: 2,
    name: '东北虎',
    image: TIGER_IMG,
    protectionLevel: '国家一级保护动物',
    protectionBgColor: '#FFF3E0',
    protectionTextColor: '#E65100',
    borderColor: '#FFA726',
  },
  {
    id: 3,
    name: '金丝猴',
    image: MONKEY_IMG,
    protectionLevel: '国家一级保护动物',
    protectionBgColor: '#E3F2FD',
    protectionTextColor: '#1565C0',
    borderColor: '#42A5F5',
  },
  {
    id: 4,
    name: '亚洲象',
    image: ELEPHANT_IMG,
    protectionLevel: '国家一级保护动物',
    protectionBgColor: '#EDE7F6',
    protectionTextColor: '#4527A0',
    borderColor: '#9575CD',
  },
  {
    id: 5,
    name: '丹顶鹤',
    image: CRANE_IMG,
    protectionLevel: '国家一级保护动物',
    protectionBgColor: '#FCE4EC',
    protectionTextColor: '#C2185B',
    borderColor: '#F48FB1',
  },
]
