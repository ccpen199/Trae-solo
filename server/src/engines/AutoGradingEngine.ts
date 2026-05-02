import { Op, Transaction } from 'sequelize';
import { Question, QuestionType, QuestionOption } from '../models/Question';
import { UserAnswer, AnswerStatus } from '../models/UserAnswer';
import { UserExam, UserExamStatus } from '../models/UserExam';
import { GradingRecord, GradingStatus } from '../models/GradingRecord';
import { sequelize } from '../database/sequelize';

export interface AutoGradingResult {
  totalQuestions: number;
  gradedCount: number;
  pendingManualCount: number;
  objectiveScore: number;
  subjectiveScore: number;
  totalScore: number;
  maxPossibleScore: number;
  gradingRecords: Array<{
    questionId: string;
    isAutoGraded: boolean;
    score?: number;
    maxScore: number;
    isCorrect?: boolean;
    reason: string;
  }>;
  explanation: string;
}

export interface GradingDetails {
  question: Question;
  userAnswer: UserAnswer;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  reason: string;
}

export class AutoGradingEngine {
  private isObjectiveType(type: QuestionType): boolean {
    return [
      QuestionType.SINGLE_CHOICE,
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.TRUE_FALSE,
    ].includes(type);
  }

  private gradeSingleChoice(
    question: Question,
    userAnswerOptions?: string[]
  ): { isCorrect: boolean; score: number; maxScore: number; reason: string } {
    const options = question.options as QuestionOption[] | undefined;
    
    if (!options || options.length === 0) {
      return {
        isCorrect: false,
        score: 0,
        maxScore: question.score,
        reason: '题目选项配置异常，无法判分',
      };
    }

    const correctOptions = options.filter((o) => o.isCorrect);
    const correctOptionIds = correctOptions.map((o) => o.id);

    if (!userAnswerOptions || userAnswerOptions.length === 0) {
      return {
        isCorrect: false,
        score: 0,
        maxScore: question.score,
        reason: '用户未作答',
      };
    }

    const userSelected = userAnswerOptions[0];
    const isCorrect = correctOptionIds.includes(userSelected);

    const correctOption = correctOptions[0];
    const userOption = options.find((o) => o.id === userSelected);

    const reason = isCorrect
      ? `回答正确：选择了「${userOption?.label || userSelected}」，正确答案为「${correctOption?.label || correctOptionIds[0]}」`
      : `回答错误：选择了「${userOption?.label || userSelected}」，正确答案为「${correctOption?.label || correctOptionIds[0]}」`;

    return {
      isCorrect,
      score: isCorrect ? question.score : 0,
      maxScore: question.score,
      reason,
    };
  }

  private gradeMultipleChoice(
    question: Question,
    userAnswerOptions?: string[]
  ): { isCorrect: boolean; score: number; maxScore: number; reason: string } {
    const options = question.options as QuestionOption[] | undefined;
    
    if (!options || options.length === 0) {
      return {
        isCorrect: false,
        score: 0,
        maxScore: question.score,
        reason: '题目选项配置异常，无法判分',
      };
    }

    const correctOptions = options.filter((o) => o.isCorrect);
    const correctOptionIds = new Set(correctOptions.map((o) => o.id));
    const userOptionIds = new Set(userAnswerOptions || []);

    if (userOptionIds.size === 0) {
      return {
        isCorrect: false,
        score: 0,
        maxScore: question.score,
        reason: '用户未作答',
      };
    }

    const correctCount = [...userOptionIds].filter((id) => correctOptionIds.has(id)).length;
    const wrongCount = [...userOptionIds].filter((id) => !correctOptionIds.has(id)).length;
    const missedCount = correctOptionIds.size - correctCount;

    const isAllCorrect = correctCount === correctOptionIds.size && wrongCount === 0;
    const isPartiallyCorrect = correctCount > 0 && wrongCount === 0;

    let score = 0;
    if (isAllCorrect) {
      score = question.score;
    } else if (isPartiallyCorrect) {
      score = (correctCount / correctOptionIds.size) * question.score * 0.5;
    }

    const getOptionLabels = (ids: string[]) => {
      return ids
        .map((id) => options.find((o) => o.id === id)?.label || id)
        .join('、');
    };

    let reason = '';
    if (isAllCorrect) {
      reason = `回答完全正确：选择了「${getOptionLabels([...userOptionIds])}」，正确答案为「${getOptionLabels([...correctOptionIds])}」`;
    } else if (isPartiallyCorrect) {
      reason = `回答部分正确：选择了「${getOptionLabels([...userOptionIds])}」，正确答案为「${getOptionLabels([...correctOptionIds])}」，漏选「${getOptionLabels([...correctOptionIds].filter((id) => !userOptionIds.has(id)))}」`;
    } else if (wrongCount > 0) {
      reason = `回答错误：选择了「${getOptionLabels([...userOptionIds])}」，其中包含错误选项「${getOptionLabels([...userOptionIds].filter((id) => !correctOptionIds.has(id)))}」，正确答案为「${getOptionLabels([...correctOptionIds])}」`;
    } else {
      reason = `回答不完整：正确答案为「${getOptionLabels([...correctOptionIds])}」，用户未作答`;
    }

    return {
      isCorrect: isAllCorrect,
      score: Math.round(score * 100) / 100,
      maxScore: question.score,
      reason,
    };
  }

