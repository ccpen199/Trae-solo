import { createMachine, assign, ActorLogic, ActorRef, createActor } from 'xstate';
import { v4 as uuidv4 } from 'uuid';
import { CouponStatus, UserRole, AuditAction } from '../types';
import { AppDataSource } from '../database/dataSource';
import { StateTransitionEntity, CouponInstanceEntity } from '../entities';
import { auditService } from '../services/auditService';

export interface CouponContext {
  couponId: string;
  userId: string;
  currentStatus: CouponStatus;
  traceId: string;
  metadata: Record<string, any>;
}

export interface CouponEvent {
  type: string;
  userId: string;
  userRole: UserRole;
  data?: Record<string, any>;
}

export interface CouponState {
  value: CouponStatus;
  context: CouponContext;
}

export class CouponStateMachine {
  private machine: ActorLogic<CouponContext, CouponEvent, CouponState>;
  private allowedTransitions: Map<string, StateTransitionEntity[]> = new Map();
  private static instance: CouponStateMachine;

  private constructor() {
    this.machine = this.createStateMachine();
  }

  static getInstance(): CouponStateMachine {
    if (!CouponStateMachine.instance) {
      CouponStateMachine.instance = new CouponStateMachine();
    }
    return CouponStateMachine.instance;
  }

  async initialize(): Promise<void> {
    await this.loadTransitions();
  }

  private async loadTransitions(): Promise<void> {
    const transitionRepository = AppDataSource.getRepository(StateTransitionEntity);
    const transitions = await transitionRepository.find({ where: { isActive: true } });
    
    this.allowedTransitions.clear();
    for (const transition of transitions) {
      const key = `${transition.from}:${transition.action}`;
      if (!this.allowedTransitions.has(key)) {
        this.allowedTransitions.set(key, []);
      }
      this.allowedTransitions.get(key)!.push(transition);
    }
  }

  private createStateMachine(): ActorLogic<CouponContext, CouponEvent, CouponState> {
    return createMachine({
      id: 'coupon-state-machine',
      initial: CouponStatus.CREATED,
      context: {
        couponId: '',
        userId: '',
        currentStatus: CouponStatus.CREATED,
        traceId: uuidv4(),
        metadata: {}
      },
      states: {
        [CouponStatus.CREATED]: {
          on: {
            APPROVE_DISTRIBUTION: {
              target: CouponStatus.PENDING_DISTRIBUTION,
              actions: assign({
                currentStatus: () => CouponStatus.PENDING_DISTRIBUTION
              }),
              guard: 'canTransition'
            },
            INVALIDATE: {
              target: CouponStatus.INVALID,
              actions: assign({
                currentStatus: () => CouponStatus.INVALID
              }),
              guard: 'canTransition'
            }
          }
        },
        [CouponStatus.PENDING_DISTRIBUTION]: {
          on: {
            START_DISTRIBUTION: {
              target: CouponStatus.DISTRIBUTING,
              actions: assign({
                currentStatus: () => CouponStatus.DISTRIBUTING
              }),
              guard: 'canTransition'
            }
          }
        },
        [CouponStatus.DISTRIBUTING]: {
          on: {
            COMPLETE_DISTRIBUTION: {
              target: CouponStatus.PENDING_USE,
              actions: assign({
                currentStatus: () => CouponStatus.PENDING_USE
              }),
              guard: 'canTransition'
            }
          }
        },
        [CouponStatus.PENDING_USE]: {
          on: {
            USE: {
              target: CouponStatus.USED,
              actions: assign({
                currentStatus: () => CouponStatus.USED
              }),
              guard: 'canTransition'
            },
            CANCEL: {
              target: CouponStatus.CANCELLED,
              actions: assign({
                currentStatus: () => CouponStatus.CANCELLED
              }),
              guard: 'canTransition'
            },
            FREEZE: {
              target: CouponStatus.FROZEN,
              actions: assign({
                currentStatus: () => CouponStatus.FROZEN
              }),
              guard: 'canTransition'
            },
            EXPIRE: {
              target: CouponStatus.EXPIRED,
              actions: assign({
                currentStatus: () => CouponStatus.EXPIRED
              }),
              guard: 'canTransition'
            }
          }
        },
        [CouponStatus.USED]: {
          on: {
            REFUND: {
              target: CouponStatus.REFUNDED,
              actions: assign({
                currentStatus: () => CouponStatus.REFUNDED
              }),
              guard: 'canTransition'
            }
          }
        },
        [CouponStatus.FROZEN]: {
          on: {
            UNFREEZE: {
              target: CouponStatus.PENDING_USE,
              actions: assign({
                currentStatus: () => CouponStatus.PENDING_USE
              }),
              guard: 'canTransition'
            }
          }
        },
        [CouponStatus.REFUNDED]: { type: 'final' },
        [CouponStatus.CANCELLED]: { type: 'final' },
        [CouponStatus.EXPIRED]: { type: 'final' },
        [CouponStatus.INVALID]: { type: 'final' }
      }
    }, {
      guards: {
        canTransition: (context: CouponContext, event: CouponEvent) => {
          const action = event.type.toLowerCase();
          const key = `${context.currentStatus}:${action}`;
          const transitions = this.allowedTransitions.get(key);
          
          if (!transitions || transitions.length === 0) {
            return false;
          }
          
          return transitions.some(t => 
            t.allowedRoles.includes(event.userRole) &&
            this.checkConditions(t.conditions, event)
          );
        }
      }
    });
  }

