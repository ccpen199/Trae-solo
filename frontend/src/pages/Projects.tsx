import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Descriptions, Drawer, Form, Input, InputNumber, Select, Space, Table, Tag, message } from 'antd';
import { EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/utils/api';

type Project = {
  id: number;
  title: string;
  status: string;
  owner_name?: string;
  designer_name?: string;
  company_name?: string;
  start_date?: string;
  end_date?: string;
  address?: string;
  total_budget?: number;
  created_at?: string;
};

const statusLabels: Record<string, string> = {
  planning: '规划中',
  in_progress: '进行中',
  completed: '已完成',
  paused: '暂停',
  cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  planning: 'blue',
  in_progress: 'processing',
  completed: 'green',
  paused: 'orange',
  cancelled: 'red',
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<Project | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects', {
        params: {
          page,
          limit: pageSize,
          status,
        },
      });
      const payload = res.data.data || {};
      const list = (payload.list || []) as Project[];
      const filtered = keyword
        ? list.filter((item) => `${item.title || ''}${item.address || ''}`.includes(keyword))
        : list;
      setProjects(filtered);
      setTotal(keyword ? filtered.length : payload.total || 0);
    } catch {
      message.error('获取项目列表失败');
      setProjects([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, keyword]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate(values: Partial<Project>) {
    try {
      await api.post('/projects', values);
      message.success('项目已创建');
      setCreateOpen(false);
      createForm.resetFields();
      fetchProjects();
    } catch {
      message.error('创建项目失败');
    }
  }

  const columns: ColumnsType<Project> = [
    { title: '项目名称', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => <Tag color={statusColors[value] || 'default'}>{statusLabels[value] || value}</Tag>,
    },
    { title: '业主', dataIndex: 'owner_name', key: 'owner_name', width: 120, render: (value) => value || '-' },
    { title: '设计师', dataIndex: 'designer_name', key: 'designer_name', width: 120, render: (value) => value || '-' },
    { title: '装修公司', dataIndex: 'company_name', key: 'company_name', width: 140, render: (value) => value || '-' },
    {
      title: '预算',
      dataIndex: 'total_budget',
      key: 'total_budget',
      width: 120,
      render: (value) => (value ? `¥${Number(value).toLocaleString()}` : '-'),
    },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setCurrent(record);
            setDetailOpen(true);
          }}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="项目管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新建项目
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索项目名称/地址"
            prefix={<SearchOutlined />}
            allowClear
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            style={{ width: 220 }}
          />
          <Select
            placeholder="项目状态"
            allowClear
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            style={{ width: 140 }}
            options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchProjects}>
            刷新
          </Button>
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={projects}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => `共 ${count} 条`,
          }}
          onChange={(pagination) => {
            setPage(pagination.current || 1);
            setPageSize(pagination.pageSize || 10);
          }}
          scroll={{ x: 980 }}
        />
      </Card>

      <Drawer title="项目详情" width={560} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {current && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="项目名称">{current.title}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColors[current.status] || 'default'}>{statusLabels[current.status] || current.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="业主">{current.owner_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="设计师">{current.designer_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="装修公司">{current.company_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="预算">{current.total_budget ? `¥${Number(current.total_budget).toLocaleString()}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="计划周期">
              {[current.start_date, current.end_date].filter(Boolean).join(' 至 ') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="地址">{current.address || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Drawer title="新建项目" width={520} open={createOpen} onClose={() => setCreateOpen(false)}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="如：万科城市花园3栋502室装修项目" />
          </Form.Item>
          <Form.Item name="address" label="项目地址">
            <Input placeholder="请输入详细地址" />
          </Form.Item>
          <Form.Item name="total_budget" label="预算">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="status" label="项目状态" initialValue="planning">
            <Select options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => setCreateOpen(false)}>取消</Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
}
