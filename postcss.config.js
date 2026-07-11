const isH5 = process.env.UNI_PLATFORM === 'h5'

const plugins = {}

if (isH5) {
  plugins['postcss-plugin-px2rem'] = {
    rootValue: 100,
    unitPrecision: 5,
    propList: ['*'],
    selectorBlackList: [],
    replace: true,
    mediaQuery: false,
    minPixelValue: 2
  }
}

module.exports = {
  plugins
}