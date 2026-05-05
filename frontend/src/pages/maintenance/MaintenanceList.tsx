import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { maintenanceApi, studentApi } from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface MaintenanceTicket {
  id: number;
  ticket_number: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  student_id: number;
  student_no: string;
  student_name: string;
  student_phone: string;
  room_id: number;
  room_number: string;
  dormitory_id: number;
  building_code: string;
  building_name: string;
  assigned_to_id: number;
  assigned_to_name: string;
  created_at: string;
  processed_at: string;
  completed_at: string;
  solution: string;
}

const MaintenanceList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MaintenanceTicket[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<MaintenanceTicket | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [createForm] = Form.useForm();
  const [processForm] = Form.useForm();
  const [completeForm] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await maintenanceApi.getAll();
      setData(response.data.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentApi.getAll({ has_check_in: true });
      setStudents(response.data.data);
    } catch (error) {
      message.error('获取学生数据失败');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    fetchStudents();
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      await maintenanceApi.create(values);
      message.success('维修申请提交成功');
      setCreateModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const handleProcess = (record: MaintenanceTicket) => {
    setCurrentTicket(record);
    processForm.resetFields();
    setProcessModalVisible(true);
  };

  const handleProcessSubmit = async () => {
    if (!currentTicket) return;
    try {
      await maintenanceApi.process(currentTicket.id);
      message.success('维修单已受理');
      setProcessModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleComplete = (record: MaintenanceTicket) => {
    setCurrentTicket(record);
    completeForm.resetFields();
    setCompleteModalVisible(true);
  };

  const handleCompleteSubmit = async () => {
    if (!currentTicket) return;
    try {
      const values = await completeForm.validateFields();
      await maintenanceApi.complete(currentTicket.id, values);
      message.success('维修单已完成');
      setCompleteModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'blue',
      processing: 'orange',
      completed: 'green',
      rejected: 'red',
    };
    const textMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      rejected: '已拒绝',
    };
    return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const colorMap: Record<string, string> = {
      urgent: 'red',
      high: 'orange',
      normal: 'blue',
      low: 'green',
    };
    const textMap: Record<string, string> = {
      urgent: '紧急',
      high: '高',
      normal: '普通',
      low: '低',
    };
    return <Tag color={colorMap[priority] || 'default'}>{textMap[priority] || priority}</Tag>;
  };

  const columns = [
    {
      title: '维修单号',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 150,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 150,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: '报修学生',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 100,
      render: (name: string, record: MaintenanceTicket) => (
        <span>{name} ({record.student_no})</span>
      ),
    },
    {
      title: '房间',
      dataIndex: 'room_number',
      key: 'room_number',
      width: 100,
      render: (room: string, record: MaintenanceTicket) => (
        <span>{record.building_code} - {room}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: MaintenanceTicket) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<LoadingOutlined />}
              onClick={() => handleProcess(record)}
            >
              受理
            </Button>
          )}
          {record.status === 'processing' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record)}
            >
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="维修单列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建维修单
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="新建维修单"
        open={createModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalVisible(false)}
        width={600}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="student_id"
            label="报修学生"
            rules={[{ required: true, message: '请选择报修学生' }]}
          >
            <Select placeholder="请选择已入住的学生" showSearch optionFilterProp="children">
              {students.map((student) => (
                <Option key={student.id} value={student.id}>
                  {student.student_id} - {student.name} ({student.room_number})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="category"
            label="维修类别"
            rules={[{ required: true, message: '请选择维修类别' }]}
          >
            <Select placeholder="请选择维修类别">
              <Option value="water">水电维修</Option>
              <Option value="electrical">电器维修</Option>
              <Option value="door">门窗维修</Option>
              <Option value="furniture">家具维修</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请简要描述维修问题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述维修问题" />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
            initialValue="normal"
          >
            <Select placeholder="请选择优先级">
              <Option value="urgent">紧急</Option>
              <Option value="high">高</Option>
              <Option value="normal">普通</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="受理维修单"
        open={processModalVisible}
        onOk={handleProcessSubmit}
        onCancel={() => setProcessModalVisible(false)}
      >
        <p>确定要受理此维修单吗？</p>
        <p>维修单号：{currentTicket?.ticket_number}</p>
        <p>标题：{currentTicket?.title}</p>
      </Modal>

      <Modal
        title="完成维修单"
        open={completeModalVisible}
        onOk={handleCompleteSubmit}
        onCancel={() => setCompleteModalVisible(false)}
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item
            name="solution"
            label="解决方案"
            rules={[{ required: true, message: '请输入解决方案' }]}
          >
            <TextArea rows={4} placeholder="请输入维修解决方案" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaintenanceList;