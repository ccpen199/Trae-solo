import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';
import axios from 'axios';

const SparePartManagement = () => {
  const [spareParts, setSpareParts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSparePart, setCurrentSparePart] = useState(null);
  const [form] = Form.useForm();

  // 获取备件列表
  useEffect(() => {
    fetchSpareParts();
  }, []);

  const fetchSpareParts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/sparePart', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSpareParts(response.data.spareParts);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
    }
  };

  // 打开添加备件模态框
  const handleAddSparePart = () => {
    form.resetFields();
    setIsEditMode(false);
    setCurrentSparePart(null);
    setIsModalVisible(true);
  };

  // 打开编辑备件模态框
  const handleEditSparePart = (sparePart) => {
    form.setFieldsValue(sparePart);
    setIsEditMode(true);
    setCurrentSparePart(sparePart);
    setIsModalVisible(true);
  };

  // 删除备件
  const handleDeleteSparePart = async (sparePartId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/sparePart/${sparePartId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      message.success('备件删除成功');
      fetchSpareParts();
    } catch (error) {
      message.error('备件删除失败');
    }
  };

  // 盘点备件
  const handleInventorySparePart = async (sparePartId) => {
    try {
      const token = localStorage.getItem('token');
      const actualQuantity = prompt('请输入实际库存数量');
      if (actualQuantity) {
        await axios.put(`http://localhost:3001/api/sparePart/${sparePartId}/inventory`, {
          actualQuantity: parseInt(actualQuantity)
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        message.success('备件盘点成功');
        fetchSpareParts();
      }
    } catch (error) {
      message.error('备件盘点失败');
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      if (isEditMode) {
        // 更新备件
        await axios.put(`http://localhost:3001/api/sparePart/${currentSparePart._id}`, values, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        message.success('备件更新成功');
      } else {
        // 添加备件
        await axios.post('http://localhost:3001/api/sparePart', values, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        message.success('备件添加成功');
      }
      setIsModalVisible(false);
      fetchSpareParts();
    } catch (error) {
      message.error(isEditMode ? '备件更新失败' : '备件添加失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '备件名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '备件编号',
      dataIndex: 'code',
      key: 'code'
    },
    {
      title: '备件类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '备件型号',
      dataIndex: 'model',
      key: 'model'
    },
    {
      title: '制造商',
      dataIndex: 'manufacturer',
      key: 'manufacturer'
    },
    {
      title: '库存数量',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity'
    },
    {
      title: '最小库存',
      dataIndex: 'minimumStock',
      key: 'minimumStock'
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit'
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button type="primary" size="small" style={{ marginRight: 8 }} onClick={() => handleEditSparePart(record)}>
            编辑
          </Button>
          <Button type="danger" size="small" style={{ marginRight: 8 }} onClick={() => handleDeleteSparePart(record._id)}>
            删除
          </Button>
          <Button type="default" size="small" onClick={() => handleInventorySparePart(record._id)}>
            盘点
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>备件管理</h2>
        <Button type="primary" onClick={handleAddSparePart}>
          添加备件
        </Button>
      </div>
      <Table columns={columns} dataSource={spareParts} rowKey="_id" />

      {/* 添加/编辑备件模态框 */}
      <Modal
        title={isEditMode ? '编辑备件' : '添加备件'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="备件名称" rules={[{ required: true, message: '请输入备件名称' }]}>
            <Input placeholder="请输入备件名称" />
          </Form.Item>
          <Form.Item name="code" label="备件编号" rules={[{ required: true, message: '请输入备件编号' }]}>
            <Input placeholder="请输入备件编号" />
          </Form.Item>
          <Form.Item name="type" label="备件类型" rules={[{ required: true, message: '请输入备件类型' }]}>
            <Input placeholder="请输入备件类型" />
          </Form.Item>
          <Form.Item name="model" label="备件型号" rules={[{ required: true, message: '请输入备件型号' }]}>
            <Input placeholder="请输入备件型号" />
          </Form.Item>
          <Form.Item name="manufacturer" label="制造商" rules={[{ required: true, message: '请输入制造商' }]}>
            <Input placeholder="请输入制造商" />
          </Form.Item>
          <Form.Item name="stockQuantity" label="库存数量" rules={[{ required: true, message: '请输入库存数量' }]}>
            <Input type="number" placeholder="请输入库存数量" />
          </Form.Item>
          <Form.Item name="minimumStock" label="最小库存" rules={[{ required: true, message: '请输入最小库存' }]}>
            <Input type="number" placeholder="请输入最小库存" />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true, message: '请输入单位' }]}>
            <Input placeholder="请输入单位" />
          </Form.Item>
          <Form.Item name="price" label="单价" rules={[{ required: true, message: '请输入单价' }]}>
            <Input type="number" placeholder="请输入单价" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              {isEditMode ? '更新' : '添加'}
            </Button>
            <Button onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SparePartManagement;