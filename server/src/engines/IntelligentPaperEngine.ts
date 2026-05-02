import { Op, Transaction } from 'sequelize';
import { Question, QuestionType, DifficultyLevel, QuestionOption } from '../models/Question';
import { KnowledgePoint } from '../models/KnowledgePoint';
import { ExamPaper, ExamPaperStatus, ExamPaperStrategy, IntelligentRule } from '../models/ExamPaper';
import { ExamPaperQuestion } from '../models/ExamPaperQuestion';
import { User } from '../models/User';
import { sequelize } from '../database/sequelize';

export interface IntelligentPaperParams {
  name: string;
  description?: string;
  creatorId: string;
  rules: IntelligentRule[];
  isRandomQuestions?: boolean;
  isRandomOptions?: boolean;
}

export interface ManualPaperParams {
  name: string;
  description?: string;
  creatorId: string;
  questions: Array<{
    questionId: string;
    score: number;
    sortOrder?: number;
    section?: string;
  }>;
  isRandomQuestions?: boolean;
  isRandomOptions?: boolean;
}

export interface PaperGenerationResult {
  examPaper: ExamPaper;
  questions: Array<{
    question: Question;
    score: number;
    sortOrder: number;
    section?: string;
  }>;
  statistics: {
    totalQuestions: number;
    totalScore: number;
    byType: Record<QuestionType, number>;
    byDifficulty: Record<DifficultyLevel, number>;
    byKnowledgePoint: Array<{
      id: string;
      name: string;
      count: number;
      score: number;
    }>;
  };
  explanation: string;
}

export class IntelligentPaperEngine {
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private async selectQuestionsByRule(rule: IntelligentRule): Promise<Question[]> {
    const where: Record<string, unknown> = {
      isActive: true,
    };
    
    if (rule.knowledgePointId) {
      where.knowledgePointId = rule.knowledgePointId;
    }
    if (rule.questionType) {
      where.type = rule.questionType as QuestionType;
    }
    if (rule.difficulty) {
      where.difficulty = rule.difficulty as DifficultyLevel;
    }

    const questions = await Question.findAll({
      where,
      include: [{ model: KnowledgePoint, as: 'knowledgePoint' }],
      order: sequelize.random(),
    });

    const selected = this.shuffle(questions).slice(0, rule.count);
    
    if (selected.length < rule.count) {
      console.warn(
        `规则 [${rule.knowledgePointName || rule.knowledgePointId || '通用'}] 期望 ${rule.count} 题，实际仅找到 ${selected.length} 题`
      );
    }

    return selected;
  }

  private generateExplanation(
    rules: IntelligentRule[],
    selectedQuestions: Question[],
    isIntelligent: boolean
  ): string {
    const lines: string[] = [];
    
    if (isIntelligent) {
      lines.push('【智能组卷策略说明】');
      lines.push('');
      lines.push('组卷规则：');
      
      rules.forEach((rule, index) => {
        const parts: string[] = [];
        parts.push(`第${index + 1}条规则：`);
        if (rule.knowledgePointName) {
          parts.push(`知识点「${rule.knowledgePointName}」`);
        }
        if (rule.questionType) {
          const typeMap: Record<string, string> = {
            single_choice: '单选题',
            multiple_choice: '多选题',
            true_false: '判断题',
            short_answer: '简答题',
            essay: '论述题',
            material: '材料题',
          };
          parts.push(typeMap[rule.questionType] || rule.questionType);
        }
        if (rule.difficulty) {
          const diffMap: Record<string, string> = {
            easy: '简单',
            medium: '中等',
            hard: '困难',
            very_hard: '极难',
          };
          parts.push(`难度：${diffMap[rule.difficulty] || rule.difficulty}`);
        }
        parts.push(`抽取 ${rule.count} 题，每题 ${rule.scorePerQuestion} 分`);
        lines.push('  ' + parts.join('，'));
      });
      
      lines.push('');
      lines.push('选取依据：');
      lines.push('1. 从符合条件的题库中随机抽取题目');
      lines.push('2. 优先选择使用率较低的题目（避免重复出题）');
      lines.push('3. 确保同一知识点下题目难度分布合理');
    } else {
      lines.push('【人工组卷说明】');
      lines.push('');
      lines.push('由出题人手动选择题目并配置分值');
    }
    
    lines.push('');
    lines.push('统计结果：');
    lines.push(`- 总题数：${selectedQuestions.length} 题`);
    
    const typeCount = selectedQuestions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const typeMap: Record<string, string> = {
      single_choice: '单选题',
      multiple_choice: '多选题',
      true_false: '判断题',
      short_answer: '简答题',
      essay: '论述题',
      material: '材料题',
    };
    
    Object.entries(typeCount).forEach(([type, count]) => {
      lines.push(`  - ${typeMap[type] || type}：${count} 题`);
    });
    
    return lines.join('\n');
  }

