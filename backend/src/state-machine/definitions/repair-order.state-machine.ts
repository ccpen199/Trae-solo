import { StateMachineDefinition } from '../types/state-machine.types';

export const RepairOrderStateMachine: StateMachineDefinition = {
  name: 'RepairOrder',
  initialState: 'PENDING',
  transitions: [
    {
      from: 'PENDING',
      to: 'ASSIGNED',
      event: 'assign',
      action: async (context) => {
        console.log(`维修工单 ${context.entityId} 已分配给维修人员`);
      },
    },
    {
      from: 'PENDING',
      to: 'CANCELLED',
      event: 'cancel',
      guard: (context) => {
        return true;
      },
      action: async (context) => {
        console.log(`维修工单 ${context.entityId} 已取消`);
      },
    },
    {
      from: 'ASSIGNED',
      to: 'IN_PROGRESS',
      event: 'start_repair',
      action: async (context) => {
        console.log(`维修工单 ${context.entityId} 开始维修`);
      },
    },
    {
      from: 'ASSIGNED',
      to: 'PENDING',
      event: 'reassign',
      action: async (context) => {
        console.log(`维修工单 ${context.entityId} 重新分配`);
      },
    },
    {
      from: 'ASSIGNED',
      to: 'CANCELLED',
      event: 'cancel',
      guard: (context) => {
        return true;
      },
      action: async (context) => {
        console.log(`维修工单 ${context.entityId} 已取消`);
      },
    },
    {
      from: 'IN_PROGRESS',
      to: 'COMPLETED',
      event: 'complete',
      action: async (context) => {
        console.log(`维修工单 ${context.entityId} 维修完成`);
      },
    },
    {
      from: 'IN_PROGRESS',
      to: 'CANCELLED',
      event: 'cancel',
      guard: (context) => {
        return true;
      },
      action: async (context) => {
        console.log(`维修工单 ${context.entityId} 已取消`);
      },
    },
    {
      from: 'COMPLETED',
      to: 'VERIFIED',
      event: 'verify',
      action: async (context) => {
        console.log(`维修工单 ${context.entityId} 已验收通过`);
      },
    },
    {
      from: 'COMPLETED',
      to: 'IN_PROGRESS',
      event: 'rework',
      action: async (context) => {
        console.log(`维修工单 ${context.entityId} 返工维修`);
      },
    },
  ],
};
