const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');
const Vote = require('../models/Vote');
const Notification = require('../models/Notification');
const ExpertMatchingEngine = require('../engines/ExpertMatchingEngine');
const QualityCreditEngine = require('../engines/QualityCreditEngine');
const { v4: uuidv4 } = require('uuid');

class QuestionService {
  constructor() {
    this.expertMatchingEngine = new ExpertMatchingEngine();
    this.qualityCreditEngine = new QualityCreditEngine();
  }

  generateQuestionId() {
    return `Q-${Date.now().toString(36)}-${uuidv4().substring(0, 8)}`.toUpperCase();
  }

  async createQuestion(userId, questionData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const questionId = this.generateQuestionId();
    
    const question = new Question({
      questionId,
      title: questionData.title,
      content: questionData.content,
      tags: questionData.tags || [],
      categories: questionData.categories || [],
      author: userId,
      reward: {
        type: questionData.reward?.type || 'points',
        points: questionData.reward?.points || 0,
        money: questionData.reward?.money || 0,
        isEscrowed: false
      },
      status: 'draft',
      workflowStatus: 'business_request',
      stats: {
        viewCount: 0,
        answerCount: 0,
        voteCount: 0,
        bookmarkCount: 0,
        shareCount: 0
      }
    });

    await question.save();

    user.metadata.questionCount = (user.metadata.questionCount || 0) + 1;
    await user.save();

    await this.qualityCreditEngine.applyCreditRule(
      userId,
      'question_posted',
      {
        reason: '发布问题',
        relatedEntity: {
          type: 'question',
          id: question._id
        }
      }
    );

    return question;
  }

  async publishQuestion(questionId, userId) {
    const question = await Question.findById(questionId).populate('author');
    if (!question) {
      throw new Error('Question not found');
    }

    if (question.author._id.toString() !== userId.toString()) {
      throw new Error('Not authorized to publish this question');
    }

    if (question.status !== 'draft') {
      throw new Error('Question is already published or in invalid state');
    }

    question.status = 'published';
    question.workflowStatus = 'processing_ticket';
    await question.save();

    const matchResult = await this.expertMatchingEngine.processQuestionMatch(question);

    return {
      question: matchResult.question,
      semanticAnalysis: matchResult.semanticAnalysis,
      matchedExperts: matchResult.matchedExperts,
      notificationsSent: matchResult.notificationsSent
    };
  }

  async getQuestion(questionId, userId = null) {
    const question = await Question.findOne({ questionId })
      .populate('author', 'username profile.nickname profile.avatar creditScore creditLevel')
      .populate('matchedExperts.expert', 'username profile.nickname profile.avatar profile.expertise');

    if (!question) {
      throw new Error('Question not found');
    }

    if (userId && question.author._id.toString() !== userId.toString()) {
      question.stats.viewCount += 1;
      await question.save();
    }

    return question;
  }

