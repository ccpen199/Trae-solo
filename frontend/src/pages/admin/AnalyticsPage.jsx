import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Tabs,
  Typography,
  Row,
  Col,
  Statistic,
  Checkbox,
  message
} from 'antd';
import {
  TeamOutlined,
  EnvironmentOutlined,
  BoxPlotOutlined
} from '@ant-design/icons';
import {
  getEngineerPerformance,
  getFaultHeatmap,
  getPartsForecast,
  getEngineerRadar
} from '../../services/adminService';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('performance');
  const [performanceData, setPerformanceData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEngineers, setSelectedEngineers] = useState([]);
  const [radarDataList, setRadarDataList] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'performance') {
        const res = await getEngineerPerformance();
        const data = res.data || [];
        setPerformanceData(data);
        if (selectedEngineers.length === 0 && data.length > 0) {
          const defaultSelected = data.slice(0, 3).map(e => e.id);
          setSelectedEngineers(defaultSelected);
          loadRadarData(defaultSelected);
        }
      } else if (activeTab === 'heatmap') {
        const res = await getFaultHeatmap();
        setHeatmapData(res.data || []);
      } else if (activeTab === 'forecast') {
        const res = await getPartsForecast();
        setForecastData(res.data || []);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadRadarData = async (engineerIds) => {
    try {
      const promises = engineerIds.map(id => getEngineerRadar(id));
      const results = await Promise.all(promises);
      setRadarDataList(results.map(r => r.data).filter(Boolean));
    } catch (error) {
      console.error('Failed to load radar data:', error);
    }
  };

  const handleEngineerSelect = (id, checked) => {
    let newSelected;
    if (checked) {
      newSelected = [...selectedEngineers, id];
    } else {
      newSelected = selectedEngineers.filter(eid => eid !== id);
    }
    setSelectedEngineers(newSelected);
    loadRadarData(newSelected);
  };

  const getLevelName = (level) => {
    const names = ['', '初级', '中级', '高级', '专家', '大师'];
    return names[level] || '未知';
  };

  const performanceColumns = [
    {
      title: '选择',
      key: 'select',
      width: 60,
      render: (_, record) => (
        <Checkbox
          checked={selectedEngineers.includes(record.id)}
          onChange={(e) => handleEngineerSelect(record.id, e.target.checked)}
        />
      )
    },
    {
      title: '工程师',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '级别',
      dataIndex: 'certificateLevel',
      key: 'certificateLevel',
      render: (level) => <Tag color="blue">{getLevelName(level)}</Tag>
    },
    {
      title: '完成订单',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: (a, b) => a.totalOrders - b.totalOrders
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (text) => <span style={{ color: '#52c41a' }}>{text || 0}%</span>,
      sorter: (a, b) => parseFloat(a.successRate) - parseFloat(b.successRate)
    },
    {
      title: '平均评分',
      dataIndex: 'avgRating',
      key: 'avgRating',
      render: (text) => <span style={{ color: '#faad14' }}>{text || 0}</span>,
      sorter: (a, b) => parseFloat(a.avgRating) - parseFloat(b.avgRating)
    },
    {
      title: '服务半径',
      dataIndex: 'serviceRadius',
      key: 'serviceRadius',
      render: (text) => <span>{text || 10}km</span>
    }
  ];

  const colors = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

  const radarOption = {
    tooltip: {},
    legend: {
      data: radarDataList.map(r => r.name),
      bottom: 0
    },
    radar: {
      indicator: radarDataList.length > 0 ? radarDataList[0].indicators.map(i => ({
        name: i.name,
        max: 100
      })) : []
    },
    series: [{
      type: 'radar',
      data: radarDataList.map((r, index) => ({
        value: r.indicators.map(i => i.value),
        name: r.name,
        areaStyle: { color: `${colors[index % colors.length]}33` },
        lineStyle: { color: colors[index % colors.length] },
        itemStyle: { color: colors[index % colors.length] }
      }))
    }]
  };

  const heatmapOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    visualMap: {
      min: 0,
      max: Math.max(...heatmapData.map(d => d.value), 10),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '10%',
      inRange: {
        color: ['#e0f3ff', '#91caff', '#1677ff', '#0958d9', '#003eb3']
      }
    },
    series: [{
      name: '故障分布',
      type: 'pie',
      radius: ['30%', '70%'],
      center: ['50%', '40%'],
      roseType: 'area',
      itemStyle: {
        borderRadius: 8
      },
      data: heatmapData.map((item, index) => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: colors[index % colors.length]
        }
      }))
    }]
  };

  const forecastDates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    forecastDates.push(date.toISOString().split('T')[0]);
  }

  const forecastOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['当前库存', '预测需求', '安全库存'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: forecastDates
    },
    yAxis: {
      type: 'value',
      name: '数量'
    },
    series: forecastData.slice(0, 5).map((part, index) => ({
      name: part.name,
      type: 'line',
      data: forecastDates.map((_, i) => {
        const base = part.currentStock;
        const trend = (part.forecastDemand - part.minStock) / 7 * i;
        return Math.max(0, Math.round(base - trend + Math.random() * 10));
      }),
      smooth: true,
      itemStyle: { color: colors[index % colors.length] },
      lineStyle: { color: colors[index % colors.length] }
    })).concat([
      {
        name: '安全库存线',
        type: 'line',
        data: forecastDates.map(() => 10),
        lineStyle: {
          color: '#f5222d',
          type: 'dashed'
        },
        itemStyle: { color: '#f5222d' }
      }
    ])
  };

  const tabItems = [
    {
      key: 'performance',
      label: (
        <Space>
          <TeamOutlined />
          工程师绩效
        </Space>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="工程师总数"
                  value={performanceData.length}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="平均成功率"
                  value={performanceData.length > 0 ? (performanceData.reduce((sum, e) => sum + parseFloat(e.successRate), 0) / performanceData.length).toFixed(1) : 0}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="总完成订单"
                  value={performanceData.reduce((sum, e) => sum + (e.totalOrders || 0), 0)}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="平均评分"
                  value={performanceData.length > 0 ? (performanceData.reduce((sum, e) => sum + parseFloat(e.avgRating), 0) / performanceData.length).toFixed(1) : 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card title="绩效列表" loading={loading}>
                <Table
                  columns={performanceColumns}
                  dataSource={performanceData}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="能力对比雷达图" loading={loading}>
                <ReactECharts option={radarOption} style={{ height: 400 }} />
              </Card>
            </Col>
          </Row>
        </Space>
      )
    },
    {
      key: 'heatmap',
      label: (
        <Space>
          <EnvironmentOutlined />
          区域故障分布
        </Space>
      ),
      children: (
        <Card title="故障类型热力分布" loading={loading}>
          <ReactECharts option={heatmapOption} style={{ height: 500 }} />
        </Card>
      )
    },
    {
      key: 'forecast',
      label: (
        <Space>
          <BoxPlotOutlined />
          配件耗损预测
        </Space>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="配件需求预测趋势" loading={loading}>
            <ReactECharts option={forecastOption} style={{ height: 400 }} />
          </Card>
          <Card title="库存预警列表" loading={loading}>
            <Table
              dataSource={forecastData.filter(f => f.status === 'warning')}
              rowKey="id"
              columns={[
                {
                  title: '配件名称',
                  dataIndex: 'name',
                  key: 'name'
                },
                {
                  title: 'SKU',
                  dataIndex: 'sku',
                  key: 'sku',
                  render: (text) => <Tag>{text}</Tag>
                },
                {
                  title: '当前库存',
                  dataIndex: 'currentStock',
                  key: 'currentStock',
                  render: (text) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{text}</span>
                },
                {
                  title: '安全库存',
                  dataIndex: 'minStock',
                  key: 'minStock'
                },
                {
                  title: '预测需求',
                  dataIndex: 'forecastDemand',
                  key: 'forecastDemand'
                },
                {
                  title: '单价',
                  dataIndex: 'price',
                  key: 'price',
                  render: (text) => <span>¥{text || 0}</span>
                },
                {
                  title: '状态',
                  key: 'status',
                  render: () => <Tag color="red">库存预警</Tag>
                }
              ]}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3} style={{ margin: 0 }}>数据分析中心</Title>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </Space>
  );
};

export default AnalyticsPage;
