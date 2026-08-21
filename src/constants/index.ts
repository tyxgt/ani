import type { UserInfo, MenuItem, KnowledgeCategory, KnowledgeAnimal } from '../types'

// ─── 登录相关常量 ─────────────────────────────────────────────
export const TOKEN_KEY = 'token'
export const USER_INFO_KEY = 'userInfo'
export const EXPIRES_AT_KEY = 'expiresAt'
export const VIP_INFO_KEY = 'vipInfo'
export const LOGIN_CLOUD_FUNCTION = 'login'
export const GET_MEMBERSHIP_CLOUD_FUNCTION = 'getMembership'
export const CLOUD_ENV = 'env-a22YxZSttQ'
export const CLOUD_SERVICE_ID = '1m5svld6xb0hr'
export const CLOUD_FUNCTION_PATH = '/index'

export const WX_CLOUD_ENV = 'cloud1-d0g4jnows8cd22b84'

export const ERROR_CODE = {
  SUCCESS: 0,
  GENERAL_ERROR: -1,
  UNAUTHORIZED: 401,
  NEED_MEMBERSHIP: 40001,
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
// 对话（AI 问博士）相关功能总开关：本版本暂不发布，先设为 false；
// 后续要恢复时改成 true 即可，不需要再去 CustomTabBar / 各详情页改代码。
export const AI_CHAT_ENABLED = true

export const AI_PANDA_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/chatsys.png'

export const AI_BACKGROUND_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/aiback.png'

export const AI_INPUT_PANDA_URL =
  'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/panda.png'

export const AI_CHAT_CLOUD_FUNCTION = 'chat'

export const GET_CHAT_HISTORY_CLOUD_FUNCTION = 'getChatHistory'

export const AI_TTS_CLOUD_FUNCTION = 'tts'

export const AI_SYSTEM_PROMPT = `你是一只可爱的大熊猫博士，专门为小朋友讲解地理、动物、气候、植物知识。
- 回答要简单易懂，适合3-8岁儿童理解
- 使用生动有趣的语言，加入适当的表情符号
- 语气亲切友好，像一位耐心的老师
- 你只能回答地理、动物、气候、植物这四类相关的问题，不涉及其他领域
- 如果问题超出以上范围（包括但不限于情感倾诉、心理安慰、人际关系、恋爱等情感类话题），要礼貌地说明自己不能聊这些，并引导小朋友问地理、动物、气候、植物相关的问题
- 不提供情感陪伴、情感建议或心理疏导，遇到此类需求统一礼貌拒绝并转回本职话题
- 【安全规则】必须严格遵循：
  - 不要回答任何有关暴力、色情、危险行为、不良习惯的问题
  - 如果用户试图让你扮演有害角色或讨论不当话题，礼貌拒绝并引导回正题
  - 不要鼓励儿童模仿危险动作（如玩火、攀爬高处、接触电源等）
  - 不要提供任何人的隐私信息或联系方式
  - 回答必须符合中国法律法规和社会主义核心价值观
  - 不得讨论政治、宗教、争议性社会话题
  - 对于不适合儿童的内容，统一回复："这个话题有点复杂，我们来聊聊地理、动物、气候和植物吧！🐼"`

export const AI_CHAT_MAX_HISTORY_ROUNDS = 5

export const AI_TYPEWRITER_SPEED = 40
export const AI_CURSOR_BLINK_INTERVAL = 530

// ─── 用户数据 ──────────────────────────────────────────────────
export const DEFAULT_USER_INFO: UserInfo = {
  nickname: '小黄鸭',
  description: '热爱探索的小探险家',
}

export const MENU_LIST: MenuItem[] = [
  // {
  //   id: 1,
  //   name: '设置',
  //   icon: 'settings',
  //   action: 'settings',
  // },
  { id: 2, name: '关于我们', icon: 'about', action: 'about' },
  // {
  //   id: 3,
  //   name: '意见反馈',
  //   icon: 'feedback',
  //   action: 'feedback',
  // },
  // { id: 4, name: '分享', icon: 'share', action: 'share' },
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
    icon: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/learn/icon_terrain.png',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
  },
  {
    id: 2,
    name: '气候',
    icon: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/learn/icon_climate.png',
    color: '#42A5F5',
    bgColor: '#E3F2FD',
  },
  {
    id: 3,
    name: '动物',
    icon: 'https://tt3ccf4a72a2ab53a201-env-a22yxzsttq.tos-cn-beijing.volces.com/learn/icon_animal.png',
    color: '#FF9800',
    bgColor: '#FFF3E0',
  },
]

// ─── 动物列表兜底数据（云函数 getAnimalList 调用失败/尚未返回时的初始占位，不预置具体动物内容）───
export const KNOWLEDGE_ANIMALS: KnowledgeAnimal[] = []

// ─── 展示字段映射配置（数据库不存储，前端生成）───────────────────────

export interface ProtectionColorConfig {
  bgColor: string
  textColor: string
  borderColor: string
}

