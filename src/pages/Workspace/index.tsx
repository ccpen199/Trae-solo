import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Archive,
  User,
  ChevronRight,
  MoreHorizontal,
  Gavel,
  Scale,
} from 'lucide-react';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Avatar,
  Progress,
  Dropdown,
  Tooltip,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import DataCard from '@/components/common/DataCard';
import { WORK_CASE_STATUS_CONFIG } from '@/constants';
import { mockWorkCases, mockUser } from '@/mock/data';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { WorkCase, Priority, WorkCaseStatus, CreateCaseParams } from '@/types/workspace';

const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
  high: { label: '高优先级', color: 'error', dot: 'bg-accent-red' },
  medium: { label: '中优先级', color: 'warning', dot: 'bg-accent-gold' },
  low: { label: '低优先级', color: 'success', dot: 'bg-green-500' },
};

const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkCaseStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm<CreateCaseParams>();

  const statusStats = useMemo(() => {
    const stats = {
      intake: 0,
      preparation: 0,
      trial: 0,
      enforcement: 0,
      archived: 0,
    };
    mockWorkCases.forEach((c) => {
      if (stats[c.status] !== undefined) {
        stats[c.status]++;
      }
    });
    return stats;
  }, []);

  const filteredCases = useMemo(() => {
    return mockWorkCases.filter((c) => {
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(keyword);
        const matchNumber = c.caseNumber?.toLowerCase().includes(keyword);
        const matchClient = c.clientName.toLowerCase().includes(keyword);
        const matchLawyer = c.leadLawyerName.toLowerCase().includes(keyword);
        if (!matchTitle && !matchNumber && !matchClient && !matchLawyer) return false;
      }
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
      return true;
    });
  }, [searchKeyword, filterStatus, filterPriority]);

  const columns: ColumnsType<WorkCase> = [
    {
      title: '案号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      width: 180,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary-500 flex-shrink-0" />
          <span className="font-mono text-sm text-neutral-ink-700">
            {text || '待立案'}
          </span>
        </div>
      ),
    },
    {
      title: '案件标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      render: (text, record) => (
        <div className="flex items-start gap-2">
          <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', priorityConfig[record.priority].dot)} />
          <div className="min-w-0">
            <span
              className="text-sm font-medium text-neutral-ink-900 hover:text-primary-500 cursor-pointer transition-colors line-clamp-1"
              onClick={() => navigate(`/workspace/case/${record.id}`)}
            >
              {text}
            </span>
            {record.description && (
              <p className="text-xs text-neutral-ink-500 mt-0.5 line-clamp-1">{record.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '客户',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 160,
      render: (text) => (
        <span className="text-sm text-neutral-ink-700">{text}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: WorkCaseStatus) => {
        const config = WORK_CASE_STATUS_CONFIG[status];
        return (
          <Tag color={config.color} className="!m-0">
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: Priority) => (
        <Tag color={priorityConfig[priority].color} className="!m-0">
          {priorityConfig[priority].label}
        </Tag>
      ),
    },
    {
      title: '主办律师',
      dataIndex: 'leadLawyerName',
      key: 'leadLawyerName',
      width: 140,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Avatar size={24} src={mockUser.avatar} className="flex-shrink-0" />
          <span className="text-sm text-neutral-ink-700">{text}</span>
        </div>
      ),
    },
    {
      title: '节点进度',
      key: 'progress',
      width: 200,
      render: (_, record) => {
        const total = record.nodes.length;
        const completed = record.nodes.filter((n) => n.completed).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        const nextNode = record.nodes.find((n) => !n.completed);
        return (
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-ink-500">
                {completed}/{total} 节点
              </span>
              <span className="text-xs font-medium text-primary-500">{percent}%</span>
            </div>
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              strokeColor="#194BA0"
              trailColor="#E9ECEF"
            />
            {nextNode && (
              <div className="flex items-center gap-1 mt-1.5">
                <Clock className="w-3 h-3 text-neutral-ink-400" />
                <span className="text-xs text-neutral-ink-500 truncate">
                  下一节点：{nextNode.name} · {formatDate(nextNode.date)}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: '查看详情', icon: <ChevronRight className="w-4 h-4" /> },
              { key: 'tasks', label: '任务管理' },
              { key: 'evidence', label: '证据管理' },
              { type: 'divider' as const },
              { key: 'archive', label: '归档案件', danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'view') navigate(`/workspace/case/${record.id}`);
              if (key === 'tasks') navigate('/workspace/board');
              if (key === 'evidence') navigate('/workspace/evidence');
            },
          }}
          trigger={['click']}
        >
          <button className="p-1.5 hover:bg-neutral-ink-100 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4 text-neutral-ink-500" />
          </button>
        </Dropdown>
      ),
    },
  ];

  const handleCreateCase = async (values: CreateCaseParams) => {
    message.success('案件创建成功');
    setCreateModalVisible(false);
    form.resetFields();
  };

  const statCards = [
    { title: '立案受理', value: statusStats.intake, icon: <Gavel className="w-5 h-5" />, color: 'primary' as const, status: 'intake' as WorkCaseStatus },
    { title: '诉讼准备', value: statusStats.preparation, icon: <FolderKanban className="w-5 h-5" />, color: 'gold' as const, status: 'preparation' as WorkCaseStatus },
    { title: '审理阶段', value: statusStats.trial, icon: <Scale className="w-5 h-5" />, color: 'success' as const, status: 'trial' as WorkCaseStatus },
    { title: '执行阶段', value: statusStats.enforcement, icon: <AlertTriangle className="w-5 h-5" />, color: 'warning' as const, status: 'enforcement' as WorkCaseStatus },
    { title: '已归档', value: statusStats.archived, icon: <Archive className="w-5 h-5" />, color: 'danger' as const, status: 'archived' as WorkCaseStatus },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900">办案中台</h1>
          <p className="text-neutral-ink-500 mt-1">
            管理您的全部案件，跟踪办理进度，协作处理任务
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/workspace/board')}
            className="lc-btn-outline flex items-center gap-2"
          >
            <FolderKanban className="w-4 h-4" />
            任务看板
          </button>
          <button
            onClick={() => setCreateModalVisible(true)}
            className="lc-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建案件
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => (
          <DataCard
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            onClick={() => setFilterStatus(stat.status)}
          />
        ))}
      </div>

      <div className="lc-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-ink-400" />
              <Input
                placeholder="搜索案号、标题、客户、律师..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
                allowClear
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                className="w-36"
                placeholder="案件状态"
                allowClear
                options={[
                  { value: 'all', label: '全部状态' },
                  ...Object.entries(WORK_CASE_STATUS_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                  })),
                ]}
              />
              <Select
                value={filterPriority}
                onChange={setFilterPriority}
                className="w-32"
                placeholder="优先级"
                allowClear
                options={[
                  { value: 'all', label: '全部优先级' },
                  { value: 'high', label: '高优先级' },
                  { value: 'medium', label: '中优先级' },
                  { value: 'low', label: '低优先级' },
                ]}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-ink-500">
            <Filter className="w-4 h-4" />
            <span>共 {filteredCases.length} 个案件</span>
          </div>
        </div>
      </div>

      <div className="lc-card">
        <Table
          columns={columns}
          dataSource={filteredCases}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个案件`,
          }}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            className: 'cursor-pointer hover:bg-primary-50/30 transition-colors',
            onClick: () => navigate(`/workspace/case/${record.id}`),
          })}
        />
      </div>

      <Modal
        title={<span className="font-serif text-lg font-semibold">新建案件</span>}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCase}
          className="mt-4"
        >
          <Form.Item
            label="案件标题"
            name="title"
            rules={[{ required: true, message: '请输入案件标题' }]}
          >
            <Input placeholder="请输入案件标题" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="客户名称"
              name="clientName"
              rules={[{ required: true, message: '请输入客户名称' }]}
            >
              <Input placeholder="请输入客户名称" />
            </Form.Item>
            <Form.Item
              label="客户电话"
              name="clientPhone"
            >
              <Input placeholder="请输入客户电话" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="案号"
              name="caseNumber"
            >
              <Input placeholder="未立案可不填" />
            </Form.Item>
            <Form.Item
              label="优先级"
              name="priority"
              rules={[{ required: true, message: '请选择优先级' }]}
              initialValue="medium"
            >
              <Select
                options={[
                  { value: 'high', label: '高优先级' },
                  { value: 'medium', label: '中优先级' },
                  { value: 'low', label: '低优先级' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="案件描述"
            name="description"
          >
            <Input.TextArea
              placeholder="请简要描述案件情况"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="团队成员"
            name="teamMembers"
            initialValue={[mockUser.id]}
          >
            <Select
              mode="multiple"
              placeholder="选择团队成员"
              options={[
                { value: mockUser.id, label: (
                  <span className="flex items-center gap-2">
                    <Avatar size={20} src={mockUser.avatar} />
                    {mockUser.name}（主办）
                  </span>
                )},
              ]}
            />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-ink-100">
            <Button onClick={() => {
              setCreateModalVisible(false);
              form.resetFields();
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              创建案件
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Workspace;
