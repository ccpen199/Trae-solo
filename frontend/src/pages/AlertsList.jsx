import React, { useEffect, useState } from 'react';
import { Table, Tag, Card } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function AlertsList() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => setAlerts(data));
  }, []);

  const statusColors = {
    pending: 'orange',
    handled: 'green',
  };

  const statusText = {
    pending: '待处理',
    handled: '已处理',
  };

  const columns = [
    {
      title: '预警编号',
      dataIndex: 'alert_code',
      key: 'alert_code',
    },
    {
      title: '科室',
      dataIndex: 'department_name',
      key: 'department_name',
    },
    {
      title: '病原体',
      dataIndex: 'pathogen',
      key: 'pathogen',
      render: (text) => text || '多病原体聚类',
    },
    {
      title: '时间窗口',
      key: 'time_window',
      render: (_, record) => (
        <span>{record.time_window_start} ~ {record.time_window_end}</span>
      ),
    },
    {
      title: '病例数',
      dataIndex: 'case_count',
      key: 'case_count',
      render: (count) => <Tag color="red">{count} 例</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>{statusText[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>暴发预警管理</h2>

      <Card>
        <Table
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => navigate(`/alerts/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
}