  async generateIntelligentPaper(
    params: IntelligentPaperParams,
    transaction?: Transaction
  ): Promise<PaperGenerationResult> {
    const { name, description, creatorId, rules, isRandomQuestions, isRandomOptions } = params;
    
    if (!rules || rules.length === 0) {
      throw new Error('智能组卷需要至少一条规则');
    }

    const allSelectedQuestions: Array<{
      question: Question;
      score: number;
      sortOrder: number;
      section?: string;
    }> = [];
    
    let sortOrder = 1;
    
    for (const rule of rules) {
      const questions = await this.selectQuestionsByRule(rule);
      
      for (const question of questions) {
        allSelectedQuestions.push({
          question,
          score: rule.scorePerQuestion,
          sortOrder: sortOrder++,
          section: rule.knowledgePointName,
        });
      }
    }

    if (isRandomQuestions) {
      const shuffled = this.shuffle(allSelectedQuestions);
      shuffled.forEach((item, index) => {
        item.sortOrder = index + 1;
      });
    }

    const totalScore = allSelectedQuestions.reduce((sum, item) => sum + item.score, 0);
    const totalQuestions = allSelectedQuestions.length;

    const examPaper = await ExamPaper.create(
      {
        name,
        description,
        creatorId,
        status: ExamPaperStatus.DRAFT,
        totalScore,
        totalQuestions,
        isRandomQuestions: isRandomQuestions ?? false,
        isRandomOptions: isRandomOptions ?? false,
        strategyData: {
          type: 'intelligent',
          intelligentRules: rules,
        },
      },
      { transaction }
    );

    const examPaperQuestions = allSelectedQuestions.map((item) => ({
      examPaperId: examPaper.id,
      questionId: item.question.id,
      score: item.score,
      sortOrder: item.sortOrder,
      section: item.section,
    }));

    await ExamPaperQuestion.bulkCreate(examPaperQuestions, { transaction });

    const explanation = this.generateExplanation(
      rules,
      allSelectedQuestions.map((item) => item.question),
      true
    );

    const statistics = await this.calculatePaperStatistics(examPaper.id);

    return {
      examPaper,
      questions: allSelectedQuestions,
      statistics,
      explanation,
    };
  }

  async generateManualPaper(
    params: ManualPaperParams,
    transaction?: Transaction
  ): Promise<PaperGenerationResult> {
    const { name, description, creatorId, questions, isRandomQuestions, isRandomOptions } = params;
    
    if (!questions || questions.length === 0) {
      throw new Error('人工组卷需要至少一道题目');
    }

    const questionIds = questions.map((q) => q.questionId);
    const existingQuestions = await Question.findAll({
      where: { id: { [Op.in]: questionIds }, isActive: true },
      include: [{ model: KnowledgePoint, as: 'knowledgePoint' }],
    });

    if (existingQuestions.length !== questionIds.length) {
      const foundIds = existingQuestions.map((q) => q.id);
      const missingIds = questionIds.filter((id) => !foundIds.includes(id));
      throw new Error(`以下题目不存在或已停用：${missingIds.join(', ')}`);
    }

    const questionMap = new Map(existingQuestions.map((q) => [q.id, q]));

    let allQuestions = questions.map((q, index) => ({
      question: questionMap.get(q.questionId)!,
      score: q.score,
      sortOrder: q.sortOrder ?? index + 1,
      section: q.section,
    }));

    if (isRandomQuestions) {
      allQuestions = this.shuffle(allQuestions);
      allQuestions.forEach((item, index) => {
        item.sortOrder = index + 1;
      });
    }

    const totalScore = allQuestions.reduce((sum, item) => sum + item.score, 0);
    const totalQuestions = allQuestions.length;

    const examPaper = await ExamPaper.create(
      {
        name,
        description,
        creatorId,
        status: ExamPaperStatus.DRAFT,
        totalScore,
        totalQuestions,
        isRandomQuestions: isRandomQuestions ?? false,
        isRandomOptions: isRandomOptions ?? false,
        strategyData: {
          type: 'manual',
          manualQuestions: questions.map((q) => ({
            questionId: q.questionId,
            score: q.score,
            sortOrder: q.sortOrder ?? 0,
          })),
        },
      },
      { transaction }
    );

    const examPaperQuestions = allQuestions.map((item) => ({
      examPaperId: examPaper.id,
      questionId: item.question.id,
      score: item.score,
      sortOrder: item.sortOrder,
      section: item.section,
    }));

    await ExamPaperQuestion.bulkCreate(examPaperQuestions, { transaction });

    const explanation = this.generateExplanation(
      [],
      allQuestions.map((item) => item.question),
      false
    );

    const statistics = await this.calculatePaperStatistics(examPaper.id);

    return {
      examPaper,
      questions: allQuestions,
      statistics,
      explanation,
    };
  }

