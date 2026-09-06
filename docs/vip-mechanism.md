# VIP 会员机制技术文档

## 1. 概述

本项目的「VIP / 会员」是一个**纯权限控制**概念，**没有支付网关、没有订单系统、没有审核后台**。它的唯一作用是控制用户能否使用「AI 对话」功能（与大熊猫博士聊天）。

核心判定逻辑只有一行：

```js
const isVip = !!(user && user.vipExpireAt && user.vipExpireAt > Date.now())
```

即：`user` 集合里该用户记录的 `vipExpireAt` 字段（毫秒时间戳）**存在且晚于当前时间** ⇒ 会员有效。否则一律视为非会员。

开通/续费的唯一手段是运营人员在**云开发控制台**手动修改该字段（参考 [membership-flow.html](./membership-flow.html)）。

---

## 2. 数据模型

`user` 集合（微信云开发数据库），每条记录对应一个 openid：

| 字段 | 类型 | 写入方 | 说明 |
|------|------|--------|------|
| `openid` | string | 系统（login 云函数） | 微信身份标识，唯一 |
| `unionid` | string \| null | 系统 | 同主体跨应用标识，可为空 |
| `userCode` | string | 系统（login 云函数生成） | 6 位数字识别码，用户在「我的」页复制后线下报给运营核对身份 |
| `vipExpireAt` | number \| null | **仅运营手动改** | 会员到期时间戳（毫秒）。`null` 或早于当前时间 = 非会员。**唯一的权限判断依据** |
| `vipType` | `'week'` \| `'month'` \| null | 仅运营手动改 | 套餐类型，仅备注展示用，**不参与权限判断** |
| `createdAt` | Date | 系统 | 首次登录时间 |
| `updatedAt` | Date | 系统 | 最近一次登录刷新时间 |

> 安全要求：`user` 集合的数据库权限必须设为「所有人不可读不可写」，前端全程通过云函数间接访问，不能直接读写。

---

## 3. 服务端实现

### 3.1 `login` 云函数 — 登录并下发会员快照

文件：[cloudfunctions/login/index.js](../cloudfunctions/login/index.js)

职责：
1. 用 `code` 换取 `OPENID`（云上下文，不依赖前端传）。
2. `upsertUser(openid, unionid)`：记录不存在则新建（生成 `userCode`，`vipExpireAt`/`vipType` 初始为 `null`）；存在则只刷新 `updatedAt`/补齐 `unionid`，**绝不触碰会员字段**。
3. 计算 `isVip = isVipActive(user)` 并随登录响应返回。

返回的 `data` 结构（见 [src/types/index.ts](../src/types/index.ts) 的 `LoginData`）：

```ts
interface LoginData {
  token: string          // JWT，7 天有效
  openid: string
  expiresAt: number      // token 过期时间（毫秒）
  userCode?: string | null
  isVip?: boolean
  vipExpireAt?: number | null
  vipType?: 'week' | 'month' | null
}
```

异常兜底：会员读写失败**不阻断登录**，按非会员返回，用户仍可使用免费功能。

### 3.2 `getMembership` 云函数 — 纯查询会员状态

文件：[cloudfunctions/getMembership/index.js](../cloudfunctions/getMembership/index.js)

职责：供前端 tabBar 页面 `onShow` 时**静默刷新**会员状态调用，不做任何写操作。

- 校验 `token`（JWT）+ 云上下文 `OPENID` 双重身份确认。
- 查询 `user` 集合，返回 `{ userCode, isVip, vipExpireAt, vipType }`。
- 查询失败按「非会员」兜底（fail-open for availability，但前端 UI 隐藏，不影响安全，真正防线在 `chat` 云函数）。

注意：此函数**不带 `userCode` 也没问题**——前端 `_setVipInfo` 对 `userCode` 做了保留处理，未显式传入时不覆盖已有值。

### 3.3 `chat` 云函数 — 服务端权限兜底（真正的防线）

文件：[cloudfunctions/chat/index.js](../cloudfunctions/chat/index.js)

在处理任何 AI 请求前，强制查库校验：

