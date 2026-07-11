# 大熊猫博士

一款面向儿童的中国地理科普小程序，通过交互式 3D 地图、AI 问答和动物百科等形式，让孩子们在玩乐中学习中国地理知识。

## 技术栈

- **框架**: uni-app (Vue 3 + TypeScript)
- **构建工具**: Vite
- **样式**: Less
- **目标平台**: 抖音小程序（主）、H5、微信小程序等多端支持
- **云服务**: 抖音云函数

## 项目结构

```
.
├── cloudfunctions/          # 云函数源码目录
│   └── login/               # 登录云函数示例
│       ├── index.js
│       └── package.json
├── src/
│   ├── components/          # 公共组件
│   │   ├── CustomTabBar/    # 自定义底部导航栏
│   │   ├── MessageItem/     # 消息气泡组件
│   │   └── PinyinText/      # 带拼音的文字组件
│   ├── constants/           # 常量配置
│   ├── data/                # 静态数据
│   ├── pages/               # 页面
│   │   ├── index/           # 首页
│   │   ├── map/             # 中国地图
│   │   ├── regionDetail/    # 地区详情
│   │   ├── ai/              # AI 小助手
│   │   ├── learn/           # 学习
│   │   └── mine/            # 我的
│   ├── static/              # 静态资源
│   ├── styles/              # 全局样式
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   │   ├── auth.ts          # 登录鉴权
│   │   ├── cloud.ts         # 云函数调用封装
│   │   └── pinyin.ts        # 拼音工具
│   ├── App.vue              # 应用入口
│   ├── main.ts              # 主入口
│   ├── manifest.json        # 应用配置
│   └── pages.json           # 页面路由配置
├── scripts/                 # 脚本工具
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目依赖
```

## 功能模块

### 1. 首页
- 3D 风格的中国地理主题首页
- 熊猫博士 IP 形象
- 快速入口：开始探索、AI 问答等
- 背景音控制

### 2. 中国地图
- 交互式 3D 中国地图
- 七大地理分区展示（东北、华北、西北、西南、华中、华东、华南）
- 点击区域显示详情卡片
- 地图缩放、平移交互
- 各地区背景图片展示

### 3. 地区详情
- 地区地理特征介绍
- 代表动物展示
- 拼音标注

### 4. AI 小助手
- 智能问答对话
- 地理知识科普
- 熊猫博士角色设定

### 5. 学习
- 动物百科
- 地理知识
- 有趣故事
- 趣味问答

### 6. 我的
- 用户信息展示
- 设置、关于、反馈、分享等菜单
- 登录/退出功能

## 快速开始

### 环境要求

- Node.js >= 16
- 抖音开发者工具（调试小程序用）

### 安装依赖

```bash
npm install
```

### 开发模式

#### H5 开发
```bash
npm run dev:h5
```

#### 抖音小程序开发
```bash
npm run dev:mp-toutiao
```
然后用抖音开发者工具打开 `dist/dev/mp-toutiao` 目录。

#### 微信小程序开发
```bash
npm run dev:mp-weixin
```

### 生产构建

#### H5 构建
```bash
npm run build:h5
```

#### 抖音小程序构建
```bash
npm run build:mp-toutiao
```
构建产物在 `dist/build/mp-toutiao` 目录。

### 更多命令

查看 `package.json` 中 `scripts` 字段获取完整的构建命令列表，支持支付宝、百度、京东、快手、QQ 等多端小程序。

## 云函数

### 云函数目录说明

云函数源码位于项目根目录的 [cloudfunctions/](cloudfunctions/) 下，由 Vite 插件在构建时自动拷贝到小程序产物目录。

```
cloudfunctions/
├── login/               # 登录云函数
│   ├── index.js         # 云函数入口
│   └── package.json     # 依赖配置
└── .gitkeep
```

### 工作原理

