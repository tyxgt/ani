// ─── 地图相关类型 ───────────────────────────────────────────────
export interface ProjectedPoint {
  x: number
  y: number
}

export type Ring = ProjectedPoint[]

export type Polygon = Ring[]

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
}

// ─── 用户相关类型 ───────────────────────────────────────────────
export interface UserInfo {
  avatar: string
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

export interface CloudFunctionResult<T = any> {
  errCode: number
  errMsg: string
  data: T
}

export interface LoginData {
  token: string
  user: DouyinUserInfo
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

export interface RegionAnimal {
  name: string
  pinyin: string
  image: string
  location: string
  locationColor: string
}

export interface RegionDetail {
  name: string
  pinyin: string
  description: string
  geoFeatures: RegionGeoFeature[]
  animals: RegionAnimal[]
}

// ─── 聊天消息相关类型 ───────────────────────────────────────────
export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  time: string
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
