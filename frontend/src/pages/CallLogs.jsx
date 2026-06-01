import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Card, message, Tag } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { logAPI } from '../utils/api';

const { Option } = Select;

function CallLogs() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    endpoint: '',
    method: '',
    response_code: '',
  });

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      const response = await logAPI.getCallLogs(params);
      setData(response.data.list || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error(error.response?.data?.error || '加载数据失败');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (code) => {
    if (code >= 200 && code < 300) return 'success';
    if (code >= 400 && code < 500) return 'warning';
    if (code >= 500) return 'error';
    return 'default';
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '环境',
      dataIndex: 'env_name',
      key: 'env_name',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: '端点',
      dataIndex: 'endpoint',
      key: 'endpoint',
    },
    {
      title: '状态码',
      dataIndex: 'response_code',
      key: 'response_code',
      width: 100,
      render: (code) => <Tag color={getStatusColor(code)}>{code}</Tag>,
    },
    {
      title: '耗时(ms)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      sorter: (a, b) => a.duration - b.duration,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">调用日志</h1>
        <p style={{ color: '#666' }}>查看SDK API调用记录和监控数据</p>
      </div>

      <Card>
        <div className="filter-bar">
          <Input
            placeholder="搜索端点"
            prefix={<SearchOutlined />}
            value={filters.endpoint}
            onChange={(e) => setFilters({ ...filters, endpoint: e.target.value })}
            style={{ width: 200 }}
          />
          <Select
            placeholder="请求方法"
            value={filters.method}
            onChange={(v) => setFilters({ ...filters, method: v })}
            allowClear
            style={{ width: 120 }}
          >
            <Option value="GET">GET</Option>
            <Option value="POST">POST</Option>
            <Option value="PUT">PUT</Option>
            <Option value="DELETE">DELETE</Option>
          </Select>
          <Select
            placeholder="状态码"
            value={filters.response_code}
            onChange={(v) => setFilters({ ...filters, response_code: v })}
            allowClear
            style={{ width: 120 }}
          >
            <Option value="200">200 成功</Option>
            <Option value="500">500 错误</Option>
          </Select>
          <Button icon={<SearchOutlined />} onClick={loadData}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ endpoint: '', method: '', response_code: '' }); setPage(1); loadData(); }}>
            重置
          </Button>
        </div>

        <Table
          loading={{
            spinning: loading,
            tip: '加载中...',
          }}
          columns={columns}
          dataSource={data}
          rowKey="id"
          locale={{
            emptyText: loading ? '加载中...' : '暂无数据',
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>
    </div>
  );
}

export default CallLogs;