```js
const userRes = await db.collection('user').where({ openid: OPENID }).get()
const user = userRes.data && userRes.data[0]
if (!isVipActive(user)) {
  return { code: 40001, msg: '暂不可用', data: null }  // NEED_MEMBERSHIP
}
```

- 这是**唯一不可绕过**的防线——前端入口隐藏可以被跳过直接调用云函数，但这里查库躲不掉。
- 查询异常同样按非会员处理（fail-closed for security）。
- 错误码 `40001` 对应常量 `ERROR_CODE.NEED_MEMBERSHIP`（见 [src/constants/index.ts](../src/constants/index.ts)）。

---

## 4. 前端实现

### 4.1 状态管理：`AuthManager`（[src/utils/auth.ts](../src/utils/auth.ts)）

VIP 状态的核心持有者，单例 `authManager`。

**状态字段：**
```ts
interface VipInfo {
  userCode: string | null
  isVip: boolean
  vipExpireAt: number | null
  vipType: 'week' | 'month' | null
}
```

**持久化：** `uni.setStorageSync('vipInfo', JSON.stringify(vipInfo))`（`VIP_INFO_KEY` 常量）。构造函数时从 storage 恢复。

**关键方法：**

| 方法 | 作用 |
|------|------|
| `getVipInfo(fresh)` | 读取当前 VIP 信息；`fresh=true` 时强制从 storage 重读 |
| `_setVipInfo(loginData)` | 用登录/刷新返回的数据更新并落盘 |
| `refreshMembership(force)` | 静默调 `getMembership` 刷新状态 |
| `logout()` | 清空 VIP 信息并移除 storage |

**`refreshMembership` 的节流与去重：**

```ts
const MIN_INTERVAL = 30_000  // 30 秒
if (!force && Date.now() - this._lastMembershipFetchAt < MIN_INTERVAL) {
  return this._vipInfo  // 节流窗口内直接返回缓存
}
// 并发调用复用同一个 _membershipInflight Promise
```

- 默认 30 秒内不重复真实请求，避免频繁切 tab 时每次都走网络。
- `force=true` 跳过节流（用于服务端返回 `40001` 后强制刷新）。
- 并发调用去重：同一时刻只有一个 inflight Promise。
- **只在请求成功发出后才更新时间戳**——失败时不"假节流"，允许下次重试。
- 未登录时直接返回当前缓存，不触发请求。

### 4.2 Pinia Store：`useUserStore`（[src/stores/user.ts](../src/stores/user.ts)）

把 `AuthManager` 的状态包装成响应式：

```ts
const isVip = ref(vipInfo.value.isVip)
const vipExpireAt = ref(vipInfo.value.vipExpireAt)
const vipType = ref(vipInfo.value.vipType)
const userCode = ref(vipInfo.value.userCode)
```

**`refreshMembership(force)`**：调用 `authManager.refreshMembership(force)` 后执行 `refreshState()` 把最新值同步到响应式 ref。

### 4.3 UI 入口拦截

VIP 只控制「AI 对话」这一个功能，拦截分三层，由外到内：

#### 第一层：底部 tabBar 的「AI」图标

[src/components/CustomTabBar/index.vue](../src/components/CustomTabBar/index.vue)

```ts
const tabList = computed(() =>
  ALL_TABS.filter(tab => AI_CHAT_ENABLED && (tab.icon !== 'ai' || isVip.value))
)
```

非会员直接看不到「AI」tab。用 `computed` 保证 `isVip` 变化时 tab 列表响应式重算（tabBar 页面常驻内存不会重新执行 setup）。

#### 第二层：详情页「问博士」按钮

[src/pages/animalDetail/index.vue](../src/pages/animalDetail/index.vue)、
[src/pages/terrainDetail/index.vue](../src/pages/terrainDetail/index.vue)、
[src/pages/climateDetail/index.vue](../src/pages/climateDetail/index.vue)

```html
<view v-if="AI_CHAT_ENABLED && isVip" :class="styles.actionBar">
  <!-- 问博士 按钮 -->
</view>
```

