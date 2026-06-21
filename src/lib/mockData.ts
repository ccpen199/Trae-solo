import {
  ExpertLevel,
  OrderStatus,
  Category,
  DisputeStatus,
  AuthenticityLevel,
  UserRole,
} from '../../shared/types';
import type {
  Expert,
  KnowledgeArticle,
  CommunityQuestion,
  CommunityAnswer,
  Artwork,
  AppraisalOrder,
  Certificate,
  Dispute,
  User,
  AIScreenResult,
  ValuationResult,
} from '../../shared/types';

export const mockUsers: User[] = [
  {
    id: 'user_001',
    phone: '13800138001',
    nickname: '藏家小王',
    avatar: '',
    role: UserRole.USER,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'user_002',
    phone: '13800138002',
    nickname: '古韵堂主',
    avatar: '',
    role: UserRole.USER,
    createdAt: '2024-02-20T08:15:00Z',
  },
  {
    id: 'user_003',
    phone: '13800138003',
    nickname: '青瓷爱好者',
    avatar: '',
    role: UserRole.USER,
    createdAt: '2024-03-05T14:20:00Z',
  },
];

export const mockExperts: Expert[] = [
  {
    id: 'expert_001',
    userId: 'exp_user_001',
    name: '张明德',
    avatar: '',
    level: ExpertLevel.NATIONAL,
    categories: [Category.CERAMIC, Category.JADE],
    rating: 4.9,
    responseTime: 8,
    orderCount: 1280,
    basePrice: 800,
    status: 'approved',
  },
  {
    id: 'expert_002',
    userId: 'exp_user_002',
    name: '李雅琴',
    avatar: '',
    level: ExpertLevel.NATIONAL,
    categories: [Category.CALLIGRAPHY_PAINTING, Category.SEAL],
    rating: 4.95,
    responseTime: 12,
    orderCount: 956,
    basePrice: 1000,
    status: 'approved',
  },
  {
    id: 'expert_003',
    userId: 'exp_user_003',
    name: '王建国',
    avatar: '',
    level: ExpertLevel.PROVINCIAL,
    categories: [Category.BRONZE, Category.COIN],
    rating: 4.7,
    responseTime: 15,
    orderCount: 620,
    basePrice: 500,
    status: 'approved',
  },
  {
    id: 'expert_004',
    userId: 'exp_user_004',
    name: '陈美玲',
    avatar: '',
    level: ExpertLevel.PROVINCIAL,
    categories: [Category.TEXTILE, Category.LACQUER],
    rating: 4.8,
    responseTime: 10,
    orderCount: 480,
    basePrice: 450,
    status: 'approved',
  },
  {
    id: 'expert_005',
    userId: 'exp_user_005',
    name: '刘长根',
    avatar: '',
    level: ExpertLevel.SENIOR,
    categories: [Category.WOOD, Category.STATIONERY, Category.ZISHA],
    rating: 4.6,
    responseTime: 20,
    orderCount: 350,
    basePrice: 300,
    status: 'approved',
  },
  {
    id: 'expert_006',
    userId: 'exp_user_006',
    name: '赵文博',
    avatar: '',
    level: ExpertLevel.SENIOR,
    categories: [Category.MISCELLANEOUS, Category.COIN],
    rating: 4.5,
    responseTime: 25,
    orderCount: 220,
    basePrice: 200,
    status: 'approved',
  },
];

