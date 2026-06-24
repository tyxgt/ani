# Mine 组件样式不生效修复计划

## 问题分析
在 `mine/index.vue` 中，通过 `PinyinText` 组件的 `charClass` 和 `pinyinClass` 属性传递自定义样式类名（如 `menu-name`、`menu-pinyin`），但由于 `PinyinText` 组件使用了 `scoped` 样式，父组件中定义的样式无法穿透到子组件内部。

## 解决方案
在 `mine/index.less` 中使用 CSS 深度选择器（`::v-deep`）来穿透 scoped 样式。

## 文件修改清单
| 文件 | 操作 | 说明 |
| --- | --- | --- |
| `src/pages/mine/index.less` | 修改 | 添加深度选择器，让自定义样式穿透到 PinyinText 子组件 |

## 实现步骤
1. 修改 `.nickname`、`.nickname-pinyin`、`.menu-name`、`.menu-pinyin` 样式，使用 `::v-deep` 选择器

## 风险与注意事项
- 深度选择器会影响所有子组件，需要确保样式选择器足够具体
- 使用 `::v-deep` 是 Vue 3 推荐的深度选择器语法
