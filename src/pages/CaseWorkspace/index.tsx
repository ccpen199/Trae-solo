import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Circle,
  FolderKanban,
  Paperclip,
  ChevronRight,
  AlertTriangle,
  Crown,
  UserCheck,
  Briefcase,
  MoreHorizontal,
  Plus,
  Download,
  Eye,
  BarChart3,
  Gavel,
  FileCheck,
} from 'lucide-react';
import {
  Tabs,
  Card,
  Tag,
  Avatar,
  Button,
  Progress,
  Dropdown,
  Tooltip,
  Empty,
  message,
  Table,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { mockWorkCases, mockTasks } from '@/mock/data';
import { WORK_CASE_STATUS_CONFIG, TASK_STATUS_CONFIG } from '@/constants';
import { formatDate, formatMoney, formatFileSize } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { WorkCase, TeamMember, CaseNode, Priority, Task, EvidenceItem } from '@/types/workspace';

const priorityConfig: Record<Priority, { label: string; color: string; dot: string; bg: string }> = {
  high: { label: '高优先级', color: 'error', dot: 'bg-accent-red', bg: 'bg-red-50' },
  medium: { label: '中优先级', color: 'warning', dot: 'bg-accent-gold', bg: 'bg-yellow-50' },
  low: { label: '低优先级', color: 'success', dot: 'bg-green-500', bg: 'bg-green-50' },
};

const teamRoleConfig: Record<TeamMember['role'], { label: string; icon: React.ReactNode; color: string }> = {
  lead: { label: '主办律师', icon: <Crown className="w-3.5 h-3.5" />, color: 'text-accent-gold' },
  associate: { label: '协办律师', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'text-primary-500' },
  paralegal: { label: '律师助理', icon: <Briefcase className="w-3.5 h-3.5" />, color: 'text-neutral-ink-500' },
};

const CaseWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const workCase: WorkCase = useMemo(() => {
    return mockWorkCases.find(c => c.id === id) || mockWorkCases[0];
  }, [id]);

  const caseTasks: Task[] = useMemo(() => {
    return mockTasks.filter(t => t.caseId === workCase.id);
  }, [workCase.id]);

  const completedNodes = workCase.nodes.filter(n => n.completed).length;
  const totalNodes = workCase.nodes.length;
  const progressPercent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  const taskCounts = useMemo(() => {
    return {
      todo: caseTasks.filter(t => t.status === 'todo').length,
      in_progress: caseTasks.filter(t => t.status === 'in_progress').length,
      review: caseTasks.filter(t => t.status === 'review').length,
      done: caseTasks.filter(t => t.status === 'done').length,
    };
  }, [caseTasks]);

  const taskColumns: ColumnsType<Task> = [
    {
      title: '任务',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              record.priority === 'high' ? 'bg-accent-red' : record.priority === 'medium' ? 'bg-accent-gold' : 'bg-green-500'
            )} />
            <span className="text-sm font-medium text-neutral-ink-900">{text}</span>
          </div>
          {record.description && (
            <p className="text-xs text-neutral-ink-500 mt-1 ml-4 line-clamp-1">{record.description}</p>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Task['status']) => {
        const config = TASK_STATUS_CONFIG[status];
        return <Tag color={config.color} className="!m-0">{config.label}</Tag>;
      },
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 140,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Avatar size={24} src={record.assigneeAvatar} />
          <span className="text-sm text-neutral-ink-700">{text}</span>
        </div>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (text) => <span className="text-sm text-neutral-ink-700">{formatDate(text)}</span>,
    },
    {
      title: '附件',
      key: 'attachments',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <span className="text-sm text-neutral-ink-500 flex items-center justify-center gap-1">
          <Paperclip className="w-3.5 h-3.5" />
          {record.attachments}
        </span>
      ),
    },
  ];

  const evidenceColumns: ColumnsType<EvidenceItem> = [
    {
      title: '文件名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-ink-50">
            {record.type === 'document' ? <FileText className="w-5 h-5 text-primary-500" /> :
             record.type === 'image' ? <Eye className="w-5 h-5 text-green-500" /> :
             record.type === 'video' ? <Eye className="w-5 h-5 text-accent-red" /> :
             <FileCheck className="w-5 h-5 text-accent-gold" />}
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-ink-900">{text}</div>
            <div className="text-xs text-neutral-ink-400">{formatFileSize(record.fileSize)}</div>
          </div>
        </div>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      render: (tags: string[]) => (
        <div className="flex flex-wrap gap-1">
          {tags.map(tag => <Tag key={tag} className="!m-0 !text-xs !py-0">{tag}</Tag>)}
        </div>
      ),
    },
    {
      title: '上传人',
      dataIndex: 'uploadedByName',
      key: 'uploadedByName',
      width: 100,
      render: (text) => <span className="text-sm text-neutral-ink-700">{text}</span>,
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (text) => <span className="text-sm text-neutral-ink-700">{formatDate(text)}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: () => (
        <div className="flex items-center gap-1">
          <Button type="link" size="small" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => message.info('预览文件')}>预览</Button>
          <Button type="link" size="small" icon={<Download className="w-3.5 h-3.5" />} onClick={() => message.success('下载已开始')}>下载</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-ink-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-serif font-bold text-primary-900 truncate">
              {workCase.title}
            </h1>
            <Tag color={priorityConfig[workCase.priority].color} className="!m-0">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {priorityConfig[workCase.priority].label}
              </span>
            </Tag>
            <Badge color={WORK_CASE_STATUS_CONFIG[workCase.status].color as any} text={WORK_CASE_STATUS_CONFIG[workCase.status].label} />
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-neutral-ink-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              案号：{workCase.caseNumber || '待立案'}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              主办：{workCase.leadLawyerName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              创建于：{formatDate(workCase.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<Users className="w-4 h-4" />}>团队协作</Button>
          <Button type="primary" icon={<Plus className="w-4 h-4" />} className="!bg-primary-900 hover:!bg-primary-700">
            添加任务
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'edit', label: '编辑案件' },
                { key: 'export', label: '导出案件' },
                { type: 'divider' as const },
                { key: 'archive', label: '归档案件', danger: true },
              ],
              onClick: ({ key }) => {
                if (key === 'edit') message.info('编辑案件');
                if (key === 'export') message.success('案件已导出');
              },
            }}
            trigger={['click']}
          >
            <button className="p-2 rounded-lg hover:bg-white transition-colors">
              <MoreHorizontal className="w-5 h-5 text-neutral-ink-600" />
            </button>
          </Dropdown>
        </div>
      </div>

      <Tabs
        defaultActiveKey="overview"
        size="large"
        items={[
          {
            key: 'overview',
            label: <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />概览</span>,
            children: (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="lc-card border-0" title={<span className="font-serif font-semibold text-base">案件描述</span>}>
                    <p className="text-sm text-neutral-ink-700 leading-relaxed">
                      {workCase.description || '暂无案件描述'}
                    </p>
                  </Card>

                  <Card className="lc-card border-0" title={
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-semibold text-base flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-accent-gold" />
                        诉讼节点
                      </span>
                      <span className="text-sm text-neutral-ink-500">{completedNodes}/{totalNodes} 已完成</span>
                    </div>
                  }>
                    <Progress
                      percent={progressPercent}
                      showInfo={false}
                      strokeColor="#0A1628"
                      trailColor="#E9ECEF"
                      className="mb-6"
                    />
                    <div className="relative pl-6">
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-neutral-ink-200" />
                      <div className="space-y-5">
                        {workCase.nodes.map((node: CaseNode, idx: number) => (
                          <div key={node.id} className="relative">
                            <div className={cn(
                              'absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center border-2',
                              node.completed
                                ? 'bg-green-500 border-green-500'
                                : idx === workCase.nodes.findIndex(n => !n.completed)
                                ? 'bg-white border-accent-gold'
                                : 'bg-white border-neutral-ink-300'
                            )}>
                              {node.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                              {!node.completed && idx === workCase.nodes.findIndex(n => !n.completed) && (
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
                              )}
                            </div>
                            <div className={cn(
                              'p-4 rounded-lg transition-colors',
                              node.completed ? 'bg-green-50/50' :
                              idx === workCase.nodes.findIndex(n => !n.completed) ? 'bg-accent-gold/5 border border-accent-gold/20' :
                              'bg-neutral-ink-50/50'
                            )}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      'font-medium text-sm',
                                      node.completed ? 'text-green-700' :
                                      idx === workCase.nodes.findIndex(n => !n.completed) ? 'text-primary-900' :
                                      'text-neutral-ink-500'
                                    )}>
                                      {node.name}
                                    </span>
                                    {node.reminder && !node.completed && (
                                      <Tooltip title={`提前${node.reminderDays}天提醒`}>
                                        <Clock className="w-3.5 h-3.5 text-accent-gold" />
                                      </Tooltip>
                                    )}
                                  </div>
                                  {node.description && (
                                    <p className="text-xs text-neutral-ink-500 mt-1">{node.description}</p>
                                  )}
                                </div>
                                <span className={cn(
                                  'text-xs font-medium whitespace-nowrap flex-shrink-0',
                                  node.completed ? 'text-green-600' : 'text-neutral-ink-500'
                                )}>
                                  {formatDate(node.date)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="lc-card border-0" title={<span className="font-serif font-semibold text-base">客户信息</span>}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary-50 text-primary-500">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-neutral-ink-900 truncate">{workCase.clientName}</div>
                          <div className="text-xs text-neutral-ink-500">客户</div>
                        </div>
                      </div>
                      {workCase.clientPhone && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-ink-50 hover:bg-neutral-ink-100 transition-colors cursor-pointer">
                          <Phone className="w-4 h-4 text-neutral-ink-400" />
                          <span className="text-sm text-neutral-ink-700">{workCase.clientPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-ink-50 hover:bg-neutral-ink-100 transition-colors cursor-pointer">
                        <Mail className="w-4 h-4 text-neutral-ink-400" />
                        <span className="text-sm text-neutral-ink-700">client@example.com</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="lc-card border-0" title={<span className="font-serif font-semibold text-base">关键指标</span>}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-lg bg-primary-50 text-center">
                        <div className="text-2xl font-serif font-bold text-primary-900">{caseTasks.length}</div>
                        <div className="text-xs text-neutral-ink-500 mt-1">总任务数</div>
                      </div>
                      <div className="p-4 rounded-lg bg-green-50 text-center">
                        <div className="text-2xl font-serif font-bold text-green-600">{taskCounts.done}</div>
                        <div className="text-xs text-neutral-ink-500 mt-1">已完成</div>
                      </div>
                      <div className="p-4 rounded-lg bg-yellow-50 text-center">
                        <div className="text-2xl font-serif font-bold text-yellow-600">{taskCounts.in_progress}</div>
                        <div className="text-xs text-neutral-ink-500 mt-1">进行中</div>
                      </div>
                      <div className="p-4 rounded-lg bg-neutral-ink-50 text-center">
                        <div className="text-2xl font-serif font-bold text-neutral-ink-700">{workCase.evidence.length}</div>
                        <div className="text-xs text-neutral-ink-500 mt-1">证据文件</div>
                      </div>
                    </div>
                  </Card>

                  <Card className="lc-card border-0" title={
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-semibold text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent-gold" />
                        办案团队
                      </span>
                      <Button type="link" size="small" className="!p-0" icon={<Plus className="w-3.5 h-3.5" />}>
                        添加
                      </Button>
                    </div>
                  }>
                    <div className="space-y-3">
                      {workCase.teamMembers.map((member: TeamMember) => {
                        const roleConfig = teamRoleConfig[member.role];
                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-ink-50 transition-colors cursor-pointer"
                          >
                            <Avatar size={40} src={member.avatar} className="!border-2 !border-white shadow-sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-neutral-ink-900 truncate">{member.name}</span>
                                <span className={cn('flex items-center gap-0.5 text-xs', roleConfig.color)}>
                                  {roleConfig.icon}
                                  {roleConfig.label}
                                </span>
                              </div>
                              <span className="text-xs text-neutral-ink-500">加入于 {formatDate(member.joinedAt)}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-ink-300" />
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            key: 'tasks',
            label: (
              <span className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                任务
                <Badge count={taskCounts.in_progress + taskCounts.todo} size="small" color="#C9A962" />
              </span>
            ),
            children: (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'todo', label: '待办', count: taskCounts.todo, color: 'bg-neutral-ink-400' },
                    { key: 'in_progress', label: '进行中', count: taskCounts.in_progress, color: 'bg-primary-500' },
                    { key: 'review', label: '审核中', count: taskCounts.review, color: 'bg-accent-gold' },
                    { key: 'done', label: '已完成', count: taskCounts.done, color: 'bg-green-500' },
                  ].map(s => (
                    <div key={s.key} className="lc-card p-4 flex items-center gap-3">
                      <div className={cn('w-3 h-3 rounded-full', s.color)} />
                      <div>
                        <div className="text-2xl font-serif font-bold text-neutral-ink-900">{s.count}</div>
                        <div className="text-xs text-neutral-ink-500">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="lc-card">
                  <Table
                    columns={taskColumns}
                    dataSource={caseTasks}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 个任务`,
                    }}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'evidence',
            label: (
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                证据
                <Badge count={workCase.evidence.length} size="small" />
              </span>
            ),
            children: (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-neutral-ink-500">
                    <Paperclip className="w-4 h-4" />
                    共 {workCase.evidence.length} 个证据文件
                  </div>
                  <Button type="primary" icon={<Plus className="w-4 h-4" />} className="!bg-primary-900 hover:!bg-primary-700">
                    上传证据
                  </Button>
                </div>
                <div className="lc-card">
                  {workCase.evidence.length > 0 ? (
                    <Table
                      columns={evidenceColumns}
                      dataSource={workCase.evidence}
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 个文件`,
                      }}
                    />
                  ) : (
                    <Empty description="暂无证据文件" className="py-12" />
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'nodes',
            label: <span className="flex items-center gap-2"><Clock className="w-4 h-4" />节点</span>,
            children: (
              <Card className="lc-card border-0">
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-neutral-ink-200" />
                  <div className="space-y-5">
                    {workCase.nodes.map((node: CaseNode, idx: number) => (
                      <div key={node.id} className="relative">
                        <div className={cn(
                          'absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center border-2',
                          node.completed
                            ? 'bg-green-500 border-green-500'
                            : idx === workCase.nodes.findIndex(n => !n.completed)
                            ? 'bg-white border-accent-gold'
                            : 'bg-white border-neutral-ink-300'
                        )}>
                          {node.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                          {!node.completed && idx === workCase.nodes.findIndex(n => !n.completed) && (
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
                          )}
                        </div>
                        <div className={cn(
                          'p-4 rounded-lg transition-colors',
                          node.completed ? 'bg-green-50/50' :
                          idx === workCase.nodes.findIndex(n => !n.completed) ? 'bg-accent-gold/5 border border-accent-gold/20' :
                          'bg-neutral-ink-50/50'
                        )}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'font-medium text-base',
                                  node.completed ? 'text-green-700' :
                                  idx === workCase.nodes.findIndex(n => !n.completed) ? 'text-primary-900' :
                                  'text-neutral-ink-500'
                                )}>
                                  {node.name}
                                </span>
                                {node.completed && <Tag color="success">已完成</Tag>}
                                {!node.completed && idx === workCase.nodes.findIndex(n => !n.completed) && (
                                  <Tag color="gold">进行中</Tag>
                                )}
                              </div>
                              {node.description && (
                                <p className="text-sm text-neutral-ink-500 mt-2">{node.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={cn(
                                'text-sm font-medium whitespace-nowrap',
                                node.completed ? 'text-green-600' : 'text-neutral-ink-700'
                              )}>
                                {formatDate(node.date)}
                              </div>
                              {node.reminder && !node.completed && (
                                <div className="text-xs text-accent-gold mt-1 flex items-center justify-end gap-1">
                                  <Clock className="w-3 h-3" />
                                  提前{node.reminderDays}天提醒
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ),
          },
          {
            key: 'team',
            label: (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                团队
                <Badge count={workCase.teamMembers.length} size="small" />
              </span>
            ),
            children: (
              <Card className="lc-card border-0">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-serif font-semibold text-base text-neutral-ink-900">办案团队</h3>
                    <p className="text-sm text-neutral-ink-500 mt-1">共 {workCase.teamMembers.length} 位成员参与本案</p>
                  </div>
                  <Button type="primary" icon={<Plus className="w-4 h-4" />} className="!bg-primary-900 hover:!bg-primary-700">
                    添加成员
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workCase.teamMembers.map((member: TeamMember) => {
                    const roleConfig = teamRoleConfig[member.role];
                    return (
                      <div
                        key={member.id}
                        className="p-5 rounded-xl border border-neutral-ink-100 hover:border-primary-200 hover:shadow-card transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar size={56} src={member.avatar} className="!border-2 !border-white shadow-sm group-hover:scale-105 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-neutral-ink-900 truncate">{member.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-ink-500 mb-3">
                              <span className={cn('flex items-center gap-1', roleConfig.color)}>
                                {roleConfig.icon}
                                {roleConfig.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 pt-3 border-t border-neutral-ink-100">
                              <span className="text-xs text-neutral-ink-400">加入于 {formatDate(member.joinedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ),
          },
          {
            key: 'documents',
            label: <span className="flex items-center gap-2"><FileCheck className="w-4 h-4" />文档</span>,
            children: (
              <Card className="lc-card border-0">
                <Empty
                  description={
                    <div>
                      <p className="text-neutral-ink-600 mb-2">暂无关联文档</p>
                      <p className="text-sm text-neutral-ink-400">上传合同、法律文书等相关文档</p>
                    </div>
                  }
                  className="py-16"
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default CaseWorkspace;
