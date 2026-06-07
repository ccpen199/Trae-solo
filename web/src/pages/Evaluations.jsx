import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Tag, Space, Row, Col, Rate, Modal, Form, Statistic, Spin, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { evaluations as evalApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function Evaluations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [ratingRange, setRatingRange] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [replyModal, setReplyModal] = useState(false);
  const [replyId, setReplyId] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyForm] = Form.useForm();
  const [stats, setStats] = useState({ avg_overall: 0, avg_speed: 0, avg_attitude: 0, avg_quality: 0, total: 0 });

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.current, page_size: pagination.pageSize };
      if (ratingRange) params.min_rating = ratingRange[0];
      const res = await evalApi.getEvaluations(params);
      const d = res.data?.data || res.data || {};
      setData(d.items || d.list || []);
      setPagination((prev) => ({ ...prev, total: d.total || 0 }));
      if (d.stats) setStats(d.stats);
    } catch {
      message.error('获取评价列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const openReply = (record) => {
    setReplyId(record.id);
    replyForm.resetFields();
    setReplyModal(true);
  };

  const handleReply = async () => {
    try {
      const values = await replyForm.validateFields();
      setReplyLoading(true);
      await evalApi.replyEvaluation(replyId, values);
      message.success('回复成功');
      setReplyModal(false);
      replyForm.resetFields();
      fetchData();
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || '操作失败');
      }
    } finally {
      setReplyLoading(false);
    }
  };

  const columns = [
    { title: '办件编号', dataIndex: 'case_no', key: 'case_no', width: 140 },
    { title: '评价人', dataIndex: 'evaluator_name', key: 'evaluator_name', width: 90 },
    {
      title: '总体评分',
      dataIndex: 'overall_rating',
      key: 'overall_rating',
      width: 140,
      render: (v) => <Rate disabled value={v} />,
    },
    {
      title: '速度',
      dataIndex: 'speed_rating',
      key: 'speed_rating',
      width: 130,
      render: (v) => <Rate disabled value={v} />,
    },
    {
      title: '态度',
      dataIndex: 'attitude_rating',
      key: 'attitude_rating',
      width: 130,
      render: (v) => <Rate disabled value={v} />,
    },
    {
      title: '质量',
      dataIndex: 'quality_rating',
      key: 'quality_rating',
      width: 130,
      render: (v) => <Rate disabled value={v} />,
    },
    { title: '评价内容', dataIndex: 'content', key: 'content', ellipsis: true, width: 150 },
    {
      title: '评价时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '回复',
      dataIndex: 'reply',
      key: 'reply',
      width: 120,
      render: (v) => v || <Tag>未回复</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        !record.reply ? (
          <Button type="link" size="small" onClick={() => openReply(record)}>
            回复
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="总体评分" value={stats.avg_overall || 0} suffix="/ 5" valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="速度评分" value={stats.avg_speed || 0} suffix="/ 5" valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="态度评分" value={stats.avg_attitude || 0} suffix="/ 5" valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="质量评分" value={stats.avg_quality || 0} suffix="/ 5" valueStyle={{ color: '#722ed1' }} /></Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Select placeholder="评分范围" value={ratingRange} onChange={setRatingRange} allowClear style={{ width: '100%' }}>
              <Option value={[4, 5]}>4-5分</Option>
              <Option value={[3, 5]}>3-5分</Option>
              <Option value={[1, 3]}>1-3分</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { setRatingRange(undefined); setDateRange(null); }}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          onChange={(pag) => setPagination({ current: pag.current, pageSize: pag.pageSize, total: pag.total })}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="回复评价"
        open={replyModal}
        onOk={handleReply}
        onCancel={() => { setReplyModal(false); replyForm.resetFields(); }}
        confirmLoading={replyLoading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={replyForm} layout="vertical">
          <Form.Item name="reply" label="回复内容" rules={[{ required: true, message: '请输入回复内容' }]}>
            <TextArea rows={4} placeholder="请输入回复内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