export const mockKnowledgeArticles: KnowledgeArticle[] = [
  {
    id: 'know_001',
    title: '宋代官窑瓷器的鉴别要点',
    category: Category.CERAMIC,
    era: '宋代',
    tags: ['官窑', '青瓷', '鉴别', '宋代五大名窑'],
    author: '张明德',
    expertId: 'expert_001',
    content:
      '宋代官窑瓷器是中国古代陶瓷艺术的巅峰之作。鉴别要点主要包括：\n\n1. 釉色：官窑青瓷以天青色为上，釉面莹润如玉，有"雨过天青云破处"之美誉。\n\n2. 开片：官窑瓷器开片自然，"金丝铁线"是其典型特征。\n\n3. 胎质：官窑胎质细腻，呈紫黑色，有"紫口铁足"之称。\n\n4. 器型：多仿古青铜器造型，端庄典雅。\n\n5. 款识：宋官窑款识较少，后世仿品需特别注意。',
    createdAt: '2024-01-10T09:00:00Z',
  },
  {
    id: 'know_002',
    title: '明清玉器的时代特征与辨伪',
    category: Category.JADE,
    era: '明清',
    tags: ['和田玉', '子冈牌', '乾隆工', '辨伪'],
    author: '张明德',
    expertId: 'expert_001',
    content:
      '明清时期是中国玉器发展的鼎盛时期。\n\n明代玉器特点：\n- 刀法粗犷有力，有"粗大明"之说\n- 玉质多为和田青玉、白玉\n- 常见题材：吉祥图案、文人雅趣\n\n清代玉器特点：\n- "乾隆工"精雕细琢，达到极致\n- 玉质纯净，白玉为贵\n- 器型丰富，仿古创新并存\n\n辨伪要点：包浆、刀法、玉质、沁色四个方面综合判断。',
    createdAt: '2024-01-25T14:30:00Z',
  },
  {
    id: 'know_003',
    title: '齐白石书画鉴定方法初探',
    category: Category.CALLIGRAPHY_PAINTING,
    era: '近现代',
    tags: ['齐白石', '书画鉴定', '虾蟹图', '印章'],
    author: '李雅琴',
    expertId: 'expert_002',
    content:
      '齐白石是近现代最具影响力的画家之一，其作品市场流通量大，仿品众多。\n\n鉴定要点：\n\n1. 笔墨：齐白石笔墨雄浑厚重，笔力过人，仿品多显单薄。\n\n2. 虾蟹：齐白石画虾堪称一绝，虾体透明灵动，每一笔都有讲究。\n\n3. 印章：齐白石篆刻自成一派，印章需与书画风格统一。\n\n4. 落款：书法风格独特，"齐璜"二字写法有固定特征。\n\n5. 流传：注意作品的来源和著录情况。',
    createdAt: '2024-02-05T11:20:00Z',
  },
  {
    id: 'know_004',
    title: '青铜器锈色辨伪详解',
    category: Category.BRONZE,
    era: '商周秦汉',
    tags: ['青铜器', '红斑绿锈', '辨伪', '出土品'],
    author: '王建国',
    expertId: 'expert_003',
    content:
      '青铜器锈色是鉴定的重要依据。\n\n真锈特征：\n- 层次分明，由表及里：浮锈、硬锈、入骨锈\n- 锈色自然过渡，无人工痕迹\n- 锈质坚硬，不易脱落\n\n常见伪锈：\n- 化学腐蚀锈：颜色单一，刺鼻气味\n- 胶粘锈：疏松易脱落\n- 漆皮锈：表面光滑，无层次感\n\n建议：结合器型、纹饰、铭文等多方面综合判断，不要仅凭锈色下定论。',
    createdAt: '2024-02-18T16:45:00Z',
  },
  {
    id: 'know_005',
    title: '古钱币收藏入门指南',
    category: Category.COIN,
    era: '各朝代',
    tags: ['古钱币', '开元通宝', '五帝钱', '收藏入门'],
    author: '王建国',
    expertId: 'expert_003',
    content:
      '古钱币收藏门槛较低，但学问很深。\n\n入门建议：\n\n1. 从常见品开始：如北宋小平钱、开元通宝等，存世量大，价格适中。\n\n2. 学习钱谱：熟悉各朝代钱币的基本特征。\n\n3. 辨别真伪：注意文字风格、铜质、形制、包浆。\n\n4. 品相为王：好品相的钱币价值远高于普通品。\n\n5. 警惕热门品种：高价值钱币仿品多，新手谨慎入手。',
    createdAt: '2024-03-01T10:10:00Z',
  },
  {
    id: 'know_006',
    title: '明清织绣品的保存与鉴赏',
    category: Category.TEXTILE,
    era: '明清',
    tags: ['云锦', '缂丝', '刺绣', '宫廷织品'],
    author: '陈美玲',
    expertId: 'expert_004',
    content:
      '明清织绣品是中国传统工艺的瑰宝。\n\n主要品类：\n- 云锦：南京特产，皇家专用，华丽非凡\n- 缂丝："通经断纬"工艺，有"织中之圣"美誉\n- 苏绣：四大名绣之首，针法细腻\n- 宫廷服饰：龙袍、补子等，等级森严\n\n保存要点：\n- 避光、防潮、恒温\n- 避免折叠，建议卷轴存放\n- 定期检查，防止虫蛀',
    createdAt: '2024-03-15T13:30:00Z',
  },
  {
    id: 'know_007',
    title: '紫砂壶历代名家与风格演变',
    category: Category.ZISHA,
    era: '明清至今',
    tags: ['紫砂壶', '供春', '时大彬', '顾景舟'],
    author: '刘长根',
    expertId: 'expert_005',
    content:
      '紫砂壶自明代供春以来，名家辈出。\n\n明代：\n- 供春：紫砂鼻祖，树瘿壶闻名\n- 时大彬：明代大家，砂壶典范\n\n清代：\n- 陈鸣远：花货宗师\n- 杨彭年：与陈曼生合作"曼生十八式"\n\n近现代：\n- 顾景舟：一代宗师，壶艺泰斗\n- 蒋蓉：花货大家\n\n鉴定要点：泥料、工艺、款式、包浆、气韵五要素。',
    createdAt: '2024-03-28T09:50:00Z',
  },
  {
    id: 'know_008',
    title: '文房四宝之端砚鉴赏',
    category: Category.STATIONERY,
    era: '各朝代',
    tags: ['端砚', '砚台', '文房', '石品'],
    author: '刘长根',
    expertId: 'expert_005',
    content:
      '端砚为四大名砚之首，产自广东肇庆端溪。\n\n名贵石品：\n- 青花：砚石中微尘般的细点，上品标志\n- 石眼：天然形成的圆形石核，鸲鹆眼最贵\n- 火捺：似被火灼过的斑纹\n- 金线：金黄色线条\n- 冰纹：白色如冰裂的纹理\n\n收藏价值：以老坑、麻子坑、坑仔岩三大名坑出产者为贵，石品丰富、雕工精者价值更高。',
    createdAt: '2024-04-10T15:00:00Z',
  },
];

