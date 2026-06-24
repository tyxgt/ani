# PinyinText 文字左对齐修改计划

## 需求分析
用户希望 mine 页面中的菜单文字（设置、关于我们等）靠左对齐，而不是居中对齐。

## 问题分析
PinyinText 组件当前默认是居中对齐的：
- `.pinyin-text` 容器：`align-items: center`
- `.pinyin-row` 和 `.text-row`：`justify-content: center`

## 解决方案
给 PinyinText 组件添加 `align` prop，支持 'left' | 'center' | 'right' 三种对齐方式。

## 文件修改清单
| 文件 | 操作 | 说明 |
| --- | --- | --- |
| `src/components/PinyinText/index.vue` | 修改 | 添加 align prop 和动态样式类 |
| `src/components/PinyinText/index.less` | 修改 | 添加左对齐、右对齐样式 |
| `src/pages/mine/index.vue` | 修改 | 菜单 PinyinText 添加 align="left" |

## 实现步骤
1. 在 PinyinText 组件中添加 align prop
2. 根据 align 值动态设置 class
3. 在样式文件中添加 .align-left、.align-right 样式
4. 修改 mine 页面，设置菜单文字左对齐

## 风险与注意事项
- 保持向后兼容，默认值为 'center'
- 不影响其他页面的居中显示效果
