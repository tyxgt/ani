# "大熊猫博士" 接口文档

> **注**：当前架构使用**云函数**而非 REST API。所有接口通过 `callFunction(name, data)` 调用。
>
> 云平台：抖音云（`env-a22YxZSttQ`）+ 微信云开发（`cloud1-d0g4jnows8cd22b84`）
>
> 统一返回格式：`CloudFunctionResult<T>` = `{ code: number, msg: string, data: T | null }`

---

## 接口 1：用户登录 ⭐ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `login` |
| **当前状态** | ✅ 已实现（基础版本） |
| **实现文件** | `cloudfunctions/login/index.js` + `src/utils/auth.ts` |
| **请求方式** | `callFunction('login', { code })` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | `string` | 是 | 平台登录凭证（`tt.login` / `wx.login` 获取） |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 -1=失败 401=未授权 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data.token` | `string` | 登录令牌（32 字节 hex） |
| `data.openid` | `string` | 用户平台标识 |
| `data.unionid` | `string` | 平台统一标识（微信专属） |
| `data.expiresAt` | `number` | 过期时间戳（7 天后） |

### 待完善

- 返回数据中应包含用户昵称和头像
- 升级为 JWT 或含用户态的 token
- 补齐抖音云函数实现

---

## 接口 2：用户信息更新 ⬜ 待实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `updateUserInfo` |
| **当前状态** | ⬜ 待实现 |
| **当前 Mock** | `src/stores/user.ts` 本地存储 |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | `string` | 是 | 登录令牌 |
| `nickName` | `string` | 否 | 昵称 |
| `avatarUrl` | `string` | 否 | 头像 URL |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `UserInfo` | 更新后的用户信息 |

---

## 接口 3：获取区域列表 ⬜ 待实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getRegions` |
| **当前状态** | ⬜ 待实现 |
| **当前 Mock** | `src/constants/index.ts` - `REGIONS` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 无 | - | - | 公开数据，无需鉴权 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `Region[]` | 区域列表 |

**`Region` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `id` | `string` | 区域标识（如 `dongbei`） |
| `name` | `string` | 中文名称 |
| `pinyin` | `string` | 拼音 |
| `description` | `string` | 区域简介 |
| `color` | `string` | 区域主色（hex） |
| `bgImageUrl` | `string` | 背景图片 URL |
| `order` | `number` | 排序号 |

---

## 接口 4：获取区域详情 ⬜ 待实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getRegionDetail` |
| **当前状态** | ⬜ 待实现 |
| **当前 Mock** | `src/data/regionDetail.ts` - `REGION_DETAILS` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `regionId` | `string` | 是 | 区域标识 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data.name` | `string` | 区域名称 |
| `data.pinyin` | `string` | 拼音 |
| `data.description` | `string` | 详细描述 |
| `data.geoFeatures` | `GeoFeature[]` | 地理特征列表（3 项） |
| `data.animals` | `RegionAnimal[]` | 代表动物列表（4 项） |

**`GeoFeature` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `name` | `string` | 特征名称（如"林海雪原"） |
| `pinyin` | `string` | 拼音 |
| `icon` | `string` | 图标 URL |
| `bgColor` | `string` | 卡片背景色 |

**`RegionAnimal` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `name` | `string` | 动物名称 |
| `pinyin` | `string` | 拼音 |
| `image` | `string` | 图片 URL |
| `location` | `string` | 分布位置描述 |
| `locationColor` | `string` | 位置标签颜色 |
| `animalId` | `string` | 动物 ID（关联动物详情接口） |

---

## 接口 5：获取知识百科分类 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getKnowledgeCategories` |
| **当前状态** | ✅ 已实现 |
| **实现文件** | `cloudfunctions/getKnowledgeCategories/index.js` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 无 | - | - | 公开数据 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `Category[]` | 分类列表 |

**`Category` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `id` | `number` | 分类 ID（1=地形，2=气候，3=动物） |
| `name` | `string` | 分类名称 |
| `icon` | `string` | 图标（emoji） |
| `color` | `string` | 文字颜色（hex） |
| `bgColor` | `string` | 背景颜色（hex） |

---

## 接口 6：获取地形列表 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getTerrainList` |
| **当前状态** | ✅ 已实现 |
| **实现文件** | `cloudfunctions/getTerrainList/index.js` |
| **数据库集合** | `terrain` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 无 | - | - | 公开数据 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `Terrain[]` | 地形列表（按 id 升序） |

**`Terrain` 结构**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `number` | 是 | 业务 ID |
| `name` | `string` | 是 | 地形名称 |
| `image` | `string` | 是 | 图片 URL |
| `features` | `string` | 是 | 地形特征 |
| `climate` | `string` | 是 | 气候特点 |
| `vegetation` | `string` | 是 | 植被类型 |
| `region` | `string` | 是 | 代表地区 |
| `summary` | `string` | 是 | 总结描述 |

