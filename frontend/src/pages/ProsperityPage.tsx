import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Select, Button, Space, Statistic, Tag, Tabs, Tooltip } from 'antd';
import { Line, Bar, Pie } from '@ant-design/charts';
import { ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { apiEndpoints, ApiResponse } from '../api';
import { formatDate, getIndustryZoneLabel, getIndustryZoneClass, getProsperityLevelClass } from '../utils';

const { Option } = Select;
const { TabPane } = Tabs;

const ProsperityPage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [periodType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [indexRes, historyRes, rankingRes] = await Promise.all([
        apiEndpoints.prosperity.getCurrent({ admin_division_id: 'prov_yunnan', period_type: periodType }) as Promise<ApiResponse>,
        apiEndpoints.prosperity.getHistory({ admin_division_id: 'prov_yunnan', period_type: periodType, limit: 12 }) as Promise<ApiResponse>,
        apiEndpoints.prosperity.getRanking({ period_type: periodType, limit: 16 }) as Promise<ApiResponse>,
      ]);

      setCurrentIndex(indexRes.data);
      setHistoryData(historyRes.data || []);
      setRankingData(rankingRes.data || []);
    } catch (error) {
      console.error('加载景气指数失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAll = async () => {
    try {
      const res = await apiEndpoints.prosperity.calculateAll() as ApiResponse;
      if (res.success) {
        loadData();
      }
    } catch (error) {
      console.error('计算失败:', error);
    }
  };

  const lineConfig = {
    data: historyData.map((item: any) => ({
      date: formatDate(item.period_start),
      景气指数: item.prosperity_score,
      岗位数: item.total_jobs / 10,
      投递数: item.total_applications / 10,
    })),
    xField: 'date',
    yField: ['景气指数', '岗位数', '投递数'],
    smooth: true,
    animation: { appear: { animation: 'path-in', duration: 1000 } },
  };

  const barConfig = {
    data: rankingData,
    xField: 'prosperity_score',
    yField: 'division_name',
    seriesField: 'prosperity_score',
    color: ({ prosperity_score }: any) => {
      if (prosperity_score >= 80) return '#52c41a';
      if (prosperity_score >= 60) return '#faad14';
      return '#ff4d4f';
    },
    label: {
      position: 'middle',
      style: { fill: '#fff', opacity: 0.8 },
    },
  };

  const industryZoneData = currentIndex?.industry_zones
    ? Object.entries(currentIndex.industry_zones).map(([key, value]: [string, any]) => ({
        type: getIndustryZoneLabel(key),
        value: value.jobs || 0,
        key,
      }))
    : [];

  const pieConfig = {
    data: industryZoneData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: { type: 'outer', content: '{name} {percentage}' },
    interactions: [{ type: 'element-active' }],
  };

  const rankingColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank: number) => {
        if (rank === 1) return <span style={{ color: '#faad14', fontWeight: 600 }}>🥇</span>;
        if (rank === 2) return <span style={{ color: '#bfbfbf', fontWeight: 600 }}>🥈</span>;
        if (rank === 3) return <span style={{ color: '#d48806', fontWeight: 600 }}>🥉</span>;
        return rank;
      },
    },
    {
      title: '州市',
      dataIndex: 'division_name',
      key: 'division_name',
    },
    {
      title: '景气指数',
      dataIndex: 'prosperity_score',
      key: 'prosperity_score',
      render: (score: number) => {
        const level = getProsperityLevelClass(score);
        return (
          <Space>
            <span className={`prosperity-score small ${level}`}>{score}</span>
            {score >= 80 ? <ArrowUpOutlined style={{ color: '#52c41a' }} /> : score >= 60 ? null : <ArrowDownOutlined style={{ color: '#ff4d4f' }} />}
          </Space>
        );
      },
    },
    {
      title: '岗位数',
      dataIndex: 'total_jobs',
      key: 'total_jobs',
      render: (v: number) => v?.toLocaleString(),
    },
    {
      title: '投递数',
      dataIndex: 'total_applications',
      key: 'total_applications',
      render: (v: number) => v?.toLocaleString(),
    },
    {
      title: '薪资中位数',
      dataIndex: 'salary_median',
      key: 'salary_median',
      render: (v: number) => `¥${v?.toLocaleString()}`,
    },
    {
      title: '岗位增长率',
      dataIndex: 'job_growth_rate',
      key: 'job_growth_rate',
      render: (v: number) => {
        const color = v >= 0 ? '#52c41a' : '#ff4d4f';
        return (
          <span style={{ color, fontWeight: 500 }}>
            {v >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(v)}%
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <Card
        title="云南省用工景气指数"
        extra={
          <Space>
            <Select value={periodType} onChange={setPeriodType} style={{ width: 120 }} size="small">
              <Option value="daily">日度</Option>
              <Option value="weekly">周度</Option>
              <Option value="monthly">月度</Option>
            </Select>
            <Button icon={<ReloadOutlined />} size="small" onClick={handleCalculateAll}>
              重新计算
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {currentIndex && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div className={`prosperity-score ${getProsperityLevelClass(currentIndex.prosperity_score)}`}>
                  {currentIndex.prosperity_score}
                </div>
                <div style={{ color: '#888', marginTop: 8 }}>综合景气指数</div>
                <Tag color={currentIndex.prosperity_score >= 80 ? 'green' : currentIndex.prosperity_score >= 60 ? 'orange' : 'red'}>
                  {getProsperityLevelClass(currentIndex.prosperity_score) === 'hot' ? '用工火热' : getProsperityLevelClass(currentIndex.prosperity_score) === 'normal' ? '用工平稳' : '用工偏冷'}
                </Tag>
              </div>
            </Col>
            <Col xs={24} sm={18}>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Statistic title="岗位总数" value={currentIndex.total_jobs} valueStyle={{ color: '#1890ff' }} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title="投递总数" value={currentIndex.total_applications} valueStyle={{ color: '#52c41a' }} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title="薪资中位数" value={currentIndex.salary_median} prefix="¥" valueStyle={{ color: '#faad14' }} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="岗位增长率"
                    value={currentIndex.job_growth_rate}
                    suffix="%"
                    prefix={currentIndex.job_growth_rate >= 0 ? '+' : ''}
                    valueStyle={{ color: currentIndex.job_growth_rate >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title="平均薪资" value={currentIndex.salary_average} prefix="¥" />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="投递增长率"
                    value={currentIndex.application_growth_rate}
                    suffix="%"
                    prefix={currentIndex.application_growth_rate >= 0 ? '+' : ''}
                    valueStyle={{ color: currentIndex.application_growth_rate >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title="招聘企业数" value={currentIndex.active_companies} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title="岗位供需比" value={currentIndex.supply_demand_ratio?.toFixed(2)} suffix=":1" />
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </Card>

      <Tabs defaultActiveKey="1">
        <TabPane tab="历史趋势" key="1">
          <Card loading={loading}>
            <Line {...lineConfig} height={350} />
          </Card>
        </TabPane>
        <TabPane tab="州市排名" key="2">
          <Card loading={loading}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <Bar {...barConfig} height={500} />
              </Col>
              <Col xs={24} lg={14}>
                <Table
                  columns={rankingColumns}
                  dataSource={rankingData.map((item, index) => ({ ...item, rank: index + 1 }))}
                  rowKey="division_id"
                  pagination={false}
                  size="small"
                />
              </Col>
            </Row>
          </Card>
        </TabPane>
        <TabPane tab="产业带分布" key="3">
          <Card loading={loading}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <Pie {...pieConfig} height={400} />
              </Col>
              <Col xs={24} lg={14}>
                <Table
                  columns={[
                    {
                      title: '产业带',
                      dataIndex: 'type',
                      key: 'type',
                      render: (text: string, record: any) => (
                        <Space>
                          <span className={`industry-tag ${getIndustryZoneClass(record.key)}`}>{text}</span>
                        </Space>
                      ),
                    },
                    { title: '岗位数', dataIndex: 'value', key: 'value', render: (v: number) => v.toLocaleString() },
                    {
                      title: '占比',
                      key: 'percentage',
                      render: (_: any, record: any) => {
                        const total = industryZoneData.reduce((sum, item) => sum + item.value, 0);
                        return `${((record.value / total) * 100).toFixed(1)}%`;
                      },
                    },
                  ]}
                  dataSource={industryZoneData}
                  rowKey="key"
                  pagination={false}
                  size="small"
                />
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ProsperityPage;
