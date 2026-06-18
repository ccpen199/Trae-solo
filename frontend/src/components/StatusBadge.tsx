import React from 'react';
import { Tag } from 'antd';
import type { DeviceStatus, WorkingStatus, BookingStatus, OrderStatus, PaymentStatus, WorkOrderStatus, Priority } from '@/types';
import { DEVICE_STATUS_MAP, WORKING_STATUS_MAP, BOOKING_STATUS_MAP, ORDER_STATUS_MAP, PAYMENT_STATUS_MAP, WORK_ORDER_STATUS_MAP, PRIORITY_MAP, PRIORITY_COLOR_MAP } from '@/utils/constants';

interface StatusBadgeProps {
  type: 'device' | 'working' | 'booking' | 'order' | 'payment' | 'workOrder' | 'priority';
  status: string;
}

const getStatusConfig = (type: StatusBadgeProps['type'], status: string) => {
  switch (type) {
    case 'device':
      return {
        text: DEVICE_STATUS_MAP[status as DeviceStatus] || status,
        color: {
          online: 'success',
          offline: 'default',
          maintenance: 'warning',
          faulty: 'error',
          retired: 'default',
        }[status] || 'default',
      };
    case 'working':
      return {
        text: WORKING_STATUS_MAP[status as WorkingStatus] || status,
        color: {
          idle: 'processing',
          running: 'success',
          paused: 'warning',
          reserved: 'purple',
          completed: 'success',
        }[status] || 'default',
      };
    case 'booking':
      return {
        text: BOOKING_STATUS_MAP[status as BookingStatus] || status,
        color: {
          pending: 'warning',
          confirmed: 'processing',
          active: 'success',
          completed: 'success',
          cancelled: 'default',
          expired: 'error',
          refunded: 'purple',
        }[status] || 'default',
      };
    case 'order':
      return {
        text: ORDER_STATUS_MAP[status as OrderStatus] || status,
        color: {
          pending: 'warning',
          processing: 'processing',
          completed: 'success',
          cancelled: 'default',
          refunded: 'purple',
          failed: 'error',
        }[status] || 'default',
      };
    case 'payment':
      return {
        text: PAYMENT_STATUS_MAP[status as PaymentStatus] || status,
        color: {
          unpaid: 'warning',
          paid: 'success',
          refunding: 'processing',
          refunded: 'purple',
          failed: 'error',
          cancelled: 'default',
        }[status] || 'default',
      };
    case 'workOrder':
      return {
        text: WORK_ORDER_STATUS_MAP[status as WorkOrderStatus] || status,
        color: {
          pending: 'warning',
          assigned: 'processing',
          processing: 'processing',
          pending_parts: 'warning',
          completed: 'success',
          cancelled: 'default',
          rejected: 'error',
        }[status] || 'default',
      };
    case 'priority':
      return {
        text: PRIORITY_MAP[status as Priority] || status,
        color: PRIORITY_COLOR_MAP[status as Priority] || 'default',
      };
    default:
      return { text: status, color: 'default' };
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status }) => {
  const config = getStatusConfig(type, status);
  return <Tag color={config.color as any}>{config.text}</Tag>;
};

export default StatusBadge;
