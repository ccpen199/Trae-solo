import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, message, Space, Table, Progress, Alert } from 'antd';
import { WarningOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminAPI } from '../../api';
import dayjs from 'dayjs';

const SlaMonitor = () => {
  const [slaData, setSlaData] = useState(null);
  const [breachedOrders, setBreachedOrders] = useState([]);
  const [atRiskOrders, setAtRiskOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slaRes, breachedRes, riskRes] = await Promise.all([
        adminAPI.getSlaStatistics(),
        adminAPI.getBreachedOrders(),
        adminAPI.getAtRiskOrders(),
      ]);
      setSlaData(slaRes.data);
      setBreachedOrders(breachedRes.data || []);
      setAtRiskOrders(riskRes.data || []);
    } catch (err) {
      message.error('加载SLA数据失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '工单号',
      dataIndex: 'order_no',
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '用户',
      dataIndex: 'user_name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v) => {
        const map = { install: '报装', repair: '报修', maintain: '维护', inspection: '安检' };
        return <Tag color="blue">{map[v] || v}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      render: (v) => {
        const map = { low: '低', medium: '中', high: '高', urgent: '紧急' };
        const colors = { low: 'green', medium: 'orange', high: 'red', urgent: 'red' };
        return <Tag color={colors[v]}>{map[v] || v}</Tag>;
      },
    },
    {
      title: 'SLA截止时间',
      dataIndex: 'sla_deadline',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '超时时长',
      dataIndex: 'breach_duration',
      render: (v, record) => {
        if (record.breach_duration) {
          return <span style={{ color: '#f5222d' }}>{record.breach_duration}</span>;
        }
        const remaining = dayjs(record.sla_deadline).diff(dayjs(), 'minute');
        return <span style={{ color: '#faad14' }}>剩余 {Math.max(0, Math.floor(remaining / 60))}小时{Math.max(0, remaining % 60)}分钟</span>;
      },
    },
    {
      title: '处理人',
      dataIndex: 'assignee_name',
      render: (v) => v || <Tag color="default">未分配</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small">
            催单
          </Button>
          <Button type="link" size="small">
            详情
          </Button>
        </Space>
      ),
    },
  ];

  if (!slaData) return null;

  const statCards = [
    {
      title: '24小时内完成率',
      value: `${slaData.within_24h || 0}%`,
      icon: <CheckCircleOutlined />,
      color: slaData.within_24h >= 90 ? '#52c41a' : slaData.within_24h >= 70 ? '#faad14' : '#f5222d',
      progress: slaData.within_24h || 0,
    },
    {
      title: '48小时内完成率',
      value: `${slaData.within_48h || 0}%`,
      icon: <CheckCircleOutlined />,
      color: slaData.within_48h >= 95 ? '#52c41a' : slaData.within_48h >= 80 ? '#faad14' : '#f5222d',
      progress: slaData.within_48h || 0,
    },
    {
      title: '超时工单',
      value: slaData.breached || 0,
      suffix: '单',
      icon: <ExclamationCircleOutlined />,
      color: slaData.breached > 0 ? '#f5222d' : '#52c41a',
    },
    {
      title: '平均处理时长',
      value: slaData.avg_duration || 0,
      suffix: '小时',
      icon: <ClockCircleOutlined />,
      color: slaData.avg_duration <= 12 ? '#52c41a' : slaData.avg_duration <= 24 ? '#faad14' : '#f5222d',
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>SLA时效监控</h2>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              实时监控工单处理时效，保障服务质量
            </p>
          </div>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新数据
          </Button>
        </div>
      </Card>

      {breachedOrders.length > 0 && (
        <Alert
          message={`检测到 ${breachedOrders.length} 单已超时，请及时处理`}
          type="error"
          showIcon
          icon={<WarningOutlined />}
          action={
            <Button size="small" type="primary" danger onClick={() => document.getElementById('breached-section')?.scrollIntoView({ behavior: 'smooth' })}>
              立即处理
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {atRiskOrders.length > 0 && (
        <Alert
          message={`${atRiskOrders.length} 单即将超时（2小时内）`}
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statCards.map((stat, idx) => (
          <Col span={6} key={idx}>
            <Card className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#666' }}>{stat.title}</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 32, color: stat.color, fontWeight: 'bold' }}>
                    {stat.value}{stat.suffix}
                  </p>
                </div>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: stat.color,
                }}>
                  {stat.icon}
                </div>
              </div>
              {stat.progress !== undefined && (
                <Progress
                  percent={stat.progress}
                  strokeColor={stat.color}
                  showInfo={false}
                  style={{ marginTop: 12 }}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="工单类型SLA达标率" bordered={false} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {slaData.by_type?.map((item, idx) => (
            <Col span={6} key={idx}>
              <Card size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span>{item.type_name}</span>
                  <Tag color={item.rate >= 90 ? 'success' : item.rate >= 70 ? 'warning' : 'error'}>
                    {item.rate}%
                  </Tag>
                </div>
                <Progress
                  percent={item.rate}
                  strokeColor={item.rate >= 90 ? '#52c41a' : item.rate >= 70 ? '#faad14' : '#f5222d'}
                  showInfo={false}
                />
                <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: 12 }}>
                  共 {item.total} 单，达标 {item.fulfilled} 单
                </p>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        id="breached-section"
        title={<Space><ExclamationCircleOutlined style={{ color: '#f5222d' }} /> 已超时工单</Space>}
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={columns}
          dataSource={breachedOrders}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Card
        title={<Space><ClockCircleOutlined style={{ color: '#faad14' }} /> 即将超时工单</Space>}
        bordered={false}
      >
        <Table
          columns={columns}
          dataSource={atRiskOrders}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
};

export default SlaMonitor;
