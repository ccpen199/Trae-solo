const Question = require('../models/Question');

class QnAEngine {
  static async createQuestion(userId, courseId, data) {
    const question = new Question({
      title: data.title,
      content: data.content,
      course: courseId,
      chapterId: data.chapterId,
      lessonId: data.lessonId,
      user: userId,
      tags: data.tags || []
    });

    await question.save();
    return question;
  }

  static async addAnswer(questionId, userId, content) {
    const question = await Question.findById(questionId);
    
    if (!question) {
      throw new Error('问题不存在');
    }

    question.answers.push({
      user: userId,
      content
    });

    await question.save();
    return question;
  }

  static async likeQuestion(questionId, userId) {
    const question = await Question.findById(questionId);
    
    if (!question) {
      throw new Error('问题不存在');
    }

    const likeIndex = question.likes.indexOf(userId);
    
    if (likeIndex === -1) {
      question.likes.push(userId);
    } else {
      question.likes.splice(likeIndex, 1);
    }

    await question.save();
    return question;
  }

  static async likeAnswer(questionId, answerId, userId) {
    const question = await Question.findById(questionId);
    
    if (!question) {
      throw new Error('问题不存在');
    }

    const answer = question.answers.id(answerId);
    
    if (!answer) {
      throw new Error('答案不存在');
    }

    const likeIndex = answer.likes.indexOf(userId);
    
    if (likeIndex === -1) {
      answer.likes.push(userId);
    } else {
      answer.likes.splice(likeIndex, 1);
    }

    await question.save();
    return question;
  }

  static async acceptAnswer(questionId, answerId, userId) {
    const question = await Question.findById(questionId);
    
    if (!question) {
      throw new Error('问题不存在');
    }

    if (question.user.toString() !== userId.toString()) {
      throw new Error('只有提问者才能采纳答案');
    }

    const answer = question.answers.id(answerId);
    
    if (!answer) {
      throw new Error('答案不存在');
    }

    if (question.acceptedAnswerId) {
      const prevAnswer = question.answers.id(question.acceptedAnswerId);
      if (prevAnswer) {
        prevAnswer.isAccepted = false;
      }
    }

    answer.isAccepted = true;
    answer.acceptedAt = new Date();
    question.acceptedAnswerId = answerId;
    question.status = 'resolved';

    await question.save();
    return question;
  }

  static async getCourseQuestions(courseId, options = {}) {
    const { status, userId, page = 1, limit = 20, sort = '-createdAt' } = options;
    
    const query = { course: courseId };
    
    if (status && ['open', 'resolved', 'closed'].includes(status)) {
      query.status = status;
    }
    
    if (userId) {
      query.user = userId;
    }

    const questions = await Question.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'username avatar')
      .populate('answers.user', 'username avatar');

    const total = await Question.countDocuments(query);

    return {
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getQuestionDetail(questionId) {
    const question = await Question.findById(questionId)
      .populate('user', 'username avatar')
      .populate('answers.user', 'username avatar')
      .populate('course', 'title');

    if (!question) {
      throw new Error('问题不存在');
    }

    question.views += 1;
    await question.save();

    return question;
  }

  static async updateQuestion(questionId, userId, data) {
    const question = await Question.findById(questionId);
    
    if (!question) {
      throw new Error('问题不存在');
    }

    if (question.user.toString() !== userId.toString()) {
      throw new Error('无权修改此问题');
    }

    if (data.title) question.title = data.title;
    if (data.content) question.content = data.content;
    if (data.tags) question.tags = data.tags;

    await question.save();
    return question;
  }

  static async closeQuestion(questionId, userId) {
    const question = await Question.findById(questionId);
    
    if (!question) {
      throw new Error('问题不存在');
    }

    if (question.user.toString() !== userId.toString()) {
      throw new Error('无权关闭此问题');
    }

    question.status = 'closed';
    await question.save();
    return question;
  }

  static async getUserQuestions(userId, options = {}) {
    const { courseId, status, page = 1, limit = 20 } = options;
    
    const query = { user: userId };
    
    if (courseId) {
      query.course = courseId;
    }
    
    if (status && ['open', 'resolved', 'closed'].includes(status)) {
      query.status = status;
    }

    const questions = await Question.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('course', 'title');

    const total = await Question.countDocuments(query);

    return {
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getHotTags(courseId, limit = 10) {
    const pipeline = [
      { $match: { course: courseId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ];

    const results = await Question.aggregate(pipeline);
    return results.map(r => ({ tag: r._id, count: r.count }));
  }

  static async searchQuestions(courseId, keyword, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    const query = {
      course: courseId,
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [keyword] } }
      ]
    };

    const questions = await Question.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'username avatar');

    const total = await Question.countDocuments(query);

    return {
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = QnAEngine;
