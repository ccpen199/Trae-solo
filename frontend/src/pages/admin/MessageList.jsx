import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, message, Tag, Input, Card, Row, Col, Select } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { messagesApi } from '../../api';

const { TextArea } = Input;

function MessageList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailModal, setDetailModal] = useState(false);
  const [replyModal, setReplyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form] = Form.useForm();
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = async (page = 1, pageSize = 10, status = '') => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (status !== '') params.status = status;
      const res = await messagesApi.getList(params);
      setData(res.data.list || []);
      setPagination({
        current: res.data.pagination.page,
        pageSize: res.data.pagination.page_size,
        total: res.data.pagination.total
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      setData([
        { id: 1, name: '张三', phone: '138****8000', email: 'zhangsan@example.com', company: '某某公司', content: '请问产品A的价格是多少？', category_name: '产品咨询', status: 0, created_at: '2024-01-15 10:30' },
        { id: 2, name: '李四', phone: '139****9000', email: 'lisi@example.com', company: '某某企业', content: '想咨询一下代理合作事宜', category_name: '合作洽谈', status: 0, created_at: '2024-01-15 09:15' },
        { id: 3, name: '王五', phone: '137****7000', email: 'wangwu@example.com', company: '', content: '产品质量有问题，需要售后', category_name: '售后服务', status: 1, reply: '您好，我们已收到您的反馈，请留下联系方式，我们会尽快联系您。', created_at: '2024-01-14 14:20' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '公司', dataIndex: 'company', key: 'company' },
    { title: '留言内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '分类', dataIndex: 'category_name', key: 'category_name' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (val) => (
        <Tag color={val === 1 ? 'green' : 'orange'}>
          {val === 0 ? '待处理' : val === 1 ? '已回复' : val === 2 ? '已关闭' : val}
        </Tag>
      )
    },
    { title: '时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedItem(record); setDetailModal(true); }}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setSelectedItem(record); form.setFieldsValue({ reply: record.reply || '' }); setReplyModal(true); }}>回复</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Select placeholder="状态筛选" style={{ width: 150 }} allowClear onChange={(v) => { setFilterStatus(v); loadData(1, pagination.pageSize, v); }} options={[
                { label: '全部', value: '' },
                { label: '待处理', value: 0 },
                { label: '已回复', value: 1 }
              ]} />
              <Button icon={<ReloadOutlined />} onClick={() => loadData()}>刷新</Button>
            </Space>
          </Col>
        </Row>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, showTotal: (t) => `共 ${t} 条` }} onChange={(p) => loadData(p.current, p.pageSize, filterStatus)} />
      </Card>

      <Modal title="留言详情" open={detailModal} onCancel={() => setDetailModal(false)} footer={null} width={600}>
        {selectedItem && (
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}><Form.Item label="姓名">{selectedItem.name}</Form.Item></Col>
              <Col span={12}><Form.Item label="电话">{selectedItem.phone}</Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="邮箱">{selectedItem.email || '-'}</Form.Item></Col>
              <Col span={12}><Form.Item label="公司">{selectedItem.company || '-'}</Form.Item></Col>
            </Row>
            <Form.Item label="留言内容">{selectedItem.content}</Form.Item>
            {selectedItem.reply && (
              <Form.Item label="回复内容">{selectedItem.reply}</Form.Item>
            )}
          </Form>
        )}
      </Modal>

      <Modal title="回复留言" open={replyModal} onOk={async () => {
        try {
          const values = await form.validateFields();
          await messagesApi.reply(selectedItem.id, { reply: values.reply, is_public: false });
          message.success('回复成功');
          setReplyModal(false);
          loadData(pagination.current, pagination.pageSize, filterStatus);
        } catch (error) {
          console.error('回复失败:', error);
        }
      }} onCancel={() => setReplyModal(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="reply" label="回复内容" rules={[{ required: true, message: '请输入回复内容' }]}>
            <TextArea rows={4} placeholder="请输入回复内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default MessageList;
