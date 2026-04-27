import { OrderStatus, UserRole } from '../../types';
import { 
  StateTransition, 
  TransitionResult, 
  TransitionContext, 
  TransitionHook, 
  ValidationResult 
} from './types';
import { orderStateMachineConfig } from './stateMachineConfig';
import logger from '../../config/logger';

export class OrderFlowEngine {
  private config = orderStateMachineConfig;
  private hooks: Map<string, Map<string, TransitionHook[]>> = new Map();

  constructor() {
    this.initializeHooks();
  }

  private initializeHooks(): void {
    this.hooks.set('before', new Map());
    this.hooks.set('after', new Map());
    this.hooks.set('error', new Map());
  }

  public canTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    actorRole: UserRole
  ): { canTransition: boolean; reason?: string } {
    const transitions = this.findTransitions(currentStatus, targetStatus);
    
    if (transitions.length === 0) {
      return { 
        canTransition: false, 
        reason: `没有从 ${currentStatus} 到 ${targetStatus} 的有效转换路径` 
      };
    }

    const validTransitions = transitions.filter(t => 
      t.allowedRoles.includes(actorRole) || t.allowedRoles.includes('ADMIN')
    );

    if (validTransitions.length === 0) {
      return { 
        canTransition: false, 
        reason: `角色 ${actorRole} 没有权限执行此状态转换` 
      };
    }

    return { canTransition: true };
  }

  public getAvailableTransitions(
    currentStatus: OrderStatus,
    actorRole: UserRole
  ): StateTransition[] {
    return this.config.transitions.filter(t => {
      const fromMatch = t.from === currentStatus || t.from === null;
      const roleMatch = t.allowedRoles.includes(actorRole) || t.allowedRoles.includes('ADMIN');
      return fromMatch && roleMatch && !this.isFinalState(currentStatus);
    });
  }

  public async executeTransition(
    context: TransitionContext,
    validator?: (ctx: TransitionContext) => Promise<ValidationResult>
  ): Promise<TransitionResult> {
    const { currentStatus, targetStatus, actorRole, orderId } = context;

    logger.info(`开始执行订单 ${orderId} 的状态转换: ${currentStatus} -> ${targetStatus}`);

    const canTransitionResult = this.canTransition(currentStatus, targetStatus, actorRole);
    if (!canTransitionResult.canTransition) {
      logger.warn(`订单 ${orderId} 状态转换被拒绝: ${canTransitionResult.reason}`);
      return this.createFailedResult(
        currentStatus, 
        targetStatus, 
        canTransitionResult.reason || '状态转换被拒绝'
      );
    }

    const transition = this.findTransition(currentStatus, targetStatus, actorRole);
    if (!transition) {
      return this.createFailedResult(
        currentStatus, 
        targetStatus, 
        '未找到匹配的转换规则'
      );
    }

    try {
      await this.executeHooks('before', `${currentStatus}:${targetStatus}`, context);

      if (validator) {
        const validationResult = await validator(context);
        if (!validationResult.isValid) {
          return {
            success: false,
            transitioned: false,
            previousStatus: currentStatus,
            newStatus: currentStatus,
            message: '验证失败',
            errors: validationResult.errors,
            warnings: validationResult.warnings,
            metadata: {}
          };
        }
      }

      await this.executeHooks('after', `${currentStatus}:${targetStatus}`, context);

      logger.info(`订单 ${orderId} 状态转换成功: ${currentStatus} -> ${targetStatus}`);

      return {
        success: true,
        transitioned: true,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        message: `状态成功从 ${currentStatus} 转换到 ${targetStatus}`,
        errors: [],
        warnings: [],
        metadata: {
          transitionName: `${currentStatus}:${targetStatus}`,
          sideEffects: transition.sideEffects,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error(`订单 ${orderId} 状态转换失败: ${errorMessage}`, error);

      try {
        await this.executeHooks('error', `${currentStatus}:${targetStatus}`, context);
      } catch (hookError) {
        logger.error('错误钩子执行失败', hookError);
      }

      return this.createFailedResult(
        currentStatus, 
        targetStatus, 
        `状态转换失败: ${errorMessage}`
      );
    }
  }

  public registerHook(hook: TransitionHook): void {
    const eventHooks = this.hooks.get(hook.event);
    if (!eventHooks) {
      throw new Error(`不支持的钩子事件: ${hook.event}`);
    }

    const transitionKey = hook.transition || 'global';
    if (!eventHooks.has(transitionKey)) {
      eventHooks.set(transitionKey, []);
    }

    eventHooks.get(transitionKey)!.push(hook);
    logger.info(`已注册钩子: ${hook.event} - ${hook.name} - ${transitionKey}`);
  }

  public isFinalState(status: OrderStatus): boolean {
    return this.config.finalStates.includes(status);
  }

  public isErrorState(status: OrderStatus): boolean {
    return this.config.errorStates.includes(status);
  }

  public getInitialState(): OrderStatus {
    return this.config.initialState;
  }

  public getTransitionMetadata(from: OrderStatus, to: OrderStatus): {
    requiredConditions: string[];
    sideEffects: string[];
    validationRules: string[];
    allowedRoles: UserRole[];
  } | null {
    const transition = this.findTransition(from, to);
    if (!transition) {
      return null;
    }

    return {
      requiredConditions: transition.requiredConditions,
      sideEffects: transition.sideEffects,
      validationRules: transition.validationRules,
      allowedRoles: transition.allowedRoles
    };
  }

  private findTransitions(
    from: OrderStatus,
    to: OrderStatus
  ): StateTransition[] {
    return this.config.transitions.filter(t => 
      (t.from === from || t.from === null) && t.to === to
    );
  }

  private findTransition(
    from: OrderStatus,
    to: OrderStatus,
    actorRole?: UserRole
  ): StateTransition | null {
    const transitions = this.findTransitions(from, to);
    
    if (!actorRole) {
      return transitions[0] || null;
    }

    return transitions.find(t => 
      t.allowedRoles.includes(actorRole) || t.allowedRoles.includes('ADMIN')
    ) || transitions[0] || null;
  }

  private async executeHooks(
    event: 'before' | 'after' | 'error',
    transitionKey: string,
    context: TransitionContext
  ): Promise<void> {
    const eventHooks = this.hooks.get(event);
    if (!eventHooks) {
      return;
    }

    const globalHooks = eventHooks.get('global') || [];
    const specificHooks = eventHooks.get(transitionKey) || [];
    const allHooks = [...globalHooks, ...specificHooks];

    for (const hook of allHooks) {
      try {
        logger.debug(`执行 ${event} 钩子: ${hook.name}`);
        await hook.handler(context);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        logger.error(`钩子 ${hook.name} 执行失败: ${errorMessage}`, error);
        
        if (event === 'before') {
          throw error;
        }
      }
    }
  }

  private createFailedResult(
    previousStatus: OrderStatus,
    targetStatus: OrderStatus,
    message: string
  ): TransitionResult {
    return {
      success: false,
      transitioned: false,
      previousStatus,
      newStatus: previousStatus,
      message,
      errors: [message],
      warnings: [],
      metadata: {
        attemptedTransition: `${previousStatus}:${targetStatus}`,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export const orderFlowEngine = new OrderFlowEngine();

export default OrderFlowEngine;
