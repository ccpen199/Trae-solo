import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Form, 
  Input, 
  Select, 
  message, 
  Card,
  Tag,
  Space,
  DatePicker
} from 'antd';
import { 
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import * as api from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const OPERATION_TYPE_MAP = {
  create: { text: '新增', color: 'blue' },
  update: { text: '修改', color: 'orange' },
  delete: { text: '删除/注销', color: 'red' },
  move_in: { text: '迁入', color: 'green' },
  move_out: { text: '迁出', color: 'purple' },
  login: { text: '登录', color: 'cyan' },
  logout: { text: '退出', color: 'default' },
  query: { text: '查询', color: 'gray' }
};

const TARGET_TYPE_MAP = {
  user: '用户',
  household: '户籍'
};

const OperationLogs = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.getOperationLogs({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...params
      });
      if (response.success) {
        setData(response.data.logs);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('获取操作日志失败:', error);
      message.error('获取操作日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    const params = {};
    if (values.operationType) {
      params.operationType = values.operationType;
    }
    if (values.username) {
      params.username = values.username;
    }
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].startOf('day').toISOString();
      params.endDate = values.dateRange[1].endOf('day').toISOString();
    }
    
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData(params);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData();
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '操作用户',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 120,
      render: (val) => {
        const type = OPERATION_TYPE_MAP[val] || { text: val, color: 'default' };
        return <Tag color={type.color}>{type.text}</Tag>;
      }
    },
    {
      title: '操作对象',
      key: 'target',
      width: 150,
      render: (_, record) => {
        const type = TARGET_TYPE_MAP[record.targetType] || record.targetType || '-';
        const name = record.targetName || '-';
        return `${type}: ${name}`;
      }
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120
    }
  ];

  return (
    <div>
      <Card 
        title="操作日志" 
        extra={
          <Button 
            icon={<ReloadOutlined />}
            onClick={() => fetchData()}
          >
            刷新
          </Button>
        }
      >
        <Form
          form={searchForm}
          layout="inline"
          style={{ marginBottom: 24 }}
          onFinish={handleSearch}
        >
          <Form.Item name="operationType" label="操作类型">
            <Select placeholder="请选择操作类型" style={{ width: 150 }} allowClear>
              <Option value="create">新增</Option>
              <Option value="update">修改</Option>
              <Option value="delete">删除/注销</Option>
              <Option value="move_in">迁入</Option>
              <Option value="move_out">迁出</Option>
              <Option value="login">登录</Option>
              <Option value="logout">退出</Option>
              <Option value="query">查询</Option>
            </Select>
          </Form.Item>
          <Form.Item name="username" label="用户名">
            <Input placeholder="请输入用户名" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="dateRange" label="时间范围">
            <RangePicker style={{ width: 280 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </div>
  );
};

export default OperationLogs;
