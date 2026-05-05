import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Tag,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message
} from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { feedbackApi } from '../services/api';
import { useUserStore } from '../store/userStore';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const getStatusTag = (status) => {
  const statusMap = {
    PENDING: { text: '待处理', color: 'orange' },
    PROCESSING: { text: '处理中', color: 'blue' },
    RESOLVED: { text: '已解决', color: 'green' },
    CLOSED: { text: '已关闭', color: 'default' }
  };
  const config = statusMap[status] || { text: status, color: 'default' };
  return <Tag color={config.color}>{config.text}</Tag>;
};

const getPriorityText = (priority) => {
  const priorityMap = {
    1: '一般',
    2: '重要',
    3: '紧急'
  };
  return priorityMap[priority] || '一般';
};

const Feedbacks = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [form] = Form.useForm();
  const [processForm] = Form.useForm();
  const { isTeacher } = useUserStore();
  const canProcess = isTeacher();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await feedbackApi.getList({});
      setData(result.data.list);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    form.resetFields();
    setCurrentFeedback(null);
    setModalVisible(true);
  };

  const handleDetail = (record) => {
    setCurrentFeedback(record);
    setDetailVisible(true);
    processForm.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      await feedbackApi.create({
        ...values,
        priority: values.priority || 1,
        isAnonymous: values.isAnonymous || false
      });
      message.success('反馈已提交');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  const handleProcess = async (values) => {
    try {
      await feedbackApi.process(currentFeedback.id, values);
      message.success('处理完成');
      setDetailVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to process:', error);
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: getPriorityText
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    },
    {
      title: '提交人',
      dataIndex: ['author', 'name'],
      key: 'author',
      render: (text, record) => record.isAnonymous ? '匿名' : (text || '-')
    },
    {
      title: '处理人',
      dataIndex: ['processor', 'name'],
      key: 'processor',
      render: (text) => text || '-'
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
          查看
        </Button>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>意见箱</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          提交反馈
        </Button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : data.length > 0 ? (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="暂无反馈记录" />
        )}
      </div>

      <Modal
        title="提交反馈"
        open={modalVisible}
        width={600}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="form-modal"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入反馈标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="反馈内容"
            rules={[{ required: true, message: '请输入反馈内容' }]}
          >
            <TextArea rows={6} placeholder="请详细描述您的反馈或建议" />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
          >
            <Select placeholder="请选择优先级">
              <Option value={1}>一般</Option>
              <Option value={2}>重要</Option>
              <Option value={3}>紧急</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isAnonymous"
            label="是否匿名"
            valuePropName="checked"
          >
            <Select>
              <Option value={false}>实名</Option>
              <Option value={true}>匿名</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="反馈详情"
        open={detailVisible}
        width={700}
        onCancel={() => setDetailVisible(false)}
        footer={null}
      >
        {currentFeedback && (
          <div>
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
              <h4 style={{ marginBottom: 12 }}>{currentFeedback.title}</h4>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                <Space>
                  <span>优先级：{getPriorityText(currentFeedback.priority)}</span>
                  <span>|</span>
                  <span>状态：{getStatusTag(currentFeedback.status)}</span>
                  <span>|</span>
                  <span>提交人：{currentFeedback.isAnonymous ? '匿名' : (currentFeedback.author?.name || '-')}</span>
                  <span>|</span>
                  <span>{dayjs(currentFeedback.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                </Space>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>反馈内容：</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {currentFeedback.content}
              </div>
            </div>

            {currentFeedback.response && (
              <div style={{ marginBottom: 16, padding: 16, background: '#f6ffed', borderRadius: 4 }}>
                <div style={{ fontWeight: 500, marginBottom: 8, color: '#52c41a' }}>
                  处理人：{currentFeedback.processor?.name}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {currentFeedback.response}
                </div>
              </div>
            )}

            {canProcess && currentFeedback.status !== 'CLOSED' && (
              <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <Form
                  form={processForm}
                  layout="vertical"
                  onFinish={handleProcess}
                >
                  <Form.Item
                    name="status"
                    label="处理状态"
                    rules={[{ required: true, message: '请选择状态' }]}
                  >
                    <Select placeholder="请选择状态">
                      <Option value="PROCESSING">处理中</Option>
                      <Option value="RESOLVED">已解决</Option>
                      <Option value="CLOSED">已关闭</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="response"
                    label="回复内容"
                  >
                    <TextArea rows={3} placeholder="请输入回复内容" />
                  </Form.Item>

                  <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit">
                      提交处理
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Feedbacks;
