import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Select, Row, Col, Descriptions } from 'antd';
import { EyeOutlined, ExportOutlined } from '@ant-design/icons';
import { logAPI, applicationAPI } from '../services/api';
import dayjs from 'dayjs';

const CallLogs = () => {
  const [data, setData] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
    loadApps();
  }, []);

  const loadData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await logAPI.callLogs({ ...filters, ...params });
      setData(res.data);
    } catch (err) {
      console.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadApps = async () => {
    try {
      const res = await applicationAPI.list();
      setApps(res.data);
    } catch (err) {
      console.error('加载应用失败');
    }
  };

  const handleView = async (record) => {
    const res = await logAPI.getCallLog(record.id);
    setViewingRecord(res.data);
    setDetailVisible(true);
  };

  const handleExport = () => {
    const csvContent = [
      ['日志ID', '应用', '操作类型', '状态', '处理数量', '耗时(ms)', '创建时间'].join(','),
      ...data.map(item => [
        item.log_id,
        item.app_name,
        item.operation_type,
        item.response_status >= 200 && item.response_status < 300 ? '成功' : '失败',
        item.processed_count,
        item.duration_ms,
        item.created_at
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `call_logs_${dayjs().format('YYYYMMDDHHmmss')}.csv`;
    link.click();
  };

  const columns = [
    {
      title: '日志ID',
      dataIndex: 'log_id',
      key: 'log_id',
      width: 130,
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
    },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'response_status',
      key: 'response_status',
      width: 100,
      render: (status) => (
        <span style={{ color: status >= 200 && status < 300 ? '#52c41a' : '#ff4d4f' }}>
          {status >= 200 && status < 300 ? '成功' : '失败'}
        </span>
      ),
    },
    {
      title: '处理数量',
      dataIndex: 'processed_count',
      key: 'processed_count',
      width: 100,
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 100,
      render: (ms) => `${ms || 0}ms`,
    },
    {
      title: '客户端IP',
      dataIndex: 'client_ip',
      key: 'client_ip',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">调用日志</h2>
        <Space>
          <Button onClick={() => loadData()}>刷新</Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>

      <div className="filter-form">
        <Row gutter={16}>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择应用"
              allowClear
              onChange={(v) => setFilters({ ...filters, appId: v })}
            >
              {apps.map(app => (
                <Select.Option key={app.id} value={app.id}>{app.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="状态"
              allowClear
              onChange={(v) => setFilters({ ...filters, status: v })}
            >
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <Button type="primary" onClick={() => loadData()}>查询</Button>
            <Button style={{ marginLeft: 8 }} onClick={() => { setFilters({}); loadData(); }}>重置</Button>
          </Col>
        </Row>
      </div>

      <div className="card-content">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </div>

      <Modal
        title="调用日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {viewingRecord && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="日志ID">{viewingRecord.log_id}</Descriptions.Item>
              <Descriptions.Item label="应用">{viewingRecord.app_name}</Descriptions.Item>
              <Descriptions.Item label="操作类型">{viewingRecord.operation_type}</Descriptions.Item>
              <Descriptions.Item label="HTTP方法">{viewingRecord.request_method}</Descriptions.Item>
              <Descriptions.Item label="请求路径">{viewingRecord.request_path}</Descriptions.Item>
              <Descriptions.Item label="响应状态">{viewingRecord.response_status}</Descriptions.Item>
              <Descriptions.Item label="处理数量">{viewingRecord.processed_count}</Descriptions.Item>
              <Descriptions.Item label="耗时">{viewingRecord.duration_ms}ms</Descriptions.Item>
              <Descriptions.Item label="客户端IP">{viewingRecord.client_ip}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(viewingRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <h4>原始内容</h4>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 12 }}>
                    {viewingRecord.original_content}
                  </pre>
                </div>
              </Col>
              <Col span={12}>
                <h4>脱敏后内容</h4>
                <div style={{ padding: 12, background: '#f0f7ff', borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 12 }}>
                    {viewingRecord.masked_content}
                  </pre>
                </div>
              </Col>
            </Row>
            {viewingRecord.error_message && (
              <div style={{ marginTop: 16, padding: 12, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4 }}>
                <strong>错误信息:</strong> {viewingRecord.error_message}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CallLogs;
