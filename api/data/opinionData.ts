import type {
  PublicOpinionSummary,
  HeatTrendItem,
  SpreadGraph,
  SensitiveWord,
} from '../../shared/types';
import { generateId, getRandomInt } from './utils';

const hotTopics = [
  '徐州地铁4号线开通',
  '2024高考政策解读',
  '老旧小区改造进展',
  '汉文化旅游节',
  '营商环境优化',
  '一刻钟便民生活圈',
  '社区食堂建设',
  '人才引进政策',
  '医保政策调整',
  '安全生产检查',
];

export const mockOpinionSummary: PublicOpinionSummary = {
  heatIndex: 72.5,
  trend: 'up',
  hotTopics: hotTopics.map((topic, index) => ({
    topic,
    heat: Math.round(10000 - index * 800 + getRandomInt(-200, 200)),
    trend: getRandomInt(-15, 25),
  })),
  totalMentions: 128654,
  positiveRate: 68.3,
};

const days = 7;
export const mockHeatTrend: HeatTrendItem[] = Array.from({ length: days }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1 - i));
  return {
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    heat: 50 + getRandomInt(-20, 40) + i * 3,
  };
});

export const mockSpreadGraph: SpreadGraph = {
  nodes: [
    { id: 'n1', name: '新闻首发', type: 'source', value: 100 },
    { id: 'n2', name: '本地论坛A', type: 'relay', value: 75 },
    { id: 'n3', name: '本地论坛B', type: 'relay', value: 65 },
    { id: 'n4', name: '微信公众号', type: 'relay', value: 85 },
    { id: 'n5', name: '微博大V', type: 'relay', value: 70 },
    { id: 'n6', name: '抖音号', type: 'relay', value: 90 },
    { id: 'n7', name: '用户评论1', type: 'comment', value: 30 },
    { id: 'n8', name: '用户评论2', type: 'comment', value: 25 },
    { id: 'n9', name: '用户评论3', type: 'comment', value: 20 },
    { id: 'n10', name: '用户评论4', type: 'comment', value: 35 },
    { id: 'n11', name: '二次传播', type: 'relay', value: 45 },
    { id: 'n12', name: '网友讨论', type: 'comment', value: 28 },
  ],
  links: [
    { source: 'n1', target: 'n2', value: 50 },
    { source: 'n1', target: 'n3', value: 40 },
    { source: 'n1', target: 'n4', value: 60 },
    { source: 'n1', target: 'n6', value: 55 },
    { source: 'n2', target: 'n5', value: 35 },
    { source: 'n4', target: 'n7', value: 20 },
    { source: 'n4', target: 'n8', value: 18 },
    { source: 'n5', target: 'n9', value: 15 },
    { source: 'n6', target: 'n10', value: 25 },
    { source: 'n3', target: 'n11', value: 30 },
    { source: 'n11', target: 'n12', value: 22 },
  ],
};

const sensitiveWordCategories = ['政治敏感', '暴力色情', '虚假信息', '广告营销', '侮辱谩骂'];
const sensitiveLevels: SensitiveWord['level'][] = ['low', 'medium', 'high'];

const words = [
  '违禁词示例1',
  '敏感词示例2',
  '广告推销',
  '虚假宣传',
  '侮辱性词汇',
  '低俗用语',
  '谣言关键词',
  '诈骗话术',
  '赌博推广',
  '药品广告',
  '医疗夸大',
  '金融诈骗',
  '招聘骗局',
  '钓鱼链接',
  '恶意软件',
  '黑客技术',
  '盗版资源',
  '侵权内容',
  '隐私泄露',
  '网络暴力',
];

export const mockSensitiveWords: SensitiveWord[] = words.map((word, index) => ({
  id: `sw_${index + 1}`,
  word,
  category: sensitiveWordCategories[index % sensitiveWordCategories.length],
  level: sensitiveLevels[index % sensitiveLevels.length],
  createTime: `2024-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')} 10:00:00`,
}));
