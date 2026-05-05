import React, { useState } from 'react';
import {
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Select,
  DatePicker,
  Button,
  Space,
  Empty,
  Spin
} from 'antd';
import {
  CalendarOutlined,
  TrophyOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { reportApi } from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const getStatusTag = (status) => {
  const statusMap = {
    PENDING: { text: '待审批', color: 'orange' },
    APPROVED: { text: '已通过', color: 'green' },
    REJECTED: { text: '已拒绝', color: 'red' },
    COMPLETED: { text: '已销假', color: 'blue' },
    CANCELLED: { text: '已取消', color: 'default' }
  };
  const config = statusMap[status] || { text: status, color: 'default' };
  return <Tag color={config.color}>{config.text}</Tag>;
};

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('leaves');
  const [leaveData, setLeaveData] = useState({ list: [], stats: {} });
  const [feeData, setFeeData] = useState({ list: [], summary: {} });

  const handleSearch = async (type) => {
    setLoading(true);
    try {
      if (type === 'leaves') {
        const result = await reportApi.getLeaveReport({});
        setLeaveData(result.data);
      } else if (type === 'fees') {
        const result = await reportApi.getClassFeeReport({});
        setFeeData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    handleSearch(key);
  };

  const leaveColumns = [
    {
      title: '申请人',
      dataIndex: ['applicant', 'name'],
      key: 'applicant'
    },
    {
      title: '请假原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: '请假天数',
      dataIndex: 'days',
      key: 'days',
      render: (days) => `${days} 天`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    },
    {
      title: '审批人',
      dataIndex: ['approver', 'name'],
      key: 'approver',
      render: (text) => text || '-'
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    }
  ];

  const feeColumns = [
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'INCOME' ? 'green' : 'red'}>
          {type === 'INCOME' ? '收入' : '支出'}
        </Tag>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span className={amount > 0 ? 'income-amount' : 'expense-amount'}>
          {amount > 0 ? '+' : ''}{amount} 元
        </span>
      )
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => `¥ ${balance}`
    },
    {
      title: '操作人',
      dataIndex: ['operator', 'name'],
      key: 'operator',
      render: (text) => text || '-'
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    }
  ];

  const tabItems = [
    {
      key: 'leaves',
      label: (
        <span>
          <CalendarOutlined /> 请假记录查询
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="总计"
                  value={leaveData.stats?.total || 0}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="待审批"
                  value={leaveData.stats?.pending || 0}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="已通过"
                  value={leaveData.stats?.approved || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="已拒绝"
                  value={leaveData.stats?.rejected || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <div className="filter-row">
            <Select placeholder="选择状态" style={{ width: 150 }} allowClear>
              <Option value="PENDING">待审批</Option>
              <Option value="APPROVED">已通过</Option>
              <Option value="REJECTED">已拒绝</Option>
              <Option value="COMPLETED">已销假</Option>
            </Select>
            <RangePicker style={{ width: 300 }} />
            <Button type="primary" onClick={() => handleSearch('leaves')}>
              查询
            </Button>
          </div>

          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : leaveData.list?.length > 0 ? (
            <Table
              columns={leaveColumns}
              dataSource={leaveData.list}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="暂无请假记录" />
          )}
        </div>
      )
    },
    {
      key: 'evaluations',
      label: (
        <span>
          <TrophyOutlined /> 综合测评查询
        </span>
      ),
      children: (
        <div>
          <div className="filter-row">
            <Select placeholder="选择学期" style={{ width: 200 }} allowClear>
              <Option value="2023-2024-1">2023-2024 第一学期</Option>
              <Option value="2023-2024-2">2023-2024 第二学期</Option>
              <Option value="2024-2025-1">2024-2025 第一学期</Option>
            </Select>
            <Button type="primary">查询</Button>
          </div>
          <Empty description="请选择查询条件后点击查询" />
        </div>
      )
    },
    {
      key: 'fees',
      label: (
        <span>
          <DollarOutlined /> 班费流转查询
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="当前余额"
                  value={feeData.summary?.currentBalance || 0}
                  prefix="¥"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="总收入"
                  value={feeData.summary?.totalIncome || 0}
                  prefix="¥"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="总支出"
                  value={feeData.summary?.totalExpense || 0}
                  prefix="¥"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <div className="filter-row">
            <Select placeholder="选择类型" style={{ width: 150 }} allowClear>
              <Option value="INCOME">收入</Option>
              <Option value="EXPENSE">支出</Option>
            </Select>
            <RangePicker style={{ width: 300 }} />
            <Button type="primary" onClick={() => handleSearch('fees')}>
              查询
            </Button>
          </div>

          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : feeData.list?.length > 0 ? (
            <Table
              columns={feeColumns}
              dataSource={feeData.list}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="暂无班费记录" />
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>查询报表</h2>
      </div>

      <div className="table-container">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          defaultActiveKey="leaves"
        />
      </div>
    </div>
  );
};

export default Reports;
