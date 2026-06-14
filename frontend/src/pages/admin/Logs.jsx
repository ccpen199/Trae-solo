import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Space, Tag, DatePicker, message, Spin } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { getOperationLogs, getAdmins } from '../../api/admin';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Logs = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    loadData();
    loadAdmins();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async (overrides = {}) => {
    const nextPagination = overrides.pagination || pagination;
    const nextSearchText = overrides.searchText ?? searchText;
    const nextAdminFilter = overrides.adminFilter ?? adminFilter;
    const nextTypeFilter = overrides.typeFilter ?? typeFilter;
    const nextDateRange = overrides.dateRange ?? dateRange;
    try {
      setLoading(true);
      const params = {
        page: nextPagination.current,
        page_size: nextPagination.pageSize,
        keyword: nextSearchText,
        admin_id: nextAdminFilter,
        action_type: nextTypeFilter
      };
      if (nextDateRange && nextDateRange.length === 2) {
        params.start_date = nextDateRange[0].format('YYYY-MM-DD');
        params.end_date = nextDateRange[1].format('YYYY-MM-DD');
      }
      const res = await getOperationLogs(params);
      setData(res?.list || []);
      setPagination(prev => ({ ...prev, total: res?.total || 0 }));
    } catch (err) {
      console.error(err);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const res = await getAdmins();
      setAdmins(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    const nextPagination = { ...pagination, current: 1 };
    setPagination(nextPagination);
    loadData({ pagination: nextPagination });
  };

  const handleReset = () => {
    const nextPagination = { ...pagination, current: 1 };
    setSearchText('');
    setAdminFilter('');
    setTypeFilter('');
    setDateRange(null);
    setPagination(nextPagination);
    loadData({
      pagination: nextPagination,
      searchText: '',
      adminFilter: '',
      typeFilter: '',
      dateRange: null
    });
  };

  const getTypeTag = (type) => {
    const typeMap = {
      login: { color: 'blue', text: '登录' },
      logout: { color: 'default', text: '登出' },
      create: { color: 'green', text: '新增' },
      update: { color: 'orange', text: '编辑' },
      delete: { color: 'red', text: '删除' },
      review: { color: 'purple', text: '审核' },
      export: { color: 'cyan', text: '导出' },
      other: { color: 'default', text: '其他' }
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getModuleTag = (module) => {
    const moduleMap = {
      user: { color: 'blue', text: '用户管理' },
      card: { color: 'purple', text: '卡片管理' },
      transaction: { color: 'green', text: '交易管理' },
      risk: { color: 'orange', text: '风险控制' },
      renewal: { color: 'cyan', text: '年审管理' },
      route: { color: 'geekblue', text: '线路管理' },
      product: { color: 'gold', text: '商品管理' },
      system: { color: 'default', text: '系统管理' }
    };
    const config = moduleMap[module] || { color: 'default', text: module };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '日志ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '操作人',
      dataIndex: 'admin_name',
      key: 'admin_name',
      width: 120,
      render: (name, record) => (
        <Space>
          <span style={{ 
            width: 28, 
            height: 28, 
            borderRadius: '50%', 
            background: '#722ed1', 
            color: '#fff', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: 12
          }}>
            <UserOutlined />
          </span>
          {name}
        </Space>
      )
    },
    {
      title: '操作模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (module) => getModuleTag(module)
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 100,
      render: (type) => getTypeTag(type)
    },
    {
      title: '操作内容',
      dataIndex: 'action',
      key: 'action',
      ellipsis: true
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160
    }
  ];

  return (
    <div className="admin-logs">
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索操作内容/IP地址"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="操作人"
            value={adminFilter || undefined}
            onChange={(value) => setAdminFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            {admins.map(admin => (
              <Option key={admin.id} value={admin.id}>{admin.real_name || admin.username}</Option>
            ))}
          </Select>
          <Select
            placeholder="操作类型"
            value={typeFilter || undefined}
            onChange={(value) => setTypeFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="login">登录</Option>
            <Option value="logout">登出</Option>
            <Option value="create">新增</Option>
            <Option value="update">编辑</Option>
            <Option value="delete">删除</Option>
            <Option value="review">审核</Option>
            <Option value="export">导出</Option>
            <Option value="other">其他</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: 260 }}
          />
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
            }}
            scroll={{ x: 1000 }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default Logs;
