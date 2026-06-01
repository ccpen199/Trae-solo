import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Table, Button, Modal, Tag, Space, Statistic, Row, Col, message, Form, Select, Input } from 'antd';
import { DashboardOutlined, BookOutlined, EditOutlined, AlertOutlined, RiseOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import request from '../utils/request.js';

const { Sider, Content } = Layout;
const { Option } = Select;

function EditorCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({});
  const [novels, setNovels] = useState([]);
  const [pendingChapters, setPendingChapters] = useState([]);
  const [violations, setViolations] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [auditModal, setAuditModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [signModal, setSignModal] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [recModal, setRecModal] = useState(false);
  const [form] = Form.useForm();

  const menuItems = [
    { key: '/editor/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/editor/novels', icon: <BookOutlined />, label: '作品管理' },
    { key: '/editor/chapters', icon: <EditOutlined />, label: '章节审核' },
    { key: '/editor/violations', icon: <AlertOutlined />, label: '违规处理' },
    { key: '/editor/recommendations', icon: <RiseOutlined />, label: '推荐位管理' },
  ];

  useEffect(() => {
    fetchStats();
    fetchNovels();
    fetchPendingChapters();
    fetchViolations();
    fetchRecommendations();
  }, []);

  const fetchStats = async () => {
    const res = await request.get('/editor/statistics');
    setStats(res);
  };

  const fetchNovels = async () => {
    const res = await request.get('/editor/novels', { params: { pageSize: 100 } });
    setNovels(res.list);
  };

  const fetchPendingChapters = async () => {
    const res = await request.get('/editor/pending-chapters');
    setPendingChapters(res);
  };

  const fetchViolations = async () => {
    const res = await request.get('/editor/violations');
    setViolations(res);
  };

  const fetchRecommendations = async () => {
    const res = await request.get('/editor/recommendations');
    setRecommendations(res);
  };

  const handleAudit = async (values) => {
    try {
      await request.post(`/chapters/${selectedChapter.id}/audit`, values);
      message.success('审核完成');
      setAuditModal(false);
      fetchPendingChapters();
    } catch (e) {
      message.error('审核失败');
    }
  };

  const handleSign = async (values) => {
    try {
      await request.put(`/editor/novel/${selectedNovel.id}/sign`, values);
      message.success('签约状态更新成功');
      setSignModal(false);
      fetchNovels();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const handleAddRec = async (values) => {
    try {
      await request.post('/editor/recommendation', {
        ...values,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
      });
      message.success('推荐位添加成功');
      setRecModal(false);
      fetchRecommendations();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const novelColumns = [
    { title: '书名', dataIndex: 'title', key: 'title' },
    { title: '作者', dataIndex: 'author_name', key: 'author_name' },
    { title: '签约状态', dataIndex: 'sign_status', key: 'sign_status', render: s => <Tag color={s === 'signed' ? 'gold' : 'default'}>{s === 'signed' ? '已签约' : '未签约'}</Tag> },
    { title: '连载状态', dataIndex: 'serialize_status', key: 'serialize_status' },
    { title: '已发章节', dataIndex: 'published_chapters', key: 'published_chapters' },
    { title: '待审章节', dataIndex: 'pending_chapters', key: 'pending_chapters', render: n => n > 0 ? <Tag color="red">{n}</Tag> : '0' },
    {
      title: '操作', key: 'action', render: (_, record) => (
        <Button size="small" onClick={() => { setSelectedNovel(record); setSignModal(true); }}>
          签约管理
        </Button>
      )
    }
  ];

  const chapterColumns = [
    { title: '章节标题', dataIndex: 'title', key: 'title' },
    { title: '所属小说', dataIndex: 'novel_title', key: 'novel_title' },
    { title: '作者', dataIndex: 'author_name', key: 'author_name' },
    { title: '字数', dataIndex: 'word_count', key: 'word_count' },
    { title: '提交时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作', key: 'action', render: (_, record) => (
        <Space>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => { setSelectedChapter(record); setAuditModal(true); }}>
            审核
          </Button>
        </Space>
      )
    }
  ];

  const violationColumns = [
    { title: '类型', dataIndex: 'violation_type', key: 'violation_type' },
    { title: '涉及小说', dataIndex: 'novel_title', key: 'novel_title' },
    { title: '涉及章节', dataIndex: 'chapter_title', key: 'chapter_title' },
    { title: '用户', dataIndex: 'user_name', key: 'user_name' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    {
      title: '操作', key: 'action', render: (_, record) => (
        <Space>
          <Button size="small" type="primary">处理</Button>
        </Space>
      )
    }
  ];

  const recColumns = [
    { title: '推荐位', dataIndex: 'position', key: 'position' },
    { title: '小说', dataIndex: 'novel_title', key: 'novel_title' },
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time' },
    { title: '结束时间', dataIndex: 'end_time', key: 'end_time' },
    { title: '状态', dataIndex: 'status', key: 'status' },
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
          <Route path="dashboard" element={
            <div>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}><Card><Statistic title="作品总数" value={stats.totalNovels} /></Card></Col>
                <Col span={6}><Card><Statistic title="作者总数" value={stats.totalAuthors} /></Card></Col>
                <Col span={6}><Card><Statistic title="读者总数" value={stats.totalReaders} /></Card></Col>
                <Col span={6}><Card><Statistic title="待审核章节" value={stats.pendingChapters} valueStyle={{ color: '#faad14' }} /></Card></Col>
              </Row>
              <Card title="待审核章节">
                <Table columns={chapterColumns} dataSource={pendingChapters} rowKey="id" pagination={{ pageSize: 5 }} />
              </Card>
            </div>
          } />
          <Route path="novels" element={
            <Card title="作品管理">
              <Table columns={novelColumns} dataSource={novels} rowKey="id" />
            </Card>
          } />
          <Route path="chapters" element={
            <Card title="章节审核">
              <Table columns={chapterColumns} dataSource={pendingChapters} rowKey="id" />
            </Card>
          } />
          <Route path="violations" element={
            <Card title="违规处理">
              <Table columns={violationColumns} dataSource={violations} rowKey="id" />
            </Card>
          } />
          <Route path="recommendations" element={
            <Card title="推荐位管理" extra={<Button type="primary" onClick={() => setRecModal(true)}>添加推荐位</Button>}>
              <Table columns={recColumns} dataSource={recommendations} rowKey="id" />
            </Card>
          } />
          <Route path="/" element={null} />
        </Routes>
      </Content>

      <Modal title="章节审核" open={auditModal} onCancel={() => setAuditModal(false)} footer={null}>
        <div style={{ marginBottom: 16 }}>
          <p><strong>章节:</strong> {selectedChapter?.title}</p>
          <p><strong>小说:</strong> {selectedChapter?.novel_title}</p>
        </div>
        <Form onFinish={handleAudit}>
          <Form.Item name="audit_status" label="审核结果" rules={[{ required: true }]}>
            <Select>
              <Option value="approved">通过</Option>
              <Option value="rejected">驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="audit_remark" label="审核意见">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="签约管理" open={signModal} onCancel={() => setSignModal(false)} footer={null}>
        <p style={{ marginBottom: 16 }}><strong>作品:</strong> {selectedNovel?.title}</p>
        <Form onFinish={handleSign}>
          <Form.Item name="sign_status" label="签约状态" initialValue={selectedNovel?.sign_status} rules={[{ required: true }]}>
            <Select>
              <Option value="unsigned">未签约</Option>
              <Option value="signed">已签约</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加推荐位" open={recModal} onCancel={() => setRecModal(false)} footer={null}>
        <Form onFinish={handleAddRec}>
          <Form.Item name="position" label="推荐位置" rules={[{ required: true }]}>
            <Select>
              <Option value="home_banner">首页Banner</Option>
              <Option value="home_hot">首页热门</Option>
              <Option value="category_top">分类置顶</Option>
              <Option value="editor_recommend">编辑推荐</Option>
            </Select>
          </Form.Item>
          <Form.Item name="novel_id" label="选择小说" rules={[{ required: true }]}>
            <Select>
              {novels.map(n => <Option key={n.id} value={n.id}>{n.title}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>添加</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default EditorCenter;
