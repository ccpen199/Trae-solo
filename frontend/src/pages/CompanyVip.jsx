import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Modal, Form, Input, Typography, Tag, message, Descriptions } from 'antd';
import {
  PlusOutlined,
  BookOutlined,
  TeamOutlined,
  FormOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { companyAPI } from '../utils/api';

const { Title } = Typography;

function CompanyVip() {
  const [company, setCompany] = useState(null);
  const [sops, setSops] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [sopModalVisible, setSopModalVisible] = useState(false);
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);

  const [sopForm] = Form.useForm();
  const [courseForm] = Form.useForm();
  const [ticketForm] = Form.useForm();

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      const res = await companyAPI.list();
      if (res.data.success && res.data.companies?.length > 0) {
        const c = res.data.companies[0];
        setCompany(c);
        loadCompanyData(c.id);
      }
    } catch (err) {
      message.error('加载企业信息失败');
    }
  };

  const loadCompanyData = async (companyId) => {
    try {
      const [sopRes, courseRes, ticketRes] = await Promise.all([
        companyAPI.getSOPs(companyId),
        companyAPI.getCourses(companyId),
        companyAPI.getTickets(companyId),
      ]);
      if (sopRes.data.success) setSops(sopRes.data.sops || []);
      if (courseRes.data.success) setCourses(courseRes.data.courses || []);
      if (ticketRes.data.success) setTickets(ticketRes.data.tickets || []);
    } catch (err) {
      message.error('加载数据失败');
    }
  };

  const handleCreateSOP = async (values) => {
    try {
      await companyAPI.createSOP(company.id, values);
      message.success('SOP创建成功');
      setSopModalVisible(false);
      sopForm.resetFields();
      loadCompanyData(company.id);
    } catch (err) {
      message.error('创建失败');
    }
  };

  const handleCreateCourse = async (values) => {
    try {
      await companyAPI.createCourse(company.id, values);
      message.success('课程创建成功');
      setCourseModalVisible(false);
      courseForm.resetFields();
      loadCompanyData(company.id);
    } catch (err) {
      message.error('创建失败');
    }
  };

  const handleCreateTicket = async (values) => {
    try {
      await companyAPI.createTicket(company.id, values);
      message.success('工单创建成功');
      setTicketModalVisible(false);
      ticketForm.resetFields();
      loadCompanyData(company.id);
    } catch (err) {
      message.error('创建失败');
    }
  };

  const sopColumns = [
    { title: 'SOP名称', dataIndex: 'title', key: 'title' },
    { title: '描述', dataIndex: 'description', key: 'description', render: (t) => t || '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  const courseColumns = [
    { title: '课程名称', dataIndex: 'title', key: 'title' },
    { title: '描述', dataIndex: 'description', key: 'description', render: (t) => t || '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  const ticketColumns = [
    { title: '工单标题', dataIndex: 'title', key: 'title' },
    { title: '描述', dataIndex: 'description', key: 'description', render: (t) => t || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const map = { open: '待处理', in_progress: '处理中', closed: '已关闭' };
        const colorMap = { open: 'processing', in_progress: 'warning', closed: 'success' };
        return <Tag color={colorMap[status] || 'default'}>{map[status] || status}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  const vipLevelMap = { basic: '基础版', pro: '专业版', enterprise: '企业版' };
  const vipColorMap = { basic: 'default', pro: 'blue', enterprise: 'gold' };

  const tabItems = [
    {
      key: 'sops',
      label: (<span><BookOutlined /> 法务SOP</span>),
      children: (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setSopModalVisible(true)}>
              新建SOP
            </Button>
          </div>
          <Table dataSource={sops} columns={sopColumns} rowKey="id" pagination={{ pageSize: 10 }} />
        </div>
      ),
    },
    {
      key: 'courses',
      label: (<span><TeamOutlined /> 培训课包</span>),
      children: (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCourseModalVisible(true)}>
              新建课程
            </Button>
          </div>
          <Table dataSource={courses} columns={courseColumns} rowKey="id" pagination={{ pageSize: 10 }} />
        </div>
      ),
    },
    {
      key: 'tickets',
      label: (<span><FormOutlined /> 批量工单</span>),
      children: (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTicketModalVisible(true)}>
              新建工单
            </Button>
          </div>
          <Table dataSource={tickets} columns={ticketColumns} rowKey="id" pagination={{ pageSize: 10 }} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Title level={2}><CrownOutlined style={{ marginRight: 8, color: '#faad14' }} />企业VIP中心</Title>

      <Card style={{ marginTop: 16 }}>
        {company ? (
          <Descriptions column={3}>
            <Descriptions.Item label="公司名称">{company.name || company.company_name}</Descriptions.Item>
            <Descriptions.Item label="VIP等级">
              <Tag color={vipColorMap[company.vip_level] || 'default'}>
                {vipLevelMap[company.vip_level] || company.vip_level || '未开通'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="到期时间">{company.vip_expires_at || company.expires_at || '-'}</Descriptions.Item>
          </Descriptions>
        ) : (
          <span style={{ color: '#999' }}>暂无企业信息</span>
        )}
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="新建SOP"
        open={sopModalVisible}
        onCancel={() => setSopModalVisible(false)}
        footer={null}
      >
        <Form form={sopForm} onFinish={handleCreateSOP} layout="vertical">
          <Form.Item name="title" label="SOP名称" rules={[{ required: true, message: '请输入SOP名称' }]}>
            <Input placeholder="请输入SOP名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建课程"
        open={courseModalVisible}
        onCancel={() => setCourseModalVisible(false)}
        footer={null}
      >
        <Form form={courseForm} onFinish={handleCreateCourse} layout="vertical">
          <Form.Item name="title" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
            <Input placeholder="请输入课程名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建工单"
        open={ticketModalVisible}
        onCancel={() => setTicketModalVisible(false)}
        footer={null}
      >
        <Form form={ticketForm} onFinish={handleCreateTicket} layout="vertical">
          <Form.Item name="title" label="工单标题" rules={[{ required: true, message: '请输入工单标题' }]}>
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
            <Input.TextArea rows={4} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CompanyVip;
