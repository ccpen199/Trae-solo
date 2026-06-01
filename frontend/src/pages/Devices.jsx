import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Switch,
  message,
  Popconfirm
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { devicesApi } from '../services/api';

const { Option } = Select;

const deviceTypeMap = {
  ios: { color: 'blue', label: 'iOS' },
  android: { color: 'green', label: 'Android' },
  web: { color: 'orange', label: 'Web' }
};

const Devices = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ keyword: '', device_type: '', push_status: '' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await devicesApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      });
      setData(result.data.list || []);
      setPagination(prev => ({
        ...prev,
        total: result.data.total || 0
      }));
    } catch (error) {
      console.error('获取设备列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({ keyword: '', device_type: '', push_status: '' });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await devicesApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await devicesApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await devicesApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  const columns = [
    {
      title: '设备ID',
      dataIndex: 'device_id',
      key: 'device_id',
      width: 150
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
      width: 100,
      render: (type) => {
        const config = deviceTypeMap[type] || { color: 'default', label: type };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: '系统版本',
      dataIndex: 'os_version',
      key: 'os_version',
      width: 100
    },
    {
      title: '应用版本',
      dataIndex: 'app_version',
      key: 'app_version',
      width: 100
    },
    {
      title: '推送状态',
      dataIndex: 'push_status',
      key: 'push_status',
      width: 100,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '有效' : '无效'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该设备吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索设备ID/用户名"
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="设备类型"
            value={filters.device_type || undefined}
            onChange={(value) => setFilters(prev => ({ ...prev, device_type: value || '' }))}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="ios">iOS</Option>
            <Option value="android">Android</Option>
            <Option value="web">Web</Option>
          </Select>
          <Select
            placeholder="推送状态"
            value={filters.push_status !== '' ? String(filters.push_status) : undefined}
            onChange={(value) => setFilters(prev => ({ ...prev, push_status: value === undefined ? '' : value }))}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="1">有效</Option>
            <Option value="0">无效</Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加设备
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`
        }}
        onChange={(page) => setPagination({ current: page.current, pageSize: page.pageSize, total: page.total })}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingItem ? '编辑设备' : '添加设备'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="device_id"
            label="设备ID"
            rules={[{ required: true, message: '请输入设备ID' }]}
          >
            <Input placeholder="请输入设备ID" disabled={!!editingItem} />
          </Form.Item>
          <Form.Item name="username" label="用户名">
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="token" label="推送Token">
            <Input placeholder="请输入推送Token" />
          </Form.Item>
          <Form.Item
            name="device_type"
            label="设备类型"
            rules={[{ required: true, message: '请选择设备类型' }]}
          >
            <Select placeholder="请选择设备类型">
              <Option value="ios">iOS</Option>
              <Option value="android">Android</Option>
              <Option value="web">Web</Option>
            </Select>
          </Form.Item>
          <Form.Item name="os_version" label="系统版本">
            <Input placeholder="请输入系统版本" />
          </Form.Item>
          <Form.Item name="app_version" label="应用版本">
            <Input placeholder="请输入应用版本" />
          </Form.Item>
          <Form.Item name="is_logged_in" label="是否登录" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="has_notification_permission" label="通知权限" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item name="app_entry_enabled" label="应用入口启用" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item name="version_supported" label="版本支持" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Devices;
