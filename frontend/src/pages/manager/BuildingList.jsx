import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../utils/api';

function BuildingList() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/buildings');
      setBuildings(response.data);
    } catch (error) {
      message.error('获取楼栋列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBuilding(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (building) => {
    setEditingBuilding(building);
    form.setFieldsValue(building);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/buildings/${id}`);
      message.success('删除成功');
      fetchBuildings();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingBuilding) {
        await api.put(`/buildings/${editingBuilding.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/buildings', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchBuildings();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    { title: '楼栋名称', dataIndex: 'name', key: 'name' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '区域', dataIndex: 'area', key: 'area' },
    { title: '点位数量', dataIndex: 'checkpoint_count', key: 'checkpoint_count' },
    { title: '计划数量', dataIndex: 'plan_count', key: 'plan_count' },
    { 
      title: '操作', 
      key: 'action',
      render: (_, record) => (
        <>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个楼栋吗？"
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
        <h2 style={{ margin: 0 }}>楼栋管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增楼栋
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={buildings}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingBuilding ? '编辑楼栋' : '新增楼栋'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="楼栋名称"
            rules={[{ required: true, message: '请输入楼栋名称' }]}
          >
            <Input placeholder="请输入楼栋名称" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="area" label="区域">
            <Input placeholder="请输入区域，如：A区、B区" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default BuildingList;