  private gradeTrueFalse(
    question: Question,
    userAnswerContent?: string
  ): { isCorrect: boolean; score: number; maxScore: number; reason: string } {
    const correctAnswer = question.correctAnswer?.toLowerCase();
    const userAnswer = userAnswerContent?.toLowerCase();

    if (!correctAnswer) {
      return {
        isCorrect: false,
        score: 0,
        maxScore: question.score,
        reason: '题目正确答案配置异常，无法判分',
      };
    }

    if (!userAnswer) {
      return {
        isCorrect: false,
        score: 0,
        maxScore: question.score,
        reason: '用户未作答',
      };
    }

    const isCorrect = userAnswer === correctAnswer || 
      (userAnswer === 'true' && correctAnswer === 'true') ||
      (userAnswer === 'false' && correctAnswer === 'false') ||
      (userAnswer === '1' && correctAnswer === 'true') ||
      (userAnswer === '0' && correctAnswer === 'false');

    const reason = isCorrect
      ? `回答正确：用户选择「${userAnswer === 'true' || userAnswer === '1' ? '对' : '错'}」，正确答案为「${correctAnswer === 'true' ? '对' : '错'}」`
      : `回答错误：用户选择「${userAnswer === 'true' || userAnswer === '1' ? '对' : '错'}」，正确答案为「${correctAnswer === 'true' ? '对' : '错'}」`;

    return {
      isCorrect,
      score: isCorrect ? question.score : 0,
      maxScore: question.score,
      reason,
    };
  }

  private gradeSubjective(
    question: Question
  ): { isCorrect: boolean | undefined; score: number | undefined; maxScore: number; reason: string } {
    const typeMap: Record<QuestionType, string> = {
      [QuestionType.SHORT_ANSWER]: '简答题',
      [QuestionType.ESSAY]: '论述题',
      [QuestionType.MATERIAL]: '材料题',
      [QuestionType.SINGLE_CHOICE]: '单选题',
      [QuestionType.MULTIPLE_CHOICE]: '多选题',
      [QuestionType.TRUE_FALSE]: '判断题',
    };

    return {
      isCorrect: undefined,
      score: undefined,
      maxScore: question.score,
      reason: `${typeMap[question.type]}为主观题，需人工阅卷评分`,
    };
  }

