# 中国地图探索页面实现计划（ECharts + GeoJSON版）

## 需求分析
用户需要创建一个中国地图探索页面，具体需求：
- 点击首页"开始探索吧"按钮进入地图页面
- 默认选中华中地区
- 展示7个地区（华北、东北、华东、华中、华南、西南、西北）
- 每个地区仅显示名称和拼音，不带动物图标
- 使用指定背景图URL：`https://tt4ee93854d08d513101-env-6dufeblnzf.tos-cn-beijing.volces.com/background.png`

## 技术方案
使用 **ECharts + GeoJSON** 实现2D地图页面：
1. 安装 `echarts` 依赖
2. 创建地图地理分区数据（将省份聚合为7大地理分区的GeoJSON）
3. 创建新页面 `pages/map/index.vue` - 使用 ECharts 渲染地图
4. 创建样式文件 `pages/map/index.less`
5. 修改首页按钮点击事件，跳转到地图页面
6. 更新 `pages.json` 配置新页面
7. 使用现有的拼音组件展示拼音

## 文件修改清单
| 文件 | 操作 | 说明 |
| --- | --- | --- |
| `package.json` | 修改 | 添加 echarts 依赖 |
| `src/pages/map/index.vue` | 新建 | 地图页面组件（ECharts） |
| `src/pages/map/index.less` | 新建 | 地图页面样式 |
| `src/pages/index/index.vue` | 修改 | 更新按钮点击跳转逻辑 |
| `src/pages.json` | 修改 | 添加地图页面路由 |
| `src/data/regions.json` | 新建 | 7大地理分区GeoJSON数据 |

## 页面设计
- 顶部显示"中国地图"标题（带定位图标）
- 中间使用 ECharts 地图组件展示7个地区区域
- 每个地区用不同颜色区分，参考需求文档的配色方案
- 默认选中"华中地区"，有高亮效果
- 底部显示选中地区的详细信息卡片（名称+拼音+描述）
- 底部有导航TabBar（探索、AI小助手、学习、我的）
- 背景图使用用户指定URL

## 地区数据与配色
| 地区 | 拼音 | 颜色 | 包含省份 |
| --- | --- | --- | --- |
| 东北地区 | dōng běi dì qū | #7A9AAD | 黑龙江、吉林、辽宁 |
| 华北地区 | huá běi dì qū | #B5925A | 北京、天津、河北、山西、内蒙古 |
| 西北地区 | xī běi dì qū | #C49A6C | 陕西、甘肃、青海、宁夏、新疆 |
| 西南地区 | xī nán dì qū | #8B6B8A | 四川、重庆、贵州、云南、西藏 |
| 华中地区 | huá zhōng dì qū | #E8B4B8 | 河南、湖北、湖南 |
| 华东地区 | huá dōng dì qū | #2C7A7A | 上海、江苏、浙江、安徽、福建、江西、山东、台湾 |
| 华南地区 | huá nán dì qū | #2E6B3E | 广东、广西、海南、香港、澳门 |

## ECharts 配置要点
1. 使用 `registerMap` 注册自定义地图
2. 使用 `geo` 组件或 `map` 系列渲染
3. 配置 `itemStyle` 实现不同地区颜色
4. 配置 `emphasis` 实现选中高亮
5. 配置 `label` 显示地区名称
6. 使用 `tooltip` 或自定义方式展示拼音
7. 监听 `click` 事件实现地区切换

## 实现步骤
1. 安装 echarts 依赖
2. 创建7大地理分区的GeoJSON数据（合并省份为大区）
3. 创建地图页面组件（ECharts初始化 + 事件处理）
4. 创建地图页面样式
5. 修改首页跳转逻辑（uni.navigateTo）
6. 更新页面配置

## 依赖检查
- 已存在拼音工具函数 `src/utils/pinyin.ts`
- 已存在拼音组件 `src/components/PinyinText/index.vue`
- 已存在TabBar组件 `src/components/CustomTabBar/index.vue`
- 需要新增 echarts 依赖

## 风险与注意事项
1. **Uni-app兼容性**：ECharts在H5端直接可用，小程序端需使用 `ec-canvas` 或封装组件
2. **GeoJSON数据**：需要准备合并后的7大分区GeoJSON，需确保数据准确性
3. **性能**：地图数据较大时可能影响加载速度，建议使用简化版GeoJSON
4. **拼音展示**：ECharts label仅支持文本，拼音需用自定义label或外部组件展示
