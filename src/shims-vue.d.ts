// 声明 .vue 文件为合法 ES 模块
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 兜底：vue-tsc 1.0.x + TS 4.9 不会为 import './Foo' 自动补全 .vue 扩展，
// 因此把任何相对路径都声明为合法模块（最后 * 必须存在）。
declare module '*' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
