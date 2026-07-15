# "大熊猫博士" 接口文档

> **注**：当前架构使用**云函数**而非 REST API。所有接口通过 `callFunction(name, data)` 调用。
>
> 云平台：抖音云（`env-a22YxZSttQ`）+ 微信云开发（`cloud1-d0g4jnows8cd22b84`）
>
> 统一返回格式：`CloudFunctionResult<T>` = `{ errCode: number, errMsg: string, data: T | null }`

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
|------|------|------|
| `errCode` | `number` | 0=成功 -1=失败 401=未授权 |
| `errMsg` | `string` | 提示信息 |
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
|------|------|------|
| `errCode` | `number` | 0=成功 |
| `errMsg` | `string` | 提示信息 |
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
|------|------|------|
| `errCode` | `number` | 0=成功 |
| `errMsg` | `string` | 提示信息 |
| `data` | `Region[]` | 区域列表 |

**`Region` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
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
|------|------|------|
| `errCode` | `number` | 0=成功 |
| `errMsg` | `string` | 提示信息 |
| `data.name` | `string` | 区域名称 |
| `data.pinyin` | `string` | 拼音 |
| `data.description` | `string` | 详细描述 |
| `data.geoFeatures` | `GeoFeature[]` | 地理特征列表（3 项） |
| `data.animals` | `RegionAnimal[]` | 代表动物列表（4 项） |

**`GeoFeature` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 特征名称（如"林海雪原"） |
| `pinyin` | `string` | 拼音 |
| `icon` | `string` | 图标 URL |
| `bgColor` | `string` | 卡片背景色 |

**`RegionAnimal` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 动物名称 |
| `pinyin` | `string` | 拼音 |
| `image` | `string` | 图片 URL |
| `location` | `string` | 分布位置描述 |
| `locationColor` | `string` | 位置标签颜色 |
| `animalId` | `string` | 动物 ID（关联动物详情接口） |

---

## 接口 5：获取知识百科分类 ⬜ 待实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getKnowledgeCategories` |
| **当前状态** | ⬜ 待实现 |
| **当前 Mock** | `src/constants/index.ts` - `KNOWLEDGE_CATEGORIES` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 无 | - | - | 公开数据 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `errCode` | `number` | 0=成功 |
| `errMsg` | `string` | 提示信息 |
| `data` | `Category[]` | 分类列表 |

**`Category` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 分类 ID |
| `name` | `string` | 分类名称 |
| `pinyin` | `string` | 拼音 |
| `icon` | `string` | 图标 URL |
| `color` | `string` | 文字颜色 |
| `bgColor` | `string` | 背景颜色 |

---

## 接口 6：获取动物百科列表 ⬜ 待实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getAnimalsByCategory` |
| **当前状态** | ⬜ 待实现 |
| **当前 Mock** | `src/constants/index.ts` - `KNOWLEDGE_ANIMALS`（5 条，无分类关联） |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `categoryId` | `string` | 否 | 分类 ID（不传返回全部） |
| `page` | `number` | 否 | 页码，默认 1 |
| `pageSize` | `number` | 否 | 每页数量，默认 20 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `errCode` | `number` | 0=成功 |
| `errMsg` | `string` | 提示信息 |
| `data.list` | `KnowledgeAnimal[]` | 动物列表 |
| `data.total` | `number` | 总数 |

**`KnowledgeAnimal` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 动物 ID |
| `name` | `string` | 动物名称 |
| `pinyin` | `string` | 拼音 |
| `image` | `string` | 图片 URL |
| `categoryId` | `string` | 所属分类 ID |
| `protectionLevel` | `string` | 保护级别 |
| `protectionBgColor` | `string` | 标签背景色 |
| `protectionTextColor` | `string` | 标签文字色 |
| `borderColor` | `string` | 卡片边框色 |

---

## 接口 7：获取动物详情 ⬜ 待实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getAnimalDetail` |
| **当前状态** | ⬜ 待实现 |
| **当前 Mock** | 无 |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `animalId` | `string` | 是 | 动物 ID |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `errCode` | `number` | 0=成功 |
| `errMsg` | `string` | 提示信息 |
| `data.id` | `string` | 动物 ID |
| `data.name` | `string` | 动物名称 |
| `data.pinyin` | `string` | 拼音 |
| `data.scientificName` | `string` | 学名 |
| `data.description` | `string` | 详细介绍 |
| `data.images` | `string[]` | 图片列表 |
| `data.habitat` | `string` | 栖息地描述 |
| `data.diet` | `string` | 食性 |
| `data.protectionLevel` | `string` | 保护级别 |
| `data.distribution` | `string[]` | 分布区域列表 |
| `data.funFact` | `string` | 趣味小知识 |

---

## 接口 8：AI 对话 ✅ 已实现

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
|------|------|------|
| `errCode` | `number` | 0=成功 |
| `errMsg` | `string` | 提示信息 |
| `data.reply` | `string` | AI 回复内容 |
| `data.sessionId` | `string` | 会话标识（用于续传） |

> **部署依赖**：需在微信云开发控制台为 chat 云函数配置环境变量 `DEEPSEEK_API_KEY`（DeepSeek API 密钥），并在 `cloudfunctions/chat/` 目录下执行 `npm install` 安装依赖。

---

## 接口 9：提交意见反馈 ⬜ 待实现

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
|------|------|------|
| `errCode` | `number` | 0=成功 |
| `errMsg` | `string` | 提示信息 |
| `data.id` | `string` | 反馈记录 ID |

---

## 接口 10：用户学习进度 ⬜ 待实现

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
|------|------|------|
| `errCode` | `number` | 0=成功 |
| `errMsg` | `string` | 提示信息 |
| `data.progress` | `object` | 学习进度对象 |

---

## 接口 11：获取系统配置 ⬜ 待实现

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
|------|------|------|
| `errCode` | `number` | 0=成功 |
| `errMsg` | `string` | 提示信息 |
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

// 调用区域列表接口
const res = await callFunction('getRegions', {})
if (res.errCode === 0) {
  const regions = res.data
}
```

---

## 实施路线图

| 阶段 | 接口 | 说明 |
|------|------|------|
| **Phase 0** | `login` | 已实现，可直接使用 |
| **Phase 1** | `getRegions`, `getRegionDetail`, `getAnimalsByCategory` | 替代核心静态数据 |
| **Phase 2** | `chat` | 对接 AI 模型，实现真实问答 |
| **Phase 3** | `updateUserInfo`, `submitFeedback`, `userProgress` | 用户相关功能 |
| **Phase 4** | `getConfig`, `getAnimalDetail` | 后台可配置能力 |

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
| `ChatMessage` | AI 对话消息 |
| `ProjectedPoint` / `Polygon` / `Ring` / `BBox` / `ProjectedFeature` | 地图几何数据 |
