import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Table,
  Tag
} from 'antd';
import {
  UserOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { reportsApi } from '../services/api';
import dayjs from 'dayjs';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ devices: {}, tasks: {}, recent_tasks: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await reportsApi.getStatistics();
      setStats(result.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportDevices = () => {
    reportsApi.exportDevices();
  };

  const handleExportTasks = () => {
    reportsApi.exportTasks();
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 150
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 150
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? '已完成' : status}
        </Tag>
      )
    },
    {
      title: '发送总数',
      dataIndex: 'total_count',
      key: 'total_count',
      width: 100
    },
    {
      title: '成功数',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 100
    },
    {
      title: '失败数',
      dataIndex: 'failed_count',
      key: 'failed_count',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总设备数"
              value={stats.devices.total_devices || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃设备数"
              value={stats.devices.active_devices || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats.tasks.total_tasks || 0}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总发送数"
              value={stats.tasks.total_sent || 0}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="发送成功数"
              value={stats.tasks.total_success || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="发送失败数"
              value={stats.tasks.total_failed || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已读消息数"
              value={stats.tasks.total_read || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportDevices}
          >
            导出设备数据
          </Button>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportTasks}
          >
            导出任务数据
          </Button>
          <Button onClick={fetchData}>刷新数据</Button>
        </Space>
      </div>

      <Card title="最近推送任务" loading={loading}>
        <Table
          columns={columns}
          dataSource={stats.recent_tasks || []}
          rowKey="id"
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default Reports;
