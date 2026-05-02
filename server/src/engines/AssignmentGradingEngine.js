const AssignmentSubmission = require('../models/AssignmentSubmission');
const Assignment = require('../models/Assignment');

class AssignmentGradingEngine {
  static async gradeObjectiveQuestion(question, studentAnswer) {
    const { type, correctAnswer, score } = question;
    
    switch (type) {
      case 'single_choice':
        return this.gradeSingleChoice(correctAnswer, studentAnswer, score);
      case 'multiple_choice':
        return this.gradeMultipleChoice(correctAnswer, studentAnswer, score);
      case 'true_false':
        return this.gradeTrueFalse(correctAnswer, studentAnswer, score);
      case 'essay':
        return { score: null, isCorrect: null, needsManualGrading: true };
      default:
        return { score: 0, isCorrect: false };
    }
  }

  static gradeSingleChoice(correctAnswer, studentAnswer, score) {
    const isCorrect = correctAnswer === studentAnswer;
    return {
      score: isCorrect ? score : 0,
      isCorrect,
      needsManualGrading: false
    };
  }

  static gradeMultipleChoice(correctAnswer, studentAnswer, score) {
    if (!Array.isArray(correctAnswer) || !Array.isArray(studentAnswer)) {
      return { score: 0, isCorrect: false, needsManualGrading: false };
    }
    
    const sortedCorrect = [...correctAnswer].sort();
    const sortedStudent = [...studentAnswer].sort();
    
    const isCorrect = sortedCorrect.length === sortedStudent.length &&
      sortedCorrect.every((val, idx) => val === sortedStudent[idx]);
    
    return {
      score: isCorrect ? score : 0,
      isCorrect,
      needsManualGrading: false
    };
  }

  static gradeTrueFalse(correctAnswer, studentAnswer, score) {
    const isCorrect = correctAnswer === studentAnswer;
    return {
      score: isCorrect ? score : 0,
      isCorrect,
      needsManualGrading: false
    };
  }

  static async autoGradeSubmission(submissionId) {
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment');
    
    if (!submission) {
      throw new Error('提交记录不存在');
    }

    const assignment = submission.assignment;
    const gradedAnswers = [];
    let totalScore = 0;
    let hasEssayQuestions = false;

    for (const answer of submission.answers) {
      const question = assignment.questions.find(q => q._id.toString() === answer.questionId);
      
      if (!question) continue;

      const gradingResult = await this.gradeObjectiveQuestion(question, answer.answer);
      
      gradedAnswers.push({
        ...answer,
        score: gradingResult.score,
        isCorrect: gradingResult.isCorrect,
        needsManualGrading: gradingResult.needsManualGrading
      });

      if (gradingResult.score !== null) {
        totalScore += gradingResult.score;
      }

      if (gradingResult.needsManualGrading) {
        hasEssayQuestions = true;
      }
    }

    submission.answers = gradedAnswers;
    submission.totalScore = totalScore;
    submission.status = hasEssayQuestions ? 'submitted' : 'graded';

    if (!hasEssayQuestions) {
      submission.gradedAt = new Date();
    }

    await submission.save();

    return {
      submission,
      autoGraded: !hasEssayQuestions,
      hasEssayQuestions
    };
  }

  static async manualGradeAnswer(submissionId, questionId, score, comment, graderId) {
    const submission = await AssignmentSubmission.findById(submissionId);
    
    if (!submission) {
      throw new Error('提交记录不存在');
    }

    const answerIndex = submission.answers.findIndex(a => a.questionId === questionId);
    
    if (answerIndex === -1) {
      throw new Error('答案不存在');
    }

    submission.answers[answerIndex].score = score;
    submission.answers[answerIndex].teacherComment = comment;

    const totalScore = submission.answers.reduce((sum, a) => sum + (a.score || 0), 0);
    submission.totalScore = totalScore;

    const allGraded = submission.answers.every(a => a.score !== null && a.score !== undefined);
    if (allGraded) {
      submission.status = 'graded';
      submission.gradedBy = graderId;
      submission.gradedAt = new Date();
    }

    await submission.save();
    return submission;
  }

  static async gradeSubmission(submissionId, totalScore, feedback, graderId) {
    const submission = await AssignmentSubmission.findById(submissionId);
    
    if (!submission) {
      throw new Error('提交记录不存在');
    }

    submission.totalScore = totalScore;
    submission.teacherFeedback = feedback;
    submission.status = 'graded';
    submission.gradedBy = graderId;
    submission.gradedAt = new Date();

    await submission.save();
    return submission;
  }

  static async getSubmissionStats(assignmentId) {
    const submissions = await AssignmentSubmission.find({ assignment: assignmentId });
    
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status !== 'draft').length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    
    const scores = submissions
      .filter(s => s.totalScore !== null && s.totalScore !== undefined)
      .map(s => s.totalScore);
    
    const avgScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    return {
      total,
      submitted,
      graded,
      submissionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
      gradingRate: submitted > 0 ? Math.round((graded / submitted) * 100) : 0,
      averageScore: Math.round(avgScore * 100) / 100,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0
    };
  }
}

module.exports = AssignmentGradingEngine;
