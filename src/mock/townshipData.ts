import { TownshipCode, IndustryTag } from '../../shared/types';

export type TownshipData = {
  code: TownshipCode;
  name: string;
  population: number;
  industries: IndustryTag[];
  description: string;
  enterpriseCount: number;
  jobCount: number;
  enterpriseWeight: Record<IndustryTag, number>;
  [key: string]: any;
};

export const TOWNSHIP_DATA: TownshipData[] = [
  {
    code: TownshipCode.XL,
    name: '小榄镇',
    industries: [IndustryTag.HARDWARE, IndustryTag.LIGHTING, IndustryTag.ELECTRONICS, IndustryTag.MACHINERY],
    description: '中国五金制品产业基地和中国智能锁都，拥有锁具、燃气具、LED照明、五金冲压等特色产业集群。全镇工商企业超5万家，拥有华帝、木林森、长青等知名上市企业，是中山北部经济中心和交通枢纽，常住人口约52万，经济总量连续多年位居全市前列。',
    population: 52.6,
    enterpriseCount: 486,
    jobCount: 3280,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 35,
      [IndustryTag.LIGHTING]: 18,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 18,
      [IndustryTag.MACHINERY]: 10,
      [IndustryTag.APPLIANCE]: 6,
      [IndustryTag.FOOD]: 2,
      [IndustryTag.NEWENERGY]: 2,
      [IndustryTag.ROBOTICS]: 1
    }
  },
  {
    code: TownshipCode.ZG,
    name: '中山港街道（火炬开发区）',
    industries: [IndustryTag.ELECTRONICS, IndustryTag.NEWENERGY, IndustryTag.MACHINERY, IndustryTag.ROBOTICS],
    description: '国家级中山火炬高技术产业开发区，被誉为中山的"经济发动机"。形成了电子信息、健康医药、装备制造、新能源、新材料等五大主导产业，拥有国家健康科技产业基地、中国电子（中山）基地等国家级产业平台，是珠江西岸重要的高新技术产业聚集区。',
    population: 25.8,
    enterpriseCount: 425,
    jobCount: 2950,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 5,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 2,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 32,
      [IndustryTag.MACHINERY]: 18,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 6,
      [IndustryTag.NEWENERGY]: 18,
      [IndustryTag.ROBOTICS]: 8
    }
  },
  {
    code: TownshipCode.GZ,
    name: '古镇镇',
    industries: [IndustryTag.LIGHTING, IndustryTag.HARDWARE, IndustryTag.ELECTRONICS],
    description: '被誉为"中国灯饰之都"，灯饰产业占全国市场份额70%以上，是全球最大的灯饰生产和销售基地。拥有灯饰及配套企业超万家，产品远销130多个国家和地区。形成了从上游芯片、封装到下游应用、销售的完整产业链，每年举办的古镇灯博会享誉全球。',
    population: 23.5,
    enterpriseCount: 385,
    jobCount: 2680,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 12,
      [IndustryTag.LIGHTING]: 55,
      [IndustryTag.CASUALWEAR]: 2,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 15,
      [IndustryTag.MACHINERY]: 4,
      [IndustryTag.APPLIANCE]: 3,
      [IndustryTag.FOOD]: 2,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 1
    }
  },
  {
    code: TownshipCode.SX2,
    name: '三乡镇',
    industries: [IndustryTag.FURNITURE, IndustryTag.MACHINERY, IndustryTag.LIGHTING, IndustryTag.HARDWARE],
    description: '中山南部中心镇，中国古典家具名镇，拥有明清古典家具产业集群。同时发展机械装备、电子电器、五金制品等多元化产业。三乡是著名的侨乡，生态环境优美，房地产和服务业发达，毗邻珠海，交通便利，是中山南部的经济文化中心和宜居城镇。',
    population: 20.8,
    enterpriseCount: 225,
    jobCount: 1580,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 12,
      [IndustryTag.LIGHTING]: 15,
      [IndustryTag.CASUALWEAR]: 8,
      [IndustryTag.FURNITURE]: 30,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 15,
      [IndustryTag.APPLIANCE]: 3,
      [IndustryTag.FOOD]: 4,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.TZ,
    name: '坦洲镇',
    industries: [IndustryTag.ELECTRONICS, IndustryTag.FURNITURE, IndustryTag.HARDWARE, IndustryTag.MACHINERY],
    description: '中山市南部经济重镇，有"珠海后花园"之称。依托毗邻珠海的区位优势，大力发展电子信息、精密制造、家具五金等产业，是珠中江一体化发展的前沿阵地。坦洲工业基础雄厚，拥有多个大型工业园区，同时现代农业和生态旅游业也颇具特色。',
    population: 27.8,
    enterpriseCount: 268,
    jobCount: 1850,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 15,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 18,
      [IndustryTag.ELECTRONICS]: 30,
      [IndustryTag.MACHINERY]: 12,
      [IndustryTag.APPLIANCE]: 3,
      [IndustryTag.FOOD]: 5,
      [IndustryTag.NEWENERGY]: 5,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.DQ,
    name: '东区街道',
    industries: [IndustryTag.ELECTRONICS, IndustryTag.ROBOTICS, IndustryTag.NEWENERGY, IndustryTag.MACHINERY],
    description: '中山市政治、经济、文化中心，市委市政府所在地，是中山的CBD核心区。东区服务业发达，金融、商贸、总部经济聚集，同时拥有多个高新技术产业园，大力发展人工智能、大数据、新能源等战略性新兴产业，是中山城市形象和现代化水平的集中展示区。',
    population: 28.6,
    enterpriseCount: 245,
    jobCount: 1720,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 4,
      [IndustryTag.LIGHTING]: 2,
      [IndustryTag.CASUALWEAR]: 3,
      [IndustryTag.FURNITURE]: 2,
      [IndustryTag.ELECTRONICS]: 25,
      [IndustryTag.MACHINERY]: 12,
      [IndustryTag.APPLIANCE]: 6,
      [IndustryTag.FOOD]: 10,
      [IndustryTag.NEWENERGY]: 18,
      [IndustryTag.ROBOTICS]: 18
    }
  },
  {
    code: TownshipCode.SX,
    name: '沙溪镇',
    industries: [IndustryTag.CASUALWEAR, IndustryTag.FURNITURE, IndustryTag.HARDWARE, IndustryTag.ELECTRONICS],
    description: '中国休闲服装名镇，休闲服产业在全国占有重要地位，拥有"沙溪休闲服装"区域品牌。全镇服装企业超千家，从业人员数万，形成了纺纱、织布、印染、制衣、销售的完整产业链。每年举办的中国休闲服装博览会是行业盛会，沙溪也是中国红木家具生产专业镇。',
    population: 22.8,
    enterpriseCount: 285,
    jobCount: 1950,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 8,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 52,
      [IndustryTag.FURNITURE]: 12,
      [IndustryTag.ELECTRONICS]: 5,
      [IndustryTag.MACHINERY]: 5,
      [IndustryTag.APPLIANCE]: 3,
      [IndustryTag.FOOD]: 7,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.NT,
    name: '南头镇',
    industries: [IndustryTag.APPLIANCE, IndustryTag.ELECTRONICS, IndustryTag.MACHINERY],
    description: '中国家电产业基地，被誉为"中国家电品牌小镇"。拥有TCL、长虹、奥马等知名家电企业龙头，形成了大家电、小家电、家电配件的完整产业体系。南头家电产业配套完善，产业链条完整，是珠江西岸重要的家电制造中心，产品畅销国内外市场。',
    population: 10.5,
    enterpriseCount: 158,
    jobCount: 1120,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 12,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 2,
      [IndustryTag.FURNITURE]: 2,
      [IndustryTag.ELECTRONICS]: 22,
      [IndustryTag.MACHINERY]: 12,
      [IndustryTag.APPLIANCE]: 40,
      [IndustryTag.FOOD]: 3,
      [IndustryTag.NEWENERGY]: 4,
      [IndustryTag.ROBOTICS]: 1
    }
  },
  {
    code: TownshipCode.HP,
    name: '黄圃镇',
    industries: [IndustryTag.FOOD, IndustryTag.HARDWARE, IndustryTag.MACHINERY, IndustryTag.APPLIANCE],
    description: '中国食品工业示范基地，"中国腊味食品名镇"，黄圃腊味是国家地理标志保护产品，享誉海内外。同时也是中山家电产业的重要组成部分，五金机械、家用电器产业发达。黄圃历史文化底蕴深厚，是中山北部的商贸重镇和历史文化名镇。',
    population: 15.2,
    enterpriseCount: 185,
    jobCount: 1280,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 18,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 18,
      [IndustryTag.APPLIANCE]: 15,
      [IndustryTag.FOOD]: 25,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.HL,
    name: '横栏镇',
    industries: [IndustryTag.LIGHTING, IndustryTag.HARDWARE, IndustryTag.FURNITURE, IndustryTag.NEWENERGY],
    description: '中国花木之乡和"中国照明灯饰制造基地"，是中山灯饰产业的重要组成部分，与古镇镇形成灯饰产业双核。横栏LED照明产业发达，拥有众多灯饰照明企业。同时，横栏还是华南地区重要的花木生产和交易基地，花木产业与灯饰产业共同构成横栏两大特色经济支柱。',
    population: 20.2,
    enterpriseCount: 255,
    jobCount: 1750,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 22,
      [IndustryTag.LIGHTING]: 38,
      [IndustryTag.CASUALWEAR]: 3,
      [IndustryTag.FURNITURE]: 12,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 6,
      [IndustryTag.APPLIANCE]: 3,
      [IndustryTag.FOOD]: 3,
      [IndustryTag.NEWENERGY]: 4,
      [IndustryTag.ROBOTICS]: 1
    }
  },
  {
    code: TownshipCode.DF,
    name: '东凤镇',
    industries: [IndustryTag.APPLIANCE, IndustryTag.ELECTRONICS, IndustryTag.HARDWARE, IndustryTag.MACHINERY],
    description: '中国小家电产业基地，是中山家电产业的核心区域之一，以小家电制造闻名全国。拥有众多知名小家电品牌，形成了从研发、生产到销售的完整产业链。东凤镇地理位置优越，交通便利，是中山北部组团的重要组成部分，家电配件产业也十分发达。',
    population: 12.9,
    enterpriseCount: 178,
    jobCount: 1250,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 15,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 2,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 20,
      [IndustryTag.MACHINERY]: 7,
      [IndustryTag.APPLIANCE]: 38,
      [IndustryTag.FOOD]: 5,
      [IndustryTag.NEWENERGY]: 4,
      [IndustryTag.ROBOTICS]: 1
    }
  },
  {
    code: TownshipCode.SQ,
    name: '石岐街道',
    industries: [IndustryTag.ELECTRONICS, IndustryTag.FOOD, IndustryTag.APPLIANCE, IndustryTag.MACHINERY],
    description: '中山市的老城区和传统商业中心，历史文化底蕴深厚，是中山城市文化的根脉所在。石岐商业发达，服务业繁荣，同时拥有电子信息、食品加工、家用电器等传统优势产业。作为中山的城市原点，石岐正在推动城市更新和产业转型升级，焕发新的活力。',
    population: 20.5,
    enterpriseCount: 186,
    jobCount: 1320,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 5,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 6,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 22,
      [IndustryTag.MACHINERY]: 10,
      [IndustryTag.APPLIANCE]: 18,
      [IndustryTag.FOOD]: 18,
      [IndustryTag.NEWENERGY]: 7,
      [IndustryTag.ROBOTICS]: 8
    }
  },
  {
    code: TownshipCode.DS,
    name: '东升镇',
    industries: [IndustryTag.HARDWARE, IndustryTag.FURNITURE, IndustryTag.MACHINERY, IndustryTag.ELECTRONICS],
    description: '中国办公家具重镇和"中国脆肉鲩之乡"，办公家具产业在全国占有重要地位。同时，五金制品、装备制造、电子电器等产业也颇具规模。东升镇交通便利，基础设施完善，是中山西北部的重要工业镇和农业大镇，一二三产业协调发展，经济实力稳步提升。',
    population: 13.8,
    enterpriseCount: 165,
    jobCount: 1150,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 25,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 30,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 15,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 4,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 0
    }
  },
  {
    code: TownshipCode.SJ,
    name: '三角镇',
    industries: [IndustryTag.ELECTRONICS, IndustryTag.MACHINERY, IndustryTag.NEWENERGY, IndustryTag.HARDWARE],
    description: '中山市民营科技园所在地，是中山产业转移和升级的重要承载地。形成了电子信息、装备制造、新能源、五金塑料等主导产业，拥有多个大型工业园区。三角镇区位优势明显，交通便利，是连接广州南沙和中山的重要节点，未来发展潜力巨大。',
    population: 12.8,
    enterpriseCount: 142,
    jobCount: 980,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 10,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 3,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 28,
      [IndustryTag.MACHINERY]: 18,
      [IndustryTag.APPLIANCE]: 8,
      [IndustryTag.FOOD]: 5,
      [IndustryTag.NEWENERGY]: 18,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.GK,
    name: '港口镇',
    industries: [IndustryTag.MACHINERY, IndustryTag.HARDWARE, IndustryTag.FURNITURE, IndustryTag.ELECTRONICS],
    description: '中山市东北部工业重镇，以装备制造、五金电器、家具制造为主导产业。港口镇拥有中山港的重要组成部分，物流业发达，是中山重要的物流节点。同时，港口还是"中国游戏游艺产业基地"，游戏游艺产业是其特色产业，在国内外享有较高知名度。',
    population: 11.8,
    enterpriseCount: 135,
    jobCount: 920,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 20,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 3,
      [IndustryTag.FURNITURE]: 18,
      [IndustryTag.ELECTRONICS]: 12,
      [IndustryTag.MACHINERY]: 25,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 5,
      [IndustryTag.NEWENERGY]: 5,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.CH,
    name: '翠亨新区',
    industries: [IndustryTag.NEWENERGY, IndustryTag.ROBOTICS, IndustryTag.MACHINERY, IndustryTag.ELECTRONICS],
    description: '粤澳全面合作示范区，是中山参与粤港澳大湾区建设的主阵地。重点发展先进装备制造、新能源、人工智能、生物医药等战略性新兴产业。翠亨新区区位优越，紧邻深圳前海，是珠江口西岸重要的产业创新平台，未来将建设成为现代化滨海新城和产业高地。',
    population: 8.5,
    enterpriseCount: 168,
    jobCount: 1180,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 3,
      [IndustryTag.LIGHTING]: 2,
      [IndustryTag.CASUALWEAR]: 2,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 12,
      [IndustryTag.MACHINERY]: 25,
      [IndustryTag.APPLIANCE]: 3,
      [IndustryTag.FOOD]: 5,
      [IndustryTag.NEWENERGY]: 28,
      [IndustryTag.ROBOTICS]: 17
    }
  },
  {
    code: TownshipCode.DC,
    name: '大涌镇',
    industries: [IndustryTag.FURNITURE, IndustryTag.CASUALWEAR, IndustryTag.HARDWARE],
    description: '中国红木家具之都和"中国牛仔服装名镇"，拥有两大特色产业集群。大涌红木家具历史悠久，工艺精湛，在全国享有盛誉，是全国最大的红木家具生产基地之一。同时，牛仔服装产业也十分发达，形成了从纺纱、织布、印染到制衣的完整产业链。',
    population: 9.8,
    enterpriseCount: 185,
    jobCount: 1280,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 10,
      [IndustryTag.LIGHTING]: 2,
      [IndustryTag.CASUALWEAR]: 32,
      [IndustryTag.FURNITURE]: 45,
      [IndustryTag.ELECTRONICS]: 2,
      [IndustryTag.MACHINERY]: 4,
      [IndustryTag.APPLIANCE]: 2,
      [IndustryTag.FOOD]: 2,
      [IndustryTag.NEWENERGY]: 1,
      [IndustryTag.ROBOTICS]: 0
    }
  },
  {
    code: TownshipCode.NL,
    name: '南朗镇',
    industries: [IndustryTag.FURNITURE, IndustryTag.ELECTRONICS, IndustryTag.ROBOTICS, IndustryTag.MACHINERY],
    description: '孙中山先生的故乡，历史文化名镇，也是翠亨新区的重要组成部分。南朗拥有丰富的历史文化资源和优美的生态环境，同时大力发展装备制造、电子信息、新能源等产业。南朗交通便利，区位优越，是中山对接珠海、澳门的重要门户。',
    population: 10.2,
    enterpriseCount: 125,
    jobCount: 860,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 8,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 22,
      [IndustryTag.ELECTRONICS]: 18,
      [IndustryTag.MACHINERY]: 12,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 5,
      [IndustryTag.NEWENERGY]: 10,
      [IndustryTag.ROBOTICS]: 10
    }
  },
  {
    code: TownshipCode.MZ,
    name: '民众镇',
    industries: [IndustryTag.NEWENERGY, IndustryTag.FOOD, IndustryTag.FURNITURE, IndustryTag.ELECTRONICS],
    description: '中山市东北部生态型工业镇，是中山保税物流中心所在地，物流业发达。民众镇大力发展新能源、高端制造、绿色食品等产业，是中山产业升级的重要承载区。同时，民众镇水网密布，生态环境优美，是著名的岭南水乡，农业和生态旅游也颇具特色。',
    population: 10.8,
    enterpriseCount: 98,
    jobCount: 720,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 8,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 18,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 10,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 20,
      [IndustryTag.NEWENERGY]: 20,
      [IndustryTag.ROBOTICS]: 3
    }
  },
  {
    code: TownshipCode.XQ,
    name: '西区街道',
    industries: [IndustryTag.MACHINERY, IndustryTag.HARDWARE, IndustryTag.FURNITURE, IndustryTag.FOOD],
    description: '中山市中心城区的重要组成部分，是中山的商贸物流中心和专业市场聚集区。西区拥有众多专业批发市场，商贸流通业发达。同时，装备制造、五金制品、家具等制造业也有一定基础。西区交通便利，是中山的西大门，正在加快城市更新和现代服务业发展。',
    population: 13.2,
    enterpriseCount: 158,
    jobCount: 1080,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 20,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 15,
      [IndustryTag.ELECTRONICS]: 12,
      [IndustryTag.MACHINERY]: 18,
      [IndustryTag.APPLIANCE]: 8,
      [IndustryTag.FOOD]: 9,
      [IndustryTag.NEWENERGY]: 5,
      [IndustryTag.ROBOTICS]: 3
    }
  },
  {
    code: TownshipCode.BF,
    name: '板芙镇',
    industries: [IndustryTag.FURNITURE, IndustryTag.HARDWARE, IndustryTag.CASUALWEAR, IndustryTag.MACHINERY],
    description: '中山市西南部工业镇，以家具制造、户外休闲用品、五金制品为主要产业。板芙镇是中国户外休闲用品产业基地，户外家具、休闲用品产业特色鲜明。同时，板芙镇生态环境优美，西江河畔风光秀丽，是宜工宜商宜居的岭南水乡小镇。',
    population: 9.5,
    enterpriseCount: 122,
    jobCount: 850,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 15,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 15,
      [IndustryTag.FURNITURE]: 32,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 10,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 5,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.NQ,
    name: '南区街道',
    industries: [IndustryTag.ELECTRONICS, IndustryTag.APPLIANCE, IndustryTag.FOOD, IndustryTag.MACHINERY],
    description: '中山市中心城区的南大门，生态环境优美，是中山的宜居宜业新城区。南区电子信息、家用电器、食品饮料等产业基础良好，同时大力发展现代服务业和战略性新兴产业。南区交通便利，拥有多个大型商住社区，是中山城市南拓的重要区域。',
    population: 9.2,
    enterpriseCount: 112,
    jobCount: 780,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 8,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 3,
      [IndustryTag.FURNITURE]: 8,
      [IndustryTag.ELECTRONICS]: 25,
      [IndustryTag.MACHINERY]: 10,
      [IndustryTag.APPLIANCE]: 18,
      [IndustryTag.FOOD]: 15,
      [IndustryTag.NEWENERGY]: 5,
      [IndustryTag.ROBOTICS]: 3
    }
  },
  {
    code: TownshipCode.FS,
    name: '阜沙镇',
    industries: [IndustryTag.HARDWARE, IndustryTag.MACHINERY, IndustryTag.APPLIANCE, IndustryTag.FOOD],
    description: '中山市北部工业镇，以精细化工、五金模具、家用电器为主要产业。阜沙镇是中国精细化工产业基地，化工产业特色鲜明。同时，五金机械、家电配件等产业也有一定规模。阜沙镇地理位置优越，交通便利，是中山北部产业带的重要组成部分。',
    population: 5.8,
    enterpriseCount: 78,
    jobCount: 540,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 28,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 3,
      [IndustryTag.FURNITURE]: 5,
      [IndustryTag.ELECTRONICS]: 10,
      [IndustryTag.MACHINERY]: 22,
      [IndustryTag.APPLIANCE]: 12,
      [IndustryTag.FOOD]: 8,
      [IndustryTag.NEWENERGY]: 5,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.WGS,
    name: '五桂山街道',
    industries: [IndustryTag.FOOD, IndustryTag.ELECTRONICS, IndustryTag.NEWENERGY],
    description: '中山市生态保护区和"市肺"，拥有五桂山山脉，森林覆盖率高，生态环境优美。五桂山是中山的生态屏障和旅游休闲胜地，同时适度发展生态友好型产业，绿色食品、电子信息、新能源等产业在生态保护的前提下有序发展，是中山的生态功能区。',
    population: 4.8,
    enterpriseCount: 56,
    jobCount: 380,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 5,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 2,
      [IndustryTag.FURNITURE]: 5,
      [IndustryTag.ELECTRONICS]: 18,
      [IndustryTag.MACHINERY]: 5,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 28,
      [IndustryTag.NEWENERGY]: 25,
      [IndustryTag.ROBOTICS]: 4
    }
  },
  {
    code: TownshipCode.SW,
    name: '神湾镇',
    industries: [IndustryTag.FOOD, IndustryTag.MACHINERY, IndustryTag.FURNITURE],
    description: '中山市南部滨海生态镇，拥有神湾港，是中山重要的出海门户。神湾镇是"中国游艇制造基地"，游艇制造和海洋工程装备产业特色鲜明。同时，神湾菠萝是国家地理标志产品，远近闻名。神湾镇山清水秀，生态优美，是宜居宜游的滨海小镇。',
    population: 3.8,
    enterpriseCount: 48,
    jobCount: 320,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 10,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 15,
      [IndustryTag.ELECTRONICS]: 5,
      [IndustryTag.MACHINERY]: 28,
      [IndustryTag.APPLIANCE]: 2,
      [IndustryTag.FOOD]: 25,
      [IndustryTag.NEWENERGY]: 4,
      [IndustryTag.ROBOTICS]: 3
    }
  }
];

export const getTownshipByCode = (code: TownshipCode): TownshipData | undefined => {
  return TOWNSHIP_DATA.find(t => t.code === code);
};

export const TOWNSHIP_NAMES: Record<TownshipCode, string> = TOWNSHIP_DATA.reduce(
  (acc, t) => ({ ...acc, [t.code]: t.name }),
  {} as Record<TownshipCode, string>
);

export default TOWNSHIP_DATA;
