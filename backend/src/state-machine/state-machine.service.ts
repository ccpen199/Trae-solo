import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  StateMachineDefinition,
  StateTransition,
  TransitionContext,
  StateMachineResult,
} from './types/state-machine.types';
import { DemandStateMachine } from './definitions/demand.state-machine';
import { OrderStateMachine } from './definitions/order.state-machine';
import { RepairOrderStateMachine } from './definitions/repair-order.state-machine';

@Injectable()
export class StateMachineService {
  private stateMachines: Map<string, StateMachineDefinition> = new Map();

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuditLogService))
    private auditLogService: AuditLogService,
  ) {
    this.registerStateMachine(DemandStateMachine);
    this.registerStateMachine(OrderStateMachine);
    this.registerStateMachine(RepairOrderStateMachine);
  }

  registerStateMachine(definition: StateMachineDefinition): void {
    this.stateMachines.set(definition.name, definition);
  }

  getStateMachine(name: string): StateMachineDefinition | undefined {
    return this.stateMachines.get(name);
  }

  async canTransition(
    machineName: string,
    currentState: string,
    event: string,
    context: TransitionContext,
  ): Promise<boolean> {
    const machine = this.stateMachines.get(machineName);
    if (!machine) {
      return false;
    }

    const transition = this.findTransition(machine, currentState, event);
    if (!transition) {
      return false;
    }

    if (transition.guard) {
      return await transition.guard(context);
    }

    return true;
  }

  async transition(
    machineName: string,
    currentState: string,
    event: string,
    context: TransitionContext,
  ): Promise<StateMachineResult> {
    const machine = this.stateMachines.get(machineName);
    if (!machine) {
      return {
        success: false,
        fromState: currentState,
        event,
        error: `状态机 ${machineName} 不存在`,
      };
    }

    const transition = this.findTransition(machine, currentState, event);
    if (!transition) {
      return {
        success: false,
        fromState: currentState,
        event,
        error: `从 ${currentState} 状态无法通过 ${event} 事件转换`,
      };
    }

    if (transition.guard) {
      const guardResult = await transition.guard(context);
      if (!guardResult) {
        return {
          success: false,
          fromState: currentState,
          event,
          error: `状态转换守卫检查失败`,
        };
      }
    }

    if (transition.action) {
      await transition.action(context);
    }

    if (machine.onStateChange) {
      await machine.onStateChange(
        context.entityId,
        currentState,
        transition.to,
        event,
        context,
      );
    }

    await this.auditLogService.logStateTransition(
      machineName,
      context.entityId,
      currentState,
      transition.to,
      event,
      context,
    );

    return {
      success: true,
      fromState: currentState,
      toState: transition.to,
      event,
    };
  }

  getAvailableTransitions(
    machineName: string,
    currentState: string,
  ): StateTransition[] {
    const machine = this.stateMachines.get(machineName);
    if (!machine) {
      return [];
    }

    return machine.transitions.filter((t) => t.from === currentState);
  }

  getInitialState(machineName: string): string | undefined {
    const machine = this.stateMachines.get(machineName);
    return machine?.initialState;
  }

  private findTransition(
    machine: StateMachineDefinition,
    currentState: string,
    event: string,
  ): StateTransition | undefined {
    return machine.transitions.find(
      (t) => t.from === currentState && t.event === event,
    );
  }

  async transitionDemand(
    demandId: string,
    event: string,
    context: TransitionContext,
  ): Promise<StateMachineResult> {
    const demand = await this.prisma.demand.findUnique({
      where: { id: demandId },
    });

    if (!demand) {
      return {
        success: false,
        fromState: '',
        event,
        error: `需求单 ${demandId} 不存在`,
      };
    }

    return this.transition('Demand', demand.status, event, {
      ...context,
      entityId: demandId,
    });
  }

  async transitionOrder(
    orderId: string,
    event: string,
    context: TransitionContext,
  ): Promise<StateMachineResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return {
        success: false,
        fromState: '',
        event,
        error: `订单 ${orderId} 不存在`,
      };
    }

    return this.transition('Order', order.status, event, {
      ...context,
      entityId: orderId,
    });
  }

  async transitionRepairOrder(
    repairOrderId: string,
    event: string,
    context: TransitionContext,
  ): Promise<StateMachineResult> {
    const repairOrder = await this.prisma.repairOrder.findUnique({
      where: { id: repairOrderId },
    });

    if (!repairOrder) {
      return {
        success: false,
        fromState: '',
        event,
        error: `维修工单 ${repairOrderId} 不存在`,
      };
    }

    return this.transition('RepairOrder', repairOrder.status, event, {
      ...context,
      entityId: repairOrderId,
    });
  }
}
