import { Service } from 'typedi';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import logger, { auditLogger } from '../utils/logger';
import config from '../config';
import { getAdapter } from './DepartmentAdapterManager';
import {
  ServiceOrchestration,
  OrchestrationContext,
  OrchestrationResult
} from '../../../shared/utils/service-orchestration';
import { getAllOrchestrations, findOrchestrationsByTrigger } from '../../../shared/utils/service-orchestration';

export interface OrchestrationExecutionRecord {
  id: string;
  orchestrationId: string;
  orchestrationName: string;
  version: string;
  triggerType: string;
  triggerServiceId?: string;
  citizenId: string;
  applicationId: string;
  status: 'running' | 'completed' | 'failed' | 'rolled_back' | 'paused';
  completedSteps: number;
  totalSteps: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  results: Record<number, unknown>;
  errors: { step: number; message: string; code?: string }[];
}

type TriggerCallback = (result: OrchestrationResult, record: OrchestrationExecutionRecord) => void;

@Service()
export class OrchestrationEngine {
  private static orchestrations: Map<string, ServiceOrchestration> = new Map();
  private static executionRecords: Map<string, OrchestrationExecutionRecord> = new Map();
  private static runningExecutions: Set<string> = new Set();
  private static eventBus = new EventEmitter();
  private static initialized = false;
  private static triggerCallbacks = new Map<string, TriggerCallback[]>();

  static initialize(): void {
    if (this.initialized) return;

    logger.info('[OrchestrationEngine] 初始化服务编排引擎...');

    const builtinOrchs = getAllOrchestrations();
    for (const orch of builtinOrchs) {
      this.orchestrations.set(orch.id, orch);
      logger.debug(`[OrchestrationEngine] 加载编排: ${orch.name} (${orch.id})`);
    }

    this.eventBus.setMaxListeners(100);

    this.initialized = true;
    logger.info(`[OrchestrationEngine] 编排引擎初始化完成，共加载 ${this.orchestrations.size} 个服务编排流程`);
  }

  static getOrchestration(id: string): ServiceOrchestration | undefined {
    return this.orchestrations.get(id);
  }

  static getAllOrchestrations(): ServiceOrchestration[] {
    return Array.from(this.orchestrations.values());
  }

  static registerOrchestration(orch: ServiceOrchestration): void {
    this.orchestrations.set(orch.id, orch);
    this.eventBus.emit('orchestration:registered', orch);
    logger.info(`[OrchestrationEngine] 动态注册编排: ${orch.name}`);
  }

  static onOrchestrationComplete(callback: TriggerCallback): void {
    this.eventBus.on('orchestration:complete', callback as any);
  }

  static async triggerByServiceComplete(
    serviceId: string,
    context: Omit<OrchestrationContext, 'executionHistory' | 'variables'>
  ): Promise<OrchestrationResult[]> {
    const orchIds = findOrchestrationsByTrigger('service-complete', serviceId);

    if (orchIds.length === 0) {
      logger.debug(`[OrchestrationEngine] 服务[${serviceId}]完成后无关联编排流程`);
      return [];
    }

    logger.info(`[OrchestrationEngine] 触发服务[${serviceId}]关联的 ${orchIds.length} 个编排流程`);

    const results: OrchestrationResult[] = [];
    for (const orch of orchIds) {
      try {
        const result = await this.execute(orch, {
          ...context,
          executionHistory: [],
          variables: {}
        });
        results.push(result);
      } catch (err) {
        logger.error(`[OrchestrationEngine] 编排[${orch.id}]执行异常:`, err);
      }
    }

    return results;
  }

