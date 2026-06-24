# 首页"开始探索吧"字体位置乱修复计划

## 问题分析
首页"开始探索吧"按钮使用了 `display-mode="vertical"` 模式，从截图来看字体位置有问题。

可能的原因：
1. vertical 模式下 `.char-group` 的固定高度 `height: 60px` 导致布局异常
2. 拼音与汉字之间的间距或对齐有问题
3. 字间距（margin: 0 4px）可能过大

## 解决方案
检查并修复 PinyinText 组件 vertical 模式的样式，确保拼音和汉字正确对齐。

## 文件修改清单
| 文件 | 操作 | 说明 |
| --- | --- | --- |
| `src/components/PinyinText/index.less` | 修改 | 修复 vertical 模式下的布局问题 |

## 实现步骤
1. 调整 `.char-group` 的高度和间距
2. 确保拼音和汉字在 vertical 模式下正确对齐
3. 验证首页按钮显示效果

## 风险与注意事项
- 保持 horizontal 模式不受影响
- 不影响其他页面的 PinyinText 使用
