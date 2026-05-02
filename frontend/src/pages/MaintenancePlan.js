import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, message } from 'antd';
import axios from 'axios';

const { Option } = Select;

const MaintenancePlan = () => {
  const [plans, setPlans] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [form] = Form.useForm();

  // 获取保养计划列表
  useEffect(() => {
    fetchPlans();
    fetchTechnicians();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/maintenance', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching maintenance plans:', error);
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

  // 分配保养计划
  const handleAssignPlan = (plan) => {
    form.resetFields();
    setCurrentPlan(plan);
    setIsModalVisible(true);
  };

  // 完成保养计划
  const handleCompletePlan = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      const maintenanceRecord = prompt('请输入保养记录');
      if (maintenanceRecord) {
        await axios.put(`http://localhost:3001/api/maintenance/${planId}/complete`, {
          maintenanceRecord
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        message.success('保养计划完成成功');
        fetchPlans();
      }
    } catch (error) {
      message.error('保养计划完成失败');
    }
  };

  // 取消保养计划
  const handleCancelPlan = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/api/maintenance/${planId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      message.success('保养计划取消成功');
      fetchPlans();
    } catch (error) {
      message.error('保养计划取消失败');
    }
  };

  // 提交分配表单
  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/api/maintenance/${currentPlan._id}/assign`, {
        executor: values.executor
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      message.success('保养计划分配成功');
      setIsModalVisible(false);
      fetchPlans();
    } catch (error) {
      message.error('保养计划分配失败');
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
      title: '计划日期',
      dataIndex: 'planDate',
      key: 'planDate',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      key: 'executor',
      render: (executor) => executor?.name || '未分配'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: '待分配',
          inProgress: '进行中',
          completed: '已完成',
          canceled: '已取消'
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '下次保养日期',
      dataIndex: 'nextMaintenanceDate',
      key: 'nextMaintenanceDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : '未设置'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const actions = [];
        if (record.status === 'pending') {
          actions.push(
            <Button key="assign" type="primary" size="small" style={{ marginRight: 8 }} onClick={() => handleAssignPlan(record)}>
              分配
            </Button>
          );
          actions.push(
            <Button key="cancel" type="danger" size="small" onClick={() => handleCancelPlan(record._id)}>
              取消
            </Button>
          );
        } else if (record.status === 'inProgress') {
          actions.push(
            <Button key="complete" type="primary" size="small" onClick={() => handleCompletePlan(record._id)}>
              完成
            </Button>
          );
        }
        return actions;
      }
    }
  ];

  return (
    <div>
      <h2>保养计划管理</h2>
      <Table columns={columns} dataSource={plans} rowKey="_id" style={{ marginTop: 24 }} />

      {/* 分配保养计划模态框 */}
      <Modal
        title="分配保养计划"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="executor" label="执行人" rules={[{ required: true, message: '请选择执行人' }]}>
            <Select placeholder="请选择执行人">
              {technicians.map(technician => (
                <Option key={technician._id} value={technician._id}>{technician.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              分配
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

export default MaintenancePlan;