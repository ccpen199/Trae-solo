import React, { useState, useEffect } from 'react';
import { 
  Descriptions, Card, Tabs, Button, Tag, Space, Typography,
  Table, Statistic, Row, Col, Breadcrumb, Progress
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi } from '../services/api.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const loadData = async () => {
    try {
      const response = await taskApi.getDetail(id);
      setTask(response.data);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    try {
      await taskApi.execute(id);
      loadData();
    } catch (error) {
      console.error('Failed to execute task:', error);
    }
  };

  const handleCancel = async () => {
    try {
      await taskApi.cancel(id);
      loadData();
    } catch (error) {
      console.error('Failed to cancel task:', error);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!task) return <div>任务不存在</div>;

  const result = task.result ? JSON.parse(task.result) : null;

  const logColumns = [
    { title: '状态码', dataIndex: 'status_code', key: 'status_code',
      render: (code) => code ? <Tag color={code >= 200 && code < 300 ? 'green' : code >= 400 ? 'red' : 'orange'}>{code}</Tag> : <Tag color="red">Error</Tag>
    },
    { title: '响应时间', dataIndex: 'response_time', key: 'response_time', render: (t) => t ? `${t}ms` : '-' },
    { title: '错误信息', dataIndex: 'error_message', key: 'error_message', render: (e) => e || '-' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (d) => dayjs(d).format('HH:mm:ss') }
  ];

  return (
    <div>
      <Breadcrumb className="breadcrumb-nav">
        <Breadcrumb.Item onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>压测中心</Breadcrumb.Item>
        <Breadcrumb.Item>{task.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>{task.name}</Title>
            <Tag color={task.status === 'running' ? 'processing' : task.status === 'completed' ? 'success' : task.status === 'failed' ? 'error' : 'default'}>{task.status}</Tag>
            <Text type="secondary" style={{ marginLeft: 8 }}>{task.description}</Text>
          </div>
          <Space>
            {task.status === 'pending' && <Button type="primary" onClick={handleExecute}>执行任务</Button>}
            {task.status === 'running' && <Button danger onClick={handleCancel}>取消任务</Button>}
          </Space>
        </div>

        <Descriptions column={3} style={{ marginTop: 24 }}>
          <Descriptions.Item label="应用">{task.app_name}</Descriptions.Item>
          <Descriptions.Item label="环境">{task.env_name}</Descriptions.Item>
          <Descriptions.Item label="创建人">{task.creator_name}</Descriptions.Item>
          <Descriptions.Item label="请求方法"><Tag color="blue">{task.method}</Tag></Descriptions.Item>
          <Descriptions.Item label="API端点">{task.api_endpoint}</Descriptions.Item>
          <Descriptions.Item label="Base URL">{task.base_url}</Descriptions.Item>
          <Descriptions.Item label="并发数">{task.concurrency}</Descriptions.Item>
          <Descriptions.Item label="总请求数">{task.requests}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="总请求数" value={task.stats?.total_requests || 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="成功数" value={task.stats?.success_count || 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="失败数" value={task.stats?.error_count || 0} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="平均响应" value={task.stats?.avg_response_time || 0} suffix="ms" />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="logs">
          <TabPane tab="调用日志" key="logs">
            <Table
              columns={logColumns}
              dataSource={task.logs || []}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              size="small"
            />
          </TabPane>
          <TabPane tab="执行结果" key="result">
            {result ? (
              <div>
                <Descriptions column={2}>
                  <Descriptions.Item label="总请求数">{result.total}</Descriptions.Item>
                  <Descriptions.Item label="成功数">{result.success}</Descriptions.Item>
                  <Descriptions.Item label="失败数">{result.failed}</Descriptions.Item>
                  <Descriptions.Item label="成功率">{((result.success / result.total) * 100).toFixed(2)}%</Descriptions.Item>
                  <Descriptions.Item label="平均响应时间">{result.avgResponseTime}ms</Descriptions.Item>
                  <Descriptions.Item label="最大响应时间">{result.maxResponseTime}ms</Descriptions.Item>
                  <Descriptions.Item label="最小响应时间">{result.minResponseTime}ms</Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 24 }}>
                  <Text strong>成功率：</Text>
                  <Progress percent={Math.round((result.success / result.total) * 100)} status={result.failed > 0 ? 'exception' : 'success'} />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                任务尚未执行
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default TaskDetail;
