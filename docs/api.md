# "大熊猫博士" 接口文档

> **注**：当前架构使用**云函数**而非 REST API。所有接口通过 `callFunction(name, data)` 调用。
>
> 云平台：抖音云（`env-a22YxZSttQ`）+ 微信云开发（`cloud1-d0g4jnows8cd22b84`）
>
> 统一返回格式：`CloudFunctionResult<T>` = `{ code: number, msg: string, data: T | null }`

## 鉴权说明（使用任何功能前都需要登录）

- App 启动时会自动静默调用 `login`（`wx.login()` 不需要用户点击授权，全程无感），换取 JWT 格式的 `token`，本地持久化保存。
- 除 `login` 本身外，**其余所有云函数请求参数都必须携带 `token` 字段**（微信小程序端由 `src/utils/cloud.ts` 的 `callFunction()` 统一自动注入，调用方不需要手动传）。
- 各云函数用共享的 `JWT_SECRET`（云开发控制台环境变量）校验 `token` 的签名与有效期，校验失败统一返回 `code: 401`。
- 前端 `callFunction()` 收到 `401` 会自动清空本地登录态并重新静默登录（`handleCloudError`），页面上的 `AuthGate` 组件会据此自动展示"登录中"过渡态，整个过程用户无需手动操作。
- 本次鉴权改造仅覆盖**微信小程序端**；抖音小程序端的登录（`cloud.getWXContext()` 是微信云开发专属 API）留待后续单独修复。
- `seedData` 云函数是数据初始化用的管理员工具，不面向用户功能，未加入本次鉴权范围。

---

## 接口 1：用户登录 ⭐ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `login` |
| **当前状态** | ✅ 已实现（JWT 版本） |
| **实现文件** | `cloudfunctions/login/index.js` + `src/utils/auth.ts` |
| **请求方式** | `callFunction('login', { code })`，App 启动时自动静默调用，无需用户点击 |
| **环境变量** | `JWT_SECRET`（云开发控制台为 `login` 及全部受保护云函数配置同一个值） |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | `string` | 否 | 平台登录凭证（`wx.login` 获取；微信云开发实际通过 `cloud.getWXContext()` 直接拿 openid，`code` 仅作兼容保留） |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 -1=失败 401=未授权 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data.token` | `string` | 登录令牌，**JWT**（`{ openid, unionid, exp }`，HMAC-SHA256 签名） |
| `data.openid` | `string` | 用户平台标识 |
| `data.unionid` | `string` | 平台统一标识（微信专属） |
| `data.expiresAt` | `number` | 过期时间戳（7 天后） |

### 待完善

- 返回数据中应包含用户昵称和头像
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

## 接口 4：获取区域详情 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getRegionDetail` |
| **当前状态** | ✅ 已实现（服务端字段名为 `name`，与下方保持一致；失败时前端回退到本地 Mock `REGION_DETAILS`） |
| **实现文件** | `cloudfunctions/getRegionDetail/index.js` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | `string` | 是 | 登录令牌 |
| `name` | `string` | 是 | 区域名称（如"西南地区"） |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data.name` | `string` | 区域名称 |
| `data.pinyin` | `string` | 拼音 |
| `data.description` | `string` | 详细描述 |
| `data.geoFeatures` | `GeoFeature[]` | 地理特征列表（3 项） |
| `data.provinces` | `string[]` | 包含省份列表 |

**`GeoFeature` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `name` | `string` | 特征名称（如"林海雪原"） |
| `pinyin` | `string` | 拼音 |
| `icon` | `string` | 图标 URL |
| `bgColor` | `string` | 卡片背景色 |

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
| `token` | `string` | 是 | 登录令牌 |

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
| `token` | `string` | 是 | 登录令牌 |

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
| `token` | `string` | 是 | 登录令牌 |
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
| `token` | `string` | 是 | 登录令牌 |

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
| `token` | `string` | 是 | 登录令牌 |
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
| `token` | `string` | 是 | 登录令牌 |

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
| `token` | `string` | 是 | 登录令牌 |
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
| `token` | `string` | 是 | 登录令牌 |
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

## 接口 12.5：语音合成（TTS）✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `tts` |
| **当前状态** | ✅ 已实现（对接腾讯云 TextToVoice） |
| **实现文件** | `cloudfunctions/tts/index.js` + `src/utils/tts.ts` |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | `string` | 是 | 登录令牌 |
| `text` | `string` | 是 | 待朗读文本（超长会自动分段） |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|------|
| `code` | `number` | 0=成功 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data.audioList` | `string[]` | base64 编码的 mp3 音频分段数组，前端按序播放 |
| `data.codec` | `string` | 编码格式，固定 `mp3` |

> **部署依赖**：需在微信云开发控制台为 tts 云函数配置环境变量 `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY`（腾讯云 API 密钥）。

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
| **Phase 0** | `login` | ✅ 已实现（JWT 版本），App 启动自动静默调用，使用任何功能前都需要先完成登录 |
| **Phase 1** | `getKnowledgeCategories`, `getTerrainList`, `getTerrainDetail`, `getClimateList`, `getClimateDetail`, `getAnimalList`, `getAnimalDetail`, `getRegionDetail` | ✅ 已实现，知识库/区域详情接口，均已加 token 校验 |
| **Phase 2** | `chat`, `tts` | 已实现，对接 AI 模型 / 语音合成，均已加 token 校验 |
| **Phase 3** | `updateUserInfo`, `submitFeedback`, `userProgress` | 待实现，用户相关功能 |
| **Phase 4** | `getConfig`, `getRegions` | 待实现，后台可配置能力 |

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
| `RegionDetail` / `RegionGeoFeature` | 区域详情相关 |
| `KnowledgeCategory` / `KnowledgeAnimal` | 知识百科相关 |
| `TerrainItem` / `ClimateItem` / `AnimalDetailItem` | 学习详情页类型 |
| `ChatMessage` | AI 对话消息 |
| `ProjectedPoint` / `Polygon` / `Ring` / `BBox` / `ProjectedFeature` | 地图几何数据 |
