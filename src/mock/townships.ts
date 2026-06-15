import { TownshipCode, IndustryTag, Enterprise, JobPosition } from '../../shared/types';

export type TownshipData = {
  code: TownshipCode;
  name: string;
  industryTags: IndustryTag[];
  description: string;
  population: number;
  openEnterpriseCount: number;
  openJobCount: number;
  enterpriseWeight: Record<IndustryTag, number>;
};

export const TOWNSHIPS: TownshipData[] = [
  {
    code: TownshipCode.SQ,
    name: '石岐街道',
    industryTags: [IndustryTag.ELECTRONICS, IndustryTag.FOOD, IndustryTag.APPLIANCE],
    description: '中山市中心城区，历史文化核心区，商业服务业发达，家电电子产业聚集',
    population: 205000,
    openEnterpriseCount: 186,
    openJobCount: 1488,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 5,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 22,
      [IndustryTag.MACHINERY]: 8,
      [IndustryTag.APPLIANCE]: 18,
      [IndustryTag.FOOD]: 15,
      [IndustryTag.NEWENERGY]: 8,
      [IndustryTag.ROBOTICS]: 13
    }
  },
  {
    code: TownshipCode.DQ,
    name: '东区街道',
    industryTags: [IndustryTag.ELECTRONICS, IndustryTag.ROBOTICS, IndustryTag.NEWENERGY],
    description: '中山市政治经济文化中心，CBD核心区，高端服务业和高新技术产业聚集',
    population: 286000,
    openEnterpriseCount: 245,
    openJobCount: 2205,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 4,
      [IndustryTag.LIGHTING]: 2,
      [IndustryTag.CASUALWEAR]: 3,
      [IndustryTag.FURNITURE]: 2,
      [IndustryTag.ELECTRONICS]: 25,
      [IndustryTag.MACHINERY]: 10,
      [IndustryTag.APPLIANCE]: 8,
      [IndustryTag.FOOD]: 10,
      [IndustryTag.NEWENERGY]: 18,
      [IndustryTag.ROBOTICS]: 18
    }
  },
  {
    code: TownshipCode.XQ,
    name: '西区街道',
    industryTags: [IndustryTag.MACHINERY, IndustryTag.HARDWARE, IndustryTag.FURNITURE],
    description: '商贸物流中心，专业市场聚集，装备制造和五金产业发达',
    population: 132000,
    openEnterpriseCount: 158,
    openJobCount: 1264,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 20,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 15,
      [IndustryTag.ELECTRONICS]: 12,
      [IndustryTag.MACHINERY]: 18,
      [IndustryTag.APPLIANCE]: 8,
      [IndustryTag.FOOD]: 7,
      [IndustryTag.NEWENERGY]: 5,
      [IndustryTag.ROBOTICS]: 5
    }
  },
  {
    code: TownshipCode.NQ,
    name: '南区街道',
    industryTags: [IndustryTag.ELECTRONICS, IndustryTag.APPLIANCE, IndustryTag.FOOD],
    description: '生态宜居新区，电子信息和食品产业聚集区',
    population: 92000,
    openEnterpriseCount: 112,
    openJobCount: 896,
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
    code: TownshipCode.WGS,
    name: '五桂山街道',
    industryTags: [IndustryTag.FOOD, IndustryTag.ELECTRONICS, IndustryTag.NEWENERGY],
    description: '中山市生态保护区，生态旅游和绿色产业聚集',
    population: 48000,
    openEnterpriseCount: 56,
    openJobCount: 392,
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
    code: TownshipCode.XL,
    name: '小榄镇',
    industryTags: [IndustryTag.HARDWARE, IndustryTag.ELECTRONICS, IndustryTag.APPLIANCE],
    description: '中国五金制品产业基地，锁具、燃气具、LED产业聚集，中山北部中心镇',
    population: 526000,
    openEnterpriseCount: 486,
    openJobCount: 4374,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 35,
      [IndustryTag.LIGHTING]: 15,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 18,
      [IndustryTag.MACHINERY]: 8,
      [IndustryTag.APPLIANCE]: 8,
      [IndustryTag.FOOD]: 3,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.GZ,
    name: '古镇镇',
    industryTags: [IndustryTag.LIGHTING, IndustryTag.HARDWARE, IndustryTag.ELECTRONICS],
    description: '中国灯饰之都，灯饰照明产业占全国70%以上市场份额',
    population: 235000,
    openEnterpriseCount: 385,
    openJobCount: 3465,
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
    code: TownshipCode.DS,
    name: '东升镇',
    industryTags: [IndustryTag.HARDWARE, IndustryTag.FURNITURE, IndustryTag.MACHINERY],
    description: '中国办公家具重镇，五金机械产业聚集',
    population: 138000,
    openEnterpriseCount: 165,
    openJobCount: 1320,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 25,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 30,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 15,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 3,
      [IndustryTag.NEWENERGY]: 2,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.DF,
    name: '东凤镇',
    industryTags: [IndustryTag.APPLIANCE, IndustryTag.ELECTRONICS, IndustryTag.HARDWARE],
    description: '中国小家电产业基地，知名家电品牌聚集地',
    population: 129000,
    openEnterpriseCount: 178,
    openJobCount: 1602,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 15,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 2,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 20,
      [IndustryTag.MACHINERY]: 5,
      [IndustryTag.APPLIANCE]: 38,
      [IndustryTag.FOOD]: 5,
      [IndustryTag.NEWENERGY]: 5,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.FS,
    name: '阜沙镇',
    industryTags: [IndustryTag.HARDWARE, IndustryTag.MACHINERY, IndustryTag.APPLIANCE],
    description: '精细化工和五金模具产业镇',
    population: 58000,
    openEnterpriseCount: 78,
    openJobCount: 624,
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
    code: TownshipCode.HP,
    name: '黄圃镇',
    industryTags: [IndustryTag.FOOD, IndustryTag.HARDWARE, IndustryTag.MACHINERY],
    description: '中国食品工业示范基地，腊味食品名镇，家电配套产业聚集',
    population: 152000,
    openEnterpriseCount: 185,
    openJobCount: 1480,
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
    code: TownshipCode.NT,
    name: '南头镇',
    industryTags: [IndustryTag.APPLIANCE, IndustryTag.ELECTRONICS, IndustryTag.MACHINERY],
    description: '中国家电产业基地，TCL、长虹等知名家电企业聚集地',
    population: 105000,
    openEnterpriseCount: 158,
    openJobCount: 1422,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 12,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 2,
      [IndustryTag.FURNITURE]: 2,
      [IndustryTag.ELECTRONICS]: 22,
      [IndustryTag.MACHINERY]: 12,
      [IndustryTag.APPLIANCE]: 40,
      [IndustryTag.FOOD]: 3,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 1
    }
  },
  {
    code: TownshipCode.SJ,
    name: '三角镇',
    industryTags: [IndustryTag.ELECTRONICS, IndustryTag.MACHINERY, IndustryTag.NEWENERGY],
    description: '中山市产业转移示范镇，电子信息和新能源产业聚集',
    population: 128000,
    openEnterpriseCount: 142,
    openJobCount: 1136,
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
    code: TownshipCode.MZ,
    name: '民众镇',
    industryTags: [IndustryTag.FOOD, IndustryTag.FURNITURE, IndustryTag.NEWENERGY],
    description: '现代农业和高端制造产业镇',
    population: 108000,
    openEnterpriseCount: 98,
    openJobCount: 686,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 8,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 18,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 10,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 25,
      [IndustryTag.NEWENERGY]: 15,
      [IndustryTag.ROBOTICS]: 3
    }
  },
  {
    code: TownshipCode.NL,
    name: '南朗镇',
    industryTags: [IndustryTag.FURNITURE, IndustryTag.ELECTRONICS, IndustryTag.ROBOTICS],
    description: '翠亨新区核心区，装备制造和旅游文化产业镇',
    population: 102000,
    openEnterpriseCount: 125,
    openJobCount: 1000,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 8,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 22,
      [IndustryTag.ELECTRONICS]: 18,
      [IndustryTag.MACHINERY]: 10,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 7,
      [IndustryTag.NEWENERGY]: 10,
      [IndustryTag.ROBOTICS]: 10
    }
  },
  {
    code: TownshipCode.GK,
    name: '港口镇',
    industryTags: [IndustryTag.MACHINERY, IndustryTag.HARDWARE, IndustryTag.FURNITURE],
    description: '现代物流业和装备制造业基地',
    population: 118000,
    openEnterpriseCount: 135,
    openJobCount: 1080,
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
    code: TownshipCode.SX,
    name: '沙溪镇',
    industryTags: [IndustryTag.CASUALWEAR, IndustryTag.FURNITURE, IndustryTag.HARDWARE],
    description: '中国休闲服装名镇，休闲服产业占全国重要份额',
    population: 228000,
    openEnterpriseCount: 285,
    openJobCount: 2565,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 8,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 52,
      [IndustryTag.FURNITURE]: 12,
      [IndustryTag.ELECTRONICS]: 5,
      [IndustryTag.MACHINERY]: 5,
      [IndustryTag.APPLIANCE]: 3,
      [IndustryTag.FOOD]: 5,
      [IndustryTag.NEWENERGY]: 5,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.DC,
    name: '大涌镇',
    industryTags: [IndustryTag.FURNITURE, IndustryTag.CASUALWEAR, IndustryTag.HARDWARE],
    description: '中国红木家具之都，牛仔服装生产基地',
    population: 98000,
    openEnterpriseCount: 185,
    openJobCount: 1665,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 10,
      [IndustryTag.LIGHTING]: 2,
      [IndustryTag.CASUALWEAR]: 32,
      [IndustryTag.FURNITURE]: 45,
      [IndustryTag.ELECTRONICS]: 2,
      [IndustryTag.MACHINERY]: 3,
      [IndustryTag.APPLIANCE]: 2,
      [IndustryTag.FOOD]: 2,
      [IndustryTag.NEWENERGY]: 1,
      [IndustryTag.ROBOTICS]: 1
    }
  },
  {
    code: TownshipCode.BF,
    name: '板芙镇',
    industryTags: [IndustryTag.FURNITURE, IndustryTag.HARDWARE, IndustryTag.CASUALWEAR],
    description: '家具和户外休闲用品产业镇',
    population: 95000,
    openEnterpriseCount: 122,
    openJobCount: 976,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 15,
      [IndustryTag.LIGHTING]: 5,
      [IndustryTag.CASUALWEAR]: 15,
      [IndustryTag.FURNITURE]: 32,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 8,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 7,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.SX2,
    name: '三乡镇',
    industryTags: [IndustryTag.FURNITURE, IndustryTag.LIGHTING, IndustryTag.MACHINERY],
    description: '南部中心镇，古典家具名镇，机械装备产业聚集',
    population: 208000,
    openEnterpriseCount: 225,
    openJobCount: 1913,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 12,
      [IndustryTag.LIGHTING]: 15,
      [IndustryTag.CASUALWEAR]: 8,
      [IndustryTag.FURNITURE]: 30,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 15,
      [IndustryTag.APPLIANCE]: 3,
      [IndustryTag.FOOD]: 3,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 3
    }
  },
  {
    code: TownshipCode.TZ,
    name: '坦洲镇',
    industryTags: [IndustryTag.ELECTRONICS, IndustryTag.FURNITURE, IndustryTag.HARDWARE],
    description: '珠海后花园，电子信息和精密制造产业镇',
    population: 278000,
    openEnterpriseCount: 268,
    openJobCount: 2412,
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
    code: TownshipCode.SW,
    name: '神湾镇',
    industryTags: [IndustryTag.FOOD, IndustryTag.FURNITURE, IndustryTag.MACHINERY],
    description: '滨海生态镇，游艇制造和旅游产业',
    population: 38000,
    openEnterpriseCount: 48,
    openJobCount: 336,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 10,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 5,
      [IndustryTag.FURNITURE]: 15,
      [IndustryTag.ELECTRONICS]: 5,
      [IndustryTag.MACHINERY]: 25,
      [IndustryTag.APPLIANCE]: 2,
      [IndustryTag.FOOD]: 30,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 2
    }
  },
  {
    code: TownshipCode.HL,
    name: '横栏镇',
    industryTags: [IndustryTag.LIGHTING, IndustryTag.HARDWARE, IndustryTag.FURNITURE],
    description: '中国花木之乡，LED照明和五金产业镇',
    population: 202000,
    openEnterpriseCount: 255,
    openJobCount: 2295,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 22,
      [IndustryTag.LIGHTING]: 38,
      [IndustryTag.CASUALWEAR]: 3,
      [IndustryTag.FURNITURE]: 12,
      [IndustryTag.ELECTRONICS]: 8,
      [IndustryTag.MACHINERY]: 5,
      [IndustryTag.APPLIANCE]: 3,
      [IndustryTag.FOOD]: 3,
      [IndustryTag.NEWENERGY]: 3,
      [IndustryTag.ROBOTICS]: 3
    }
  },
  {
    code: TownshipCode.ZG,
    name: '中山港街道（火炬开发区）',
    industryTags: [IndustryTag.ELECTRONICS, IndustryTag.NEWENERGY, IndustryTag.ROBOTICS],
    description: '国家级高新技术产业开发区，健康医药和装备制造产业基地',
    population: 258000,
    openEnterpriseCount: 425,
    openJobCount: 4250,
    enterpriseWeight: {
      [IndustryTag.HARDWARE]: 5,
      [IndustryTag.LIGHTING]: 3,
      [IndustryTag.CASUALWEAR]: 2,
      [IndustryTag.FURNITURE]: 3,
      [IndustryTag.ELECTRONICS]: 32,
      [IndustryTag.MACHINERY]: 15,
      [IndustryTag.APPLIANCE]: 5,
      [IndustryTag.FOOD]: 8,
      [IndustryTag.NEWENERGY]: 18,
      [IndustryTag.ROBOTICS]: 9
    }
  },
  {
    code: TownshipCode.CH,
    name: '翠亨新区（翠亨街道）',
    industryTags: [IndustryTag.NEWENERGY, IndustryTag.ROBOTICS, IndustryTag.MACHINERY],
    description: '粤澳合作示范区，先进装备制造和新能源产业聚集',
    population: 85000,
    openEnterpriseCount: 168,
    openJobCount: 1512,
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
  }
];

