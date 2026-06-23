import { Router, type Request, type Response } from 'express'

const router = Router()

const recipes = [
  {
    id: 'r001',
    name: '清蒸鲈鱼',
    description: '鱼肉鲜嫩，富含优质蛋白质，低脂肪易消化，适合高血压和胃病患者食用',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=400&fit=crop',
    suitableDiseases: ['hypertension', 'gastric', 'diabetes', 'none'],
    suitableAges: '50岁以上',
    ingredients: [
      { name: '鲈鱼', amount: '500克' },
      { name: '生姜', amount: '3片' },
      { name: '葱', amount: '2根' },
      { name: '蒸鱼豉油', amount: '2勺' },
      { name: '料酒', amount: '1勺' },
    ],
    steps: [
      { step: 1, description: '鲈鱼处理干净，两面划几刀，用料酒腌制10分钟' },
      { step: 2, description: '盘底铺上姜片和葱段，放上鲈鱼' },
      { step: 3, description: '水开后上锅蒸8分钟，关火焖2分钟' },
      { step: 4, description: '倒掉蒸出的汤汁，淋上蒸鱼豉油，撒上葱花即可' },
    ],
    nutritionTags: ['高蛋白', '低脂肪', '低盐', '易消化'],
    cookTime: '25分钟',
    difficulty: 'easy',
  },
  {
    id: 'r002',
    name: '山药排骨汤',
    description: '健脾养胃，补中益气，汤色清亮不油腻，适合胃病患者和体弱者',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
    suitableDiseases: ['gastric', 'none'],
    suitableAges: '55岁以上',
    ingredients: [
      { name: '猪排骨', amount: '300克' },
      { name: '铁棍山药', amount: '200克' },
      { name: '枸杞', amount: '10克' },
      { name: '生姜', amount: '2片' },
      { name: '盐', amount: '适量' },
    ],
    steps: [
      { step: 1, description: '排骨焯水后洗净，山药去皮切滚刀块' },
      { step: 2, description: '砂锅中放入排骨、姜片，加水没过食材' },
      { step: 3, description: '大火烧开后转小火炖40分钟' },
      { step: 4, description: '加入山药继续炖20分钟，出锅前加枸杞和盐调味' },
    ],
    nutritionTags: ['养胃', '补气', '补钙', '温和'],
    cookTime: '70分钟',
    difficulty: 'medium',
  },
  {
    id: 'r003',
    name: '苦瓜炒鸡蛋',
    description: '苦瓜清热解毒，有助于控制血糖，是糖尿病患者的理想菜肴',
    image: 'https://images.unsplash.com/photo-1625944525533-473f1b3d9684?w=600&h=400&fit=crop',
    suitableDiseases: ['diabetes', 'hypertension', 'none'],
    suitableAges: '50岁以上',
    ingredients: [
      { name: '苦瓜', amount: '2根' },
      { name: '鸡蛋', amount: '3个' },
      { name: '蒜末', amount: '适量' },
      { name: '盐', amount: '适量' },
      { name: '橄榄油', amount: '1勺' },
    ],
    steps: [
      { step: 1, description: '苦瓜去瓤切薄片，用盐腌制10分钟后挤去水分' },
      { step: 2, description: '鸡蛋打散，加少许盐搅匀' },
      { step: 3, description: '锅中倒油，先炒鸡蛋至凝固盛出' },
      { step: 4, description: '再倒油爆香蒜末，下苦瓜翻炒2分钟，加入鸡蛋炒匀即可' },
    ],
    nutritionTags: ['控糖', '清热', '低热量', '高纤维'],
    cookTime: '20分钟',
    difficulty: 'easy',
  },
  {
    id: 'r004',
    name: '芹菜炒香干',
    description: '芹菜含丰富膳食纤维和钾元素，有助于降低血压，清爽可口',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
    suitableDiseases: ['hypertension', 'diabetes', 'none'],
    suitableAges: '50岁以上',
    ingredients: [
      { name: '芹菜', amount: '300克' },
      { name: '香干', amount: '150克' },
      { name: '红椒', amount: '半个' },
      { name: '蒜末', amount: '适量' },
      { name: '生抽', amount: '1勺' },
    ],
    steps: [
      { step: 1, description: '芹菜去叶切段，香干切条，红椒切丝' },
      { step: 2, description: '锅中烧水焯烫芹菜30秒，捞出过凉水' },
      { step: 3, description: '锅中倒油爆香蒜末，下香干翻炒1分钟' },
      { step: 4, description: '加入芹菜和红椒，加生抽翻炒均匀即可' },
    ],
    nutritionTags: ['降压', '高纤维', '低脂肪', '清爽'],
    cookTime: '15分钟',
    difficulty: 'easy',
  },
  {
    id: 'r005',
    name: '南瓜小米粥',
    description: '软糯香甜，健脾养胃，易消化吸收，适合早餐或晚餐食用',
    image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&h=400&fit=crop',
    suitableDiseases: ['gastric', 'diabetes', 'none'],
    suitableAges: '50岁以上',
    ingredients: [
      { name: '小米', amount: '100克' },
      { name: '老南瓜', amount: '200克' },
      { name: '红枣', amount: '5颗' },
      { name: '枸杞', amount: '5克' },
    ],
    steps: [
      { step: 1, description: '小米淘洗干净，南瓜去皮切块' },
      { step: 2, description: '锅中加水烧开，放入小米和红枣' },
      { step: 3, description: '大火烧开后转小火煮20分钟' },
      { step: 4, description: '加入南瓜继续煮15分钟至粥浓稠，撒上枸杞即可' },
    ],
    nutritionTags: ['养胃', '易消化', '补气养血', '温和'],
    cookTime: '40分钟',
    difficulty: 'easy',
  },
  {
    id: 'r006',
    name: '木耳炒西兰花',
    description: '西兰花营养丰富，木耳清肠排毒，两者搭配适合高血压和糖尿病患者',
    image: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&h=400&fit=crop',
    suitableDiseases: ['hypertension', 'diabetes', 'heart_disease', 'none'],
    suitableAges: '50岁以上',
    ingredients: [
      { name: '西兰花', amount: '300克' },
      { name: '黑木耳', amount: '30克' },
      { name: '蒜末', amount: '适量' },
      { name: '盐', amount: '适量' },
      { name: '蚝油', amount: '半勺' },
    ],
    steps: [
      { step: 1, description: '黑木耳提前泡发，西兰花切小朵' },
      { step: 2, description: '锅中烧水焯烫西兰花2分钟，木耳焯水1分钟' },
      { step: 3, description: '锅中倒油爆香蒜末，下木耳翻炒' },
      { step: 4, description: '加入西兰花，加蚝油和盐翻炒均匀即可' },
    ],
    nutritionTags: ['清肠', '高纤维', '抗氧化', '低热量'],
    cookTime: '20分钟',
    difficulty: 'easy',
  },
  {
    id: 'r007',
    name: '西红柿炖牛腩',
    description: '牛肉补气血，西红柿富含维生素，汤鲜味美，适合体虚的中老年人',
    image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&h=400&fit=crop',
    suitableDiseases: ['none', 'gastric'],
    suitableAges: '55岁以上',
    ingredients: [
      { name: '牛腩', amount: '400克' },
      { name: '西红柿', amount: '3个' },
      { name: '洋葱', amount: '半个' },
      { name: '生姜', amount: '3片' },
      { name: '番茄酱', amount: '1勺' },
    ],
    steps: [
      { step: 1, description: '牛腩切块焯水，西红柿去皮切块' },
      { step: 2, description: '锅中倒油，炒香洋葱和姜片，加入西红柿炒出汁' },
      { step: 3, description: '加入牛腩翻炒，加番茄酱和足量热水' },
      { step: 4, description: '大火烧开后转小火炖1.5小时至牛腩软烂即可' },
    ],
    nutritionTags: ['补气血', '高蛋白', '富含维生素', '滋补'],
    cookTime: '120分钟',
    difficulty: 'medium',
  },
  {
    id: 'r008',
    name: '燕麦紫薯粥',
    description: '燕麦富含膳食纤维，紫薯低糖高纤维，有助于控制血糖和血脂',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop',
    suitableDiseases: ['diabetes', 'hypertension', 'heart_disease', 'none'],
    suitableAges: '50岁以上',
    ingredients: [
      { name: '燕麦片', amount: '80克' },
      { name: '紫薯', amount: '150克' },
      { name: '大米', amount: '50克' },
      { name: '蜂蜜', amount: '适量（可选）' },
    ],
    steps: [
      { step: 1, description: '紫薯去皮切小块，大米淘洗干净' },
      { step: 2, description: '锅中加水，放入大米和紫薯' },
      { step: 3, description: '大火烧开后转小火煮25分钟' },
      { step: 4, description: '加入燕麦片继续煮5分钟，根据口味可加少许蜂蜜' },
    ],
    nutritionTags: ['控糖', '控血脂', '高纤维', '低GI'],
    cookTime: '35分钟',
    difficulty: 'easy',
  },
  {
    id: 'r009',
    name: '菠菜豆腐汤',
    description: '清淡养胃，富含钙质和铁质，易于消化吸收，适合胃病患者',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=400&fit=crop',
    suitableDiseases: ['gastric', 'hypertension', 'none'],
    suitableAges: '50岁以上',
    ingredients: [
      { name: '嫩豆腐', amount: '200克' },
      { name: '菠菜', amount: '200克' },
      { name: '虾皮', amount: '10克' },
      { name: '盐', amount: '适量' },
      { name: '香油', amount: '少许' },
    ],
    steps: [
      { step: 1, description: '菠菜洗净焯水去除草酸，切段备用' },
      { step: 2, description: '豆腐切小块，用淡盐水浸泡5分钟' },
      { step: 3, description: '锅中加水烧开，放入豆腐和虾皮煮5分钟' },
      { step: 4, description: '加入菠菜，加盐调味，淋上香油即可' },
    ],
    nutritionTags: ['养胃', '补钙', '补铁', '清淡'],
    cookTime: '15分钟',
    difficulty: 'easy',
  },
]

