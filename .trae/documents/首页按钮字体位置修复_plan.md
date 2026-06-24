# 首页"开始探索吧"字体位置错乱修复计划

## 问题总结

首页"开始探索吧"按钮中的竖排文字（拼音+汉字）位置错乱，原因是多方面的样式冲突和布局问题。

## 根因分析

### 1. 样式冲突（主要原因）
- **位置**：[index.less](file:///Users/a58/tyx/ani/src/pages/index/index.less#L68-L73)
- **问题**：首页在 `.main-btn` 内定义了 `.pinyin-text { font-size: 34px; ... }` 样式
- **影响**：PinyinText 组件样式是全局的（无 scoped），首页样式也是全局的，两者冲突导致布局异常
- **额外问题**：同时通过 `charStyle`/`pinyinStyle` 属性传递样式，形成"三套样式"互相干扰

### 2. vertical 模式下的高度计算问题
- **位置**：[PinyinText/index.less](file:///Users/a58/tyx/ani/src/components/PinyinText/index.less#L30-L41)
- **问题**：`.char-group` 使用 `min-height: 60px`，但字体大小是动态的（通过 charStyle 传入）
- **影响**：当字体较大时，固定的最小高度可能导致内容挤压或溢出

### 3. 按钮高度与内容不匹配
- 按钮高度：80px
- 按钮边框：5px × 2 = 10px
- 实际内容高度：70px
- 竖排文字高度（拼音18px + 汉字28px + 间距）≈ 50-55px
- 虽然理论上够，但加上 flex 布局的各种间距可能出现问题

## 修复方案

### 步骤1：清理首页冗余样式
**文件**：[src/pages/index/index.less](file:///Users/a58/tyx/ani/src/pages/index/index.less)

**修改内容**：
- 删除 `.main-btn` 内的 `.pinyin-text` 样式块（第68-73行）
- 原因：样式已通过 `charStyle` 和 `pinyinStyle` 属性传递，不需要额外的类名样式
- 保留 `.main-btn` 的 flex 布局和 `.btn-icon` 样式

### 步骤2：优化 PinyinText vertical 模式布局
**文件**：[src/components/PinyinText/index.less](file:///Users/a58/tyx/ani/src/components/PinyinText/index.less)

**修改内容**：
1. 移除 `.char-group` 的固定 `min-height: 60px`，改为 `height: auto`，让内容自然撑开
2.