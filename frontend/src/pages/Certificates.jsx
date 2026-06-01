import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  App,
  Popconfirm,
  DatePicker,
  InputNumber,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  SyncOutlined,
  StopOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { certificatesAPI, templatesAPI, applicantsAPI } from '../services/api.js';

const { Option } = Select;
const { TextArea } = Input;

export default function Certificates() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);
  const [form] = Form.useForm();
  const [extendForm] = Form.useForm();
  const [revokeForm] = Form.useForm();
  const [changeForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [certResult, templateResult, applicantResult] = await Promise.all([
        certificatesAPI.getList(),
        templatesAPI.getList({ status: 'active' }),
        applicantsAPI.getList(),
      ]);
      
      if (certResult.success) setCertificates(certResult.data);
      if (templateResult.success) setTemplates(templateResult.data);
      if (applicantResult.success) setApplicants(applicantResult.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = () => {
    setModalType('issue');
    form.resetFields();
    setModalVisible(true);
  };

  const handleExtend = (cert) => {
    setSelectedCert(cert);
    setModalType('extend');
    extendForm.resetFields();
    setModalVisible(true);
  };

  const handleRevoke = (cert) => {
    setSelectedCert(cert);
    setModalType('revoke');
    revokeForm.resetFields();
    setModalVisible(true);
  };

  const handleChange = (cert) => {
    setSelectedCert(cert);
    setModalType('change');
    changeForm.setFieldsValue({
      certificate_data: JSON.stringify(cert.certificate_data, null, 2),
    });
    setModalVisible(true);
  };

  const handleSubmitIssue = async (values) => {
    try {
      const result = await certificatesAPI.create({
        ...values,
        certificate_data: JSON.parse(values.certificate_data),
        issuing_authority: '政务服务中心',
        issuer: 'admin',
      });
      if (result.success) {
        message.success('签发成功');
        setModalVisible(false);
        loadData();
      }
    } catch (error) {
      message.error(error.message || '签发失败');
    }
  };

  const handleSubmitExtend = async (values) => {
    try {
      const result = await certificatesAPI.extend(selectedCert.id, {
        ...values,
        operator: 'admin',
      });
      if (result.success) {
        message.success('延期成功');
        setModalVisible(false);
        loadData();
      }
    } catch (error) {
      message.error(error.message || '延期失败');
    }
  };

  const handleSubmitRevoke = async (values) => {
    try {
      const result = await certificatesAPI.revoke(selectedCert.id, {
        ...values,
        operator: 'admin',
      });
      if (result.success) {
        message.success('吊销成功');
        setModalVisible(false);
        loadData();
      }
    } catch (error) {
      message.error(error.message || '吊销失败');
    }
  };

  const handleSubmitChange = async (values) => {
    try {
      const result = await certificatesAPI.change(selectedCert.id, {
        ...values,
        certificate_data: JSON.parse(values.certificate_data),
        operator: 'admin',
      });
      if (result.success) {
        message.success('变更成功');
        setModalVisible(false);
        loadData();
      }
    } catch (error) {
      message.error(error.message || '变更失败');
    }
  };

  const columns = [
    { title: '证照编号', dataIndex: 'certificate_number', key: 'certificate_number', width: 150 },
    { title: '模板名称', dataIndex: 'template_name', key: 'template_name' },
    { title: '持证人', dataIndex: 'applicant_name', key: 'applicant_name' },
    { title: '签发机关', dataIndex: 'issuing_authority', key: 'issuing_authority' },
    {
      title: '签发日期',
      dataIndex: 'issue_date',
      key: 'issue_date',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '有效期至',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const colors = {
          active: 'green',
          expired: 'orange',
          revoked: 'red',
        };
        const labels = {
          active: '有效',
          expired: '已过期',
          revoked: '已吊销',
        };
        return <Tag color={colors[status] || 'default'}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/certificates/${record.id}`)}>
            详情
          </Button>
          {record.status === 'active' && (
            <>
              <Button type="link" size="small" icon={<SyncOutlined />} onClick={() => handleExtend(record)}>
                延期
              </Button>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleChange(record)}>
                变更
              </Button>
              <Popconfirm title="确定吊销？" onConfirm={() => handleRevoke(record)}>
                <Button type="link" size="small" danger icon={<StopOutlined />}>
                  吊销
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>证照管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleIssue}>
          签发证照
        </Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={certificates}
        rowKey="id"
      />

      <Modal
        title="签发证照"
        open={modalVisible && modalType === 'issue'}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitIssue}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="template_id"
                label="选择模板"
                rules={[{ required: true, message: '请选择模板' }]}
              >
                <Select placeholder="请选择">
                  {templates.map((t) => (
                    <Option key={t.id} value={t.id}>{t.template_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
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
          </Row>
          <Form.Item
            name="certificate_data"
            label="证照数据 (JSON)"
            rules={[{ required: true, message: '请输入证照数据' }]}
          >
            <TextArea rows={6} placeholder='{"name": "张三", "idNumber": "110101199001011234"}' />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">签发</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="证照延期"
        open={modalVisible && modalType === 'extend'}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={extendForm} layout="vertical" onFinish={handleSubmitExtend}>
          <Form.Item
            name="extend_days"
            label="延期天数"
            rules={[{ required: true, message: '请输入延期天数' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="change_reason"
            label="延期原因"
            rules={[{ required: true, message: '请输入原因' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="证照吊销"
        open={modalVisible && modalType === 'revoke'}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={revokeForm} layout="vertical" onFinish={handleSubmitRevoke}>
          <Form.Item
            name="change_reason"
            label="吊销原因"
            rules={[{ required: true, message: '请输入原因' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="legal_basis"
            label="法律依据"
          >
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" danger htmlType="submit">确认吊销</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="证照变更"
        open={modalVisible && modalType === 'change'}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={changeForm} layout="vertical" onFinish={handleSubmitChange}>
          <Form.Item
            name="certificate_data"
            label="证照数据 (JSON)"
            rules={[{ required: true, message: '请输入证照数据' }]}
          >
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item
            name="change_reason"
            label="变更原因"
            rules={[{ required: true, message: '请输入原因' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="legal_basis"
            label="法律依据"
          >
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认变更</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
