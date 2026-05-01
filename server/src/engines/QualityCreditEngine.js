const User = require('../models/User');
const CreditRecord = require('../models/CreditRecord');
const Vote = require('../models/Vote');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

class QualityCreditEngine {
  constructor(options = {}) {
    this.config = {
      baseScore: parseFloat(options.baseScore || process.env.CREDIT_BASE_SCORE || 100),
      minScore: 0,
      maxScore: 1000,
      voteWeight: parseFloat(options.voteWeight || process.env.CREDIT_VOTE_WEIGHT || 0.5),
      answerWeight: parseFloat(options.answerWeight || process.env.CREDIT_ANSWER_WEIGHT || 2.0),
      acceptedWeight: parseFloat(options.acceptedWeight || process.env.CREDIT_ACCEPTED_WEIGHT || 10.0),
      fraudPenalty: 50,
      plagiarismPenalty: 100,
      suspiciousActivityWeight: 2.0
    };

    this.creditRules = {
      question_posted: { weight: 0.5, operation: 'add', reason: '发布问题' },
      answer_posted: { weight: 1.0, operation: 'add', reason: '发布回答' },
      answer_accepted: { weight: 10.0, operation: 'add', reason: '回答被采纳' },
      vote_received_up: { weight: 0.5, operation: 'add', reason: '收到赞同票' },
      vote_received_down: { weight: -1.0, operation: 'subtract', reason: '收到反对票' },
      content_quality: { weight: 5.0, operation: 'add', reason: '内容质量优秀' },
      plagiarism_detected: { weight: -100.0, operation: 'subtract', reason: '检测到抄袭' },
      suspicious_activity: { weight: -20.0, operation: 'subtract', reason: '可疑行为' },
      moderation_warning: { weight: -30.0, operation: 'subtract', reason: '内容违规警告' },
      moderation_ban: { weight: -200.0, operation: 'subtract', reason: '内容违规封禁' },
      bonus: { weight: 20.0, operation: 'add', reason: '系统奖励' },
      knowledge_contribution: { weight: 15.0, operation: 'add', reason: '知识库贡献' },
      expert_engagement: { weight: 8.0, operation: 'add', reason: '专家积极响应' }
    };
  }

  calculateLevel(score) {
    const levels = [
      { level: 'bronze', min: 0, max: 199 },
      { level: 'silver', min: 200, max: 399 },
      { level: 'gold', min: 400, max: 599 },
      { level: 'platinum', min: 600, max: 799 },
      { level: 'diamond', min: 800, max: 1000 }
    ];
    
    for (const { level, min, max } of levels) {
      if (score >= min && score <= max) {
        return level;
      }
    }
    return 'bronze';
  }

  async applyCreditRule(userId, ruleType, options = {}) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const rule = this.creditRules[ruleType];
    if (!rule) {
      throw new Error(`Unknown credit rule: ${ruleType}`);
    }

    const baseAmount = rule.weight;
    const amountMultiplier = options.multiplier || 1.0;
    const calculatedAmount = baseAmount * amountMultiplier;

    const previousScore = user.creditScore;
    const previousLevel = user.creditLevel;

    let newScore;
    if (rule.operation === 'add') {
      newScore = Math.min(previousScore + calculatedAmount, this.config.maxScore);
    } else if (rule.operation === 'subtract') {
      newScore = Math.max(previousScore + calculatedAmount, this.config.minScore);
    } else if (rule.operation === 'set') {
      newScore = Math.max(Math.min(calculatedAmount, this.config.maxScore), this.config.minScore);
    } else {
      newScore = previousScore;
    }

    const newLevel = this.calculateLevel(newScore);

    const creditRecord = new CreditRecord({
      recordId: uuidv4(),
      user: userId,
      recordType: ruleType,
      operation: rule.operation,
      amount: calculatedAmount,
      previousScore,
      newScore,
      previousLevel,
      newLevel,
      reason: options.reason || rule.reason,
      relatedEntity: options.relatedEntity,
      source: options.source || 'system',
      weight: options.weight || 1.0,
      isManualOverride: options.isManualOverride || false,
      overrideBy: options.overrideBy,
      overrideReason: options.overrideReason,
      metadata: {
        ruleApplied: ruleType,
        ruleVersion: '1.0',
        calculationDetails: {
          baseAmount,
          amountMultiplier,
          calculatedAmount,
          operation: rule.operation
        },
        riskScore: options.riskScore,
        indicators: options.indicators
      }
    });

    await creditRecord.save();