  async getQuestions(filter = {}, options = {}) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = null,
      workflowStatus = null,
      author = null,
      tags = null,
      search = null
    } = options;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (workflowStatus) {
      query.workflowStatus = workflowStatus;
    }

    if (author) {
      query.author = author;
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [search] } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const questions = await Question.find(query)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .populate('author', 'username profile.nickname profile.avatar creditScore creditLevel');

    const total = await Question.countDocuments(query);

    return {
      questions,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    };
  }

  async updateQuestion(questionId, userId, updates) {
    const question = await Question.findById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    if (question.author.toString() !== userId.toString()) {
      throw new Error('Not authorized to update this question');
    }

    if (['solved', 'closed', 'archived'].includes(question.status)) {
      throw new Error('Cannot update question in this state');
    }

    const allowedUpdates = ['title', 'content', 'tags', 'categories'];
    const updateData = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    if (Object.keys(updateData).length > 0) {
      const result = await Question.findByIdAndUpdate(
        questionId,
        { $set: updateData },
        { new: true }
      );

      result.auditTrail.push({
        action: 'question_updated',
        actor: userId,
        actorRole: 'questioner',
        timestamp: new Date(),
        details: {
          updatedFields: Object.keys(updateData)
        }
      });

      await result.save();
      return result;
    }

    return question;
  }

  async deleteQuestion(questionId, userId, isAdmin = false) {
    const question = await Question.findById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    if (!isAdmin && question.author.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete this question');
    }

    if (question.status === 'solved' && !isAdmin) {
      throw new Error('Cannot delete solved question');
    }

    question.status = 'closed';
    question.workflowStatus = 'archived_record';
    question.archivedAt = new Date();

    question.auditTrail.push({
      action: 'question_deleted',
      actor: userId,
      actorRole: isAdmin ? 'admin' : 'questioner',
      timestamp: new Date(),
      details: {
        reason: 'User requested deletion'
      }
    });

    await question.save();
    return question;
  }

  async voteQuestion(questionId, userId, voteType) {
    const question = await Question.findById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    if (question.author.toString() === userId.toString()) {
      throw new Error('Cannot vote your own question');
    }

    const existingVote = await Vote.findOne({
      voter: userId,
      targetType: 'question',
      targetId: question._id
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await Vote.findByIdAndDelete(existingVote._id);
        
        if (voteType === 'upvote') {
          question.stats.voteCount -= existingVote.weight;
        } else {
          question.stats.voteCount += existingVote.weight;
        }
      } else {
        if (existingVote.voteType === 'upvote') {
          question.stats.voteCount -= existingVote.weight * 2;
        } else {
          question.stats.voteCount += existingVote.weight * 2;
        }
        existingVote.voteType = voteType;
        await existingVote.save();
      }
    } else {
      const user = await User.findById(userId);
      const weight = user?.activityWeight || 1.0;

      const fraudResult = await Vote.detectVoteFraud(userId, 'question', question._id);

      const vote = new Vote({
        voteId: uuidv4(),
        voter: userId,
        targetType: 'question',
        targetId: question._id,
        voteType,
        weight,
        fraudDetection: fraudResult
      });

      await vote.save();

      if (voteType === 'upvote') {
        question.stats.voteCount += weight;
      } else {
        question.stats.voteCount -= weight;
      }

      if (fraudResult.isSuspicious) {
        vote.isFlagged = true;
        vote.flagReason = fraudResult.indicators[0]?.type || 'suspicious_pattern';
        await vote.save();
      }
    }

    await question.save();

    return {
      question,
      currentVote: voteType,
      voteCount: question.stats.voteCount
    };
  }

  async getQuestionAnswers(questionId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'rankScore',
      sortOrder = 'desc',
      includeComments = false
    } = options;

    const question = await Question.findOne({ questionId });
    if (!question) {
      throw new Error('Question not found');
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const answers = await Answer.find({
      question: question._id,
      isDeleted: false
    })
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .populate('author', 'username profile.nickname profile.avatar creditScore creditLevel activityWeight');

    const total = await Answer.countDocuments({
      question: question._id,
      isDeleted: false
    });

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

  async getWorkflowStatus(questionId) {
    const question = await Question.findOne({ questionId });
    if (!question) {
      throw new Error('Question not found');
    }

    const workflowSteps = [
      {
        step: 'business_request',
        name: '业务请求',
        description: '用户发布问题，设置悬赏',
        completed: question.workflowStatus !== 'business_request',
        current: question.workflowStatus === 'business_request',
        timestamp: question.createdAt
      },
      {
        step: 'processing_ticket',
        name: '处理工单',
        description: '语义解析，专家匹配',
        completed: ['associated_credentials', 'result_confirmation', 'archived_record'].includes(question.workflowStatus),
        current: question.workflowStatus === 'processing_ticket',
        timestamp: question.semanticAnalysis ? question.updatedAt : null
      },
      {
        step: 'associated_credentials',
        name: '关联凭证',
        description: '回答撰写，投票排序',
        completed: ['result_confirmation', 'archived_record'].includes(question.workflowStatus),
        current: question.workflowStatus === 'associated_credentials',
        timestamp: question.stats.answerCount > 0 ? question.updatedAt : null
      },
      {
        step: 'result_confirmation',
        name: '结果确认',
        description: '采纳答案，资金结算',
        completed: question.workflowStatus === 'archived_record',
        current: question.workflowStatus === 'result_confirmation',
        timestamp: question.status === 'solved' ? question.updatedAt : null
      },
      {
        step: 'archived_record',
        name: '归档记录',
        description: '收录知识库，永久存档',
        completed: question.workflowStatus === 'archived_record' && question.isInKnowledgeBase,
        current: false,
        timestamp: question.archivedAt
      }
    ];

    return {
      questionId: question.questionId,
      currentStatus: question.status,
      currentWorkflowStep: question.workflowStatus,
      workflowSteps,
      auditTrail: question.auditTrail.slice(-10),
      matchedExperts: question.matchedExperts,
      isInKnowledgeBase: question.isInKnowledgeBase
    };
  }

  async updateWorkflowStatus(questionId, newStatus, actorId, actorRole, details = {}) {
    const question = await Question.findOne({ questionId });
    if (!question) {
      throw new Error('Question not found');
    }

    const oldStatus = question.workflowStatus;
    question.workflowStatus = newStatus;

    question.auditTrail.push({
      action: 'workflow_status_change',
      actor: actorId,
      actorRole,
      timestamp: new Date(),
      details: {
        oldStatus,
        newStatus,
        ...details
      }
    });

    await question.save();

    return {
      question,
      oldStatus,
      newStatus
    };
  }
}

module.exports = QuestionService;