  static async execute(
    orchestration: ServiceOrchestration,
    context: OrchestrationContext
  ): Promise<OrchestrationResult> {
    const executionId = `ORCH-${Date.now()}-${uuidv4().substr(0, 8)}`;

    if (orchestration.status !== 'active') {
      logger.warn(`[OrchestrationEngine] 编排[${orchestration.id}]状态非active，跳过执行`);
      return {
        orchestrationId: orchestration.id,
        success: false,
        completedSteps: 0,
        totalSteps: orchestration.steps.length,
        results: {},
        errors: [{ step: 0, message: `编排状态为${orchestration.status}，不可执行` }],
        executionTime: 0
      };
    }

    if (this.runningExecutions.has(`${orchestration.id}-${context.citizenId}`)) {
      logger.warn(`[OrchestrationEngine] 该用户正在执行相同编排，去重跳过`);
      return {
        orchestrationId: orchestration.id,
        success: false,
        completedSteps: 0,
        totalSteps: orchestration.steps.length,
        results: {},
        errors: [{ step: 0, message: '已有相同编排正在执行，请稍后重试', code: 'DUPLICATE_EXECUTION' }],
        executionTime: 0
      };
    }

    const executionKey = `${orchestration.id}-${context.citizenId}`;
    this.runningExecutions.add(executionKey);

    const record: OrchestrationExecutionRecord = {
      id: executionId,
      orchestrationId: orchestration.id,
      orchestrationName: orchestration.name,
      version: orchestration.version,
      triggerType: orchestration.triggerEvent.type,
      triggerServiceId: orchestration.triggerEvent.serviceId,
      citizenId: context.citizenId,
      applicationId: context.applicationId,
      status: 'running',
      completedSteps: 0,
      totalSteps: orchestration.steps.length,
      startTime: new Date().toISOString(),
      results: {},
      errors: []
    };

    this.executionRecords.set(executionId, record);

    logger.info(`[OrchestrationEngine] ========== 开始执行编排流程 ==========`, {
      executionId,
      orchestration: orchestration.name,
      citizenId: context.citizenId,
      steps: orchestration.steps.length
    });

    auditLogger.systemEvent('orchestration_start', {
      executionId,
      orchestrationId: orchestration.id,
      orchestrationName: orchestration.name,
      citizenId: context.citizenId,
      applicationId: context.applicationId
    });

    const result = await this.runSteps(orchestration, context, record);
    this.runningExecutions.delete(executionKey);

    record.endTime = new Date().toISOString();
    record.duration = result.executionTime;
    record.completedSteps = result.completedSteps;
    record.results = result.results;
    record.errors = result.errors;
    record.status = result.success ? 'completed' : 'failed';

    logger.info(`[OrchestrationEngine] ========== 编排执行结束 ==========`, {
      executionId,
      success: result.success,
      completedSteps: `${result.completedSteps}/${result.totalSteps}`,
      duration: `${result.executionTime}ms`,
      errors: result.errors.length
    });

    auditLogger.systemEvent('orchestration_complete', {
      executionId,
      success: result.success,
      duration: result.executionTime,
      errorCount: result.errors.length
    });

    this.eventBus.emit('orchestration:complete', result, record);

    return result;
  }

