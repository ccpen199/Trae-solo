import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, message } from 'antd';
import { SmileOutlined, BarChartOutlined } from '@ant-design/icons';
import { adminAPI } from '../../utils/api';

const { Title } = Typography;

const BAR_COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96', '#f5222d', '#2f54eb'];

function AdminNPS() {
  const [surveys, setSurveys] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNPS();
  }, []);

  const loadNPS = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getNPSDetail();
      if (res.data.success) {
        setSurveys(res.data.surveys || []);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const attributionStats = useMemo(() => {
    const countMap = {};
    surveys.forEach((s) => {
      if (s.attribution) {
        countMap[s.attribution] = (countMap[s.attribution] || 0) + 1;
      }
    });
    const total = surveys.filter((s) => s.attribution).length || 1;
    return Object.entries(countMap)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [surveys]);

  const columns = [
    {
      title: '咨询标题',
      dataIndex: 'consultation_title',
      key: 'consultation_title',
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <span style={{ color: score >= 9 ? '#52c41a' : score <= 6 ? '#f5222d' : '#fa8c16', fontWeight: 'bold' }}>
          {score}
        </span>
      ),
    },
    {
      title: '反馈',
      dataIndex: 'feedback',
      key: 'feedback',
      render: (text) => text || '-',
    },
    {
      title: '归因',
      dataIndex: 'attribution',
      key: 'attribution',
      render: (text) => text || '-',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>NPS 归因分析</Title>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="NPS 净推荐值"
              value={stats.nps_score || 0}
              suffix="分"
              prefix={<SmileOutlined />}
              valueStyle={{ color: (stats.nps_score || 0) >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均分"
              value={stats.avg_score || 0}
              precision={1}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="评价数"
              value={stats.total || 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="评价详情" style={{ marginTop: 24 }}>
        <Table dataSource={surveys} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Card
        title={<span><BarChartOutlined style={{ marginRight: 8 }} />归因分析</span>}
        style={{ marginTop: 24 }}
      >
        {attributionStats.length === 0 ? (
          <span style={{ color: '#999' }}>暂无归因数据</span>
        ) : (
          attributionStats.map((item, idx) => (
            <div key={item.name} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 120, textAlign: 'right', paddingRight: 16, flexShrink: 0 }}>
                {item.name}
              </div>
              <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 4, height: 24, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${item.percent}%`,
                    height: '100%',
                    background: BAR_COLORS[idx % BAR_COLORS.length],
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 8,
                    color: '#fff',
                    fontSize: 12,
                    minWidth: item.percent > 0 ? 32 : 0,
                  }}
                >
                  {item.percent > 8 ? `${item.percent}%` : ''}
                </div>
              </div>
              <div style={{ width: 60, paddingLeft: 8, color: '#666', fontSize: 12, flexShrink: 0 }}>
                {item.percent <= 8 ? `${item.percent}%` : ''} ({item.count})
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

export default AdminNPS;
