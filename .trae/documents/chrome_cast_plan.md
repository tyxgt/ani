# 解决 Chrome 投放（Cast）手机预览问题

## 问题分析

当前项目无法通过 Chrome 的投放（Cast）功能进行手机预览，主要原因如下：

### 1. manifest.json 缺少 H5 配置
- uni-app 需要在 `manifest.json` 中配置 `h5` 节点来启用 H5 平台特性
- 当前 `manifest.json` 中**没有 `h5` 配置节点**，因此没有启用 Cast 相关 API

### 2. index.html 缺少 Cast Sender SDK
- Chrome Cast 需要在 HTML 中引入 Google Cast Sender SDK
- 当前 `index.html` 没有引入任何 Cast 相关的 JavaScript SDK

### 3. uni-app H5 的 Cast 支持机制
- uni-app 需要在 `manifest.json` 的 `h5` 节点下配置 `castApi: true` 来启用 Cast API
- 启用后 uni-app 会自动处理 Cast 相关的配置

---

## 解决方案

### 修改文件 1: `/src/manifest.json`

在 `manifest.json` 中添加 `h5` 配置节点：

```json
"h5" : {
    "title" : "3D中国地理",
    "router" : {
        "mode" : "hash"
    },
    "castApi" : true,
    "sdkConfigs" : {
        "casts" : []
    }
}
```

**说明**：
- `castApi: true` - 启用 uni-app 的 Cast API 支持
- `sdkConfigs.casts` - 配置 Cast SDK 相关选项（可留空）

### 修改文件 2: `index.html`

在 `<head>` 中添加 Google Cast Sender SDK：

```html
<script src="https://www.gstatic.com/cv/sender/js/1.0/cast_framework.js"></script>
```

或者使用较新的 Cairn Sender SDK：

```html
<script type="module" src="https://www.gstatic.com/cast/sdk/libs/caf_receiver/v0.0.1/cast_receiver_framework.js"></script>
```

---

## 假设与决策

1. **假设用户使用的是标准 Chrome Cast**：采用 Google 官方的 Cast Sender SDK
2. **决定使用 `cast_framework.js`**：这是最广泛使用的 Cast Sender API
3. **uni-app 版本为 3.x**（从 package.json 的依赖可以看出）：因此配置方式为上述格式

---

## 验证步骤

1. 修改 `manifest.json` 添加 `h5` 配置
2. 修改 `index.html` 添加 Cast SDK
3. 运行 `npm run dev:h5` 启动开发服务器
4. 在 Chrome 中打开页面，使用 Cast 功能检查是否能发现并投放到手机

---

## 注意事项

- Chrome Cast 需要**HTTPS环境**或**localhost**才能正常工作
- 如果使用手机预览投屏到电脑的 Chrome，需要确保手机和电脑在同一网络下
- Cast 接收端需要是一个支持 Cast 的设备（如 Chromecast、电视棒等）
