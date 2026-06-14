import React from 'react';
import { Timeline, Tag } from 'antd';
import {
  ClockCircleOutlined,
  FileSearchOutlined,
  CarryOutOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { InspectionStatus } from '@/services/api/inspection';

interface TimelineStep {
  status: InspectionStatus;
  label: string;
  time?: string;
  description?: string;
}

interface InspectionTimelineProps {
  currentStatus: InspectionStatus;
  steps?: TimelineStep[];
  createdAt?: string;
  startTime?: string;
  completedAt?: string;
  cancelledAt?: string;
}

const statusStepMap: Record<InspectionStatus, number> = {
  pending: 0,
  dispatched: 1,
  accepted: 2,
  in_progress: 3,
  submitted: 4,
  reviewing: 5,
  completed: 6,
  rejected: 3,
  cancelled: -1,
};

const defaultSteps: { key: InspectionStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'pending', label: '任务创建', icon: <FileSearchOutlined />, color: 'blue' },
  { key: 'in_progress', label: '执行巡检', icon: <CarryOutOutlined />, color: 'blue' },
  { key: 'completed', label: '完成提交', icon: <CheckCircleOutlined />, color: 'green' },
];

const InspectionTimeline: React.FC<InspectionTimelineProps> = ({
  currentStatus,
  createdAt,
  startTime,
  completedAt,
}) => {
  const currentStep = statusStepMap[currentStatus];

  if (currentStatus === 'cancelled') {
    return (
      <Timeline
        items={[
          { color: 'blue', children: `任务创建：${createdAt || '-'}` },
          {
            color: 'red',
            dot: <CloseCircleOutlined />,
            children: '任务已取消',
          },
        ]}
      />
    );
  }

  const timeMap: Partial<Record<InspectionStatus, string | undefined>> = {
    pending: createdAt,
    in_progress: startTime,
    completed: completedAt,
  };

  return (
    <Timeline
      items={defaultSteps.map((step, idx) => {
        const isActive = idx <= currentStep;
        return {
          color: isActive ? step.color : 'gray',
          dot: isActive ? step.icon : <ClockCircleOutlined style={{ fontSize: 12 }} />,
          children: (
            <div>
              <span className={isActive ? 'text-neutral-800 dark:text-white' : 'text-neutral-400'}>
                {step.label}
              </span>
              {timeMap[step.key] && (
                <div className="text-xs text-neutral-400 mt-0.5">{timeMap[step.key]}</div>
              )}
              {idx === currentStep && currentStatus !== 'completed' && (
                <Tag color="processing" className="mt-1">当前</Tag>
              )}
            </div>
          ),
        };
      })}
    />
  );
};

export default InspectionTimeline;
