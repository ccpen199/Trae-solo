import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message, Tag, Switch, Popconfirm, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { newsApi } from '../../api';

const { TextArea } = Input;

function NewsList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [categoryList, setCategoryList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const loadCategories = async () => {
    try {
      const res = await newsApi.getCategories();
      setCategoryList(res.data || []);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadData = async (page = 1, pageSize = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      const res = await newsApi.getAdminList(params);
      setData(res.data.list || []);
      setPagination({
        current: res.data.pagination.page,
        pageSize: res.data.pagination.page_size,
        total: res.data.pagination.total
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      setData([
        { id: 1, title: '公司新产品发布会成功举办', category_name: '企业新闻', is_recommended: true, is_top: true, status: 1, view_count: 128, publish_date: '2024-01-15' },
        { id: 2, title: '2024年度年会精彩回顾', category_name: '企业新闻', is_recommended: true, is_top: false, status: 1, view_count: 256, publish_date: '2024-01-12' },
        { id: 3, title: '行业动态：新技术发展趋势', category_name: '行业动态', is_recommended: false, is_top: false, status: 1, view_count: 89, publish_date: '2024-01-10' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadData();
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '分类', dataIndex: 'category_name', key: 'category_name' },
    { title: '推荐', dataIndex: 'is_recommended', key: 'is_recommended', render: (val) => <Tag color={val ? 'green' : 'default'}>{val ? '是' : '否'}</Tag> },
    { title: '置顶', dataIndex: 'is_top', key: 'is_top', render: (val) => <Tag color={val ? 'red' : 'default'}>{val ? '是' : '否'}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (val) => <Tag color={val === 1 ? 'green' : 'red'}>{val === 1 ? '已发布' : '草稿'}</Tag> },
    { title: '浏览量', dataIndex: 'view_count', key: 'view_count' },
    { title: '发布日期', dataIndex: 'publish_date', key: 'publish_date' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingItem(record); form.setFieldsValue(record); setModalVisible(true); }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => newsApi.delete(record.id).then(() => { message.success('删除成功'); loadData(); })}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
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
              <Input.Search placeholder="搜索标题" style={{ width: 300 }} onSearch={(v) => { setSearchKeyword(v); loadData(1, pagination.pageSize, v); }} />
              <Button icon={<ReloadOutlined />} onClick={() => loadData()}>刷新</Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }}>添加新闻</Button>
          </Col>
        </Row>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, showTotal: (t) => `共 ${t} 条` }} onChange={(p) => loadData(p.current, p.pageSize, searchKeyword)} />
      </Card>

      <Modal title={editingItem ? '编辑新闻' : '添加新闻'} open={modalVisible} onOk={async () => {
        try {
          const values = await form.validateFields();
          if (editingItem) {
            await newsApi.update(editingItem.id, values);
            message.success('更新成功');
          } else {
            await newsApi.create(values);
            message.success('创建成功');
          }
          setModalVisible(false);
          loadData(pagination.current, pagination.pageSize, searchKeyword);
        } catch (error) {
          console.error('提交失败:', error);
        }
      }} onCancel={() => setModalVisible(false)} width={800}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}><Input placeholder="请输入标题" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category_id" label="分类"><Select placeholder="请选择分类" options={categoryList.map(c => ({ label: c.name, value: c.id }))} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="summary" label="摘要"><TextArea rows={2} placeholder="请输入摘要" /></Form.Item>
          <Form.Item name="content" label="内容"><TextArea rows={6} placeholder="请输入内容" /></Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="author" label="作者"><Input placeholder="请输入作者" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="source" label="来源"><Input placeholder="请输入来源" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态" initialValue={1}><Select options={[{ label: '已发布', value: 1 }, { label: '草稿', value: 0 }]} /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_recommended" label="推荐" valuePropName="checked"><Switch /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_top" label="置顶" valuePropName="checked"><Switch /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="keywords" label="关键词"><Input placeholder="多个关键词用逗号分隔" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default NewsList;
