import { FishingSpot, Obstacle } from '@/types';

const obstacles: Record<string, Obstacle[]> = {
  qinghai: [
    { type: 'rock', typeName: '礁石区', description: '北岸有大片礁石，容易挂底', position: { lat: 36.52, lng: 100.12 } },
    { type: 'weed', typeName: '水草区', description: '浅水区有水草，是鲤鱼产卵区', position: { lat: 36.45, lng: 100.08 } },
  ],
  yangtze: [
    { type: 'rock', typeName: '江中石', description: '航道边缘有水下礁石', position: { lat: 30.55, lng: 114.3 } },
    { type: 'platform', typeName: '码头', description: '南岸旧码头，水深流急', position: { lat: 30.52, lng: 114.32 } },
  ],
  qiandao: [
    { type: 'island', typeName: '小岛', description: '多个小岛周边是钓点', position: { lat: 29.61, lng: 119.03 } },
    { type: 'weed', typeName: '库湾水草', description: '库湾处水草丰茂', position: { lat: 29.58, lng: 118.98 } },
  ],
  bohai: [
    { type: 'rock', typeName: '礁盘', description: '近岸有大面积礁盘', position: { lat: 37.85, lng: 120.55 } },
    { type: 'platform', typeName: '养殖区', description: '海参养殖区，禁止抛锚', position: { lat: 37.82, lng: 120.58 } },
  ],
  heihu: [
    { type: 'rock', typeName: '黑石礁', description: '湖东岸黑石礁群', position: { lat: 26.85, lng: 100.2 } },
    { type: 'tree', typeName: '枯木区', description: '淹没的树林区，结构丰富', position: { lat: 26.82, lng: 100.18 } },
  ],
  dongting: [
    { type: 'weed', typeName: '芦苇荡', description: '大片芦苇区，藏鱼丰富', position: { lat: 29.35, lng: 113.05 } },
    { type: 'other', typeName: '禁渔区', description: '核心区禁渔，注意边界', position: { lat: 29.32, lng: 113.08 } },
  ],
};

