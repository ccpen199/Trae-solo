import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Avatar,
  Tooltip,
  message,
  type TablePaginationConfig,
} from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/common/StatusBadge';
import type { LandlordApplication, LandlordApplicationStatus } from '@/types';

/** 优先级类型 */
type PriorityLevel = 'high' | 'medium' | 'low';

/** 页面筛选表单字段 */
interface FilterFormValues {
  status?: string;
  priority?: PriorityLevel;
  submitTimeRange?: [Dayjs, Dayjs];
  keyword?: string;
}

/** 审核操作类型 */
type AuditAction = 'approve' | 'reject';

/** 审核流程步骤配置 */
const AUDIT_STEPS = [
  { title: '实名认证', icon: <UserOutlined /> },
  { title: '产权核验', icon: <CheckCircleFilled /> },
  { title: '人脸比对', icon: <CheckCircleFilled /> },
];

/** 申请状态映射（业务语义层） */
// 注：待处理 = pending + verifying，与看板统计口径保持一致
const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'verifying', label: '审核中' },
  { value: 'auto_verifying', label: '自动审核中' },
  { value: 'manual_review', label: '人工复核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'cancelled', label: '已取消' },
];

/** 优先级选项 */
const PRIORITY_OPTIONS = [
  { value: 'high', label: '高优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'low', label: '低优先级' },
];

/**
 * 根据申请信息派生优先级
 * - 高: 期望月租 > 10000 或 评分 < 60
 * - 中: 期望月租 5000-10000
 * - 低: 其他
 */
function derivePriority(app: LandlordApplication): PriorityLevel {
  const score = app.verifyResult?.score ?? 70;
  if (app.expectedRent > 10000 || score < 60) return 'high';
  if (app.expectedRent > 5000) return 'medium';
  return 'low';
}

/** 获取优先级徽章 */
function PriorityBadge({ level }: { level: PriorityLevel }) {
  const config: Record<PriorityLevel, { color: string; bg: string; label: string; borderColor: string }> = {
    high: {
      color: '#E63946',
      bg: '#FEECEE',
      borderColor: '#FBCBD0',
      label: '高',
    },
    medium: {
      color: '#FF6B35',
      bg: '#FFF1E8',
      borderColor: '#FFD4B8',
      label: '中',
    },
    low: {
      color: '#6B7280',
      bg: '#F3F4F6',
      borderColor: '#D1D5DB',
      label: '低',
    },
  };
  const { color, bg, borderColor, label } = config[level];
  return (
    <Tag
      style={{
        color,
        backgroundColor: bg,
        borderColor,
        fontWeight: 600,
        padding: '2px 10px',
        borderRadius: 10,
        margin: 0,
      }}
    >
      {label}
    </Tag>
  );
}

/**
 * 将底层状态映射为业务状态
 * pending -> 待审核
 * verifying + currentStep <= 2 -> 自动审核中
 * verifying + currentStep > 2 -> 人工复核
 */
function toBizStatus(app: LandlordApplication): string {
  if (app.status === 'verifying') {
    return app.currentStep <= 2 ? 'auto_verifying' : 'manual_review';
  }
  return app.status;
}

/**
 * 检查申请是否处于待处理状态（与看板统计口径一致）
 * 待处理 = pending + verifying
 */
function isPendingStatus(app: LandlordApplication): boolean {
  return app.status === 'pending' || app.status === 'verifying';
}

/** 手机号脱敏显示 */
function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

export default function AuditList() {
  const navigate = useNavigate();
  const [form] = Form.useForm<FilterFormValues>();
  const { landlordApplications, setAuditStatus } = useAppStore();

  const [filters, setFilters] = useState<FilterFormValues>({});
  const [pagination, setPagination] = useState<TablePaginationConfig>({ current: 1, pageSize: 10 });
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    action: AuditAction;
    record?: LandlordApplication;
  }>({ open: false, action: 'approve' });
  const [remarkForm] = Form.useForm<{ remark: string }>();
  const [submitting, setSubmitting] = useState(false);

  /** 计算数据概览指标 */
  // 统计口径与看板保持一致：待处理 = pending + verifying
  const stats = useMemo(() => {
    const today = dayjs().startOf('day');
    let pendingCount = 0;       // 待审核（仅 pending）
    let verifyingCount = 0;     // 审核中（仅 verifying）
    let pendingTotal = 0;       // 待处理总数（pending + verifying，与看板对齐）
    let autoVerifying = 0;      // 自动审核中
    let manualReview = 0;       // 人工复核
    let approved = 0;           // 已通过
    let rejected = 0;           // 已驳回
    let todayApproved = 0;      // 今日通过

    landlordApplications.forEach((app) => {
      const biz = toBizStatus(app);
      if (app.status === 'pending') pendingCount++;
      if (app.status === 'verifying') verifyingCount++;
      if (isPendingStatus(app)) pendingTotal++;
      if (biz === 'auto_verifying') autoVerifying++;
      if (biz === 'manual_review') manualReview++;
      if (app.status === 'approved') approved++;
      if (app.status === 'rejected') rejected++;
      if (app.status === 'approved' && dayjs(app.completeTime || app.submitTime).isSame(today, 'day')) {
        todayApproved++;
      }
    });

    return {
      pending: pendingCount,
      verifying: verifyingCount,
      pendingTotal,
      autoVerifying,
      manualReview,
      approved,
      rejected,
      todayApproved,
    };
  }, [landlordApplications]);

  /** 根据筛选条件过滤列表 */
  const filteredList = useMemo(() => {
    return landlordApplications.filter((app) => {
      if (filters.status && filters.status !== 'all') {
        // 支持按底层状态筛选（如 verifying 作为整体）
        if (filters.status === 'verifying') {
          if (app.status !== 'verifying') return false;
        } else if (filters.status === 'pending') {
          if (app.status !== 'pending') return false;
        } else if (filters.status === 'approved') {
          if (app.status !== 'approved') return false;
        } else if (filters.status === 'rejected') {
          if (app.status !== 'rejected') return false;
        } else if (filters.status === 'cancelled') {
          if (app.status !== 'cancelled') return false;
        } else {
          // 其他按业务状态筛选
          if (toBizStatus(app) !== filters.status) return false;
        }
      }
      if (filters.priority && derivePriority(app) !== filters.priority) {
        return false;
      }
      if (filters.submitTimeRange && filters.submitTimeRange.length === 2) {
        const [start, end] = filters.submitTimeRange;
        const t = dayjs(app.submitTime);
        if (t.isBefore(start.startOf('day')) || t.isAfter(end.endOf('day'))) {
          return false;
        }
      }
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const hit =
          app.applyNo.toLowerCase().includes(kw) ||
          app.landlordName.toLowerCase().includes(kw) ||
          app.landlordPhone.includes(kw) ||
          app.propertyAddress.toLowerCase().includes(kw);
        if (!hit) return false;
      }
      return true;
    });
  }, [landlordApplications, filters]);

  /** 分页切片 */
  const pagedList = useMemo(() => {
    const { current = 1, pageSize = 10 } = pagination;
    const start = (current - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, pagination]);

  /** 处理查询 */
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setFilters(values);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  /** 处理重置 */
  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setPagination({ current: 1, pageSize: 10 });
  };

  /** 打开操作 Modal */
  const openActionModal = (action: AuditAction, record: LandlordApplication) => {
    setActionModal({ open: true, action, record });
    remarkForm.resetFields();
  };

  /** 提交审核操作 */
  const handleSubmitAction = async () => {
    try {
      const values = await remarkForm.validateFields();
      if (!actionModal.record) return;

      setSubmitting(true);
      const targetStatus: LandlordApplicationStatus =
        actionModal.action === 'approve' ? 'approved' : 'rejected';

      setAuditStatus(actionModal.record.id, targetStatus, values.remark);
      message.success(actionModal.action === 'approve' ? '审核通过成功' : '驳回成功');
      setActionModal({ open: false, action: 'approve' });
    } catch {
      // 校验未通过
    } finally {
      setSubmitting(false);
    }
  };

  /** 重新审核操作 */
  const handleReaudit = (record: LandlordApplication) => {
    Modal.confirm({
      title: '确认重新审核？',
      content: `将申请 [${record.applyNo}] 重置为审核中状态，系统将重新进行自动核验。`,
      okText: '确认重新审核',
      cancelText: '取消',
      onOk: () => {
        setAuditStatus(record.id, 'verifying', '重新审核');
        message.success('已提交重新审核申请');
      },
    });
  };

  /** 构造审核步骤 UI */
  const renderAuditSteps = (app: LandlordApplication) => {
    const bizStatus = toBizStatus(app);
    let current = 0;
    if (bizStatus === 'pending') current = 0;
    else if (bizStatus === 'auto_verifying') current = 1;
    else if (bizStatus === 'manual_review') current = 2;
    else if (bizStatus === 'approved' || bizStatus === 'rejected') current = 3;

    return (
      <div style={{ minWidth: 260 }}>
        <Steps
          size="small"
          current={current}
          status={bizStatus === 'rejected' ? 'error' : 'process'}
          items={AUDIT_STEPS}
          style={{ marginBottom: 6 }}
        />
        <StatusBadge status={bizStatus === 'auto_verifying' ? 'reviewing' : bizStatus} type="audit" />
      </div>
    );
  };

  /** 表格列定义 */
  const columns = [
    {
      title: '申请编号',
      dataIndex: 'applyNo',
      key: 'applyNo',
      width: 180,
      render: (text: string, record: LandlordApplication) => (
        <a
          onClick={() => navigate(`/landlord/audit/${record.id}`)}
          style={{ color: '#0F4C81', fontWeight: 500 }}
        >
          {text}
        </a>
      ),
    },
    {
      title: '申请人',
      key: 'applicant',
      width: 200,
      render: (_: unknown, record: LandlordApplication) => (
        <Space>
          <Avatar
            style={{ backgroundColor: '#0F4C81' }}
            icon={<UserOutlined />}
          >
            {record.landlordName.slice(0, 1)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.landlordName}</div>
            <div style={{ color: '#6B7280', fontSize: 12 }}>
              {maskPhone(record.landlordPhone)}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '产权地址',
      dataIndex: 'propertyAddress',
      key: 'propertyAddress',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '优先级',
      key: 'priority',
      width: 90,
      render: (_: unknown, record: LandlordApplication) => (
        <PriorityBadge level={derivePriority(record)} />
      ),
    },
    {
      title: '审核流程',
      key: 'flow',
      width: 300,
      render: (_: unknown, record: LandlordApplication) => renderAuditSteps(record),
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 170,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, record: LandlordApplication) => {
        const status = record.status;
        return (
          <Space size="small">
            {/* 所有状态都显示查看/详情按钮 */}
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/landlord/audit/${record.id}`)}
            >
              {status === 'pending' ? '审核' : status === 'rejected' ? '查看详情' : '查看'}
            </Button>

            {/* 待审核状态：显示通过/驳回按钮 */}
            {status === 'pending' && (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleFilled />}
                  style={{ color: '#00A86B' }}
                  onClick={() => openActionModal('approve', record)}
                >
                  通过
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<CloseCircleFilled />}
                  style={{ color: '#E63946' }}
                  onClick={() => openActionModal('reject', record)}
                >
                  驳回
                </Button>
              </>
            )}

            {/* 审核中状态：显示通过/驳回按钮（人工审核）*/}
            {status === 'verifying' && (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleFilled />}
                  style={{ color: '#00A86B' }}
                  onClick={() => openActionModal('approve', record)}
                >
                  通过
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<CloseCircleFilled />}
                  style={{ color: '#E63946' }}
                  onClick={() => openActionModal('reject', record)}
                >
                  驳回
                </Button>
              </>
            )}

            {/* 已驳回状态：显示重新审核按钮 */}
            {status === 'rejected' && (
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined />}
                style={{ color: '#FF6B35' }}
                onClick={() => handleReaudit(record)}
              >
                重新审核
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  /** 数据概览卡片 */
  const StatCard = ({
    label,
    value,
    color,
    icon,
  }: {
    label: string;
    value: number;
    color: string;
    icon: React.ReactNode;
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        background: '#FAFBFC',
        borderRadius: 8,
        border: '1px solid #EEF0F2',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          opacity: 0.9,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', lineHeight: 1.2 }}>
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{ padding: 24 }}>
      {/* 顶部标题 + 数据概览 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            className="section-title"
            style={{
              marginBottom: 8,
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            房东准入审核
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
            审核房东准入资质，包括实名认证、产权核验与活体比对。
          </p>
        </div>
        <Space size={12} wrap>
          {/* 待处理：与看板统计口径一致（pending + verifying） */}
          <StatCard
            label="待处理"
            value={stats.pendingTotal}
            color="#FF6B35"
            icon={<ClockCircleOutlined />}
          />
          <StatCard
            label="待审核"
            value={stats.pending}
            color="#FF9F43"
            icon={<ClockCircleOutlined />}
          />
          <StatCard
            label="审核中"
            value={stats.verifying}
            color="#4787C7"
            icon={<ClockCircleOutlined />}
          />
          <StatCard
            label="已通过"
            value={stats.approved}
            color="#00A86B"
            icon={<CheckCircleFilled />}
          />
          <StatCard
            label="已驳回"
            value={stats.rejected}
            color="#E63946"
            icon={<CloseCircleFilled />}
          />
          <StatCard
            label="今日通过"
            value={stats.todayApproved}
            color="#20C997"
            icon={<CheckCircleFilled />}
          />
        </Space>
      </div>

      {/* 筛选栏 */}
      <Card
        style={{ marginBottom: 16, borderRadius: 8 }}
        styles={{ body: { padding: 20 } }}
      >
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ rowGap: 12, display: 'flex', flexWrap: 'wrap' }}
        >
          <Form.Item name="status" label="审核状态" style={{ marginBottom: 0 }}>
            <Select
              style={{ width: 160 }}
              options={STATUS_OPTIONS}
              placeholder="请选择审核状态"
              allowClear
            />
          </Form.Item>
          <Form.Item name="priority" label="优先级" style={{ marginBottom: 0 }}>
            <Select
              style={{ width: 140 }}
              options={PRIORITY_OPTIONS}
              placeholder="请选择优先级"
              allowClear
            />
          </Form.Item>
          <Form.Item name="submitTimeRange" label="提交时间" style={{ marginBottom: 0 }}>
            <DatePicker.RangePicker style={{ width: 280 }} />
          </Form.Item>
          <Form.Item name="keyword" style={{ marginBottom: 0, flex: 1, minWidth: 220 }}>
            <Input
              placeholder="搜索申请编号/姓名/手机号/地址"
              prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
              allowClear
            />
          </Form.Item>
          <Space style={{ marginLeft: 'auto' }}>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button type="primary" htmlType="submit" style={{ background: '#0F4C81' }}>
              查询
            </Button>
          </Space>
        </Form>
      </Card>

      {/* 数据表格 */}
      <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={pagedList}
          rowKey="id"
          scroll={{ x: 1280 }}
          pagination={{
            ...pagination,
            total: filteredList.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t, range) => `第 ${range[0]}-${range[1]} 条，共 ${t} 条`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
        />
      </Card>

      {/* 审核操作确认 Modal */}
      <Modal
        open={actionModal.open}
        title={
          <Space>
            {actionModal.action === 'approve' ? (
              <CheckCircleFilled style={{ color: '#00A86B', fontSize: 18 }} />
            ) : (
              <CloseCircleFilled style={{ color: '#E63946', fontSize: 18 }} />
            )}
            <span style={{ fontWeight: 600 }}>
              {actionModal.action === 'approve' ? '审核通过' : '审核驳回'}：
              {actionModal.record?.applyNo}
            </span>
          </Space>
        }
        onCancel={() => setActionModal({ open: false, action: 'approve' })}
        onOk={handleSubmitAction}
        confirmLoading={submitting}
        okText={actionModal.action === 'approve' ? '确认通过' : '确认驳回'}
        okButtonProps={{
          danger: actionModal.action === 'reject',
          style:
            actionModal.action === 'approve'
              ? { background: '#00A86B', borderColor: '#00A86B' }
              : undefined,
        }}
        cancelText="取消"
        destroyOnClose
      >
        <div style={{ marginBottom: 16, color: '#6B7280' }}>
          申请人：<b style={{ color: '#1A1A2E' }}>{actionModal.record?.landlordName}</b>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          产权地址：{actionModal.record?.propertyAddress}
        </div>
        <Form form={remarkForm} layout="vertical">
          <Form.Item
            label={
              <span>
                审核意见 <span style={{ color: '#E63946' }}>*</span>
              </span>
            }
            name="remark"
            rules={[{ required: true, message: '请输入审核意见' }]}
          >
            <Input.TextArea
              rows={4}
              maxLength={200}
              showCount
              placeholder={
                actionModal.action === 'approve'
                  ? '请填写通过原因，如：资料齐全，核验通过...'
                  : '请填写驳回原因，如：产权资料不完整，请补充后重新提交...'
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
