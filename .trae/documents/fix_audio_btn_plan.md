# 修复音频按钮图标撑满问题

## 问题分析

从截图可以看到，右上角的音频按钮（喇叭图标）没有撑满整个圆形按钮。当前样式：

```less
.audio-btn {
  width: 80rpx;
  height: 80rpx;
  image {
    width: 100%;
    height: 100%;
  }
}
```

虽然图片设置了100%宽高，但由于图片比例和padding问题，导致图标没有完全填充按钮。

## 解决方案

修改 `src/pages/index/index.less` 中的 `.audio-btn` 样式：
1. 添加内边距让图标与按钮边缘有适当间距
2. 确保图标使用 `aspectFill` 模式拉伸填充

## 文件变更

| 操作 | 文件路径 |
|------|---------|
| 修改 | `src/pages/index/index.less` - 调整音频按钮样式 |

## 验证步骤

1. 运行 `npm run dev:h5` 查看效果
2. 确认音频按钮图标已撑满圆形按钮