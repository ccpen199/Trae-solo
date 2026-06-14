import React from 'react';
import { Timeline, Card, Tag, Collapse } from 'antd';
import {
  RobotOutlined, CheckCircleOutlined, SendOutlined,
  UserSwitchOutlined, ToolOutlined, AuditOutlined,
  FolderOutlined, FileProtectOutlined,
} from '@ant-design/icons';
import type { AlarmLifecycleNode } from '@/services/api/alarm';

interface AlarmLifecycleProps {
  lifecycle: AlarmLifecycleNode[];
}

const stepIconMap: Record<string, React.ReactNode> = {
  'AI识别告警': <RobotOutlined />,
  '告警确认/派发': <SendOutlined />,
  '处置接收': <UserSwitchOutlined />,
  '现场处置': <ToolOutlined />,
  '结果回传': <SendOutlined />,
  '复查审核': <AuditOutlined />,
  '关闭归档': <FolderOutlined />,
};

const stepColorMap: Record<string, string> = {
  'AI识别告警': 'red',
  '告警确认/派发': 'blue',
  '处置接收': 'cyan',
  '现场处置': 'orange',
  '结果回传': 'purple',
  '复查审核': 'green',
  '关闭归档': 'gray',
};

const AlarmLifecycle: React.FC<AlarmLifecycleProps> = ({ lifecycle }) => {
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
            {node.lawReference && (
              <div className="text-xs text-blue-500 mt-1">
                <FileProtectOutlined className="mr-1" />法规依据：{node.lawReference}
              </div>
            )}
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

export default AlarmLifecycle;
