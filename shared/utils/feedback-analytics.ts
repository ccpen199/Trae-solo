import type { ServiceFeedback, FeedbackCluster } from '../types';

interface TextVector {
  [word: string]: number;
}

const STOP_WORDS = new Set([
  '的', '了', '和', '是', '在', '我', '有', '要', '可以', '就', '都', '也', '还',
  '你', '他', '她', '它', '这个', '那个', '什么', '怎么', '为什么', '因为', '所以',
  '但是', '就是', '还是', '或者', '以及', '等', '等等', '啊', '吧', '呢', '吗',
  '很', '非常', '特别', '比较', '太', '真的', '感觉', '觉得', '去', '到', '来'
]);

function tokenize(text: string): string[] {
  const cleaned = text.replace(/[，。！？、；：""''（）【】《》\n\r\t.,!?;:\'\"()\[\]<>\\/\\-]/g, ' ');
  const words: string[] = [];

  for (let n = 4; n >= 2; n--) {
    for (let i = 0; i <= cleaned.length - n; i++) {
      const gram = cleaned.substring(i, i + n).trim();
      if (gram.length >= 2 && !STOP_WORDS.has(gram) && /[\u4e00-\u9fa5]/.test(gram)) {
        words.push(gram);
      }
    }
  }

  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  return Array.from(wordFreq.entries())
    .filter(([, freq]) => freq >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word);
}

function textToVector(text: string, vocabulary: string[]): TextVector {
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);
  const vector: TextVector = {};

  for (const word of vocabulary) {
    vector[word] = tokenSet.has(word) ? 1 : 0;
  }

  return vector;
}

function cosineSimilarity(v1: TextVector, v2: TextVector): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const key of Object.keys(v1)) {
    const a = v1[key] || 0;
    const b = v2[key] || 0;
    dotProduct += a * b;
    norm1 += a * a;
    norm2 += b * b;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

function buildVocabulary(texts: string[]): string[] {
  const allTokens: string[] = [];
  for (const text of texts) {
    allTokens.push(...tokenize(text));
  }

  const wordFreq = new Map<string, number>();
  for (const token of allTokens) {
    wordFreq.set(token, (wordFreq.get(token) || 0) + 1);
  }

  return Array.from(wordFreq.entries())
    .filter(([, freq]) => freq >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
    .map(([word]) => word);
}

export function clusterFeedbacks(
  feedbacks: ServiceFeedback[],
  similarityThreshold: number = 0.6
): FeedbackCluster[] {
  if (feedbacks.length === 0) return [];

  const negativeFeedbacks = feedbacks.filter(f => f.rating <= 3);
  if (negativeFeedbacks.length === 0) return [];

  const texts = negativeFeedbacks.map(f => `${f.content} ${f.tags.join(' ')}`);
  const vocabulary = buildVocabulary(texts);
  const vectors = texts.map(t => textToVector(t, vocabulary));

  const clusters: { center: number; members: number[] }[] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < negativeFeedbacks.length; i++) {
    if (assigned.has(i)) continue;

    let bestCluster = -1;
    let bestSimilarity = 0;

    for (let c = 0; c < clusters.length; c++) {
      const cluster = clusters[c];
      const similarities = cluster.members.map(m => cosineSimilarity(vectors[i], vectors[m]));
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

      if (avgSimilarity > bestSimilarity && avgSimilarity >= similarityThreshold) {
        bestSimilarity = avgSimilarity;
        bestCluster = c;
      }
    }

    if (bestCluster >= 0) {
      clusters[bestCluster].members.push(i);
      assigned.add(i);
    } else {
      clusters.push({ center: i, members: [i] });
      assigned.add(i);
    }
  }

  const now = new Date().toISOString();
  const result: FeedbackCluster[] = [];

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    if (cluster.members.length < 2) continue;

    const memberFeedbacks = cluster.members.map(idx => negativeFeedbacks[idx]);
    const allText = memberFeedbacks.map(f => f.content).join(' ');
    const keywords = extractTopKeywords(allText, 5);
    const avgRating = memberFeedbacks.reduce((sum, f) => sum + f.rating, 0) / memberFeedbacks.length;

    result.push({
      id: `cluster-${Date.now()}-${i}`,
      name: generateClusterName(keywords, memberFeedbacks),
      category: analyzeClusterCategory(keywords, memberFeedbacks),
      keywords,
      feedbackIds: memberFeedbacks.map(f => f.id),
      count: memberFeedbacks.length,
      avgRating: Math.round(avgRating * 100) / 100,
      trend: 'stable',
      createTime: now,
      lastUpdateTime: now,
      status: 'open',
      suggestion: generateSuggestion(keywords, memberFeedbacks)
    });
  }

  return result.sort((a, b) => b.count - a.count);
}

