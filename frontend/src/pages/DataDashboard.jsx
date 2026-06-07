import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Card, Row, Col, Spin, message, Statistic, Tag, Select, Space
} from 'antd';
import {
  RiseOutlined, FallOutlined, BarChartOutlined,
  LineChartOutlined, PieChartOutlined, ClockCircleOutlined,
  MoneyCollectOutlined, TeamOutlined
} from '@ant-design/icons';
import api from '../utils/api';

const { Option } = Select;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  Title
);

const DataDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [supplyDemandData, setSupplyDemandData] = useState([]);
  const [onboardingCycleData, setOnboardingCycleData] = useState([]);
  const [retentionData, setRetentionData] = useState([]);
  const [salaryTrendsData, setSalaryTrendsData] = useState([]);
  const [funnelData, setFunnelData] = useState([]);
  const [industryFilter, setIndustryFilter] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, [industryFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const params = industryFilter !== 'all' ? { industry: industryFilter } : {};
      const [
        overviewRes,
        supplyDemandRes,
        onboardingRes,
        retentionRes,
        salaryRes,
        funnelRes
      ] = await Promise.all([
        api.get('/dashboard/overview', { params }),
        api.get('/dashboard/job-supply-demand', { params }),
        api.get('/dashboard/average-onboarding-cycle', { params }),
        api.get('/dashboard/talent-retention', { params }),
        api.get('/dashboard/salary-trends', { params }),
        api.get('/dashboard/application-funnel', { params }),
      ]);

      const overviewData = overviewRes.data;
      const onboardingOverall = onboardingRes.data.overall || {};
      const salaryData = salaryRes.data.data || [];
      const avgSalary = salaryData.length > 0 
        ? Math.round(salaryData.reduce((sum, d) => sum + (d.avg_mid_salary || 0), 0) / salaryData.length)
        : 0;
      
      setOverview({
        ...overviewData,
        totalJobs: overviewData.summary?.totalJobs || 0,
        totalApplications: overviewData.summary?.totalApplications || 0,
        totalHires: overviewData.summary?.totalHires || 0,
        totalEnterprises: overviewData.summary?.totalEnterprises || 0,
        newJobsThisMonth: overviewData.summary?.totalJobs || 0,
        activeSeekers: overviewData.summary?.totalApplications || 0,
        averageSalary: avgSalary,
        averageOnboardingDays: onboardingOverall.overall_avg_days || 0,
      });
      setSupplyDemandData(supplyDemandRes.data.data || []);
      setOnboardingCycleData(onboardingRes.data.data || []);
      setRetentionData(retentionRes.data.data || []);
      setSalaryTrendsData(salaryData);
      setFunnelData(funnelRes.data.funnel || []);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const supplyDemandChartData = {
    labels: supplyDemandData.map(d => d.category_name),
    datasets: [
      {
        label: '职位需求数',
        data: supplyDemandData.map(d => d.job_count),
        backgroundColor: 'rgba(22, 119, 255, 0.7)',
        borderColor: 'rgba(22, 119, 255, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: '求职人数',
        data: supplyDemandData.map(d => d.application_count),
        backgroundColor: 'rgba(114, 46, 209, 0.7)',
        borderColor: 'rgba(114, 46, 209, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const supplyDemandChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: '各岗位类别供需比',
        font: { size: 16, weight: '600' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: '人数',
        },
      },
    },
  };

  const onboardingCycleChartData = {
    labels: onboardingCycleData.map(d => d.category_name),
    datasets: [
      {
        label: '平均入职周期(天)',
        data: onboardingCycleData.map(d => d.avg_days),
        backgroundColor: [
          'rgba(22, 119, 255, 0.7)',
          'rgba(114, 46, 209, 0.7)',
          'rgba(250, 140, 22, 0.7)',
          'rgba(19, 194, 194, 0.7)',
          'rgba(82, 196, 26, 0.7)',
          'rgba(250, 84, 28, 0.7)',
        ],
        borderColor: [
          'rgba(22, 119, 255, 1)',
          'rgba(114, 46, 209, 1)',
          'rgba(250, 140, 22, 1)',
          'rgba(19, 194, 194, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 84, 28, 1)',
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const onboardingCycleChartOptions = {
    ...chartOptions,
    indexAxis: 'y',
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: '各类别平均入职周期',
        font: { size: 16, weight: '600' },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: '天数',
        },
      },
    },
  };

  const retentionChartData = {
    labels: retentionData.map(d => d.category_name),
    datasets: [
      {
        label: '留存率(%)',
        data: retentionData.map(d => d.retention_rate),
        borderColor: 'rgba(22, 119, 255, 1)',
        backgroundColor: 'rgba(22, 119, 255, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y',
      },
      {
        label: '平均在职天数',
        data: retentionData.map(d => d.avg_tenure_days),
        borderColor: 'rgba(82, 196, 26, 1)',
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };

  const retentionChartOptions = {
    ...chartOptions,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: '人才留存率分析',
        font: { size: 16, weight: '600' },
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: '留存率(%)',
        },
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        title: {
          display: true,
          text: '平均在职天数',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const salaryTrendsChartData = {
    labels: salaryTrendsData.map(d => d.category_name),
    datasets: [
      {
        label: '最低薪资',
        data: salaryTrendsData.map(d => d.avg_min_salary || 0),
        backgroundColor: 'rgba(22, 119, 255, 0.7)',
        borderColor: 'rgba(22, 119, 255, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: '中位薪资',
        data: salaryTrendsData.map(d => d.avg_mid_salary || 0),
        backgroundColor: 'rgba(114, 46, 209, 0.7)',
        borderColor: 'rgba(114, 46, 209, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: '最高薪资',
        data: salaryTrendsData.map(d => d.avg_max_salary || 0),
        backgroundColor: 'rgba(250, 140, 22, 0.7)',
        borderColor: 'rgba(250, 140, 22, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const salaryTrendsChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: '各岗位薪资范围对比 (月薪/元)',
        font: { size: 16, weight: '600' },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ¥${context.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `¥${value.toLocaleString()}`,
        },
      },
    },
  };

  const getRatioColor = (ratio) => {
    if (ratio >= 1.5) return '#52c41a';
    if (ratio >= 1) return '#1677ff';
    if (ratio >= 0.7) return '#fa8c16';
    return '#f5222d';
  };

  if (loading && !overview) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      <div className="page-header">
        <h2>
          <Space>
            <BarChartOutlined style={{ color: '#1677ff' }} />
            行业数据看板
          </Space>
        </h2>
        <Space>
          <Select
            placeholder="选择行业"
            value={industryFilter}
            onChange={setIndustryFilter}
            style={{ width: 180 }}
            allowClear
          >
            <Option value="all">全部行业</Option>
            <Option value="automotive">汽车制造</Option>
            <Option value="machinery">机械装备</Option>
            <Option value="electronics">电子信息</Option>
            <Option value="mold">模具制造</Option>
            <Option value="hardware">五金制品</Option>
          </Select>
        </Space>
      </div>

      {overview && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="本月新增岗位"
                value={overview.newJobsThisMonth || 0}
                prefix={<BarChartOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: '#1677ff' }}
                suffix={
                  overview.jobGrowth > 0 ? (
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      <RiseOutlined /> {overview.jobGrowth}%
                    </Tag>
                  ) : overview.jobGrowth < 0 ? (
                    <Tag color="red" style={{ marginLeft: 8 }}>
                      <FallOutlined /> {Math.abs(overview.jobGrowth)}%
                    </Tag>
                  ) : null
                }
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="活跃求职人数"
                value={overview.activeSeekers || 0}
                prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="平均薪资"
                value={overview.averageSalary || 0}
                prefix={<MoneyCollectOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
                precision={0}
                suffix="元/月"
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="平均入职周期"
                value={overview.averageOnboardingDays || 0}
                prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
                suffix="天"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card className="card-shadow" loading={loading}>
            <div style={{ height: 400 }}>
              <Bar data={supplyDemandChartData} options={supplyDemandChartOptions} />
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {supplyDemandData.filter(d => d.job_count > 0).slice(0, 8).map((d, idx) => (
                <Tag key={idx} color={getRatioColor(d.supply_demand_ratio)}>
                  {d.category_name} 供需比 {d.supply_demand_ratio.toFixed(2)}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="card-shadow" loading={loading}>
            <div style={{ height: 400 }}>
              <Bar data={onboardingCycleChartData} options={onboardingCycleChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card className="card-shadow" loading={loading}>
            <div style={{ height: 400 }}>
              <Line data={retentionChartData} options={retentionChartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <PieChartOutlined style={{ color: '#722ed1' }} />
                申请转化漏斗
              </Space>
            }
            className="card-shadow"
            loading={loading}
          >
            <div style={{ padding: '20px 0' }}>
              {funnelData.map((item, idx) => {
                const total = funnelData[0]?.count || 1;
                const widthPercent = Math.max((item.count / total) * 100, 30);
                const colors = ['#1677ff', '#722ed1', '#fa8c16', '#13c2c2', '#52c41a', '#f5222d'];
                return (
                  <div key={item.status} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{
                      width: `${widthPercent}%`,
                      minWidth: 80,
                      background: `linear-gradient(90deg, ${colors[idx % colors.length]} 0%, ${colors[idx % colors.length]}99 100%)`,
                      padding: '14px 20px',
                      borderRadius: 8,
                      color: '#fff',
                      marginRight: 16,
                      transition: 'all 0.3s',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{item.count}</div>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>{item.label}</div>
                    </div>
                    <div style={{ minWidth: 80 }}>
                      <div style={{ fontWeight: 600 }}>{Math.round(item.count / total * 100)}%</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {idx > 0 && (
                          <span>
                            转化 {Math.round(item.count / (funnelData[idx - 1]?.count || 1) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card className="card-shadow" loading={loading}>
            <div style={{ height: 400 }}>
              <Line data={salaryTrendsChartData} options={salaryTrendsChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DataDashboard;
