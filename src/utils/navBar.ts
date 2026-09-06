/**
 * 自定义导航栏（navigationStyle: custom）顶部样式计算。
 *
 * 1. 垂直：`env(safe-area-inset-top)` 只含刘海/安全区，不含状态栏高度，直角屏 / 部分机型 /
 *    开发者工具里会返回 0，头部会被状态栏 / 原生胶囊按钮挡住。这里用状态栏高度 + 胶囊按钮
 *    位置算出真实的顶部偏移。
 * 2. 水平：返回按钮绝对定位在左侧安全区，标题要「屏幕水平居中」且不被右上角原生胶囊按钮
 *    （···  ⊙）遮挡，这里给容器返回一对对称的左右内边距，把标题挤进两侧都够不着的安全区。
 *
 * 用法：
 *   const navHeaderStyle = getCustomNavStyle()
 *   <view :class="styles.detailNavHeader" :style="navHeaderStyle">
 * 并把 .less 里的 `margin-top: env(safe-area-inset-top)` 去掉（改由这里的 marginTop 负责）。
 */
type NavStyle = Record<string, string>

let cached: NavStyle | null = null

export function getCustomNavStyle(): NavStyle {
  if (cached) return cached

  // 头部整体向下偏移量：默认按状态栏高度，有胶囊按钮时对齐胶囊按钮顶部
  let offsetTop = 0
  // 左右对称内边距：默认只留返回键的位置；有胶囊按钮时 = 胶囊占用宽度 + 右边距
  let sidePad = 48

  try {
    const sys = uni.getSystemInfoSync()
    offsetTop = sys.statusBarHeight || (sys as any).safeAreaInsets?.top || 0

    // feature-detect：微信、抖音等小程序都提供此 API；h5 下没有
    const getRect = (uni as any).getMenuButtonBoundingClientRect
    const rect = typeof getRect === 'function' ? getRect() : null
    if (rect && rect.width) {
      offsetTop = rect.top
      // 胶囊左边缘到屏幕右边缘的距离 = 胶囊宽 + 右外边距；两侧对称留白，标题即屏幕居中
      sidePad = Math.ceil((sys.windowWidth || 0) - rect.left) + 4
    }
  } catch (e) {
    console.warn('[navBar] 读取系统信息失败，使用默认顶部样式', e)
  }

  cached = {
    marginTop: `${offsetTop}px`,
    paddingLeft: `${sidePad}px`,
    paddingRight: `${sidePad}px`,
  }
  return cached
}
