export {}

declare module "vue" {
  type Hooks = App.AppInstance & Page.PageInstance;
  interface ComponentCustomOptions extends Hooks {}
}

declare global {
  const tt: any
  // 微信小程序插件加载器（如「微信同声传译」WechatSI），仅 MP-WEIXIN 编译目标下存在
  const requirePlugin: (pluginName: string) => any
}