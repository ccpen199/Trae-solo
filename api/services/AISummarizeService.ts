import type { AISummary, WorkTicket } from '../types/index.js';

export class AISummarizeService {
  private readonly categoryKeywords: Record<string, string[]> = {
    repair: ['维修', '修理', '坏了', '故障', '漏水', '漏电', '断', '不通', '无法', '不亮', '不响', '空调', '冰箱', '洗衣机', '灯', '水管', '电路'],
    complaint: ['投诉', '不满', '问题', '差', '糟糕', '乱', '脏', '吵', '臭', '不方便', '太慢', '态度'],
    suggestion: ['建议', '希望', '能不能', '可以', '增加', '减少', '改善', '改进', '优化', '提升'],
    service: ['服务', '帮忙', '协助', '申请', '办理', '开通', '预约', '上门', '配送', '安装'],
  };

  private readonly sentimentKeywords = {
    positive: ['好', '满意', '感谢', '棒', '赞', '快', '及时', '专业', '周到', '热心', '耐心', '优秀'],
    negative: ['差', '慢', '糟', '坏', '不满', '投诉', '愤怒', '生气', '失望', '糟糕', '恶劣', '推卸'],
  };

  public summarizeText(text: string): AISummary {
    const summary = this.generateSummary(text);
    const keyPoints = this.extractKeyPoints(text);
    const category = this.classifyCategory(text);
    const sentiment = this.analyzeSentiment(text);

    return {
      summary,
      key_points: keyPoints,
      category,
      sentiment,
    };
  }

  public summarizeTicket(ticket: WorkTicket): AISummary {
    const fullText = `${ticket.title}。${ticket.description}`;
    const result = this.summarizeText(fullText);
    
    const suggestedSkills = this.suggestRequiredSkills(ticket);
    if (suggestedSkills.length > 0) {
      result.key_points.push(`建议技能: ${suggestedSkills.join('、')}`);
    }

    return result;
  }

  public batchSummarize(texts: string[]): AISummary[] {
    return texts.map(text => this.summarizeText(text));
  }

  public summarize(text: string, type: string = 'general'): AISummary {
    return this.summarizeText(text);
  }

  public extractKeywords(text: string, limit: number = 10): string[] {
    const allKeywords = [
      ...this.categoryKeywords.repair,
      ...this.categoryKeywords.complaint,
      ...this.categoryKeywords.suggestion,
      ...this.categoryKeywords.service,
    ];
    const found = allKeywords.filter(k => text.includes(k));
    const unique = [...new Set(found)];
    return unique.slice(0, limit);
  }

  public generateReply(message: string, context?: string): string {
    const summary = this.summarizeText(message + (context || ''));
    return this.generateAutoReply(summary);
  }

  public generateAutoReply(summary: AISummary): string {
    const templates = {
      positive: `感谢您的${summary.category === 'suggestion' ? '宝贵建议' : '反馈'}！我们会认真考虑并持续改进服务质量。`,
      negative: `非常抱歉给您带来了不好的体验。我们已记录您的问题，相关负责人会尽快处理并与您联系。`,
      neutral: `您的${summary.category === 'suggestion' ? '建议' : summary.category === 'complaint' ? '反馈' : '需求'}已收到，我们会尽快处理。`,
    };

    return templates[summary.sentiment];
  }

  private generateSummary(text: string): string {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length <= 50) {
      return cleanText;
    }

