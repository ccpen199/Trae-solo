import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message, Tag, Switch, Popconfirm, Card, Row, Col, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { jobsApi } from '../../api';

const { TextArea } = Input;

function JobList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');

  const loadData = async (page = 1, pageSize = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      const res = await jobsApi.getAdminList(params);
      setData(res.data.list || []);
      setPagination({
        current: res.data.pagination.page,
        pageSize: res.data.pagination.page_size,
        total: res.data.pagination.total
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      setData([
        { id: 1, title: '高级前端工程师', department: '技术部', location: '北京', salary_range: '20k-35k', job_type: '全职', is_recommended: true, status: 1, view_count: 128, publish_date: '2024-01-15' },
        { id: 2, title: '产品经理', department: '产品部', location: '北京', salary_range: '15k-25k', job_type: '全职', is_recommended: true, status: 1, view_count: 256, publish_date: '2024-01-12' },
        { id: 3, title: '销售专员', department: '销售部', location: '上海', salary_range: '8k-15k', job_type: '全职', is_recommended: false, status: 1, view_count: 89, publish_date: '2024-01-10' },
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
    { title: '职位名称', dataIndex: 'title', key: 'title' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '工作地点', dataIndex: 'location', key: 'location' },
    { title: '薪资范围', dataIndex: 'salary_range', key: 'salary_range' },
    { title: '工作类型', dataIndex: 'job_type', key: 'job_type' },
    { title: '推荐', dataIndex: 'is_recommended', key: 'is_recommended', render: (val) => <Tag color={val ? 'green' : 'default'}>{val ? '是' : '否'}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (val) => <Tag color={val === 1 ? 'green' : 'red'}>{val === 1 ? '招聘中' : '已关闭'}</Tag> },
    { title: '浏览量', dataIndex: 'view_count', key: 'view_count' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingItem(record); form.setFieldsValue(record); setModalVisible(true); }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => jobsApi.delete(record.id).then(() => { message.success('删除成功'); loadData(); })}>
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
              <Input.Search placeholder="搜索职位名称" style={{ width: 300 }} onSearch={(v) => { setSearchKeyword(v); loadData(1, pagination.pageSize, v); }} />
              <Button icon={<ReloadOutlined />} onClick={() => loadData()}>刷新</Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }}>添加职位</Button>
          </Col>
        </Row>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, showTotal: (t) => `共 ${t} 条` }} onChange={(p) => loadData(p.current, p.pageSize, searchKeyword)} />
      </Card>

      <Modal title={editingItem ? '编辑职位' : '添加职位'} open={modalVisible} onOk={async () => {
        try {
          const values = await form.validateFields();
          if (editingItem) {
            await jobsApi.update(editingItem.id, values);
            message.success('更新成功');
          } else {
            await jobsApi.create(values);
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
            <Col span={12}><Form.Item name="title" label="职位名称" rules={[{ required: true, message: '请输入职位名称' }]}><Input placeholder="请输入职位名称" /></Form.Item></Col>
            <Col span={12}><Form.Item name="department" label="所属部门"><Input placeholder="请输入所属部门" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="location" label="工作地点"><Input placeholder="请输入工作地点" /></Form.Item></Col>
            <Col span={8}><Form.Item name="salary_range" label="薪资范围"><Input placeholder="例如：15k-25k" /></Form.Item></Col>
            <Col span={8}><Form.Item name="job_type" label="工作类型"><Select placeholder="请选择工作类型" options={[{ label: '全职', value: '全职' }, { label: '兼职', value: '兼职' }, { label: '实习', value: '实习' }]} /></Form.Item></Col>
          </Row>
          <Form.Item name="requirements" label="任职要求"><TextArea rows={3} placeholder="请输入任职要求" /></Form.Item>
          <Form.Item name="responsibilities" label="岗位职责"><TextArea rows={3} placeholder="请输入岗位职责" /></Form.Item>
          <Form.Item name="benefits" label="福利待遇"><TextArea rows={2} placeholder="请输入福利待遇" /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="experience_requirement" label="经验要求"><Input placeholder="例如：3-5年" /></Form.Item></Col>
            <Col span={8}><Form.Item name="education_requirement" label="学历要求"><Input placeholder="例如：本科及以上" /></Form.Item></Col>
            <Col span={8}><Form.Item name="status" label="状态" initialValue={1}><Select options={[{ label: '招聘中', value: 1 }, { label: '已关闭', value: 0 }]} /></Form.Item></Col>
          </Row>
          <Form.Item name="is_recommended" label="推荐职位" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default JobList;