export const mockCommunityAnswers: CommunityAnswer[] = [
  {
    id: 'ans_001',
    questionId: 'q_001',
    content:
      '从照片看，这件青花发色沉稳，有铁锈斑特征，底足修足规整，初步看可能是明代空白期的产品。建议看底足的老化程度和胎质，以及做进一步的显微观察。',
    authorId: 'expert_001',
    isExpert: true,
    isAdopted: true,
    createdAt: '2024-04-01T10:20:00Z',
  },
  {
    id: 'ans_002',
    questionId: 'q_001',
    content: '我也有一件类似的，专家说是晚清仿的，楼主谨慎。',
    authorId: 'user_002',
    isExpert: false,
    isAdopted: false,
    createdAt: '2024-04-01T11:05:00Z',
  },
  {
    id: 'ans_003',
    questionId: 'q_002',
    content:
      '五帝钱指顺治、康熙、雍正、乾隆、嘉庆五个皇帝的铜钱。一套好的五帝钱需要注意：1. 每个都要是大开门的真品；2. 尺寸接近，品相统一；3. 最好是水坑或老生坑。市场价普通品300-800元一套。',
    authorId: 'expert_003',
    isExpert: true,
    isAdopted: true,
    createdAt: '2024-04-02T09:30:00Z',
  },
  {
    id: 'ans_004',
    questionId: 'q_003',
    content:
      '齐白石的虾有几个关键点：虾身透明感、虾钳的力度、虾眼的点法。从这张图看，虾身太黑了，缺少层次感，虾钳软弱无力，大概率是仿品。建议找专业老师上手看一下。',
    authorId: 'expert_002',
    isExpert: true,
    isAdopted: true,
    createdAt: '2024-04-03T14:15:00Z',
  },
  {
    id: 'ans_005',
    questionId: 'q_003',
    content: '同问，我也买了一幅齐老爷子的画，怎么看真假？',
    authorId: 'user_003',
    isExpert: false,
    isAdopted: false,
    createdAt: '2024-04-03T16:40:00Z',
  },
  {
    id: 'ans_006',
    questionId: 'q_004',
    content:
      '和田玉的"温润"是手感和视觉的综合感受。建议：1. 上手盘玩几天，真玉会越来越油润；2. 测密度，和田玉密度2.95左右；3. 打灯看内部结构，棉絮状特征明显。',
    authorId: 'expert_001',
    isExpert: true,
    isAdopted: false,
    createdAt: '2024-04-04T10:10:00Z',
  },
  {
    id: 'ans_007',
    questionId: 'q_005',
    content:
      '紫砂壶开壶步骤：1. 清水洗净内外；2. 冷水下锅，小火煮开后保持30分钟；3. 捞出自然冷却；4. 用茶叶水煮壶（选一种你准备泡的茶）；5. 再次冷却后洗净即可。注意不要骤冷骤热。',
    authorId: 'expert_005',
    isExpert: true,
    isAdopted: true,
    createdAt: '2024-04-05T11:25:00Z',
  },
  {
    id: 'ans_008',
    questionId: 'q_006',
    content:
      '从器型和纹饰看，这面镜子有汉代特征，但铜质和锈色存疑。建议找专业机构做铜质成分分析，单凭照片很难100%确定。',
    authorId: 'expert_003',
    isExpert: true,
    isAdopted: false,
    createdAt: '2024-04-06T15:50:00Z',
  },
];

