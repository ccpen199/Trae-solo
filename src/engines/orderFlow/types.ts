import { OrderStatus, UserRole } from '../../types';

export interface StateTransition {
  from: OrderStatus | null;
  to: OrderStatus;
  allowedRoles: UserRole[];
  requiredConditions: string[];
  sideEffects: string[];
  validationRules: string[];
}

export interface TransitionResult {
  success: boolean;
  transitioned: boolean;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  message: string;
  errors: string[];
  warnings: string[];
  metadata: Record<string, any>;
}

export interface TransitionContext {
  orderId: string;
  currentStatus: OrderStatus;
  targetStatus: OrderStatus;
  actorId: string;
  actorRole: UserRole;
  reason?: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

export interface StateMachineConfig {
  initialState: OrderStatus;
  states: OrderStatus[];
  transitions: StateTransition[];
  finalStates: OrderStatus[];
  errorStates: OrderStatus[];
}

export interface TransitionHook {
  name: string;
  event: 'before' | 'after' | 'error';
  transition: string;
  handler: (context: TransitionContext) => Promise<void>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