function extractTopKeywords(text: string, topN: number): string[] {
  const tokens = tokenize(text);
  const freq = new Map<string, number>();

  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

function generateClusterName(keywords: string[], feedbacks: ServiceFeedback[]): string {
  const commonTags = new Map<string, number>();
  for (const f of feedbacks) {
    for (const tag of f.tags) {
      commonTags.set(tag, (commonTags.get(tag) || 0) + 1);
    }
  }

  const topTag = Array.from(commonTags.entries()).sort((a, b) => b[1] - a[1])[0];

  if (topTag && topTag[1] >= feedbacks.length * 0.5) {
    return `${topTag[0]}问题`;
  }

  if (keywords.length > 0) {
    return `「${keywords.slice(0, 3).join('、')}」相关问题`;
  }

  return `综合问题聚类`;
}

function analyzeClusterCategory(keywords: string[], feedbacks: ServiceFeedback[]): string {
  const categoryMap: Record<string, string[]> = {
    '效率问题': ['慢', '效率', '等待', '时间', '久', '排队'],
    '态度问题': ['态度', '服务', '不好', '差', '恶劣', '不耐烦'],
    '流程问题': ['流程', '复杂', '麻烦', '繁琐', '步骤', '材料'],
    '系统问题': ['系统', '网站', 'app', '打不开', '登录', '错误', '崩溃'],
    '沟通问题': ['电话', '联系', '不接', '没人', '回复', '沟通'],
    '材料问题': ['材料', '证明', '文件', '缺少', '复印件', '原件']
  };

  for (const [category, patterns] of Object.entries(categoryMap)) {
    for (const pattern of patterns) {
      if (keywords.some(k => k.includes(pattern))) {
        return category;
      }
    }
  }

  return '其他问题';
}

function generateSuggestion(keywords: string[], feedbacks: ServiceFeedback[]): string {
  const avgRating = feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length;
  const count = feedbacks.length;

  let suggestion = `共收集${count}条差评，平均评分${avgRating.toFixed(1)}星。`;

  if (keywords.includes('效率') || keywords.includes('慢')) {
    suggestion += '建议优化办事流程，减少审批环节，提升线上办理效率。';
  } else if (keywords.includes('态度') || keywords.includes('服务')) {
    suggestion += '建议加强窗口服务人员培训，建立服务质量考核机制。';
  } else if (keywords.includes('系统') || keywords.includes('登录')) {
    suggestion += '建议排查系统稳定性问题，优化服务器性能，加强用户体验测试。';
  } else if (keywords.includes('材料') || keywords.includes('流程')) {
    suggestion += '建议精简办事材料清单，推进数据共享，减少重复提交。';
  } else {
    suggestion += '建议深入调研用户具体诉求，制定针对性改进方案。';
  }

  return suggestion;
}

export function analyzeFeedbackTrend(
  feedbacks: ServiceFeedback[],
  periodDays: number = 30
): { date: string; avgRating: number; count: number; negativeCount: number }[] {
  const result: { date: string; avgRating: number; count: number; negativeCount: number }[] = [];
  const now = new Date();

  for (let i = periodDays - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayFeedbacks = feedbacks.filter(f => {
      const fDate = new Date(f.createTime).toISOString().split('T')[0];
      return fDate === dateStr;
    });

    const count = dayFeedbacks.length;
    const avgRating = count > 0
      ? dayFeedbacks.reduce((s, f) => s + f.rating, 0) / count
      : 0;
    const negativeCount = dayFeedbacks.filter(f => f.rating <= 3).length;

    result.push({
      date: dateStr,
      avgRating: Math.round(avgRating * 100) / 100,
      count,
      negativeCount
    });
  }

  return result;
}

export function generateWorkOrderFromFeedback(feedback: ServiceFeedback): {
  title: string;
  type: 'complaint' | 'suggestion' | 'consultation' | 'supervision';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  deadline: string;
} {
  const now = new Date();

  const ratingPriorityMap: Record<number, 'low' | 'medium' | 'high' | 'urgent'> = {
    1: 'urgent',
    2: 'high',
    3: 'medium',
    4: 'low',
    5: 'low'
  };

  let priority = ratingPriorityMap[feedback.rating] || 'medium';

  const urgentKeywords = ['投诉', '举报', '违法', '违规', '严重', '损失', '腐败', '乱收费'];
  for (const keyword of urgentKeywords) {
    if (feedback.content.includes(keyword) || feedback.tags.some(t => t.includes(keyword))) {
      priority = 'urgent';
      break;
    }
  }

  const deadlineDays = priority === 'urgent' ? 1 : priority === 'high' ? 3 : priority === 'medium' ? 7 : 15;
  const deadline = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000);

  return {
    title: `【差评督办】${feedback.serviceName} - ${feedback.rating}星差评`,
    type: feedback.rating <= 3 ? 'complaint' : 'suggestion',
    priority,
    tags: [...feedback.tags, `评分${feedback.rating}星`, '自动转办'],
    deadline: deadline.toISOString()
  };
}
