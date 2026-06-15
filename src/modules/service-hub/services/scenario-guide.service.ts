import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScenarioTree, ScenarioOption } from '../entities/scenario-tree.entity';
import { ScenarioCondition, ConditionGroup, ConditionExpression, ConditionOperator } from '../entities/scenario-condition.entity';
import { SubmitScenarioGuideDto, SmartMatchSubitemDto } from '../dto/scenario-guide.dto';
import { ServiceSubitem } from '../entities/service-subitem.entity';

export interface ScenarioGuideResult {
  matched: boolean;
  subitemId?: string;
  subitemName?: string;
  currentNodeId?: string;
  currentQuestion?: string;
  nextOptions?: ScenarioOption[];
  message?: string;
}

@Injectable()
export class ScenarioGuideService {
  private readonly logger = new Logger(ScenarioGuideService.name);

  constructor(
    @InjectRepository(ScenarioTree)
    private readonly scenarioRepository: Repository<ScenarioTree>,
    @InjectRepository(ScenarioCondition)
    private readonly conditionRepository: Repository<ScenarioCondition>,
    @InjectRepository(ServiceSubitem)
    private readonly subitemRepository: Repository<ServiceSubitem>,
  ) {}

  async getScenarioTree(itemId: string): Promise<ScenarioTree | null> {
    const rootNode = await this.scenarioRepository.findOne({
      where: { itemId, isRoot: true },
    });
    if (!rootNode) {
      return null;
    }

    const allNodes = await this.scenarioRepository.find({
      where: { itemId },
      order: { sort: 'ASC' },
    });

    return this.buildTreeNode(allNodes, rootNode.id);
  }

  async getRootNode(itemId: string): Promise<ScenarioTree | null> {
    return this.scenarioRepository.findOne({
      where: { itemId, isRoot: true },
    });
  }

  async getNextNode(nodeId: string, answerKey: string): Promise<ScenarioTree | null> {
    const currentNode = await this.scenarioRepository.findOne({ where: { id: nodeId } });
    if (!currentNode) {
      throw new NotFoundException('情形节点不存在');
    }

    if (currentNode.options && currentNode.options.length > 0) {
      const selectedOption = currentNode.options.find((opt) => opt.key === answerKey);
      if (selectedOption) {
        if (selectedOption.resultSubitemId) {
          const resultNode = this.scenarioRepository.create({
            id: 'result_' + selectedOption.resultSubitemId,
            itemId: currentNode.itemId,
            question: '匹配完成',
            isLeaf: true,
            resultSubitemId: selectedOption.resultSubitemId,
          });
          return resultNode;
        }
        if (selectedOption.nextNodeId) {
          return this.scenarioRepository.findOne({ where: { id: selectedOption.nextNodeId } });
        }
      }
    }

    if (currentNode.nextNodeId) {
      return this.scenarioRepository.findOne({ where: { id: currentNode.nextNodeId } });
    }

    if (currentNode.resultSubitemId) {
      return currentNode;
    }

    return null;
  }

  async submitAnswers(dto: SubmitScenarioGuideDto): Promise<ScenarioGuideResult> {
    const { itemId, answers } = dto;

    if (answers.length === 0) {
      const rootNode = await this.getRootNode(itemId);
      if (!rootNode) {
        return {
          matched: false,
          message: '该事项暂未配置情形引导',
        };
      }
      return {
        matched: false,
        currentNodeId: rootNode.id,
        currentQuestion: rootNode.question,
        nextOptions: rootNode.options || [],
      };
    }

    let currentNode: ScenarioTree | null = null;
    let result: ScenarioGuideResult = { matched: false };
    let scenarioPath: any[] = [];

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      let node: ScenarioTree | null;

      if (i === 0) {
        node = await this.scenarioRepository.findOne({ where: { id: answer.nodeId } });
        if (!node) {
          const rootNode = await this.getRootNode(itemId);
          if (!rootNode) {
            return { matched: false, message: '该事项暂未配置情形引导' };
          }
          node = rootNode;
        }
      } else {
        node = currentNode;
      }

      if (!node) {
        break;
      }

      const selectedOption = node.options?.find((opt) => opt.key === answer.answerKey);
      if (selectedOption) {
        scenarioPath.push({
          nodeId: node.id,
          question: node.question,
          answerKey: selectedOption.key,
          answerLabel: selectedOption.label,
        });

        if (selectedOption.resultSubitemId) {
          const subitem = await this.subitemRepository.findOne({
            where: { id: selectedOption.resultSubitemId },
          });
          return {
            matched: true,
            subitemId: selectedOption.resultSubitemId,
            subitemName: subitem?.name,
            message: '情形匹配成功',
          };
        }

        if (selectedOption.nextNodeId) {
          currentNode = await this.scenarioRepository.findOne({
            where: { id: selectedOption.nextNodeId },
          });
        } else {
          currentNode = null;
        }
      } else {
        return {
          matched: false,
          message: '无效的选项选择',
          currentNodeId: node.id,
          currentQuestion: node.question,
          nextOptions: node.options || [],
        };
      }
    }

