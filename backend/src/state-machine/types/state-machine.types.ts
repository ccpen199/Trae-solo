export type StateTransition = {
  from: string;
  to: string;
  event: string;
  guard?: (context: TransitionContext) => boolean | Promise<boolean>;
  action?: (context: TransitionContext) => void | Promise<void>;
};

export type TransitionContext = {
  entityId: string;
  userId?: string;
  data?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

export type StateMachineDefinition = {
  name: string;
  initialState: string;
  transitions: StateTransition[];
  onStateChange?: (
    entityId: string,
    fromState: string,
    toState: string,
    event: string,
    context: TransitionContext,
  ) => void | Promise<void>;
};

export type StateMachineResult = {
  success: boolean;
  fromState: string;
  toState?: string;
  event: string;
  error?: string;
};
