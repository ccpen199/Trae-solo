import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Input, Select, message, Card, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { evidenceApi, caseApi } from '../api';

const { TextArea } = Input;
const { Option } = Select;

const EVIDENCE_TYPES = [
  { value: 'contract', label: '劳动合同' },
  { value: 'salary', label: '工资流水' },
  { value: 'attendance', label: '考勤记录' },
  { value: 'communication', label: '沟通记录' },
  { value: 'dismissal', label: '解除通知' },
  { value: 'other', label: '其他' }
];

function Evidence() {
  const [evidences, setEvidences] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEvidences();
    loadCases();
  }, []);

  const loadEvidences = async () => {
    setLoading(true);
    try {
      const res = await evidenceApi.list();
      setEvidences(res.data);
    } catch (error) {
      message.error('加载证据失败');
    }
    setLoading(false);
  };

  const loadCases = async () => {
    try {
      const res = await caseApi.list();
      setCases(res.data);
    } catch (error) {
      console.error('加载案件列表失败:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await evidenceApi.create({
        ...values,
        uploaded_by: '系统'
      });
      message.success('证据添加成功');
      setModalVisible(false);
      form.resetFields();
      loadEvidences();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await evidenceApi.delete(id);
      message.success('删除成功');
      loadEvidences();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const renderType = (_, r) => {
    const type = EVIDENCE_TYPES.find(t => t.value === r.type);
    return type ? type.label : '';
  };

  const renderCaseNumber = (_, r) => {
    const caseItem = cases.find(c => c.id === r.case_id);
    return caseItem ? caseItem.case_number : '';
  };

  const columns = [
    { title: '证据名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '案件编号', key: 'case_number', width: 160, render: renderCaseNumber },
    { title: '类型', key: 'type', width: 120, render: renderType },
    { title: '证明目的', dataIndex: 'proof_purpose', key: 'proof_purpose' },
    { title: '关联诉求', dataIndex: 'claim_purpose', key: 'claim_purpose' },
    { title: '上传时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, r) => (
        <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(r.id)}>删除</Button>
      )
    }
  ];

  return (
    <Card
      title="证据中心"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          添加证据
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={evidences}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="添加证据"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="case_id" label="所属案件" rules={[{ required: true }]}>
            <Select>
              {cases.map(c => <Option key={c.id} value={c.id}>{c.case_number} - {c.client_name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="证据类型" rules={[{ required: true }]}>
            <Select>
              {EVIDENCE_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="证据名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="claim_purpose" label="关联诉求">
            <Input placeholder="关联的仲裁请求" />
          </Form.Item>
          <Form.Item name="proof_purpose" label="证明目的">
            <Input placeholder="证明的事实" />
          </Form.Item>
          <Form.Item name="description" label="证据描述">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default Evidence;
