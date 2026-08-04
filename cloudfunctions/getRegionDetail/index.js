const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

const REGION_ANIMALS = {
  '东北地区': [
    { name: '东北虎', pinyin: 'dōng běi hǔ', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+siberian+tiger+cub+sitting+grass+watercolor+cartoon+style+warm+colors&image_size=square_hd', location: '黑龙江·吉林', locationColor: '#FF7043' },
    { name: '丹顶鹤', pinyin: 'dān dǐng hè', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+red+crowned+crane+standing+in+water+reeds+watercolor+cartoon+style+blue+sky+background&image_size=square_hd', location: '黑龙江·吉林', locationColor: '#42A5F5' },
    { name: '梅花鹿', pinyin: 'méi huā lù', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+sika+deer+cartoon+style+chibi+friendly&image_size=square_hd', location: '吉林·辽宁', locationColor: '#66BB6A' },
    { name: '紫貂', pinyin: 'zǐ diāo', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+sable+marten+cartoon+style+chibi+friendly&image_size=square_hd', location: '黑龙江·内蒙古', locationColor: '#AB47BC' },
  ],
  '华北地区': [
    { name: '褐马鸡', pinyin: 'hè mǎ jī', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+brown+eared+pheasant+cartoon+style+chibi+friendly&image_size=square_hd', location: '山西·河北', locationColor: '#8D6E63' },
    { name: '金钱豹', pinyin: 'jīn qián bào', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+north+china+leopard+cartoon+style+chibi+friendly&image_size=square_hd', location: '山西·陕西', locationColor: '#FFA726' },
    { name: '猕猴', pinyin: 'mí hóu', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+rhesus+macaque+monkey+cartoon+style+chibi+friendly&image_size=square_hd', location: '河南·山西', locationColor: '#A1887F' },
    { name: '大鸨', pinyin: 'dà bǎo', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+great+bustard+bird+cartoon+style+chibi+friendly&image_size=square_hd', location: '内蒙古·河北', locationColor: '#90A4AE' },
  ],
  '西北地区': [
    { name: '雪豹', pinyin: 'xuě bào', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+snow+leopard+sitting+on+rock+snow+mountain+background+watercolor+cartoon+style+blue+eyes&image_size=square_hd', location: '新疆·青海', locationColor: '#7E57C2' },
    { name: '藏羚羊', pinyin: 'zàng líng yáng', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+tibetan+antelope+running+on+grassland+watercolor+cartoon+style+high+plateau+background&image_size=square_hd', location: '青海·西藏', locationColor: '#EC407A' },
    { name: '野骆驼', pinyin: 'yě luò tuó', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+wild+bactrian+camel+cartoon+style+chibi+friendly&image_size=square_hd', location: '新疆·甘肃', locationColor: '#FFB74D' },
    { name: '普氏野马', pinyin: 'pǔ shì yě mǎ', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+przewalski+horse+cartoon+style+chibi+friendly&image_size=square_hd', location: '新疆·甘肃', locationColor: '#8D6E63' },
  ],
  '西南地区': [
    { name: '大熊猫', pinyin: 'dà xióng māo', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+giant+panda+sitting+eating+bamboo+watercolor+cartoon+style+green+bamboo+forest&image_size=square_hd', location: '四川·陕西', locationColor: '#4CAF50' },
    { name: '金丝猴', pinyin: 'jīn sī hóu', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+golden+snub+nosed+monkey+sitting+on+branch+snow+mountain+background+watercolor+cartoon+style&image_size=square_hd', location: '云南·四川', locationColor: '#00ACC1' },
    { name: '小熊猫', pinyin: 'xiǎo xióng māo', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+red+panda+cartoon+style+chibi+friendly+tree&image_size=square_hd', location: '四川·西藏', locationColor: '#F4511E' },
    { name: '雪豹', pinyin: 'xuě bào', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+snow+leopard+cartoon+style+chibi+friendly+mountain&image_size=square_hd', location: '西藏·青海', locationColor: '#7E57C2' },
  ],
  '华中地区': [
    { name: '白鱀豚', pinyin: 'bái jì tún', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+yangtze+river+dolphin+baiji+cartoon+style+chibi+friendly&image_size=square_hd', location: '湖北·湖南', locationColor: '#42A5F5' },
    { name: '麋鹿', pinyin: 'mí lù', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+milu+deer+pere+david+cartoon+style+chibi+friendly&image_size=square_hd', location: '湖北·江苏', locationColor: '#8D6E63' },
    { name: '扬子鳄', pinyin: 'yáng zǐ è', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+chinese+alligator+cartoon+style+chibi+friendly&image_size=square_hd', location: '安徽·浙江', locationColor: '#66BB6A' },
    { name: '大鲵', pinyin: 'dà ní', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+chinese+giant+salamander+cartoon+style+chibi+friendly&image_size=square_hd', location: '湖南·湖北', locationColor: '#78909C' },
  ],
  '华东地区': [
    { name: '朱鹮', pinyin: 'zhū huán', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+crested+ibis+bird+pink+cartoon+style+chibi+friendly&image_size=square_hd', location: '陕西·浙江', locationColor: '#EC407A' },
    { name: '黄山猴', pinyin: 'huáng shān hóu', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+tibetan+macaque+huangshan+monkey+cartoon+style+chibi+friendly&image_size=square_hd', location: '安徽·江西', locationColor: '#A1887F' },
    { name: '中华鲟', pinyin: 'zhōng huá xún', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+chinese+sturgeon+fish+cartoon+style+chibi+friendly&image_size=square_hd', location: '上海·江苏', locationColor: '#5C6BC0' },
    { name: '白额雁', pinyin: 'bái é yàn', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+white+fronted+goose+cartoon+style+chibi+friendly&image_size=square_hd', location: '江苏·安徽', locationColor: '#78909C' },
  ],
  '华南地区': [
    { name: '华南虎', pinyin: 'huá nán hǔ', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+south+china+tiger+cartoon+style+chibi+friendly&image_size=square_hd', location: '广东·福建', locationColor: '#FF7043' },
    { name: '绿孔雀', pinyin: 'lǜ kǒng què', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+green+peacock+cartoon+style+chibi+friendly&image_size=square_hd', location: '云南·广西', locationColor: '#26A69A' },
    { name: '亚洲象', pinyin: 'yà zhōu xiàng', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+asian+elephant+cartoon+style+chibi+friendly&image_size=square_hd', location: '云南·广西', locationColor: '#90A4AE' },
    { name: '长臂猿', pinyin: 'cháng bì yuán', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+gibbon+ape+cartoon+style+chibi+friendly+tree&image_size=square_hd', location: '云南·海南', locationColor: '#FFB74D' },
  ],
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

    const animals = REGION_ANIMALS[name] || []

    return {
      code: 0,
      msg: '',
      data: {
        name: region.name,
        pinyin: PINYIN_MAP[name] || '',
        description: region.summary || region.features || '',
        geoFeatures,
        animals,
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
