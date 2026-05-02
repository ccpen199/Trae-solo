import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Tag,
  Space,
  message,
  Descriptions,
  Row,
  Col,
  Statistic,
  Spin,
} from 'antd';
import { ReloadOutlined, LineChartOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../store/auth';

const Forecast: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentForecast, setCurrentForecast] = useState<any>(null);
  const { user } = useAuth();

  const canGenerate = ['CFO', 'FINANCIAL_MANAGER', 'ADMIN'].includes(user?.role || '');

  const loadForecasts = async () => {
    setLoading(true);
    try {
      const response: any = await api.get('/forecast');
      if (response.success) {
        setForecasts(response.data.forecasts || []);
      }
    } catch (error) {
      console.error('Load forecasts error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecasts();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response: any = await api.post('/forecast/generate', {
        forecastDays: 30,
      });
      if (response.success) {
        message.success('预测生成成功');
        loadForecasts();
      }
    } catch (error) {
      console.error('Generate forecast error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleViewDetail = async (record: any) => {
    setCurrentForecast(record);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'processing',
      ARCHIVED: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      ACTIVE: '活跃',
      ARCHIVED: '已归档',
    };
    return texts[status] || status;
  };

  const mockChartData = [
    { name: 'Day 1', actual: 1200000, forecast: 1180000 },
    { name: 'Day 5', actual: 1350000, forecast: 1300000 },
    { name: 'Day 10', actual: 1180000, forecast: 1250000 },
    { name: 'Day 15', forecast: 1400000 },
    { name: 'Day 20', forecast: 1520000 },
    { name: 'Day 25', forecast: 1450000 },
    { name: 'Day 30', forecast: 1600000 },
  ];

  const mockExpenseData = [
    { name: '利息支出', amount: 15000 },
    { name: '手续费', amount: 5000 },
    { name: '账户管理费', amount: 2000 },
    { name: '其他', amount: 1000 },
  ];

  const columns = [
    {
      title: '预测编号',
      dataIndex: 'forecastNumber',
      key: 'forecastNumber',
    },
    {
      title: '预测周期',
      key: 'period',
      render: (_: any, record: any) => (
        <span>
          {record.startDate
            ? `${new Date(record.startDate).toLocaleDateString()} 至 ${new Date(record.endDate).toLocaleDateString()}`
            : '-'}
        </span>
      ),
    },
    {
      title: '预测天数',
      dataIndex: 'forecastDays',
      key: 'forecastDays',
      render: (days: number) => <Tag>{days} 天</Tag>,
    },
    {
      title: '预测结束余额',
      dataIndex: 'projectedEndingBalance',
      key: 'projectedEndingBalance',
      render: (val: number) => (
        <span style={{ fontWeight: 500, color: val >= 0 ? '#52c41a' : '#ff4d4f' }}>
          ¥{Number(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>资金预测</h2>
        <p>基于历史数据生成资金流动预测，支持利息与费用分摊</p>
      </div>

      <Card
        extra={
          canGenerate && (
            <Button
              type="primary"
              icon={<LineChartOutlined />}
              onClick={handleGenerate}
              loading={generating}
            >
              生成预测
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={forecasts}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="资金预测详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={null}
      >
        {currentForecast && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="预测编号">{currentForecast.forecastNumber}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(currentForecast.status)}>{getStatusText(currentForecast.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="预测周期">
                {currentForecast.startDate
                  ? `${new Date(currentForecast.startDate).toLocaleDateString()} 至 ${new Date(currentForecast.endDate).toLocaleDateString()}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预测天数">{currentForecast.forecastDays} 天</Descriptions.Item>
              <Descriptions.Item label="起始余额">
                ¥{Number(currentForecast.startingBalance || 0).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="预测结束余额">
                <span style={{ color: '#52c41a', fontWeight: 500 }}>
                  ¥{Number(currentForecast.projectedEndingBalance || 0).toLocaleString()}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="预计收入"
                    value={Number(currentForecast.totalProjectedInflow || 0)}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="预计支出"
                    value={Number(currentForecast.totalProjectedOutflow || 0)}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="净变化"
                    value={Number(currentForecast.netChange || 0)}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: Number(currentForecast.netChange || 0) >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="资金趋势图" style={{ marginTop: 24 }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`} />
                  <Tooltip formatter={(value: any) => [`¥${Number(value).toLocaleString()}`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#1890ff" name="实际值" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="forecast" stroke="#52c41a" name="预测值" strokeDasharray="5 5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="预计费用分析" style={{ marginTop: 24 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mockExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `¥${value}`} />
                  <Tooltip formatter={(value: any) => [`¥${Number(value).toLocaleString()}`, '']} />
                  <Bar dataKey="amount" fill="#1890ff" name="金额" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Forecast;
