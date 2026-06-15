import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Tag } from 'antd';
import { CarOutlined, TeamOutlined, FireOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../../api';

const { Option } = Select;

function AdminCapacity() {
  const [city, setCity] = useState('北京市');
  const [serviceType, setServiceType] = useState('all');
  const [heatmapData, setHeatmapData] = useState<any>({ districts: [] });
  const [realTimeData, setRealTimeData] = useState<any>({});

  useEffect(() => {
    fetchHeatmap();
    fetchRealTime();
  }, [city, serviceType]);

  const fetchHeatmap = async () => {
    try {
      const data = await api.get('/admin/capacity/heatmap', {
        params: { city, service_type: serviceType },
      });
      setHeatmapData(data);
    } catch (error) {
      console.error('Failed to fetch heatmap:', error);
    }
  };

  const fetchRealTime = async () => {
    try {
      const data = await api.get('/admin/capacity/real-time');
      setRealTimeData(data);
    } catch (error) {
      console.error('Failed to fetch realtime data:', error);
    }
  };

  const heatmapOption = {
    title: {
      text: `${city}运力分布热力图`,
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>工人: ${params.data.workers}人<br/>司机: ${params.data.drivers}人<br/>负载率: ${params.data.load}%`;
      },
    },
    visualMap: {
      min: 0,
      max: 100,
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
      },
    },
    geo: {
      map: '北京',
      roam: true,
      label: {
        show: true,
        color: '#333',
      },
      itemStyle: {
        areaColor: '#f5f5f5',
        borderColor: '#d9d9d9',
      },
    },
    series: [
      {
        name: '运力分布',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: heatmapData.districts.map((d: any) => ({
          name: d.name,
          value: [d.lng, d.lat, d.load],
          workers: d.workers,
          drivers: d.drivers,
          load: d.load,
        })),
        symbolSize: (val: number[]) => val[2] / 3,
        itemStyle: {
          color: '#1890ff',
        },
      },
    ],
  };

  const barChartOption = {
    title: { text: '各区域运力对比', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['工人', '司机'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: heatmapData.districts.map((d: any) => d.name),
      axisLabel: { rotate: 45 },
    },
    yAxis: { type: 'value', name: '人数' },
    series: [
      {
        name: '工人',
        type: 'bar',
        data: heatmapData.districts.map((d: any) => d.workers),
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '司机',
        type: 'bar',
        data: heatmapData.districts.map((d: any) => d.drivers),
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  const loadChartOption = {
    title: { text: '运力负载率', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: heatmapData.districts.map((d: any) => d.name),
      axisLabel: { rotate: 45 },
    },
    yAxis: { type: 'value', name: '负载率(%)', max: 100 },
    series: [
      {
        name: '负载率',
        type: 'line',
        data: heatmapData.districts.map((d: any) => d.load),
        smooth: true,
        itemStyle: { color: '#fa8c16' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250, 140, 22, 0.5)' },
              { offset: 1, color: 'rgba(250, 140, 22, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: 16 }}>🚛 城市运力热力图</h2>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Select value={city} onChange={setCity} style={{ width: 150 }}>
            <Option value="北京市">北京市</Option>
            <Option value="上海市">上海市</Option>
            <Option value="广州市">广州市</Option>
            <Option value="深圳市">深圳市</Option>
          </Select>
          <Select value={serviceType} onChange={setServiceType} style={{ width: 150 }}>
            <Option value="all">全部服务</Option>
            <Option value="labor">用工服务</Option>
            <Option value="delivery">找车服务</Option>
            <Option value="moving">搬家服务</Option>
          </Select>
        </div>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="在线工人"
                value={realTimeData.active_workers || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix="人"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="在线司机"
                value={realTimeData.active_drivers || 0}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#52c41a' }}
                suffix="人"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待处理订单"
                value={(realTimeData.pending_labor_orders || 0) + (realTimeData.bidding_delivery_orders || 0) + (realTimeData.pending_moving_orders || 0)}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#fa8c16' }}
                suffix="单"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="运力告警"
                value={heatmapData.districts?.filter((d: any) => d.load > 80).length || 0}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#f5222d' }}
                suffix="个区域"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Card style={{ marginBottom: 16 }}>
              <ReactECharts option={barChartOption} style={{ height: 350 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Card>
              <ReactECharts option={loadChartOption} style={{ height: 350 }} />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title="区域运力详情" size="small">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {heatmapData.districts?.map((district: any, index: number) => (
            <Card key={index} size="small" style={{ background: district.load > 80 ? '#fff1f0' : district.load > 60 ? '#fff7e6' : '#f6ffed' }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>{district.name}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                <div>👷 工人: {district.workers}人</div>
                <div>🚚 司机: {district.drivers}人</div>
                <div>
                  负载率: 
                  <Tag color={district.load > 80 ? 'red' : district.load > 60 ? 'orange' : 'green'}>
                    {district.load}%
                  </Tag>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AdminCapacity;