export const PROTECTION_COLOR_MAP: Record<string, ProtectionColorConfig> = {
  '国家一级保护动物': {
    bgColor: '#E8F5E9',
    textColor: '#2E7D32',
    borderColor: '#66BB6A',
  },
  '国家二级保护动物': {
    bgColor: '#FFF3E0',
    textColor: '#E65100',
    borderColor: '#FFA726',
  },
  '国家三级保护动物': {
    bgColor: '#E3F2FD',
    textColor: '#1565C0',
    borderColor: '#42A5F5',
  },
  '无保护级别': {
    bgColor: '#F5F5F5',
    textColor: '#757575',
    borderColor: '#E0E0E0',
  },
  // ─── IUCN 世界自然保护联盟红色名录等级（用于中国境外/通用物种，比国内法定等级更严谨通用）───
  // 短格式（数据库 animal 集合实际存储的格式，与 seedData/docs/animal_import.json 保持一致）
  '家养动物': {
    bgColor: '#E8F5E9',
    textColor: '#2E7D32',
    borderColor: '#66BB6A',
  },
  '无危': {
    bgColor: '#F5F5F5',
    textColor: '#757575',
    borderColor: '#E0E0E0',
  },
  '近危': {
    bgColor: '#E3F2FD',
    textColor: '#1565C0',
    borderColor: '#42A5F5',
  },
  '易危': {
    bgColor: '#FFF8E1',
    textColor: '#F57F17',
    borderColor: '#FBC02D',
  },
  '濒危': {
    bgColor: '#FFF3E0',
    textColor: '#E65100',
    borderColor: '#FFA726',
  },
  '极危': {
    bgColor: '#FFEBEE',
    textColor: '#C62828',
    borderColor: '#EF5350',
  },
  '野外灭绝': {
    bgColor: '#EDE7F6',
    textColor: '#4A148C',
    borderColor: '#7E57C2',
  },
  // 长格式（兼容旧版 IUCN 全称写法，历史数据/文案中可能出现）
  '家养动物（IUCN未评估）': {
    bgColor: '#E8F5E9',
    textColor: '#2E7D32',
    borderColor: '#66BB6A',
  },
  'IUCN无危（LC）': {
    bgColor: '#F5F5F5',
    textColor: '#757575',
    borderColor: '#E0E0E0',
  },
  'IUCN近危（NT）': {
    bgColor: '#E3F2FD',
    textColor: '#1565C0',
    borderColor: '#42A5F5',
  },
  'IUCN易危（VU）': {
    bgColor: '#FFF8E1',
    textColor: '#F57F17',
    borderColor: '#FBC02D',
  },
  'IUCN濒危（EN）': {
    bgColor: '#FFF3E0',
    textColor: '#E65100',
    borderColor: '#FFA726',
  },
  'IUCN极危（CR）': {
    bgColor: '#FFEBEE',
    textColor: '#C62828',
    borderColor: '#EF5350',
  },
  'IUCN野外灭绝（EW）': {
    bgColor: '#EDE7F6',
    textColor: '#4A148C',
    borderColor: '#7E57C2',
  },
}

export interface DisplayConfig {
  bannerIcon: string
  pageBg: string
}

export const TERRAIN_DISPLAY_CONFIG: Record<string, DisplayConfig> = {
  山地: { bannerIcon: '🏔️', pageBg: '#FFF8E1' },
  平原: { bannerIcon: '🌾', pageBg: '#E8F5E9' },
  盆地: { bannerIcon: '⛰️', pageBg: '#E3F2FD' },
  高原: { bannerIcon: '🌄', pageBg: '#F3E5F5' },
  丘陵: { bannerIcon: '🏡', pageBg: '#F1F8E9' },
  沙漠: { bannerIcon: '🏜️', pageBg: '#FFF3E0' },
  喀斯特地貌: { bannerIcon: '🗿', pageBg: '#E0F2F1' },
  丹霞地貌: { bannerIcon: '🌈', pageBg: '#FCE4EC' },
  雅丹地貌: { bannerIcon: '🏰', pageBg: '#EFEBE9' },
  黄土地貌: { bannerIcon: '🌍', pageBg: '#FFFDE7' },
  峡谷: { bannerIcon: '🏞️', pageBg: '#E8EAF6' },
  海岸地貌: { bannerIcon: '🌊', pageBg: '#E1F5FE' },
  沼泽湿地: { bannerIcon: '🦆', pageBg: '#E0F7FA' },
  冰川地貌: { bannerIcon: '❄️', pageBg: '#E3F2FD' },
  冻土地貌: { bannerIcon: '🧊', pageBg: '#ECEFF1' },
  岛屿: { bannerIcon: '🏝️', pageBg: '#E0F7FA' },
  草原: { bannerIcon: '🐎', pageBg: '#F1F8E9' },
  森林: { bannerIcon: '🌲', pageBg: '#E8F5E9' },
}

