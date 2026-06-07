import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, message, Space } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../utils/api';

export default function RiskAlerts() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('open');

  useEffect(() => {
    loadAlerts();
  }, [status]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/risk-alerts', { params: { status } });
      setData(response.data);
    } catch (error) {
      message.error('加载风险预警失败');
    } finally {
      setLoading(false);
    }
  };

  const handleHandle = async (id) => {
    try {
      await api.post(`/admin/risk-alerts/${id}/handle`);
      message.success('已标记为处理');
      loadAlerts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getLevelTag = (level) => {
    const levelMap = {
      low: { color: 'green', text: '低' },
      warning: { color: 'orange', text: '中' },
      high: { color: 'red', text: '高' }
    };
    const info = levelMap[level] || { color: 'default', text: level };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getTypeText = (type) => {
    const typeMap = {
      frequent_withdrawal: '频繁提取',
      large_amount: '大额提取',
      abnormal_time: '异常时间',
      unusual_location: '异常地点'
    };
    return typeMap[type] || type;
  };

  const columns = [
    { title: '预警ID', dataIndex: 'id', key: 'id' },
    { title: '预警类型', dataIndex: 'type', key: 'type', render: (t) => getTypeText(t) },
    { title: '风险等级', dataIndex: 'level', key: 'level', render: (l) => getLevelTag(l) },
    { title: '关联用户', dataIndex: 'user_name', key: 'user_name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '预警时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleHandle(record.id)}
        >
          标记处理
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>风险预警</h2>
        <Space>
          <Button type={status === 'open' ? 'primary' : 'default'} onClick={() => setStatus('open')}>
            <ExclamationCircleOutlined /> 待处理
          </Button>
          <Button type={status === 'handled' ? 'primary' : 'default'} onClick={() => setStatus('handled')}>
            <CheckCircleOutlined /> 已处理
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: '暂无风险预警' }}
        />
      </Card>
    </div>
  );
}
