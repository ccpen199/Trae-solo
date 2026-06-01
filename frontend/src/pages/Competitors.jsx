import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { competitors, configRules } from '../api.js';

const Competitors = ({ currentUser }) => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadCategories();
  }, []);

  const loadData = async () => {
    try {
      const data = await competitors.getAll();
      setList(data);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const loadCategories = async () => {
    try {
      const rules = await configRules.getAll({ rule_type: 'category' });
      const cats = rules.map(r => r.rule_name);
      setCategories(cats);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
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
      await competitors.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await competitors.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await competitors.create({ ...values, created_by: currentUser?.username || 'system' });
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(editingItem ? '更新失败' : '创建失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag color="blue">{cat}</Tag>
    },
    {
      title: '官网',
      dataIndex: 'official_website',
      key: 'official_website',
      render: (url) => url ? <a href={url} target="_blank" rel="noopener noreferrer">查看</a> : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : status === 'inactive' ? 'orange' : 'default'}>
          {status === 'active' ? '活跃' : status === 'inactive' ? '停用' : '归档'}
        </Tag>
      )
    },
    {
      title: '创建人',
      dataIndex: 'created_by',
      key: 'created_by'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/competitors/${record.id}`)}>
            详情
          </Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>竞品清单</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加竞品
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? '编辑竞品' : '添加竞品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="请输入竞品名称" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select placeholder="请选择分类">
              {categories.map(cat => (
                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="official_website" label="官网地址">
            <Input placeholder="请输入官网地址" />
          </Form.Item>
          <Form.Item name="app_store_url" label="应用商店地址">
            <Input placeholder="请输入应用商店地址" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
              <Select.Option value="archived">归档</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Competitors;