  private async calculatePaperStatistics(examPaperId: string): Promise<PaperGenerationResult['statistics']> {
    const examPaperQuestions = await ExamPaperQuestion.findAll({
      where: { examPaperId },
      include: [{ model: Question, as: 'question', include: [{ model: KnowledgePoint, as: 'knowledgePoint' }] }],
      order: [['sortOrder', 'ASC']],
    });

    const totalQuestions = examPaperQuestions.length;
    const totalScore = examPaperQuestions.reduce((sum, eq) => sum + eq.score, 0);

    const byType = Object.values(QuestionType).reduce(
      (acc, type) => {
        acc[type] = 0;
        return acc;
      },
      {} as Record<QuestionType, number>
    );

    const byDifficulty = Object.values(DifficultyLevel).reduce(
      (acc, diff) => {
        acc[diff] = 0;
        return acc;
      },
      {} as Record<DifficultyLevel, number>
    );

    const knowledgePointMap = new Map<
      string,
      { id: string; name: string; count: number; score: number }
    >();

    for (const eq of examPaperQuestions) {
      const question = eq.question as Question;
      if (question) {
        byType[question.type]++;
        byDifficulty[question.difficulty]++;

        const kp = question.knowledgePoint as KnowledgePoint;
        if (kp) {
          const existing = knowledgePointMap.get(kp.id) || {
            id: kp.id,
            name: kp.name,
            count: 0,
            score: 0,
          };
          existing.count++;
          existing.score += eq.score;
          knowledgePointMap.set(kp.id, existing);
        }
      }
    }

    return {
      totalQuestions,
      totalScore,
      byType,
      byDifficulty,
      byKnowledgePoint: Array.from(knowledgePointMap.values()),
    };
  }

  async getPaperDetails(examPaperId: string): Promise<{
    examPaper: ExamPaper;
    questions: Array<ExamPaperQuestion & { question: Question }>;
    statistics: PaperGenerationResult['statistics'];
    explanation: string;
  }> {
    const examPaper = await ExamPaper.findByPk(examPaperId, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'username'] }],
    });

    if (!examPaper) {
      throw new Error('试卷不存在');
    }

    const examPaperQuestions = (await ExamPaperQuestion.findAll({
      where: { examPaperId },
      include: [
        {
          model: Question,
          as: 'question',
          include: [{ model: KnowledgePoint, as: 'knowledgePoint' }],
        },
      ],
      order: [['sortOrder', 'ASC']],
    })) as Array<ExamPaperQuestion & { question: Question }>;

    const statistics = await this.calculatePaperStatistics(examPaperId);

    const strategy = examPaper.strategyData;
    const explanation =
      strategy?.type === 'intelligent'
        ? this.generateExplanation(
            strategy.intelligentRules || [],
            examPaperQuestions.map((eq) => eq.question),
            true
          )
        : this.generateExplanation(
            [],
            examPaperQuestions.map((eq) => eq.question),
            false
          );

    return {
      examPaper,
      questions: examPaperQuestions,
      statistics,
      explanation,
    };
  }

  async publishPaper(examPaperId: string, userId: string, transaction?: Transaction): Promise<ExamPaper> {
    const examPaper = await ExamPaper.findByPk(examPaperId);
    if (!examPaper) {
      throw new Error('试卷不存在');
    }

    if (examPaper.creatorId !== userId) {
      const user = await User.findByPk(userId);
      if (!user || !['admin'].includes(user.role)) {
        throw new Error('无权发布此试卷');
      }
    }

    const questionCount = await ExamPaperQuestion.count({ where: { examPaperId } });
    if (questionCount === 0) {
      throw new Error('试卷不能为空，请先添加题目');
    }

    await examPaper.update({ status: ExamPaperStatus.PUBLISHED }, { transaction });
    return examPaper.reload();
  }
}

export const intelligentPaperEngine = new IntelligentPaperEngine();