  private checkConditions(
    conditions?: string[],
    event: CouponEvent
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }
    
    for (const condition of conditions) {
      switch (condition) {
        case 'is_admin':
          if (event.userRole !== UserRole.ADMIN) return false;
          break;
        case 'has_permission':
          if (!event.data?.hasPermission) return false;
          break;
        case 'within_validity':
          if (!event.data?.withinValidity) return false;
          break;
        default:
          break;
      }
    }
    
    return true;
  }

  async canTransition(
    currentStatus: CouponStatus,
    action: string,
    userRole: UserRole
  ): Promise<boolean> {
    const key = `${currentStatus}:${action.toLowerCase()}`;
    const transitions = this.allowedTransitions.get(key);
    
    if (!transitions || transitions.length === 0) {
      return false;
    }
    
    return transitions.some(t => t.allowedRoles.includes(userRole));
  }

  async transition(
    couponId: string,
    currentStatus: CouponStatus,
    action: string,
    userId: string,
    userRole: UserRole,
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; newStatus?: CouponStatus; error?: string }> {
    const canTransition = await this.canTransition(currentStatus, action, userRole);
    
    if (!canTransition) {
      return {
        success: false,
        error: `Cannot transition from ${currentStatus} with action ${action} for role ${userRole}`
      };
    }
    
    const key = `${currentStatus}:${action.toLowerCase()}`;
    const transitions = this.allowedTransitions.get(key);
    const targetTransition = transitions?.find(t => t.allowedRoles.includes(userRole));
    
    if (!targetTransition) {
      return { success: false, error: 'No valid transition found' };
    }
    
    const couponRepository = AppDataSource.getRepository(CouponInstanceEntity);
    const coupon = await couponRepository.findOne({ where: { id: couponId } });
    
    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }
    
    const oldStatus = coupon.status;
    coupon.status = targetTransition.to;
    coupon.updatedAt = new Date();
    
    if (action === 'use') {
      coupon.usedAt = new Date();
    } else if (action === 'refund') {
      coupon.refundedAt = new Date();
    }
    
    await couponRepository.save(coupon);
    
    await auditService.log({
      action: this.getAuditAction(action),
      userId,
      userRole,
      resourceType: 'coupon',
      resourceId: couponId,
      details: {
        oldStatus,
        newStatus: targetTransition.to,
        action,
        metadata
      }
    });
    
    return {
      success: true,
      newStatus: targetTransition.to
    };
  }

  private getAuditAction(action: string): AuditAction {
    const actionMap: Record<string, AuditAction> = {
      use: AuditAction.COUPON_USE,
      refund: AuditAction.COUPON_REFUND,
      cancel: AuditAction.COUPON_CANCEL,
      invalidate: AuditAction.COUPON_DELETE,
      approve_distribution: AuditAction.COUPON_DISTRIBUTE,
      start_distribution: AuditAction.COUPON_DISTRIBUTE,
      complete_distribution: AuditAction.COUPON_DISTRIBUTE
    };
    return actionMap[action.toLowerCase()] || AuditAction.COUPON_UPDATE;
  }

  getValidActions(status: CouponStatus): string[] {
    const actions: string[] = [];
    for (const [key, transitions] of this.allowedTransitions) {
      const [fromStatus, action] = key.split(':');
      if (fromStatus === status) {
        actions.push(action);
      }
    }
    return actions;
  }
}

export const couponStateMachine = CouponStateMachine.getInstance();
