import { User } from './User';
import { KnowledgePoint } from './KnowledgePoint';
import { Question } from './Question';
import { ExamPaper } from './ExamPaper';
import { ExamPaperQuestion } from './ExamPaperQuestion';
import { Exam } from './Exam';
import { UserExam } from './UserExam';
import { UserAnswer } from './UserAnswer';
import { AnomalyRecord } from './AnomalyRecord';
import { GradingRecord } from './GradingRecord';

KnowledgePoint.hasMany(KnowledgePoint, {
  foreignKey: 'parentId',
  as: 'children',
  onDelete: 'SET NULL',
});

KnowledgePoint.belongsTo(KnowledgePoint, {
  foreignKey: 'parentId',
  as: 'parent',
});

Question.belongsTo(KnowledgePoint, {
  foreignKey: 'knowledgePointId',
  as: 'knowledgePoint',
});

Question.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator',
});

User.hasMany(Question, {
  foreignKey: 'creatorId',
  as: 'createdQuestions',
});

ExamPaper.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator',
});

User.hasMany(ExamPaper, {
  foreignKey: 'creatorId',
  as: 'createdExamPapers',
});

ExamPaperQuestion.belongsTo(ExamPaper, {
  foreignKey: 'examPaperId',
  as: 'examPaper',
});

ExamPaperQuestion.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question',
});

ExamPaper.hasMany(ExamPaperQuestion, {
  foreignKey: 'examPaperId',
  as: 'questions',
  onDelete: 'CASCADE',
});

Question.hasMany(ExamPaperQuestion, {
  foreignKey: 'questionId',
  as: 'examPaperQuestions',
});

Exam.belongsTo(ExamPaper, {
  foreignKey: 'examPaperId',
  as: 'examPaper',
});

Exam.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator',
});

ExamPaper.hasMany(Exam, {
  foreignKey: 'examPaperId',
  as: 'exams',
});

User.hasMany(Exam, {
  foreignKey: 'creatorId',
  as: 'createdExams',
});

UserExam.belongsTo(Exam, {
  foreignKey: 'examId',
  as: 'exam',
});

UserExam.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

UserExam.belongsTo(User, {
  foreignKey: 'gradedById',
  as: 'gradedBy',
});

Exam.hasMany(UserExam, {
  foreignKey: 'examId',
  as: 'userExams',
});

User.hasMany(UserExam, {
  foreignKey: 'userId',
  as: 'userExams',
});

UserAnswer.belongsTo(UserExam, {
  foreignKey: 'userExamId',
  as: 'userExam',
});

UserAnswer.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question',
});

UserAnswer.belongsTo(ExamPaperQuestion, {
  foreignKey: 'examPaperQuestionId',
  as: 'examPaperQuestion',
});

UserAnswer.belongsTo(User, {
  foreignKey: 'gradedById',
  as: 'gradedBy',
});

UserExam.hasMany(UserAnswer, {
  foreignKey: 'userExamId',
  as: 'answers',
  onDelete: 'CASCADE',
});

Question.hasMany(UserAnswer, {
  foreignKey: 'questionId',
  as: 'userAnswers',
});

AnomalyRecord.belongsTo(UserExam, {
  foreignKey: 'userExamId',
  as: 'userExam',
});

AnomalyRecord.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

AnomalyRecord.belongsTo(Exam, {
  foreignKey: 'examId',
  as: 'exam',
});

AnomalyRecord.belongsTo(User, {
  foreignKey: 'reviewedById',
  as: 'reviewedBy',
});

UserExam.hasMany(AnomalyRecord, {
  foreignKey: 'userExamId',
  as: 'anomalyRecords',
  onDelete: 'CASCADE',
});

User.hasMany(AnomalyRecord, {
  foreignKey: 'userId',
  as: 'anomalyRecords',
});

Exam.hasMany(AnomalyRecord, {
  foreignKey: 'examId',
  as: 'anomalyRecords',
});

GradingRecord.belongsTo(UserExam, {
  foreignKey: 'userExamId',
  as: 'userExam',
});

GradingRecord.belongsTo(UserAnswer, {
  foreignKey: 'userAnswerId',
  as: 'userAnswer',
});

GradingRecord.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question',
});

GradingRecord.belongsTo(User, {
  foreignKey: 'graderId',
  as: 'grader',
});

GradingRecord.belongsTo(User, {
  foreignKey: 'reviewedById',
  as: 'reviewedBy',
});

UserExam.hasMany(GradingRecord, {
  foreignKey: 'userExamId',
  as: 'gradingRecords',
  onDelete: 'CASCADE',
});

UserAnswer.hasMany(GradingRecord, {
  foreignKey: 'userAnswerId',
  as: 'gradingRecords',
});

Question.hasMany(GradingRecord, {
  foreignKey: 'questionId',
  as: 'gradingRecords',
});

User.hasMany(GradingRecord, {
  foreignKey: 'graderId',
  as: 'gradingRecords',
});

export {
  User,
  KnowledgePoint,
  Question,
  ExamPaper,
  ExamPaperQuestion,
  Exam,
  UserExam,
  UserAnswer,
  AnomalyRecord,
  GradingRecord,
};
