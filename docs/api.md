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
| `data.userCode` | `string \| null` | 6 位数字识别码，首次登录时生成并落库，用于人工核对身份（见下方"会员开通（人工）操作说明"） |
| `data.isVip` | `boolean` | 当前是否是有效会员（`vipExpireAt` 大于当前时间） |
| `data.vipExpireAt` | `number \| null` | 会员到期时间戳（毫秒），未开通为 `null` |
| `data.vipType` | `'week' \| 'month' \| null` | 最近一次开通的套餐类型，仅展示用，不参与权限判断 |

> `login` 内部会按 `openid` upsert `user` 集合（不存在则创建并生成 `userCode`），这部分逻辑失败不会阻断登录本身——查询/写入异常时会员字段按未开通兜底，用户仍可正常登录使用免费功能。

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
| **当前状态** | ✅ 已实现（对接阿里云百炼 `qwen-flash-character`，OpenAI 兼容格式；原 DeepSeek 调用代码保留在注释里未删除） |
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

> **部署依赖**：需在微信云开发控制台为 chat 云函数配置环境变量 `DASHSCOPE_API_KEY`（阿里云百炼 API Key，用于调用 `qwen-flash-character`），并在 `cloudfunctions/chat/` 目录下执行 `npm install` 安装依赖。

### 权限说明

本接口仅限会员使用。在 `token` 校验和参数校验通过后、真正调用 DeepSeek 之前，会按 `OPENID` 查询 `user` 集合校验 `vipExpireAt` 是否有效；查询异常同样按未开通处理（fail-closed）。非会员/未开通返回：

| `code` | 含义 |
|------|------|
| `40001` | 未开通会员（`NEED_MEMBERSHIP`），`data` 为 `null` |

前端不会对这个错误码弹出任何提示——对话入口本身在非会员时就不会出现（见"会员开通（人工）操作说明"），这里只是服务端兜底，防止绕过前端直接调用云函数。

### 历史记录持久化

