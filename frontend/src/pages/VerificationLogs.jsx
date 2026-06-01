import React, { useEffect, useState } from 'react';
import { Table, Card, Select, Input, Space, Tag, App, Row, Col, Statistic } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { verificationAPI } from '../services/api.js';

const { Option } = Select;

export default function VerificationLogs() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    result: '',
    caller: '',
    certificate_number: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsResult, statsResult] = await Promise.all([
        verificationAPI.getLogs(filters),
        verificationAPI.getStats(),
      ]);
      
      if (logsResult.success) setLogs(logsResult.data);
      if (statsResult.success) setStats(statsResult.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const resultColors = {
    valid: 'green',
    revoked: 'red',
    expired: 'orange',
    not_found: 'default',
    invalid: 'gray',
  };

  const resultLabels = {
    valid: '有效',
    revoked: '已吊销',
    expired: '已过期',
    not_found: '不存在',
    invalid: '异常',
  };

  const columns = [
    { title: '证照编号', dataIndex: 'certificate_number', key: 'certificate_number', width: 150 },
    { title: '持证人', dataIndex: 'applicant_name', key: 'applicant_name', width: 100 },
    { title: '调用方', dataIndex: 'caller', key: 'caller', width: 100 },
    { title: '用途', dataIndex: 'purpose', key: 'purpose', ellipsis: true },
    {
      title: '核验结果',
      dataIndex: 'verification_result',
      key: 'verification_result',
      width: 100,
      render: (result) => (
        <Tag color={resultColors[result] || 'default'}>
          {resultLabels[result] || result}
        </Tag>
      ),
    },
    { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address', width: 120 },
    {
      title: '核验时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>核验日志</h2>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="今日核验" value={stats.today_count} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="累计核验" value={stats.total_count} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="核验通过率" value={stats.valid_rate} suffix="%" />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="核验结果"
            style={{ width: 120 }}
            allowClear
            value={filters.result || undefined}
            onChange={(v) => setFilters({ ...filters, result: v || '' })}
          >
            <Option value="valid">有效</Option>
            <Option value="revoked">已吊销</Option>
            <Option value="expired">已过期</Option>
            <Option value="not_found">不存在</Option>
          </Select>
          <Input
            placeholder="调用方"
            style={{ width: 150 }}
            prefix={<SearchOutlined />}
            value={filters.caller}
            onChange={(e) => setFilters({ ...filters, caller: e.target.value })}
          />
          <Input
            placeholder="证照编号"
            style={{ width: 180 }}
            prefix={<SearchOutlined />}
            value={filters.certificate_number}
            onChange={(e) => setFilters({ ...filters, certificate_number: e.target.value })}
          />
        </Space>

        <Table
          loading={loading}
          columns={columns}
          dataSource={logs}
          rowKey="id"
          size="small"
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
}
