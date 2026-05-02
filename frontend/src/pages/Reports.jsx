import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, message, Tabs } from 'antd';
import { 
  GlobalOutlined, 
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { reportApi } from '../services/api';
import { STATUS_NAMES, STATUS_COLORS, EXCEPTION_TYPE_NAMES } from '../utils/constants';
import dayjs from 'dayjs';

const Reports = () => {
  const [overview, setOverview] = useState(null);
  const [byStatus, setByStatus] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, statusRes, exceptionsRes] = await Promise.all([
        reportApi.getOverview(),
        reportApi.getByStatus(),
        reportApi.getExceptions({}),
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (statusRes.data.success) setByStatus(statusRes.data.data);
      if (exceptionsRes.data.success) setExceptions(exceptionsRes.data.data);
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusColumns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {STATUS_NAMES[status] || status}
        </Tag>
      ),
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <strong>{count}</strong>,
    },
    {
      title: '最早订单',
      dataIndex: 'firstOrderTime',
      key: 'firstOrderTime',
      render: (time) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '最新订单',
      dataIndex: 'lastOrderTime',
      key: 'lastOrderTime',
      render: (time) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
  ];

  const exceptionColumns = [
    {
      title: '异常类型',
      dataIndex: 'exception_type',
      key: 'exception_type',
      render: (type) => (
        <Tag color="red">
          {EXCEPTION_TYPE_NAMES[type] || type}
        </Tag>
      ),
    },
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'PENDING' ? 'orange' : status === 'RESOLVED' ? 'green' : 'default'}>
          {status === 'PENDING' ? '待处理' : status === 'RESOLVED' ? '已解决' : status}
        </Tag>
      ),
    },
    {
      title: '重试次数',
      dataIndex: 'retry_count',
      key: 'retry_count',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '概览',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总订单数"
                  value={overview?.total || 0}
                  prefix={<GlobalOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="待处理"
                  value={overview?.pending || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="已完成"
                  value={overview?.completed || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="异常单"
                  value={overview?.exception || 0}
                  prefix={<AlertOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="按状态统计">
            <Table
              columns={statusColumns}
              dataSource={byStatus}
              rowKey="status"
              pagination={false}
              loading={loading}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'exceptions',
      label: '异常队列',
      children: (
        <Card>
          <Table
            columns={exceptionColumns}
            dataSource={exceptions}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Tabs items={tabItems} />
    </div>
  );
};

export default Reports;
