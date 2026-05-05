import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Timeline, Table, Button, Badge, Steps, Spin, message, Row, Col, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { queryApi } from '../services/api';
import { ProcessNode, ApprovalComment } from '../types';
import dayjs from 'dayjs';
import { LeftOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined } from '@ant-design/icons';

const { Step } = Steps;

const Tracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchTracking(parseInt(id));
    }
  }, [id]);

  const fetchTracking = async (documentId: number) => {
    setLoading(true);
    try {
      const response = await queryApi.getTracking(documentId);
      setTrackingData(response);
    } catch (error) {
      message.error('获取跟踪信息失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      草稿: { color: 'default', text: '草稿' },
      审批中: { color: 'processing', text: '审批中' },
      已签发: { color: 'success', text: '已签发' },
      已退回: { color: 'error', text: '已退回' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getNodeStatus = (status: string) => {
    switch (status) {
      case '已完成':
        return 'finish';
      case '待处理':
        return 'process';
      case '已退回':
        return 'error';
      default:
        return 'wait';
    }
  };

  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case '已完成':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
      case '待处理':
        return <Badge status="processing" />;
      case '已退回':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
      default:
        return <Badge status="default" />;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <p>暂无跟踪信息</p>
        <Button onClick={() => navigate(-1)}>返回</Button>
      </div>
    );
  }

  const { document, current_status, current_handler, process_nodes, comments, todos } = trackingData;

  return (
    <div>
      <Button
        icon={<LeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate(-1)}
      >
        返回
      </Button>

      <Card title="公文基本信息">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="公文编号">{document.document_number}</Descriptions.Item>
          <Descriptions.Item label="标题" span={2}>{document.title}</Descriptions.Item>
          <Descriptions.Item label="类型">{document.document_type}</Descriptions.Item>
          <Descriptions.Item label="类别">{document.category}</Descriptions.Item>
          <Descriptions.Item label="密级">
            <Tag color={
              document.security_level === '普通' ? 'default' :
              document.security_level === '秘密' ? 'orange' :
              document.security_level === '机密' ? 'red' : 'purple'
            }>
              {document.security_level}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            {getStatusTag(document.status)}
          </Descriptions.Item>
          <Descriptions.Item label="当前环节">{current_status || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前处理人">
            {current_handler ? `${current_handler.name} (${current_handler.department})` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建人">
            {document.creator_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(document.created_at).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(document.updated_at).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>

        <Card title="公文正文" size="small" style={{ marginTop: 16 }}>
          <div style={{ whiteSpace: 'pre-wrap', minHeight: 80, padding: 8 }}>
            {document.content}
          </div>
        </Card>
      </Card>

      <Card title="流程进度（步骤视图）" style={{ marginTop: 16 }}>
        {process_nodes && process_nodes.length > 0 ? (
          <Steps
            direction="vertical"
            current={process_nodes.findIndex((n: ProcessNode) => n.status === '待处理')}
          >
            {process_nodes.map((node: ProcessNode, index: number) => (
              <Step
                key={node.id}
                title={node.node_name}
                status={getNodeStatus(node.status)}
                description={
                  <div>
                    <p style={{ margin: 0 }}>
                      处理人: {node.handler_name || '-'}
                      {node.handler_department && ` (${node.handler_department})`}
                    </p>
                    <p style={{ margin: 0, color: '#999', fontSize: 12 }}>
                      状态: {node.status}
                      {node.started_at && ` | 开始时间: ${dayjs(node.started_at).format('YYYY-MM-DD HH:mm')}`}
                      {node.completed_at && ` | 完成时间: ${dayjs(node.completed_at).format('YYYY-MM-DD HH:mm')}`}
                    </p>
                  </div>
                }
              />
            ))}
          </Steps>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
            暂无流程记录（草稿状态）
          </div>
        )}
      </Card>

      <Card title="流程节点详情" style={{ marginTop: 16 }}>
        {process_nodes && process_nodes.length > 0 ? (
          <Timeline>
            {process_nodes.map((node: ProcessNode) => (
              <Timeline.Item
                key={node.id}
                dot={getNodeStatusIcon(node.status)}
              >
                <Card size="small" style={{ maxWidth: 600 }}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="节点名称" span={2}>
                      <strong>{node.node_name}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="处理人">
                      {node.handler_name || '-'}
                      {node.handler_department && ` (${node.handler_department})`}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      {getStatusTag(node.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="开始时间">
                      {node.started_at ? dayjs(node.started_at).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="完成时间">
                      {node.completed_at ? dayjs(node.completed_at).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
            暂无流程节点
          </div>
        )}
      </Card>

      <Card title="审批意见历史" style={{ marginTop: 16 }}>
        {comments && comments.length > 0 ? (
          <Table
            dataSource={comments}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: '审批人',
                dataIndex: 'user_name',
                key: 'user_name',
                width: 150,
              },
              {
                title: '操作类型',
                dataIndex: 'action',
                key: 'action',
                width: 120,
                render: (action: string) => {
                  const colorMap: Record<string, string> = {
                    '通过': 'success',
                    '退回': 'error',
                    '补充意见': 'warning',
                  };
                  return <Tag color={colorMap[action] || 'default'}>{action}</Tag>;
                },
              },
              {
                title: '审批意见',
                dataIndex: 'comment',
                key: 'comment',
              },
              {
                title: '操作时间',
                dataIndex: 'created_at',
                key: 'created_at',
                width: 180,
                render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
              },
            ]}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
            暂无审批意见
          </div>
        )}
      </Card>

      {todos && todos.length > 0 && (
        <Card title="待办任务记录" style={{ marginTop: 16 }}>
          <Table
            dataSource={todos}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '任务名称', dataIndex: 'task_name', key: 'task_name' },
              {
                title: '处理人',
                dataIndex: 'user_name',
                key: 'user_name',
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => getStatusTag(status),
              },
              {
                title: '创建时间',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
              },
              {
                title: '完成时间',
                dataIndex: 'completed_at',
                key: 'completed_at',
                render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default Tracking;
