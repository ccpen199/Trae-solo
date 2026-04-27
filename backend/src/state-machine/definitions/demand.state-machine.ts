import { StateMachineDefinition } from '../types/state-machine.types';

export const DemandStateMachine: StateMachineDefinition = {
  name: 'Demand',
  initialState: 'DRAFT',
  transitions: [
    {
      from: 'DRAFT',
      to: 'PENDING_MATCH',
      event: 'submit',
      action: async (context) => {
        console.log(`需求单 ${context.entityId} 已提交，等待匹配`);
      },
    },
    {
      from: 'PENDING_MATCH',
      to: 'MATCHING',
      event: 'start_match',
      action: async (context) => {
        console.log(`需求单 ${context.entityId} 开始匹配农机`);
      },
    },
    {
      from: 'MATCHING',
      to: 'MATCHED',
      event: 'match_success',
      action: async (context) => {
        console.log(`需求单 ${context.entityId} 匹配成功`);
      },
    },
    {
      from: 'MATCHED',
      to: 'DISPATCHED',
      event: 'dispatch',
      action: async (context) => {
        console.log(`需求单 ${context.entityId} 已派单`);
      },
    },
    {
      from: 'DRAFT',
      to: 'CANCELLED',
      event: 'cancel',
      guard: (context) => {
        return true;
      },
      action: async (context) => {
        console.log(`需求单 ${context.entityId} 已取消`);
      },
    },
    {
      from: 'PENDING_MATCH',
      to: 'CANCELLED',
      event: 'cancel',
      action: async (context) => {
        console.log(`需求单 ${context.entityId} 已取消`);
      },
    },
    {
      from: 'MATCHING',
      to: 'CANCELLED',
      event: 'cancel',
      action: async (context) => {
        console.log(`需求单 ${context.entityId} 已取消`);
      },
    },
    {
      from: 'MATCHED',
      to: 'CANCELLED',
      event: 'cancel',
      guard: (context) => {
        return true;
      },
      action: async (context) => {
        console.log(`需求单 ${context.entityId} 已取消`);
      },
    },
  ],
};
