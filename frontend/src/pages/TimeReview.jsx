import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, message, Space, Tag, Input } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { timeEntriesAPI, usersAPI } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const TimeReview = () => {
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewingEntry, setReviewingEntry] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, usersData] = await Promise.all([
        timeEntriesAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setEntries(entriesData || []);
      setUsers(usersData || []);
    } catch (error) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const handleReview = (record, status) => {
    setReviewingEntry(record);
    form.resetFields();
    form.setFieldsValue({ status, reviewer_id: 1 });
    setReviewModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await timeEntriesAPI.review(reviewingEntry.id, values);
      message.success('审核完成');
      setReviewModalVisible(false);
      loadData();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const statusColors = { pending: 'orange', approved: 'green', rejected: 'red' };
  const statusLabels = { pending: '待审核', approved: '已通过', rejected: '已退回' };

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
    { title: '案件', dataIndex: 'matter_name', key: 'matter_name', width: 150, ellipsis: true },
    { title: '参与人', dataIndex: 'user_name', key: 'user_name', width: 100 },
    { title: '工作事项', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '工时(h)', dataIndex: 'hours', key: 'hours', width: 90 },
    { title: '是否计费', dataIndex: 'is_billable', key: 'is_billable', width: 100, render: v => v ? '是' : '否' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: status => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    { title: '审核人', dataIndex: 'reviewer_name', key: 'reviewer_name', width: 100 },
    { title: '审核备注', dataIndex: 'review_notes', key: 'review_notes', ellipsis: true },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="small"
            onClick={() => handleReview(record, 'approved')}
            disabled={record.status !== 'pending'}
            ghost
          >
            通过
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            size="small"
            onClick={() => handleReview(record, 'rejected')}
            disabled={record.status !== 'pending'}
            ghost
          >
            退回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">工时审核</h1>
      </div>

      <Table
        columns={columns}
        dataSource={entries}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1400 }}
      />

      <Modal
        title="审核工时"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        {reviewingEntry && (
          <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
            <p><strong>日期：</strong>{reviewingEntry.date}</p>
            <p><strong>参与人：</strong>{reviewingEntry.user_name}</p>
            <p><strong>案件：</strong>{reviewingEntry.matter_name}</p>
            <p><strong>工时：</strong>{reviewingEntry.hours}h</p>
            <p><strong>事项：</strong>{reviewingEntry.description}</p>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="status" label="审核结果" rules={[{ required: true }]}>
            <Select>
              <Option value="approved">通过</Option>
              <Option value="rejected">退回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reviewer_id" label="审核人" rules={[{ required: true }]}>
            <Select>
              {users.filter(u => u.role === 'partner' || u.role === 'admin').map(u =>
                <Option key={u.id} value={u.id}>{u.name}</Option>
              )}
            </Select>
          </Form.Item>
          <Form.Item name="review_notes" label="审核备注">
            <TextArea rows={3} placeholder="请输入审核意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimeReview;