const exercises = [
  {
    id: 'e001',
    name: '八段锦',
    description: '八段锦是中国传统养生功法，动作柔和缓慢，适合各年龄段人群练习，尤其适合中老年人强身健体、调理气血。',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop',
    videoUrl: 'https://example.com/videos/baduanjin.mp4',
    duration: '约15分钟',
    moves: [
      { name: '第一式：两手托天理三焦', description: '双脚自然站立，双手十指交叉于腹前，掌心向上，缓缓上举至头顶，掌心翻转向天，抬头仰望，稍作停顿后缓缓放下。', tip: '上举时配合吸气，放下时配合呼气，动作要缓慢连贯。' },
      { name: '第二式：左右开弓似射雕', description: '左脚向左开步，双手在胸前交叉，左手向左推出，右手向右拉回，呈拉弓射箭姿势，左右交替练习。', tip: '开步与肩同宽，拉弓时意念集中在指尖，眼睛看向食指。' },
    ],
    benefits: ['疏通经络，调和气血', '增强心肺功能', '改善消化系统', '强健筋骨，预防骨质疏松', '调节情志，缓解焦虑'],
    suitableFor: '50岁以上中老年人，慢性病患者，久坐人群',
  },
  {
    id: 'e002',
    name: '简化24式太极拳',
    description: '简化太极拳是在杨式太极拳基础上改编的普及版本，动作简单易学，节奏舒缓，是中老年人最喜爱的运动之一。',
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop',
    videoUrl: 'https://example.com/videos/taiji24.mp4',
    duration: '约20分钟',
    moves: [
      { name: '起势', description: '双脚自然开立与肩同宽，双臂缓缓前平举，与肩同高，然后屈膝下沉，双手下按至腹前。', tip: '全身放松，呼吸自然，意念集中在丹田。' },
      { name: '左右野马分鬃', description: '身体微右转，右手收至腰间，左手向前推出，上步成弓步，双手如抱球般前后分开，左右交替。', tip: '转体时以腰为轴，手脚配合要协调，重心转换要平稳。' },
    ],
    benefits: ['改善心肺功能，提高耐力', '增强平衡能力，预防跌倒', '舒缓紧张情绪，改善睡眠', '促进血液循环', '增强关节灵活性'],
    suitableFor: '55岁以上中老年人，高血压、心脏病患者（需遵医嘱）',
  },
  {
    id: 'e003',
    name: '五禽戏',
    description: '五禽戏是华佗创编的养生功法，模仿虎、鹿、熊、猿、鸟五种动物的神态和动作，舒展筋骨，调理脏腑。',
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop',
    videoUrl: 'https://example.com/videos/wuqinxi.mp4',
    duration: '约18分钟',
    moves: [
      { name: '虎戏', description: '模仿老虎的威猛神态，双手如爪状，一扑一按，配合腰部扭动，动作刚劲有力。', tip: '虎戏主肝，能疏肝理气，练习时目光要炯炯有神。' },
      { name: '鹿戏', description: '模仿鹿的轻盈体态，双手如鹿角，做引颈探看、转体回望的动作，动作舒展优美。', tip: '鹿戏主肾，能补肾益精，练习时动作要轻灵活泼。' },
    ],
    benefits: ['调理五脏，平衡阴阳', '增强体质，提高免疫力', '改善神经系统功能', '促进新陈代谢', '舒缓身心，延年益寿'],
    suitableFor: '50岁以上中老年人，体质较弱者',
  },
  {
    id: 'e004',
    name: '养生保健操',
    description: '专为中老年人设计的养生保健操，动作简单安全，活动全身各个关节，适合日常在家练习。',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&h=400&fit=crop',
    videoUrl: 'https://example.com/videos/baojiancao.mp4',
    duration: '约10分钟',
    moves: [
      { name: '颈部运动', description: '坐直或站立，头缓缓向左右各转动5次，再前后各点头5次，然后顺时针、逆时针各画圈5次。', tip: '动作要慢，不可用力过猛，头晕时立即停止。' },
      { name: '肩部运动', description: '双手自然下垂，双肩向前绕环10次，再向后绕环10次，然后做耸肩动作10次。', tip: '绕环时幅度尽量大，让肩关节充分活动。' },
    ],
    benefits: ['活动全身关节，预防关节僵硬', '促进血液循环', '缓解肌肉疲劳', '预防颈椎病和腰椎病', '简单易学，适合日常保健'],
    suitableFor: '所有中老年人，尤其适合久坐或活动不便者',
  },
  {
    id: 'e005',
    name: '散步健身法',
    description: '散步是最安全、最简单的运动方式，科学的散步方法能起到很好的健身效果，适合所有中老年人。',
    thumbnail: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop',
    videoUrl: 'https://example.com/videos/sanbu.mp4',
    duration: '30-45分钟',
    moves: [
      { name: '准备活动', description: '散步前先做5分钟的热身，活动手腕、脚踝、膝关节，做几个深呼吸。', tip: '热身能预防运动损伤，不可省略。' },
      { name: '正确姿势', description: '抬头挺胸，目视前方，双臂自然摆动，步伐适中，脚跟先着地再过渡到前脚掌。', tip: '保持身体中正，不要弯腰驼背，步幅约等于身高的一半。' },
    ],
    benefits: ['增强心肺功能', '促进消化吸收', '改善睡眠质量', '降低血压和血脂', '预防骨质疏松'],
    suitableFor: '所有中老年人，尤其适合慢性病患者康复期',
  },
]