export const fishingSpots: FishingSpot[] = [
  {
    id: 'qinghai-lake',
    name: '青海湖仙女湾',
    latitude: 36.5,
    longitude: 100.1,
    waterType: 'lake',
    waterTypeName: '高原湖泊',
    avgDepth: 21,
    maxDepth: 38,
    obstacles: obstacles.qinghai,
    description: '青海湖最大的洄游鱼类栖息地，鳇鱼资源丰富。湖水清澈，能见度高，是高原垂钓的圣地。每年春夏之交，大量湟鱼洄游，场面壮观。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=青藏高原湖泊风景，湛蓝湖水，远处雪山，蓝天白云，高清摄影&image_size=landscape_16_9',
    ],
    rating: 4.7,
    reviewCount: 328,
    difficulty: 'medium',
    difficultyName: '中等难度',
    fishSpecies: ['huangyu', 'liyu', 'caoyu'],
    rules: ['限杆一人一杆', '禁钓保护鱼类', '带走全部垃圾', '禁止夜钓'],
    distance: 12.5,
    province: '青海',
    city: '海北州',
  },
  {
    id: 'yangtze-wuhan',
    name: '长江武汉段',
    latitude: 30.53,
    longitude: 114.31,
    waterType: 'river',
    waterTypeName: '大江大河',
    avgDepth: 15,
    maxDepth: 42,
    obstacles: obstacles.yangtze,
    description: '长江中游核心江段，水产资源丰富。江水湍急，钓位选择很重要。常见鱼种有青鱼、草鱼、鲢鳙、鳜鱼等。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=长江武汉江景，宽阔的江面，远处有大桥，江边有钓鱼的人，黄昏时分&image_size=landscape_16_9',
    ],
    rating: 4.5,
    reviewCount: 512,
    difficulty: 'hard',
    difficultyName: '较难',
    fishSpecies: ['qingyu', 'caoyu', 'lianyong', 'guiyu', 'huanggu'],
    rules: ['遵守禁渔期规定', '禁止使用有害饵料', '一人一杆一线', '保护幼鱼'],
    distance: 5.8,
    province: '湖北',
    city: '武汉',
  },
  {
    id: 'qiandao-lake',
    name: '千岛湖中心湖区',
    latitude: 29.6,
    longitude: 119.02,
    waterType: 'reservoir',
    waterTypeName: '大型水库',
    avgDepth: 34,
    maxDepth: 100,
    obstacles: obstacles.qiandao,
    description: '国家5A级景区，水质极佳，能见度可达10米以上。湖中1078个岛屿形成了丰富的水下结构，是路亚和台钓的天堂。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=千岛湖风景，碧绿的湖水，众多小岛，青山绿水，阳光明媚，航拍视角&image_size=landscape_16_9',
    ],
    rating: 4.8,
    reviewCount: 892,
    difficulty: 'medium',
    difficultyName: '中等难度',
    fishSpecies: ['liyu', 'caoyu', 'qingyu', 'bianyu', 'luofei'],
    rules: ['需购买钓鱼票', '限钓区垂钓', '禁止矶钓', '保护水资源'],
    distance: 38.2,
    province: '浙江',
    city: '杭州',
  },
  {
    id: 'bohai-yantai',
    name: '渤海湾烟台',
    latitude: 37.83,
    longitude: 120.56,
    waterType: 'sea',
    waterTypeName: '近岸海域',
    avgDepth: 18,
    maxDepth: 35,
    obstacles: obstacles.bohai,
    description: '黄渤海交汇处，海洋资源丰富。春季鲅鱼洄游，秋季鲈鱼肥美。近岸矶钓和船钓都很发达。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=烟台海边风景，蓝色大海，海浪拍打着礁石，远处有渔船，蓝天白云&image_size=landscape_16_9',
    ],
    rating: 4.6,
    reviewCount: 634,
    difficulty: 'hard',
    difficultyName: '较难',
    fishSpecies: ['bayu', 'luyu', 'heichang', 'jiayu', 'shidiao'],
    rules: ['遵守海洋伏季休渔', '船钓需登记', '禁止捕捞保护品种', '安全第一'],
    distance: 3.5,
    province: '山东',
    city: '烟台',
  },
  {
    id: 'heihu-lake',
    name: '黑龙潭水库',
    latitude: 26.83,
    longitude: 100.19,
    waterType: 'reservoir',
    waterTypeName: '中型水库',
    avgDepth: 12,
    maxDepth: 28,
    obstacles: obstacles.heihu,
    description: '深藏在云南高原的神秘水库，因水下森林而闻名。水下结构复杂，大鱼众多，是野钓爱好者的天堂。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=云南高原水库风景，深绿色的湖水，周围是茂密的森林，神秘的氛围&image_size=landscape_16_9',
    ],
    rating: 4.4,
    reviewCount: 156,
    difficulty: 'hard',
    difficultyName: '较难',
    fishSpecies: ['qingyu', 'caoyu', 'liyu', 'luofei', 'qiutiao'],
    rules: ['禁止毒鱼电鱼', '限量垂钓', '注意森林防火', '保护生态'],
    distance: 56.8,
    province: '云南',
    city: '昆明',
  },
  {
    id: 'dongting-lake',
    name: '洞庭湖东洞庭',
    latitude: 29.33,
    longitude: 113.06,
    waterType: 'lake',
    waterTypeName: '淡水湖泊',
    avgDepth: 6,
    maxDepth: 15,
    obstacles: obstacles.dongting,
    description: '中国第二大淡水湖，鱼米之乡。芦苇荡和浅滩是鲫鱼、鲤鱼的天堂，也是路亚黑鱼的好地方。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=洞庭湖湿地风景，大片芦苇荡，水面波光粼粼，水鸟飞翔，日落时分&image_size=landscape_16_9',
    ],
    rating: 4.3,
    reviewCount: 287,
    difficulty: 'easy',
    difficultyName: '简单',
    fishSpecies: ['jiyu', 'liyu', 'caoyu', 'heiyu', 'huanggu'],
    rules: ['禁渔期禁止生产性捕捞', '休闲垂钓一人一杆', '保护湿地生态', '禁止使用抛网'],
    distance: 22.1,
    province: '湖南',
    city: '岳阳',
  },
];

export function getSpotById(id: string): FishingSpot | undefined {
  return fishingSpots.find(spot => spot.id === id);
}

export function getSpotsByWaterType(type: string): FishingSpot[] {
  return fishingSpots.filter(spot => spot.waterType === type);
}

export function searchSpots(keyword: string): FishingSpot[] {
  const lower = keyword.toLowerCase();
  return fishingSpots.filter(spot => 
    spot.name.toLowerCase().includes(lower) ||
    spot.city?.toLowerCase().includes(lower) ||
    spot.description.toLowerCase().includes(lower)
  );
}