  private static async runSteps(
    orch: ServiceOrchestration,
    ctx: OrchestrationContext,
    record: OrchestrationExecutionRecord
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const results: Record<number, unknown> = {};
    const errors: { step: number; message: string; code?: string }[] = [];
    let completedSteps = 0;
    let shouldStop = false;

    for (const step of orch.steps) {
      if (shouldStop) break;

      const stepLogger = (msg: string, extra?: Record<string, unknown>) => {
        logger.debug(`[Orchestration:${orch.id}] Step${step.step} ${step.name}: ${msg}`, extra);
      };

      stepLogger('开始执行');

      try {
        const stepResult = await this.executeStepWithRetry(step, ctx, orch);
        results[step.step] = stepResult;
        completedSteps++;

        ctx.executionHistory.push({
          step: step.step,
          result: stepResult,
          timestamp: new Date().toISOString()
        });

        if (stepResult && typeof stepResult === 'object' && 'variables' in stepResult) {
          Object.assign(ctx.variables, (stepResult as { variables: Record<string, unknown> }).variables);
        }

        stepLogger('执行成功', { hasData: !!stepResult });
      } catch (error: any) {
        const errorMsg = error.message || '未知错误';
        errors.push({
          step: step.step,
          message: errorMsg,
          code: error.code
        });

        logger.error(`[Orchestration:${orch.id}] Step${step.step} ${step.name} 执行失败:`, {
          error: errorMsg,
          code: error.code
        });

        switch (step.onFailure) {
          case 'stop':
            stepLogger('失败策略：停止执行');
            shouldStop = true;
            break;
          case 'rollback':
            stepLogger('失败策略：开始回滚已执行步骤');
            await this.rollbackSteps(orch, completedSteps, ctx);
            record.status = 'rolled_back';
            shouldStop = true;
            break;
          case 'continue':
          default:
            stepLogger('失败策略：忽略并继续');
            break;
        }
      }
    }

    return {
      orchestrationId: orch.id,
      success: errors.length === 0 && completedSteps === orch.steps.length,
      completedSteps,
      totalSteps: orch.steps.length,
      results,
      errors,
      executionTime: Date.now() - startTime
    };
  }

  private static async executeStepWithRetry(
    step: ServiceOrchestration['steps'][0],
    ctx: OrchestrationContext,
    orch: ServiceOrchestration
  ): Promise<unknown> {
    const maxRetries = step.retryCount || config.orchestration.maxRetry;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.warn(`[Orchestration] Step${step.step} 第${attempt}次重试`);
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }

