// 兜底声明微信小程序 / uni 全局变量，供 auth.ts / cloud.ts 在 #ifdef 包裹的代码中使用。
// H5 编译时这些代码会被条件编译剔除，不影响运行时。
declare const wx: any
