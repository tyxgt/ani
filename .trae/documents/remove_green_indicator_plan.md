# 移除底部导航栏绿色选中样式 - 实施计划

## 1. 问题分析

用户反馈底部导航栏存在绿色的选中指示器样式，需要移除。

### 问题定位
- **文件位置**: `/Users/a58/tyx/ani/src/components/CustomTabBar/`
- **样式定义**: `index.less` 中第78-85行的 `.tab-indicator` 类，包含绿色背景 `background: #2C7A7A;`
- **模板引用**: `index.vue` 中第34行的 `<view v-if="currentIndex === index" class="tab-indicator"></view>`

### 样式代码
```less
.tab-indicator {
  position: absolute;
  bottom: 5px;
  width: 30px;
  height: 4px;
  background: #2C7A7A;  // 绿色背景
  border-radius: 2px;
}
```

## 2. 修改方案

### 方案概述
移除底部导航栏的选中指示器样式，包括：
1. 删除 Vue 模板中的指示器元素
2. 删除或注释 CSS 样式定义

### 修改步骤
1. 编辑 `index.vue` - 删除第34行的 `<view v-if="currentIndex === index" class="tab-indicator"></view>`
2. 编辑 `index.less` - 删除 `.tab-indicator` 样式块（第78-85行）

## 3. 文件修改清单

| 文件路径 | 修改内容 |
|---------|---------|
| `src/components/CustomTabBar/index.vue` | 删除 `<view v-if="currentIndex === index" class="tab-indicator"></view>` |
| `src/components/CustomTabBar/index.less` | 删除 `.tab-indicator` 样式定义 |

## 4. 风险评估

- **低风险**: 仅移除视觉样式，不影响导航功能逻辑
- **影响范围**: 仅底部导航栏的选中状态视觉反馈

## 5. 验证方法

修改完成后，通过构建或预览验证底部导航栏不再显示绿色选中指示器。