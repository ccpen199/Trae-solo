const AnswerService = require('../services/AnswerService');
const QuestionService = require('../services/QuestionService');

class AnswerController {
  constructor() {
    this.answerService = new AnswerService();
    this.questionService = new QuestionService();
  }

  async createAnswer(req, res) {
    try {
      const userId = req.user._id;
      const { questionId } = req.params;
      const { content, attachments, startedAt } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content is required'
        });
      }

      const result = await this.answerService.createAnswer(userId, questionId, {
        content,
        attachments,
        startedAt: startedAt ? new Date(startedAt) : undefined
      });

      res.status(201).json({
        success: true,
        data: {
          answerId: result.answer.answerId,
          contentCompleteness: result.answer.contentCompleteness,
          writingTime: result.answer.writingTime,
          plagiarismResult: result.plagiarismResult,
          notificationSent: result.notificationSent,
          message: 'Answer created successfully'
        }
      });
    } catch (error) {
      console.error('Error creating answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create answer'
      });
    }
  }

  async getAnswer(req, res) {
    try {
      const { answerId } = req.params;
      const userId = req.user?._id;

      const answer = await this.answerService.getAnswer(answerId, userId);

      res.status(200).json({
        success: true,
        data: answer
      });
    } catch (error) {
      console.error('Error getting answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get answer'
      });
    }
  }

  async updateAnswer(req, res) {
    try {
      const userId = req.user._id;
      const { answerId } = req.params;
      const { content, attachments } = req.body;

      const answer = await this.answerService.updateAnswer(
        answerId,
        userId,
        { content, attachments }
      );

      res.status(200).json({
        success: true,
        data: answer
      });
    } catch (error) {
      console.error('Error updating answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update answer'
      });
    }
  }

  async deleteAnswer(req, res) {
    try {
      const userId = req.user._id;
      const isAdmin = req.user.role === 'admin';
      const { answerId } = req.params;

      const answer = await this.answerService.deleteAnswer(answerId, userId, isAdmin);

      res.status(200).json({
        success: true,
        data: {
          answerId: answer.answerId,
          isDeleted: answer.isDeleted,
          message: 'Answer deleted successfully'
        }
      });
    } catch (error) {
      console.error('Error deleting answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete answer'
      });
    }
  }

  async voteAnswer(req, res) {
    try {
      const userId = req.user._id;
      const { answerId } = req.params;
      const { voteType } = req.body;

      if (!['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid vote type. Must be upvote or downvote.'
        });
      }

      const result = await this.answerService.voteAnswer(answerId, userId, voteType);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error voting answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to vote answer'
      });
    }
  }

  async acceptAnswer(req, res) {
    try {
      const userId = req.user._id;
      const { answerId, questionId } = req.params;

      const result = await this.answerService.acceptAnswer(answerId, questionId, userId);

      res.status(200).json({
        success: true,
        data: {
          answerId: result.answer.answerId,
          isAccepted: result.answer.isAccepted,
          acceptedAt: result.answer.acceptedAt,
          questionStatus: result.question.status,
          settlementResult: result.settlementResult ? {
            totalSettled: result.settlementResult.totalSettled,
            transactionsCount: result.settlementResult.settlementTransactions.length
          } : null,
          notificationSent: result.notificationSent,
          message: 'Answer accepted successfully'
        }
      });
    } catch (error) {
      console.error('Error accepting answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to accept answer'
      });
    }
  }

  async getMyAnswers(req, res) {
    try {
      const userId = req.user._id;
      const {
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isAccepted
      } = req.query;

      const result = await this.answerService.getAnswersByAuthor(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder,
        isAccepted: isAccepted !== undefined ? isAccepted === 'true' : null
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting my answers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get my answers'
      });
    }
  }

  async getAnswerStats(req, res) {
    try {
      const { answerId } = req.params;

      const stats = await this.answerService.getAnswerStats(answerId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting answer stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get answer stats'
      });
    }
  }
}

module.exports = AnswerController;
