import React, { useEffect, useState } from 'react';
import { Typography, Spin, Row, Col, Card, Tag, message, Table } from 'antd';
import { HeatMapOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;

const colorForValue = (v) => {
  if (v >= 80) return { bg: '#1B5E20', fg: '#fff' };
  if (v >= 60) return { bg: '#388E3C', fg: '#fff' };
  if (v >= 40) return { bg: '#66BB6A', fg: '#fff' };
  if (v >= 20) return { bg: '#A5D6A7', fg: '#1a1a1a' };
  return { bg: '#C8E6C9', fg: '#1a1a1a' };
};

const towns = ['清徐镇', '徐沟镇', '孟封镇', '柳杜乡', '王答乡', '马峪乡'];

export default function FinanceHeatmap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/finance-heatmap').then(r => setData(r.data || [])).catch(e => message.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  const heatmapData = towns.map(town => {
    const villages = data.filter(d => d.town === town);
    return { town, villages };
  });

  const columns = [
    { title: '村', dataIndex: 'village', width: 100 },
    { title: '镇', dataIndex: 'town', width: 100 },
    { title: '建档户数', dataIndex: 'profile_count', width: 100 },
    { title: '农户数', dataIndex: 'farmer_count', width: 90 },
    { title: '平均信用分', dataIndex: 'avg_score', width: 110, render: v => {
      const c = v >= 700 ? 'green' : v >= 600 ? 'blue' : 'orange';
      return <Tag color={c}>{v}</Tag>;
    } },
    { title: '贷款笔数', dataIndex: 'loan_count', width: 90 },
    { title: '贷款总额(万)', dataIndex: 'loan_amount', width: 120, render: v => Math.round(v / 10000) },
    { title: '普惠可得性', dataIndex: 'accessibility', width: 120, render: v => {
      const c = colorForValue(v);
      return <div style={{ background: c.bg, color: c.fg, padding: '4px 8px', borderRadius: 4, textAlign: 'center', fontWeight: 600 }}>{v}</div>;
    } },
  ];

  return (
    <div>
      <Title level={4}>普惠金融可得性热力图</Title>
      <div style={{ padding: 12, background: '#f6ffed', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#389e0d' }}>
        <HeatMapOutlined /> 按行政村维度展示普惠金融可得性指数，综合考虑建档户数、信用评分、贷款获得率等因素，颜色越深代表可得性越高
      </div>

      <Card title="村级可得性热力图" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[8, 8]} align="middle" style={{ marginBottom: 12 }}>
          <Col flex="none" style={{ width: 80 }} />
          <Col flex="auto">
            <Row gutter={[4, 4]}>
              {[20, 40, 60, 80, 100].map(v => {
                const c = colorForValue(v);
                return <Col key={v} style={{ flex: 1 }}><div className="heatmap-cell" style={{ background: c.bg, color: c.fg, fontSize: 11, height: 30, minHeight: 30 }}>{v}</div></Col>;
              })}
            </Row>
          </Col>
        </Row>
        {heatmapData.map(({ town, villages }) => (
          <Row key={town} gutter={[8, 8]} align="top" style={{ marginBottom: 8 }}>
            <Col flex="none" style={{ width: 80, fontWeight: 600, paddingTop: 6 }}>{town}</Col>
            <Col flex="auto">
              <Row gutter={[4, 4]}>
                {villages.map(v => {
                  const c = colorForValue(v.accessibility);
                  return (
                    <Col key={v.village} xs={12} sm={8} md={6} lg={4}>
                      <div className="heatmap-cell" style={{ background: c.bg, color: c.fg, padding: '8px 4px' }}>
                        <div style={{ fontSize: 12 }}>{v.village}</div>
                        <div style={{ fontSize: 11, opacity: 0.9 }}>{v.accessibility} · {v.profile_count}户</div>
                      </div>
                    </Col>
                  );
                })}
                {villages.length === 0 && <Col><span style={{ color: '#999', fontSize: 12 }}>暂无数据</span></Col>}
              </Row>
            </Col>
          </Row>
        ))}
      </Card>

      <Card title="分村可得性明细" size="small">
        <Table rowKey="village" columns={columns} dataSource={data} scroll={{ x: 900 }} pagination={false} size="small" />
      </Card>
    </div>
  );
}
