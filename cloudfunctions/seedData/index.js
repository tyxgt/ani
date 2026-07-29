const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

// 地形数据
const terrainData = [
  {
    id: 1,
    name: '山地',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+mountain+landscape+watercolor+cartoon+style+snow+peaks+blue+sky+eagle+flying+goat+marmot+wildflowers&image_size=square_hd',
    features: '高耸陡峭，海拔高，山峦起伏连绵不断',
    climate: '气候随海拔变化，山顶寒冷，山下温暖',
    vegetation: '从山脚到山顶植被逐渐变化，多为针叶林和草甸',
    region: '喜马拉雅山、天山、昆仑山、秦岭',
    summary: '大地的脊梁，是许多珍稀动植物的家园',
  },
  {
    id: 2,
    name: '平原',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+vast+green+plain+landscape+watercolor+cartoon+style+farmland+river+village+blue+sky&image_size=square_hd',
    features: '地势平坦开阔，土地肥沃，视野辽阔',
    climate: '温和湿润，四季分明，适合农耕',
    vegetation: '农田密布，庄稼茂盛，稻浪滚滚',
    region: '东北平原、华北平原、长江中下游平原',
    summary: '孕育中华文明的肥沃土地，是粮食的主要产地',
  },
  {
    id: 3,
    name: '盆地',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+basin+landscape+watercolor+cartoon+style+surrounded+mountains+warm+colors+village+river&image_size=square_hd',
    features: '四周高、中间低，像一个大盆子',
    climate: '温暖湿润，少风沙，云雾多',
    vegetation: '亚热带植物丰富，竹林茂密',
    region: '四川盆地、塔里木盆地、柴达木盆地、准噶尔盆地',
    summary: '群山环抱的天府之国，物产丰富气候宜人',
  },
  {
    id: 4,
    name: '高原',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+high+plateau+landscape+watercolor+cartoon+style+grassland+blue+sky+yaks+distant+mountains&image_size=square_hd',
    features: '海拔高，面积大，地面开阔辽阔',
    climate: '气候寒冷，日照充足，紫外线强',
    vegetation: '草原广阔，高山草甸，油菜花田',
    region: '青藏高原、内蒙古高原、黄土高原、云贵高原',
    summary: '离天空最近的地方，有壮美的草原和圣洁的雪山',
  },
  {
    id: 5,
    name: '丘陵',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+rolling+hills+landscape+watercolor+cartoon+style+tea+plantations+terraced+fields+misty+mountains&image_size=square_hd',
    features: '地势起伏和缓，坡度较小，连绵不断',
    climate: '温暖湿润，雨量充沛，云雾缭绕',
    vegetation: '茶树、果树遍布，森林覆盖率高',
    region: '东南丘陵、山东丘陵、辽东丘陵',
    summary: '层峦叠翠的绿色海洋，茶叶和水果的故乡',
  },
  {
    id: 6,
    name: '沙漠',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+desert+landscape+watercolor+cartoon+style+sand+dunes+camel+cactus+sunset+warm+colors&image_size=square_hd',
    features: '沙石广布，干旱少雨，昼夜温差极大',
    climate: '干燥炎热，降水稀少，风沙大',
    vegetation: '仙人掌、骆驼刺、胡杨等耐旱植物',
    region: '塔克拉玛干沙漠、戈壁滩、巴丹吉林沙漠',
    summary: '神秘的金色海洋，藏着顽强的生命奇迹',
  },
  {
    id: 7,
    name: '喀斯特地貌',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+karst+landscape+watercolor+cartoon+style+limestone+peaks+caves+underground+river+green+vegetation&image_size=square_hd',
    features: '石灰岩广布，多溶洞、石林、地下河',
    climate: '温暖湿润，雨水充沛，溶蚀作用强',
    vegetation: '喜钙植物丰富，藤蔓缠绕，绿意盎然',
    region: '广西桂林、贵州荔波、云南石林、重庆武隆',
    summary: '大自然的雕塑公园，山水甲天下的人间仙境',
  },
  {
    id: 8,
    name: '丹霞地貌',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+red+rock+landscape+watercolor+cartoon+style+red+cliffs+layered+mountains+blue+sky&image_size=square_hd',
    features: '红色砂砾岩构成，顶平身陡，色彩斑斓',
    climate: '温暖湿润，风化侵蚀强烈',
    vegetation: '崖壁植被稀疏，山顶和谷底植被茂密',
    region: '广东丹霞山、福建武夷山、甘肃张掖、贵州赤水',
    summary: '如霞似火的彩色山峦，大自然的调色盘',
  },
  {
    id: 9,
    name: '雅丹地貌',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+yadan+landscape+watercolor+cartoon+style+wind+eroded+rock+formations+desert+sunset+dry+lake&image_size=square_hd',
    features: '风力侵蚀形成，怪石嶙峋，千姿百态',
    climate: '极度干旱，风大沙多，昼夜温差大',
    vegetation: '植被极其稀少，几乎寸草不生',
    region: '新疆罗布泊、甘肃敦煌魔鬼城、柴达木盆地',
    summary: '风的杰作，戈壁滩上的魔幻城堡',
  },
  {
    id: 10,
    name: '黄土地貌',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+loess+plateau+landscape+watercolor+cartoon+style+yellow+soil+terraces+cave+houses+sheep&image_size=square_hd',
    features: '黄土深厚，千沟万壑，支离破碎',
    climate: '温带大陆性气候，降水集中多暴雨',
    vegetation: '草原和落叶阔叶林，植被覆盖率较低',
    region: '黄土高原、山西、陕西、甘肃东部',
    summary: '中华文明的摇篮，独特的黄土文化发源地',
  },
  {
    id: 11,
    name: '峡谷',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+deep+canyon+landscape+watercolor+cartoon+style+steep+cliffs+river+flowing+through+rainbow+bridge&image_size=square_hd',
    features: '两岸峭壁高耸，河道深切，气势磅礴',
    climate: '垂直气候差异明显，谷底湿润，山顶寒冷',
    vegetation: '从热带到寒带植被垂直分布，种类丰富',
    region: '长江三峡、雅鲁藏布大峡谷、虎跳峡、泸沽湖大峡谷',
    summary: '地球最美丽的伤痕，壮美与险峻并存',
  },
  {
    id: 12,
    name: '海岸地貌',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+coastal+landscape+watercolor+cartoon+style+beach+rocks+waves+seagulls+shells+blue+sea&image_size=square_hd',
    features: '海陆交汇，沙滩、礁石、海蚀洞交错分布',
    climate: '海洋性气候，冬暖夏凉，潮湿多风',
    vegetation: '红树林、海草床、耐盐植物',
    region: '海南三亚、福建厦门、山东青岛、广西北海',
    summary: '大海与陆地的浪漫邂逅，生机勃勃的蓝色边疆',
  },
  {
    id: 13,
    name: '沼泽湿地',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+wetland+marsh+landscape+watercolor+cartoon+style+reeds+lotus+ducks+herons+calm+water+sunset&image_size=square_hd',
    features: '地势低洼，常年积水，水草丰美',
    climate: '湿润多雨，雾气重，气候温和',
    vegetation: '芦苇、香蒲、睡莲等水生植物茂密',
    region: '三江平原湿地、青海湖、鄱阳湖、扎龙湿地',
    summary: '地球之肾，是鸟类和水生动物的天堂',
  },
  {
    id: 14,
    name: '冰川地貌',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+glacier+landscape+watercolor+cartoon+style+ice+peaks+blue+glacier+lake+snow+mountains+crystal&image_size=square_hd',
    features: '冰川覆盖，冰峰林立，蓝冰剔透',
    climate: '终年严寒，冰雪不化，氧气稀薄',
    vegetation: '植被极少，只有地衣和苔藓等低等植物',
    region: '喜马拉雅山冰川、天山冰川、祁连山冰川',
    summary: '固态水的宝库，是大江大河的源头',
  },
  {
    id: 15,
    name: '冻土地貌',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+tundra+permafrost+landscape+watercolor+cartoon+style+moss+lichens+reindeer+low+shrubs+aurora&image_size=square_hd',
    features: '地下常年冰冻，夏天表层融化，地面凹凸不平',
    climate: '冬季漫长严寒，夏季短暂凉爽',
    vegetation: '地衣、苔藓、低矮灌木，没有高大树木',
    region: '青藏高原多年冻土区、大兴安岭北部',
    summary: '冻土层是地球的天然冰箱，藏着远古的秘密',
  },
  {
    id: 16,
    name: '岛屿',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+tropical+island+landscape+watercolor+cartoon+style+palm+trees+turquoise+sea+coral+reef+white+sand&image_size=square_hd',
    features: '四面环海，面积大小不一，海岸线曲折',
    climate: '海洋性气候，温暖湿润，多台风',
    vegetation: '热带亚热带植物丰富，椰子树、棕榈树常见',
    region: '台湾岛、海南岛、崇明岛、西沙群岛',
    summary: '散落在大海上的明珠，每一个都有独特的风情',
  },
  {
    id: 17,
    name: '草原',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+grassland+steppe+landscape+watercolor+cartoon+style+endless+grass+horses+sheep+yurt+blue+sky+clouds&image_size=square_hd',
    features: '地势平坦开阔，以草本植物为主，一望无际',
    climate: '温带大陆性气候，降水较少，昼夜温差大',
    vegetation: '针茅、羊草等多年生草本植物',
    region: '内蒙古草原、呼伦贝尔草原、锡林郭勒草原',
    summary: '天苍苍野茫茫，风吹草低见牛羊的壮丽画卷',
  },
  {
    id: 18,
    name: '森林',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+forest+landscape+watercolor+cartoon+style+tall+trees+sunlight+deer+squirrel+mushroom+stream&image_size=square_hd',
    features: '树木茂密覆盖，生物多样性丰富',
    climate: '湿润多雨，冬暖夏凉，气候宜人',
    vegetation: '乔木、灌木、草本植物层层叠叠',
    region: '东北林区、西南林区、东南丘陵林区',
    summary: '地球之肺，是千千万万野生动植物的家园',
  },
]

