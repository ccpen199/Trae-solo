import { FishSpecies, FishingSpot, FishingMethod, FishingIndex } from '@/types';
import { calculateFishingIndex } from './fishingIndex';
import { generateEnvironmentData } from '@/data/environment';

export interface AIAnalysisInput {
  spot: FishingSpot;
  species: FishSpecies;
  method: FishingMethod;
  photoUrl?: string;
  duration: number;
  date: Date;
  catchCount: number;
  totalWeight: number;
  equipment: string[];
  weatherNotes: string;
}

export interface AIAnalysisResult {
  activityLevel: {
    score: number;
    level: string;
    description: string;
  };
  goldenHours: {
    time: string;
    score: number;
    reason: string;
  }[];
  equipmentSuggestions: {
    type: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  strategyAdvice: {
    title: string;
    content: string;
    icon: string;
  }[];
  baitRecommendations: {
    name: string;
    reason: string;
    effectiveness: number;
  }[];
  optimalDepth: string;
  nextBestDay: {
    date: string;
    score: number;
    reason: string;
  };
}

export function performAIAnalysis(input: AIAnalysisInput): AIAnalysisResult {
  const { spot, species, method, date } = input;
  
  const envDataList = generateEnvironmentData(spot.id, date, 22, spot.waterType === 'sea');
  const currentHour = date.getHours();
  const currentEnv = envDataList[Math.min(currentHour, envDataList.length - 1)];
  const currentIndex = calculateFishingIndex(currentEnv, species, method);
  
  const activityScore = currentIndex.overallScore;
  const activityLevel = activityScore >= 80 ? '极高' : activityScore >= 65 ? '较高' : activityScore >= 45 ? '中等' : '较低';
  
  const goldenHours = calculateGoldenHours(envDataList, species, method);
  const equipmentSuggestions = generateEquipmentSuggestions(species, method, currentIndex);
  const strategyAdvice = generateStrategyAdvice(species, method, currentIndex, spot);
  const baitRecommendations = generateBaitRecommendations(species, method, currentIndex);
  const optimalDepth = calculateOptimalDepth(species, currentEnv);
  const nextBestDay = predictNextBestDay(spot, species, method, date);
  
  return {
    activityLevel: {
      score: activityScore,
      level: activityLevel,
      description: currentIndex.suggestion,
    },
    goldenHours,
    equipmentSuggestions,
    strategyAdvice,
    baitRecommendations,
    optimalDepth,
    nextBestDay,
  };
}

function calculateGoldenHours(envDataList: any[], species: FishSpecies, method: FishingMethod) {
  const hours: { time: string; score: number; reason: string }[] = [];
  
  for (let h = 0; h < 24; h++) {
    const env = envDataList[h];
    const index = calculateFishingIndex(env, species, method);
    
    if (index.overallScore >= 70) {
      const timeStr = `${h.toString().padStart(2, '0')}:00`;
      let reason = '';
      
      if (h >= 5 && h <= 7) {
        reason = '清晨黄金时段，鱼类摄食积极';
      } else if (h >= 17 && h <= 19) {
        reason = '黄昏时段，鱼口活跃';
      } else if (h >= 21 || h <= 3) {
        reason = '夜间时段，夜行性鱼类觅食';
      } else {
        reason = '环境条件适宜';
      }
      
      hours.push({ time: timeStr, score: index.overallScore, reason });
    }
  }
  
  if (hours.length === 0) {
    hours.push({ time: '06:00', score: 65, reason: '清晨相对最佳时段' });
    hours.push({ time: '18:00', score: 60, reason: '黄昏时段可以一试' });
  }
  
  return hours.sort((a, b) => b.score - a.score).slice(0, 5);
}

function generateEquipmentSuggestions(species: FishSpecies, method: FishingMethod, index: FishingIndex) {
  const suggestions: { type: string; suggestion: string; priority: 'high' | 'medium' | 'low' }[] = [];
  
  if (method.type === 'tai') {
    suggestions.push({
      type: '钓竿',
      suggestion: `推荐使用3.6-5.4米${species.difficulty > 50 ? '硬调' : '中硬调'}台钓竿`,
      priority: 'high',
    });
    
    suggestions.push({
      type: '线组',
      suggestion: `主线${Math.max(1, Math.ceil(species.difficulty / 20))}.0号，子线减1号`,
      priority: 'high',
    });
    
    suggestions.push({
      type: '浮漂',
      suggestion: index.level === 'poor' ? '建议使用灵敏度高的细尾漂' : '使用常用的综合漂即可',
      priority: 'medium',
    });
  } else if (method.type === 'lure') {
    suggestions.push({
      type: '路亚竿',
      suggestion: `推荐M-${species.difficulty > 60 ? 'MH' : 'ML'}调路亚竿，长度2.1-2.4米`,
      priority: 'high',
    });
    
    suggestions.push({
      type: '假饵',
      suggestion: `建议携带米诺、VIB、软虫等多种假饵`,
      priority: 'high',
    });
    
    suggestions.push({
      type: '装备',
      suggestion: '别忘记带控鱼器和路亚钳，安全第一',
      priority: 'low',
    });
  }
  
  if (index.factors.find(f => f.key === 'wind' && f.score < 50)) {
    suggestions.push({
      type: '防风',
      suggestion: '风力较大，建议使用重铅或加重假饵',
      priority: 'high',
    });
  }
  
  if (species.habits.some(h => h.type === 'nocturnal' && h.value > 50)) {
    suggestions.push({
      type: '夜钓装备',
      suggestion: '目标鱼种有夜行性，建议准备夜光漂或头灯',
      priority: 'medium',
    });
  }
  
  return suggestions;
}

function generateStrategyAdvice(species: FishSpecies, method: FishingMethod, index: FishingIndex, spot: FishingSpot) {
  const advice: { title: string; content: string; icon: string }[] = [];
  
  advice.push({
    title: '钓位选择',
    content: `建议在${spot.obstacles.length > 0 ? '障碍物附近，如' + spot.obstacles[0].typeName : '深浅交界处'}下钩，那里是${species.name}经常出没的地方。`,
    icon: 'MapPin',
  });
  
  if (method.type === 'tai') {
    advice.push({
      title: '做窝技巧',
      content: '提前1-2小时打窝，使用酒米+颗粒饵料。少量多次补窝，保持窝点持续有饵。',
      icon: 'Target',
    });
    
    advice.push({
      title: '提竿时机',
      content: index.level === 'excellent' 
        ? '鱼口好，抓顿口和黑漂，提竿要果断。'
        : '鱼口轻，注意小信号，适当放口抓实口。',
      icon: 'Zap',
    });
  } else if (method.type === 'lure') {
    advice.push({
      title: '收线速度',
      content: '建议快慢结合，找到鱼的活性节奏。活性高时快收，活性低时慢收加停顿。',
      icon: 'Wind',
    });
    
    advice.push({
      title: '搜底策略',
      content: '从浅水开始，逐层搜索。跳底和慢收交替，找到鱼所在的水层。',
      icon: 'Layers',
    });
  }
  
  advice.push({
    title: '安全提醒',
    content: `今日${index.factors.find(f => f.key === 'wind')?.description}，请注意安全。记得带走垃圾，保护钓场环境。`,
    icon: 'Shield',
  });
  
  return advice;
}

function generateBaitRecommendations(species: FishSpecies, method: FishingMethod, index: FishingIndex) {
  const recommendations: { name: string; reason: string; effectiveness: number }[] = [];
  
  if (method.type === 'tai' || method.type === 'blackpit') {
    recommendations.push({
      name: '蚯蚓',
      reason: '万能钓饵，几乎所有淡水鱼都吃',
      effectiveness: 75,
    });
    
    if (species.id === 'liyu') {
      recommendations.push({
        name: '螺鲤+三合一',
        reason: '鲤鱼最爱的经典配方，腥香结合',
        effectiveness: 90,
      });
    }
    
    if (species.id === 'caoyu') {
      recommendations.push({
        name: '嫩玉米',
        reason: '草鱼的最爱，鲜甜适口',
        effectiveness: 85,
      });
    }
    
    if (species.id === 'qingyu') {
      recommendations.push({
        name: '螺蛳',
        reason: '青鱼的天然食物，大物必备',
        effectiveness: 92,
      });
    }
    
    recommendations.push({
      name: '商品饵',
      reason: '根据目标鱼种选择对应味型',
      effectiveness: 70,
    });
  } else if (method.type === 'lure') {
    recommendations.push({
      name: '米诺',
      reason: '全水层搜索，反应饵',
      effectiveness: 80,
    });
    
    recommendations.push({
      name: 'VIB',
      reason: '震动强，远投性能好',
      effectiveness: 75,
    });
    
    recommendations.push({
      name: '软虫+德州',
      reason: '防挂底，跳底搜结构',
      effectiveness: 85,
    });
  } else if (method.type === 'sea') {
    recommendations.push({
      name: '沙蚕',
      reason: '海钓万能饵，诱鱼效果好',
      effectiveness: 85,
    });
    
    recommendations.push({
      name: '虾仁',
      reason: '自然饵，目标鱼种广',
      effectiveness: 80,
    });
    
    recommendations.push({
      name: '拟饵',
      reason: '路亚海钓，效率高',
      effectiveness: 75,
    });
  }
  
  return recommendations.sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 4);
}

function calculateOptimalDepth(species: FishSpecies, envData: any): string {
  const [minDepth, maxDepth] = species.optimalDepth;
  const temp = envData.waterTemp;
  const isWarm = temp > species.optimalTemp[1];
  
  if (isWarm) {
    return `${Math.min(maxDepth, maxDepth - 1)}-${maxDepth}米（深水区）`;
  }
  
  const midDepth = Math.round((minDepth + maxDepth) / 2);
  return `${minDepth}-${midDepth}米（中上层）`;
}

function predictNextBestDay(spot: FishingSpot, species: FishSpecies, method: FishingMethod, currentDate: Date) {
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 2);
  
  const envData = generateEnvironmentData(spot.id, nextDate, 24, spot.waterType === 'sea');
  const middayEnv = envData[12];
  const index = calculateFishingIndex(middayEnv, species, method);
  
  return {
    date: `${nextDate.getMonth() + 1}月${nextDate.getDate()}日`,
    score: index.overallScore,
    reason: '预计气压上升，水温适宜，鱼情看好',
  };
}
