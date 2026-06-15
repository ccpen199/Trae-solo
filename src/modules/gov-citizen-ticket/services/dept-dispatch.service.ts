import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketCategory } from '../entities/ticket-category.entity';

export interface DispatchResult {
  deptCode: string | null;
  matched: boolean;
  reason?: string;
  confidence?: number;
}

interface DispatchRule {
  id: string;
  name: string;
  match: (ticket: Ticket, categories: TicketCategory[]) => boolean;
  deptCode: string;
  reason: string;
  priority: number;
}

@Injectable()
export class DeptDispatchService {
  private readonly logger = new Logger(DeptDispatchService.name);

  constructor(
    @InjectRepository(TicketCategory)
    private readonly categoryRepo: Repository<TicketCategory>,
  ) {}

  async dispatch(ticket: Ticket): Promise<DispatchResult> {
    const categories = await this.categoryRepo.find({
      where: { isActive: true },
    });

    const rules = this.buildDispatchRules(categories);

    let bestResult: DispatchResult = {
      deptCode: null,
      matched: false,
      confidence: 0,
    };

    for (const rule of rules) {
      try {
        if (rule.match(ticket, categories)) {
          const category = categories.find(c =>
            c.id === ticket.categoryId || c.id === ticket.subCategoryId,
          );
          let confidence = rule.priority / 10;

          if (category && category.defaultDeptCode === rule.deptCode) {
            confidence = Math.min(0.99, confidence + 0.2);
          }

          if (confidence > (bestResult.confidence || 0)) {
            bestResult = {
              deptCode: rule.deptCode,
              matched: true,
              reason: rule.reason,
              confidence,
            };
          }
        }
      } catch (error) {
        this.logger.warn(`规则[${rule.name}]执行异常: ${error.message}`);
      }
    }

    if (!bestResult.matched && ticket.categoryId) {
      const category = categories.find(c => c.id === ticket.categoryId);
      if (category?.defaultDeptCode) {
        bestResult = {
          deptCode: category.defaultDeptCode,
          matched: true,
          reason: `匹配分类[${category.categoryName}]默认处理部门`,
          confidence: 0.6,
        };
      }
    }

    this.logger.log(
      `工单[${ticket.ticketNo}]智能分单结果: ${bestResult.matched ? bestResult.deptCode : '未匹配'}, 置信度: ${(bestResult.confidence || 0).toFixed(2)}`,
    );

    return bestResult;
  }