每轮问答成功后，会把这条用户消息和 AI 回复各存一条到 `chatMessage` 集合（见附录"聊天记录表"），供 [接口 12.7](#接口-127获取聊天历史-已实现) 读取。存档是 **fail-open** 的——写入失败只记日志，不影响本轮对话正常返回 `reply`。这不是实时多端同步，只是给"换设备/重装小程序"场景兜底，详见接口 12.7 说明。

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

## 接口 12.6：查询会员状态 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getMembership` |
| **当前状态** | ✅ 已实现（纯查询，不做任何写操作） |
| **实现文件** | `cloudfunctions/getMembership/index.js` + `src/utils/auth.ts` |

用于前端在 tabBar 页面（`index`/`ai`/`learn`/`mine`）`onShow` 时静默刷新会员状态，不依赖登录 token 是否过期——管理员手动改完数据库后，用户切换一次 tab 就能立刻感知，不需要重新登录。全程无 UI，不弹任何提示。

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | `string` | 是 | 登录令牌 |

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | `number` | 0=成功 401=未授权 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data.isVip` | `boolean` | 当前是否是有效会员 |
| `data.vipExpireAt` | `number \| null` | 会员到期时间戳（毫秒） |
| `data.vipType` | `'week' \| 'month' \| null` | 最近一次开通的套餐类型 |

---

## 接口 12.7：获取聊天历史 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **云函数名称** | `getChatHistory` |
| **当前状态** | ✅ 已实现（纯查询，不做任何写操作） |
| **实现文件** | `cloudfunctions/getChatHistory/index.js` + `src/pages/ai/index.vue` |

用于前端在**本地聊天记录为空**时（换设备、清缓存、重装小程序）把 `chat` 云函数归档过的历史记录找回来。**不是多端实时同步**——只有本地存储检测为空时才会调用一次，同一账号在另一台设备上产生的新消息不会主动推送过来。

服务端内部会循环分批查询突破微信云开发单次 `.get()` 100 条上限，但对前端始终是**一次调用拿到全部**（最多返回最近 200 条），不需要前端处理分页。

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | `string` | 是 | 登录令牌 |

只校验登录态，不额外校验会员——这里只读该用户自己已产生的存档，不消耗新的 AI 调用；`ai/index.vue` 的 `onShow` 已经把非会员挡在页面之外了。

### 返回数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | `number` | 0=成功 401=未授权 |
| `msg` | `string` | 提示信息(成功时为空) |
| `data` | `RemoteChatMessage[]` | 按时间正序排列的历史消息，为空数组代表该用户从未产生过对话 |
| `data[].id` | `number` | 用 `createdAt` 时间戳合成，供前端当 Vue key 用 |
| `data[].role` | `'user' \| 'assistant'` | 消息角色 |
| `data[].content` | `string` | 消息内容 |
| `data[].time` | `number` | 消息产生时间的毫秒时间戳；格式化成 `HH:mm` 交给前端 `getTimeString()` 统一处理，服务端不重复实现格式化逻辑 |

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
| **Phase 2** | `chat`, `tts`, `getChatHistory` | 已实现，对接 AI 模型 / 语音合成 / 聊天历史归档与查询，均已加 token 校验 |
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

### 用户表 (`user`)

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `_id` | String | 是 | 文档ID（自动生成） |
| `openid` | String | 是 | 微信 openid，唯一索引 |
| `unionid` | String \| null | 否 | 微信 unionid |
| `userCode` | String | 是 | 6 位数字识别码，首次登录时生成 |
| `vipExpireAt` | Number \| null | 否 | 会员到期时间戳（毫秒），`null` 或早于当前时间均视为未开通/已过期——**唯一的权限判断依据** |
| `vipType` | String \| null | 否 | `'week'` \| `'month'`，最近一次开通的套餐类型，仅备注用 |
| `createdAt` | Date | 是 | 首次登录时间（自动） |
| `updatedAt` | Date | 是 | 最近一次登录时间（自动） |

> **数据库安全规则**：云开发控制台里需把本集合设为「所有人不可读不可写」——前端全程不直接读写这个集合，都是通过 `login`/`getMembership`/`chat` 云函数（管理员态）访问，锁死可以避免用户绕过前端直接改自己的 `vipExpireAt`。

### 聊天记录表 (`chatMessage`)

消息粒度存储（一条用户消息/一条助手回复各一个文档），不区分会话（单一连续历史模型，不做多会话分组）。

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `_id` | String | 是 | 文档ID（自动生成） |
| `openid` | String | 是 | 归属用户，查询过滤字段，建议建普通索引 |
| `role` | String | 是 | `'user'` \| `'assistant'` |
| `content` | String | 是 | 用户消息为原始输入；助手消息为 `stripMarkdown` 清洗后的内容 |
| `createdAt` | Date | 是 | `db.serverDate()`，唯一排序依据，同时用于合成 `getChatHistory` 返回给前端的 `id` |

写入：`chat` 云函数每轮问答成功后 fail-open 写入（存档失败只记日志，不影响对话返回）。读取：`getChatHistory` 云函数，见接口 12.7。

> **数据库安全规则**：云开发控制台里需把本集合设为「所有人不可读不可写」——跟 `user` 表同样的先例，前端不直接读写，全部访问走 `chat`（写）/`getChatHistory`（读）两个云函数的管理员态。

---

## 会员开通（人工）操作说明

对话功能（`chat`）目前是纯人工开通的付费会员制，项目里没有接入真实微信支付、也没有任何购买/兑换页面——线下收款后，管理员在云开发控制台手动改 `user` 集合的字段即可生效。

**套餐**：周卡（7 天）、月卡（30 天）。用固定天数而不是自然周/自然月，避免大小月带来的歧义。

**操作步骤**：

1. 用户把"我的"页面上展示的 6 位识别码（`userCode`）发给你。
2. 在云开发控制台的 `user` 集合里，用 `where({ userCode: 'xxxxxx' })` 或直接筛选找到对应记录。
3. 按下面的公式计算新的 `vipExpireAt` 并写入该字段（同时更新 `vipType` 为 `'week'` 或 `'month'`）：

   ```
   新 vipExpireAt = max(当前时间, 记录里原有的 vipExpireAt) + 套餐时长
   周卡时长 = 7 × 24 × 3600 × 1000 毫秒
   月卡时长 = 30 × 24 × 3600 × 1000 毫秒
   ```

   用 `max(当前时间, 原到期时间)` 而不是直接从今天起算，是为了让提前续费的用户不吃亏——到期前续费会在原有基础上顺延，而不是浪费剩余天数。

4. 保存后，用户下次切换 tabBar（`onShow` 会静默调用 `getMembership` 刷新状态）就能看到 AI 入口出现，不需要重新登录或重启小程序。

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
| `RemoteChatMessage` | `getChatHistory` 返回的云端历史记录原始条目 |
| `ProjectedPoint` / `Polygon` / `Ring` / `BBox` / `ProjectedFeature` | 地图几何数据 |
