import React from 'react';
import { Card, Descriptions, Timeline, Tag, Button, Space, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const WorkflowDetail: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

  const mockWorkflow = {
    id: params.id,
    contentTitle: '示例内容标题',
    workflowType: '三审三校',
    currentStep: 2,
    totalSteps: 6,
    status: 'IN_PROGRESS',
    startedAt: '2024-01-15 10:00:00',
    steps: [
      {
        stepNumber: 1,
        stepName: '初审',
        stepType: 'FIRST_REVIEW',
        status: 'APPROVED',
        assignee: '张主编',
        comment: '内容质量良好，格式规范，进入下一环节。',
        startedAt: '2024-01-15 10:00:00',
        completedAt: '2024-01-15 11:30:00',
      },
      {
        stepNumber: 2,
        stepName: '一校',
        stepType: 'FIRST_PROOFREAD',
        status: 'IN_PROGRESS',
        assignee: null,
        comment: null,
        startedAt: '2024-01-15 11:30:00',
        completedAt: null,
      },
      {
        stepNumber: 3,
        stepName: '二审',
        stepType: 'SECOND_REVIEW',
        status: 'PENDING',
        assignee: null,
        comment: null,
        startedAt: null,
        completedAt: null,
      },
      {
        stepNumber: 4,
        stepName: '二校',
        stepType: 'SECOND_PROOFREAD',
        status: 'PENDING',
        assignee: null,
        comment: null,
        startedAt: null,
        completedAt: null,
      },
      {
        stepNumber: 5,
        stepName: '三审',
        stepType: 'THIRD_REVIEW',
        status: 'PENDING',
        assignee: null,
        comment: null,
        startedAt: null,
        completedAt: null,
      },
      {
        stepNumber: 6,
        stepName: '三校',
        stepType: 'THIRD_PROOFREAD',
        status: 'PENDING',
        assignee: null,
        comment: null,
        startedAt: null,
        completedAt: null,
      },
    ],
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
      case 'IN_PROGRESS':
        return <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
      case 'REJECTED':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9', fontSize: 24 }} />;
    }
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: '待处理',
      IN_PROGRESS: '处理中',
      APPROVED: '已通过',
      REJECTED: '已驳回',
    };
    return texts[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'default',
      IN_PROGRESS: 'processing',
      APPROVED: 'success',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  const getStepTypeText = (type: string) => {
    const texts: Record<string, string> = {
      FIRST_REVIEW: '初审',
      SECOND_REVIEW: '二审',
      THIRD_REVIEW: '三审',
      FIRST_PROOFREAD: '一校',
      SECOND_PROOFREAD: '二校',
      THIRD_PROOFREAD: '三校',
    };
    return texts[type] || type;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/workflow')}
          style={{ marginBottom: 8 }}
        >
          返回审核中心
        </Button>
        <h2 style={{ margin: 0 }}>工作流详情</h2>
      </div>

      <Card title="基本信息">
        <Descriptions column={3}>
          <Descriptions.Item label="内容标题">
            {mockWorkflow.contentTitle}
          </Descriptions.Item>
          <Descriptions.Item label="工作流类型">
            {mockWorkflow.workflowType}
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={getStatusColor(mockWorkflow.status)}>
              {getStatusText(mockWorkflow.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前步骤">
            第 {mockWorkflow.currentStep} 步 / 共 {mockWorkflow.totalSteps} 步
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {mockWorkflow.startedAt}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="流程进度" style={{ marginTop: 16 }}>
        <Timeline mode="left">
          {mockWorkflow.steps.map((step, index) => (
            <Timeline.Item
              key={step.stepNumber}
              dot={getStatusIcon(step.status)}
              color={
                step.status === 'APPROVED'
                  ? 'green'
                  : step.status === 'IN_PROGRESS'
                  ? 'blue'
                  : 'gray'
              }
            >
              <Card size="small">
                <Space>
                  <Tag color="blue">{getStepTypeText(step.stepType)}</Tag>
                  <Tag color={getStatusColor(step.status)}>{getStatusText(step.status)}</Tag>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <strong>
                    步骤 {step.stepNumber}: {step.stepName}
                  </strong>
                </div>
                {step.assignee && (
                  <div style={{ color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                    处理人: {step.assignee}
                  </div>
                )}
                {step.comment && (
                  <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                    <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginBottom: 4 }}>
                      审核意见:
                    </div>
                    <div>{step.comment}</div>
                  </div>
                )}
                {step.startedAt && (
                  <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginTop: 8 }}>
                    开始: {step.startedAt}
                    {step.completedAt && (
                      <span style={{ marginLeft: 16 }}>完成: {step.completedAt}</span>
                    )}
                  </div>
                )}
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  );
};

export default WorkflowDetail;
