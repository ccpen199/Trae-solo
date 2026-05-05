import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, message, Tag, Input, Card, Row, Col, Select } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { jobsApi } from '../../api';

const { TextArea } = Input;

function ResumeList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailModal, setDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = async (page = 1, pageSize = 10, status = '') => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (status !== '') params.status = status;
      const res = await jobsApi.getResumes(params);
      setData(res.data.list || []);
      setPagination({
        current: res.data.pagination.page,
        pageSize: res.data.pagination.page_size,
        total: res.data.pagination.total
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      setData([
        { id: 1, name: '张三', phone: '138****8000', email: 'zhangsan@example.com', job_title: '高级前端工程师', gender: '男', age: 28, education: '本科', work_experience: 5, status: 0, created_at: '2024-01-15 10:30' },
        { id: 2, name: '李四', phone: '139****9000', email: 'lisi@example.com', job_title: '产品经理', gender: '女', age: 26, education: '硕士', work_experience: 3, status: 1, created_at: '2024-01-15 09:15' },
      ]);
      setPagination(prev => ({ ...prev, total: 2 }));
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
    { title: '应聘职位', dataIndex: 'job_title', key: 'job_title' },
    { title: '性别', dataIndex: 'gender', key: 'gender' },
    { title: '年龄', dataIndex: 'age', key: 'age' },
    { title: '学历', dataIndex: 'education', key: 'education' },
    { title: '工作经验', dataIndex: 'work_experience', key: 'work_experience', render: (val) => `${val}年` },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (val) => {
        const colors = { 0: 'orange', 1: 'blue', 2: 'green', 3: 'red' };
        const labels = { 0: '待查看', 1: '已查看', 2: '已面试', 3: '已拒绝' };
        return <Tag color={colors[val] || 'default'}>{labels[val] || val}</Tag>;
      }
    },
    { title: '投递时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedItem(record); setDetailModal(true); }}>查看</Button>
          <Select style={{ width: 100 }} value={undefined} placeholder="更新状态" onChange={(v) => {
            jobsApi.updateResumeStatus(record.id, { status: v }).then(() => {
              message.success('状态更新成功');
              loadData();
            });
          }} options={[
            { label: '待查看', value: 0 },
            { label: '已查看', value: 1 },
            { label: '已面试', value: 2 },
            { label: '已拒绝', value: 3 }
          ]} />
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
                { label: '待查看', value: 0 },
                { label: '已查看', value: 1 },
                { label: '已面试', value: 2 },
                { label: '已拒绝', value: 3 }
              ]} />
              <Button icon={<ReloadOutlined />} onClick={() => loadData()}>刷新</Button>
            </Space>
          </Col>
        </Row>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, showTotal: (t) => `共 ${t} 条` }} onChange={(p) => loadData(p.current, p.pageSize, filterStatus)} />
      </Card>

      <Modal title="简历详情" open={detailModal} onCancel={() => setDetailModal(false)} footer={null} width={700}>
        {selectedItem && (
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={8}><Form.Item label="姓名">{selectedItem.name}</Form.Item></Col>
              <Col span={8}><Form.Item label="电话">{selectedItem.phone}</Form.Item></Col>
              <Col span={8}><Form.Item label="邮箱">{selectedItem.email}</Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}><Form.Item label="应聘职位">{selectedItem.job_title || '-'}</Form.Item></Col>
              <Col span={6}><Form.Item label="性别">{selectedItem.gender || '-'}</Form.Item></Col>
              <Col span={6}><Form.Item label="年龄">{selectedItem.age ? `${selectedItem.age}岁` : '-'}</Form.Item></Col>
              <Col span={6}><Form.Item label="学历">{selectedItem.education || '-'}</Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="工作经验">{selectedItem.work_experience ? `${selectedItem.work_experience}年` : '-'}</Form.Item></Col>
              <Col span={12}><Form.Item label="投递时间">{selectedItem.created_at}</Form.Item></Col>
            </Row>
            <Form.Item label="自我介绍">{selectedItem.self_introduction || '-'}</Form.Item>
            <Form.Item label="工作经历">{selectedItem.work_history || '-'}</Form.Item>
            <Form.Item label="教育经历">{selectedItem.education_history || '-'}</Form.Item>
            <Form.Item label="技能">{selectedItem.skills || '-'}</Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}

export default ResumeList;
