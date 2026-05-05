import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Table, Tag, Space, Button } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { documentApi, approvalApi, queryApi } from '../services/api';
import { Document, TodoTask } from '../types';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [myDocStats, setMyDocStats] = useState({
    total: 0,
    draft: 0,
    processing: 0,
    completed: 0,
  });
  const [todoStats, setTodoStats] = useState({ pending: 0 });
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [recentTodos, setRecentTodos] = useState<TodoTask[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [docsResponse, todosResponse] = await Promise.all([
        documentApi.getMyDocuments({ pageSize: 100 }),
        approvalApi.getTodoList({ pageSize: 5 }),
      ]);

      const docs = docsResponse.documents || [];
      const stats = {
        total: docsResponse.total || 0,
        draft: docs.filter((d: Document) => d.status === '草稿').length,
        processing: docs.filter((d: Document) => d.status === '审批中').length,
        completed: docs.filter((d: Document) => d.status === '已签发' || d.status === '已退回').length,
      };
      setMyDocStats(stats);
      setRecentDocs(docs.slice(0, 5));

      setTodoStats({ pending: todosResponse.total || 0 });
      setRecentTodos(todosResponse.todos || []);
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
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
      待处理: { color: 'warning', text: '待处理' },
      已完成: { color: 'success', text: '已完成' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const documentColumns = [
    {
      title: '公文编号',
      dataIndex: 'document_number',
      key: 'document_number',
      ellipsis: true,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
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
      title: '操作',
      key: 'action',
      render: (_: any, record: Document) => (
        <Button type="link" onClick={() => navigate(`/documents/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  const todoColumns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      ellipsis: true,
    },
    {
      title: '公文标题',
      dataIndex: 'document_title',
      key: 'document_title',
      ellipsis: true,
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TodoTask) => (
        <Button type="link" onClick={() => navigate(`/todos/${record.id}`)}>
          处理
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/documents/create')}>
            <Statistic
              title="新建公文"
              value={myDocStats.total}
              prefix={<FileAddOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/documents')}>
            <Statistic
              title="我的公文"
              value={myDocStats.total}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/todos')}>
            <Statistic
              title="待办公文"
              value={todoStats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/search')}>
            <Statistic
              title="已完成"
              value={myDocStats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="最近创建的公文" 
            extra={<Button type="link" onClick={() => navigate('/documents')}>查看全部</Button>}
          >
            <Table
              dataSource={recentDocs}
              columns={documentColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
            />
            {recentDocs.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                暂无公文，
                <Button type="link" onClick={() => navigate('/documents/create')}>点击创建</Button>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="待办公文" 
            extra={<Button type="link" onClick={() => navigate('/todos')}>查看全部</Button>}
          >
            <Table
              dataSource={recentTodos}
              columns={todoColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
            />
            {recentTodos.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                暂无待办公文
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
