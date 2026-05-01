const Answer = require('../models/Answer');
const Question = require('../models/Question');
const User = require('../models/User');
const Vote = require('../models/Vote');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const QualityCreditEngine = require('../engines/QualityCreditEngine');
const RevenueSettlementEngine = require('../engines/RevenueSettlementEngine');
const { v4: uuidv4 } = require('uuid');

class AnswerService {
  constructor() {
    this.qualityCreditEngine = new QualityCreditEngine();
    this.revenueSettlementEngine = new RevenueSettlementEngine();
  }

  generateAnswerId() {
    return `A-${Date.now().toString(36)}-${uuidv4().substring(0, 8)}`.toUpperCase();
  }

  async createAnswer(userId, questionId, answerData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const question = await Question.findById(questionId).populate('author');
    if (!question) {
      throw new Error('Question not found');
    }

    if (!['published', 'pending_response', 'has_answers'].includes(question.status)) {
      throw new Error('Question is not open for answers');
    }

    const answerId = this.generateAnswerId();
    
    const startedAt = answerData.startedAt || new Date();
    const submittedAt = new Date();
    const duration = Math.floor((submittedAt - startedAt) / 1000);

    const answer = new Answer({
      answerId,
      question: question._id,
      author: userId,
      content: answerData.content,
      contentCompleteness: this.calculateContentCompleteness(answerData.content),
      writingTime: {
        startedAt,
        submittedAt,
        duration
      },
      isAccepted: false,
      stats: {
        voteCount: 0,
        upvotes: 0,
        downvotes: 0,
        bookmarkCount: 0,
        shareCount: 0,
        viewCount: 0
      },
      rankScore: 0,
      attachments: answerData.attachments || [],
      moderation: {
        isFlagged: false,
        isPlagiarized: false,
        plagiarismScore: 0
      }
    });

    await answer.save();

    question.stats.answerCount += 1;
    if (question.status === 'pending_response') {
      question.status = 'has_answers';
    }
    question.workflowStatus = 'associated_credentials';
    await question.save();

    user.metadata.answerCount = (user.metadata.answerCount || 0) + 1;
    await user.save();

    await this.qualityCreditEngine.applyCreditRule(
      userId,
      'answer_posted',
      {
        reason: '发布回答',
        relatedEntity: {
          type: 'answer',
          id: answer._id
        }
      }
    );

    const plagiarismResult = await this.qualityCreditEngine.processAnswerForPlagiarism(answer);

    const notification = new Notification({
      notificationId: uuidv4(),
      recipient: question.author._id,
      notificationType: 'answer_received',
      priority: 'normal',
      title: `您的问题"${question.title.substring(0, 30)}..."收到新回答`,
      content: `${user.profile?.nickname || user.username} 回答了您的问题。`,
      data: {
        questionId: question.questionId,
        answerId: answer.answerId
      },
      relatedEntity: {
        type: 'Answer',
        id: answer._id
      },
      channels: ['in_app', 'email'],
      source: 'system'
    });
    await notification.save();

    return {
      answer,
      plagiarismResult,
      notificationSent: true
    };
  }

