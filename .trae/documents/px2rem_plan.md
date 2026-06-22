# 引入 postcss-plugin-px2rem 实现单位转换

## 需求分析

用户希望将样式中的 rpx 单位转换为 px/rem，通过引入 postcss-plugin-px2rem 插件实现自动转换。

## 当前状态

- 项目使用 uni-app + Vue3 + TypeScript
- 样式文件使用 .less 格式
- 当前没有 postcss 配置文件
- 所有样式使用 rpx 单位

## 实现方案

### 1. 安装依赖
```bash
npm install postcss postcss-plugin-px2rem --save-dev
```

### 2. 创建 postcss.config.js 配置文件
配置 px2rem 插件，设置转换规则

### 3. 修改样式文件中的单位
将所有 rpx 单位改为 px，让插件自动转换为 rem

### 4. 在 index.html 中添加 rem 基准设置
通过 JavaScript 动态计算根元素字体大小

## 文件变更清单

| 操作 | 文件路径 |
|------|---------|
| 新建 | `postcss.config.js` - postcss 配置 |
| 修改 | `src/index.html` - 添加 rem 基准设置 |
| 修改 | `src/styles/variables.less` - 将 rpx 改为 px |
| 修改 | `src/styles/common.less` - 将 rpx 改为 px |
| 修改 | `src/styles/animations.less` - 将 rpx 改为 px |
| 修改 | `src/pages/index/index.less` - 将 rpx 改为 px |
| 修改 | `src/pages/ai/index.less` - 将 rpx 改为 px |
| 修改 | `src/pages/learn/index.less` - 将 rpx 改为 px |
| 修改 | `src/pages/mine/index.less` - 将 rpx 改为 px |

## 配置说明

| 参数 | 值 | 说明 |
|------|-----|------|
| rootValue | 75 | 设计稿宽度为 750px，1rem = 75px |
| unitPrecision | 5 | 转换精度 |
| propList | ['*'] | 需要转换的属性 |
| selectorBlackList | [] | 不需要转换的选择器 |
| replace | true | 是否替换原值 |

## 验证步骤

1. 安装依赖：`npm install`
2. 运行开发模式：`npm run dev:h5`
3. 检查样式是否正确转换为 rem