export const mockCommunityQuestions: CommunityQuestion[] = [
  {
    id: 'q_001',
    title: '请各位老师帮忙看看这件青花瓷是什么年代的？',
    content:
      '家里老人传下来的青花梅瓶，高约35厘米，底径12厘米。釉色莹润，纹饰是缠枝莲纹。请各位专家帮忙断代，有无收藏价值？',
    authorId: 'user_001',
    category: Category.CERAMIC,
    views: 1256,
    answers: mockCommunityAnswers.filter((a) => a.questionId === 'q_001'),
    createdAt: '2024-04-01T09:00:00Z',
  },
  {
    id: 'q_002',
    title: '五帝钱怎么辨别真假？现在市价多少？',
    content:
      '想请一套五帝钱挂在家里，淘宝上几十到几百的都有，不知道怎么选。请问专家五帝钱的辨别方法和合理价位。',
    authorId: 'user_002',
    category: Category.COIN,
    views: 890,
    answers: mockCommunityAnswers.filter((a) => a.questionId === 'q_002'),
    createdAt: '2024-04-02T08:30:00Z',
  },
  {
    id: 'q_003',
    title: '这幅齐白石的虾图是真迹吗？',
    content:
      '朋友转让一幅齐白石的虾图，尺寸是68cmx45cm，有款有印。请专家帮忙看看是否开门，价值大概多少？',
    authorId: 'user_003',
    category: Category.CALLIGRAPHY_PAINTING,
    views: 2340,
    answers: mockCommunityAnswers.filter((a) => a.questionId === 'q_003'),
    createdAt: '2024-04-03T13:20:00Z',
  },
  {
    id: 'q_004',
    title: '刚买的玉牌，求鉴定是不是和田玉？',
    content:
      '网上买的"和田籽料"玉牌，花了8000元，打灯看有结构，但是总觉得不太油润。请教各位怎么判断是不是真的和田玉？',
    authorId: 'user_001',
    category: Category.JADE,
    views: 678,
    answers: mockCommunityAnswers.filter((a) => a.questionId === 'q_004'),
    createdAt: '2024-04-04T09:50:00Z',
  },
  {
    id: 'q_005',
    title: '新买的紫砂壶怎么开壶？',
    content:
      '刚入手一把宜兴紫砂壶，听说需要开壶才能用。想请教正确的开壶方法，越详细越好，谢谢！',
    authorId: 'user_002',
    category: Category.ZISHA,
    views: 456,
    answers: mockCommunityAnswers.filter((a) => a.questionId === 'q_005'),
    createdAt: '2024-04-05T10:15:00Z',
  },
  {
    id: 'q_006',
    title: '这面铜镜是汉代的吗？',
    content:
      '集市上收的铜镜，直径15厘米，背面有乳钉纹和神兽纹。专家帮忙看看是什么年代的，谢谢！',
    authorId: 'user_003',
    category: Category.BRONZE,
    views: 732,
    answers: mockCommunityAnswers.filter((a) => a.questionId === 'q_006'),
    createdAt: '2024-04-06T14:00:00Z',
  },
];

