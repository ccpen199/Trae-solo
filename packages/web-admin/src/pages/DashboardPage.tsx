import React, { useEffect, useState } from 'react';
import { Card, Tag, Select, DatePicker, Row, Col, Progress, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, AlertOutlined, SafetyOutlined, FileDoneOutlined, DollarOutlined, TeamOutlined, RiseOutlined, EyeOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import api from '@/api';

const { RangePicker } = DatePicker;

const DashboardPage: React.FC = () => {
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined);
  const [overview, setOverview] = useState<any>({
    totalOrders: 12847, processing: 892, slaWarning: 47, slaBreached: 13,
    pendingCourier: 124, pendingApproval: 356, pendingOcr: 89, slaRate: '99.87%',
  });
  const [alertStats, setAlertStats] = useState<any>({ total: 457, unhandled: 112, handleRate: '75.49%' });

  useEffect(() => {
    (async () => {
      try {
        const r: any = await api.get('/admin/stats/sla-overview', { params: cityFilter ? { city: cityFilter } : {} });
        setOverview({ ...overview, ...r.data });
      } catch {}
      try {
        const r: any = await api.get('/admin/alerts/stats');
        setAlertStats(r.data);
      } catch {}
    })();
  }, [cityFilter]);

  const gdCities = ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'];

  const orderLineOption: any = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['港澳签注', '赴台签注', '身份证补换领', '违章缴费', '六年免检'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD')) },
    yAxis: { type: 'value' },
    series: [
      { name: '港澳签注', type: 'line', smooth: true, areaStyle: { opacity: 0.2 }, data: [184, 220, 208, 256, 301, 289, 312] },
      { name: '赴台签注', type: 'line', smooth: true, data: [38, 45, 52, 48, 56, 61, 58] },
      { name: '身份证补换领', type: 'line', smooth: true, data: [89, 95, 102, 108, 115, 121, 128] },
      { name: '违章缴费', type: 'line', smooth: true, data: [420, 458, 512, 501, 568, 602, 645] },
      { name: '六年免检', type: 'line', smooth: true, data: [58, 65, 72, 68, 82, 91, 98] },
    ],
    color: ['#00B42A', '#165DFF', '#FF7D00', '#F53F3F', '#722ED1'],
  };

  const statusPieOption: any = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['45%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{b}: {d}%' },
      data: [
        { value: 124, name: '等待揽收', itemStyle: { color: '#FF7D00' } },
        { value: 186, name: '预审/识别中', itemStyle: { color: '#165DFF' } },
        { value: 356, name: '审批中', itemStyle: { color: '#722ED1' } },
        { value: 226, name: '制证/寄送', itemStyle: { color: '#00B42A' } },
      ],
    }],
  };

  const cityMapOption: any = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}单' },
    visualMap: { min: 0, max: 2000, left: 10, bottom: 10, text: ['高', '低'], calculable: true, inRange: { color: ['#E8FFEA', '#00B42A'] } },
    series: [{
      type: 'effectScatter', coordinateSystem: 'cartesian2d',
      data: gdCities.map((c, i) => [i, gdCities.length - i, 400 + Math.floor(Math.random() * 1600)]),
      symbolSize: (d: number[]) => Math.sqrt(d[2]) / 2,
      rippleEffect: { brushType: 'stroke' },
      label: { show: true, formatter: (p: any) => gdCities[p.data[0]], position: 'right', fontSize: 11 },
    }],
    xAxis: { show: false, max: gdCities.length },
    yAxis: { show: false, max: gdCities.length },
    grid: { left: 60, right: 120 },
  };

  const revenueBarOption: any = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: gdCities.map(c => c.slice(0, 2)) },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar', data: gdCities.map(() => 5 + Math.floor(Math.random() * 60)),
      itemStyle: { color: '#165DFF', borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top', formatter: '{c}万' },
    }],
  };

  return (
    <div>
      <Card style={{ borderRadius: 10, marginBottom: 16 }} size="small">
        <Row align="middle" justify="space-between">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Select allowClear style={{ width: 160 }} placeholder="按地市筛选（全省）" onChange={setCityFilter} options={gdCities.map(c => ({ value: c, label: c }))} />
            <RangePicker />
            <Button type="primary">查询</Button>
            <Button>导出报表</Button>
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>数据截至：{dayjs().format('YYYY-MM-DD HH:mm')}</div>
        </Row>
      </Card>

      <div className="stat-card-grid">
        <div className="stat-card">
          <div className="title"><span>📋 近30日订单总量</span><RiseOutlined style={{ color: '#00B42A' }} /></div>
          <div className="value">{overview.totalOrders?.toLocaleString()}</div>
          <div className="trend up"><ArrowUpOutlined /> 12.5% 环比增长</div>
        </div>
        <div className="stat-card">
          <div className="title"><span>⏳ 办理中</span><Tag color="processing">{overview.processing}</Tag></div>
          <div className="value">{overview.processing}</div>
          <div className="trend down">SLA达成率：<b style={{ color: '#00B42A' }}>{overview.slaRate}</b></div>
        </div>
        <div className="stat-card" style={{ background: overview.slaWarning > 30 ? 'linear-gradient(180deg, #FFF7E8 0%, #fff 60%)' : undefined }}>
          <div className="title"><span>⚠️ SLA预警中</span><Tag color="orange">{overview.slaWarning}</Tag></div>
          <div className="value" style={{ color: '#FF7D00' }}>{overview.slaWarning}</div>
          <div className="trend up"><AlertOutlined /> 超时风险：{overview.slaBreached}单</div>
        </div>
        <div className="stat-card">
          <div className="title"><span>💰 累计营收（万）</span><DollarOutlined style={{ color: '#F53F3F' }} /></div>
          <div className="value">¥ 487.6</div>
          <div className="trend up"><ArrowUpOutlined /> 18.2% 同比增长</div>
        </div>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">📈 业务办理趋势（近7天）</div>
              <div className="kpi-alert-row">
                <Tag color="blue">待揽收 {overview.pendingCourier}</Tag>
                <Tag color="purple">待审批 {overview.pendingApproval}</Tag>
                <Tag color="orange">OCR待处理 {overview.pendingOcr}</Tag>
              </div>
            </div>
            <ReactECharts option={orderLineOption} style={{ height: 280 }} />
          </div>
        </Col>
        <Col span={8}>
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-card-title">🧩 办理状态分布</div></div>
            <ReactECharts option={statusPieOption} style={{ height: 280 }} />
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-card-title">🗺️ 广东21地市业务热力</div>
              <Button size="small" icon={<EyeOutlined />}>查看详情</Button>
            </div>
            <ReactECharts option={cityMapOption} style={{ height: 320 }} />
          </div>
        </Col>
        <Col span={10}>
          <div className="chart-card" style={{ marginBottom: 16 }}>
            <div className="chart-card-header"><div className="chart-card-title">💰 各地市累计营收（万）</div></div>
            <ReactECharts option={revenueBarOption} style={{ height: 320 }} />
          </div>
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-card-title">🛡️ 平台安全指标</div></div>
            <div style={{ padding: '0 8px' }}>
              {[
                { t: '敏感字段加密覆盖率', v: 100, color: '#00B42A' },
                { t: '资金监管账户合规率', v: 100, color: '#00B42A' },
                { t: 'SLA预警处理率', v: parseFloat(alertStats.handleRate), color: parseFloat(alertStats.handleRate) > 80 ? '#00B42A' : '#FF7D00' },
                { t: 'API响应达标率(>95%)', v: 99.4, color: '#165DFF' },
              ].map((m, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{m.t}</span>
                    <span style={{ color: m.color, fontWeight: 600 }}>{m.v}%</span>
                  </div>
                  <Progress percent={m.v} showInfo={false} strokeColor={m.color} size="small" />
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};
export default DashboardPage;