  calculateContentCompleteness(content) {
    if (!content) return 0;

    const wordCount = content.split(/\s+/).length;
    const paragraphCount = content.split(/\n\n+/).length;
    const hasCode = /```[\s\S]*?```|`[^`]+`/g.test(content);
    const hasLinks = /https?:\/\/[^\s]+/g.test(content);
    const hasLists = /^(\d+\.|[-*])\s/gm.test(content);

    let score = 0;

    score += Math.min(wordCount / 50, 0.4);
    score += Math.min(paragraphCount / 3, 0.2);
    score += hasCode ? 0.15 : 0;
    score += hasLinks ? 0.1 : 0;
    score += hasLists ? 0.15 : 0;

    return Math.min(score * 100, 100);
  }

  async getAnswer(answerId, userId = null) {
    const answer = await Answer.findOne({ answerId })
      .populate('author', 'username profile.nickname profile.avatar creditScore creditLevel activityWeight')
      .populate('question', 'questionId title status author');

    if (!answer) {
      throw new Error('Answer not found');
    }

    if (userId && answer.author._id.toString() !== userId.toString()) {
      answer.stats.viewCount += 1;
      await answer.save();
    }

    return answer;
  }

  async updateAnswer(answerId, userId, updates) {
    const answer = await Answer.findOne({ answerId });
    if (!answer) {
      throw new Error('Answer not found');
    }

    if (answer.author.toString() !== userId.toString()) {
      throw new Error('Not authorized to update this answer');
    }

    if (answer.isAccepted) {
      throw new Error('Cannot update accepted answer');
    }

    const allowedUpdates = ['content', 'attachments'];
    const updateData = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    if (updateData.content) {
      updateData.contentCompleteness = this.calculateContentCompleteness(updateData.content);
    }

    if (Object.keys(updateData).length > 0) {
      const result = await Answer.findByIdAndUpdate(
        answer._id,
        { $set: updateData },
        { new: true }
      );

      result.addAudit('answer_updated', userId, 'answerer', {
        updatedFields: Object.keys(updateData)
      });

      await result.save();
      return result;
    }

    return answer;
  }

  async deleteAnswer(answerId, userId, isAdmin = false) {
    const answer = await Answer.findOne({ answerId }).populate('question');
    if (!answer) {
      throw new Error('Answer not found');
    }

    if (!isAdmin && answer.author.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete this answer');
    }

    if (answer.isAccepted && !isAdmin) {
      throw new Error('Cannot delete accepted answer');
    }

    answer.isDeleted = true;
    answer.deletedAt = new Date();
    answer.deletedBy = userId;

    answer.addAudit('answer_deleted', userId, isAdmin ? 'admin' : 'answerer', {
      reason: 'User requested deletion'
    });

    await answer.save();

    if (answer.question) {
      answer.question.stats.answerCount = Math.max(0, answer.question.stats.answerCount - 1);
      await answer.question.save();
    }

    return answer;
  }

  async voteAnswer(answerId, userId, voteType) {
    const answer = await Answer.findOne({ answerId }).populate('author');
    if (!answer) {
      throw new Error('Answer not found');
    }

    if (answer.author._id.toString() === userId.toString()) {
      throw new Error('Cannot vote your own answer');
    }

    const existingVote = await Vote.findOne({
      voter: userId,
      targetType: 'answer',
      targetId: answer._id
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await Vote.findByIdAndDelete(existingVote._id);
        
        if (voteType === 'upvote') {
          answer.stats.upvotes -= existingVote.weight;
          answer.stats.voteCount -= existingVote.weight;
        } else {
          answer.stats.downvotes -= existingVote.weight;
          answer.stats.voteCount += existingVote.weight;
        }
      } else {
        if (existingVote.voteType === 'upvote') {
          answer.stats.upvotes -= existingVote.weight;
          answer.stats.downvotes += existingVote.weight;
          answer.stats.voteCount -= existingVote.weight * 2;
        } else {
          answer.stats.upvotes += existingVote.weight;
          answer.stats.downvotes -= existingVote.weight;
          answer.stats.voteCount += existingVote.weight * 2;
        }
        existingVote.voteType = voteType;
        await existingVote.save();
      }
    } else {
      const user = await User.findById(userId);
      const weight = user?.activityWeight || 1.0;

      const fraudResult = await Vote.detectVoteFraud(userId, 'answer', answer._id);

      const vote = new Vote({
        voteId: uuidv4(),
        voter: userId,
        targetType: 'answer',
        targetId: answer._id,
        voteType,
        weight,
        fraudDetection: fraudResult
      });

      await vote.save();

      if (voteType === 'upvote') {
        answer.stats.upvotes += weight;
        answer.stats.voteCount += weight;
      } else {
        answer.stats.downvotes += weight;
        answer.stats.voteCount -= weight;
      }

      if (fraudResult.isSuspicious) {
        vote.isFlagged = true;
        vote.flagReason = fraudResult.indicators[0]?.type || 'suspicious_pattern';
        await vote.save();
      }

      const creditRule = voteType === 'upvote' ? 'vote_received_up' : 'vote_received_down';
      await this.qualityCreditEngine.applyCreditRule(
        answer.author._id,
        creditRule,
        {
          reason: voteType === 'upvote' ? '收到赞同票' : '收到反对票',
          multiplier: weight,
          relatedEntity: {
            type: 'vote',
            id: vote._id
          }
        }
      );
    }

    answer.rankScore = answer.calculateRankScore();
    await answer.save();

    answer.author.metadata.voteReceived = (answer.author.metadata.voteReceived || 0) + 1;
    await answer.author.save();

    return {
      answer,
      currentVote: voteType,
      voteStats: {
        upvotes: answer.stats.upvotes,
        downvotes: answer.stats.downvotes,
        total: answer.stats.voteCount
      }
    };
  }

  async acceptAnswer(answerId, questionId, userId) {
    const answer = await Answer.findOne({ answerId }).populate('author');
    const question = await Question.findById(questionId).populate('author');

    if (!answer || !question) {
      throw new Error('Answer or Question not found');
    }

    if (question.author._id.toString() !== userId.toString()) {
      throw new Error('Only question author can accept answer');
    }

    if (answer.isAccepted) {
      throw new Error('Answer is already accepted');
    }

    if (question.status === 'solved') {
      throw new Error('Question is already solved');
    }

    answer.isAccepted = true;
    answer.acceptedAt = new Date();
    answer.acceptedBy = userId;
    answer.addAudit('answer_accepted', userId, 'questioner', {});
    await answer.save();

    let settlementResult = null;
    if (question.reward.isEscrowed && (question.reward.points > 0 || question.reward.money > 0)) {
      settlementResult = await this.revenueSettlementEngine.settleAcceptedAnswer(
        question._id,
        answer._id
      );
    }

    question.isFeatured = true;
    await question.save();

    await this.qualityCreditEngine.applyCreditRule(
      answer.author._id,
      'answer_accepted',
      {
        reason: '回答被采纳',
        relatedEntity: {
          type: 'answer',
          id: answer._id
        }
      }
    );

    await this.qualityCreditEngine.updateActivityWeight(answer.author._id);

    const notification = new Notification({
      notificationId: uuidv4(),
      recipient: answer.author._id,
      notificationType: 'answer_accepted',
      priority: 'high',
      title: '恭喜！您的回答被采纳了',
      content: `您回答的问题"${question.title.substring(0, 50)}..."被提问者采纳！`,
      data: {
        questionId: question.questionId,
        answerId: answer.answerId,
        hasSettlement: !!settlementResult
      },
      relatedEntity: {
        type: 'Answer',
        id: answer._id
      },
      channels: ['in_app', 'email'],
      source: 'system'
    });
    await notification.save();

    return {
      answer,
      question,
      settlementResult,
      notificationSent: true
    };
  }

  async getAnswersByAuthor(authorId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isAccepted = null
    } = options;

    const query = {
      author: authorId,
      isDeleted: false
    };

    if (isAccepted !== null) {
      query.isAccepted = isAccepted;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const answers = await Answer.find(query)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .populate('question', 'questionId title status');

    const total = await Answer.countDocuments(query);

    return {
      answers,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    };
  }

  async getAnswerStats(answerId) {
    const answer = await Answer.findOne({ answerId });
    if (!answer) {
      throw new Error('Answer not found');
    }

    const votes = await Vote.find({
      targetType: 'answer',
      targetId: answer._id,
      isFlagged: false
    });

    const upvotes = votes.filter(v => v.voteType === 'upvote').reduce((sum, v) => sum + v.weight, 0);
    const downvotes = votes.filter(v => v.voteType === 'downvote').reduce((sum, v) => sum + v.weight, 0);

    return {
      answerId: answer.answerId,
      stats: answer.stats,
      voteBreakdown: {
        upvotes: Math.floor(upvotes),
        downvotes: Math.floor(downvotes),
        total: Math.floor(upvotes - downvotes)
      },
      rankScore: answer.rankScore,
      contentCompleteness: answer.contentCompleteness,
      writingTime: answer.writingTime
    };
  }
}

module.exports = AnswerService;
