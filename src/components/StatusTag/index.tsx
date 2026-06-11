import React from 'react';
import { Tag } from 'antd';
import {
  billStatusMap,
  paymentStatusMap,
  announcementTypeMap,
  announcementStatusMap,
  workOrderStatusMap,
  workOrderTypeMap,
  serviceTypeMap,
} from '@/utils/format';

interface StatusTagProps {
  type: 'bill' | 'payment' | 'announcementType' | 'announcement' | 'workOrderStatus' | 'workOrderType' | 'service';
  status: number | string;
}

const StatusTag: React.FC<StatusTagProps> = ({ type, status }) => {
  const mapMap: Record<string, Record<any, { text: string; color: string }>> = {
    bill: billStatusMap,
    payment: paymentStatusMap,
    announcementType: announcementTypeMap,
    announcement: announcementStatusMap,
    workOrderStatus: workOrderStatusMap,
    workOrderType: workOrderTypeMap,
    service: serviceTypeMap as any,
  };

  const map = mapMap[type];
  if (!map || !map[status]) {
    return <Tag>未知</Tag>;
  }

  const { text, color } = map[status];
  return <Tag color={color}>{text}</Tag>;
};

export default StatusTag;
