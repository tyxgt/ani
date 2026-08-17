const cloud = require('wx-server-sdk')
const jwt = require('jsonwebtoken')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

function verifyToken(token) {
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-only-insecure-secret-please-set-JWT_SECRET')
  } catch (e) {
    return null
  }
}

// 把数据库 region.region 字段（如"黑龙江、吉林、辽宁及内蒙古东部"）解析成省份数组
function parseProvinces(regionField) {
  if (!regionField) return []
  return regionField
    .split(/[、，,]|及/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const GEO_FEATURE_TEMPLATES = {
  '东北地区': [
    { name: '林海雪原', icon: '🌲', bgColor: '#E8F5E9' },
    { name: '黑土肥沃', icon: '🌾', bgColor: '#FFF3E0' },
    { name: '冰雪世界', icon: '❄️', bgColor: '#E3F2FD' },
  ],
  '华北地区': [
    { name: '长城雄伟', icon: '🏯', bgColor: '#FFF3E0' },
    { name: '平原广阔', icon: '🌾', bgColor: '#E8F5E9' },
    { name: '古都文化', icon: '🏛️', bgColor: '#F3E5F5' },
  ],
  '西北地区': [
    { name: '沙漠绿洲', icon: '🏜️', bgColor: '#FFF8E1' },
    { name: '天山巍峨', icon: '🏔️', bgColor: '#E3F2FD' },
    { name: '草原辽阔', icon: '🐎', bgColor: '#E8F5E9' },
  ],
  '西南地区': [
    { name: '高山连绵', icon: '🏔️', bgColor: '#E8F5E9' },
    { name: '雨林茂密', icon: '🌴', bgColor: '#C8E6C9' },
    { name: '动物众多', icon: '🐼', bgColor: '#FFF3E0' },
  ],
  '华中地区': [
    { name: '江河纵横', icon: '🌊', bgColor: '#E3F2FD' },
    { name: '湖泊众多', icon: '🏞️', bgColor: '#B3E5FC' },
    { name: '鱼米之乡', icon: '🐟', bgColor: '#FFF9C4' },
  ],
  '华东地区': [
    { name: '江南水乡', icon: '🏘️', bgColor: '#E3F2FD' },
    { name: '海岸秀美', icon: '🌊', bgColor: '#B2EBF2' },
    { name: '山水如画', icon: '⛰️', bgColor: '#E8F5E9' },
  ],
  '华南地区': [
    { name: '热带风情', icon: '🌴', bgColor: '#C8E6C9' },
    { name: '海滩美丽', icon: '🏖️', bgColor: '#FFF9C4' },
    { name: '雨林神秘', icon: '🌿', bgColor: '#DCEDC8' },
  ],
}

const PINYIN_MAP = {
  '东北地区': 'dōng běi dì qū',
  '华北地区': 'huá běi dì qū',
  '西北地区': 'xī běi dì qū',
  '西南地区': 'xī nán dì qū',
  '华中地区': 'huá zhōng dì qū',
  '华东地区': 'huá dōng dì qū',
  '华南地区': 'huá nán dì qū',
}

exports.main = async (event, context) => {
  const payload = verifyToken(event.token)
  if (!payload) {
    return { code: 401, msg: '未登录或登录已过期', data: null }
  }

  try {
    const { name } = event

    if (!name) {
      return {
        code: -1,
        msg: '参数错误：缺少 name',
        data: null,
      }
    }

    const result = await db.collection('region')
      .where({ name })
      .get()

    if (result.data.length === 0) {
      return {
        code: -1,
        msg: '未找到该地区',
        data: null,
      }
    }

    const region = result.data[0]

    const geoFeatures = GEO_FEATURE_TEMPLATES[name] || [
      { name: region.features ? region.features.split(/[，,]/)[0] || '地理特色' : '地理特色', icon: '🌿', bgColor: '#E8F5E9' },
      { name: region.climate ? region.climate.split(/[，,]/)[0] || '气候特点' : '气候特点', icon: '🌤️', bgColor: '#E3F2FD' },
      { name: region.vegetation ? region.vegetation.split(/[，,]/)[0] || '植被丰富' : '植被丰富', icon: '🌱', bgColor: '#FFF3E0' },
    ]

    const provinces = parseProvinces(region.region)

    return {
      code: 0,
      msg: '',
      data: {
        name: region.name,
        pinyin: PINYIN_MAP[name] || '',
        description: region.summary || region.features || '',
        geoFeatures,
        provinces,
      },
    }
  } catch (err) {
    return {
      code: -1,
      msg: err.message,
      data: null,
    }
  }
}
