const QuestionService = require('../services/QuestionService');
const AnswerService = require('../services/AnswerService');
const RevenueSettlementEngine = require('../engines/RevenueSettlementEngine');

class QuestionController {
  constructor() {
    this.questionService = new QuestionService();
    this.answerService = new AnswerService();
    this.revenueSettlementEngine = new RevenueSettlementEngine();
  }

  async createQuestion(req, res) {
    try {
      const userId = req.user._id;
      const { title, content, tags, categories, reward } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: 'Title and content are required'
        });
      }

      const question = await this.questionService.createQuestion(userId, {
        title,
        content,
        tags,
        categories,
        reward
      });

      res.status(201).json({
        success: true,
        data: {
          questionId: question.questionId,
          status: question.status,
          workflowStatus: question.workflowStatus,
          message: 'Question created successfully. Publish it to make it visible to experts.'
        }
      });
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create question'
      });
    }
  }

  async publishQuestion(req, res) {
    try {
      const userId = req.user._id;
      const { questionId } = req.params;

      const result = await this.questionService.publishQuestion(questionId, userId);

      if (result.question.reward && (result.question.reward.points > 0 || result.question.reward.money > 0)) {
        try {
          await this.revenueSettlementEngine.createEscrow(result.question._id);
        } catch (escrowError) {
          console.warn('Escrow creation failed:', escrowError);
        }
      }

      res.status(200).json({
        success: true,
        data: {
          question: result.question,
          semanticAnalysis: result.semanticAnalysis,
          matchedExperts: result.matchedExperts.map(m => ({
            expertId: m.expert._id,
            username: m.expert.username,
            matchScore: m.score
          })),
          notificationsSent: result.notificationsSent
        }
      });
    } catch (error) {
      console.error('Error publishing question:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to publish question'
      });
    }
  }

  async getQuestion(req, res) {
    try {
      const { questionId } = req.params;
      const userId = req.user?._id;

      const question = await this.questionService.getQuestion(questionId, userId);

      res.status(200).json({
        success: true,
        data: question
      });
    } catch (error) {
      console.error('Error getting question:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get question'
      });
    }
  }

  async getQuestions(req, res) {
    try {
      const {
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        workflowStatus,
        author,
        tags,
        search
      } = req.query;

      const result = await this.questionService.getQuestions({}, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder,
        status,
        workflowStatus,
        author,
        tags: tags ? tags.split(',') : null,
        search
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting questions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get questions'
      });
    }
  }

  async updateQuestion(req, res) {
    try {
      const userId = req.user._id;
      const { questionId } = req.params;
      const { title, content, tags, categories } = req.body;

      const question = await this.questionService.updateQuestion(
        questionId,
        userId,
        { title, content, tags, categories }
      );

      res.status(200).json({
        success: true,
        data: question
      });
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update question'
      });
    }
  }

  async deleteQuestion(req, res) {
    try {
      const userId = req.user._id;
      const isAdmin = req.user.role === 'admin';
      const { questionId } = req.params;

      const question = await this.questionService.deleteQuestion(questionId, userId, isAdmin);

      res.status(200).json({
        success: true,
        data: {
          questionId: question.questionId,
          status: question.status,
          message: 'Question deleted successfully'
        }
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete question'
      });
    }
  }

  async voteQuestion(req, res) {
    try {
      const userId = req.user._id;
      const { questionId } = req.params;
      const { voteType } = req.body;

      if (!['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid vote type. Must be upvote or downvote.'
        });
      }

      const result = await this.questionService.voteQuestion(questionId, userId, voteType);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error voting question:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to vote question'
      });
    }
  }

  async getQuestionAnswers(req, res) {
    try {
      const { questionId } = req.params;
      const {
        limit = 20,
        offset = 0,
        sortBy = 'rankScore',
        sortOrder = 'desc'
      } = req.query;

      const result = await this.questionService.getQuestionAnswers(questionId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting question answers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get question answers'
      });
    }
  }

  async getWorkflowStatus(req, res) {
    try {
      const { questionId } = req.params;

      const result = await this.questionService.getWorkflowStatus(questionId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting workflow status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get workflow status'
      });
    }
  }

  async getMyQuestions(req, res) {
    try {
      const userId = req.user._id;
      const {
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status
      } = req.query;

      const result = await this.questionService.getQuestions({}, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder,
        status,
        author: userId
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting my questions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get my questions'
      });
    }
  }
}

module.exports = QuestionController;