[Vite 配置](vite.config.ts) 中的 `copyCloudfunctionsPlugin` 插件：
- **构建时**：自动将 `cloudfunctions/` 拷贝到 `dist/{dev|build}/mp-toutiao/cloudfunctions/`
- **开发时**：监听 `cloudfunctions/` 目录变化，自动同步到产物目录

### 开启云函数步骤

#### 1. 开通抖音云服务

1. 打开 [抖音开放平台](https://developer.open-douyin.com/)
2. 进入你的小程序 → 左侧菜单找到「抖音云」
3. 点击开通，创建云环境
4. 复制环境 ID

#### 2. 初始化云环境（可选）

如果有多个云环境，在 `src/App.vue` 的 `onLaunch` 中添加初始化代码：

```javascript
// #ifdef MP-TOUTIAO
tt.cloud.init({
  env: '你的环境ID'
})
// #endif
```

#### 3. 上传并部署云函数

在抖音开发者工具中：
1. 右键点击 `cloudfunctions/xxx` 云函数目录
2. 选择「上传并部署」
3. 等待部署完成

### 调用云函数

项目已封装好云函数调用工具，位于 [src/utils/cloud.ts](src/utils/cloud.ts)。

```typescript
import { callFunction, handleCloudError } from '@/utils/cloud'

// 调用云函数
const result = await callFunction('login', {
  code: '登录凭证',
  userInfo: {}
})

// 处理错误（如登录过期）
if (handleCloudError(result)) {
  return
}

// 使用返回数据
console.log(result.data)
```

### 返回值约定

云函数统一返回格式：

```typescript
interface CloudFunctionResult<T = any> {
  errCode: number   // 0 表示成功，非 0 表示失败
  errMsg: string    // 错误信息
  data: T           // 返回数据
}
```

### 新增云函数

1. 在 `cloudfunctions/` 目录下创建新的云函数文件夹
2. 编写 `index.js` 入口文件和 `package.json`
3. 保存后会自动同步到小程序产物目录
4. 在抖音开发者工具中上传部署

## 核心工具

### 云函数封装
- [src/utils/cloud.ts](src/utils/cloud.ts) — 抖音云函数调用封装，统一错误处理

### 登录鉴权
- [src/utils/auth.ts](src/utils/auth.ts) — 静默登录、用户信息管理

### 拼音工具
- [src/utils/pinyin.ts](src/utils/pinyin.ts) — 汉字转拼音，使用 `pinyin-pro` 库

### 地图数据
- [src/data/regions.json](src/data/regions.json) — 各地区 GeoJSON 数据
- [src/data/regionDetail.ts](src/data/regionDetail.ts) — 地区详情数据

## 常量配置

详见 [src/constants/index.ts](src/constants/index.ts)，包含：
- 地图相关常量（区域颜色、背景图 URL、缩放限制等）
- 登录相关常量
- 首页、AI 助手、学习等模块数据
- 用户默认信息和菜单配置

## 工程约束

- 地图区域背景图片必须从 `REGION_IMAGE_URLS` 中配置的 URL 加载
- 选中有背景图的区域不使用黄色高亮，改用 2px 边框
- infoCard 图片必须与对应区域的背景图一致
- 所有左上角返回按钮必须使用指定的 SVG 图标
- 多环区域的 Canvas 路径构建必须使用单次 `beginPath()` 调用以保留所有子路径

## 类型定义

详见 [src/types/index.ts](src/types/index.ts)，包含：
- 地图相关类型（投影点、多边形、区域特征等）
- 用户相关类型
- 云函数返回类型
- 地区详情类型
- 聊天消息类型
- 知识库类型

## 相关文档

- [抖音开放平台文档](https://developer.open-douyin.com/)
- [uni-app 文档](https://uniapp.dcloud.net.cn/)
- [Vue 3 文档](https://cn.vuejs.org/)
- [抖音云函数文档](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/server/douyin-cloud/overview)

## License

MIT
