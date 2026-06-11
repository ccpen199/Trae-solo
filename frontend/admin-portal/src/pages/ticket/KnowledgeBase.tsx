import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, message, Popconfirm, Card, Tabs,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, BookOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface KnowledgeRecord {
  id: string;
  title: string;
  category: string;
  tags: string[];
  author: string;
  viewCount: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  content: string;
}

const mockData: KnowledgeRecord[] = [
  { id: 'KB001', title: '社保查询接口常见错误码说明', category: '技术文档', tags: ['社保', '接口', '错误码'], author: '李工', viewCount: 1280, status: 1, createdAt: '2025-01-15 09:00:00', updatedAt: '2025-06-01 10:00:00', content: '本文档汇总了社保查询接口的常见错误码及处理方法...' },
  { id: 'KB002', title: '补贴政策匹配规则说明', category: '业务指南', tags: ['补贴', '政策', '匹配'], author: '王工', viewCount: 890, status: 1, createdAt: '2025-02-01 10:00:00', updatedAt: '2025-05-28 14:00:00', content: '补贴政策匹配是基于申请人信息自动匹配适用政策的机制...' },
  { id: 'KB003', title: '证照核验流程及注意事项', category: '操作手册', tags: ['证照', '核验', '流程'], author: '赵工', viewCount: 650, status: 1, createdAt: '2025-02-15 08:00:00', updatedAt: '2025-05-20 09:00:00', content: '证照核验是通过对接公安、民政等部门数据源进行真实性校验的流程...' },
  { id: 'KB004', title: '服务监控告警处理SOP', category: '操作手册', tags: ['监控', '告警', 'SOP'], author: '孙工', viewCount: 430, status: 1, createdAt: '2025-03-01 11:00:00', updatedAt: '2025-06-05 16:00:00', content: '本文描述了服务监控告警的标准处理流程...' },
  { id: 'KB005', title: '数据脱敏规则配置指南', category: '技术文档', tags: ['脱敏', '数据', '配置'], author: '周工', viewCount: 320, status: 1, createdAt: '2025-03-15 14:00:00', updatedAt: '2025-05-15 11:00:00', content: '数据脱敏规则用于在数据共享过程中保护个人隐私信息...' },
  { id: 'KB006', title: '工单处理时效要求', category: '业务指南', tags: ['工单', '时效', 'SLA'], author: '吴工', viewCount: 210, status: 0, createdAt: '2025-04-01 09:00:00', updatedAt: '2025-04-10 10:00:00', content: '不同优先级工单的处理时效要求如下...' },
];

const categoryColor: Record<string, string> = { '技术文档': 'blue', '业务指南': 'green', '操作手册': 'orange' };

const KnowledgeBase: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<KnowledgeRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<KnowledgeRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) => {
    const matchSearch = !searchText || item.title.includes(searchText) || item.tags.some((t) => t.includes(searchText));
    const matchCategory = !categoryFilter || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: KnowledgeRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({ ...record, tags: record.tags.join(',') });
    setModalVisible(true);
  };

  const handleView = (record: KnowledgeRecord) => {
    setViewingRecord(record);
    setDetailVisible(true);
  };

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const tagsArr = typeof values.tags === 'string' ? values.tags.split(',').map((s: string) => s.trim()) : values.tags;
      if (editingRecord) {
        setData(data.map((item) => (item.id === editingRecord.id ? { ...item, ...values, tags: tagsArr, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') } : item)));
        message.success('更新成功');
      } else {
        const newRecord: KnowledgeRecord = {
          ...values,
          id: `KB${String(data.length + 1).padStart(3, '0')}`,
          tags: tagsArr,
          author: '当前用户',
          viewCount: 0,
          status: 1,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        setData([newRecord, ...data]);
        message.success('创建成功');
      }
      setModalVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '文档ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', width: 220, ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 100, render: (v: string) => <Tag color={categoryColor[v]}>{v}</Tag> },
    { title: '标签', dataIndex: 'tags', width: 220, render: (v: string[]) => v.map((t) => <Tag key={t}>{t}</Tag>) },
    { title: '作者', dataIndex: 'author', width: 80 },
    { title: '浏览量', dataIndex: 'viewCount', width: 80 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: number) => v === 1 ? <Tag color="success">已发布</Tag> : <Tag color="default">草稿</Tag>,
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
    {
      title: '操作', width: 220, fixed: 'right' as const,
      render: (_: unknown, record: KnowledgeRecord) => (
        <Space>
          <Button type="link" size="small" icon={<BookOutlined />} onClick={() => handleView(record)}>阅读</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <Input
              placeholder="搜索标题/标签"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="分类筛选"
              value={categoryFilter || undefined}
              onChange={setCategoryFilter}
              allowClear
              style={{ width: 120 }}
              options={['技术文档', '业务指南', '操作手册'].map((v) => ({ label: v, value: v }))}
            />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增文档</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1300 }}
        />
      </Card>
      <Modal title={viewingRecord?.title} open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={640}>
        {viewingRecord && (
          <div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Tag color={categoryColor[viewingRecord.category]}>{viewingRecord.category}</Tag>
              {viewingRecord.tags.map((t) => <Tag key={t}>{t}</Tag>)}
              <span style={{ color: '#999', fontSize: 12 }}>浏览 {viewingRecord.viewCount} · {viewingRecord.updatedAt}</span>
            </div>
            <div style={{ lineHeight: 1.8, color: '#333' }}>{viewingRecord.content}</div>
          </div>
        )}
      </Modal>
      <Modal
        title={editingRecord ? '编辑文档' : '新增文档'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 19 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['技术文档', '业务指南', '操作手册'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="tags" label="标签" extra="多个标签用英文逗号分隔">
            <Input placeholder="社保,接口,错误码" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入' }]}>
            <Input.TextArea rows={8} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeBase;
