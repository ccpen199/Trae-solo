import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Input, Select, message, Card, Tag } from 'antd';
import { PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import { documentApi, caseApi, userApi } from '../api';

const { TextArea } = Input;
const { Option } = Select;

const DOCUMENT_TYPES = [
  { value: 'application', label: '仲裁申请书' },
  { value: 'response', label: '答辩书' },
  { value: 'evidence_list', label: '证据目录' },
  { value: 'opinion', label: '代理意见' },
  { value: 'other', label: '其他' }
];

const STATUS_MAP = {
  draft: { label: '草稿', color: 'default' },
  pending: { label: '待复核', color: 'orange' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已驳回', color: 'red' }
};

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    loadDocuments();
    loadCases();
    loadLawyers();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentApi.list();
      setDocuments(res.data);
    } catch (error) {
      message.error('加载文书失败');
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

  const loadLawyers = async () => {
    try {
      const res = await userApi.list({ role: 'lawyer' });
      setLawyers(res.data);
    } catch (error) {
      console.error('加载律师列表失败:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await documentApi.create({
        ...values,
        created_by: '系统'
      });
      message.success('文书创建成功');
      setModalVisible(false);
      form.resetFields();
      loadDocuments();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReview = (record) => {
    setSelectedDoc(record);
    reviewForm.resetFields();
    setReviewModalVisible(true);
  };

  const handleReviewSubmit = async (values) => {
    try {
      const lawyer = lawyers.find(l => l.id === values.reviewer_id);
      await documentApi.review(selectedDoc.id, {
        ...values,
        reviewer_name: lawyer ? lawyer.name : null
      });
      message.success('复核完成');
      setReviewModalVisible(false);
      loadDocuments();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleViewHistory = async (record) => {
    try {
      const res = await documentApi.history(record.id);
      setHistory(res.data);
      setHistoryModalVisible(true);
    } catch (error) {
      message.error('加载历史版本失败');
    }
  };

  const renderType = (_, r) => {
    const type = DOCUMENT_TYPES.find(t => t.value === r.type);
    return type ? type.label : '';
  };

  const renderStatus = (_, r) => {
    const status = STATUS_MAP[r.status];
    return status ? <Tag color={status.color}>{status.label}</Tag> : null;
  };

  const renderCaseNumber = (_, r) => {
    const caseItem = cases.find(c => c.id === r.case_id);
    return caseItem ? caseItem.case_number : '';
  };

  const columns = [
    { title: '文书标题', dataIndex: 'title', key: 'title', width: 200 },
    { title: '案件编号', key: 'case_number', width: 160, render: renderCaseNumber },
    { title: '类型', key: 'type', width: 120, render: renderType },
    { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
    { title: '状态', key: 'status', width: 100, render: renderStatus },
    { title: '创建人', dataIndex: 'created_by', key: 'created_by', width: 100 },
    { title: '复核人', dataIndex: 'reviewer_name', key: 'reviewer_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, r) => (
        <div>
          <Button size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(r)}>历史</Button>
          {r.status !== 'approved' && (
            <Button size="small" type="primary" style={{ marginLeft: 8 }} onClick={() => handleReview(r)}>复核</Button>
          )}
        </div>
      )
    }
  ];

  const historyColumns = [
    { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '状态', key: 'status', width: 100, render: renderStatus },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 }
  ];

  return (
    <Card
      title="文书流程"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建文书
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={documents}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1300 }}
      />

      <Modal
        title="新建文书"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="case_id" label="所属案件" rules={[{ required: true }]}>
            <Select>
              {cases.map(c => <Option key={c.id} value={c.id}>{c.case_number} - {c.client_name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="文书类型" rules={[{ required: true }]}>
            <Select>
              {DOCUMENT_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="文书标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="文书内容">
            <TextArea rows={10} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="复核文书"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={() => reviewForm.submit()}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
          <Form.Item name="reviewer_id" label="复核人" rules={[{ required: true }]}>
            <Select>
              {lawyers.map(l => <Option key={l.id} value={l.id}>{l.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="复核结果" rules={[{ required: true }]}>
            <Select>
              <Option value="approved">通过</Option>
              <Option value="rejected">驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="review_comment" label="复核意见">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="历史版本"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={700}
      >
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="id"
          pagination={false}
        />
      </Modal>
    </Card>
  );
}

export default Documents;
