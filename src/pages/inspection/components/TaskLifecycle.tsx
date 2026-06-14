import React from 'react';
import { Timeline, Card, Tag, Collapse } from 'antd';
import {
  PlusCircleOutlined, SendOutlined, CheckCircleOutlined,
  ToolOutlined, FileTextOutlined, AuditOutlined,
  FolderOutlined, FileProtectOutlined,
} from '@ant-design/icons';
import type { InspectionLifecycleNode } from '@/services/api/inspection';

interface TaskLifecycleProps {
  lifecycle: InspectionLifecycleNode[];
}

const stepIconMap: Record<string, React.ReactNode> = {
  '创建任务': <PlusCircleOutlined />,
  '派发任务': <SendOutlined />,
  '接收任务': <CheckCircleOutlined />,
  '执行巡检': <ToolOutlined />,
  '提交结果': <FileTextOutlined />,
  '复查审核': <AuditOutlined />,
  '关闭任务': <FolderOutlined />,
};

const stepColorMap: Record<string, string> = {
  '创建任务': 'blue',
  '派发任务': 'cyan',
  '接收任务': 'green',
  '执行巡检': 'orange',
  '提交结果': 'purple',
  '复查审核': 'gold',
  '关闭任务': 'gray',
};

const TaskLifecycle: React.FC<TaskLifecycleProps> = ({ lifecycle }) => {
  if (!lifecycle || lifecycle.length === 0) {
    return <div className="text-center py-8 text-neutral-400">暂无生命周期记录</div>;
  }

  return (
    <Timeline
      items={lifecycle.map((node) => ({
        color: stepColorMap[node.stepName] || 'blue',
        dot: stepIconMap[node.stepName] || <CheckCircleOutlined />,
        children: (
          <Card
            size="small"
            className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-2"
            bodyStyle={{ padding: '12px 16px' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tag color={stepColorMap[node.stepName] || 'blue'}>{node.stepName}</Tag>
                <span className="font-medium text-sm">{node.operator}</span>
                <span className="text-xs text-neutral-400">{node.operatorRole}</span>
              </div>
              <span className="text-xs text-neutral-400">{node.operateTime}</span>
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300 mb-1">
              {node.content}
            </div>
            <div className="text-xs text-neutral-400">
              结果：<span className="text-neutral-600 dark:text-neutral-300">{node.result}</span>
            </div>
            {node.attachments && node.attachments.length > 0 && (
              <Collapse
                ghost
                size="small"
                className="mt-2"
                items={[{
                  key: 'attachments',
                  label: <span className="text-xs text-neutral-500">附件材料 ({node.attachments.length})</span>,
                  children: (
                    <div className="flex gap-2 flex-wrap">
                      {node.attachments.map((url, idx) => (
                        <img key={idx} src={url} alt={`附件${idx + 1}`} className="w-16 h-12 object-cover rounded border border-neutral-200" />
                      ))}
                    </div>
                  ),
                }]}
              />
            )}
          </Card>
        ),
      }))}
    />
  );
};

export default TaskLifecycle;