// 气候数据
const climateData = [
  {
    id: 1,
    name: '溫帶季風氣候',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+temperate+monsoon+landscape+watercolor+cartoon+style+four+seasons+trees+spring+blossom+summer+green+autumn+yellow+winter+snow&image_size=square_hd',
    temperature: '四季分明，春暖夏熱，秋涼冬冷',
    precipitation: '夏季多雨，冬季乾燥，雨熱同期',
    characteristics: '季風顯著，春天花開，夏天炎熱多雨，秋天涼爽，冬天寒冷',
    region: '中國東北、華北、朝鮮半島、日本北部',
    summary: '春夏秋冬輪番上陣，是大自然最美麗的四季舞台',
  },
  {
    id: 2,
    name: '亞熱帶季風氣候',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+subtropical+monsoon+landscape+watercolor+cartoon+style+lush+green+bamboo+rain+paddy+fields+lotus+pond&image_size=square_hd',
    temperature: '夏季高溫，冬季溫和，四季常青',
    precipitation: '雨水豐沛，夏季梅雨綿綿，颱風帶來暴雨',
    characteristics: '溫暖濕潤，植被常綠，梅雨和颱風是特色',
    region: '中國華東、華南、長江中下游、台灣',
    summary: '綠意盎然的魚米之鄉，雨水滋潤萬物生長',
  },
  {
    id: 3,
    name: '熱帶季風氣候',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+tropical+monsoon+landscape+watercolor+cartoon+style+coconut+palm+beach+monkey+colorful+birds+bright+sun&image_size=square_hd',
    temperature: '全年高溫，長夏無冬，陽光充足',
    precipitation: '分旱雨兩季，雨季暴雨傾盆，旱季陽光燦爛',
    characteristics: '陽光充足，植物常綠，水果豐富，海風習習',
    region: '中國海南、雲南南部、印度、泰國、越南',
    summary: '陽光與雨林的家園，一年四季都是夏天',
  },
  {
    id: 4,
    name: '溫帶大陸性氣候',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+temperate+continental+landscape+watercolor+cartoon+style+vast+grassland+sheep+yurt+blue+sky+white+clouds&image_size=square_hd',
    temperature: '冬冷夏熱，晝夜溫差大，四季分明',
    precipitation: '降水稀少，集中在夏季，氣候乾燥',
    characteristics: '大陸性強，草原遼闊，風沙大，天空特別藍',
    region: '中國西北、蒙古、中亞、西伯利亞南部',
    summary: '遼闊的草原與沙漠，藍天白雲下的壯美天地',
  },
  {
    id: 5,
    name: '高原山地氣候',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+high+mountain+plateau+climate+landscape+watercolor+cartoon+style+bright+sun+thin+air+yaks+tents+snow+peaks&image_size=square_hd',
    temperature: '氣溫低，日夜溫差大，太陽輻射強',
    precipitation: '降水少，空氣稀薄乾燥，多降雪',
    characteristics: '陽光強烈，紫外線強，氧氣稀薄，風大寒冷',
    region: '青藏高原、帕米爾高原、安第斯山脈',
    summary: '離太陽最近的天空，雪山與草原的聖潔世界',
  },
  {
    id: 6,
    name: '寒溫帶氣候',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+cold+temperate+landscape+watercolor+cartoon+style+snow+forest+pine+trees+reindeer+aurora+borealis+blue+tone&image_size=square_hd',
    temperature: '冬季漫長嚴寒，夏季短暫涼爽',
    precipitation: '降水不多，以雪為主，積雪深厚',
    characteristics: '冰雪覆蓋，針葉林茂密，動物多有厚皮毛',
    region: '中國大興安嶺北段、西伯利亞、北歐北部',
    summary: '冰雪精靈的故鄉，銀裝素裹的童話世界',
  },
  {
    id: 7,
    name: '熱帶雨林氣候',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+tropical+rainforest+landscape+watercolor+cartoon+style+dense+jungle+parrot+toucan+waterfall+lianas+bright+green&image_size=square_hd',
    temperature: '全年高溫多雨，溫差極小',
    precipitation: '雨水極多，幾乎每天都會下一場雨',
    characteristics: '植物層層疊疊，動物種類繁多，空氣濕潤',
    region: '亞馬遜平原、剛果盆地、東南亞群島',
    summary: '地球之肺，生物種類最豐富的綠色寶庫',
  },
  {
    id: 8,
    name: '地中海氣候',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+mediterranean+climate+landscape+watercolor+cartoon+style+olive+trees+vineyard+blue+sea+white+houses+lavender&image_size=square_hd',
    temperature: '夏季炎熱乾燥，冬季溫和多雨',
    precipitation: '冬雨夏乾，降水集中在冬季',
    characteristics: '陽光充足，橄欖和葡萄長得好，海風宜人',
    region: '地中海沿岸、加州、智利中部、南非開普敦',
    summary: '陽光、大海與薰衣草，度假勝地的完美氣候',
  },
  {
    id: 9,
    name: '溫帶海洋性氣候',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+temperate+oceanic+climate+landscape+watercolor+cartoon+style+green+meadows+sheep+castle+mist+rainbow+gentle+hills&image_size=square_hd',
    temperature: '冬暖夏涼，全年溫和，溫差很小',
    precipitation: '全年濕潤，細雨綿綿，雲霧多',
    characteristics: '溫和濕潤，牧草豐美，適合畜牧業',
    region: '西歐、英國、愛爾蘭、新西蘭',
    summary: '溫柔如詩的氣候，綠色草原與古堡的童話世界',
  },
  {
    id: 10,
    name: '極地氣候',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+polar+climate+landscape+watercolor+cartoon+style+ice+snow+polar+bear+penguin+igloo+aurora+blue+white&image_size=square_hd',
    temperature: '全年酷寒，冰雪覆蓋，寒風刺骨',
    precipitation: '降水極少，乾燥寒冷，多暴風雪',
    characteristics: '極晝極夜，冰川廣佈，動物耐寒能力極強',
    region: '南極洲、北極圈內、格陵蘭島',
    summary: '冰雪世界的盡頭，勇敢生命的極限挑戰',
  },
]

