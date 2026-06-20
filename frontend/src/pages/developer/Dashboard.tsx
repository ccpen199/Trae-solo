import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import api from '../../utils/request';

export default function DeveloperDashboard() {
  const [stats, setStats] = useState<any>({});
  const [channelStats, setChannelStats] = useState<any[]>([]);
  const [districtStats, setDistrictStats] = useState<any[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<any[]>([]);
  const [topProperties, setTopProperties] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
    loadHeatmap();
  }, []);

  const loadDashboard = async () => {
    try {
      const res: any = await api.get('/developer/dashboard');
      setStats(res.stats || {});
      setChannelStats(res.channelStats || []);
      setDistrictStats(res.districtStats || []);
      setConversionFunnel(res.conversionFunnel || []);
      setTopProperties(res.topProperties || []);
      setMonthlyTrend(res.monthlyTrend || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHeatmap = async () => {
    try {
      const res: any = await api.get('/developer/heatmap');
      setHeatmapData(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const funnelOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [{
      name: '转化漏斗',
      type: 'funnel',
      left: '10%',
      width: '80%',
      label: { position: 'inside', formatter: '{b}\n{c}' },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      data: conversionFunnel.map((item: any, idx: number) => ({
        value: item.count,
        name: item.step,
        itemStyle: { color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'][idx] },
      })),
    }],
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增房源', '浏览量'] },
    xAxis: {
      type: 'category',
      data: monthlyTrend.map((d: any) => d.month?.slice(0, 7) || ''),
    },
    yAxis: [{ type: 'value', name: '房源数' }, { type: 'value', name: '浏览量' }],
    series: [
      { name: '新增房源', type: 'bar', data: monthlyTrend.map((d: any) => d.new_count || 0) },
      { name: '浏览量', type: 'line', yAxisIndex: 1, data: monthlyTrend.map((d: any) => d.view_count || 0), smooth: true },
    ],
  };

  const heatmapOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    xAxis: { type: 'category', data: heatmapData.map((d: any) => d.district || '') },
    yAxis: { type: 'category', data: ['浏览热度'] },
    visualMap: { min: 0, max: Math.max(...heatmapData.map((d: any) => d.view_count || 1)), orient: 'horizontal', left: 'center', bottom: 0 },
    series: [{
      name: '热度',
      type: 'heatmap',
      data: heatmapData.map((d: any, idx: number) => [idx, 0, d.view_count || 0]),
      label: { show: true, formatter: (params: any) => heatmapData[params.dataIndex]?.district || '' },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
  };

  const columns = [
    { title: '房源名称', dataIndex: 'title' },
    { title: '浏览量', dataIndex: 'view_count', sorter: (a: any, b: any) => a.view_count - b.view_count },
    { title: '收藏数', dataIndex: 'favorite_count' },
    {
      title: '转化率',
      dataIndex: 'conversion',
      render: (_: any, record: any) => {
        const rate = record.view_count > 0 ? ((record.favorite_count / record.view_count) * 100).toFixed(2) : '0';
        return <Tag color="green">{rate}%</Tag>;
      },
    },
  ];

  return (
    <div className="page-container">
      <Card title="开发商营销看板" style={{ borderRadius: 8, marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic title="总房源数" value={stats.totalProperties || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="在售房源" value={stats.activeProperties || 0} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="总浏览量" value={stats.totalViews || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="总收藏数" value={stats.totalFavorites || 0} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="转化漏斗" style={{ borderRadius: 8 }}>
            <ReactECharts option={funnelOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="客户来源热力图" style={{ borderRadius: 8 }}>
            <ReactECharts option={heatmapOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title="月度趋势" style={{ borderRadius: 8 }}>
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="区域分布" style={{ borderRadius: 8 }}>
            <List
              dataSource={districtStats}
              renderItem={(item: any) => (
                <List.Item>
                  <span>{item.district}</span>
                  <Tag color="blue">{item.count}套</Tag>
                  <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>{item.views}次浏览</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="TOP10 热门房源" style={{ borderRadius: 8 }}>
        <Table columns={columns} dataSource={topProperties} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
}