export const getTownshipByCode = (code: TownshipCode): TownshipData | undefined => {
  return TOWNSHIPS.find(t => t.code === code);
};

export const TOWNSHIP_NAMES: Record<TownshipCode, string> = TOWNSHIPS.reduce(
  (acc, t) => ({ ...acc, [t.code]: t.name }),
  {} as Record<TownshipCode, string>
);

export type HotTownshipStat = TownshipData & {
  enterpriseCount: number;
  jobCount: number;
  certifiedEnterpriseCount: number;
};

export function getTownshipStats(enterprises: Enterprise[], positions: JobPosition[]) {
  const totalEnterprises = enterprises.length;
  const totalJobs = positions.length;
  const totalPopulation = TOWNSHIPS.reduce((s, t) => s + t.population, 0);
  const certifiedEnterprises = enterprises.filter(e => e.verified).length;

  const townshipStats = TOWNSHIPS.map(township => {
    const townshipEnterprises = enterprises.filter(e => e.township === township.code);
    const townshipPositions = positions.filter(p => p.township === township.code);
    return {
      ...township,
      enterpriseCount: townshipEnterprises.length,
      jobCount: townshipPositions.length,
      certifiedEnterpriseCount: townshipEnterprises.filter(e => e.verified).length,
    };
  });

  const hotTownships: HotTownshipStat[] = [...townshipStats]
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, 10);

  return {
    totalTownships: TOWNSHIPS.length,
    totalEnterprises,
    totalJobs,
    totalPopulation,
    certifiedEnterprises,
    hotTownships,
    townshipStats,
  };
}
