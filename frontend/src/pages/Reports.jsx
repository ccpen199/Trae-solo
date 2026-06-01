import React, { useState, useEffect } from 'react';
import { Tabs, Table, Card, Button, Space, message, Progress, Row, Col, Statistic } from 'antd';
import { reportsAPI } from '../services/api';

const { TabPane } = Tabs;

const Reports = () => {
  const [budgetData, setBudgetData] = useState([]);
  const [timeSummary, setTimeSummary] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [budget, time, revenue] = await Promise.all([
        reportsAPI.getBudget(),
        reportsAPI.getTimeSummary(),
        reportsAPI.getRevenue(),
      ]);
      setBudgetData(budget || []);
      setTimeSummary(time || []);
      setRevenueData(revenue || []);
    } catch (error) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const budgetColumns = [
    { title: '案件编号', dataIndex: 'case_number', key: 'case_number', width: 140 },
    { title: '案件名称', dataIndex: 'matter_name', key: 'matter_name', width: 200 },
    { title: '客户', dataIndex: 'client_name', key: 'client_name', width: 140 },
    { title: '预算上限', dataIndex: 'budget_limit', key: 'budget_limit', width: 120,
      render: v => v ? `¥${v.toFixed(2)}` : '不限'
    },
    { title: '已使用', dataIndex: 'used_amount', key: 'used_amount', width: 120,
      render: v => `¥${v?.toFixed(2)}`
    },
    {
      title: '预算使用率',
      key: 'usage',
      width: 200,
      render: (_, record) => {
        const used = record.used_amount || 0;
        const limit = record.budget_limit || 0;
        const percent = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
        const color = percent > 90 ? 'red' : percent > 70 ? 'orange' : 'green';
        return limit > 0 ? (
          <Progress percent={percent} strokeColor={color} size="small" />
        ) : '-';
      },
    },
    {
      title: '超预算预警',
      key: 'warning',
      width: 120,
      render: (_, record) => {
        const used = record.used_amount || 0;
        const limit = record.budget_limit || 0;
        if (!limit) return '-';
        const percent = (used / limit) * 100;
        if (percent >= 100) return <span style={{ color: 'red', fontWeight: 'bold' }}>已超预算</span>;
        if (percent >= 90) return <span style={{ color: 'orange' }}>即将超支</span>;
        return <span style={{ color: 'green' }}>正常</span>;
      },
    },
  ];

  const timeSummaryColumns = [
    { title: '人员', dataIndex: 'user_name', key: 'user_name', width: 120 },
    { title: '案件', dataIndex: 'matter_name', key: 'matter_name', width: 180 },
    { title: '客户', dataIndex: 'client_name', key: 'client_name', width: 140 },
    { title: '记录数', dataIndex: 'entry_count', key: 'entry_count', width: 100 },
    { title: '总工时', dataIndex: 'total_hours', key: 'total_hours', width: 100, render: v => `${v?.toFixed(1)}h` },
    { title: '计费工时', dataIndex: 'billable_hours', key: 'billable_hours', width: 100, render: v => `${v?.toFixed(1)}h` },
    { title: '计费金额', dataIndex: 'billable_amount', key: 'billable_amount', width: 120,
      render: v => `¥${v?.toFixed(2)}`
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: v => ({ pending: '待审核', approved: '已通过', rejected: '已退回' })[v] || v
    },
  ];

  const revenueColumns = [
    { title: '月份', dataIndex: 'month', key: 'month', width: 120 },
    { title: '账单数', dataIndex: 'invoice_count', key: 'invoice_count', width: 100 },
    { title: '工时费', dataIndex: 'total_time_fee', key: 'total_time_fee', width: 120,
      render: v => `¥${v?.toFixed(2)}`
    },
    { title: '固定费用', dataIndex: 'total_fixed_fee', key: 'total_fixed_fee', width: 120,
      render: v => `¥${v?.toFixed(2)}`
    },
    { title: '代垫费用', dataIndex: 'total_advance_fee', key: 'total_advance_fee', width: 120,
      render: v => `¥${v?.toFixed(2)}`
    },
    { title: '税费', dataIndex: 'total_tax', key: 'total_tax', width: 100,
      render: v => `¥${v?.toFixed(2)}`
    },
    { title: '营收合计', dataIndex: 'total_amount', key: 'total_amount', width: 140,
      render: v => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>¥{v?.toFixed(2)}</span>
    },
    { title: '已收款', dataIndex: 'total_paid', key: 'total_paid', width: 120,
      render: v => `¥${v?.toFixed(2)}`
    },
  ];

  const totalStats = {
    totalMatter: budgetData.length,
    overBudget: budgetData.filter(m => m.budget_limit && m.used_amount >= m.budget_limit).length,
    totalRevenue: revenueData.reduce((sum, r) => sum + (r.total_amount || 0), 0),
    totalPaid: revenueData.reduce((sum, r) => sum + (r.total_paid || 0), 0),
    totalHours: timeSummary.reduce((sum, t) => sum + (t.total_hours || 0), 0),
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">统计报表</h1>
        <Button onClick={loadAllData}>刷新数据</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="案件总数"
              value={totalStats.totalMatter}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="超预算案件"
              value={totalStats.overBudget}
              valueStyle={{ color: totalStats.overBudget > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总营收"
              value={totalStats.totalRevenue}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总工时"
              value={totalStats.totalHours}
              precision={1}
              suffix="h"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="budget">
        <TabPane tab="预算预警报表" key="budget">
          <Card>
            <Table
              columns={budgetColumns}
              dataSource={budgetData}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>
        <TabPane tab="工时汇总报表" key="time">
          <Card>
            <Table
              columns={timeSummaryColumns}
              dataSource={timeSummary}
              rowKey={(_, i) => i}
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>
        <TabPane tab="营收统计报表" key="revenue">
          <Card>
            <Table
              columns={revenueColumns}
              dataSource={revenueData}
              rowKey="month"
              loading={loading}
              pagination={false}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Reports;
