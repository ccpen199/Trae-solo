import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Button, Space, Descriptions } from 'antd';
import {
  DollarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { financeApi } from '../../services/api';

const FinanceReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState<any>({
    summary: { totalCount: 0, totalAmount: 0 },
    dailyStats: [],
    templateStats: [],
    providerStats: [],
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const result = await financeApi.getMonthlyReport({ year, month });
      setReportData(result.data);
    } catch (error) {
      console.error('获取报表数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [year, month]);

  const dailyColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '发送条数',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '消费金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => <span style={{ color: '#ff4d4f' }}>¥{v}</span>,
    },
  ];

  const templateColumns = [
    {
      title: '模板名称',
      dataIndex: 'templateName',
      key: 'templateName',
    },
    {
      title: '发送条数',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '消费金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => <span style={{ color: '#ff4d4f' }}>¥{v}</span>,
    },
    {
      title: '占比',
      key: 'ratio',
      render: (_: any, record: any) => {
        const total = reportData.summary.totalAmount || 1;
        const ratio = ((record.totalAmount || 0) / total * 100).toFixed(2);
        return `${ratio}%`;
      },
    },
  ];

  const providerColumns = [
    {
      title: '通道名称',
      dataIndex: 'providerName',
      key: 'providerName',
    },
    {
      title: '发送条数',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '消费金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => <span style={{ color: '#ff4d4f' }}>¥{v}</span>,
    },
    {
      title: '占比',
      key: 'ratio',
      render: (_: any, record: any) => {
        const total = reportData.summary.totalAmount || 1;
        const ratio = ((record.totalAmount || 0) / total * 100).toFixed(2);
        return `${ratio}%`;
      },
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <BarChartOutlined />
            财务报表
          </Space>
        }
        extra={
          <Space>
            <Select
              value={year}
              onChange={setYear}
              style={{ width: 120 }}
            >
              {years.map((y) => (
                <Select.Option key={y} value={y}>
                  {y}年
                </Select.Option>
              ))}
            </Select>
            <Select
              value={month}
              onChange={setMonth}
              style={{ width: 100 }}
            >
              {months.map((m) => (
                <Select.Option key={m} value={m}>
                  {m}月
                </Select.Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchReport}
            >
              刷新
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card>
              <Statistic
                title="本月发送条数"
                value={reportData.summary.totalCount}
                prefix={<PieChartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="本月消费金额"
                value={reportData.summary.totalAmount}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {reportData.dailyStats.length > 0 && (
          <Card title="每日统计" style={{ marginTop: 24 }} type="inner">
            <Table
              columns={dailyColumns}
              dataSource={reportData.dailyStats}
              rowKey="date"
              pagination={false}
              size="small"
            />
          </Card>
        )}

        {reportData.templateStats.length > 0 && (
          <Card title="模板消费统计" style={{ marginTop: 24 }} type="inner">
            <Table
              columns={templateColumns}
              dataSource={reportData.templateStats}
              rowKey="templateName"
              pagination={false}
              size="small"
            />
          </Card>
        )}

        {reportData.providerStats.length > 0 && (
          <Card title="通道消费统计" style={{ marginTop: 24 }} type="inner">
            <Table
              columns={providerColumns}
              dataSource={reportData.providerStats}
              rowKey="providerName"
              pagination={false}
              size="small"
            />
          </Card>
        )}
      </Card>
    </div>
  );
};

export default FinanceReport;
