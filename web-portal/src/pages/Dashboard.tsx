import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, message } from 'antd';
import {
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { templateApi, smsApi, financeApi, auditApi } from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalTemplates: 0,
    activeTemplates: 0,
    todayTasks: 0,
    todaySuccess: 0,
    todayFail: 0,
    balance: 0,
    monthlyConsumption: 0,
    todayAuditLogs: 0,
  });

  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      const [templateResult, financeResult] = await Promise.all([
        templateApi.getList({ page: 1, pageSize: 1 }),
        financeApi.getBalance(),
      ]);

      const activeTemplates = templateResult.data.list.filter((t: any) => t.status === 2).length;

      setStats((prev) => ({
        ...prev,
        totalTemplates: templateResult.data.total,
        activeTemplates,
        balance: financeResult.data.balance,
        monthlyConsumption: financeResult.data.monthlyConsumption,
      }));
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchRecentTasks = async () => {
    try {
      const result = await smsApi.getTasks({ page: 1, pageSize: 5 });
      setRecentTasks(result.data.list);
    } catch (error) {
      console.error('获取任务列表失败:', error);
    }
  };

  const fetchRecentRecords = async () => {
    try {
      const result = await smsApi.getRecords({ page: 1, pageSize: 5 });
      setRecentRecords(result.data.list);
    } catch (error) {
      console.error('获取记录列表失败:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentTasks();
    fetchRecentRecords();
  }, []);

  const statusColor: { [key: number]: string } = {
    0: 'default',
    1: 'processing',
    2: 'success',
    3: 'error',
    4: 'warning',
  };

  const statusText: { [key: number]: string } = {
    0: '草稿',
    1: '处理中',
    2: '已激活',
    3: '已禁用',
    4: '被拦截',
  };

  const smsStatusText: { [key: number]: string } = {
    0: '待发送',
    1: '发送中',
    2: '发送成功',
    3: '发送失败',
    4: '被拦截',
  };

  const taskColumns = [
    {
      title: '任务编号',
      dataIndex: 'taskCode',
      key: 'taskCode',
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
    },
    {
      title: '总数',
      dataIndex: 'totalCount',
      key: 'totalCount',
    },
    {
      title: '成功',
      dataIndex: 'successCount',
      key: 'successCount',
      render: (v: number) => <Tag color="success">{v}</Tag>,
    },
    {
      title: '失败',
      dataIndex: 'failCount',
      key: 'failCount',
      render: (v: number) => <Tag color="error">{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: number) => <Tag color={statusColor[v]}>{statusText[v]}</Tag>,
    },
  ];

  const recordColumns = [
    {
      title: '短信编号',
      dataIndex: 'smsCode',
      key: 'smsCode',
    },
    {
      title: '手机号',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: '模板名称',
      dataIndex: 'templateName',
      key: 'templateName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: number) => <Tag color={statusColor[v]}>{smsStatusText[v]}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="模板总数"
              value={stats.totalTemplates}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="激活模板"
              value={stats.activeTemplates}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="账户余额"
              value={stats.balance}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月消费"
              value={stats.monthlyConsumption}
              prefix={<MessageOutlined />}
              suffix="元"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="最近发送任务">
            <Table
              columns={taskColumns}
              dataSource={recentTasks}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="最近发送记录">
            <Table
              columns={recordColumns}
              dataSource={recentRecords}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
