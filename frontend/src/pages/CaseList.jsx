import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tag, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { caseApi, userApi } from '../api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const DISPUTE_TYPES = [
  { value: 'salary', label: '工资争议' },
  { value: 'compensation', label: '经济补偿' },
  { value: 'dismissal', label: '违法解除' },
  { value: 'social_insurance', label: '社会保险' },
  { value: 'overtime', label: '加班费' },
  { value: 'other', label: '其他' }
];

const STATUS_MAP = {
  pending: { label: '待处理', color: 'orange' },
  hearing: { label: '审理中', color: 'blue' },
  closed: { label: '已结案', color: 'green' }
};

function CaseList() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [form] = Form.useForm();
  const [transferForm] = Form.useForm();

  useEffect(() => {
    loadCases();
    loadLawyers();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await caseApi.list();
      setCases(res.data);
    } catch (error) {
      message.error('加载案件失败');
    }
    setLoading(false);
  };

  const loadLawyers = async () => {
    try {
      const res = await userApi.list({ role: 'lawyer' });
      setLawyers(res.data);
    } catch (error) {
      console.error('加载律师列表失败:', error);
    }
  };

  const handleCreate = () => {
    setEditingCase(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCase(record);
    form.setFieldsValue({
      client_name: record.client_name,
      client_phone: record.client_phone,
      respondent: record.respondent,
      dispute_type: record.dispute_type,
      claim_amount: record.claim_amount,
      employment_relation: record.employment_relation,
      lawyer_id: record.lawyer_id,
      status: record.status,
      description: record.description,
      start_date: record.start_date ? dayjs(record.start_date) : null,
      end_date: record.end_date ? dayjs(record.end_date) : null,
      dispute_date: record.dispute_date ? dayjs(record.dispute_date) : null,
      arbitration_deadline: record.arbitration_deadline ? dayjs(record.arbitration_deadline) : null
    });
    setModalVisible(true);
  };

  const handleTransfer = (record) => {
    setSelectedCase(record);
    transferForm.resetFields();
    setTransferModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        dispute_date: values.dispute_date ? values.dispute_date.format('YYYY-MM-DD') : null,
        arbitration_deadline: values.arbitration_deadline ? values.arbitration_deadline.format('YYYY-MM-DD') : null
      };

      if (editingCase) {
        await caseApi.update(editingCase.id, data);
        message.success('案件更新成功');
      } else {
        await caseApi.create(data);
        message.success('案件创建成功');
      }
      setModalVisible(false);
      loadCases();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleTransferSubmit = async (values) => {
    try {
      const lawyer = lawyers.find(l => l.id === values.lawyer_id);
      await caseApi.transfer(selectedCase.id, {
        ...values,
        lawyer_name: lawyer ? lawyer.name : null
      });
      message.success('案件转办成功');
      setTransferModalVisible(false);
      loadCases();
    } catch (error) {
      message.error('转办失败');
    }
  };

  const renderDisputeType = (_, r) => {
    const type = DISPUTE_TYPES.find(t => t.value === r.dispute_type);
    return type ? type.label : '';
  };

  const renderStatus = (_, r) => {
    const status = STATUS_MAP[r.status];
    return status ? <Tag color={status.color}>{status.label}</Tag> : null;
  };

  const columns = [
    { title: '案件编号', dataIndex: 'case_number', key: 'case_number', width: 160 },
    { title: '当事人', dataIndex: 'client_name', key: 'client_name', width: 100 },
    { title: '被申请人', dataIndex: 'respondent', key: 'respondent', width: 120 },
    { title: '争议类型', key: 'dispute_type', width: 100, render: renderDisputeType },
    { title: '金额(元)', dataIndex: 'claim_amount', key: 'claim_amount', width: 100 },
    { title: '负责律师', dataIndex: 'lawyer_name', key: 'lawyer_name', width: 100 },
    { title: '状态', key: 'status', width: 100, render: renderStatus },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, r) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/cases/${r.id}`)}>详情</Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(r)}>编辑</Button>
          <Button icon={<UserSwitchOutlined />} size="small" onClick={() => handleTransfer(r)}>转办</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建案件</Button>
      </div>

      <Table
        columns={columns}
        dataSource={cases}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingCase ? '编辑案件' : '新建案件'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="client_name" label="当事人姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="client_phone" label="联系电话">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="respondent" label="被申请人">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dispute_type" label="争议类型" rules={[{ required: true }]}>
                <Select>
                  {DISPUTE_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="claim_amount" label="请求金额(元)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="employment_relation" label="用工关系">
            <Input placeholder="例如：劳动合同、劳务派遣等" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="入职日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="离职日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dispute_date" label="争议发生日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="arbitration_deadline" label="仲裁时效截止日">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="lawyer_id" label="负责律师">
            <Select>
              {lawyers.map(l => <Option key={l.id} value={l.id}>{l.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="案件描述">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="案件转办"
        open={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        onOk={() => transferForm.submit()}
      >
        <Form form={transferForm} layout="vertical" onFinish={handleTransferSubmit}>
          <Form.Item name="lawyer_id" label="接收律师" rules={[{ required: true }]}>
            <Select>
              {lawyers.map(l => <Option key={l.id} value={l.id}>{l.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="转办原因" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CaseList;
