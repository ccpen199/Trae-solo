import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Table, Tag, Typography, Space, App, Button, Statistic, Progress } from 'antd';
import {
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  ExportOutlined,
  BarChartOutlined,
  UserOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import apiClient from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface NpsStats {
  total: number;
  avg_score: number;
  nps_score: number;
  promoters: number;
  passives: number;
  detractors: number;
}

interface NpsRecord {
  id: string;
  contract_id: string;
  owner_id: string;
  score: number;
  feedback: string;
  created_at: string;
  contract_no: string;
  owner_name: string;
}

const NPSStats: React.FC = () => {
  const { message } = App.useApp();
  const chartRef = useRef<ReactECharts>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NpsStats>({
    total: 0,
    avg_score: 0,
    nps_score: 0,
    promoters: 0,
    passives: 0,
    detractors: 0,
  });
  const [records, setRecords] = useState<NpsRecord[]>([]);

  useEffect(() => {
    fetchNpsData();
  }, []);

  const fetchNpsData = async () => {
    setLoading(true);
    try {
      const [statsRes, recordsRes] = await Promise.all([
        apiClient.get('/workorders/nps/stats'),
        apiClient.get('/workorders/nps'),
      ]);
      setStats(statsRes.data);
      setRecords(recordsRes.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取NPS数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const headers = ['评分', '反馈内容', '业主', '合同编号', '评价时间'];
      const csvContent = [
        headers.join(','),
        ...records.map((r) => [
          r.score,
          `"${(r.feedback || '').replace(/"/g, '""')}"`,
          r.owner_name,
          r.contract_no,
          dayjs(r.created_at).format('YYYY-MM-DD HH:mm'),
        ].join(',')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `NPS回访记录_${dayjs().format('YYYYMMDD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const getNpsLevel = (score: number) => {
    if (score >= 9) return { type: 'promoter', text: '推荐者', color: '#52c41a', icon: <SmileOutlined /> };
    if (score >= 7) return { type: 'passive', text: '被动者', color: '#faad14', icon: <MehOutlined /> };
    return { type: 'detractor', text: '贬损者', color: '#f5222d', icon: <FrownOutlined /> };
  };

  const getGaugeColor = (score: number) => {
    if (score >= 50) return '#52c41a';
    if (score >= 0) return '#faad14';
    return '#f5222d';
  };

  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: -100,
        max: 100,
        splitNumber: 10,
        itemStyle: {
          color: getGaugeColor(stats.nps_score),
        },
        progress: {
          show: true,
          width: 30,
        },
        pointer: {
          show: true,
          length: '60%',
          width: 8,
        },
        axisLine: {
          lineStyle: {
            width: 30,
            color: [
              [0.25, '#ff4d4f'],
              [0.5, '#faad14'],
              [0.75, '#52c41a'],
              [1, '#1890ff'],
            ],
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 20,
          itemStyle: {
            borderWidth: 8,
            borderColor: getGaugeColor(stats.nps_score),
          },
        },
        title: {
          show: true,
          offsetCenter: [0, '70%'],
          fontSize: 16,
          color: '#666',
        },
        detail: {
          valueAnimation: true,
          fontSize: 48,
          fontWeight: 'bold',
          offsetCenter: [0, '10%'],
          formatter: '{value}',
          color: getGaugeColor(stats.nps_score),
        },
        data: [
          {
            value: stats.nps_score,
            name: 'NPS净推荐值',
          },
        ],
      },
    ],
  };

  const columns = [
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number) => {
        const level = getNpsLevel(score);
        return (
          <Space>
            <span style={{ fontSize: 20, color: level.color }}>{level.icon}</span>
            <Tag color={level.color as any} style={{ padding: '4px 12px', borderRadius: 4, fontSize: 14 }}>
              {score} 分
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '用户类型',
      key: 'user_type',
      width: 100,
      render: (_: any, record: NpsRecord) => {
        const level = getNpsLevel(record.score);
        return <Tag color={level.color as any}>{level.text}</Tag>;
      },
    },
    {
      title: '反馈内容',
      dataIndex: 'feedback',
      key: 'feedback',
      render: (text: string) => (
        <Text type={text ? 'secondary' : 'warning'}>
          {text || '暂无评价内容'}
        </Text>
      ),
    },
    {
      title: '业主',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 100,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '合同编号',
      dataIndex: 'contract_no',
      key: 'contract_no',
      width: 170,
      render: (text: string) => (
        <Space>
          <FileTextOutlined />
          <span style={{ fontFamily: 'monospace' }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '评价时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const statCards = [
    {
      title: '总样本数',
      value: stats.total,
      suffix: '份',
      icon: <BarChartOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
      color: '#e6f7ff',
    },
    {
      title: '平均得分',
      value: stats.avg_score,
      suffix: '分',
      icon: <SmileOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
      color: '#f6ffed',
      precision: 2,
    },
  ];

  const userTypeCards = [
    {
      title: '推荐者 (9-10分)',
      value: stats.promoters,
      suffix: '人',
      color: '#f6ffed',
      textColor: '#52c41a',
      icon: <SmileOutlined style={{ fontSize: 24 }} />,
    },
    {
      title: '被动者 (7-8分)',
      value: stats.passives,
      suffix: '人',
      color: '#fffbe6',
      textColor: '#faad14',
      icon: <MehOutlined style={{ fontSize: 24 }} />,
    },
    {
      title: '贬损者 (0-6分)',
      value: stats.detractors,
      suffix: '人',
      color: '#fff1f0',
      textColor: '#f5222d',
      icon: <FrownOutlined style={{ fontSize: 24 }} />,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={3} style={{ marginBottom: 8 }}>
              <SmileOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              NPS回访与分析
            </Title>
            <Text type="secondary">
              净推荐值 (Net Promoter Score) - 衡量客户满意度和忠诚度的核心指标
            </Text>
          </div>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={handleExport}
            style={{ borderRadius: 6 }}
          >
            导出数据
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={3} key={index}>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                background: card.color,
                height: '100%',
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{card.title}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 28, color: '#333' }}>
                      {card.precision
                        ? Number(card.value).toFixed(card.precision)
                        : card.value}
                      <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4 }}>{card.suffix}</span>
                    </Text>
                  </div>
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </div>
              </Space>
            </Card>
          </Col>
        ))}

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              height: '100%',
            }}
            bodyStyle={{ padding: 0 }}
          >
            <ReactECharts
              ref={chartRef}
              option={gaugeOption}
              style={{ height: 160 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>

        {userTypeCards.map((card, index) => (
          <Col xs={24} sm={8} lg={5} key={index}>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                background: card.color,
                height: '100%',
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{card.title}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 28, color: card.textColor }}>
                      {card.value}
                      <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4 }}>{card.suffix}</span>
                    </Text>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Progress
                      percent={stats.total > 0 ? Math.round((card.value / stats.total) * 100) : 0}
                      size="small"
                      strokeColor={card.textColor}
                      showInfo={false}
                    />
                  </div>
                </div>
                <div style={{ color: card.textColor }}>
                  {card.icon}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="NPS历史记录"
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
};

export default NPSStats;
