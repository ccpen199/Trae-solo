import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Tabs,
  Statistic,
  Spin,
  message,
  Tag,
} from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { analytics } from '../api';

const { TabPane } = Tabs;

function Analytics() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [overviewData, setOverviewData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [channelROIData, setChannelROIData] = useState([]);
  const [funnelData, setFunnelData] = useState([]);
  const [interviewConversionData, setInterviewConversionData] = useState([]);
  const [hotAreasData, setHotAreasData] = useState([]);

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        dashboardRes,
        trendRes,
        sourceRes,
        roiRes,
        funnelRes,
        areasRes,
      ] = await Promise.all([
        analytics.getDashboard(),
        analytics.getTrend({ days: 30 }),
        analytics.getCandidateSources(),
        analytics.getChannelROI(),
        analytics.getFunnel(),
        analytics.getHotAreas(),
      ]);

      if (dashboardRes.code === 0) {
        setOverviewData(dashboardRes.data.stats || dashboardRes.data);
      }
      if (trendRes.code === 0) {
        setTrendData(trendRes.data.trend || trendRes.data.list || []);
      }
      if (sourceRes.code === 0) {
        setSourceData(sourceRes.data.sources || sourceRes.data.list || []);
      }
      if (roiRes.code === 0) {
        setChannelROIData(roiRes.data.channels || roiRes.data.channelSummary || []);
      }
      if (funnelRes.code === 0) {
        setFunnelData(funnelRes.data.funnel || funnelRes.data.list || []);
      }
      if (areasRes.code === 0) {
        setHotAreasData(areasRes.data.areas || areasRes.data.list || []);
        setInterviewConversionData(areasRes.data.interviewConversion || []);
      }
    } catch (err) {
      message.error('加载数据失败');
      console.error('加载分析数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '总岗位数',
      value: overviewData?.total_jobs || overviewData?.published_jobs || 0,
      icon: <AppstoreOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      color: '#1890ff',
    },
    {
      title: '总投递数',
      value: overviewData?.total_applications || 0,
      icon: <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '面试数',
      value: overviewData?.interview_count || 0,
      icon: <CalendarOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      title: '入职数',
      value: overviewData?.hired_count || 0,
      icon: <UserOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      color: '#722ed1',
    },
    {
      title: '平均招聘周期',
      value: overviewData?.avg_hiring_cycle ? `${overviewData.avg_hiring_cycle}天` : '0天',
      icon: <ClockCircleOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />,
      color: '#eb2f96',
    },
    {
      title: '人均招聘成本',
      value: overviewData?.avg_hiring_cost ? `¥${overviewData.avg_hiring_cost.toLocaleString()}` : '¥0',
      icon: <DollarOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />,
      color: '#fa8c16',
    },
  ];

  const getTrendOption = () => {
    const dates = trendData.map((item) => dayjs(item.date || item.day).format('MM-DD'));
    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['投递数', '面试数', '入职数'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: {
          fontSize: 10,
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '投递数',
          type: 'line',
          smooth: true,
          data: trendData.map((item) => item.applications || item.application_count || 0),
          itemStyle: { color: '#1890ff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ],
            },
          },
        },
        {
          name: '面试数',
          type: 'line',
          smooth: true,
          data: trendData.map((item) => item.interviews || item.interview_count || 0),
          itemStyle: { color: '#52c41a' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
              ],
            },
          },
        },
        {
          name: '入职数',
          type: 'line',
          smooth: true,
          data: trendData.map((item) => item.hires || item.hired_count || 0),
          itemStyle: { color: '#722ed1' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(114, 46, 209, 0.3)' },
                { offset: 1, color: 'rgba(114, 46, 209, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  };

  const getSourceOption = () => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [
      {
        name: '求职者来源',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            formatter: '{b}\n{d}%',
          },
        },
        labelLine: {
          show: false,
        },
        data: sourceData.map((item, index) => ({
          value: item.count || item.value || 0,
          name: item.source || item.name,
          itemStyle: {
            color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#fa8c16', '#13c2c2'][index % 7],
          },
        })),
      },
    ],
  });

  const getChannelROIOption = () => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['投入成本', '入职人数'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: channelROIData.map((c) => c.channel_name || c.channel || c.name),
      axisLabel: {
        interval: 0,
        rotate: 30,
        fontSize: 11,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '投入成本(元)',
        position: 'left',
        axisLabel: {
          formatter: '{value}',
        },
      },
      {
        type: 'value',
        name: '入职人数',
        position: 'right',
        axisLabel: {
          formatter: '{value}',
        },
      },
    ],
    series: [
      {
        name: '投入成本',
        type: 'bar',
        yAxisIndex: 0,
        data: channelROIData.map((c) => c.cost || c.input_cost || 0),
        itemStyle: { color: '#1890ff' },
        barWidth: '30%',
      },
      {
        name: '入职人数',
        type: 'bar',
        yAxisIndex: 1,
        data: channelROIData.map((c) => c.hires || c.total_hires || 0),
        itemStyle: { color: '#52c41a' },
        barWidth: '30%',
      },
    ],
  });

  const getFunnelOption = () => {
    const stages = ['投递', '筛选', '面试', 'Offer', '入职'];
    const funnelColors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'];

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      series: [
        {
          name: '转化漏斗',
          type: 'funnel',
          left: '10%',
          top: 20,
          bottom: 60,
          width: '80%',
          min: 0,
          max: Math.max(...funnelData.map((f) => f.count || f.value || 1), 1),
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: (params) => {
              const rate = funnelData[params.dataIndex]?.conversion_rate || 0;
              return `${params.name}\n${params.value}人\n转化率: ${rate}%`;
            },
            fontSize: 11,
            color: '#fff',
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid',
            },
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
          },
          emphasis: {
            label: {
              fontSize: 13,
            },
          },
          data: funnelData.map((f, index) => ({
            value: f.count || f.value || 0,
            name: f.stage || f.label || stages[index],
            itemStyle: { color: funnelColors[index] },
          })),
        },
      ],
    };
  };

  const getHeatmapOption = () => {
    const areas = hotAreasData.slice(0, 25);
    const maxJobs = Math.max(...areas.map((a) => a.job_count || a.jobs || 1), 1);
    const maxApplications = Math.max(...areas.map((a) => a.application_count || a.applications || 1), 1);

    return {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          const data = params.data;
          return `${data[3]}<br/>岗位数: ${data[2]}<br/>投递数: ${data[4]}`;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '5%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 5 }, (_, i) => `列${i + 1}`),
        splitArea: { show: true },
        axisLabel: { show: false },
      },
      yAxis: {
        type: 'category',
        data: Array.from({ length: 5 }, (_, i) => `行${i + 1}`),
        splitArea: { show: true },
        axisLabel: { show: false },
      },
      visualMap: {
        min: 0,
        max: maxJobs,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#e6f7ff', '#91d5ff', '#69c0ff', '#40a9ff', '#1890ff', '#096dd9'],
        },
      },
      series: [
        {
          name: '热区热度',
          type: 'heatmap',
          data: areas.map((item, index) => [
            index % 5,
            Math.floor(index / 5),
            item.job_count || item.jobs || 0,
            item.area_name || item.name || `区域${index + 1}`,
            item.application_count || item.applications || 0,
          ]),
          label: {
            show: true,
            formatter: (params) => params.data[3],
            fontSize: 10,
            color: '#fff',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  };

  const getBubbleOption = () => {
    const areas = hotAreasData.slice(0, 15);
    const maxJobs = Math.max(...areas.map((a) => a.job_count || a.jobs || 1), 1);
    const maxApplications = Math.max(...areas.map((a) => a.application_count || a.applications || 1), 1);

    const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#fa8c16', '#13c2c2', '#f5222d'];

    return {
      tooltip: {
        formatter: (params) => {
          return `${params.name}<br/>岗位数: ${params.value[0]}<br/>投递数: ${params.value[1]}<br/>热度评分: ${params.value[2]}`;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '10%',
      },
      xAxis: {
        name: '岗位数',
        type: 'value',
        max: maxJobs * 1.2,
      },
      yAxis: {
        name: '投递数',
        type: 'value',
        max: maxApplications * 1.2,
      },
      series: [
        {
          type: 'scatter',
          data: areas.map((item, index) => ({
            name: item.area_name || item.name,
            value: [
              item.job_count || item.jobs || 0,
              item.application_count || item.applications || 0,
              item.heat_score || Math.round(((item.job_count || 0) / maxJobs) * 100),
            ],
            symbolSize: Math.max(20, ((item.heat_score || 50) / 100) * 60),
            itemStyle: {
              color: colors[index % colors.length],
              opacity: 0.8,
            },
          })),
          label: {
            show: true,
            formatter: '{b}',
            position: 'top',
            fontSize: 10,
          },
        },
      ],
    };
  };

  const channelROIColumns = [
    {
      title: '渠道名称',
      dataIndex: 'channel_name',
      key: 'channel_name',
      render: (text, record) => text || record.channel || record.name,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: '投入成本',
      dataIndex: 'cost',
      key: 'cost',
      render: (text, record) => `¥${(text || record.input_cost || 0).toLocaleString()}`,
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '入职人数',
      dataIndex: 'hires',
      key: 'hires',
      render: (text, record) => text || record.total_hires || 0,
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '人均成本',
      dataIndex: 'avg_cost_per_hire',
      key: 'avg_cost_per_hire',
      render: (text, record) => {
        const cost = record.cost || record.input_cost || 0;
        const hires = record.hires || record.total_hires || 1;
        return `¥${Math.round(cost / hires).toLocaleString()}`;
      },
      responsive: ['md', 'lg', 'xl'],
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      render: (text) => {
        const roi = text || 0;
        const color = roi >= 3 ? 'success' : roi >= 1 ? 'warning' : 'error';
        return <Tag color={color}>{roi.toFixed(2)}x</Tag>;
      },
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '转化率',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      render: (text) => `${text || 0}%`,
      responsive: ['md', 'lg', 'xl'],
    },
  ];

  const interviewConversionColumns = [
    {
      title: '岗位名称',
      dataIndex: 'job_title',
      key: 'job_title',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: '投递数',
      dataIndex: 'applications',
      key: 'applications',
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '面试数',
      dataIndex: 'interviews',
      key: 'interviews',
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '到面率',
      dataIndex: 'attendance_rate',
      key: 'attendance_rate',
      render: (text) => {
        const rate = text || 0;
        const color = rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'error';
        return <Tag color={color}>{rate}%</Tag>;
      },
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '通过率',
      dataIndex: 'pass_rate',
      key: 'pass_rate',
      render: (text) => `${text || 0}%`,
      responsive: ['md', 'lg', 'xl'],
    },
  ];

  const hotAreaColumns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => {
        const colors = ['#f5222d', '#fa8c16', '#faad14', '#d9d9d9', '#d9d9d9'];
        return (
          <span
            style={{
              display: 'inline-block',
              width: '24px',
              height: '24px',
              lineHeight: '24px',
              textAlign: 'center',
              borderRadius: '50%',
              background: colors[index] || '#d9d9d9',
              color: index < 3 ? '#fff' : '#666',
              fontWeight: 'bold',
              fontSize: '12px',
            }}
          >
            {index + 1}
          </span>
        );
      },
    },
    {
      title: '区域名称',
      dataIndex: 'area_name',
      key: 'area_name',
      render: (text, record) => text || record.name,
    },
    {
      title: '岗位数',
      dataIndex: 'job_count',
      key: 'job_count',
      render: (text, record) => text || record.jobs || 0,
    },
    {
      title: '投递数',
      dataIndex: 'application_count',
      key: 'application_count',
      render: (text, record) => text || record.applications || 0,
    },
    {
      title: '热度评分',
      dataIndex: 'heat_score',
      key: 'heat_score',
      render: (text, record) => {
        const score = text || record.score || Math.round(((record.job_count || 0) / 100) * 100);
        const color = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error';
        return <Tag color={color}>{score}分</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="数据概览" key="overview">
            <Row gutter={[16, 16]}>
              {statCards.map((card, index) => (
                <Col xs={24} sm={12} md={8} lg={4} key={index}>
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Statistic title={card.title} value={card.value} />
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: `${card.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {card.icon}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col xs={24} lg={16}>
                <Card title="30天趋势图">
                  <ReactECharts option={getTrendOption()} style={{ height: '350px' }} />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card title="求职者来源分布">
                  <ReactECharts option={getSourceOption()} style={{ height: '350px' }} />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="渠道分析" key="channel">
            <Card title="渠道 ROI 分析" style={{ marginBottom: '16px' }}>
              <ReactECharts option={getChannelROIOption()} style={{ height: '400px' }} />
            </Card>
            <Card title="渠道 ROI 详情">
              <Table
                dataSource={channelROIData}
                columns={channelROIColumns}
                rowKey={(record, index) => record.id || index}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (t) => `共 ${t} 条记录`,
                }}
                scroll={{ x: 800 }}
              />
            </Card>
          </TabPane>

          <TabPane tab="转化分析" key="conversion">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="招聘转化漏斗">
                  <ReactECharts option={getFunnelOption()} style={{ height: '400px' }} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="各阶段转化率">
                  {funnelData.map((item, index) => {
                    const stages = ['投递', '筛选', '面试', 'Offer', '入职'];
                    const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'];
                    return (
                      <div key={index} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 500 }}>{item.stage || item.label || stages[index]}</span>
                          <span style={{ color: colors[index] }}>
                            {item.count || item.value || 0}人 ({item.conversion_rate || 0}%)
                          </span>
                        </div>
                        <div
                          style={{
                            height: '8px',
                            background: '#f0f0f0',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(item.conversion_rate || 0, 100)}%`,
                              background: colors[index],
                              borderRadius: '4px',
                              transition: 'width 0.3s',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </Col>
            </Row>

            <Card title="到面转化分析" style={{ marginTop: '16px' }}>
              <Table
                dataSource={interviewConversionData}
                columns={interviewConversionColumns}
                rowKey={(record, index) => record.id || index}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (t) => `共 ${t} 条记录`,
                }}
                scroll={{ x: 600 }}
              />
            </Card>
          </TabPane>

          <TabPane tab="热区地图" key="heatmap">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="同城热岗热区热度地图">
                  <ReactECharts option={getHeatmapOption()} style={{ height: '400px' }} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="岗位热度气泡图">
                  <ReactECharts option={getBubbleOption()} style={{ height: '400px' }} />
                </Card>
              </Col>
            </Row>

            <Card title="区域热度排名" style={{ marginTop: '16px' }}>
              <Table
                dataSource={hotAreasData}
                columns={hotAreaColumns}
                rowKey={(record, index) => record.id || index}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (t) => `共 ${t} 条记录`,
                }}
              />
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default Analytics;
