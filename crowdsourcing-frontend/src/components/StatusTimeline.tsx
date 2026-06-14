import React from 'react';
import { Timeline } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  SendOutlined,
  AuditOutlined,
  EditOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { TaskStatus } from '@/types';
import dayjs from 'dayjs';

interface StatusTimelineProps {
  currentStatus: TaskStatus;
  createdAt: string;
  selectedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

interface TimelineItem {
  status: TaskStatus;
  title: string;
  description: string;
  date?: string;
  icon: React.ReactNode;
  color: string;
  done: boolean;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  createdAt,
  selectedAt,
  startedAt,
  submittedAt,
  completedAt,
  cancelledAt
}) => {
  const statusOrder: TaskStatus[] = [
    'draft',
    'pending',
    'published',
    'bidding',
    'selected',
    'in_progress',
    'submitted',
    'reviewing',
    'revising',
    'completed',
    'cancelled',
    'disputed'
  ];

  const getStatusDate = (status: TaskStatus): string | undefined => {
    switch (status) {
      case 'draft':
      case 'pending':
      case 'published':
      case 'bidding':
        return createdAt;
      case 'selected':
        return selectedAt;
      case 'in_progress':
        return startedAt;
      case 'submitted':
      case 'reviewing':
      case 'revising':
        return submittedAt;
      case 'completed':
        return completedAt;
      case 'cancelled':
        return cancelledAt;
      default:
        return undefined;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'draft':
        return <FileTextOutlined />;
      case 'pending':
        return <ClockCircleOutlined />;
      case 'published':
        return <SendOutlined />;
      case 'bidding':
        return <UserOutlined />;
      case 'selected':
        return <UserOutlined />;
      case 'in_progress':
        return <EditOutlined />;
      case 'submitted':
        return <SendOutlined />;
      case 'reviewing':
        return <AuditOutlined />;
      case 'revising':
        return <EditOutlined />;
      case 'completed':
        return <TrophyOutlined />;
      case 'cancelled':
        return <CloseCircleOutlined />;
      case 'disputed':
        return <WarningOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getStatusTitle = (status: TaskStatus): string => {
    const names: Record<TaskStatus, string> = {
      draft: '创建草稿',
      pending: '提交受理',
      published: '事项发布',
      bidding: '开始申请',
      selected: '指派承办',
      in_progress: '开始办理',
      submitted: '提交结果',
      reviewing: '审核中',
      revising: '退回修改',
      completed: '办件完成',
      cancelled: '办件撤销',
      disputed: '发起异议'
    };
    return names[status];
  };

  const getStatusDescription = (status: TaskStatus): string => {
    const descriptions: Record<TaskStatus, string> = {
      draft: '办件已创建为草稿',
      pending: '办件已提交等待受理',
      published: '办件审核通过，已公开发布',
      bidding: '承办单位开始申请',
      selected: '已指派承办单位',
      in_progress: '承办单位开始办理',
      submitted: '承办单位已提交办理结果',
      reviewing: '正在审核办理结果',
      revising: '办理结果需要修改',
      completed: '办件圆满完成',
      cancelled: '办件已撤销',
      disputed: '双方存在异议'
    };
    return descriptions[status];
  };

  const currentIndex = statusOrder.indexOf(currentStatus);

  const displayStatuses: TaskStatus[] = [];
  if (currentStatus === 'cancelled') {
    displayStatuses.push(...statusOrder.slice(0, 4), 'cancelled');
  } else if (currentStatus === 'disputed') {
    displayStatuses.push(...statusOrder.slice(0, 9), 'disputed');
  } else {
    for (let i = 0; i <= currentIndex; i++) {
      if (!['cancelled'].includes(statusOrder[i])) {
        displayStatuses.push(statusOrder[i]);
      }
    }
  }

  const timelineItems: TimelineItem[] = displayStatuses.map((status, index) => {
    const isCurrent = status === currentStatus;
    const isLast = index === displayStatuses.length - 1;
    const date = getStatusDate(status);

    let color = 'gray';
    if (isCurrent) {
      color = status === 'completed' ? 'green' : status === 'cancelled' ? 'red' : 'blue';
    } else if (isLast) {
      color = status === 'completed' ? 'green' : 'red';
    } else {
      color = 'green';
    }

    return {
      status,
      title: getStatusTitle(status),
      description: getStatusDescription(status),
      date,
      icon: getStatusIcon(status),
      color,
      done: index < currentIndex || status === 'completed'
    };
  });

  return (
    <Timeline
      items={timelineItems.map((item) => ({
        color: item.color,
        dot: item.icon,
        children: (
          <div>
            <div className="font-medium text-gray-800">{item.title}</div>
            <div className="text-sm text-gray-500">{item.description}</div>
            {item.date && (
              <div className="text-xs text-gray-400 mt-1">
                {dayjs(item.date).format('YYYY-MM-DD HH:mm:ss')}
              </div>
            )}
          </div>
        )
      }))}
    />
  );
};

export default StatusTimeline;
