# 汉字拼音及声调实现方案

## 项目分析

当前项目是一个 UniApp + Vue 3 + TypeScript 的儿童教育应用，包含以下页面：
- 首页 (`/pages/index/index.vue`)
- AI小助手 (`/pages/ai/index.vue`)
- 学习中心 (`/pages/learn/index.vue`)
- 个人中心 (`/pages/mine/index.vue`)

## 实现方案

### 方案选择

用户推荐使用 `pinyin-pro` 库，这是一个功能强大的中文转拼音库，支持：
- 完整的声调标注
- 多音字处理
- 多种输出格式

**替代方案对比：**
| 方案 | 特点 | 适用场景 |
|------|------|----------|
| `pinyin-pro` | 功能全面，支持声调，体积较大 | 需要完整拼音功能 |
| `pinyin` | 轻量级，基础功能 | 简单拼音转换 |
| 自定义字典 | 完全可控，体积小 | 特定词汇场景 |

推荐使用 `pinyin-pro`，因为它能完美满足用户对声调的需求。

### 实施步骤

#### 1. 安装依赖
```bash
npm install pinyin-pro
```

#### 2. 创建拼音工具模块
- 创建 `/src/utils/pinyin.ts` - 封装拼音转换逻辑

#### 3. 创建拼音组件
- 创建 `/src/components/PinyinText.vue` - 显示汉字+拼音的通用组件

#### 4. 修改页面组件
- 更新所有页面的文字显示，使用拼音组件

#### 5. 测试验证
- 确保拼音和声调正确显示
- 验证多音字处理效果

## 文件修改清单

| 文件路径 | 修改内容 | 状态 |
|----------|----------|------|
| `package.json` | 添加 pinyin-pro 依赖 | 待修改 |
| `src/utils/pinyin.ts` | 创建拼音工具函数 | 待创建 |
| `src/components/PinyinText.vue` | 创建拼音文字组件 | 待创建 |
| `src/pages/index/index.vue` | 使用拼音组件 | 待修改 |
| `src/pages/ai/index.vue` | 使用拼音组件 | 待修改 |
| `src/pages/learn/index.vue` | 使用拼音组件 | 待修改 |
| `src/pages/mine/index.vue` | 使用拼音组件 | 待修改 |
| `src/components/CustomTabBar.vue` | 使用拼音组件 | 待修改 |

## 技术要点

1. **pinyin-pro 基本用法**：
   ```typescript
   import { pinyin } from 'pinyin-pro'
   pinyin('汉字', { toneType: 'symbol' }) // 返回 "hàn zì"
   ```

2. **组件设计**：
   - 支持自定义样式
   - 支持多音字切换（可选）
   - 响应式设计适配不同屏幕

3. **性能优化**：
   - 拼音转换结果缓存
   - 避免重复计算

## 风险评估

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 库体积较大 | 增加包体积 | 考虑按需引入或使用 lighter 版本 |
| 多音字处理 | 可能出现错误 | 提供手动修正接口 |
| 特殊字符 | 转换失败 | 添加异常处理 |

## 预计产出

- 完整的拼音工具模块
- 通用的拼音文字组件
- 所有页面文字带拼音显示