    const sentences = cleanText.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 1) {
      return this.truncateText(cleanText, 100);
    }

    const scoredSentences = sentences.map((sentence, index) => ({
      sentence: sentence.trim(),
      score: this.scoreSentence(sentence, index, sentences.length),
    }));

    scoredSentences.sort((a, b) => b.score - a.score);
    
    const topSentences = scoredSentences
      .slice(0, Math.min(3, sentences.length))
      .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence));

    return topSentences.map(s => s.sentence).join('。') + '。';
  }

  private scoreSentence(sentence: string, index: number, total: number): number {
    let score = 0;

    if (index === 0) score += 3;
    if (index === total - 1) score += 2;

    const length = sentence.length;
    if (length > 15 && length < 80) score += 2;

    const importantWords = ['需要', '请求', '希望', '问题', '紧急', '尽快', '谢谢', '感谢'];
    importantWords.forEach(word => {
      if (sentence.includes(word)) score += 1;
    });

    const numberPattern = /\d+/;
    if (numberPattern.test(sentence)) score += 1;

    return score;
  }

  private extractKeyPoints(text: string): string[] {
    const keyPoints: string[] = [];
    const cleanText = text.replace(/\s+/g, ' ').trim();

    const timePattern = /(\d{1,2}[月日点时]|今天|明天|后天|上午|下午|晚上)/g;
    const times = cleanText.match(timePattern);
    if (times && times.length > 0) {
      keyPoints.push(`时间: ${[...new Set(times)].join('、')}`);
    }

    const locationPattern = /(\d+号楼|\d+单元|\d+层|\d+室|小区|门口|大堂|电梯|楼道|停车场|花园|广场)/g;
    const locations = cleanText.match(locationPattern);
    if (locations && locations.length > 0) {
      keyPoints.push(`位置: ${[...new Set(locations)].join('、')}`);
    }

    const contactPattern = /(1\d{10}|电话|手机|联系)/g;
    const contacts = cleanText.match(contactPattern);
    if (contacts && contacts.length > 0) {
      keyPoints.push('涉及联系信息');
    }

    const urgencyWords = ['紧急', '尽快', '马上', '立刻', '现在'];
    const hasUrgency = urgencyWords.some(word => cleanText.includes(word));
    if (hasUrgency) {
      keyPoints.push('标注: 紧急事项');
    }

    const actionWords = ['维修', '更换', '安装', '清理', '协调', '处理'];
    const actions = actionWords.filter(word => cleanText.includes(word));
    if (actions.length > 0) {
      keyPoints.push(`需求: ${actions.join('、')}`);
    }

    return keyPoints.slice(0, 5);
  }

  private classifyCategory(text: string): string {
    const scores: Record<string, number> = {
      repair: 0,
      complaint: 0,
      suggestion: 0,
      service: 0,
    };

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          scores[category]++;
        }
      }
    }

    const maxScore = Math.max(...Object.values(scores));
    
    if (maxScore === 0) {
      return 'service';
    }

    const topCategories = Object.entries(scores)
      .filter(([, score]) => score === maxScore)
      .map(([category]) => category);

    return topCategories[0];
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    let positiveScore = 0;
    let negativeScore = 0;

    for (const keyword of this.sentimentKeywords.positive) {
      if (text.includes(keyword)) {
        positiveScore++;
      }
    }

    for (const keyword of this.sentimentKeywords.negative) {
      if (text.includes(keyword)) {
        negativeScore++;
      }
    }

    const exclamationCount = (text.match(/[！!]/g) || []).length;
    const questionCount = (text.match(/[？?]/g) || []).length;
    
    if (negativeScore > 0 && exclamationCount > 1) {
      negativeScore += 1;
    }

    if (positiveScore > negativeScore) {
      return 'positive';
    } else if (negativeScore > positiveScore) {
      return 'negative';
    }

    if (questionCount > 2) {
      return 'negative';
    }

    return 'neutral';
  }

  private suggestRequiredSkills(ticket: WorkTicket): string[] {
    const skills: string[] = [];
    const fullText = `${ticket.title} ${ticket.description}`.toLowerCase();

    if (ticket.type === 'repair') {
      if (fullText.includes('水') || fullText.includes('水管') || fullText.includes('漏水')) {
        skills.push('管道疏通');
      }
      if (fullText.includes('电') || fullText.includes('灯') || fullText.includes('插座')) {
        skills.push('水电维修');
      }
      if (fullText.includes('门') || fullText.includes('窗') || fullText.includes('锁')) {
        skills.push('门窗维修');
      }
      if (fullText.includes('空调') || fullText.includes('冰箱') || fullText.includes('洗衣机')) {
        skills.push('家电维修');
      }
      if (fullText.includes('网络') || fullText.includes('wifi')) {
        skills.push('网络维护');
      }
    }

    if (fullText.includes('垃圾') || fullText.includes('卫生') || fullText.includes('清洁')) {
      skills.push('保洁服务');
    }

    if (fullText.includes('绿化') || fullText.includes('花草')) {
      skills.push('绿化养护');
    }

    if (fullText.includes('电梯') || fullText.includes('消防') || fullText.includes('公共')) {
      skills.push('公共设施');
    }

    return skills;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}

export default AISummarizeService;
