import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Table, Tag, Select, Button } from 'antd';
import { monitorAPI, adminAPI } from '../../services/api';

function Monitor() {
  const [metrics, setMetrics] = useState(null);
  const [detailedStats, setDetailedStats] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hours, setHours] = useState(24);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [page, hours]);

  const loadData = async () => {
    try {
      const [metricsRes, statsRes, logsRes] = await Promise.all([
        monitorAPI.getHealth(),
        monitorAPI.getDetailedStats({ hours }),
        monitorAPI.getLogs({ page, pageSize: 20, status: 'all' })
      ]);
      setMetrics(metricsRes.data);
      setDetailedStats(statsRes.data);
      setLogs(logsRes.data.list);
      setLogsTotal(logsRes.data.total);
    } catch (err) {
      console.error(err);
    }
  };

  const getHealthColor = (status) => {
    const map = { healthy: '#52c41a', degraded: '#faad14', unhealthy: '#ff4d4f' };
    return map[status] || '#999';
  };

  const statColumns = [
    { title: '接口', dataIndex: 'endpoint', key: 'endpoint' },
    { title: '请求数', dataIndex: 'total', key: 'total' },
    { title: '失败数', dataIndex: 'failed', key: 'failed' },
    {
      title: '成功率',
      key: 'success',
      render: (_, record) => (
        <Progress 
          percent={parseFloat(record.success_rate)} 
          size="small"
          status={record.success_rate >= 99 ? 'success' : record.success_rate >= 95 ? 'normal' : 'exception'}
        />
      )
    },
    { title: '平均耗时(ms)', dataIndex: 'avg_duration', key: 'duration' }
  ];

  const logColumns = [
    { title: '时间', dataIndex: 'created_at', key: 'time', width: 180 },
    { title: '方法', dataIndex: 'method', key: 'method', width: 80,
      render: m => <Tag color={m === 'GET' ? 'green' : m === 'POST' ? 'blue' : 'orange'}>{m}</Tag>
    },
    { title: '路径', dataIndex: 'path', key: 'path' },
    { title: '状态码', dataIndex: 'status_code', key: 'status',
      render: s => <Tag color={s < 400 ? 'green' : s < 500 ? 'orange' : 'red'}>{s}</Tag>
    },
    { title: '耗时(ms)', dataIndex: 'duration', key: 'duration' },
    { title: '错误信息', dataIndex: 'error_message', key: 'error',
      render: e => e ? <span style={{ color: '#ff4d4f' }}>{e}</span> : '-'
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>服务健康度监测</h2>

      <Card 
        title="总体健康状态" 
        extra={
          <Select value={hours} onChange={setHours} style={{ width: 120 }}>
            <Select.Option value={1}>最近1小时</Select.Option>
            <Select.Option value={6}>最近6小时</Select.Option>
            <Select.Option value={24}>最近24小时</Select.Option>
            <Select.Option value={72}>最近3天</Select.Option>
          </Select>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ 
                fontSize: 48, 
                fontWeight: 'bold', 
                color: getHealthColor(metrics?.status) 
              }}>
                {metrics?.status === 'healthy' ? '健康' : metrics?.status === 'degraded' ? '降级' : '异常'}
              </div>
              <div style={{ color: '#666' }}>系统状态</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ padding: 16 }}>
              <p style={{ marginBottom: 4 }}>API 服务</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ 
                  width: 12, height: 12, borderRadius: '50%', 
                  background: getHealthColor(metrics?.checks?.api?.status),
                  marginRight: 8
                }} />
                <span>成功率 {metrics?.checks?.api?.successRate}%</span>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ padding: 16 }}>
              <p style={{ marginBottom: 4 }}>数据库</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ 
                  width: 12, height: 12, borderRadius: '50%', 
                  background: getHealthColor(metrics?.checks?.database?.status),
                  marginRight: 8
                }} />
                <span>{metrics?.checks?.database?.status}</span>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ padding: 16 }}>
              <p style={{ marginBottom: 4 }}>性能</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ 
                  width: 12, height: 12, borderRadius: '50%', 
                  background: getHealthColor(metrics?.checks?.performance?.status),
                  marginRight: 8
                }} />
                <span>平均 {metrics?.checks?.performance?.avgDuration}ms</span>
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <div style={{ textAlign: 'center', padding: 16, background: '#e6f7ff', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
                {metrics?.metrics?.requests_per_minute || 0}
              </div>
              <div style={{ color: '#666' }}>请求/分钟</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center', padding: 16, background: '#f6ffed', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                {metrics?.metrics?.requests_per_hour || 0}
              </div>
              <div style={{ color: '#666' }}>请求/小时</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center', padding: 16, background: '#fff0f6', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#eb2f96' }}>
                {metrics?.metrics?.requests_per_day || 0}
              </div>
              <div style={{ color: '#666' }}>请求/天</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center', padding: 16, background: '#fff7e6', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fa8c16' }}>
                {metrics?.metrics?.active_services || 0}
              </div>
              <div style={{ color: '#666' }}>活跃服务</div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="接口统计详情" style={{ marginBottom: 16 }}>
        <Table
          columns={statColumns}
          dataSource={detailedStats}
          rowKey="endpoint"
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="错误聚类分析">
        {metrics?.metrics?.error_clusters?.length > 0 ? (
          <Row gutter={[16, 16]}>
            {metrics.metrics.error_clusters.slice(0, 6).map((err, idx) => (
              <Col span={8} key={idx}>
                <Card size="small" style={{ background: '#fff1f0' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                    {err.count}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {err.reason}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: '#52c41a' }}>
            ✅ 暂无错误记录
          </div>
        )}
      </Card>

      <Card title="请求日志" style={{ marginTop: 16 }}>
        <Table
          columns={logColumns}
          dataSource={logs}
          rowKey="id"
          pagination={{
            total: logsTotal,
            current: page,
            onChange: setPage,
            pageSize: 20
          }}
          size="small"
        />
      </Card>
    </div>
  );
}

export default Monitor;
