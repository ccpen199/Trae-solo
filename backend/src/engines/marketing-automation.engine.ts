import { Prisma, JourneyNodeType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface JourneyNode {
  id: string;
  type: JourneyNodeType;
  name: string;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface JourneyEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface JourneyExecutionContext {
  executionId: string;
  journeyId: string;
  memberId: string;
  memberData: Record<string, unknown>;
  variables: Record<string, unknown>;
  currentNodeId: string | null;
  visitedNodes: string[];
  abTestGroup?: string;
  logs: Array<{ nodeId?: string; action: string; details?: Record<string, unknown>; timestamp: Date }>;
}

export interface AutomationResult {
  success: boolean;
  nextNodeId?: string;
  shouldWait?: boolean;
  waitUntil?: Date;
  error?: string;
  outputs?: Record<string, unknown>;
  explanation?: string;
}

class MarketingAutomationEngine {
  
  async createJourney(
    name: string,
    nodes: JourneyNode[],
    edges: JourneyEdge[],
    config?: Record<string, unknown>,
    campaignId?: string,
    creatorId?: string
  ) {
    logger.info(`Creating journey: ${name}`);
    
    const journey = await prisma.journey.create({
      data: {
        name,
        campaignId,
        creatorId,
        nodes: nodes as unknown as Prisma.JsonArray,
        edges: edges as unknown as Prisma.JsonArray,
        config: config as unknown as Prisma.JsonValue,
        status: 'DRAFT',
      },
    });
    
    logger.info(`Journey created with ID: ${journey.id}`);
    return journey;
  }
  
  async startJourney(journeyId: string, memberId: string): Promise<JourneyExecutionContext> {
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
    });
    
    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }
    
    const member = await prisma.audienceMember.findUnique({
      where: { id: memberId },
    });
    
    if (!member) {
      throw new Error(`Audience member not found: ${memberId}`);
    }
    
    const nodes = journey.nodes as unknown as JourneyNode[];
    const startNode = nodes.find(n => n.type === JourneyNodeType.START);
    
    if (!startNode) {
      throw new Error('Journey must have a START node');
    }
    
    let abTestGroup: string | undefined;
    const abTestNode = nodes.find(n => n.type === JourneyNodeType.A_B_TEST);
    if (abTestNode) {
      abTestGroup = Math.random() > 0.5 ? 'A' : 'B';
    }
    
    const execution = await prisma.journeyExecution.create({
      data: {
        journeyId,
        memberId,
        currentNodeId: startNode.id,
        visitedNodes: [startNode.id] as unknown as Prisma.JsonArray,
        abTestGroup,
        status: 'RUNNING',
      },
    });
    
    await prisma.journeyLog.create({
      data: {
        executionId: execution.id,
        nodeId: startNode.id,
        action: 'JOURNEY_STARTED',
        details: {
          memberEmail: member.email,
          abTestGroup,
        } as unknown as Prisma.JsonValue,
      },
    });
    
    return {
      executionId: execution.id,
      journeyId,
      memberId,
      memberData: {
        email: member.email,
        name: member.name,
        firstName: member.firstName,
        lastName: member.lastName,
        tags: member.tags,
        profileData: member.profileData,
        customFields: member.customFields,
      },
      variables: {},
      currentNodeId: startNode.id,
      visitedNodes: [startNode.id],
      abTestGroup,
      logs: [],
    };
  }
  
  async executeNode(context: JourneyExecutionContext, nodeId: string): Promise<AutomationResult> {
    const journey = await prisma.journey.findUnique({
      where: { id: context.journeyId },
    });
    
    if (!journey) {
      return { success: false, error: 'Journey not found' };
    }
    
    const nodes = journey.nodes as unknown as JourneyNode[];
    const node = nodes.find(n => n.id === nodeId);
    
    if (!node) {
      return { success: false, error: `Node not found: ${nodeId}` };
    }
    
    await prisma.journeyLog.create({
      data: {
        executionId: context.executionId,
        nodeId: node.id,
        action: `NODE_${node.type}_EXECUTED`,
        details: {
          nodeName: node.name,
          nodeConfig: node.config,
        } as unknown as Prisma.JsonValue,
      },
    });
    
    let result: AutomationResult;
    
    switch (node.type) {
      case JourneyNodeType.START:
        result = this.handleStartNode(node, context);
        break;
      case JourneyNodeType.EMAIL:
        result = await this.handleEmailNode(node, context);
        break;
      case JourneyNodeType.CONDITION:
        result = this.handleConditionNode(node, context);
        break;
      case JourneyNodeType.WAIT:
        result = this.handleWaitNode(node, context);
        break;
      case JourneyNodeType.A_B_TEST:
        result = this.handleAbTestNode(node, context);
        break;
      case JourneyNodeType.END:
        result = this.handleEndNode(node, context);
        break;
      default:
        result = { success: false, error: `Unknown node type: ${node.type}` };
    }
    
    if (result.success) {
      context.visitedNodes.push(nodeId);
      context.currentNodeId = result.nextNodeId || null;
      
      await prisma.journeyExecution.update({
        where: { id: context.executionId },
        data: {
          currentNodeId: result.nextNodeId,
          visitedNodes: context.visitedNodes as unknown as Prisma.JsonArray,
          lastActiveAt: new Date(),
          status: result.nextNodeId ? 'RUNNING' : 'COMPLETED',
        },
      });
    }
    
    return result;
  }
  
  private handleStartNode(node: JourneyNode, context: JourneyExecutionContext): AutomationResult {
    const journey = prisma.journey.findUnique({
      where: { id: context.journeyId },
    }).then(j => j?.edges as unknown as JourneyEdge[]);
    
    return {
      success: true,
      explanation: `START节点执行: 旅程开始。成员: ${context.memberData.email}`,
    };
  }
  
  private async handleEmailNode(node: JourneyNode, context: JourneyExecutionContext): Promise<AutomationResult> {
    const config = node.config as { templateId?: string; subject?: string; body?: string };
    
    let explanation = `EMAIL节点执行: 准备发送邮件给 ${context.memberData.email}。`;
    
    if (config.templateId) {
      explanation += ` 使用模板ID: ${config.templateId}。`;
    }
    if (config.subject) {
      explanation += ` 邮件主题: "${config.subject}"。`;
    }
    
    return {
      success: true,
      outputs: {
        emailSent: true,
        templateId: config.templateId,
        subject: config.subject,
      },
      explanation,
    };
  }
  
  private handleConditionNode(node: JourneyNode, context: JourneyExecutionContext): AutomationResult {
    const config = node.config as { 
      field: string; 
      operator: string; 
      value: string; 
      branchA: string; 
      branchB: string 
    };
    
    const memberData = context.memberData as Record<string, unknown>;
    const fieldValue = memberData[config.field];
    
    let conditionMet = false;
    let actualValue = String(fieldValue ?? '');
    
    switch (config.operator) {
      case 'equals':
        conditionMet = actualValue === config.value;
        break;
      case 'not_equals':
        conditionMet = actualValue !== config.value;
        break;
      case 'contains':
        conditionMet = actualValue.includes(config.value);
        break;
      case 'starts_with':
        conditionMet = actualValue.startsWith(config.value);
        break;
      case 'greater_than':
        conditionMet = parseFloat(actualValue) > parseFloat(config.value);
        break;
      case 'less_than':
        conditionMet = parseFloat(actualValue) < parseFloat(config.value);
        break;
      default:
        conditionMet = false;
    }
    
    const nextNodeId = conditionMet ? config.branchA : config.branchB;
    
    const explanation = `CONDITION节点执行: 检查字段 "${config.field}" ${config.operator} "${config.value}"。` +
      `实际值: "${actualValue}"。结果: ${conditionMet ? '满足条件' : '不满足条件'}。` +
      `下一个节点: ${nextNodeId || '无'}`;
    
    return {
      success: true,
      nextNodeId,
      outputs: {
        conditionMet,
        fieldValue: actualValue,
      },
      explanation,
    };
  }
  
  private handleWaitNode(node: JourneyNode, context: JourneyExecutionContext): AutomationResult {
    const config = node.config as { duration: number; unit: 'minutes' | 'hours' | 'days'; until?: string };
    
    let waitMs = 0;
    
    if (config.until) {
      const untilDate = new Date(config.until);
      waitMs = untilDate.getTime() - Date.now();
    } else {
      switch (config.unit) {
        case 'minutes':
          waitMs = config.duration * 60 * 1000;
          break;
        case 'hours':
          waitMs = config.duration * 60 * 60 * 1000;
          break;
        case 'days':
          waitMs = config.duration * 24 * 60 * 60 * 1000;
          break;
      }
    }
    
    const waitUntil = new Date(Date.now() + Math.max(0, waitMs));
    
    const explanation = `WAIT节点执行: 等待 ${config.duration} ${config.unit}。` +
      `预计恢复时间: ${waitUntil.toISOString()}`;
    
    return {
      success: true,
      shouldWait: true,
      waitUntil,
      outputs: {
        waitDurationMs: waitMs,
        waitUntil: waitUntil.toISOString(),
      },
      explanation,
    };
  }
  
  private handleAbTestNode(node: JourneyNode, context: JourneyExecutionContext): AutomationResult {
    const config = node.config as { branchA: string; branchB: string; splitPercentage?: number };
    
    const splitPercentage = config.splitPercentage ?? 50;
    const isGroupA = (context.abTestGroup === 'A') || (Math.random() * 100 < splitPercentage);
    
    if (!context.abTestGroup) {
      context.abTestGroup = isGroupA ? 'A' : 'B';
    }
    
    const nextNodeId = isGroupA ? config.branchA : config.branchB;
    
    const explanation = `A/B_TEST节点执行: 分流比例 ${splitPercentage}% / ${100 - splitPercentage}%。` +
      `当前用户分配到组: ${context.abTestGroup}。` +
      `下一个节点: ${nextNodeId}`;
    
    return {
      success: true,
      nextNodeId,
      outputs: {
        abTestGroup: context.abTestGroup,
        splitPercentage,
      },
      explanation,
    };
  }
  
  private handleEndNode(node: JourneyNode, context: JourneyExecutionContext): AutomationResult {
    const explanation = `END节点执行: 旅程结束。` +
      `访问节点数: ${context.visitedNodes.length}。` +
      `成员: ${context.memberData.email}`;
    
    prisma.journeyExecution.update({
      where: { id: context.executionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    }).catch(err => {
      logger.error('Failed to update journey execution status:', err);
    });
    
    return {
      success: true,
      explanation,
    };
  }
  
  async getNextNode(journeyId: string, currentNodeId: string, conditionResult?: boolean): Promise<string | null> {
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
    });
    
    if (!journey) {
      return null;
    }
    
    const edges = journey.edges as unknown as JourneyEdge[];
    
    const outgoingEdges = edges.filter(e => e.source === currentNodeId);
    
    if (outgoingEdges.length === 0) {
      return null;
    }
    
    if (conditionResult !== undefined) {
      const conditionEdge = outgoingEdges.find(e => e.condition === (conditionResult ? 'true' : 'false'));
      if (conditionEdge) {
        return conditionEdge.target;
      }
    }
    
    const defaultEdge = outgoingEdges.find(e => !e.condition || e.condition === 'default');
    if (defaultEdge) {
      return defaultEdge.target;
    }
    
    return outgoingEdges[0].target;
  }
  
  async getExecutionProgress(executionId: string) {
    const execution = await prisma.journeyExecution.findUnique({
      where: { id: executionId },
      include: {
        journey: true,
        member: true,
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    if (!execution) {
      return null;
    }
    
    const visitedNodes = execution.visitedNodes as string[];
    const allNodes = execution.journey.nodes as unknown as JourneyNode[];
    
    const progress = {
      executionId: execution.id,
      status: execution.status,
      member: {
        id: execution.member.id,
        email: execution.member.email,
        name: execution.member.name,
      },
      currentNodeId: execution.currentNodeId,
      visitedNodes,
      totalNodes: allNodes.length,
      progressPercentage: Math.round((visitedNodes.length / allNodes.length) * 100),
      abTestGroup: execution.abTestGroup,
      logs: execution.logs.map(log => ({
        id: log.id,
        nodeId: log.nodeId,
        action: log.action,
        details: log.details,
        error: log.error,
        timestamp: log.createdAt,
      })),
      startedAt: execution.startedAt,
      lastActiveAt: execution.lastActiveAt,
      endedAt: execution.endedAt,
    };
    
    return progress;
  }
}

export const marketingAutomationEngine = new MarketingAutomationEngine();
export default marketingAutomationEngine;