// 动物数据
const animalData = [
  {
    id: 1,
    name: '大熊貓',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+giant+panda+sitting+eating+bamboo+watercolor+cartoon+style+green+bamboo+forest&image_size=square_hd',
    habitat: '生活在霧氣繚繞的竹林中，喜歡安靜的環境',
    food: '最愛大口大口吃竹子，一天能吃十幾公斤',
    habits: '喜歡睡覺，每天睡十幾個小時，懶洋洋的',
    secret: '剛出生的熊貓寶寶好小好小，只有媽媽的千分之一重',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 2,
    name: '東北虎',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+siberian+tiger+cub+sitting+grass+watercolor+cartoon+style+warm+colors&image_size=square_hd',
    habitat: '生活在東北的森林和山區，擅長隱蔽',
    food: '喜歡吃鹿、野豬等動物，是頂級捕獵者',
    habits: '喜歡獨來獨往，是森林之王，領地意識強',
    secret: '虎紋和人一樣，每隻都不一樣，是獨一無二的身份證',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 3,
    name: '金絲猴',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+golden+snub+nosed+monkey+sitting+on+branch+snow+mountain+background+watercolor+cartoon+style&image_size=square_hd',
    habitat: '棲息在雲霧繚繞的高山森林，喜歡寒冷環境',
    food: '最愛吃嫩葉、嫩芽和野果，是素食主義者',
    habits: '喜歡成群結隊在樹上跳躍，家庭觀念很強',
    secret: '它們沒有鼻孔，朝天鼻下雨時要低頭防止進水',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 4,
    name: '亞洲象',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+asian+elephant+standing+grassland+watercolor+cartoon+style+green+trees+background&image_size=square_hd',
    habitat: '生活在南方的熱帶雨林，喜歡靠近水源',
    food: '喜歡吃樹葉、果實和竹子，每天要吃兩百公斤',
    habits: '喜歡用長鼻子洗澡玩水，還會互相噴水玩',
    secret: '象的記憶力超強，能記住十幾年前走過的路和見過的朋友',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 5,
    name: '丹頂鶴',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+red+crowned+crane+standing+in+water+reeds+watercolor+cartoon+style+blue+sky+background&image_size=square_hd',
    habitat: '棲息在沼澤和濕地，喜歡淺水環境',
    food: '愛吃魚、蝦和水生植物，也吃昆蟲和蝌蚪',
    habits: '喜歡翩翩起舞，姿態優雅，是忠貞的象徵',
    secret: '丹頂鶴的頭頂是鮮紅色的"丹頂"，其實是裸露的皮膚',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 6,
    name: '雪豹',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+snow+leopard+sitting+on+rock+snow+mountain+background+watercolor+cartoon+style+blue+eyes&image_size=square_hd',
    habitat: '生活在高海拔的雪山峭壁，是隱秘的高山幽靈',
    food: '捕獵岩羊、北山羊等，跳躍能力驚人',
    habits: '獨居夜行，行蹤神秘，很少有人能見到它',
    secret: '雪豹的尾巴特別長特別粗，走路時叼在嘴裡當圍巾保暖',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 7,
    name: '藏羚羊',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+tibetan+antelope+running+on+grassland+watercolor+cartoon+style+high+plateau+background&image_size=square_hd',
    habitat: '生活在青藏高原的荒原和草甸，耐寒耐缺氧',
    food: '以禾本科植物和苔草為食，適應高寒環境',
    habits: '喜歡成群遷徙，奔跑速度極快，可達每小時80公里',
    secret: '公藏羚羊有一對漂亮的黑色長角，像把寶劍豎在頭頂',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 8,
    name: '華南虎',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+south+china+tiger+in+bamboo+forest+watercolor+cartoon+style+orange+black+stripes&image_size=square_hd',
    habitat: '曾廣泛分佈於華南山林，現在野外幾乎絕跡',
    food: '捕食野豬、鹿、麂等中小型動物',
    habits: '獨居，擅長游泳和爬樹，是森林中的隱秘獵手',
    secret: '華南虎是中國特有的虎亞種，也被稱為"中國虎"，野外已經很難見到',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 9,
    name: '朱鹮',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+crested+ibis+bird+pink+watercolor+cartoon+style+perched+on+tree+rice+field+background&image_size=square_hd',
    habitat: '棲息在濕地、沼澤和水田附近，喜歡有高大樹木的地方',
    food: '喜歡吃小魚、蝦、蟹、蛙和水生昆蟲',
    habits: '成群活動，飛行姿態優美，被稱為"吉祥之鳥"',
    secret: '朱鹮曾經被認為已經滅絕，直到1981年才在陝西重新發現7只',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 10,
    name: '白鱀豚',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+yangtze+river+dolphin+baiji+watercolor+cartoon+style+swimming+in+river+blue+water&image_size=square_hd',
    habitat: '生活在長江中下游的深水區，被稱為"長江女神"',
    food: '以魚類為食，用回聲定位來捕獵和導航',
    habits: '性格溫順，喜歡成對或小群活動，游泳優雅',
    secret: '白鱀豚是淡水豚類，眼睛很小幾乎看不見，主要靠聲音"看"世界',
    protectionLevel: '國家一級保護動物（功能性滅絕）',
  },
  {
    id: 11,
    name: '揚子鱷',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+chinese+alligator+watercolor+cartoon+style+swimming+in+pond+lotus+leaves+small+reptile&image_size=square_hd',
    habitat: '生活在長江下游的池塘、沼澤和河流中，會挖洞穴居',
    food: '吃魚、蝦、蛙、螺和水鳥，也吃植物根莖',
    habits: '冬天會冬眠，夏天喜歡曬太陽，性格比較溫順',
    secret: '揚子鱷是世界上體型最小的鱷魚之一，但已經在地球上生活兩億多年了',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 12,
    name: '麋鹿',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+milu+deer+pere+david+watercolor+cartoon+style+standing+in+marsh+antlers+branched&image_size=square_hd',
    habitat: '生活在沼澤和濕地，喜歡在水邊活動',
    food: '以草、樹葉、嫩枝和水生植物為食',
    habits: '喜歡成群活動，善於游泳，跑起來姿態優雅',
    secret: '麋鹿又叫"四不像"，角像鹿、臉像馬、蹄像牛、尾像驢',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 13,
    name: '中華鱘',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+chinese+sturgeon+fish+watercolor+cartoon+style+swimming+in+river+long+nose+ancient+fish&image_size=square_hd',
    habitat: '生活在長江及其支流，是洄游魚類',
    food: '以底棲動物和小魚為食，用長吻在河底覓食',
    habits: '壽命很長，可以活幾十年，體型龐大',
    secret: '中華鱘是"活化石"，已在地球上生活1.4億年，比恐龍還古老',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 14,
    name: '長臂猿',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+gibbon+ape+watercolor+cartoon+style+swinging+on+tree+vines+long+arms+tropical+forest&image_size=square_hd',
    habitat: '生活在熱帶和亞熱帶的常綠闊葉林中，從不下地',
    food: '以果實、嫩葉和昆蟲為食，是樹冠層的雜食者',
    habits: '手臂特別長，擅長在樹間蕩秋千，叫聲悠揚嘹亮',
    secret: '長臂猿沒有尾巴，是所有猿類中手臂最長的，可以輕鬆盪過三米遠的樹枝',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 15,
    name: '綠孔雀',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+green+peacock+watercolor+cartoon+style+beautiful+tail+feathers+display+jungle+background&image_size=square_hd',
    habitat: '生活在熱帶雨林和季風常綠闊葉林中',
    food: '吃植物果實、種子、嫩芽，也吃昆蟲和小動物',
    habits: '雄孔雀會展開美麗的尾屏求偶，動作優雅高貴',
    secret: '綠孔雀是中國本土孔雀，比藍孔雀更珍稀，脖子上的羽毛是鱗片狀的',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 16,
    name: '小熊貓',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+red+panda+watercolor+cartoon+style+sitting+on+tree+branch+fluffy+tail+bamboo+forest&image_size=square_hd',
    habitat: '生活在喜馬拉雅山東部的高山森林，喜歡竹林',
    food: '愛吃竹葉和野果，也吃鳥蛋和小昆蟲',
    habits: '喜歡獨居，性格溫順，動作靈活，喜歡爬樹',
    secret: '小熊貓又叫"火狐"，遇到危險時會站立舉起前爪，看起來像在投降',
    protectionLevel: '國家二級保護動物',
  },
  {
    id: 17,
    name: '紫貂',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+sable+marten+watercolor+cartoon+style+sitting+on+tree+branch+fluffy+fur+winter+forest&image_size=square_hd',
    habitat: '生活在東北和西伯利亞的針葉林和混交林中',
    food: '捕食鼠類、鳥類、野兔，也吃漿果和松籽',
    habits: '動作敏捷，擅長爬樹和游泳，皮毛極其珍貴',
    secret: '紫貂的皮毛又軟又暖，是"東北三寶"之一，冬天換上厚厚的冬毛',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 18,
    name: '普氏野馬',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+przewalski+horse+watercolor+cartoon+style+standing+on+grassland+brown+coat+short+mane+wild&image_size=square_hd',
    habitat: '生活在新疆和蒙古的草原與荒漠地帶',
    food: '以禾本科草類、灌木和苔草為食，耐渴能力強',
    habits: '喜歡群居，由一匹強壯的公馬帶領家族活動',
    secret: '普氏野馬是地球上唯一倖存的真正野生馬，其他馬都是被人類馴化過的',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 19,
    name: '野駱駝',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+wild+bactrian+camel+watercolor+cartoon+style+standing+in+desert+two+humps+sand+dunes&image_size=square_hd',
    habitat: '生活在新疆和內蒙古的荒漠戈壁中，極度耐旱',
    food: '以梭梭、駱駝刺等耐旱植物為食，能喝鹹水',
    habits: '善於長途跋涉，可以幾天不喝水，耐熱耐寒',
    secret: '野駱駝比家駱駝更稀少，能喝極鹹的地下水，這是其他動物做不到的',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 20,
    name: '大鯢',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+chinese+giant+salamander+watercolor+cartoon+style+swimming+in+stream+rocks+moss+big+flat+body&image_size=square_hd',
    habitat: '生活在山區清澈的溪流中，對水質要求很高',
    food: '捕食魚、蝦、蟹、螺和昆蟲，是夜行獵手',
    habits: '白天躲在石縫裡，晚上出來覓食，叫聲像嬰兒哭',
    secret: '大鯢又叫"娃娃魚"，是世界上最大的兩棲動物，可以長到一米多長',
    protectionLevel: '國家二級保護動物',
  },
  {
    id: 21,
    name: '褐馬雞',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+brown+eared+pheasant+watercolor+cartoon+style+white+ear+feathers+red+crown+mountain+forest&image_size=square_hd',
    habitat: '生活在華北海拔1500-2500米的針闊混交林中',
    food: '雜食性，吃植物嫩芽果實，也捕食昆蟲',
    habits: '善跑不善飛，護巢本能極強，繁殖期會展示尾羽爭鬥',
    secret: '褐馬雞是中國特有鳥類，山西省省鳥，頭頂有鮮紅色肉冠，耳後拖着雪白耳羽',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 22,
    name: '黑頸鶴',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+black+necked+crane+watercolor+cartoon+style+standing+in+wetland+black+head+white+body+high+plateau&image_size=square_hd',
    habitat: '生活在青藏高原的高原沼澤和草甸，海拔3000米以上',
    food: '以植物根莖、昆蟲、蛙類和魚類為食',
    habits: '候鳥，每年遷徙數千公里，飛行時排成人字形',
    secret: '黑頸鶴是世界上唯一在高原繁殖的鶴類，被藏族同胞視為吉祥的象徵',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 23,
    name: '白唇鹿',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+white+lipped+deer+watercolor+cartoon+style+standing+on+grassland+white+nose+large+antlers+mountain&image_size=square_hd',
    habitat: '生活在青藏高原及周邊高山草甸和森林',
    food: '以草本植物、灌木嫩枝和苔蘚為食',
    habits: '善於攀爬陡坡，成群活動，冬季會向低海拔遷移',
    secret: '白唇鹿的嘴巴周圍有一圈純白色的毛，就像塗了白色口紅一樣',
    protectionLevel: '國家一級保護動物',
  },
  {
    id: 24,
    name: '海南長臂猿',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute+hainan+gibbon+watercolor+cartoon+style+swinging+on+tree+tropical+rainforest+black+body+white+cheek&image_size=square_hd',
    habitat: '生活在海南島的熱帶雨林中，只住在樹冠層',
    food: '以成熟果實、嫩葉和昆蟲為食',
    habits: '清晨會大聲鳴叫宣示領地，叫聲悠揚悅耳',
    secret: '海南長臂猿是全球最瀕危的靈長類動物，數量僅剩30多隻，比大熊貓還稀少',
    protectionLevel: '國家一級保護動物',
  },
]

