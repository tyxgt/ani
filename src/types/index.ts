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

export interface MenuItem {
  id: number
  name: string
  icon: string
  action: string
}
