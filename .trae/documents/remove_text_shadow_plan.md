# 移除文字阴影计划

## 问题分析

页面文字出现阴影效果是因为在 `PinyinText` 组件的样式文件中设置了 `text-shadow` 属性。

### 问题位置

文件路径：`src/components/PinyinText/index.less`

相关代码：
```css
.char {
  font-size: 26px;
  color: #fff;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);  /* 文字阴影 */
}

.pinyin {
  font-size: 20px;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);  /* 文字阴影 */
}
```

## 修改方案

移除 `.char` 和 `.pinyin` 类中的 `text-shadow` 属性即可消除文字阴影效果。

## 修改文件

- `src/components/PinyinText/index.less`

## 步骤

1. 打开 `src/components/PinyinText/index.less` 文件
2. 删除 `.char` 类中的 `text-shadow` 属性
3. 删除 `.pinyin` 类中的 `text-shadow` 属性
4. 保存文件

## 预期效果

移除阴影后，页面上的中文文字和拼音文字将不再有阴影效果，文字显示更加清晰简洁。