    if (currentNode) {
      if (currentNode.isLeaf && currentNode.resultSubitemId) {
        const subitem = await this.subitemRepository.findOne({
          where: { id: currentNode.resultSubitemId },
        });
        return {
          matched: true,
          subitemId: currentNode.resultSubitemId,
          subitemName: subitem?.name,
          message: '情形匹配成功',
        };
      }
      return {
        matched: false,
        currentNodeId: currentNode.id,
        currentQuestion: currentNode.question,
        nextOptions: currentNode.options || [],
      };
    }

    return {
      matched: false,
      message: '请继续回答问题以完成情形匹配',
    };
  }

  async smartMatchSubitem(dto: SmartMatchSubitemDto): Promise<ScenarioGuideResult> {
    const { itemId, userData } = dto;

    const conditions = await this.conditionRepository.find({
      where: { itemId, enabled: true },
      order: { priority: 'DESC' },
      relations: ['subitem'],
    });

    for (const condition of conditions) {
      if (this.evaluateConditionGroup(condition.expression, userData)) {
        return {
          matched: true,
          subitemId: condition.subitemId,
          subitemName: condition.subitem?.name,
          message: `通过条件「${condition.name}」智能匹配成功`,
        };
      }
    }

    const rootNode = await this.getRootNode(itemId);
    if (rootNode) {
      return {
        matched: false,
        currentNodeId: rootNode.id,
        currentQuestion: rootNode.question,
        nextOptions: rootNode.options || [],
        message: '智能匹配未命中，请通过情形引导回答问题',
      };
    }

    return {
      matched: false,
      message: '未找到匹配的子项，请人工选择',
    };
  }

  private buildTreeNode(allNodes: ScenarioTree[], nodeId: string): ScenarioTree {
    const node = allNodes.find((n) => n.id === nodeId)!;
    const children = allNodes
      .filter((n) => n.parentNodeId === nodeId)
      .map((child) => this.buildTreeNode(allNodes, child.id));
    (node as any).children = children;
    return node;
  }

  private evaluateConditionGroup(group: ConditionGroup, data: Record<string, unknown>): boolean {
    if (!group.conditions || group.conditions.length === 0) {
      return true;
    }

    const results = group.conditions.map((cond) => {
      if ((cond as any).logic && (cond as any).conditions) {
        return this.evaluateConditionGroup(cond as ConditionGroup, data);
      }
      return this.evaluateExpression(cond as ConditionExpression, data);
    });

    if (group.logic === 'AND') {
      return results.every(Boolean);
    } else {
      return results.some(Boolean);
    }
  }

  private evaluateExpression(expr: ConditionExpression, data: Record<string, unknown>): boolean {
    const fieldValue = this.getNestedValue(data, expr.field);
    const compareValue = expr.value;

    switch (expr.operator) {
      case 'eq':
        return fieldValue === compareValue;
      case 'ne':
        return fieldValue !== compareValue;
      case 'gt':
        return Number(fieldValue) > Number(compareValue);
      case 'gte':
        return Number(fieldValue) >= Number(compareValue);
      case 'lt':
        return Number(fieldValue) < Number(compareValue);
      case 'lte':
        return Number(fieldValue) <= Number(compareValue);
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
      case 'contains':
        return String(fieldValue).includes(String(compareValue));
      case 'between': {
        if (!Array.isArray(compareValue) || compareValue.length !== 2) return false;
        const val = Number(fieldValue);
        return val >= Number(compareValue[0]) && val <= Number(compareValue[1]);
      }
      case 'regex':
        try {
          const regex = new RegExp(String(compareValue));
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc, key) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }
}