#### 第三层：AI 页面自身 + 服务端

[src/pages/ai/index.vue](../src/pages/ai/index.vue) 的 `onShow`：

```ts
// 先用本地缓存同步判断（瞬时，不等网络）
if (isLoggedIn.value && !isVip.value) {
  uni.switchTab({ url: '/pages/index/index' })
  return
}
// 后台异步刷新后兜底判断一次（覆盖本地缓存过期场景）
if (isLoggedIn.value) {
  userStore.refreshMembership().then(() => {
    if (isLoggedIn.value && !isVip.value) {
      uni.switchTab({ url: '/pages/index/index' })
    }
  })
}
```

而 `chat` 云函数里的 `code === 40001` 分支是最后兜底：即使页面被缓存住没跳走，发消息时服务端也会拦截，前端撤回占位消息并 `force=true` 刷新后跳回首页。

### 4.4 「我的」页静默刷新

[src/pages/mine/index.vue](../src/pages/mine/index.vue) 的 `onShow`：

```ts
onShow(() => {
  store.refreshMembership()
})
```

用户切到「我的」页时触发一次静默刷新（受 30s 节流约束），不弹任何提示。

---

## 5. 完整数据流

```
用户打开小程序
   │
   ▼
AuthGate → store.silentLogin() → login 云函数
   │                              │
   │                              ├─ upsertUser（首次登录生成 userCode）
   │                              └─ 返回 { token, isVip, vipExpireAt, vipType, userCode }
   │
   ▼
authManager._setVipInfo(loginData) → 落盘 vipInfo → store.refreshState()
   │
   ▼
UI 根据 isVip 渲染：
   ├─ CustomTabBar：非会员不显示 AI tab
   ├─ 详情页：非会员不显示「问博士」
   └─ AI 页：非会员 onShow 时跳回首页
   │
   ▼ （运营在控制台手动改完 vipExpireAt 后）
   │
用户切换 tab → 页面 onShow → store.refreshMembership()
   │
   ▼
getMembership 云函数 → 返回最新 isVip → 更新响应式状态 → UI 自动响应
```

---

## 6. 关键常量

[src/constants/index.ts](../src/constants/index.ts)

| 常量 | 值 | 用途 |
|------|-----|------|
| `VIP_INFO_KEY` | `'vipInfo'` | storage 存储 key |
| `LOGIN_CLOUD_FUNCTION` | `'login'` | 登录云函数名 |
| `GET_MEMBERSHIP_CLOUD_FUNCTION` | `'getMembership'` | 会员查询云函数名 |
| `ERROR_CODE.NEED_MEMBERSHIP` | `40001` | chat 云函数返回的会员不足错误码 |
| `AI_CHAT_ENABLED` | `true` | AI 功能总开关（与 VIP 叠加判断） |

---

## 7. 安全设计要点

1. **服务端是唯一可信防线**：前端所有入口隐藏都是体验优化，`chat` 云函数查库校验才是真正拦人的地方，绕不过。
2. **fail-closed**：`chat` 云函数查库异常时按非会员处理，宁可误拦不可误放。
3. **fail-open for availability**：`login` / `getMembership` 查会员失败时按非会员返回，但不阻断登录——用户还能用免费功能，只是 AI 暂时用不了。
4. **数据库权限锁死**：`user` 集合设为「所有人不可读不可写」，前端不直接接触。
5. **身份校验**：所有云函数同时校验 JWT token 和云上下文 `OPENID`，双重确认。
6. **`vipType` 不参与判断**：即使运营误填了 `vipType` 但没改 `vipExpireAt`，用户依然是非会员，防止配置错误导致越权。

---

## 8. 续费公式（运营手册）

详见 [membership-flow.html](./membership-flow.html)，这里只列公式：

```
新 vipExpireAt = max(当前时间, 原 vipExpireAt) + 套餐时长
周卡 = 7 天  = 604_800_000 毫秒
月卡 = 30 天 = 2_592_000_000 毫秒
```

用 `max()` 让提前续费的用户不吃亏：新周期接在原有到期时间之后，不浪费剩余天数。
