import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Empty, Spin, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { Patient } from '../types';
import { patientApi } from '../services/api';

const { Option } = Select;

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await patientApi.getAll();
      setPatients(data);
    } catch (error) {
      message.error('获取患者列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPatient(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    form.setFieldsValue(patient);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await patientApi.delete(id);
      message.success('删除成功');
      fetchPatients();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: Omit<Patient, 'id' | 'admissionDate' | 'status'> & { status?: Patient['status'] }) => {
    try {
      if (editingPatient) {
        await patientApi.update(editingPatient.id, values);
        message.success('更新成功');
      } else {
        await patientApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchPatients();
    } catch (error) {
      message.error(editingPatient ? '更新失败' : '创建失败');
    }
  };

  const getStatusTag = (status: Patient['status']) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'active': { color: 'green', text: '康复中' },
      'discharged': { color: 'blue', text: '已出院' },
      'follow-up': { color: 'orange', text: '随访中' }
    };
    const config = statusMap[status] || statusMap['active'];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Patient) => (
        <Button type="link" onClick={() => navigate(`/patients/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => (gender === 'male' ? '男' : '女'),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '诊断',
      dataIndex: 'condition',
      key: 'condition',
      ellipsis: true,
    },
    {
      title: '入院日期',
      dataIndex: 'admissionDate',
      key: 'admissionDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: Patient['status']) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: unknown, record: Patient) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/patients/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/reports/${record.id}`)}
          >
            报告
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该患者吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>患者管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加患者
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : patients.length > 0 ? (
          <Table
            columns={columns}
            dataSource={patients}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="暂无患者数据，点击上方按钮添加" />
        )}
      </Card>

      <Modal
        title={editingPatient ? '编辑患者' : '添加患者'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={12}>
              <Form.Item
                name="age"
                label="年龄"
                rules={[{ required: true, message: '请输入年龄' }]}
              >
                <InputNumber min={0} max={150} placeholder="年龄" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别">
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="condition"
            label="诊断"
            rules={[{ required: true, message: '请输入诊断' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入诊断信息" />
          </Form.Item>

          {editingPatient && (
            <Form.Item name="status" label="状态">
              <Select placeholder="请选择状态">
                <Option value="active">康复中</Option>
                <Option value="discharged">已出院</Option>
                <Option value="follow-up">随访中</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPatient ? '保存' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PatientList;