const medicines = [
  {
    id: 'm001',
    name: '氨氯地平片',
    dosage: '每次1片（5mg）',
    times: ['07:00'],
    enabled: true,
    takenToday: [true],
    instructions: '每日一次，早餐后服用，用于治疗高血压。服药期间注意监测血压，避免突然停药。',
    sideEffects: ['头晕', '面部潮红', '脚踝水肿'],
  },
  {
    id: 'm002',
    name: '二甲双胍缓释片',
    dosage: '每次1片（0.5g）',
    times: ['08:00', '20:00'],
    enabled: true,
    takenToday: [true, false],
    instructions: '每日两次，餐中或餐后立即服用，用于控制2型糖尿病血糖。服药期间定期监测血糖和肾功能。',
    sideEffects: ['恶心', '腹泻', '胃部不适'],
  },
  {
    id: 'm003',
    name: '阿司匹林肠溶片',
    dosage: '每次1片（100mg）',
    times: ['07:30'],
    enabled: true,
    takenToday: [true],
    instructions: '每日一次，早餐前空腹服用，用于预防心脑血管疾病。有胃溃疡或出血倾向者慎用。',
    sideEffects: ['胃部不适', '牙龈出血', '黑便'],
  },
  {
    id: 'm004',
    name: '阿托伐他汀钙片',
    dosage: '每次1片（20mg）',
    times: ['21:00'],
    enabled: true,
    takenToday: [false],
    instructions: '每日一次，睡前服用，用于调节血脂、降低胆固醇。服药期间定期检查肝功能和肌酸激酶。',
    sideEffects: ['肌肉酸痛', '乏力', '肝功能异常'],
  },
  {
    id: 'm005',
    name: '奥美拉唑肠溶胶囊',
    dosage: '每次1粒（20mg）',
    times: ['07:00'],
    enabled: false,
    takenToday: [false],
    instructions: '每日一次，早餐前30分钟服用，用于治疗胃炎、胃溃疡。一般疗程4-8周，不可长期连续服用。',
    sideEffects: ['头痛', '便秘', '恶心'],
  },
  {
    id: 'm006',
    name: '复方丹参滴丸',
    dosage: '每次10丸',
    times: ['08:00', '14:00', '20:00'],
    enabled: true,
    takenToday: [true, true, false],
    instructions: '每日三次，舌下含服或温水送服，用于活血化瘀、理气止痛，缓解胸闷心绞痛。',
    sideEffects: ['胃肠道不适', '皮疹'],
  },
  {
    id: 'm007',
    name: '钙尔奇D钙片',
    dosage: '每次1片',
    times: ['20:00'],
    enabled: true,
    takenToday: [false],
    instructions: '每日一次，晚餐后服用，用于补充钙质和维生素D，预防骨质疏松。',
    sideEffects: ['便秘', '腹胀', '高钙血症（长期过量）'],
  },
  {
    id: 'm008',
    name: '甲钴胺片',
    dosage: '每次1片（0.5mg）',
    times: ['08:00', '14:00', '20:00'],
    enabled: true,
    takenToday: [true, false, false],
    instructions: '每日三次，饭后服用，用于营养神经，改善手脚麻木等周围神经病变症状。',
    sideEffects: ['食欲不振', '恶心', '腹泻'],
  },
]

router.get('/recipes', (req: Request, res: Response): void => {
  const { disease } = req.query

  let filteredRecipes = recipes

  if (disease && disease !== 'none') {
    filteredRecipes = recipes.filter((r) =>
      r.suitableDiseases.includes(disease as string)
    )
  }

  res.json({
    success: true,
    message: '获取食谱列表成功',
    data: filteredRecipes,
  })
})

router.get('/exercises', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: '获取运动列表成功',
    data: exercises,
  })
})

router.get('/medicines', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: '获取用药提醒成功',
    data: medicines,
  })
})

export default router
