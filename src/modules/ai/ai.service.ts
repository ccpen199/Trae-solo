import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCorpusDto, UpdateCorpusDto, CorpusQueryDto, AskQuestionDto } from './dto/ai.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async createCorpus(dto: CreateCorpusDto) {
    this.logger.log(`新增AI训练语料: intent=${dto.intent}`, 'AiService');
    return this.prisma.aiTrainingCorpus.create({ data: dto });
  }

  async batchCreate(corpora: CreateCorpusDto[]) {
    return this.prisma.aiTrainingCorpus.createMany({ data: corpora });
  }

  async findAllCorpora(query: CorpusQueryDto) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(200, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.keyword) {
      where.OR = [{ question: { contains: query.keyword } }, { answer: { contains: query.keyword } }, { intent: { contains: query.keyword } }];
    }
    if (query.category) where.category = query.category;
    if (query.intent) where.intent = query.intent;
    if (query.isApproved !== undefined) where.isApproved = query.isApproved;

    const [list, total] = await Promise.all([
      this.prisma.aiTrainingCorpus.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.aiTrainingCorpus.count({ where }),
    ]);
    return { list, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async updateCorpus(id: string, dto: UpdateCorpusDto) {
    const corpus = await this.prisma.aiTrainingCorpus.findUnique({ where: { id } });
    if (!corpus) throw new NotFoundException('语料不存在');
    return this.prisma.aiTrainingCorpus.update({ where: { id }, data: { ...dto, version: corpus.version + 1 } });
  }

  async deleteCorpus(id: string) {
    return this.prisma.aiTrainingCorpus.delete({ where: { id } });
  }

  async ask(dto: AskQuestionDto) {
    this.logger.log(`AI问答请求: ${dto.question.substring(0, 50)}...`, 'AiService');
    const keywords = this.extractKeywords(dto.question);
    const where: any = { isApproved: true };
    if (keywords.length > 0) {
      where.OR = keywords.map((k) => ({ question: { contains: k } }));
    }

    const candidates = await this.prisma.aiTrainingCorpus.findMany({
      where,
      take: 10,
      orderBy: { usageCount: 'desc' },
    });

    let bestMatch: any = null;
    let bestScore = 0;
    for (const c of candidates) {
      const score = this.calculateSimilarity(dto.question, c.question);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = c;
      }
    }

    if (bestMatch && bestScore > 0.3) {
      await this.prisma.aiTrainingCorpus.update({
        where: { id: bestMatch.id },
        data: { usageCount: { increment: 1 } },
      });
      return {
        answer: bestMatch.answer,
        matchedCorpusId: bestMatch.id,
        confidence: bestScore,
        relatedQuestions: candidates.filter((c) => c.id !== bestMatch.id).slice(0, 3).map((c) => c.question),
        source: bestMatch.sourceType,
      };
    }

    const fallbackAnswers = [
      '抱歉，我暂时无法准确回答您的问题。建议您查阅办事指南或拨打12345政务服务热线咨询。',
      '关于您的问题，建议您查看相关办事指南，或前往就近政务服务中心现场咨询。',
    ];

    return {
      answer: fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)],
      matchedCorpusId: null,
      confidence: bestScore,
      relatedQuestions: candidates.slice(0, 3).map((c) => c.question),
      source: 'fallback',
    };
  }

  async getCorpusStats() {
    const [total, approved, byCategory] = await Promise.all([
      this.prisma.aiTrainingCorpus.count(),
      this.prisma.aiTrainingCorpus.count({ where: { isApproved: true } }),
      this.prisma.aiTrainingCorpus.groupBy({ by: ['category'], _count: true }),
    ]);
    return { total, approved, byCategory };
  }

  private extractKeywords(question: string): string[] {
    const stopWords = ['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '吗', '呢', '啊', '请', '请问', '什么', '怎么', '如何', '为什么', '哪里', '哪些', '多少', '可以', '能够', '需要', '应该'];
    const words = question.split(/[\s，。？、；：""''（）【】《》\?\.!,\(\)\[\]<>]+/).filter((w) => w.length >= 2 && !stopWords.includes(w));
    return [...new Set(words)].slice(0, 5);
  }

  private calculateSimilarity(a: string, b: string): number {
    const setA = new Set(this.extractKeywords(a));
    const setB = new Set(this.extractKeywords(b));
    const intersection = [...setA].filter((x) => setB.has(x));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.length / union.size;
  }
}
