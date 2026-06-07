import { useCallback, useEffect, useState } from 'react';
import {
  Button, Card, Col, Descriptions, Drawer, Form, Input, InputNumber, Modal, Radio, Row, Select, Space, Table, Tag, message,
} from 'antd';
import {
  EyeOutlined, PlusOutlined, HistoryOutlined, ExportOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/utils/api';

type DesignScheme = {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  designer_name?: string;
  style?: string;
  status: string;
  version: number;
  created_at: string;
};

type Annotation = {
  id: number;
  scheme_id: number;
  user_id: number;
  user_name: string;
  content: string;
  position_x: number;
  position_y: number;
  position_z: number;
  resolved: number;
  created_at: string;
};

type Version = {
  id: number;
  scheme_id: number;
  version_number: number;
  model_url: string;
  changes_description: string;
  created_at: string;
};

type Project = {
  id: number;
  title: string;
};

const statusColors: Record<string, string> = {
  draft: 'blue',
  review: 'orange',
  approved: 'green',
  rejected: 'red',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  review: '审核中',
  approved: '已通过',
  rejected: '已驳回',
};

const styleOptions = [
  { value: '现代简约', label: '现代简约' },
  { value: '北欧', label: '北欧' },
  { value: '中式', label: '中式' },
  { value: '美式', label: '美式' },
  { value: '日式', label: '日式' },
  { value: '轻奢', label: '轻奢' },
];

export default function DesignSchemes() {
  const [schemes, setSchemes] = useState<DesignScheme[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filterProject, setFilterProject] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentScheme, setCurrentScheme] = useState<DesignScheme | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);

  const [annoOpen, setAnnoOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [annoDesignId, setAnnoDesignId] = useState<number | null>(null);

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareVersion1, setCompareVersion1] = useState<Version | null>(null);
  const [compareVersion2, setCompareVersion2] = useState<Version | null>(null);

  const [newVersionOpen, setNewVersionOpen] = useState(false);
  const [newVersionSchemeId, setNewVersionSchemeId] = useState<number | null>(null);

  const [createForm] = Form.useForm();
  const [annoForm] = Form.useForm();
  const [newVersionForm] = Form.useForm();

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (filterProject) params.project_id = filterProject;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/designs', { params });
      const data = res.data.data;
      setSchemes(data.list || []);
      setTotal(data.total || 0);
    } catch {
      message.error('获取设计方案列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterProject, filterStatus]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects', { params: { pageSize: 100 } });
      setProjects(res.data.data.list || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  async function handleCreate(values: { project_id: number; title: string; description?: string; style?: string }) {
    try {
      await api.post('/designs', values);
      message.success('创建成功');
      setCreateOpen(false);
      createForm.resetFields();
      fetchSchemes();
    } catch {
      message.error('创建失败');
    }
  }

  async function handleViewDetail(record: DesignScheme) {
    setCurrentScheme(record);
    setDetailOpen(true);
    setAnnoDesignId(record.id);
    try {
      const [annoRes, verRes] = await Promise.all([
        api.get(`/designs/${record.id}/annotations`),
        api.get(`/designs/${record.id}/versions`),
      ]);
      setAnnotations(annoRes.data.data || []);
      setVersions(verRes.data.data || []);
    } catch {
      // silent
    }
  }

  async function handleAddAnnotation(values: { content: string; position_x: number; position_y: number; position_z: number }) {
    if (!annoDesignId) return;
    try {
      await api.post(`/designs/${annoDesignId}/annotations`, values);
      message.success('批注添加成功');
      setAnnoOpen(false);
      annoForm.resetFields();
      if (currentScheme?.id === annoDesignId) {
        const res = await api.get(`/designs/${annoDesignId}/annotations`);
        setAnnotations(res.data.data || []);
      }
    } catch {
      message.error('添加批注失败');
    }
  }

  async function handleViewVersions(record: DesignScheme) {
    setAnnoDesignId(record.id);
    setVersionOpen(true);
    try {
      const res = await api.get(`/designs/${record.id}/versions`);
      setVersions(res.data.data || []);
    } catch {
      // silent
    }
  }

  async function handleStatusChange(id: number, status: string) {
    try {
      await api.patch(`/designs/${id}`, { status });
      message.success('状态更新成功');
      fetchSchemes();
    } catch {
      message.error('状态更新失败');
    }
  }

  async function handleResolveAnnotation(annotationId: number) {
    if (!annoDesignId) return;
    try {
      await api.put(`/designs/${annoDesignId}/annotations/${annotationId}/resolve`);
      message.success('批注已标记为已解决');
      const res = await api.get(`/designs/${annoDesignId}/annotations`);
      setAnnotations(res.data.data || []);
    } catch {
      message.error('标记失败');
    }
  }

  async function handleCreateVersion(values: { model_url: string; changes_description: string }) {
    if (!newVersionSchemeId) return;
    try {
      await api.post(`/designs/${newVersionSchemeId}/versions`, values);
      message.success('版本创建成功');
      setNewVersionOpen(false);
      newVersionForm.resetFields();
      if (currentScheme?.id === newVersionSchemeId) {
        const res = await api.get(`/designs/${newVersionSchemeId}/versions`);
        setVersions(res.data.data || []);
      }
      fetchSchemes();
    } catch {
      message.error('创建版本失败');
    }
  }

  async function handleExport(id: number) {
    try {
      const res = await api.post(`/designs/${id}/export`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `design_${id}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('已导出设计方案包');
    } catch {
      message.error('导出失败');
    }
  }

  const columns: ColumnsType<DesignScheme> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '设计师', dataIndex: 'designer_name', key: 'designer_name', render: (v) => v || '-' },
    { title: '风格', dataIndex: 'style', key: 'style', render: (v) => v ? <Tag>{v}</Tag> : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={statusColors[v] || 'default'}>{statusLabels[v] || v}</Tag>,
    },
    { title: '版本', dataIndex: 'version', key: 'version', width: 70, render: (v) => `v${v}` },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setAnnoDesignId(record.id); setAnnoOpen(true); }}>批注</Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewVersions(record)}>版本</Button>
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => { setNewVersionSchemeId(record.id); setNewVersionOpen(true); }}>新建版本</Button>
          <Select
            size="small"
            value={record.status}
            style={{ width: 90 }}
            onChange={(val) => handleStatusChange(record.id, val)}
            options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
          />
          <Button type="link" size="small" icon={<ExportOutlined />} onClick={() => handleExport(record.id)}>导出</Button>
        </Space>
      ),
    },
  ];

  const annoColumns: ColumnsType<Annotation> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    { title: '批注人', dataIndex: 'user_name', key: 'user_name', width: 80, render: (v) => v || '-' },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '3D位置',
      key: 'position',
      width: 150,
      render: (_, r) => `(${r.position_x}, ${r.position_y}, ${r.position_z})`,
    },
    {
      title: '状态',
      dataIndex: 'resolved',
      key: 'resolved',
      width: 80,
      render: (v) => v === 1 ? <Tag color="green">已解决</Tag> : <Tag color="orange">待处理</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 90,
      render: (_, r) => (
        r.resolved !== 1 ? (
          <Button type="link" size="small" onClick={() => handleResolveAnnotation(r.id)}>标记解决</Button>
        ) : null
      ),
    },
  ];

  const versionColumns: ColumnsType<Version> = [
    { title: '版本', dataIndex: 'version_number', key: 'version_number', width: 70, render: (v) => `v${v}` },
    { title: '模型URL', dataIndex: 'model_url', key: 'model_url', ellipsis: true, render: (v) => v || '-' },
    { title: '变更说明', dataIndex: 'changes_description', key: 'changes_description', ellipsis: true, render: (v) => v || '-' },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  const compareVersionColumns: ColumnsType<Version> = [
    {
      title: '选择',
      key: 'select',
      width: 60,
      render: (_, r) => (
        <Radio
          checked={compareVersion1?.id === r.id}
          onChange={() => setCompareVersion1(r)}
        >V1</Radio>
      ),
    },
    {
      title: '选择',
      key: 'select2',
      width: 60,
      render: (_, r) => (
        <Radio
          checked={compareVersion2?.id === r.id}
          onChange={() => setCompareVersion2(r)}
        >V2</Radio>
      ),
    },
    { title: '版本', dataIndex: 'version_number', key: 'version_number', width: 70, render: (v) => `v${v}` },
    { title: '变更说明', dataIndex: 'changes_description', key: 'changes_description', ellipsis: true, render: (v) => v || '-' },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="设计方案管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建方案</Button>}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Select
              placeholder="选择项目"
              allowClear
              style={{ width: 200 }}
              value={filterProject}
              onChange={(v) => { setFilterProject(v); setPage(1); }}
              options={projects.map((p) => ({ value: p.id, label: p.title }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 140 }}
              value={filterStatus}
              onChange={(v) => { setFilterStatus(v); setPage(1); }}
              options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            />
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={schemes}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal title="新建设计方案" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => createForm.submit()}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" options={projects.map((p) => ({ value: p.id, label: p.title }))} />
          </Form.Item>
          <Form.Item name="title" label="方案标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入方案标题" />
          </Form.Item>
          <Form.Item name="description" label="方案描述">
            <Input.TextArea rows={3} placeholder="请输入方案描述" />
          </Form.Item>
          <Form.Item name="style" label="设计风格">
            <Select placeholder="请选择设计风格" options={styleOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="方案详情" width={640} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {currentScheme && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="ID">{currentScheme.id}</Descriptions.Item>
              <Descriptions.Item label="标题">{currentScheme.title}</Descriptions.Item>
              <Descriptions.Item label="设计师">{currentScheme.designer_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="风格">{currentScheme.style || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[currentScheme.status]}>{statusLabels[currentScheme.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="版本">v{currentScheme.version}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{currentScheme.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{currentScheme.created_at ? dayjs(currentScheme.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            </Descriptions>

            <Card title="批注列表" size="small" style={{ marginTop: 16 }} extra={<Button size="small" type="primary" onClick={() => { setAnnoDesignId(currentScheme.id); setAnnoOpen(true); }}>添加批注</Button>}>
              <Table rowKey="id" columns={annoColumns} dataSource={annotations} pagination={false} size="small" />
            </Card>

            <Card title="版本历史" size="small" style={{ marginTop: 16 }} extra={<Button size="small" type="primary" onClick={() => { setCompareVersion1(null); setCompareVersion2(null); setCompareOpen(true); }}>版本对比</Button>}>
              <Table rowKey="id" columns={versionColumns} dataSource={versions} pagination={false} size="small" />
            </Card>
          </>
        )}
      </Drawer>

      <Modal title="添加批注" open={annoOpen} onCancel={() => setAnnoOpen(false)} onOk={() => annoForm.submit()}>
        <Form form={annoForm} layout="vertical" onFinish={handleAddAnnotation}>
          <Form.Item name="content" label="批注内容" rules={[{ required: true, message: '请输入批注内容' }]}>
            <Input.TextArea rows={3} placeholder="请输入批注内容" />
          </Form.Item>
          <Row gutter={8}>
            <Col span={8}>
              <Form.Item name="position_x" label="X" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="X" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="position_y" label="Y" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="Y" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="position_z" label="Z" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="Z" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="版本历史" open={versionOpen} onCancel={() => setVersionOpen(false)} footer={null} width={600}>
        <Table rowKey="id" columns={versionColumns} dataSource={versions} pagination={false} size="small" />
      </Modal>

      <Modal title="版本对比" open={compareOpen} onCancel={() => setCompareOpen(false)} width={800} footer={null}>
        <Table rowKey="id" columns={compareVersionColumns} dataSource={versions} pagination={false} size="small" />
        {compareVersion1 && compareVersion2 && (
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card title={`版本 v${compareVersion1.version_number}`} size="small">
                <p><strong>创建时间：</strong>{dayjs(compareVersion1.created_at).format('YYYY-MM-DD HH:mm')}</p>
                <p><strong>变更说明：</strong></p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{compareVersion1.changes_description || '-'}</p>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={`版本 v${compareVersion2.version_number}`} size="small">
                <p><strong>创建时间：</strong>{dayjs(compareVersion2.created_at).format('YYYY-MM-DD HH:mm')}</p>
                <p><strong>变更说明：</strong></p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{compareVersion2.changes_description || '-'}</p>
              </Card>
            </Col>
          </Row>
        )}
      </Modal>

      <Modal title="新建版本" open={newVersionOpen} onCancel={() => setNewVersionOpen(false)} onOk={() => newVersionForm.submit()}>
        <Form form={newVersionForm} layout="vertical" onFinish={handleCreateVersion}>
          <Form.Item name="model_url" label="模型URL" rules={[{ required: true, message: '请输入模型URL' }]}>
            <Input placeholder="请输入模型URL" />
          </Form.Item>
          <Form.Item name="changes_description" label="变更说明" rules={[{ required: true, message: '请输入变更说明' }]}>
            <Input.TextArea rows={4} placeholder="请输入变更说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