async function seedCollection(collectionName, data) {
  const collection = db.collection(collectionName)
  const batchSize = 100
  let added = 0
  let updated = 0

  // 先清空集合（可選：如果想保留歷史數據，可以註釋掉這段）
  const oldData = await collection.limit(1000).get()
  if (oldData.data.length > 0) {
    const removeTasks = oldData.data.map((item) =>
      collection.doc(item._id).remove()
    )
    await Promise.all(removeTasks)
  }

  // 分批寫入
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    const addTasks = batch.map((item) =>
      collection.add({
        data: {
          ...item,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
        },
      })
    )
    const results = await Promise.all(addTasks)
    added += results.length
  }

  return { added, updated }
}

exports.main = async (event, context) => {
  try {
    const { type = 'all' } = event
    const results = {}

    if (type === 'all' || type === 'terrain') {
      results.terrain = await seedCollection('terrain', terrainData)
    }
    if (type === 'all' || type === 'climate') {
      results.climate = await seedCollection('climate', climateData)
    }
    if (type === 'all' || type === 'animal') {
      results.animal = await seedCollection('animal', animalData)
    }

    return {
      errCode: 0,
      errMsg: 'success',
      data: results,
    }
  } catch (err) {
    return {
      errCode: -1,
      errMsg: err.message,
      data: null,
    }
  }
}