    user.creditScore = newScore;
    user.creditLevel = newLevel;

    if (newScore < 50 && user.status === 'active') {
      user.status = 'suspended';
    }

    await user.save();

    await this.notifyCreditChange(user, creditRecord, previousScore, newScore);

    return {
      user: {
        id: user._id,
        username: user.username,
        previousScore,
        newScore,
        previousLevel,
        newLevel
      },
      creditRecord,
      levelUp: newLevel !== previousLevel && this.isLevelHigher(newLevel, previousLevel),
      levelDown: newLevel !== previousLevel && !this.isLevelHigher(newLevel, previousLevel)
    };
  }

  isLevelHigher(newLevel, previousLevel) {
    const levelOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    return levelOrder.indexOf(newLevel) > levelOrder.indexOf(previousLevel);
  }

  async notifyCreditChange(user, creditRecord, previousScore, newScore) {
    const scoreChange = newScore - previousScore;
    const isPositive = scoreChange > 0;

    const notification = new Notification({
      notificationId: uuidv4(),
      recipient: user._id,
      notificationType: 'credit_update',
      priority: isPositive ? 'normal' : 'high',
      title: isPositive ? '信用分提升通知' : '信用分变动提醒',
      content: this.generateCreditNotificationContent(user, creditRecord, scoreChange),
      data: {
        creditRecordId: creditRecord.recordId,
        previousScore,
        newScore,
        scoreChange,
        recordType: creditRecord.recordType
      },
      relatedEntity: {
        type: 'CreditRecord',
        id: creditRecord._id
      },
      channels: ['in_app'],
      source: 'system'
    });

    await notification.save();
  }

  generateCreditNotificationContent(user, creditRecord, scoreChange) {
    const isPositive = scoreChange > 0;
    const absChange = Math.abs(scoreChange);
    
    if (isPositive) {
      return `您的信用分提升了 ${absChange.toFixed(1)} 分。原因：${creditRecord.reason}。当前信用分：${creditRecord.newScore.toFixed(1)}`;
    } else {
      return `您的信用分下降了 ${absChange.toFixed(1)} 分。原因：${creditRecord.reason}。当前信用分：${creditRecord.newScore.toFixed(1)}。请注意维护良好的社区行为。`;
    }
  }

  async updateActivityWeight(userId, options = {}) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const answersLast30Days = await Answer.countDocuments({
      author: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const acceptedAnswers = await Answer.countDocuments({
      author: userId,
      isAccepted: true,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const votesReceived = await Vote.aggregate([
      {
        $match: {
          targetType: 'answer',
          'metadata.createdAt': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $lookup: {
          from: 'answers',
          localField: 'targetId',
          foreignField: '_id',
          as: 'answer'
        }
      },
      {
        $match: {
          'answer.author': userId
        }
      },
      {
        $group: {
          _id: '$voteType',
          count: { $sum: 1 }
        }
      }
    ]);

    const upvotes = votesReceived.find(v => v._id === 'upvote')?.count || 0;
    const downvotes = votesReceived.find(v => v._id === 'downvote')?.count || 0;

    let activityScore = 1.0;

    activityScore += Math.min(answersLast30Days * 0.05, 0.5);
    activityScore += Math.min(acceptedAnswers * 0.1, 0.5);
    activityScore += Math.min(upvotes * 0.02, 0.3);
    activityScore -= Math.min(downvotes * 0.1, 0.3);

    if (user.creditScore > 600) {
      activityScore += 0.2;
    }

    activityScore = Math.max(0, Math.min(activityScore, 5.0));

    user.activityWeight = activityScore;
    await user.save();

    return {
      userId: user._id,
      activityWeight: activityScore,
      metrics: {
        answersLast30Days,
        acceptedAnswers,
        upvotes,
        downvotes,
        creditScore: user.creditScore
      }
    };
  }

  async detectPlagiarism(answer) {
    const content = answer.content.toLowerCase();
    const plagiarismIndicators = [];
    let plagiarismScore = 0;

    const suspiciousPatterns = [
      { pattern: /http[s]?:\/\/[^\s]+/g, reason: '包含外部链接' },
      { pattern: /复制|粘贴|抄袭|搬运|转帖/g, reason: '包含抄袭相关词汇' }
    ];

    for (const { pattern, reason } of suspiciousPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        plagiarismIndicators.push({
          pattern: pattern.toString(),
          matches: matches.length,
          reason
        });
        plagiarismScore += matches.length * 5;
      }
    }

    const wordCount = content.split(/\s+/).length;
    const uniqueWords = new Set(content.split(/\s+/)).size;
    const uniquenessRatio = uniqueWords / Math.max(wordCount, 1);

    if (uniquenessRatio < 0.3) {
      plagiarismIndicators.push({
        reason: '内容重复度过高',
        uniquenessRatio
      });
      plagiarismScore += 20;
    }

    const existingAnswers = await Answer.find({
      question: answer.question,
      _id: { $ne: answer._id }
    }).limit(20);

    for (const existingAnswer of existingAnswers) {
      const similarity = this.calculateContentSimilarity(
        content,
        existingAnswer.content.toLowerCase()
      );
      
      if (similarity > 0.8) {
        plagiarismIndicators.push({
          reason: '与已有回答高度相似',
          similarAnswerId: existingAnswer._id,
          similarity
        });
        plagiarismScore += 30;
      }
    }

    const isPlagiarized = plagiarismScore >= 40;

    return {
      isPlagiarized,
      plagiarismScore: Math.min(plagiarismScore, 100),
      indicators: plagiarismIndicators,
      plagiarizedFrom: plagiarismIndicators
        .filter(i => i.similarAnswerId)
        .map(i => i.similarAnswerId.toString())
    };
  }

  calculateContentSimilarity(content1, content2) {
    const words1 = new Set(content1.toLowerCase().split(/\s+/).filter(w => w.length > 1));
    const words2 = new Set(content2.toLowerCase().split(/\s+/).filter(w => w.length > 1));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  async processAnswerForPlagiarism(answer) {
    const plagiarismResult = await this.detectPlagiarism(answer);

    answer.moderation.plagiarismScore = plagiarismResult.plagiarismScore;
    answer.moderation.plagiarizedFrom = plagiarismResult.plagiarizedFrom;

    if (plagiarismResult.isPlagiarized) {
      answer.moderation.isPlagiarized = true;
      answer.moderation.isFlagged = true;
      answer.moderation.flagReason = '疑似抄袭';

      await this.applyCreditRule(
        answer.author,
        'plagiarism_detected',
        {
          reason: `检测到抄袭，相似度分数: ${plagiarismResult.plagiarismScore}`,
          relatedEntity: {
            type: 'answer',
            id: answer._id
          },
          metadata: {
            plagiarismIndicators: plagiarismResult.indicators
          }
        }
      );
    }

    await answer.save();

    return plagiarismResult;
  }

  async getUserCreditHistory(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      recordType = null,
      startDate = null,
      endDate = null
    } = options;

    const query = { user: userId };

    if (recordType) {
      query.recordType = recordType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const records = await CreditRecord.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await CreditRecord.countDocuments(query);

    return {
      records,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    };
  }

  async getUserCreditSummary(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const stats = await CreditRecord.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$recordType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const recentRecords = await CreditRecord.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      user: {
        id: user._id,
        username: user.username,
        creditScore: user.creditScore,
        creditLevel: user.creditLevel,
        activityWeight: user.activityWeight
      },
      summary: stats,
      recentRecords,
      levelInfo: this.getLevelInfo(user.creditLevel)
    };
  }

  getLevelInfo(level) {
    const levelInfo = {
      bronze: {
        name: '青铜',
        minScore: 0,
        maxScore: 199,
        privileges: ['基础问答权限'],
        nextLevel: 'silver',
        nextLevelMin: 200
      },
      silver: {
        name: '白银',
        minScore: 200,
        maxScore: 399,
        privileges: ['基础问答权限', '优先专家匹配'],
        nextLevel: 'gold',
        nextLevelMin: 400
      },
      gold: {
        name: '黄金',
        minScore: 400,
        maxScore: 599,
        privileges: ['基础问答权限', '优先专家匹配', '双倍积分奖励'],
        nextLevel: 'platinum',
        nextLevelMin: 600
      },
      platinum: {
        name: '铂金',
        minScore: 600,
        maxScore: 799,
        privileges: ['基础问答权限', '优先专家匹配', '双倍积分奖励', '专属标识'],
        nextLevel: 'diamond',
        nextLevelMin: 800
      },
      diamond: {
        name: '钻石',
        minScore: 800,
        maxScore: 1000,
        privileges: ['全部权限', '专属客服', '优先审核'],
        nextLevel: null,
        nextLevelMin: null
      }
    };

    return levelInfo[level] || levelInfo.bronze;
  }
}

module.exports = QualityCreditEngine;
