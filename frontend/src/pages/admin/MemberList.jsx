import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, message, Tag, Input, Card, Row, Col, Select } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { membersApi } from '../../api';

function MemberList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailModal, setDetailModal] = useState(false);
  const [auditModal, setAuditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form] = Form.useForm();
  const [memberTypes, setMemberTypes] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = async (page = 1, pageSize = 10, keyword = '', status = '') => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      if (status !== '') params.status = status;
      const res = await membersApi.getList(params);
      setData(res.data.list || []);
      setPagination({
        current: res.data.pagination.page,
        pageSize: res.data.pagination.page_size,
        total: res.data.pagination.total
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      setData([
        { id: 1, username: 'user001', real_name: '张三', email: 'zhangsan@example.com', phone: '138****8000', company_name: '某某公司', member_type_name: '普通会员', status: 1, last_login_at: '2024-01-15 10:30', created_at: '2024-01-01' },
        { id: 2, username: 'user002', real_name: '李四', email: 'lisi@example.com', phone: '139****9000', company_name: '某某企业', member_type_name: 'VIP会员', status: 0, last_login_at: null, created_at: '2024-01-10' },
        { id: 3, username: 'user003', real_name: '王五', email: 'wangwu@example.com', phone: '137****7000', company_name: '', member_type_name: '经销商', status: 1, last_login_at: '2024-01-14 14:20', created_at: '2023-12-20' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  };

  const loadMemberTypes = async () => {
    try {
      const res = await membersApi.getTypes();
      setMemberTypes(res.data || []);
    } catch (error) {
      console.error('加载会员类型失败:', error);
      setMemberTypes([
        { id: 1, name: '普通会员' },
        { id: 2, name: 'VIP会员' },
        { id: 3, name: '经销商' }
      ]);
    }
  };

  useEffect(() => {
    loadData();
    loadMemberTypes();
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '真实姓名', dataIndex: 'real_name', key: 'real_name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '公司名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '会员类型', dataIndex: 'member_type_name', key: 'member_type_name' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (val) => {
        const colors = { 0: 'orange', 1: 'green', 2: 'red' };
        const labels = { 0: '待审核', 1: '已通过', 2: '已禁用' };
        return <Tag color={colors[val] || 'default'}>{labels[val] || val}</Tag>;
      }
    },
    { title: '最后登录', dataIndex: 'last_login_at', key: 'last_login_at', render: (val) => val || '-' },
    { title: '注册时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedItem(record); setDetailModal(true); }}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setSelectedItem(record); form.setFieldsValue({ status: record.status, member_type_id: record.member_type_id }); setAuditModal(true); }}>审核</Button>
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
              <Input.Search placeholder="搜索用户名/姓名/电话/邮箱" style={{ width: 300 }} onSearch={(v) => { setSearchKeyword(v); loadData(1, pagination.pageSize, v, filterStatus); }} />
              <Select placeholder="状态筛选" style={{ width: 120 }} allowClear onChange={(v) => { setFilterStatus(v); loadData(1, pagination.pageSize, searchKeyword, v); }} options={[
                { label: '全部', value: '' },
                { label: '待审核', value: 0 },
                { label: '已通过', value: 1 },
                { label: '已禁用', value: 2 }
              ]} />
              <Button icon={<ReloadOutlined />} onClick={() => loadData()}>刷新</Button>
            </Space>
          </Col>
        </Row>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, showTotal: (t) => `共 ${t} 条` }} onChange={(p) => loadData(p.current, p.pageSize, searchKeyword, filterStatus)} />
      </Card>

      <Modal title="会员详情" open={detailModal} onCancel={() => setDetailModal(false)} footer={null} width={600}>
        {selectedItem && (
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}><Form.Item label="用户名">{selectedItem.username}</Form.Item></Col>
              <Col span={12}><Form.Item label="真实姓名">{selectedItem.real_name || '-'}</Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="邮箱">{selectedItem.email}</Form.Item></Col>
              <Col span={12}><Form.Item label="电话">{selectedItem.phone || '-'}</Form.Item></Col>
            </Row>
            <Form.Item label="公司名称">{selectedItem.company_name || '-'}</Form.Item>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="会员类型">{selectedItem.member_type_name || '-'}</Form.Item></Col>
              <Col span={12}><Form.Item label="状态">
                <Tag color={selectedItem.status === 0 ? 'orange' : selectedItem.status === 1 ? 'green' : 'red'}>
                  {selectedItem.status === 0 ? '待审核' : selectedItem.status === 1 ? '已通过' : '已禁用'}
                </Tag>
              </Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="最后登录">{selectedItem.last_login_at || '-'}</Form.Item></Col>
              <Col span={12}><Form.Item label="注册时间">{selectedItem.created_at}</Form.Item></Col>
            </Row>
          </Form>
        )}
      </Modal>

      <Modal title="审核会员" open={auditModal} onOk={async () => {
        try {
          const values = await form.validateFields();
          await membersApi.audit(selectedItem.id, values);
          message.success('审核成功');
          setAuditModal(false);
          loadData(pagination.current, pagination.pageSize, searchKeyword, filterStatus);
        } catch (error) {
          console.error('审核失败:', error);
        }
      }} onCancel={() => setAuditModal(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="审核状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态" options={[
              { label: '审核通过', value: 1 },
              { label: '拒绝审核', value: 2 }
            ]} />
          </Form.Item>
          <Form.Item name="member_type_id" label="会员类型">
            <Select placeholder="请选择会员类型" options={memberTypes.map(t => ({ label: t.name, value: t.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default MemberList;
