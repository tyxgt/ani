# 样式抽取计划

## 1. 当前状态分析

### 1.1 现有样式分布
| 文件 | 样式行数 | 说明 |
|------|---------|------|
| [index.vue](file:///Users/a58/tyx/ani/src/pages/index/index.vue) | ~128行 | 首页样式，包含动画定义 |
| [ai.vue](file:///Users/a58/tyx/ani/src/pages/ai/ai.vue) | ~34行 | AI小助手页面样式 |
| [learn.vue](file:///Users/a58/tyx/ani/src/pages/learn/learn.vue) | ~40行 | 学习中心页面样式 |
| [mine.vue](file:///Users/a58/tyx/ani/src/pages/mine/mine.vue) | ~49行 | 我的页面样式 |

### 1.2 重复样式识别
- **背景渐变**: `linear-gradient(180deg, #87CEEB 0%, #E0F4FF 100%)` - 出现于 ai、learn、mine 页面
- **页面基础**: `min-height: 100vh` - 所有页面

---

## 2. 目标结构

```
src/
├── styles/
│   ├── variables.less      # 全局变量（颜色、字体等）
│   ├── common.less         # 公共样式（背景渐变、卡片等）
│   └── animations.less     # 动画定义（float、fly）
└── pages/
    ├── index/
    │   ├── index.vue       # 首页组件
    │   └── index.less      # 首页样式
    ├── ai/
    │   ├── index.vue       # AI页面组件（重命名）
    │   └ index.less        # AI页面样式
    ├── learn/
    │   ├── index.vue       # 学习页面组件（重命名）
    │   └ index.less        # 学习页面样式
    └── mine/
    │   ├── index.vue       # 我的页面组件（重命名）
    │   └ index.less        # 我的页面样式
```

---

## 3. 实施步骤

### 3.1 创建公共样式文件
- `src/styles/variables.less` - 全局变量
- `src/styles/common.less` - 公共样式类
- `src/styles/animations.less` - 动画定义

### 3.2 创建页面样式文件
每个页面文件夹下创建对应的 `index.less` 文件：
- `src/pages/index/index.less`
- `src/pages/ai/index.less`
- `src/pages/learn/index.less`
- `src/pages/mine/index.less`

### 3.3 重命名 Vue 文件
将各页面的 Vue 文件统一重命名为 `index.vue`：
- `ai.vue` → `index.vue`
- `learn.vue` → `index.vue`
- `mine.vue` → `index.vue`

### 3.4 更新 pages.json
修改页面路径配置，保持路径不变（因为文件夹名不变，只是文件名改为 index）

### 3.5 更新 Vue 文件
移除内联样式，改为导入同级目录的 less 文件

---

## 4. 文件变更清单

| 操作 | 文件路径 |
|------|---------|
| 新建 | `src/styles/variables.less` |
| 新建 | `src/styles/common.less` |
| 新建 | `src/styles/animations.less` |
| 新建 | `src/pages/index/index.less` |
| 新建 | `src/pages/ai/index.less` |
| 新建 | `src/pages/learn/index.less` |
| 新建 | `src/pages/mine/index.less` |
| 重命名 | `src/pages/ai/ai.vue` → `src/pages/ai/index.vue` |
| 重命名 | `src/pages/learn/learn.vue` → `src/pages/learn/index.vue` |
| 重命名 | `src/pages/mine/mine.vue` → `src/pages/mine/index.vue` |
| 修改 | `src/pages/index/index.vue` - 移除内联样式 |
| 修改 | `src/pages.json` - 更新页面路径 |

---

## 5. 验证步骤

1. 运行 `npm run dev:h5` 检查编译是否成功
2. 浏览器访问页面确认样式正常显示
3. 检查动画效果是否正常工作