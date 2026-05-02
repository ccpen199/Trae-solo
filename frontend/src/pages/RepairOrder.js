import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, TextArea, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const RepairOrder = () => {
  const [orders, setOrders] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [form] = Form.useForm();

  // 获取维修工单列表
  useEffect(() => {
    fetchOrders();
    fetchEquipments();
    fetchTechnicians();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/repair', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching repair orders:', error);
    }
  };

  // 获取设备列表
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

  // 获取维修工列表
  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTechnicians(response.data.users.filter(user => user.role === 'technician'));
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  // 打开创建维修工单模态框
  const handleCreateOrder = () => {
    form.resetFields();
    setIsCreateMode(true);
    setCurrentOrder(null);
    setIsModalVisible(true);
  };

  // 分配维修工单
  const handleAssignOrder = (order) => {
    form.resetFields();
    setIsCreateMode(false);
    setCurrentOrder(order);
    setIsModalVisible(true);
  };

  // 开始维修
  const handleStartRepair = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/api/repair/${orderId}/start`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      message.success('维修开始成功');
      fetchOrders();
    } catch (error) {
      message.error('维修开始失败');
    }
  };

  // 完成维修
  const handleCompleteRepair = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const faultReason = prompt('请输入故障原因');
      const solution = prompt('请输入解决方案');
      if (faultReason && solution) {
        await axios.put(`http://localhost:3001/api/repair/${orderId}/complete`, {
          faultReason,
          solution,
          usedSpareParts: [] // 简化处理，实际应该选择备件
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        message.success('维修完成成功');
        fetchOrders();
      }
    } catch (error) {
      message.error('维修完成失败');
    }
  };

  // 验收维修
  const handleAcceptRepair = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const acceptanceStatus = prompt('请输入验收结果（accepted/rejected）');
      const acceptanceRemark = prompt('请输入验收备注');
      if (acceptanceStatus) {
        await axios.put(`http://localhost:3001/api/repair/${orderId}/accept`, {
          acceptanceStatus,
          acceptanceRemark
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        message.success('验收成功');
        fetchOrders();
      }
    } catch (error) {
      message.error('验收失败');
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      if (isCreateMode) {
        // 创建维修工单
        await axios.post('http://localhost:3001/api/repair', values, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        message.success('维修工单创建成功');
      } else {
        // 分配维修工单
        await axios.put(`http://localhost:3001/api/repair/${currentOrder._id}/assign`, {
          technician: values.technician
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        message.success('维修工单分配成功');
      }
      setIsModalVisible(false);
      fetchOrders();
    } catch (error) {
      message.error(isCreateMode ? '维修工单创建失败' : '维修工单分配失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '设备名称',
      dataIndex: 'equipmentId',
      key: 'equipmentId',
      render: (equipment) => equipment?.name || '未知设备'
    },
    {
      title: '申请人',
      dataIndex: 'requester',
      key: 'requester',
      render: (requester) => requester?.name || '未知申请人'
    },
    {
      title: '维修工',
      dataIndex: 'technician',
      key: 'technician',
      render: (technician) => technician?.name || '未分配'
    },
    {
      title: '故障描述',
      dataIndex: 'faultDescription',
      key: 'faultDescription'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: '待分配',
          assigned: '已分配',
          inProgress: '维修中',
          completed: '已完成',
          rejected: '已退回',
          closed: '已关闭'
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '验收状态',
      dataIndex: 'acceptanceStatus',
      key: 'acceptanceStatus',
      render: (status) => {
        const statusMap = {
          pending: '待验收',
          accepted: '已验收',
          rejected: '已拒绝'
        };
        return statusMap[status] || '未验收';
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const actions = [];
        if (record.status === 'pending') {
          actions.push(
            <Button key="assign" type="primary" size="small" onClick={() => handleAssignOrder(record)}>
              分配
            </Button>
          );
        } else if (record.status === 'assigned') {
          actions.push(
            <Button key="start" type="primary" size="small" onClick={() => handleStartRepair(record._id)}>
              开始维修
            </Button>
          );
        } else if (record.status === 'inProgress') {
          actions.push(
            <Button key="complete" type="primary" size="small" onClick={() => handleCompleteRepair(record._id)}>
              完成维修
            </Button>
          );
        } else if (record.status === 'completed' && record.acceptanceStatus === 'pending') {
          actions.push(
            <Button key="accept" type="primary" size="small" onClick={() => handleAcceptRepair(record._id)}>
              验收
            </Button>
          );
        }
        return actions;
      }
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>维修管理</h2>
        <Button type="primary" onClick={handleCreateOrder}>
          创建维修工单
        </Button>
      </div>
      <Table columns={columns} dataSource={orders} rowKey="_id" />

      {/* 创建/分配维修工单模态框 */}
      <Modal
        title={isCreateMode ? '创建维修工单' : '分配维修工单'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          {isCreateMode && (
            <>
              <Form.Item name="equipmentId" label="设备" rules={[{ required: true, message: '请选择设备' }]}>
                <Select placeholder="请选择设备">
                  {equipments.map(equipment => (
                    <Option key={equipment._id} value={equipment._id}>{equipment.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="faultDescription" label="故障描述" rules={[{ required: true, message: '请输入故障描述' }]}>
                <TextArea rows={4} placeholder="请输入故障描述" />
              </Form.Item>
              <Form.Item name="images" label="上传图片">
                <Upload action="#" listType="picture">
                  <Button icon={<UploadOutlined />}>点击上传</Button>
                </Upload>
              </Form.Item>
            </>
          )}
          {!isCreateMode && (
            <Form.Item name="technician" label="维修工" rules={[{ required: true, message: '请选择维修工' }]}>
              <Select placeholder="请选择维修工">
                {technicians.map(technician => (
                  <Option key={technician._id} value={technician._id}>{technician.name}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              {isCreateMode ? '创建' : '分配'}
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

export default RepairOrder;