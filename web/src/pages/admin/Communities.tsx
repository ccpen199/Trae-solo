import { useEffect, useState } from 'react';
import { Table, Card, Button, Modal, Form, Input, InputNumber, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, HomeOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

export default function AdminCommunities() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [projects, setProjects] = useState<Record<string, any[]>>({});
  const [communityModal, setCommunityModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [currentCommunityId, setCurrentCommunityId] = useState<string>('');
  const [communityForm] = Form.useForm();
  const [projectForm] = Form.useForm();

  const loadCommunities = () => {
    api.get('/communities').then((res) => setCommunities(res.data));
  };

  const loadProjects = async (communityId: string) => {
    const res = await api.get(`/communities/${communityId}/projects`);
    setProjects((p) => ({ ...p, [communityId]: res.data }));
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleSaveCommunity = async (values: any) => {
    try {
      if (editingCommunity) {
        await api.put(`/communities/${editingCommunity.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/communities', values);
        message.success('创建成功');
      }
      setCommunityModal(false);
      setEditingCommunity(null);
      communityForm.resetFields();
      loadCommunities();
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const handleSaveProject = async (values: any) => {
    try {
      if (editingProject) {
        await api.put(`/communities/${currentCommunityId}/projects/${editingProject.id}`, values);
        message.success('更新成功');
      } else {
        await api.post(`/communities/${currentCommunityId}/projects`, values);
        message.success('创建成功');
      }
      setProjectModal(false);
      setEditingProject(null);
      projectForm.resetFields();
      loadProjects(currentCommunityId);
      loadCommunities();
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const openEditCommunity = (record: any) => {
    setEditingCommunity(record);
    communityForm.setFieldsValue(record);
    setCommunityModal(true);
  };

  const openAddProject = (communityId: string, record?: any) => {
    setCurrentCommunityId(communityId);
    if (record) {
      setEditingProject(record);
      projectForm.setFieldsValue(record);
    } else {
      setEditingProject(null);
      projectForm.resetFields();
    }
    setProjectModal(true);
  };

  const communityColumns = [
    { title: '小区名称', dataIndex: 'name' },
    { title: '地址', dataIndex: 'address' },
    { title: '所在区域', render: (_: any, r: any) => `${r.city} ${r.district}` },
    { title: '楼栋数', dataIndex: 'totalBuildings', render: (v: number) => v || '-' },
    { title: '总户数', dataIndex: 'totalUnits', render: (v: number) => v || '-' },
    { title: '项目数量', dataIndex: 'projects', render: (p: any[]) => p?.length || 0 },
    { title: '创建时间', dataIndex: 'createdAt', render: (t: string) => dayjs(t).format('YYYY-MM-DD') },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditCommunity(record)}>编辑</Button>
          <Button type="link" size="small" icon={<HomeOutlined />} onClick={() => { loadProjects(record.id); }}>
            项目
          </Button>
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => openAddProject(record.id)}>
            加项目
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="小区管理"
        style={{ borderRadius: 12, marginBottom: 16 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCommunity(null); communityForm.resetFields(); setCommunityModal(true); }}>
          新增小区
        </Button>
      >
        <Table columns={communityColumns} dataSource={communities} rowKey="id" expandedRowRender={(record) => (
          <Table
            size="small"
            pagination={false}
            columns={[
              { title: '项目名称', dataIndex: 'name' },
              { title: '类型', dataIndex: 'type', render: (t: string) => ({ residential: '住宅', commercial: '商业', parking: '停车场', other: '其他' }[t] || t) },
              { title: '状态', dataIndex: 'status', render: (s: string) => s === 'active' ? <Tag color="green">启用</Tag> : <Tag>停用</Tag> },
              { title: '创建时间', dataIndex: 'createdAt', render: (t: string) => dayjs(t).format('YYYY-MM-DD') },
              {
                title: '操作',
                render: (_: any, p: any) => (
                  <Button type="link" size="small" onClick={() => openAddProject(record.id, p)}>编辑</Button>
                ),
              },
            ]}
            dataSource={projects[record.id] || []}
            rowKey="id"
          />
        )} />
      </Card>

      <Modal title={editingCommunity ? '编辑小区' : '新增小区'} open={communityModal} onCancel={() => setCommunityModal(false)} footer={null} width={600}>
        <Form form={communityForm} layout="vertical" onFinish={handleSaveCommunity}>
          <Form.Item label="小区名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="所在城市" name="city" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="所在区县" name="district" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="详细地址" name="address" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="开发商" name="developer">
            <Input />
          </Form.Item>
          <Form.Item label="建成年份" name="buildYear">
            <InputNumber min={1900} max={2100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="楼栋总数" name="totalBuildings">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="总户数" name="totalUnits">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="小区介绍" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>{editingCommunity ? '保存' : '创建'}</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={editingProject ? '编辑项目' : '新增项目'} open={projectModal} onCancel={() => setProjectModal(false)} footer={null}>
        <Form form={projectForm} layout="vertical" onFinish={handleSaveProject}>
          <Form.Item label="项目名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="如：1号楼、A座" />
          </Form.Item>
          <Form.Item label="项目类型" name="type" initialValue="residential" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="状态" name="status" initialValue="active">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>{editingProject ? '保存' : '创建'}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
