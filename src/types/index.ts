// ─── 地图相关类型 ───────────────────────────────────────────────
export interface ProjectedPoint {
  x: number
  y: number
}

export type Ring = ProjectedPoint[]

export type Polygon = Ring[]

export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface ProjectedFeature {
  name: string
  pinyin: string
  description: string
  /** One entry per MultiPolygon polygon, each containing rings of projected points */
  polygons: Polygon[]
  /** Centroid in drawing-space coordinates */
  centroid: ProjectedPoint
  /** 主轴角度，用于文字旋转 */
  angle: number
  /** Precomputed bounding box in drawing-space coordinates */
  bbox: BBox
}

// ─── 用户相关类型 ───────────────────────────────────────────────
export interface UserInfo {
  avatar?: string
  nickname: string
  description: string
}

export interface DouyinUserInfo {
  openid: string
  unionid?: string
  nickName: string
  avatarUrl: string
  phoneNumber?: string
  gender?: number
}

export interface WechatUserInfo {
  openid: string
  unionid?: string
  nickName: string
  avatarUrl: string
  phoneNumber?: string
  gender?: number
  country?: string
  province?: string
  city?: string
  language?: string
}

export interface CloudFunctionResult<T = any> {
  code: number
  msg: string
  data: T
}

export interface LoginData {
  token: string
  openid: string
  expiresAt: number
  userCode?: string | null
  isVip?: boolean
  vipExpireAt?: number | null
  vipType?: 'week' | 'month' | null
}

export interface MenuItem {
  id: number
  name: string
  icon: string
  action: string
}

// ─── 地区详情相关类型 ───────────────────────────────────────────
export interface RegionGeoFeature {
  name: string
  icon: string
  bgColor: string
}

export interface RegionDetail {
  name: string
  pinyin: string
  description: string
  geoFeatures: RegionGeoFeature[]
  provinces: string[]
}

// ─── 聊天消息相关类型 ───────────────────────────────────────────
export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  time: string
  typing?: boolean
}

// ─── 知识库相关类型 ───────────────────────────────────────────
export interface KnowledgeCategory {
  id: number
  name: string
  icon: string
  color: string
  bgColor: string
}

export interface KnowledgeAnimal {
  id: number
  name: string
  image: string
  protectionLevel: string
  protectionBgColor: string
  protectionTextColor: string
  borderColor: string
}

// ─── 学习详情页类型（地形 / 气候 / 动物） ──────────────────────────
export interface TerrainItem {
  id: number
  name: string
  pinyin: string
  image: string
  features: string
  climate: string
  vegetation: string
  region: string
  summary: string
  bannerIcon: string
  pageBg: string
}

export interface ClimateItem {
  id: number
  name: string
  pinyin: string
  image: string
  climate: string
  precipitation: string
  characteristics: string
  region: string
  summary: string
  bannerIcon: string
  pageBg: string
}

export interface AnimalDetailItem {
  id: number
  name: string
  pinyin: string
  image: string
  habitat: string
  food: string
  habits: string
  secret: string
  protectionLevel: string
  protectionBgColor: string
  protectionTextColor: string
  borderColor: string
  pageBg: string
}

// ─── 学习页卡片统一类型 ─────────────────────────────────────────
export interface LearnCardItem {
  id: number
  name: string
  image: string
  tagText: string
  tagBgColor: string
  tagBorderColor: string
  tagTextColor: string
  borderColor: string
}
