# 组件样式抽离方案

## 需求分析

用户希望将组件样式从 `.vue` 文件中抽离出来，每个组件用单独的文件夹包裹，包含 `index.vue` 和 `index.less` 文件。

## 重构结构

```
src/components/
├── PinyinText/
│   ├── index.vue      # 组件逻辑
│   └── index.less     # 组件样式
└── CustomTabBar/
    ├── index.vue      # 组件逻辑
    └── index.less     # 组件样式
```

## 修改步骤

### 1. 创建 PinyinText 组件文件夹
- 创建 `src/components/PinyinText/index.vue` - 移除 style 部分
- 创建 `src/components/PinyinText/index.less` - 抽离样式

### 2. 创建 CustomTabBar 组件文件夹
- 创建 `src/components/CustomTabBar/index.vue` - 移除 style 部分，更新 PinyinText 引用路径
- 创建 `src/components/CustomTabBar/index.less` - 抽离样式

### 3. 更新页面中对组件的引用

### 4. 删除原有的 .vue 文件

## 文件修改清单

| 文件路径 | 修改内容 | 状态 |
|----------|----------|------|
| `src/components/PinyinText/index.vue` | 创建新文件，不含样式 | 待创建 |
| `src/components/PinyinText/index.less` | 创建样式文件 | 待创建 |
| `src/components/CustomTabBar/index.vue` | 创建新文件，不含样式 | 待创建 |
| `src/components/CustomTabBar/index.less` | 创建样式文件 | 待创建 |
| `src/components/PinyinText.vue` | 删除原文件 | 待删除 |
| `src/components/CustomTabBar.vue` | 删除原文件 | 待删除 |
| `src/pages/index/index.vue` | 更新组件引用路径 | 待修改 |
| `src/pages/ai/index.vue` | 更新组件引用路径 | 待修改 |
| `src/pages/learn/index.vue` | 更新组件引用路径 | 待修改 |
| `src/pages/mine/index.vue` | 更新组件引用路径 | 待修改 |

## 注意事项

1. CustomTabBar 依赖 PinyinText，需确保路径正确
2. 样式保持 scoped 效果
3. 所有引用组件的页面都需要更新路径