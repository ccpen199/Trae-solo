import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Select, Space } from 'antd';
import { operationLogs } from '../api.js';

const Logs = ({ currentUser }) => {
  const [logs, setLogs] = useState([]);
  const [targetType, setTargetType] = useState('');

  useEffect(() => {
    loadData();
  }, [targetType]);

  const loadData = async () => {
    try {
      const params = targetType ? { target_type: targetType } : {};
      const data = await operationLogs.getAll(params);
      setLogs(data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100
    },
    {
      title: '目标类型',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 120,
      render: (t) => t && <Tag color="blue">{t}</Tag>
    },
    {
      title: '目标ID',
      dataIndex: 'target_id',
      key: 'target_id',
      width: 80
    },
    {
      title: '用户',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      render: (d) => {
        try {
          const parsed = JSON.parse(d);
          return Object.entries(parsed).map(([k, v]) => (
            <span key={k} style={{ marginRight: 12 }}>
              {k}: {String(v)}
            </span>
          ));
        } catch {
          return d;
        }
      }
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    }
  ];

  const targetTypes = ['competitor', 'crawl_task', 'price_history', 'config_rule', 'review', 'report'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <h2>操作日志</h2>
        <Space>
          <span>筛选类型:</span>
          <Select
            style={{ width: 150 }}
            value={targetType}
            onChange={setTargetType}
            allowClear
            placeholder="全部类型"
          >
            {targetTypes.map(t => (
              <Select.Option key={t} value={t}>{t}</Select.Option>
            ))}
          </Select>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
};

export default Logs;
