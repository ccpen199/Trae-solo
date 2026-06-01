import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, message, Card, Descriptions, Modal } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import api from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;

const statusColors = {
  success: 'green',
  failed: 'red',
  pending: 'orange'
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/logs/calls');
      setLogs(response.data.logs);
    } catch (error) {
      message.error('获取日志列表失败');
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (record) => {
    try {
      const response = await api.get(`/logs/calls/${record.id}`);
      setSelectedLog(response.data.log);
      setDetailVisible(true);
    } catch (error) {
      message.error('获取日志详情失败');
    }
  };

  const columns = [
    {
      title: '日志ID',
      dataIndex: 'log_id',
      key: 'log_id',
      width: 180
    },
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 180,
      render: (id) => id || '-'
    },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      width: 120
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
      width: 150
    },
    {
      title: '环境',
      dataIndex: 'env_name',
      key: 'env_name',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => <Tag color={statusColors[status]}>{status}</Tag>
    },
    {
      title: '执行时间',
      dataIndex: 'execution_time',
      key: 'execution_time',
      width: 100,
      render: (time) => time ? `${time}ms` : '-'
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      ellipsis: true,
      render: (msg) => msg || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <EyeOutlined style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => viewDetail(record)} />
      )
    }
  ];

  return (
    <div>
      <Title level={3}>调用日志</Title>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      {selectedLog && (
        <Modal
          title="日志详情"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={800}
        >
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="日志ID">{selectedLog.log_id}</Descriptions.Item>
            <Descriptions.Item label="任务ID">{selectedLog.task_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="操作类型">{selectedLog.operation_type}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColors[selectedLog.status]}>{selectedLog.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="应用">{selectedLog.app_name}</Descriptions.Item>
            <Descriptions.Item label="环境">{selectedLog.env_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="执行时间">{selectedLog.execution_time ? `${selectedLog.execution_time}ms` : '-'}</Descriptions.Item>
            <Descriptions.Item label="操作人">{selectedLog.creator_name}</Descriptions.Item>
          </Descriptions>
          <Card title="请求数据" size="small" style={{ marginTop: 16 }}>
            <pre style={{ maxHeight: 200, overflow: 'auto', margin: 0 }}>
              {selectedLog.request_data}
            </pre>
          </Card>
          {selectedLog.response_data && (
            <Card title="响应数据" size="small" style={{ marginTop: 8 }}>
              <pre style={{ maxHeight: 200, overflow: 'auto', margin: 0 }}>
                {selectedLog.response_data}
              </pre>
            </Card>
          )}
          {selectedLog.error_message && (
            <Card title="错误信息" size="small" style={{ marginTop: 8 }}>
              <p style={{ color: 'red', margin: 0 }}>{selectedLog.error_message}</p>
            </Card>
          )}
        </Modal>
      )}
    </div>
  );
};

export default LogsPage;
