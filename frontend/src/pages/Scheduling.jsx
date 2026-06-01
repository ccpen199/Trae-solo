import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, TimePicker, message, Tag, Space, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

function Scheduling({ storeId }) {
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSchedules();
    loadEmployees();
    loadLeaves();
  }, [storeId]);

  const loadSchedules = async () => {
    const today = dayjs();
    const res = await api.get(`/schedules?store_id=${storeId}&start_date=${today.subtract(7, 'day').format('YYYY-MM-DD')}&end_date=${today.add(14, 'day').format('YYYY-MM-DD')}`);
    if (res.success) {
      setSchedules(res.data);
    }
  };

  const loadEmployees = async () => {
    const res = await api.get(`/employees?store_id=${storeId}`);
    if (res.success) {
      setEmployees(res.data);
    }
  };

  const loadLeaves = async () => {
    const res = await api.get(`/leaves?store_id=${storeId}&status=approved`);
    if (res.success) {
      setLeaves(res.data);
    }
  };

  const checkConflict = async (values) => {
    const res = await api.post('/schedules/check-conflict', {
      employee_id: values.employee_id,
      schedule_date: values.schedule_date.format('YYYY-MM-DD'),
      start_time: values.start_time.format('HH:mm'),
      end_time: values.end_time.format('HH:mm')
    });
    if (res.success) {
      setConflicts(res.data.conflicts || []);
      return res.data.hasConflict;
    }
    return false;
  };

  const handleAdd = () => {
    setConflicts([]);
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const hasConflict = await checkConflict(values);
      
      if (hasConflict) {
        Modal.confirm({
          title: '排班冲突确认',
          content: '检测到排班冲突，是否强制保存？',
          onOk: async () => {
            await saveSchedule(values, false);
          }
        });
        return;
      }
      
      await saveSchedule(values, true);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const saveSchedule = async (values, checkConflict) => {
    const res = await api.post('/schedules', {
      store_id: storeId,
      employee_id: values.employee_id,
      schedule_date: values.schedule_date.format('YYYY-MM-DD'),
      start_time: values.start_time.format('HH:mm'),
      end_time: values.end_time.format('HH:mm'),
      shift_type: values.shift_type,
      check_conflict: checkConflict
    });
    if (res.success) {
      message.success('排班成功');
      setModalVisible(false);
      form.resetFields();
      loadSchedules();
    } else {
      message.error(res.message || '排班失败');
    }
  };

  const handleDelete = async (id) => {
    const res = await api.delete(`/schedules/${id}`);
    if (res.success) {
      message.success('删除成功');
      loadSchedules();
    }
  };

  const columns = [
    { title: '日期', dataIndex: 'schedule_date', key: 'schedule_date' },
    { title: '员工', dataIndex: 'employee_name', key: 'employee_name' },
    { title: '岗位', dataIndex: 'position', key: 'position' },
    { title: '上班时间', dataIndex: 'start_time', key: 'start_time' },
    { title: '下班时间', dataIndex: 'end_time', key: 'end_time' },
    { title: '班次', dataIndex: 'shift_type', key: 'shift_type',
      render: (v) => {
        const map = { morning: '早班', middle: '中班', night: '晚班' };
        return <Tag color="blue">{map[v] || v}</Tag>;
      }
    },
    { title: '操作', key: 'action',
      render: (_, record) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>排班管理</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加排班</Button>
        </Space>
      </div>

      {leaves.length > 0 && (
        <Alert
          message="今日请假员工"
          description={leaves.filter(l => l.leave_date === dayjs().format('YYYY-MM-DD')).map(l => l.employee_name).join('、')}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        dataSource={schedules}
        columns={columns}
        rowKey="id"
      />

      <Modal
        title="添加排班"
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="employee_id" label="员工" rules={[{ required: true }]}>
            <Select>
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="schedule_date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="shift_type" label="班次">
            <Select>
              <Option value="morning">早班</Option>
              <Option value="middle">中班</Option>
              <Option value="night">晚班</Option>
            </Select>
          </Form.Item>
          <Form.Item name="start_time" label="开始时间" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_time" label="结束时间" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
        {conflicts.length > 0 && (
          <Alert
            message="排班冲突"
            description={
              <ul>
                {conflicts.map((c, i) => <li key={i}>{c.message}</li>)}
              </ul>
            }
            type="warning"
            showIcon
          />
        )}
      </Modal>
    </div>
  );
}

export default Scheduling;
