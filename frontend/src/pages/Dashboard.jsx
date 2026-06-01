import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Button, Space } from 'antd';
import { ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import api from '../utils/api';
import dayjs from 'dayjs';

function Dashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes, tasksRes] = await Promise.all([
        api.get('/reports/overview'),
        api.get('/reports/task-trend', { params: { days: 7 } }),
        api.get('/tasks', { params: { pageSize: 10 } })
      ]);
      setOverview(overviewRes.data);
      setTrendData(trendRes.data);
      setRecentTasks(tasksRes.data.list);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = {
    success: 'green',
    failed: 'red',
    running: 'blue',
    pending: 'orange',
    cancelled: 'default'
  };

  const taskTypeNames = {
    backup: '备份',
    restore: '恢复',
    verify: '校验',
    delete: '删除'
  };

  const trendChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['成功', '失败', '总数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: trendData.map(d => dayjs(d.date).format('MM-DD'))
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '成功',
        type: 'bar',
        stack: 'total',
        data: trendData.map(d => d.success),
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '失败',
        type: 'bar',
        stack: 'total',
        data: trendData.map(d => d.failed),
        itemStyle: { color: '#ff4d4f' }
      },
      {
        name: '总数',
        type: 'line',
        data: trendData.map(d => d.total),
        itemStyle: { color: '#1890ff' }
      }
    ]
  };

  const taskColumns = [
    { title: '任务编号', dataIndex: 'task_no', key: 'task_no', width: 140 },
    { title: '任务类型', dataIndex: 'task_type', key: 'task_type', width: 80,
      render: (v) => taskTypeNames[v] || v
    },
    { title: '应用', dataIndex: 'app_name', key: 'app_name', width: 100 },
    { title: '环境', dataIndex: 'env_name', key: 'env_name', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => <Tag color={statusColor[v]}>{v}</Tag>
    },
    { title: '操作人', dataIndex: 'operator_name', key: 'operator_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at',
      render: (v) => dayjs(v).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate(`/tasks/${record.id}`)}>
          详情
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title">仪表板概览</h1>
        <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
          刷新
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card info">
            <div className="stat-value">{overview?.apps || 0}</div>
            <div className="stat-label">应用总数</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div className="stat-value">{overview?.environments || 0}</div>
            <div className="stat-label">环境配置</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card success">
            <div className="stat-value">{overview?.task_stats?.success_rate || 0}%</div>
            <div className="stat-label">任务成功率</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card warning">
            <div className="stat-value">{overview?.alerts?.active || 0}</div>
            <div className="stat-label">待处理告警</div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="近7天任务趋势" 
            extra={
              <Button type="link" onClick={() => navigate('/tasks')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            <ReactECharts option={trendChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="任务统计">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: 16, background: '#f6ffed', borderRadius: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>
                    {overview?.task_stats?.success || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#8c8c8c' }}>成功任务</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: 16, background: '#fff2f0', borderRadius: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4d4f' }}>
                    {overview?.task_stats?.failed || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#8c8c8c' }}>失败任务</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: 16, background: '#e6f7ff', borderRadius: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1890ff' }}>
                    {overview?.task_stats?.running || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#8c8c8c' }}>执行中</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: 16, background: '#fff7e6', borderRadius: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16' }}>
                    {overview?.task_stats?.pending || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#8c8c8c' }}>待执行</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card 
        title="最近任务" 
        style={{ marginTop: 24 }}
        extra={
          <Button type="link" onClick={() => navigate('/tasks')}>
            查看全部 <ArrowRightOutlined />
          </Button>
        }
      >
        <Table
          columns={taskColumns}
          dataSource={recentTasks}
          rowKey="id"
          pagination={false}
          loading={loading}
          size="small"
        />
      </Card>
    </div>
  );
}

export default Dashboard;
