import type { RegionDetail } from '../types'

export const REGION_DETAILS: Record<string, RegionDetail> = {
  东北地区: {
    name: '东北地区',
    pinyin: 'dōng běi dì qū',
    description: '这里有茂密的森林和肥沃的黑土地，冬天会下大雪哦！',
    geoFeatures: [
      { name: '林海雪原', icon: '🌲', bgColor: '#E8F5E9' },
      { name: '黑土肥沃', icon: '🌾', bgColor: '#FFF3E0' },
      { name: '冰雪世界', icon: '❄️', bgColor: '#E3F2FD' },
    ],
    provinces: ['黑龙江', '吉林', '辽宁', '内蒙古东部'],
  },
  华北地区: {
    name: '华北地区',
    pinyin: 'huá běi dì qū',
    description: '这里有雄伟的长城和广阔的平原，是中华文明的发源地之一。',
    geoFeatures: [
      { name: '长城雄伟', icon: '🏯', bgColor: '#FFF3E0' },
      { name: '平原广阔', icon: '🌾', bgColor: '#E8F5E9' },
      { name: '古都文化', icon: '🏛️', bgColor: '#F3E5F5' },
    ],
    provinces: ['北京', '天津', '河北', '山西', '内蒙古中部'],
  },
  西北地区: {
    name: '西北地区',
    pinyin: 'xī běi dì qū',
    description: '这里有大片的沙漠和美丽的绿洲，还有高高的天山呢！',
    geoFeatures: [
      { name: '沙漠绿洲', icon: '🏜️', bgColor: '#FFF8E1' },
      { name: '天山巍峨', icon: '🏔️', bgColor: '#E3F2FD' },
      { name: '草原辽阔', icon: '🐎', bgColor: '#E8F5E9' },
    ],
    provinces: ['陕西', '甘肃', '青海', '宁夏', '新疆'],
  },
  西南地区: {
    name: '西南地区',
    pinyin: 'xī nán dì qū',
    description: '这里山高谷深，森林茂密，有很多可爱的动物朋友！',
    geoFeatures: [
      { name: '高山连绵', icon: '🏔️', bgColor: '#E8F5E9' },
      { name: '雨林茂密', icon: '🌴', bgColor: '#C8E6C9' },
      { name: '动物众多', icon: '🐼', bgColor: '#FFF3E0' },
    ],
    provinces: ['四川', '云南', '贵州', '西藏', '重庆'],
  },
  华中地区: {
    name: '华中地区',
    pinyin: 'huá zhōng dì qū',
    description: '这里有很多湖泊和大河，是鱼米之乡，物产丰富！',
    geoFeatures: [
      { name: '江河纵横', icon: '🌊', bgColor: '#E3F2FD' },
      { name: '湖泊众多', icon: '🏞️', bgColor: '#B3E5FC' },
      { name: '鱼米之乡', icon: '🐟', bgColor: '#FFF9C4' },
    ],
    provinces: ['河南', '湖北', '湖南'],
  },
  华东地区: {
    name: '华东地区',
    pinyin: 'huá dōng dì qū',
    description: '这里有江南水乡和美丽的海岸，经济发达，风景如画！',
    geoFeatures: [
      { name: '江南水乡', icon: '🏘️', bgColor: '#E3F2FD' },
      { name: '海岸秀美', icon: '🌊', bgColor: '#B2EBF2' },
      { name: '山水如画', icon: '⛰️', bgColor: '#E8F5E9' },
    ],
    provinces: ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '台湾'],
  },
  华南地区: {
    name: '华南地区',
    pinyin: 'huá nán dì qū',
    description: '这里天气炎热，有很多热带水果，还有美丽的海滩！',
    geoFeatures: [
      { name: '热带风情', icon: '🌴', bgColor: '#C8E6C9' },
      { name: '海滩美丽', icon: '🏖️', bgColor: '#FFF9C4' },
      { name: '雨林神秘', icon: '🌿', bgColor: '#DCEDC8' },
    ],
    provinces: ['广东', '广西', '海南', '香港', '澳门'],
  },
}
