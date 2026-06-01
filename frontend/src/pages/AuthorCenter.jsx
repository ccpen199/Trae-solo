import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Table, Button, Modal, Form, Input, Select, Tag, Space, message, InputNumber } from 'antd';
import { BookOutlined, EditOutlined, PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import request from '../utils/request.js';

const { Sider, Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

function AuthorCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [novels, setNovels] = useState([]);
  const [novelModal, setNovelModal] = useState(false);
  const [chapterModal, setChapterModal] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [historyModal, setHistoryModal] = useState(false);
  const [chapterHistory, setChapterHistory] = useState([]);
  const [form] = Form.useForm();
  const [chapterForm] = Form.useForm();

  const menuItems = [
    { key: '/author/novels', icon: <BookOutlined />, label: '作品管理' },
    { key: '/author/chapters', icon: <EditOutlined />, label: '章节管理' },
  ];

  useEffect(() => {
    fetchNovels();
  }, []);

  const fetchNovels = async () => {
    const res = await request.get('/novels/author/my');
    setNovels(res);
  };

  const fetchChapters = async (novelId) => {
    const res = await request.get(`/chapters/novel/${novelId}`, { params: { pageSize: 1000 } });
    setChapters(res.list);
  };

  const handleCreateNovel = async (values) => {
    try {
      await request.post('/novels', values);
      message.success('创建成功');
      setNovelModal(false);
      form.resetFields();
      fetchNovels();
    } catch (e) {
      message.error(e.response?.data?.error || '创建失败');
    }
  };

  const handleCreateChapter = async (values) => {
    try {
      await request.post('/chapters', {
        ...values,
        novel_id: selectedNovel.id,
        word_count: values.content?.length || 0
      });
      message.success('创建成功');
      setChapterModal(false);
      chapterForm.resetFields();
      fetchChapters(selectedNovel.id);
    } catch (e) {
      message.error(e.response?.data?.error || '创建失败');
    }
  };

  const viewHistory = async (chapterId) => {
    const res = await request.get(`/chapters/${chapterId}/history`);
    setChapterHistory(res);
    setHistoryModal(true);
  };

  const novelColumns = [
    { title: '书名', dataIndex: 'title', key: 'title' },
    { title: '分类', dataIndex: 'category_name', key: 'category_name' },
    { title: '签约状态', dataIndex: 'sign_status', key: 'sign_status', render: s => <Tag color={s === 'signed' ? 'gold' : 'default'}>{s === 'signed' ? '已签约' : '未签约'}</Tag> },
    { title: '连载状态', dataIndex: 'serialize_status', key: 'serialize_status' },
    { title: '字数', dataIndex: 'word_count', key: 'word_count', render: w => `${(w / 10000).toFixed(1)}万` },
    { title: '章节数', dataIndex: 'chapter_count', key: 'chapter_count' },
    {
      title: '操作', key: 'action', render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => { setSelectedNovel(record); fetchChapters(record.id); navigate('/author/chapters'); }}>
            章节管理
          </Button>
        </Space>
      )
    }
  ];

  const chapterColumns = [
    { title: '序号', dataIndex: 'chapter_order', key: 'chapter_order' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '字数', dataIndex: 'word_count', key: 'word_count' },
    { title: '类型', dataIndex: 'is_free', key: 'is_free', render: f => f ? <Tag color="green">免费</Tag> : <Tag color="orange">收费</Tag> },
    { title: '价格', dataIndex: 'price', key: 'price', render: p => p ? `¥${p}` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    { title: '审核', dataIndex: 'audit_status', key: 'audit_status' },
    {
      title: '操作', key: 'action', render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => viewHistory(record.id)} icon={<HistoryOutlined />}>历史</Button>
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '80vh' }}>
      <Sider width={200} className="sidebar-menu">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ height: '100%' }}
        />
      </Sider>
      <Content style={{ padding: 24 }}>
        <Routes>
          <Route path="novels" element={
            <Card title="作品管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setNovelModal(true)}>新建作品</Button>}>
              <Table columns={novelColumns} dataSource={novels} rowKey="id" />
            </Card>
          } />
          <Route path="chapters" element={
            <Card title={selectedNovel ? `章节管理 - ${selectedNovel.title}` : '章节管理'} extra={
              <Space>
                <Button onClick={() => navigate('/author/novels')}>返回作品列表</Button>
                {selectedNovel && <Button type="primary" icon={<PlusOutlined />} onClick={() => setChapterModal(true)}>新建章节</Button>}
              </Space>
            }>
              {selectedNovel ? (
                <Table columns={chapterColumns} dataSource={chapters} rowKey="id" />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>请先选择一个作品</div>
              )}
            </Card>
          } />
          <Route path="/" element={null} />
        </Routes>
      </Content>

      <Modal title="新建作品" open={novelModal} onCancel={() => setNovelModal(false)} footer={null}>
        <Form form={form} onFinish={handleCreateNovel}>
          <Form.Item name="title" label="书名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category_id" label="分类">
            <Select>
              <Option value={1}>玄幻奇幻</Option>
              <Option value={2}>都市青春</Option>
              <Option value={3}>科幻未来</Option>
              <Option value={4}>历史军事</Option>
              <Option value={5}>游戏竞技</Option>
              <Option value={6}>灵异悬疑</Option>
              <Option value={7}>武侠仙侠</Option>
              <Option value={8}>言情小说</Option>
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="新建章节" open={chapterModal} onCancel={() => setChapterModal(false)} footer={null} width={800}>
        <Form form={chapterForm} onFinish={handleCreateChapter}>
          <Form.Item name="chapter_order" label="章节序号" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="title" label="章节标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="is_free" label="是否免费" initialValue={true}>
            <Select>
              <Option value={true}>免费</Option>
              <Option value={false}>收费</Option>
            </Select>
          </Form.Item>
          <Form.Item name="price" label="价格（元）" initialValue={0}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="发布状态" initialValue="draft">
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="published">立即发布</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="章节内容">
            <TextArea rows={15} placeholder="请输入章节内容..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="章节修改历史" open={historyModal} onCancel={() => setHistoryModal(false)} footer={null} width={700}>
        {chapterHistory.length > 0 ? (
          chapterHistory.map((h, i) => (
            <Card key={h.id} size="small" style={{ marginBottom: 12 }} title={`版本 ${chapterHistory.length - i} - ${h.created_at}`}>
              <p><strong>修改人:</strong> {h.modifier_name || '未知'}</p>
              <p><strong>原标题:</strong> {h.title}</p>
              <p><strong>原内容:</strong></p>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 150, overflow: 'auto' }}>
                {h.content}
              </div>
            </Card>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无修改历史</p>
        )}
      </Modal>
    </Layout>
  );
}

export default AuthorCenter;