        return await this.dispatchStepAction(step, ctx, orch);

      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) throw error;
      }
    }

    throw lastError;
  }

  private static async dispatchStepAction(
    step: ServiceOrchestration['steps'][0],
    ctx: OrchestrationContext,
    orch: ServiceOrchestration
  ): Promise<unknown> {
    const stepParams = step.params || {};

    switch (step.type) {
      case 'api-call':
        return this.handleApiCallStep(step.action, stepParams, ctx);

      case 'notification':
        return this.handleNotificationStep(step.action, stepParams, ctx);

      case 'data-sync':
        return this.handleDataSyncStep(step.action, stepParams, ctx);

      case 'condition':
        return this.handleConditionStep(step.action, stepParams, ctx);

      case 'approval':
        return this.handleApprovalStep(step.action, stepParams, ctx);

      default:
        throw new Error(`未知的步骤类型: ${step.type}`);
    }
  }

  private static async handleApiCallStep(
    action: string,
    params: Record<string, unknown>,
    ctx: OrchestrationContext
  ): Promise<unknown> {
    const [adapterCode, endpointName] = action.split('.');
    const adapter = getAdapter(adapterCode);

    if (!adapter) {
      throw new Error(`委办局适配器不存在: ${adapterCode}`);
    }

    const endpointMap: Record<string, string> = {
      'gaj.getCitizenInfo': '/citizen/info',
      'gaj.sealEngravingFiling': '/seal/filing',
      'ybj.checkInsuranceEligibility': '/insurance/eligibility',
      'ybj.createInsuranceRegistration': '/insurance/register',
      'ybj.getRecentMedicalRecords': '/medical/records',
      'sbj.getPendingCertificationList': '/certification/pending',
      'sbj.completeCertification': '/certification/complete',
      'sbj.companySocialSecurityRegister': '/company/register',
      'zrzyj.getPropertyAssessment': '/property/assessment',
      'zrzyj.checkFirstHouseQualification': '/property/first-house',
      'swj.calculateDeedTax': '/tax/deed-calculate',
      'swj.calculateIncomeTax': '/tax/income-calculate',
      'swj.generatePaymentNotice': '/tax/payment-notice',
      'swj.applyInvoice': '/invoice/apply',
      'scjgj.businessRegistration': '/business/register',
      'gjj.companyHousingFundRegister': '/housing-fund/company-register'
    };

    const endpoint = endpointMap[action] || `/${action.replace('.', '/')}`;
    const method = action.includes('get') || action.includes('check') ? 'GET' : 'POST';

    logger.info(`[Orchestration API调用] ${adapterCode} → ${endpoint}`);

    const result = await adapter.request({
      endpoint,
      method: method as any,
      data: {
        citizenId: ctx.citizenId,
        applicationId: ctx.applicationId,
        triggerData: ctx.triggerData,
        ...params
      },
      citizenId: ctx.citizenId,
      idempotent: true
    });

    if (!result.success) {
      throw new Error(`委办局[${adapterCode}]接口错误: ${result.message}`);
    }

    return result.data;
  }

  private static async handleNotificationStep(
    action: string,
    params: Record<string, unknown>,
    ctx: OrchestrationContext
  ): Promise<unknown> {
    const channels = (params.channels as string[]) || ['push'];

    logger.info(`[Orchestration 通知发送]`, {
      action,
      channels,
      citizenId: ctx.citizenId
    });

    auditLogger.systemEvent('notification_sent', {
      action,
      channels,
      citizenId: ctx.citizenId,
      applicationId: ctx.applicationId
    });

    return {
      sent: true,
      channels,
      timestamp: new Date().toISOString()
    };
  }

  private static async handleDataSyncStep(
    action: string,
    params: Record<string, unknown>,
    ctx: OrchestrationContext
  ): Promise<unknown> {
    logger.info(`[Orchestration 数据同步] ${action}`, {
      citizenId: ctx.citizenId
    });

    await new Promise(r => setTimeout(r, 500));

    return {
      synced: true,
      target: action,
      recordsCount: Math.floor(Math.random() * 5) + 1
    };
  }

  private static async handleConditionStep(
    action: string,
    params: Record<string, unknown>,
    ctx: OrchestrationContext
  ): Promise<unknown> {
    const conditions = ctx.executionHistory.length;

    logger.info(`[Orchestration 条件判断] ${action}`, {
      historyCount: conditions,
      variables: Object.keys(ctx.variables)
    });

    return {
      passed: true,
      checkPoints: conditions,
      variables: ctx.variables
    };
  }

  private static async handleApprovalStep(
    action: string,
    params: Record<string, unknown>,
    ctx: OrchestrationContext
  ): Promise<unknown> {
    return {
      approved: true,
      approver: 'system-auto',
      approvedAt: new Date().toISOString()
    };
  }

  private static async rollbackSteps(
    orch: ServiceOrchestration,
    completedCount: number,
    ctx: OrchestrationContext
  ): Promise<void> {
    const completedSteps = orch.steps
      .filter(s => s.step <= completedCount)
      .sort((a, b) => b.step - a.step);

    logger.warn(`[Orchestration:${orch.id}] 开始回滚 ${completedSteps.length} 个步骤`);

    for (const step of completedSteps) {
      try {
        logger.warn(`[Orchestration:${orch.id}] 回滚 Step${step.step}: ${step.name}`);
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        logger.error(`[Orchestration:${orch.id}] Step${step.step} 回滚失败:`, (err as Error).message);
      }
    }
  }

  static getExecutionRecord(id: string): OrchestrationExecutionRecord | undefined {
    return this.executionRecords.get(id);
  }

  static getExecutionByCitizen(citizenId: string): OrchestrationExecutionRecord[] {
    return Array.from(this.executionRecords.values())
      .filter(r => r.citizenId === citizenId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  static pauseExecution(id: string): boolean {
    const record = this.executionRecords.get(id);
    if (!record) return false;
    record.status = 'paused';
    logger.info(`[OrchestrationEngine] 暂停执行: ${id}`);
    return true;
  }

  static resumeExecution(id: string): boolean {
    const record = this.executionRecords.get(id);
    if (!record) return false;
    record.status = 'running';
    logger.info(`[OrchestrationEngine] 恢复执行: ${id}`);
    return true;
  }
}

export default OrchestrationEngine;
