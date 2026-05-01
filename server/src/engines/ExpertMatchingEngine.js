const User = require('../models/User');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

class ExpertMatchingEngine {
  constructor(options = {}) {
    this.minMatchScore = options.minMatchScore || parseFloat(process.env.EXPERT_MATCH_MIN_SCORE) || 0.6;
    this.maxExperts = options.maxExperts || parseInt(process.env.EXPERT_MATCH_MAX_EXPERTS) || 5;
    this.config = {
      tagMatchWeight: 0.4,
      domainMatchWeight: 0.3,
      expertiseMatchWeight: 0.2,
      creditScoreWeight: 0.1,
      activityWeightBonus: 0.1
    };
  }

  analyzeQuestionSemantics(question) {
    const { title, content, tags } = question;
    const keywords = this.extractKeywords(title + ' ' + content, tags);
    const domain = this.inferDomain(tags, keywords);
    const complexity = this.assessComplexity(content, tags);
    const entities = this.extractEntities(content);

    return {
      parsedTags: [...(tags || []), ...keywords.slice(0, 5)],
      domain,
      complexity,
      keywords,
      entities,
      intent: this.identifyIntent(title, content)
    };
  }

  extractKeywords(text, existingTags = []) {
    const words = text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const stopWords = ['的', '是', '在', '有', '和', '与', '或', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'this', 'that', 'these', 'those', 'am', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'if', 'because', 'until', 'while', 'about', 'against', 'any', 'if', 'because', 'until', 'while', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under'];

    const wordFreq = {};
    words.forEach(word => {
      if (!stopWords.includes(word) && !existingTags.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  inferDomain(tags, keywords) {
    const domainMapping = {
      'programming': ['javascript', 'python', 'java', 'c++', 'react', 'vue', 'nodejs', '前端', '后端', '编程'],
      'data_science': ['机器学习', '深度学习', '人工智能', 'ai', '数据', '数据分析', 'data', 'machine', 'learning'],
      'business': ['商业', '投资', '金融', '市场', '营销', '管理', 'business', 'finance', 'marketing', 'management'],
      'health': ['健康', '医疗', '医学', '医生', '医院', 'health', 'medical', 'doctor', 'hospital'],
      'education': ['教育', '学习', '考试', '学校', '学生', 'education', 'learning', 'study', 'school', 'student']
    };

    const allTerms = [...(tags || []), ...(keywords || [])].map(t => t.toLowerCase());
    
    for (const [domain, terms] of Object.entries(domainMapping)) {
      const matches = terms.filter(t => allTerms.some(at => at.includes(t) || t.includes(at)));
      if (matches.length >= 2) {
        return domain;
      }
    }

    return 'general';
  }

  assessComplexity(content, tags) {
    const wordCount = content.split(/\s+/).length;
    const technicalTerms = this.countTechnicalTerms(content);
    
    if (wordCount < 50 && technicalTerms < 3) {
      return 'basic';
    } else if (wordCount < 200 && technicalTerms < 8) {
      return 'intermediate';
    } else if (wordCount < 500) {
      return 'advanced';
    } else {
      return 'expert';
    }
  }

  countTechnicalTerms(content) {
    const technicalTerms = [
      'algorithm', 'architecture', 'framework', 'database', 'api', 'protocol',
      'algorithm', 'authentication', 'authorization', 'encryption', 'compiler',
      'interpreter', 'virtualization', 'containerization', 'microservices',
      'kubernetes', 'docker', 'cloud', '分布式', '微服务', '架构', '算法',
      '数据库', '接口', '协议', '认证', '授权', '加密', '编译', '容器'
    ];
    
    return technicalTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    ).length;
  }

  extractEntities(content) {
    const entities = [];
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlPattern) || [];
    urls.forEach(url => {
      entities.push({ name: url, type: 'url', relevance: 0.7 });
    });

    const numberPattern = /\d+(?:\.\d+)?(?:%|美元|人民币|元|点|积分)?/g;
    const numbers = content.match(numberPattern) || [];
    numbers.forEach(num => {
      entities.push({ name: num, type: 'number', relevance: 0.5 });
    });

    return entities;
  }

  identifyIntent(title, content) {
    const intentKeywords = {
      'how_to': ['怎么', '如何', '怎样', 'how to', 'how do', '步骤', '方法'],
      'why': ['为什么', '为何', '原因', 'why', 'reason'],
      'what': ['什么是', '请问', '解释一下', '什么', 'what is', 'explain'],
      'comparison': ['比较', '对比', '区别', '哪个好', 'vs', 'versus', 'difference', 'better'],
      'recommendation': ['推荐', '建议', '选哪个', '哪个更好', 'recommend', 'suggest', 'advice']
    };

    const fullText = (title + ' ' + content).toLowerCase();
    
    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(kw => fullText.includes(kw.toLowerCase()))) {
        return intent;
      }
    }

    return 'general_inquiry';
  }

  async findMatchingExperts(question, semanticAnalysis) {
    const { domain, parsedTags, keywords, complexity } = semanticAnalysis;
    
    const expertCandidates = await User.find({
      role: { $in: ['expert', 'answerer'] },
      status: 'active',
      'notificationPreferences.expertMatch': true
    }).lean();

    const scoredExperts = expertCandidates.map(expert => {
      const score = this.calculateMatchScore(expert, question, semanticAnalysis);
      return {
        expert,
        score,
        matchDetails: this.getMatchDetails(expert, question, semanticAnalysis)
      };
    });

    scoredExperts.sort((a, b) => b.score - a.score);

    const qualifiedExperts = scoredExperts.filter(e => e.score >= this.minMatchScore);
    
    return qualifiedExperts.slice(0, this.maxExperts);
  }

  calculateMatchScore(expert, question, semanticAnalysis) {
    let score = 0;
    const { domain, parsedTags, keywords, complexity } = semanticAnalysis;
    const expertise = expert.profile?.expertise || [];
    const creditScore = expert.creditScore || 100;
    const activityWeight = expert.activityWeight || 1.0;

    const normalizedCredit = Math.min(creditScore / 1000, 1);

    const tagMatches = parsedTags.filter(tag => 
      expertise.some(exp => exp.toLowerCase().includes(tag.toLowerCase()))
    ).length;
    if (tagMatches > 0) {
      score += (tagMatches / Math.max(parsedTags.length, 1)) * this.config.tagMatchWeight;
    }

    const domainKeywords = {
      'programming': ['javascript', 'python', 'java', '前端', '后端', '开发'],
      'data_science': ['机器学习', '深度学习', '人工智能', '数据分析'],
      'business': ['商业', '金融', '市场', '营销', '管理'],
      'health': ['医疗', '健康', '医学'],
      'education': ['教育', '学习', '考试']
    };

    const domainKeywordsList = domainKeywords[domain] || [];
    const domainMatches = domainKeywordsList.filter(kw => 
      expertise.some(exp => exp.toLowerCase().includes(kw.toLowerCase()))
    ).length;
    if (domainMatches > 0) {
      score += (domainMatches / Math.max(domainKeywordsList.length, 1)) * this.config.domainMatchWeight;
    }

    const keywordMatches = keywords.filter(kw => 
      expertise.some(exp => exp.toLowerCase().includes(kw.toLowerCase()))
    ).length;
    if (keywordMatches > 0) {
      score += (keywordMatches / Math.max(keywords.length, 1)) * this.config.expertiseMatchWeight;
    }

    score += normalizedCredit * this.config.creditScoreWeight;

    if (activityWeight > 1.0) {
      score += Math.min(activityWeight - 1, 1) * this.config.activityWeightBonus;
    }

    return Math.min(score, 1.0);
  }

  getMatchDetails(expert, question, semanticAnalysis) {
    const { domain, parsedTags, keywords } = semanticAnalysis;
    const expertise = expert.profile?.expertise || [];

    return {
      matchingTags: parsedTags.filter(tag => 
        expertise.some(exp => exp.toLowerCase().includes(tag.toLowerCase()))
      ),
      matchingKeywords: keywords.filter(kw => 
        expertise.some(exp => exp.toLowerCase().includes(kw.toLowerCase()))
      ),
      domainMatch: this.checkDomainMatch(domain, expertise),
      expertExpertise: expertise,
      creditScore: expert.creditScore,
      activityWeight: expert.activityWeight
    };
  }

  checkDomainMatch(domain, expertise) {
    const domainKeywords = {
      'programming': ['javascript', 'python', 'java', '前端', '后端', '开发', 'react', 'vue', 'node'],
      'data_science': ['机器学习', '深度学习', '人工智能', '数据分析', '数据科学', 'ai', 'ml'],
      'business': ['商业', '金融', '市场', '营销', '管理', '投资', '财务'],
      'health': ['医疗', '健康', '医学', '医生', '护理'],
      'education': ['教育', '学习', '考试', '教学', '培训']
    };

    const keywords = domainKeywords[domain] || [];
    return keywords.some(kw => 
      expertise.some(exp => exp.toLowerCase().includes(kw.toLowerCase()))
    );
  }

  async notifyMatchingExperts(question, matchedExperts) {
    const notifications = [];

    for (const { expert, score, matchDetails } of matchedExperts) {
      const notification = new Notification({
        notificationId: uuidv4(),
        recipient: expert._id,
        notificationType: 'expert_match',
        priority: score > 0.8 ? 'high' : 'normal',
        title: `您有新的问题匹配 - ${question.title.substring(0, 50)}...`,
        content: `系统检测到您的专业领域与问题"${question.title}"高度匹配。匹配度: ${(score * 100).toFixed(1)}%。`,
        data: {
          questionId: question.questionId,
          expertMatchScore: score,
          matchedExpertCount: matchedExperts.length,
          additionalData: matchDetails
        },
        relatedEntity: {
          type: 'Question',
          id: question._id
        },
        channels: ['in_app', 'email'],
        source: 'system'
      });

      await notification.save();
      notifications.push(notification);
    }

    return notifications;
  }

  async processQuestionMatch(question) {
    const semanticAnalysis = this.analyzeQuestionSemantics(question);

    question.semanticAnalysis = semanticAnalysis;
    await question.save();

    const matchedExperts = await this.findMatchingExperts(question, semanticAnalysis);

    if (matchedExperts.length > 0) {
      question.matchedExperts = matchedExperts.map(({ expert, score }) => ({
        expert: expert._id,
        matchScore: score,
        notifiedAt: new Date(),
        responseStatus: 'pending'
      }));

      question.status = 'pending_response';
      question.workflowStatus = 'processing_ticket';

      await this.notifyMatchingExperts(question, matchedExperts);
    } else {
      question.status = 'published';
      question.workflowStatus = 'processing_ticket';
    }

    await question.save();

    return {
      question,
      semanticAnalysis,
      matchedExperts,
      notificationsSent: matchedExperts.length
    };
  }
}

module.exports = ExpertMatchingEngine;
