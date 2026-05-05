import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Space, Divider, Row, Col, Modal } from 'antd';
import { FileAddOutlined, CheckCircleOutlined, LeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { documentApi, authApi } from '../services/api';
import { Document, User } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const DocumentCreate: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [savedDocument, setSavedDocument] = useState<Document | null>(null);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [selectedApprovers, setSelectedApprovers] = useState<number[]>([]);
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    fetchUsers();
    if (params.id) {
      fetchDocument(parseInt(params.id));
      setIsEdit(true);
    }
  }, [params.id]);

  const fetchUsers = async () => {
    try {
      const response = await authApi.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  const fetchDocument = async (id: number) => {
    setLoading(true);
    try {
      const response = await documentApi.getById(id);
      const doc = response.document;
      if (doc) {
        setSavedDocument(doc);
        setDocumentId(id);
        form.setFieldsValue({
          title: doc.title,
          content: doc.content,
          category: doc.category,
          security_level: doc.security_level,
          document_type: doc.document_type,
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取公文详情失败');
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (values: any) => {
    setLoading(true);
    try {
      let response;
      if (isEdit && savedDocument && savedDocument.status === '草稿') {
        response = await documentApi.update(savedDocument.id, values);
        message.success('公文保存成功');
      } else {
        response = await documentApi.create(values);
        message.success('公文创建成功');
        setDocumentId(response.document?.id || null);
        setSavedDocument(response.document || null);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!documentId && !savedDocument) {
      message.warning('请先保存公文');
      return;
    }
    setSubmitModalVisible(true);
  };

  const confirmSubmit = async () => {
    if (selectedApprovers.length === 0) {
      message.warning('请选择审批人');
      return;
    }

    setSubmitting(true);
    try {
      const response = await documentApi.submit(
        documentId || savedDocument!.id,
        selectedApprovers
      );
      message.success('公文提交成功，已进入审批流程');
      setSubmitModalVisible(false);
      navigate('/documents');
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: '通知', label: '通知' },
    { value: '公告', label: '公告' },
    { value: '请示', label: '请示' },
    { value: '报告', label: '报告' },
    { value: '批复', label: '批复' },
    { value: '意见', label: '意见' },
    { value: '函', label: '函' },
    { value: '纪要', label: '纪要' },
  ];

  const securityLevelOptions = [
    { value: '普通', label: '普通' },
    { value: '秘密', label: '秘密' },
    { value: '机密', label: '机密' },
    { value: '绝密', label: '绝密' },
  ];

  const documentTypeOptions = [
    { value: '发文', label: '发文' },
    { value: '收文', label: '收文' },
  ];

  return (
    <div>
      <Button
        icon={<LeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate(-1)}
      >
        返回
      </Button>

      <Card
        title={
          <Space>
            <FileAddOutlined />
            {isEdit ? '编辑公文' : '新建公文'}
          </Space>
        }
      >
        {savedDocument && savedDocument.status !== '草稿' && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <Row gutter={16}>
              <Col span={8}>
                <strong>公文编号：</strong>{savedDocument.document_number}
              </Col>
              <Col span={8}>
                <strong>当前状态：</strong>{savedDocument.status}
              </Col>
              <Col span={8}>
                <strong>创建时间：</strong>{dayjs(savedDocument.created_at).format('YYYY-MM-DD HH:mm')}
              </Col>
            </Row>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onSave}
          initialValues={{
            security_level: '普通',
            document_type: '发文',
          }}
        >
          <Form.Item
            name="title"
            label="公文标题"
            rules={[{ required: true, message: '请输入公文标题' }]}
          >
            <Input placeholder="请输入公文标题" disabled={savedDocument && savedDocument.status !== '草稿'} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="document_type"
                label="公文类型"
                rules={[{ required: true, message: '请选择公文类型' }]}
              >
                <Select placeholder="请选择公文类型" disabled={savedDocument && savedDocument.status !== '草稿'}>
                  {documentTypeOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="公文类别"
                rules={[{ required: true, message: '请选择公文类别' }]}
              >
                <Select placeholder="请选择公文类别" disabled={savedDocument && savedDocument.status !== '草稿'}>
                  {categoryOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="security_level"
                label="密级"
                rules={[{ required: true, message: '请选择密级' }]}
              >
                <Select placeholder="请选择密级" disabled={savedDocument && savedDocument.status !== '草稿'}>
                  {securityLevelOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="公文正文"
            rules={[{ required: true, message: '请输入公文正文' }]}
          >
            <TextArea
              rows={12}
              placeholder="请输入公文正文内容"
              disabled={savedDocument && savedDocument.status !== '草稿'}
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={savedDocument && savedDocument.status !== '草稿'}
              >
                保存草稿
              </Button>
              {(savedDocument && savedDocument.status === '草稿') || !isEdit ? (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  提交审批
                </Button>
              ) : null}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="选择审批人"
        open={submitModalVisible}
        onOk={confirmSubmit}
        onCancel={() => setSubmitModalVisible(false)}
        confirmLoading={submitting}
        okText="确认提交"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <p>请选择审批流程中的审批人（按选择顺序排列）：</p>
        </div>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="请选择审批人"
          value={selectedApprovers}
          onChange={(values) => setSelectedApprovers(values)}
          optionFilterProp="children"
        >
          {users.map(user => (
            <Option key={user.id} value={user.id}>
              {user.name} ({user.department} - {user.role === 'admin' ? '管理员' : user.role === 'approver' ? '审批人' : '普通用户'})
            </Option>
          ))}
        </Select>
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          提示：审批人将按照您选择的顺序依次审批
        </div>
      </Modal>
    </div>
  );
};

export default DocumentCreate;
