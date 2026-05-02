import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Space, InputNumber } from 'antd';
import axios from 'axios';

const { Option } = Select;
const { RangePicker } = DatePicker;

const EquipmentManagement = () => {
  const [equipments, setEquipments] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState(null);
  const [form] = Form.useForm();
  const [associatedSpareParts, setAssociatedSpareParts] = useState([]);

  // 获取设备列表和备件列表
  useEffect(() => {
    fetchEquipments();
    fetchSpareParts();
  }, []);

  const fetchEquipments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/equipment', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEquipments(response.data.equipments);
    } catch (error) {
      console.error('Error fetching equipments:', error);
    }
  };

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

  // 打开添加设备模态框
  const handleAddEquipment = () => {
    form.resetFields();
    setIsEditMode(false);
    setCurrentEquipment(null);
    setAssociatedSpareParts([]);
    setIsModalVisible(true);
  };

  // 打开编辑设备模态框
  const handleEditEquipment = (equipment) => {
    form.setFieldsValue(equipment);
    setIsEditMode(true);
    setCurrentEquipment(equipment);
    setAssociatedSpareParts(equipment.associatedSpareParts || []);
    setIsModalVisible(true);
  };

  // 删除设备
  const handleDeleteEquipment = async (equipmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/equipment/${equipmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      message.success('设备删除成功');
      fetchEquipments();
    } catch (error) {
      message.error('设备删除失败');
    }
  };

  // 设备报废
  const handleScrapEquipment = async (equipmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/api/equipment/${equipmentId}/scrap`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      message.success('设备报废成功');
      fetchEquipments();
    } catch (error) {
      message.error('设备报废失败');
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      // 添加关联备件
      const submitValues = {
        ...values,
        associatedSpareParts
      };
      if (isEditMode) {
        // 更新设备
        await axios.put(`http://localhost:3001/api/equipment/${currentEquipment._id}`, submitValues, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        message.success('设备更新成功');
      } else {
        // 添加设备
        await axios.post('http://localhost:3001/api/equipment', submitValues, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        message.success('设备添加成功');
      }
      setIsModalVisible(false);
      fetchEquipments();
    } catch (error) {
      message.error(isEditMode ? '设备更新失败' : '设备添加失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '设备编号',
      dataIndex: 'code',
      key: 'code'
    },
    {
      title: '设备类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '设备型号',
      dataIndex: 'model',
      key: 'model'
    },
    {
      title: '制造商',
      dataIndex: 'manufacturer',
      key: 'manufacturer'
    },
    {
      title: '安装日期',
      dataIndex: 'installDate',
      key: 'installDate',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          normal: '正常',
          maintenance: '维护中',
          repair: '维修中',
          scrapped: '已报废'
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '下次保养日期',
      dataIndex: 'nextMaintenanceDate',
      key: 'nextMaintenanceDate',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button type="primary" size="small" style={{ marginRight: 8 }} onClick={() => handleEditEquipment(record)}>
            编辑
          </Button>
          <Button type="danger" size="small" style={{ marginRight: 8 }} onClick={() => handleDeleteEquipment(record._id)}>
            删除
          </Button>
          {record.status !== 'scrapped' && (
            <Button type="default" size="small" onClick={() => handleScrapEquipment(record._id)}>
              报废
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>设备管理</h2>
        <Button type="primary" onClick={handleAddEquipment}>
          添加设备
        </Button>
      </div>
      <Table columns={columns} dataSource={equipments} rowKey="_id" />

      {/* 添加/编辑设备模态框 */}
      <Modal
        title={isEditMode ? '编辑设备' : '添加设备'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="设备名称" rules={[{ required: true, message: '请输入设备名称' }]}>
            <Input placeholder="请输入设备名称" />
          </Form.Item>
          <Form.Item name="code" label="设备编号" rules={[{ required: true, message: '请输入设备编号' }]}>
            <Input placeholder="请输入设备编号" />
          </Form.Item>
          <Form.Item name="type" label="设备类型" rules={[{ required: true, message: '请输入设备类型' }]}>
            <Input placeholder="请输入设备类型" />
          </Form.Item>
          <Form.Item name="model" label="设备型号" rules={[{ required: true, message: '请输入设备型号' }]}>
            <Input placeholder="请输入设备型号" />
          </Form.Item>
          <Form.Item name="manufacturer" label="制造商" rules={[{ required: true, message: '请输入制造商' }]}>
            <Input placeholder="请输入制造商" />
          </Form.Item>
          <Form.Item name="purchaseDate" label="购买日期" rules={[{ required: true, message: '请选择购买日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="installDate" label="安装日期" rules={[{ required: true, message: '请选择安装日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="安装位置" rules={[{ required: true, message: '请输入安装位置' }]}>
            <Input placeholder="请输入安装位置" />
          </Form.Item>
          <Form.Item name="maintenanceCycle" label="保养周期（天）" rules={[{ required: true, message: '请输入保养周期' }]}>
            <Input type="number" placeholder="请输入保养周期" />
          </Form.Item>
          <Form.Item name="status" label="设备状态">
            <Select placeholder="请选择设备状态">
              <Option value="normal">正常</Option>
              <Option value="maintenance">维护中</Option>
              <Option value="repair">维修中</Option>
              <Option value="scrapped">已报废</Option>
            </Select>
          </Form.Item>
          <Form.Item label="关联备件">
            <div>
              {associatedSpareParts.map((item, index) => (
                <Space key={index} style={{ display: 'flex', marginBottom: 8 }}>
                  <Select
                    style={{ width: 200 }}
                    placeholder="选择备件"
                    value={item.sparePartId}
                    onChange={(value) => {
                      const newAssociatedSpareParts = [...associatedSpareParts];
                      newAssociatedSpareParts[index].sparePartId = value;
                      setAssociatedSpareParts(newAssociatedSpareParts);
                    }}
                  >
                    {spareParts.map(sparePart => (
                      <Option key={sparePart._id} value={sparePart._id}>
                        {sparePart.name} ({sparePart.code})
                      </Option>
                    ))}
                  </Select>
                  <InputNumber
                    style={{ width: 100 }}
                    placeholder="数量"
                    value={item.quantity}
                    onChange={(value) => {
                      const newAssociatedSpareParts = [...associatedSpareParts];
                      newAssociatedSpareParts[index].quantity = value;
                      setAssociatedSpareParts(newAssociatedSpareParts);
                    }}
                  />
                  <Button
                    danger
                    onClick={() => {
                      const newAssociatedSpareParts = associatedSpareParts.filter((_, i) => i !== index);
                      setAssociatedSpareParts(newAssociatedSpareParts);
                    }}
                  >
                    删除
                  </Button>
                </Space>
              ))}
              <Button
                type="dashed"
                onClick={() => {
                  setAssociatedSpareParts([...associatedSpareParts, { sparePartId: '', quantity: 1 }]);
                }}
              >
                添加备件
              </Button>
            </div>
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

export default EquipmentManagement;