export const mockArtworks: Artwork[] = [
  {
    id: 'art_001',
    userId: 'user_001',
    category: Category.CERAMIC,
    name: '青花缠枝莲纹梅瓶',
    images: ['/images/artwork_001_1.jpg', '/images/artwork_001_2.jpg'],
    description:
      '高35cm，口径5cm，底径12cm。通体青花装饰，肩部绘缠枝莲纹，腹部绘主题纹饰缠枝牡丹，近足处绘莲瓣纹。釉色莹润，青花发色沉稳。',
    createdAt: '2024-03-20T10:00:00Z',
  },
  {
    id: 'art_002',
    userId: 'user_001',
    category: Category.JADE,
    name: '和田白玉观音挂件',
    images: ['/images/artwork_002_1.jpg'],
    description:
      '和田白玉籽料雕刻，重35克，白度一级，油润度佳。观音面相慈祥，雕工精细。',
    createdAt: '2024-03-25T14:30:00Z',
  },
  {
    id: 'art_003',
    userId: 'user_002',
    category: Category.CALLIGRAPHY_PAINTING,
    name: '山水立轴',
    images: ['/images/artwork_003_1.jpg'],
    description:
      '纸本设色，尺寸138x68cm。画面峰峦叠嶂，云雾缭绕，有元人山水遗韵。款识："壬午年春月写于京华"。',
    createdAt: '2024-03-28T09:15:00Z',
  },
  {
    id: 'art_004',
    userId: 'user_002',
    category: Category.ZISHA,
    name: '石瓢紫砂壶',
    images: ['/images/artwork_004_1.jpg'],
    description:
      '宜兴原矿紫泥，容量280ml。器型经典，壶身饱满，出水流畅。底款"宜兴紫砂"。',
    createdAt: '2024-04-01T16:45:00Z',
  },
  {
    id: 'art_005',
    userId: 'user_003',
    category: Category.COIN,
    name: '咸丰元宝当百',
    images: ['/images/artwork_005_1.jpg'],
    description:
      '宝泉局铸，直径48mm，厚度3mm。钱文清晰，包浆自然，品相极佳。',
    createdAt: '2024-04-05T11:30:00Z',
  },
];