  async gradeQuestion(
    question: Question,
    userAnswer: UserAnswer
  ): Promise<{
    isCorrect: boolean | undefined;
    score: number | undefined;
    maxScore: number;
    reason: string;
    isAutoGraded: boolean;
  }> {
    if (this.isObjectiveType(question.type)) {
      let result;

      if (question.type === QuestionType.SINGLE_CHOICE) {
        result = this.gradeSingleChoice(question, userAnswer.answerOptions);
      } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
        result = this.gradeMultipleChoice(question, userAnswer.answerOptions);
      } else {
        result = this.gradeTrueFalse(question, userAnswer.answerContent);
      }

      return {
        ...result,
        isAutoGraded: true,
      };
    } else {
      const result = this.gradeSubjective(question);
      return {
        ...result,
        isAutoGraded: false,
      };
    }
  }

  async autoGradeExam(
    userExamId: string,
    transaction?: Transaction
  ): Promise<AutoGradingResult> {
    const userExam = await UserExam.findByPk(userExamId, {
      include: [
        {
          association: 'answers',
          include: [
            {
              association: 'question',
              include: [{ association: 'knowledgePoint' }],
            },
          ],
        },
      ],
    });

    if (!userExam) {
      throw new Error('考试记录不存在');
    }

    const answers = userExam.answers as (UserAnswer & { question: Question })[];
    
    if (!answers || answers.length === 0) {
      return {
        totalQuestions: 0,
        gradedCount: 0,
        pendingManualCount: 0,
        objectiveScore: 0,
        subjectiveScore: 0,
        totalScore: 0,
        maxPossibleScore: 0,
        gradingRecords: [],
        explanation: '无答题记录，无法进行自动阅卷',
      };
    }

    const gradingRecords: AutoGradingResult['gradingRecords'] = [];
    let objectiveScore = 0;
    let subjectiveScore = 0;
    let maxPossibleScore = 0;
    let gradedCount = 0;
    let pendingManualCount = 0;

    for (const userAnswer of answers) {
      const question = userAnswer.question;
      maxPossibleScore += userAnswer.maxScore;

      const result = await this.gradeQuestion(question, userAnswer);

      gradingRecords.push({
        questionId: question.id,
        isAutoGraded: result.isAutoGraded,
        score: result.score,
        maxScore: result.maxScore,
        isCorrect: result.isCorrect,
        reason: result.reason,
      });

      if (result.isAutoGraded) {
        gradedCount++;
        if (result.score !== undefined) {
          objectiveScore += result.score;
        }

        await userAnswer.update(
          {
            isCorrect: result.isCorrect,
            score: result.score,
            status: AnswerStatus.GRADED,
            isAutoGraded: true,
          },
          { transaction }
        );

        await GradingRecord.create(
          {
            userExamId,
            userAnswerId: userAnswer.id,
            questionId: question.id,
            graderId: 'system',
            status: GradingStatus.COMPLETED,
            givenScore: result.score,
            maxScore: result.maxScore,
            gradingComment: result.reason,
            isAutoGraded: true,
            autoGradeScore: result.score,
            autoGradeReason: result.reason,
            completedAt: new Date(),
          },
          { transaction }
        );
      } else {
        pendingManualCount++;
        
        await userAnswer.update(
          {
            status: AnswerStatus.SUBMITTED,
            isAutoGraded: false,
          },
          { transaction }
        );
      }
    }

    const totalScore = objectiveScore;

    await userExam.update(
      {
        objectiveScore,
        subjectiveScore: pendingManualCount > 0 ? undefined : 0,
        totalScore: pendingManualCount > 0 ? undefined : totalScore,
        status: pendingManualCount > 0 ? UserExamStatus.SUBMITTED : UserExamStatus.GRADED,
        gradedAt: pendingManualCount > 0 ? undefined : new Date(),
      },
      { transaction }
    );

    const explanation = this.generateExplanation(
      answers.length,
      gradedCount,
      pendingManualCount,
      objectiveScore,
      maxPossibleScore,
      gradingRecords
    );

    return {
      totalQuestions: answers.length,
      gradedCount,
      pendingManualCount,
      objectiveScore,
      subjectiveScore,
      totalScore,
      maxPossibleScore,
      gradingRecords,
      explanation,
    };
  }

  private generateExplanation(
    totalQuestions: number,
    gradedCount: number,
    pendingManualCount: number,
    objectiveScore: number,
    maxPossibleScore: number,
    gradingRecords: AutoGradingResult['gradingRecords']
  ): string {
    const lines: string[] = [];
    
    lines.push('【自动阅卷结果说明】');
    lines.push('');
    lines.push(`总题数：${totalQuestions} 题`);
    lines.push(`已自动阅卷：${gradedCount} 题（客观题）`);
    lines.push(`待人工阅卷：${pendingManualCount} 题（主观题）`);
    lines.push('');
    lines.push(`客观题得分：${objectiveScore} / ${maxPossibleScore - (gradingRecords.filter(r => !r.isAutoGraded).reduce((sum, r) => sum + r.maxScore, 0))}`);
    
    if (pendingManualCount > 0) {
      lines.push(`主观题得分：待人工阅卷`);
      lines.push('');
      lines.push('注意：');
      lines.push('1. 以下题目需要人工阅卷评分：');
      
      gradingRecords
        .filter((r) => !r.isAutoGraded)
        .forEach((r, index) => {
          lines.push(`   ${index + 1}. 题目 ID: ${r.questionId}，满分：${r.maxScore} 分`);
        });
    }
    
    lines.push('');
    lines.push('详细评分记录：');
    
    const correctCount = gradingRecords.filter((r) => r.isCorrect === true).length;
    const wrongCount = gradingRecords.filter((r) => r.isCorrect === false).length;
    
    lines.push(`- 正确：${correctCount} 题`);
    lines.push(`- 错误：${wrongCount} 题`);
    
    return lines.join('\n');
  }

  async getGradingDetails(
    userExamId: string
  ): Promise<{
    userExam: UserExam;
    details: Array<{
      question: Question;
      userAnswer: UserAnswer;
      gradingRecord?: GradingRecord;
      gradingReason?: string;
    }>;
    statistics: {
      totalQuestions: number;
      autoGraded: number;
      pendingManual: number;
      correctCount: number;
      wrongCount: number;
      objectiveScore: number;
      maxObjectiveScore: number;
    };
  }> {
    const userExam = await UserExam.findByPk(userExamId, {
      include: [
        {
          association: 'answers',
          include: [
            {
              association: 'question',
              include: [{ association: 'knowledgePoint' }],
            },
            {
              association: 'gradingRecords',
            },
          ],
        },
      ],
    });

    if (!userExam) {
      throw new Error('考试记录不存在');
    }

    const answers = userExam.answers as (UserAnswer & {
      question: Question;
      gradingRecords: GradingRecord[];
    })[];

    const details = answers.map((answer) => {
      const gradingRecord = answer.gradingRecords?.[0];
      let gradingReason: string | undefined;

      if (gradingRecord) {
        gradingReason = gradingRecord.gradingComment || gradingRecord.autoGradeReason;
      } else if (this.isObjectiveType(answer.question.type)) {
        const result = this.gradeQuestion(answer.question, answer);
        gradingReason = result.then((r) => r.reason) as unknown as string;
      }

      return {
        question: answer.question,
        userAnswer: answer,
        gradingRecord,
        gradingReason,
      };
    });

    const autoGraded = details.filter((d) => d.gradingRecord?.isAutoGraded).length;
    const pendingManual = details.filter((d) => !d.gradingRecord?.isAutoGraded && !this.isObjectiveType(d.question.type)).length;
    const correctCount = details.filter((d) => d.userAnswer.isCorrect === true).length;
    const wrongCount = details.filter((d) => d.userAnswer.isCorrect === false).length;

    const objectiveAnswers = details.filter((d) => this.isObjectiveType(d.question.type));
    const objectiveScore = objectiveAnswers.reduce((sum, d) => sum + (d.userAnswer.score || 0), 0);
    const maxObjectiveScore = objectiveAnswers.reduce((sum, d) => sum + d.userAnswer.maxScore, 0);

    return {
      userExam,
      details,
      statistics: {
        totalQuestions: answers.length,
        autoGraded,
        pendingManual,
        correctCount,
        wrongCount,
        objectiveScore,
        maxObjectiveScore,
      },
    };
  }

  async manualGrade(
    userAnswerId: string,
    graderId: string,
    score: number,
    comment?: string,
    transaction?: Transaction
  ): Promise<GradingRecord> {
    const userAnswer = await UserAnswer.findByPk(userAnswerId, {
      include: [{ association: 'question' }],
    });

    if (!userAnswer) {
      throw new Error('答题记录不存在');
    }

    if (score > userAnswer.maxScore || score < 0) {
      throw new Error(`分数必须在 0 到 ${userAnswer.maxScore} 之间`);
    }

    const existingGrading = await GradingRecord.findOne({
      where: { userAnswerId },
      order: [['createdAt', 'DESC']],
    });

    const gradingRecord = await GradingRecord.create(
      {
        userExamId: userAnswer.userExamId,
        userAnswerId,
        questionId: userAnswer.questionId,
        graderId,
        status: GradingStatus.COMPLETED,
        originalScore: existingGrading?.givenScore,
        givenScore: score,
        maxScore: userAnswer.maxScore,
        gradingComment: comment,
        isAutoGraded: false,
        completedAt: new Date(),
      },
      { transaction }
    );

    await userAnswer.update(
      {
        score,
        status: AnswerStatus.GRADED,
        isAutoGraded: false,
        gradedById: graderId,
        gradedAt: new Date(),
      },
      { transaction }
    );

    return gradingRecord;
  }
}

export const autoGradingEngine = new AutoGradingEngine();
