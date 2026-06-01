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
  Tag,
  Row,
  Col,
  Popconfirm,
} from 'antd';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { approvalsAPI, templatesAPI, applicantsAPI } from '../services/api.js';

const { Option } = Select;
const { TextArea } = Input;

export default function Approvals() {
  const { message } = App.useApp();
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [approvalResult, templateResult, applicantResult] = await Promise.all([
        approvalsAPI.getList(),
        templatesAPI.getList({ status: 'active' }),
        applicantsAPI.getList(),
      ]);
      
      if (approvalResult.success) setApprovals(approvalResult.data);
      if (templateResult.success) setTemplates(templateResult.data);
      if (applicantResult.success) setApplicants(applicantResult.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const result = await approvalsAPI.create(values);
      if (result.success) {
        message.success('创建成功');
        setModalVisible(false);
        loadData();
      }
    } catch (error) {
      message.error(error.message || '创建失败');
    }
  };

  const handleApprove = async (record) => {
    try {
      const result = await approvalsAPI.approve(record.id, {
        approver: 'admin',
        approval_result: '通过',
      });
      if (result.success) {
        message.success('审批通过');
        loadData();
      }
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const handleReject = async (record) => {
    try {
      const result = await approvalsAPI.reject(record.id, {
        approver: 'admin',
        approval_result: '驳回',
      });
      if (result.success) {
        message.success('已驳回');
        loadData();
      }
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const statusColors = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
  };

  const statusLabels = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回',
  };

  const columns = [
    { title: '事项编码', dataIndex: 'item_code', key: 'item_code', width: 120 },
    { title: '事项名称', dataIndex: 'item_name', key: 'item_name' },
    { title: '证照模板', dataIndex: 'template_name', key: 'template_name' },
    { title: '申请人', dataIndex: 'applicant_name', key: 'applicant_name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    { title: '审批人', dataIndex: 'approver', key: 'approver', width: 100 },
    {
      title: '审批时间',
      dataIndex: 'approval_time',
      key: 'approval_time',
      width: 160,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        record.status === 'pending' && hasPermission('approvals:approve') ? (
          <Space>
            <Popconfirm title="确定通过？" onConfirm={() => handleApprove(record)}>
              <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>
                通过
              </Button>
            </Popconfirm>
            <Popconfirm title="确定驳回？" onConfirm={() => handleReject(record)}>
              <Button type="link" size="small" icon={<CloseOutlined />} danger>
                驳回
              </Button>
            </Popconfirm>
          </Space>
        ) : null
      ),
    },
  ];

  const pageTitle = hasPermission('approvals:approve') ? '审批事项' : '我的申请';
  const buttonText = hasPermission('approvals:approve') ? '新建审批' : '新建申请';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>{pageTitle}</h2>
        {hasPermission('approvals:create') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {buttonText}
          </Button>
        )}
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={approvals}
        rowKey="id"
      />

      <Modal
        title={hasPermission('approvals:approve') ? "新建审批事项" : "新建申请"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="item_code"
                label="事项编码"
                rules={[{ required: true, message: '请输入事项编码' }]}
              >
                <Input placeholder="如：APP-2024-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="item_name"
                label="事项名称"
                rules={[{ required: true, message: '请输入事项名称' }]}
              >
                <Input placeholder="如：营业执照申请" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="template_id"
                label="证照模板"
                rules={[{ required: true, message: '请选择模板' }]}
              >
                <Select placeholder="请选择">
                  {templates.map((t) => (
                    <Option key={t.id} value={t.id}>{t.template_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {hasPermission('approvals:approve') && (
              <Col span={12}>
                <Form.Item
                  name="applicant_id"
                  label="申请人"
                  rules={[{ required: true, message: '请选择申请人' }]}
                >
                  <Select placeholder="请选择">
                    {applicants.map((a) => (
                      <Option key={a.id} value={a.id}>{a.applicant_name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