export const mockOrders: AppraisalOrder[] = [
  {
    id: 'order_001',
    artworkId: 'art_001',
    expertId: 'expert_001',
    userId: 'user_001',
    status: OrderStatus.COMPLETED,
    price: 800,
    slaDeadline: '2024-03-27T10:00:00Z',
    createdAt: '2024-03-20T10:30:00Z',
  },
  {
    id: 'order_002',
    artworkId: 'art_002',
    expertId: 'expert_001',
    userId: 'user_001',
    status: OrderStatus.COMPLETED,
    price: 800,
    slaDeadline: '2024-04-01T14:30:00Z',
    createdAt: '2024-03-25T15:00:00Z',
  },
  {
    id: 'order_003',
    artworkId: 'art_003',
    expertId: 'expert_002',
    userId: 'user_002',
    status: OrderStatus.APPRAISING,
    price: 1000,
    slaDeadline: '2024-04-04T09:15:00Z',
    createdAt: '2024-03-28T10:00:00Z',
  },
  {
    id: 'order_004',
    artworkId: 'art_004',
    expertId: 'expert_005',
    userId: 'user_002',
    status: OrderStatus.ACCEPTED,
    price: 300,
    slaDeadline: '2024-04-08T16:45:00Z',
    createdAt: '2024-04-01T17:30:00Z',
  },
  {
    id: 'order_005',
    artworkId: 'art_005',
    expertId: 'expert_003',
    userId: 'user_003',
    status: OrderStatus.PENDING,
    price: 500,
    slaDeadline: '2024-04-12T11:30:00Z',
    createdAt: '2024-04-05T12:00:00Z',
  },
  {
    id: 'order_006',
    artworkId: 'art_001',
    expertId: 'expert_001',
    userId: 'user_001',
    status: OrderStatus.DISPUTED,
    price: 800,
    slaDeadline: '2024-02-10T00:00:00Z',
    createdAt: '2024-02-03T09:00:00Z',
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert_001',
    orderId: 'order_001',
    conclusion:
      '经鉴定，此青花缠枝莲纹梅瓶为明代空白期（正统、景泰、天顺）时期景德镇民窑产品。器型规整，青花发色沉稳，纹饰流畅，保存完好，具有较高的收藏价值。',
    expertSignature: '张明德',
    watermark: 'https://example.com/watermark.png',
    blockchainHash: '0x8f3a9c2e1b7d5f4a8e6c3b1d9f2a5e8c7b4d1f3a5e7c9b2d4f6a8e1c3b5d7f9',
    blockchainHeight: 18256734,
    timestamp: '2024-03-25T16:30:00Z',
    certificateNo: 'JD-2024-0325-000128',
  },
  {
    id: 'cert_002',
    orderId: 'order_002',
    conclusion:
      '经鉴定，此观音挂件为当代和田白玉籽料制品。玉质细腻油润，白度一级，雕工精细，佩戴把玩皆宜。',
    expertSignature: '张明德',
    watermark: 'https://example.com/watermark.png',
    blockchainHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    blockchainHeight: 18289456,
    timestamp: '2024-03-30T11:15:00Z',
    certificateNo: 'JD-2024-0330-000957',
  },
];

export const mockDisputes: Dispute[] = [
  {
    id: 'dispute_001',
    orderId: 'order_006',
    reason:
      '用户认为专家鉴定结论与实际不符，提供了另外两家机构的鉴定报告证明该梅瓶为清代仿品，要求退费并重新鉴定。',
    status: DisputeStatus.PENDING,
    evidence:
      '用户上传了另外两家鉴定机构的证书扫描件以及高清细节照片12张。',
    createdAt: '2024-02-12T14:00:00Z',
  },
];

export const mockAIScreenResult: AIScreenResult = {
  category: Category.CERAMIC,
  categoryConfidence: 0.96,
  era: '明代空白期',
  eraConfidence: 0.82,
  authenticity: AuthenticityLevel.GENUINE,
  authenticityConfidence: 0.78,
  features: [
    '青花发色沉稳偏灰，有铁锈斑',
    '胎质洁白细腻，底足跳刀痕明显',
    '釉面肥润，有使用磨损痕迹',
    '纹饰布局疏朗，笔法流畅',
  ],
  suggestedExperts: ['expert_001', 'expert_003'],
};

export const mockValuationResult: ValuationResult = {
  artworkId: 'art_001',
  estimatedMinPrice: 28000,
  estimatedMaxPrice: 45000,
  confidence: 0.85,
  comparableItems: [
    {
      name: '明空白期青花缠枝莲纹梅瓶',
      price: 38500,
      date: '2024-01-15',
      source: '嘉德四季拍',
    },
    {
      name: '明青花梅瓶（同类）',
      price: 29800,
      date: '2023-11-20',
      source: '保利厦门',
    },
    {
      name: '明代青花缠枝莲罐',
      price: 52000,
      date: '2023-09-10',
      source: '西泠印社',
    },
  ],
  marketTrend: 'stable',
  valuationDate: '2024-03-25',
};
