# 自定义底部导航实现计划

## 需求分析

用户希望移除小程序原生 tabBar 配置，改为纯 Vue 组件实现页面导航。

## 当前状态

目前使用 uni-app 原生 tabBar 配置，需要改为自定义组件实现：
- pages.json 中有 tabBar 配置（"custom": true）
- 已创建 CustomTabBar 组件
- 各页面已引用 CustomTabBar

## 实现方案

### 1. 修改 pages.json
- 移除 tabBar 配置（不再需要）
- 首页保持自定义导航样式

### 2. 更新 CustomTabBar 组件
- 使用 uni.navigateTo 进行页面跳转
- 移除 switchTab 相关代码

### 3. 更新页面组件
- 确保所有页面都引用 CustomTabBar 组件
- 调整页面样式适配自定义导航

## 文件变更清单

| 操作 | 文件路径 |
|------|---------|
| 修改 | `src/pages.json` - 移除 tabBar 配置 |
| 修改 | `src/components/CustomTabBar.vue` - 使用 navigateTo 跳转 |

## 验证步骤

1. 运行 `npm run dev:h5` 查看效果
2. 点击底部导航验证页面跳转功能