> **说明**：数据库不存储前端展示字段（pinyin、bannerIcon、pageBg），由前端根据名称在 `constants/index.ts` 的 `TERRAIN_DISPLAY_CONFIG` 中匹配。

---

## 接口 7：获取地形详情 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getTerrainDetail` |
| **当前状态** | ✅ 已实现 |
| **实现文件** | `cloudfunctions/getTerrainDetail/index.js` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | 是 | 地形名称 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `Terrain` | 地形详情（结构同接口 6） |

---

## 接口 8：获取气候列表 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getClimateList` |
| **当前状态** | ✅ 已实现 |
| **实现文件** | `cloudfunctions/getClimateList/index.js` |
| **数据库集合** | `climate` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 无 | - | - | 公开数据 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `Climate[]` | 气候列表（按 id 升序） |

**`Climate` 结构**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `number` | 是 | 业务 ID |
| `name` | `string` | 是 | 气候名称 |
| `image` | `string` | 是 | 图片 URL |
| `temperature` | `string` | 是 | 气温特点 |
| `precipitation` | `string` | 是 | 降水特点 |
| `characteristics` | `string` | 是 | 气候特点 |
| `region` | `string` | 是 | 代表地区 |
| `summary` | `string` | 是 | 总结描述 |

> **说明**：数据库不存储前端展示字段（pinyin、bannerIcon、pageBg），由前端根据名称在 `constants/index.ts` 的 `CLIMATE_DISPLAY_CONFIG` 中匹配。

---

## 接口 9：获取气候详情 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getClimateDetail` |
| **当前状态** | ✅ 已实现 |
| **实现文件** | `cloudfunctions/getClimateDetail/index.js` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | 是 | 气候名称 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `Climate` | 气候详情（结构同接口 8） |

---

## 接口 10：获取动物列表 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getAnimalList` |
| **当前状态** | ✅ 已实现 |
| **实现文件** | `cloudfunctions/getAnimalList/index.js` |
| **数据库集合** | `animal` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 无 | - | - | 公开数据 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `Animal[]` | 动物列表（按 id 升序） |

**`Animal` 结构**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `number` | 是 | 业务 ID |
| `name` | `string` | 是 | 动物名称 |
| `image` | `string` | 是 | 图片 URL |
| `habitat` | `string` | 是 | 栖息地 |
| `food` | `string` | 是 | 食物喜好 |
| `habits` | `string` | 是 | 生活习性 |
| `secret` | `string` | 是 | 趣味小秘密 |
| `protectionLevel` | `string` | 是 | 保护级别 |

> **说明**：数据库不存储前端展示字段（pinyin、protectionBgColor、protectionTextColor、borderColor、pageBg），由前端根据名称在 `constants/index.ts` 的 `PROTECTION_COLOR_MAP` 和 `ANIMAL_DISPLAY_CONFIG` 中匹配。

---

## 接口 11：获取动物详情 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getAnimalDetail` |
| **当前状态** | ✅ 已实现 |
| **实现文件** | `cloudfunctions/getAnimalDetail/index.js` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | 是 | 动物名称 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `Animal` | 动物详情（结构同接口 10） |

---

## 接口 12：AI 对话 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `chat` |
| **当前状态** | ✅ 已实现（对接 DeepSeek API） |
| **实现文件** | `cloudfunctions/chat/index.js` + `src/pages/ai/index.vue` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | `string` | 否 | 登录令牌 |
| `message` | `string` | 是 | 用户提问内容 |
| `history` | `ChatMessage[]` | 否 | 历史对话记录 |
| `sessionId` | `string` | 否 | 会话标识 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data.reply` | `string` | AI 回复内容 |
| `data.sessionId` | `string` | 会话标识（用于续传） |

> **部署依赖**：需在微信云开发控制台为 chat 云函数配置环境变量 `DEEPSEEK_API_KEY`（DeepSeek API 密钥），并在 `cloudfunctions/chat/` 目录下执行 `npm install` 安装依赖。

---

## 接口 13：提交意见反馈 ⬜ 待实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `submitFeedback` |
| **当前状态** | ⬜ 待实现 |
| **当前 Mock** | `src/pages/mine/index.vue` 弹窗占位 |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | `string` | 是 | 登录令牌 |
| `content` | `string` | 是 | 反馈内容 |
| `contact` | `string` | 否 | 联系方式 |
| `type` | `string` | 否 | 反馈类型（建议/问题/其他） |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data.id` | `string` | 反馈记录 ID |

---

## 接口 14：用户学习进度 ⬜ 待实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `userProgress` |
| **当前状态** | ⬜ 待实现 |
| **当前 Mock** | 无 |

### 请求参数（查询）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | `string` | 是 | 登录令牌 |
| `action` | `string` | 是 | `get` |

