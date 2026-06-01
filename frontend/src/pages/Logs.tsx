import React, { useEffect, useState } from 'react';
import { Table, Card, Tag } from 'antd';
import { statsApi } from '../api';
import dayjs from 'dayjs';

const ACTION_COLORS: Record<string, string> = {
  '创建线索': 'blue',
  '研判线索': 'orange',
  '派发线索': 'purple',
  '反馈线索': 'green',
  '退回线索': 'red',
  '登录': 'default',
  'default': 'default'
};

const Logs: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  useEffect(() => {
    loadData(pagination.current);
  }, []);

  const loadData = async (page: number) => {
    setLoading(true);
    try {
      const response = await statsApi.getLogs({ page, pageSize: pagination.pageSize });
      setData(response.data.logs);
      setPagination({
        ...pagination,
        current: page,
        total: response.data.total
      });
    } catch (error) {
      console.error('加载日志失败', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作人',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 100
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => (
        <Tag color={ACTION_COLORS[action] || ACTION_COLORS['default']}>
          {action}
        </Tag>
      )
    },
    {
      title: '类型',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 100
    },
    {
      title: '目标ID',
      dataIndex: 'target_id',
      key: 'target_id',
      width: 100
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>操作日志</h2>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: loadData,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </div>
    </div>
  );
};

export default Logs;
