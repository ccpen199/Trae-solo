import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  App,
  Drawer,
  Descriptions,
  Tag,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { applicantsAPI } from '../services/api.js';

const { Option } = Select;

export default function Applicants() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState(null);
  const [viewingApplicant, setViewingApplicant] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadApplicants();
  }, []);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const result = await applicantsAPI.getList();
      if (result.success) {
        setApplicants(result.data);
      }
    } catch (error) {
      message.error('加载申请人列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingApplicant(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (applicant) => {
    setEditingApplicant(applicant);
    form.setFieldsValue(applicant);
    setModalVisible(true);
  };

  const handleView = async (applicant) => {
    try {
      const result = await applicantsAPI.getDetail(applicant.id);
      if (result.success) {
        setViewingApplicant(result.data);
        setDrawerVisible(true);
      }
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingApplicant) {
        const result = await applicantsAPI.update(editingApplicant.id, values);
        if (result.success) {
          message.success('更新成功');
        }
      } else {
        const result = await applicantsAPI.create(values);
        if (result.success) {
          message.success('创建成功');
        }
      }
      setModalVisible(false);
      loadApplicants();
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'applicant_name', key: 'applicant_name', width: 120 },
    { title: '证件类型', dataIndex: 'id_type', key: 'id_type', width: 100 },
    { title: '证件号码', dataIndex: 'id_number', key: 'id_number', width: 180 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>申请人管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增申请人
        </Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={applicants}
        rowKey="id"
      />

      <Modal
        title={editingApplicant ? '编辑申请人' : '新增申请人'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="applicant_name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id_type"
                label="证件类型"
                rules={[{ required: true, message: '请选择证件类型' }]}
              >
                <Select>
                  <Option value="身份证">身份证</Option>
                  <Option value="护照">护照</Option>
                  <Option value="统一社会信用代码">统一社会信用代码</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="id_number"
                label="证件号码"
                rules={[{ required: true, message: '请输入证件号码' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确定</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="申请人详情"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {viewingApplicant && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="姓名">{viewingApplicant.applicant_name}</Descriptions.Item>
              <Descriptions.Item label="证件类型">{viewingApplicant.id_type}</Descriptions.Item>
              <Descriptions.Item label="证件号码">{viewingApplicant.id_number}</Descriptions.Item>
              <Descriptions.Item label="手机号">{viewingApplicant.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{viewingApplicant.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="地址">{viewingApplicant.address || '-'}</Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 24, marginBottom: 12 }}>持有证照</h4>
            {viewingApplicant.certificates && viewingApplicant.certificates.length > 0 ? (
              <Table
                dataSource={viewingApplicant.certificates}
                columns={[
                  { title: '证照编号', dataIndex: 'certificate_number', key: 'num' },
                  { title: '模板名称', dataIndex: 'template_name', key: 'tpl' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (s) => (
                      <Tag color={s === 'active' ? 'green' : s === 'revoked' ? 'red' : 'orange'}>
                        {s === 'active' ? '有效' : s === 'revoked' ? '已吊销' : '已过期'}
                      </Tag>
                    ),
                  },
                  {
                    title: '有效期至',
                    dataIndex: 'expiry_date',
                    key: 'exp',
                    render: (d) => dayjs(d).format('YYYY-MM-DD'),
                  },
                ]}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <p style={{ color: '#999' }}>暂无证照</p>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