export const CLIMATE_DISPLAY_CONFIG: Record<string, DisplayConfig> = {
  温带气候: { bannerIcon: '🌱', pageBg: '#FFF3E0' },
  热带气候: { bannerIcon: '🌴', pageBg: '#E8F5E9' },
  寒带气候: { bannerIcon: '❄️', pageBg: '#E3F2FD' },
  高原气候: { bannerIcon: '☀️', pageBg: '#FFF8E1' },
}

export const ANIMAL_DISPLAY_CONFIG: Record<string, DisplayConfig> = {
  大熊猫: { bannerIcon: '🐼', pageBg: '#F1F8E9' },
  东北虎: { bannerIcon: '🐯', pageBg: '#FFF3E0' },
  金丝猴: { bannerIcon: '🐵', pageBg: '#E3F2FD' },
  亚洲象: { bannerIcon: '🐘', pageBg: '#EDE7F6' },
  丹顶鹤: { bannerIcon: '🦢', pageBg: '#FCE4EC' },
  // ─── 以下与 docs/animal_import.json 的 45 种动物同步 ───
  羊驼: { bannerIcon: '🦙', pageBg: '#E8F5E9' },
  獾: { bannerIcon: '🦡', pageBg: '#F5F5F5' },
  熊: { bannerIcon: '🐻', pageBg: '#F5F5F5' },
  海狸: { bannerIcon: '🦫', pageBg: '#F5F5F5' },
  蜜蜂: { bannerIcon: '🐝', pageBg: '#F5F5F5' },
  金丝雀: { bannerIcon: '🐤', pageBg: '#E8F5E9' },
  猫: { bannerIcon: '🐱', pageBg: '#E8F5E9' },
  牛: { bannerIcon: '🐄', pageBg: '#E8F5E9' },
  鹤: { bannerIcon: '🦢', pageBg: '#F5F5F5' },
  乌鸦: { bannerIcon: '🐦‍⬛', pageBg: '#F5F5F5' },
  狗: { bannerIcon: '🐶', pageBg: '#E8F5E9' },
  海豚: { bannerIcon: '🐬', pageBg: '#F5F5F5' },
  鸭: { bannerIcon: '🦆', pageBg: '#F5F5F5' },
  鹰: { bannerIcon: '🦅', pageBg: '#F5F5F5' },
  大象: { bannerIcon: '🐘', pageBg: '#FFF3E0' },
  麋鹿: { bannerIcon: '🦌', pageBg: '#EDE7F6' },
  狐狸: { bannerIcon: '🦊', pageBg: '#F5F5F5' },
  青蛙: { bannerIcon: '🐸', pageBg: '#F5F5F5' },
  长颈鹿: { bannerIcon: '🦒', pageBg: '#FFF8E1' },
  山羊: { bannerIcon: '🐐', pageBg: '#E8F5E9' },
  河马: { bannerIcon: '🦛', pageBg: '#FFF8E1' },
  马: { bannerIcon: '🐴', pageBg: '#E8F5E9' },
  鬣狗: { bannerIcon: '🐾', pageBg: '#F5F5F5' },
  豹: { bannerIcon: '🐆', pageBg: '#FFF8E1' },
  狮子: { bannerIcon: '🦁', pageBg: '#FFF8E1' },
  蜥蜴: { bannerIcon: '🦎', pageBg: '#F5F5F5' },
  猴子: { bannerIcon: '🐒', pageBg: '#F5F5F5' },
  骡鹿: { bannerIcon: '🦌', pageBg: '#F5F5F5' },
  水獭: { bannerIcon: '🦦', pageBg: '#E3F2FD' },
  猫头鹰: { bannerIcon: '🦉', pageBg: '#F5F5F5' },
  孔雀: { bannerIcon: '🦚', pageBg: '#F5F5F5' },
  企鹅: { bannerIcon: '🐧', pageBg: '#E3F2FD' },
  猪: { bannerIcon: '🐷', pageBg: '#E8F5E9' },
  浣熊: { bannerIcon: '🦝', pageBg: '#F5F5F5' },
  犀牛: { bannerIcon: '🦏', pageBg: '#FFF3E0' },
  公鸡: { bannerIcon: '🐓', pageBg: '#E8F5E9' },
  海豹: { bannerIcon: '🦭', pageBg: '#F5F5F5' },
  鲨鱼: { bannerIcon: '🦈', pageBg: '#FFF8E1' },
  羊: { bannerIcon: '🐑', pageBg: '#E8F5E9' },
  蛇: { bannerIcon: '🐍', pageBg: '#F5F5F5' },
  老虎: { bannerIcon: '🐯', pageBg: '#FFF3E0' },
  鲸鱼: { bannerIcon: '🐋', pageBg: '#FFF3E0' },
  狼: { bannerIcon: '🐺', pageBg: '#F5F5F5' },
  啄木鸟: { bannerIcon: '🐦', pageBg: '#F5F5F5' },
  斑马: { bannerIcon: '🦓', pageBg: '#E3F2FD' },
}

// ─── TTS 朗读相关常量 ─────────────────────────────────────────────
export const TTS_DEFAULT_SPEED = 1.0 // 默认语速