### 请求参数（保存）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | `string` | 是 | 登录令牌 |
| `action` | `string` | 是 | `save` |
| `visitedRegions` | `string[]` | 否 | 已浏览区域 ID 列表 |
| `favoriteAnimals` | `string[]` | 否 | 收藏动物 ID 列表 |
| `chatCount` | `number` | 否 | AI 对话次数 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data.progress` | `object` | 学习进度对象 |

---

## 接口 15：获取系统配置 ⬜ 待实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getConfig` |
| **当前状态** | ⬜ 待实现 |
| **当前 Mock** | 散落在 `constants/index.ts` 各常量 |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keys` | `string[]` | 否 | 配置项 key 列表（不传返回全部） |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `object` | 配置键值对 |

**可配置项**：

| key | 类型 | 说明 |
|-----|------|------|
| `enableAudio` | `boolean` | 是否启用音频 |
| `defaultAudioUrl` | `string` | 默认背景音乐 URL |
| `appVersion` | `string` | 当前版本号 |
| `contactEmail` | `string` | 联系邮箱 |

---

## 接口调用示例

```typescript
import { callFunction } from '@/utils/cloud'

// 调用地形列表接口
const res = await callFunction('getTerrainList', {})
if (res.code === 0) {
  const terrains = res.data
}

// 调用地形详情接口
const detailRes = await callFunction('getTerrainDetail', { name: '高山地形' })
if (detailRes.code === 0) {
  const terrain = detailRes.data
}
```

---

## 实施路线图

| 阶段 | 接口 | 说明 |
|------|------|------|
| **Phase 0** | `login` | 已实现，可直接使用 |
| **Phase 1** | `getKnowledgeCategories`, `getTerrainList`, `getTerrainDetail`, `getClimateList`, `getClimateDetail`, `getAnimalList`, `getAnimalDetail` | ✅ 已实现，知识库三表完整接口 |
| **Phase 2** | `chat` | 已实现，对接 AI 模型 |
| **Phase 3** | `updateUserInfo`, `submitFeedback`, `userProgress` | 待实现，用户相关功能 |
| **Phase 4** | `getConfig`, `getRegions`, `getRegionDetail` | 待实现，后台可配置能力 |

---

## 附录：数据库表设计

### 地形表 (`terrain`)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `_id` | String | 是 | 文档ID（自动生成） |
| `id` | Number | 是 | 业务ID |
| `name` | String | 是 | 地形名称 |
| `image` | String | 是 | 图片URL |
| `features` | String | 是 | 地形特征 |
| `climate` | String | 是 | 气候特点 |
| `vegetation` | String | 是 | 植被类型 |
| `region` | String | 是 | 代表地区 |
| `summary` | String | 是 | 总结描述 |
| `createdAt` | Date | 是 | 创建时间（自动） |
| `updatedAt` | Date | 是 | 更新时间（自动） |

### 气候表 (`climate`)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `_id` | String | 是 | 文档ID（自动生成） |
| `id` | Number | 是 | 业务ID |
| `name` | String | 是 | 气候名称 |
| `image` | String | 是 | 图片URL |
| `temperature` | String | 是 | 气温特点 |
| `precipitation` | String | 是 | 降水特点 |
| `characteristics` | String | 是 | 气候特点 |
| `region` | String | 是 | 代表地区 |
| `summary` | String | 是 | 总结描述 |
| `createdAt` | Date | 是 | 创建时间（自动） |
| `updatedAt` | Date | 是 | 更新时间（自动） |

### 动物表 (`animal`)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `_id` | String | 是 | 文档ID（自动生成） |
| `id` | Number | 是 | 业务ID |
| `name` | String | 是 | 动物名称 |
| `image` | String | 是 | 图片URL |
| `habitat` | String | 是 | 栖息地 |
| `food` | String | 是 | 食物喜好 |
| `habits` | String | 是 | 生活习性 |
| `secret` | String | 是 | 趣味小秘密 |
| `protectionLevel` | String | 是 | 保护级别 |
| `createdAt` | Date | 是 | 创建时间（自动） |
| `updatedAt` | Date | 是 | 更新时间（自动） |

---

## 附录：相关类型定义位置

所有 TypeScript 类型定义于 `src/types/index.ts`：

| 类型 | 用途 |
|------|------|
| `CloudFunctionResult<T>` | 接口通用返回包装 |
| `LoginData` | 登录返回数据 |
| `DouyinUserInfo` / `WechatUserInfo` | 用户信息 |
| `MenuItem` | 菜单项 |
| `RegionDetail` / `RegionAnimal` / `RegionGeoFeature` | 区域详情相关 |
| `KnowledgeCategory` / `KnowledgeAnimal` | 知识百科相关 |
| `TerrainItem` / `ClimateItem` / `AnimalDetailItem` | 学习详情页类型 |
| `ChatMessage` | AI 对话消息 |
| `ProjectedPoint` / `Polygon` / `Ring` / `BBox` / `ProjectedFeature` | 地图几何数据 |
