import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tree, Popconfirm, Card, Tag } from 'antd';
import { message } from '@/utils/message';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { moduleApi } from '@/services/api';

const { Option } = Select;

const Module: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, treeRes] = await Promise.all([
        moduleApi.getList(),
        moduleApi.getTree(false),
      ]);
      setList(Array.isArray(listRes) ? listRes : (listRes.data || []));
      setTreeData(Array.isArray(treeRes) ? treeRes : (treeRes.data || []));
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true, isVisible: true });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await moduleApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await moduleApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await moduleApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const buildSelectTree = (data: any[], level = 0): any[] => {
    let result: any[] = [{ value: null, label: '无(一级菜单)' }];
    data.forEach((item) => {
      const prefix = level > 0 ? '　'.repeat(level) + '├─ ' : '';
      result.push({ value: item.id, label: `${prefix}${item.name}` });
      if (item.children?.length > 0) {
        result = result.concat(buildSelectTree(item.children, level + 1));
      }
    });
    return result;
  };

  const buildTreeData = (data: any[]): any[] => {
    return data.map((item) => ({
      key: item.id,
      title: `${item.name} (${item.code})`,
      children: item.children?.length > 0 ? buildTreeData(item.children) : undefined,
    }));
  };

  const columns = [
    { title: '模块编码', dataIndex: 'code', key: 'code' },
    { title: '模块名称', dataIndex: 'name', key: 'name' },
    {
      title: '模块类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'parent' ? 'blue' : 'green'}>
          {type === 'parent' ? '父模块' : '子模块'}
        </Tag>
      ),
    },
    { title: '路由路径', dataIndex: 'path', key: 'path' },
    { title: '图标', dataIndex: 'icon', key: 'icon' },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder' },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (enabled ? '启用' : '禁用'),
    },
    {
      title: '菜单显示',
      dataIndex: 'isVisible',
      key: 'isVisible',
      render: (visible: boolean) => (visible ? '显示' : '隐藏'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const moduleOptions = buildSelectTree(treeData);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>模块管理</h2>
      </div>

      <Card>
        <div className="table-toolbar">
          <span>模块列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增模块
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {treeData.length > 0 && (
        <Card title="模块树" style={{ marginTop: 24 }}>
          <div className="tree-container">
            <Tree treeData={buildTreeData(treeData)} defaultExpandAll />
          </div>
        </Card>
      )}

      <Modal
        title={editingItem ? '编辑模块' : '新增模块'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="模块编码"
            rules={[{ required: true, message: '请输入模块编码' }]}
          >
            <Input placeholder="请输入模块编码" />
          </Form.Item>
          <Form.Item
            name="name"
            label="模块名称"
            rules={[{ required: true, message: '请输入模块名称' }]}
          >
            <Input placeholder="请输入模块名称" />
          </Form.Item>
          <Form.Item name="parentId" label="父模块">
            <Select placeholder="请选择父模块" allowClear>
              {moduleOptions
                .filter((opt) => !editingItem || opt.value !== editingItem.id)
                .map((opt) => (
                  <Option key={opt.value || 'root'} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="模块类型">
            <Select placeholder="请选择模块类型">
              <Option value="parent">父模块</Option>
              <Option value="child">子模块</Option>
            </Select>
          </Form.Item>
          <Form.Item name="path" label="路由路径">
            <Input placeholder="请输入路由路径，如 /system/organization" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="请输入图标名称，如 setting, team 等" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <Input type="number" placeholder="请输入排序号" />
          </Form.Item>
          <Form.Item name="enabled" label="是否启用">
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
          <Form.Item name="isVisible" label="菜单显示">
            <Select>
              <Option value={true}>显示</Option>
              <Option value={false}>隐藏</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Module;