  private buildDispatchRules(categories: TicketCategory[]): DispatchRule[] {
    return [
      {
        id: 'rule_social_security',
        name: '社保类工单分发',
        priority: 9,
        deptCode: 'DEPT_HR_SOCIAL',
        reason: '匹配社保/养老/失业关键词',
        match: (ticket) => {
          const text = (ticket.title + ticket.content).toLowerCase();
          return /社保|养老|失业|工伤|生育|退休金|养老金/.test(text);
        },
      },
      {
        id: 'rule_medical',
        name: '医保医疗类工单分发',
        priority: 9,
        deptCode: 'DEPT_MEDICAL',
        reason: '匹配医保/医疗/医院关键词',
        match: (ticket) => {
          const text = (ticket.title + ticket.content).toLowerCase();
          return /医保|医疗|医院|看病|住院|门诊|报销|药品|健康/.test(text);
        },
      },
      {
        id: 'rule_housing',
        name: '住房公积金类工单分发',
        priority: 9,
        deptCode: 'DEPT_HOUSING',
        reason: '匹配公积金/住房关键词',
        match: (ticket) => {
          const text = (ticket.title + ticket.content).toLowerCase();
          return /公积金|住房|房贷|租房|买房|不动产|房产|物业/.test(text);
        },
      },
      {
        id: 'rule_education',
        name: '教育类工单分发',
        priority: 8,
        deptCode: 'DEPT_EDUCATION',
        reason: '匹配教育/学校/入学关键词',
        match: (ticket) => {
          const text = (ticket.title + ticket.content).toLowerCase();
          return /教育|学校|入学|报名|考试|学生|幼儿园|小学|中学|大学/.test(text);
        },
      },
      {
        id: 'rule_transport',
        name: '交通类工单分发',
        priority: 8,
        deptCode: 'DEPT_TRANSPORT',
        reason: '匹配交通/车辆/驾照关键词',
        match: (ticket) => {
          const text = (ticket.title + ticket.content).toLowerCase();
          return /交通|车辆|驾照|驾驶|违章|停车|公交|地铁|出租|出行/.test(text);
        },
      },
      {
        id: 'rule_tax',
        name: '税务类工单分发',
        priority: 8,
        deptCode: 'DEPT_TAX',
        reason: '匹配税务/发票关键词',
        match: (ticket) => {
          const text = (ticket.title + ticket.content).toLowerCase();
          return /税务|税收|发票|缴税|退税|个税|增值税/.test(text);
        },
      },
      {
        id: 'rule_civil',
        name: '民政类工单分发',
        priority: 8,
        deptCode: 'DEPT_CIVIL',
        reason: '匹配婚姻/低保/救助关键词',
        match: (ticket) => {
          const text = (ticket.title + ticket.content).toLowerCase();
          return /结婚|离婚|婚姻|低保|救助|慈善|残疾|孤儿|养老服务|殡葬/.test(text);
        },
      },
      {
        id: 'rule_environment',
        name: '环境城管类工单分发',
        priority: 7,
        deptCode: 'DEPT_ENVIRONMENT',
        reason: '匹配环境/城管/噪音关键词',
        match: (ticket) => {
          const text = (ticket.title + ticket.content).toLowerCase();
          return /环境|城管|噪音|污染|垃圾|环卫|绿化|违建|占道/.test(text);
        },
      },
      {
        id: 'rule_market',
        name: '市场监管类工单分发',
        priority: 7,
        deptCode: 'DEPT_MARKET',
        reason: '匹配消费/工商/价格关键词',
        match: (ticket) => {
          const text = (ticket.title + ticket.content).toLowerCase();
          return /消费|投诉|工商|价格|收费|假货|质量|食品|药品|广告/.test(text);
        },
      },
      {
        id: 'rule_public_security',
        name: '公安类工单分发',
        priority: 7,
        deptCode: 'DEPT_POLICE',
        reason: '匹配公安/报警/户籍关键词',
        match: (ticket) => {
          const text = (ticket.title + ticket.content).toLowerCase();
          return /公安|报警|警察|户籍|户口|身份证|出入境|护照|签证|诈骗/.test(text);
        },
      },
    ];
  }

  async initializeCategories(): Promise<TicketCategory[]> {
    const existing = await this.categoryRepo.find();
    if (existing.length > 0) return existing;

    const defaultCategories: Partial<TicketCategory>[] = [
      { categoryCode: 'C001', categoryName: '投诉', categoryType: 'complaint', parentId: null, level: 1, sort: 1 },
      { categoryCode: 'C002', categoryName: '建议', categoryType: 'suggestion', parentId: null, level: 1, sort: 2 },
      { categoryCode: 'C003', categoryName: '咨询', categoryType: 'consultation', parentId: null, level: 1, sort: 3 },
      { categoryCode: 'C004', categoryName: '求助', categoryType: 'assistance', parentId: null, level: 1, sort: 4 },
      { categoryCode: 'C005', categoryName: '表扬', categoryType: 'praise', parentId: null, level: 1, sort: 5 },
    ];

    const results: TicketCategory[] = [];
    for (const cat of defaultCategories) {
      const entity = this.categoryRepo.create(cat);
      results.push(await this.categoryRepo.save(entity));
    }
    this.logger.log(`工单分类初始化完成，创建${results.length}个大类`);
    return results;
  }
}
