import React, { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Table, Select, Button, Space, Statistic, Tag, Tabs, Tooltip, message } from 'antd';
import { Line, Bar, Pie } from '@ant-design/charts';
import { ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { apiEndpoints, ApiResponse } from '../api';
import { useAppStore } from '../store';
import { formatDate, getIndustryZoneLabel, getIndustryZoneClass, getProsperityLevelClass } from '../utils';

const { Option } = Select;
const { TabPane } = Tabs;

const ProsperityPage: React.FC = () => {
  const { currentDivision, setCurrentDivision, setCurrentLevel } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [industryZoneData, setIndustryZoneData] = useState<any[]>([]);
  const requestIdRef = useRef(0);
  const divisionLoadedRef = useRef(false);

  useEffect(() => {
    loadDivisionIfNeeded();
  }, []);

  useEffect(() => {
    if (currentDivision?.id) {
      loadData();
    }
  }, [periodType, currentDivision?.id]);

  useEffect(() => {
    if (currentIndex?.industry_zones) {
      const zoneData = Object.entries(currentIndex.industry_zones)
        .map(([key, value]: [string, any]) => ({
          type: getIndustryZoneLabel(key),
          value: value.jobs || 0,
          key,
        }))
        .filter(item => item.value > 0);
      setIndustryZoneData(zoneData);
    } else {
      setIndustryZoneData([]);
    }
  }, [currentIndex]);

  const uniqueHistoryData = () => {
    const seen = new Set();
    return historyData
      .filter(item => {
        const date = formatDate(item.period_start);
        if (seen.has(date)) return false;
        seen.add(date);
        return true;
      })
      .sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime());
  };

  const loadDivisionIfNeeded = async () => {
    if (currentDivision?.id || divisionLoadedRef.current) return;
    divisionLoadedRef.current = true;
    
    try {
      const res = await apiEndpoints.divisions.getTree() as ApiResponse;
      if (res.success && res.data?.length > 0) {
        const province = res.data[0];
        setCurrentLevel('province');
        setCurrentDivision(province);
      }
    } catch (error) {
      console.error('加载行政区划失败:', error);
    }
  };

  const loadData = async () => {
    if (!currentDivision?.id) return;
    
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    
    const results = await Promise.allSettled([
      apiEndpoints.prosperity.getCurrent({ admin_division_id: currentDivision.id, period_type: periodType }) as Promise<ApiResponse>,
      apiEndpoints.prosperity.getHistory({ admin_division_id: currentDivision.id, period_type: periodType, limit: 12 }) as Promise<ApiResponse>,
      apiEndpoints.prosperity.getRanking({ period_type: periodType, limit: 16 }) as Promise<ApiResponse>,
    ]);

    if (currentRequestId !== requestIdRef.current) return;

    const [indexRes, historyRes, rankingRes] = 
      results.map(r => r.status === 'fulfilled' ? r.value : null);

    if (indexRes?.data) setCurrentIndex(indexRes.data);
    if (historyRes) setHistoryData(Array.isArray(historyRes.data) ? historyRes.data : []);
    if (rankingRes) setRankingData(Array.isArray(rankingRes.data) ? rankingRes.data : []);
    setLoading(false);
  };

  const handleCalculateAll = async () => {
    try {
      message.loading('正在计算景气指数...', 0);
      const res = await apiEndpoints.prosperity.calculateAll() as ApiResponse;
      message.destroy();
      if (res.success) {
        message.success('景气指数计算完成');
        loadData();
      } else {
        message.error(res.message || '计算失败');
      }
    } catch (error) {
      message.destroy();
      message.error('计算失败');
      console.error('计算失败:', error);
    }
  };

  const lineConfig = {
    data: uniqueHistoryData().map((item: any) => [
      { date: formatDate(item.period_start), type: '景气指数', value: item.prosperity_score },
      { date: formatDate(item.period_start), type: '岗位数(×10)', value: item.total_jobs / 10 },
      { date: formatDate(item.period_start), type: '投递数(×10)', value: item.total_applications / 10 },
    ]).flat(),
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: { appear: { animation: 'path-in', duration: 1000 } },
    point: { size: 3, shape: 'circle' },
    legend: { position: 'top' },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: datum.value?.toFixed(1),
      }),
    },
  };

  const barConfig = {
    data: rankingData.filter((item: any) => item.prosperity_score > 0),
    xField: 'prosperity_score',
    yField: 'division_name',
    seriesField: 'division_name',
    isGroup: false,
    color: '#1890ff',
    label: {
      position: 'right',
      style: { fill: '#333', opacity: 0.8 },
      formatter: (datum: any) => datum.prosperity_score?.toFixed(1),
    },
    xAxis: {
      title: { text: '景气指数' },
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.division_name,
        value: `景气指数: ${datum.prosperity_score}`,
      }),
    },
  };

  const pieConfig = {
    data: industryZoneData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: { type: 'outer', content: '{name} {percentage}' },
    interactions: [{ type: 'element-active' }],
    legend: { position: 'bottom' },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: `${datum.value} 个岗位`,
      }),
    },
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
            {lineConfig.data.length > 0 ? (
              <Line {...lineConfig} height={350} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无历史数据，请点击"重新计算"生成</div>
            )}
          </Card>
        </TabPane>
        <TabPane tab="州市排名" key="2">
          <Card loading={loading}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                {barConfig.data.length > 0 ? (
                  <Bar {...barConfig} height={500} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无排名数据，请点击"重新计算"生成</div>
                )}
              </Col>
              <Col xs={24} lg={14}>
                <Table
                  columns={rankingColumns}
                  dataSource={rankingData.map((item, index) => ({ ...item, rank: index + 1 }))}
                  rowKey="division_id"
                  pagination={false}
                  size="small"
                  locale={{ emptyText: '暂无排名数据' }}
                />
              </Col>
            </Row>
          </Card>
        </TabPane>
        <TabPane tab="产业带分布" key="3">
          <Card loading={loading}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                {industryZoneData.length > 0 ? (
                  <Pie {...pieConfig} height={400} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无产业带数据</div>
                )}
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
                        if (total === 0) return '0%';
                        return `${((record.value / total) * 100).toFixed(1)}%`;
                      },
                    },
                  ]}
                  dataSource={industryZoneData}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  locale={{ emptyText: '暂无产业带数据' }}
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
