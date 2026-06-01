import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Typography, Tag, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, BarChartOutlined } from '@ant-design/icons';
import { projectApi, clientApi } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        projectApi.list(),
        clientApi.list()
      ]);
      setProjects(projectsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingProject(record);
    form.setFieldsValue({
      ...record,
      start_date: record.start_date ? dayjs(record.start_date) : null,
      end_date: record.end_date ? dayjs(record.end_date) : null
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null
      };
      
      if (editingProject) {
        await projectApi.update(editingProject.id, submitData);
        message.success('项目更新成功');
      } else {
        await projectApi.create(submitData);
        message.success('项目创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '客户',
      dataIndex: 'client_name',
      key: 'client_name'
    },
    {
      title: '招聘目标',
      dataIndex: 'recruitment_target',
      key: 'recruitment_target'
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date'
    },
    {
      title: '结束日期',
      dataIndex: 'end_date',
      key: 'end_date'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '进行中' : '已完成'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </>
      )
    }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>项目管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增项目
        </Button>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <Table
          dataSource={projects}
          columns={columns}
          rowKey="id"
          loading={loading}
          className="card-shadow"
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={editingProject ? '编辑项目' : '新增项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="client_id" label="所属客户" rules={[{ required: true }]}>
            <Select placeholder="请选择客户">
              {clients.map(client => (
                <Option key={client.id} value={client.id}>{client.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item name="recruitment_target" label="招聘目标人数">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入招聘目标人数" />
          </Form.Item>
          <Form.Item name="start_date" label="开始日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_date" label="结束日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="settlement_method" label="结算方式">
            <Input placeholder="请输入结算方式" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
