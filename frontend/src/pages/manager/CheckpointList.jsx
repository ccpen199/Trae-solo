import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UnorderedListOutlined } from '@ant-design/icons';
import api from '../../utils/api';

function CheckpointList() {
  const [checkpoints, setCheckpoints] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingCheckpoint, setEditingCheckpoint] = useState(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [checkItems, setCheckItems] = useState([]);
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();

  useEffect(() => {
    fetchCheckpoints();
    fetchBuildings();
  }, []);

  const fetchCheckpoints = async () => {
    setLoading(true);
    try {
      const response = await api.get('/checkpoints');
      setCheckpoints(response.data);
    } catch (error) {
      message.error('获取点位列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await api.get('/buildings');
      setBuildings(response.data);
    } catch (error) {
      message.error('获取楼栋列表失败');
    }
  };

  const handleAdd = () => {
    setEditingCheckpoint(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (checkpoint) => {
    setEditingCheckpoint(checkpoint);
    form.setFieldsValue(checkpoint);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/checkpoints/${id}`);
      message.success('删除成功');
      fetchCheckpoints();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCheckpoint) {
        await api.put(`/checkpoints/${editingCheckpoint.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/checkpoints', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchCheckpoints();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleViewItems = async (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    try {
      const response = await api.get(`/checkpoints/${checkpoint.id}/items`);
      setCheckItems(response.data);
    } catch (error) {
      setCheckItems([]);
    }
    setItemModalVisible(true);
  };

  const handleAddItem = async () => {
    try {
      const values = await itemForm.validateFields();
      await api.post(`/checkpoints/${selectedCheckpoint.id}/items`, values);
      message.success('添加成功');
      itemForm.resetFields();
      const response = await api.get(`/checkpoints/${selectedCheckpoint.id}/items`);
      setCheckItems(response.data);
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    { title: '点位名称', dataIndex: 'name', key: 'name' },
    { title: '所属楼栋', dataIndex: 'building_name', key: 'building_name' },
    { title: '二维码', dataIndex: 'qr_code', key: 'qr_code' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { title: '检查项数量', dataIndex: 'check_item_count', key: 'check_item_count' },
    { 
      title: '操作', 
      key: 'action',
      render: (_, record) => (
        <>
          <Button 
            type="link" 
            icon={<UnorderedListOutlined />} 
            onClick={() => handleViewItems(record)}
          >
            检查项
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个点位吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>点位管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增点位
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={checkpoints}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingCheckpoint ? '编辑点位' : '新增点位'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="building_id"
            label="所属楼栋"
            rules={[{ required: true, message: '请选择楼栋' }]}
          >
            <Select placeholder="请选择楼栋">
              {buildings.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="name"
            label="点位名称"
            rules={[{ required: true, message: '请输入点位名称' }]}
          >
            <Input placeholder="请输入点位名称" />
          </Form.Item>
          <Form.Item
            name="qr_code"
            label="二维码编号"
            rules={[{ required: true, message: '请输入二维码编号' }]}
          >
            <Input placeholder="请输入二维码编号，如：CP001" />
          </Form.Item>
          <Form.Item name="location" label="位置描述">
            <Input placeholder="请输入位置描述" />
          </Form.Item>
          <Form.Item name="latitude" label="纬度">
            <Input placeholder="请输入纬度" />
          </Form.Item>
          <Form.Item name="longitude" label="经度">
            <Input placeholder="请输入经度" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedCheckpoint?.name} - 检查项管理`}
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={itemForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入检查项名称' }]}
          >
            <Input placeholder="检查项名称" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="description">
            <Input placeholder="描述" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleAddItem}>添加</Button>
          </Form.Item>
        </Form>
        <Table
          columns={[
            { title: '检查项名称', dataIndex: 'name', key: 'name' },
            { title: '描述', dataIndex: 'description', key: 'description' },
            { title: '类型', dataIndex: 'type', key: 'type' }
          ]}
          dataSource={checkItems}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Modal>
    </div>
  );
}

export default CheckpointList;
