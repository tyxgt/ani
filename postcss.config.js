module.exports = {
  plugins: {
    'postcss-plugin-px2rem': {
      rootValue: 100,  // 100px = 1rem
      unitPrecision: 5,
      propList: ['*'],
      selectorBlackList: [],
      replace: true,
      mediaQuery: false,
      minPixelValue: 2  // 小于2px不转换
    }
  }
}