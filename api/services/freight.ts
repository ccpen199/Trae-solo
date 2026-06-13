import type { FreightCalculateRequest, FreightCalculateResponse, ServiceLevel } from '../../shared/types';

const CITY_BASE_DISTANCE: Record<string, number> = {
  '北京-上海': 1200,
  '北京-广州': 2100,
  '北京-深圳': 2200,
  '北京-杭州': 1300,
  '北京-成都': 1800,
  '北京-武汉': 1150,
  '上海-广州': 1400,
  '上海-深圳': 1500,
  '上海-杭州': 180,
  '上海-成都': 1950,
  '广州-深圳': 140,
  '广州-成都': 1600,
  '杭州-成都': 1850,
};

const SERVICE_CONFIG: Record<ServiceLevel, { name: string; days: string; premium: number }> = {
  standard: { name: '标准快递', days: '3-5天', premium: 0 },
  nextday: { name: '次日达', days: '次日达', premium: 15 },
  secondDay: { name: '隔日达', days: '2-3天', premium: 8 },
};

function getDistance(origin: string, dest: string): number {
  const key1 = `${origin}-${dest}`;
  const key2 = `${dest}-${origin}`;
  if (CITY_BASE_DISTANCE[key1]) return CITY_BASE_DISTANCE[key1];
  if (CITY_BASE_DISTANCE[key2]) return CITY_BASE_DISTANCE[key2];
  const cityHash = (origin.charCodeAt(0) + dest.charCodeAt(0)) % 10;
  return 800 + cityHash * 200;
}

export function calculateFreight(params: FreightCalculateRequest): FreightCalculateResponse {
  const { originCity, destCity, weight, serviceLevel } = params;
  const distance = getDistance(originCity, destCity);

  const baseFee = 10;
  const weightFee = weight <= 1 ? 0 : Math.ceil(weight - 1) * 4;
  const distanceFee = Math.floor(distance / 500) * 3;
  const servicePremium = SERVICE_CONFIG[serviceLevel].premium;

  const freight = baseFee + weightFee + distanceFee + servicePremium;

  return {
    freight,
    estimatedDays: SERVICE_CONFIG[serviceLevel].days,
    serviceLevel,
    serviceName: SERVICE_CONFIG[serviceLevel].name,
    breakdown: {
      baseFee,
      weightFee,
      distanceFee,
      servicePremium,
    },
  };
}
