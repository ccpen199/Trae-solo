import React, { useEffect, useState } from 'react';
import { Typography, Spin, Row, Col, Card, Table, Tag, message, Button, Space } from 'antd';
import { RiseOutlined, BarChartOutlined, CreditCardOutlined, TeamOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const { Title } = Typography;

export default function VitalityIndex() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/vitality-index').then(r => setData(r.data || [])).catch(e => message.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  const overallAvg = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.vitalityIndex, 0) / data.length) : 0;
  const avgActivity = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.merchantActivity, 0) / data.length) : 0;
  const avgPenetration = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.creditPenetration, 0) / data.length) : 0;
  const avgCoverage = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.paymentCoverage, 0) / data.length) : 0;

  const radarData = [
    { dimension: '商户活跃度', value: avgActivity },
    { dimension: '信贷渗透率', value: avgPenetration },
    { dimension: '缴费覆盖率', value: avgCoverage },
  ];

  const columns = [
    { title: '乡镇', dataIndex: 'town', width: 110, fixed: 'left' },
    { title: '商户活跃', dataIndex: 'merchantActivity', width: 100, render: (v, r) => <Tag color={v >= 80 ? 'green' : v >= 60 ? 'blue' : v >= 40 ? 'orange' : 'red'}>{v}</Tag> },
    { title: '信贷渗透', dataIndex: 'creditPenetration', width: 100, render: (v, r) => <Tag color={v >= 80 ? 'green' : v >= 60 ? 'blue' : v >= 40 ? 'orange' : 'red'}>{v}</Tag> },
    { title: '缴费覆盖', dataIndex: 'paymentCoverage', width: 100, render: (v, r) => <Tag color={v >= 80 ? 'green' : v >= 60 ? 'blue' : v >= 40 ? 'orange' : 'red'}>{v}</Tag> },
    { title: '活力指数', dataIndex: 'vitalityIndex', width: 100, render: (v, r) => <Tag color={v >= 80 ? 'green' : v >= 60 ? 'blue' : v >= 40 ? 'orange' : 'red'} style={{ fontWeight: 700 }}>{v}</Tag> },
    { title: '活跃商户', dataIndex: 'merchant_count', width: 90 },
    { title: '贷款笔数', dataIndex: 'loan_count', width: 90 },
    { title: '贷款金额(万)', dataIndex: 'loan_amount', width: 110, render: v => Math.round(v / 10000) },
    { title: '缴费笔数', dataIndex: 'pay_count', width: 90 },
    { title: '缴费金额(万)', dataIndex: 'pay_amount', width: 110, render: v => Math.round(v / 10000) },
    { title: '审计追溯', width: 150, render: (_, r) => (
      <Space>
        <Button size="small" type="link" onClick={() => navigate(`/business/merchants?town=${r.town}`)}>商户</Button>
        <Button size="small" type="link" onClick={() => navigate('/finance/loans')}>贷款</Button>
        <Button size="small" type="link" onClick={() => navigate('/payment/orders')}>缴费</Button>
      </Space>
    ) },
  ];

  const barData = data.map(d => ({
    town: d.town,
    商户活跃度: d.merchantActivity,
    信贷渗透率: d.creditPenetration,
    缴费覆盖率: d.paymentCoverage,
    活力指数: d.vitalityIndex,
  }));

  return (
    <div>
      <Title level={4}>县域经济活力指数</Title>
      <div style={{ padding: 12, background: '#f6ffed', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#389e0d' }}>
        <RiseOutlined /> 综合反映各乡镇商户活跃度、信贷渗透率、缴费覆盖率三项核心指标，为普惠金融资源精准投放提供数据支撑
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered style={{ borderLeft: '4px solid #1B5E20' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <BarChartOutlined style={{ fontSize: 32, color: '#1B5E20', marginRight: 12 }} />
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>综合活力指数</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1B5E20' }}>{overallAvg}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered style={{ borderLeft: '4px solid #388E3C' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TeamOutlined style={{ fontSize: 32, color: '#388E3C', marginRight: 12 }} />
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>商户活跃度</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#388E3C' }}>{avgActivity}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered style={{ borderLeft: '4px solid #66BB6A' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CreditCardOutlined style={{ fontSize: 32, color: '#66BB6A', marginRight: 12 }} />
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>信贷渗透率</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#66BB6A' }}>{avgPenetration}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered style={{ borderLeft: '4px solid #A5D6A7' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <BarChartOutlined style={{ fontSize: 32, color: '#A5D6A7', marginRight: 12 }} />
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>缴费覆盖率</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#A5D6A7' }}>{avgCoverage}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="分乡镇活力指数" size="small">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="town" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="商户活跃度" fill="#388E3C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="信贷渗透率" fill="#66BB6A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="缴费覆盖率" fill="#A5D6A7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="活力指数" fill="#1B5E20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="县域平均指标雷达图" size="small">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar dataKey="value" stroke="#1B5E20" fill="#1B5E20" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="分乡镇详细数据" size="small" style={{ marginTop: 16 }}>
        <Table rowKey="town" columns={columns} dataSource={data} scroll={{ x: 1100 }} pagination={false} size="small" />
      </Card>
    </div>
  );
}
