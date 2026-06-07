import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { discoverAPI } from '../../api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

function Content() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await discoverAPI.articles({ page: 1, limit: 100 });
      setArticles(res.articles || []);
    } catch (err) {
      message.error('加载文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      await discoverAPI.createArticle(values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadArticles();
    } catch (err) {
      message.error('创建失败');
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (v) => v === 'pgc' ? <Tag color="blue">PGC</Tag> : <Tag color="green">UGC</Tag>
    },
    { title: '作者', dataIndex: 'author', key: 'author' },
    { title: '浏览', dataIndex: 'view_count', key: 'view_count' },
    { title: '点赞', dataIndex: 'like_count', key: 'like_count' },
    { title: '标签', dataIndex: 'tags', key: 'tags', render: (v) => v ? v.split(',').map(t => <Tag key={t}>{t}</Tag>) : '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v) => dayjs(v).format('YYYY-MM-DD') }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>内容管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建文章
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={articles}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="新建文章"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="文章标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="内容类型" initialValue="pgc">
            <Select>
              <Option value="pgc">官方资讯(PGC)</Option>
              <Option value="ugc">用户内容(UGC)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="author" label="作者">
            <Input />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>
          <Form.Item name="content" label="文章内容" rules={[{ required: true }]}>
            <TextArea rows={10} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>发布</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Content;
