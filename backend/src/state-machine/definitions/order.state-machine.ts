import { StateMachineDefinition } from '../types/state-machine.types';

export const OrderStateMachine: StateMachineDefinition = {
  name: 'Order',
  initialState: 'PENDING_ACCEPT',
  transitions: [
    {
      from: 'PENDING_ACCEPT',
      to: 'ACCEPTED',
      event: 'accept',
      action: async (context) => {
        console.log(`订单 ${context.entityId} 已被农机手接受`);
      },
    },
    {
      from: 'PENDING_ACCEPT',
      to: 'CANCELLED',
      event: 'reject',
      action: async (context) => {
        console.log(`订单 ${context.entityId} 已被农机手拒绝`);
      },
    },
    {
      from: 'PENDING_ACCEPT',
      to: 'CANCELLED',
      event: 'cancel',
      guard: (context) => {
        return true;
      },
      action: async (context) => {
        console.log(`订单 ${context.entityId} 已取消`);
      },
    },
    {
      from: 'ACCEPTED',
      to: 'ARRIVED',
      event: 'arrive',
      action: async (context) => {
        console.log(`订单 ${context.entityId} 农机手已到达作业地点`);
      },
    },
    {
      from: 'ACCEPTED',
      to: 'CANCELLED',
      event: 'cancel',
      guard: (context) => {
        return true;
      },
      action: async (context) => {
        console.log(`订单 ${context.entityId} 已取消`);
      },
    },
    {
      from: 'ARRIVED',
      to: 'IN_PROGRESS',
      event: 'start_work',
      action: async (context) => {
        console.log(`订单 ${context.entityId} 开始作业`);
      },
    },
    {
      from: 'IN_PROGRESS',
      to: 'COMPLETED',
      event: 'complete',
      action: async (context) => {
        console.log(`订单 ${context.entityId} 作业完成`);
      },
    },
    {
      from: 'COMPLETED',
      to: 'VERIFIED',
      event: 'verify',
      action: async (context) => {
        console.log(`订单 ${context.entityId} 已验收通过`);
      },
    },
    {
      from: 'VERIFIED',
      to: 'SETTLED',
      event: 'settle',
      action: async (context) => {
        console.log(`订单 ${context.entityId} 已结算`);
      },
    },
    {
      from: 'COMPLETED',
      to: 'IN_PROGRESS',
      event: 'rework',
      action: async (context) => {
        console.log(`订单 ${context.entityId} 返工`);
      },
    },
  ],
};
