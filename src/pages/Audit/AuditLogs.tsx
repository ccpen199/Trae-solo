import { useState, useMemo } from 'react';
import {
  Table,
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  Tag,
  Avatar,
  Tooltip,
  Popover,
  Card,
  Row,
  Col,
  Space,
  Checkbox,
  message,
  Typography,
  Divider,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs, { Dayjs } from 'dayjs';
import {
  Search,
  Download,
  FileText,
  Filter,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronDown,
  Activity,
  Users,
  FileWarning,
  BarChart3,
} from 'lucide-react';
import { useAppStore } from '@/store';
import DataCard from '@/components/common/DataCard';
import StatusBadge from '@/components/common/StatusBadge';
import Sparkline from '@/components/common/Sparkline';
import type { AuditLog, AuditActionType, DataChangeItem } from '@/types';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/** 主题色常量 */
const COLORS = {
  brand: '#0F4C81',
  success: '#00A86B',
  warning: '#FF6B35',
  danger: '#E63946',
  gold: '#D4A574',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
};

/** 模块配置 */
const MODULE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '房东审核', value: '房东准入' },
  { label: '房源管理', value: '房源管理' },
  { label: '合同管理', value: '合同管理' },
  { label: '信用管理', value: '信用管理' },
  { label: '服务工单', value: '工单服务' },
  { label: '应急安置', value: '应急安置' },
  { label: '系统配置', value: '系统配置' },
];

/** 操作类型配置 */
const ACTION_OPTIONS = [
  { label: '全部', value: '' },
  { label: '新增', value: 'create' },
  { label: '删除', value: 'delete' },
  { label: '修改', value: 'update' },
  { label: '查询', value: 'query' },
  { label: '审批', value: 'approve' },
  { label: '导出', value: 'export' },
  { label: '登录', value: 'login' },
];

/** 操作结果配置 */
const RESULT_OPTIONS = [
  { label: '全部', value: '' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
];

/** 角色配置 */
const ROLE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '超级管理员', value: '超级管理员' },
  { label: '审核专员', value: '审核专员' },
  { label: '客服主管', value: '客服主管' },
  { label: '运营专员', value: '运营专员' },
  { label: '财务专员', value: '财务专员' },
  { label: '系统管理员', value: '系统管理员' },
  { label: '调度员', value: '调度员' },
];

/** 模块颜色映射 */
const MODULE_COLOR_MAP: Record<string, string> = {
  房东准入: '#0F4C81',
  房源管理: '#00A86B',
  合同管理: '#8B5CF6',
  信用管理: '#D4A574',
  工单服务: '#FF6B35',
  应急安置: '#06B6D4',
  财务管理: '#E63946',
  系统配置: '#6B7280',
  用户管理: '#10B981',
};

/** 操作动作颜色映射 */
const ACTION_COLOR_MAP: Record<string, string> = {
  create: COLORS.success,
  update: COLORS.brand,
  delete: COLORS.danger,
  approve: COLORS.brand,
  reject: COLORS.danger,
  export: COLORS.gold,
  login: COLORS.purple,
  logout: COLORS.purple,
  sign: COLORS.gold,
  assign: COLORS.warning,
  settle: COLORS.brand,
  query: COLORS.cyan,
};

/** 操作动作中文标签 */
const ACTION_LABEL_MAP: Record<string, string> = {
  create: '新增',
  update: '修改',
  delete: '删除',
  approve: '审批',
  reject: '驳回',
  export: '导出',
  import: '导入',
  login: '登录',
  logout: '登出',
  sign: '签署',
  assign: '派单',
  settle: '结算',
  refund: '退款',
  pay: '支付',
  query: '查询',
};

/** 角色颜色映射 */
const ROLE_COLOR_MAP: Record<string, string> = {
  超级管理员: 'magenta',
  审核专员: 'blue',
  客服主管: 'cyan',
  运营专员: 'green',
  财务专员: 'gold',
  系统管理员: 'purple',
  调度员: 'orange',
};

/** 筛选表单数据类型 */
interface FilterForm {
  module?: string;
  actionType?: string;
  operatorName?: string;
  operatorRole?: string;
  result?: string;
  dateRange?: [Dayjs, Dayjs];
  operatorIp?: string;
  keyword?: string;
  sessionId?: string;
  bizNo?: string;
  changedField?: string;
}

/** 导出字段选项 */
const EXPORT_FIELDS = [
  { label: '时间戳', value: 'operateTime' },
  { label: '操作人', value: 'operatorName' },
  { label: '角色', value: 'operatorRole' },
  { label: '模块', value: 'module' },
  { label: '操作动作', value: 'actionType' },
  { label: '目标对象', value: 'bizNo' },
  { label: 'IP地址', value: 'operatorIp' },
  { label: '操作结果', value: 'success' },
  { label: '请求ID', value: 'traceId' },
  { label: '操作描述', value: 'actionDesc' },
  { label: '耗时(ms)', value: 'duration' },
];

/** 模拟IP归属地 */
function mockIpLocation(ip: string): string {
  const districts = ['浦东新区', '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区'];
  const hash = ip.split('.').reduce((acc, part) => acc + parseInt(part, 10), 0);
  return `上海市${districts[hash % districts.length]} · 电信宽带`;
}

/** 格式化时间戳(毫秒级) */
function formatTimestamp(iso: string): string {
  const d = dayjs(iso);
  const ms = Math.floor((new Date(iso).getMilliseconds()));
  return `${d.format('YYYY-MM-DD HH:mm:ss')}.${String(ms).padStart(3, '0')}`;
}

/** 格式化值显示 */
function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

/** 复制到剪贴板 */
function copyToClipboard(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => message.success('已复制到剪贴板'))
    .catch(() => message.error('复制失败'));
}

export default function AuditLogs() {
  /** 全局store取数 */
  const { auditLogs } = useAppStore();

  /** 筛选表单 */
  const [form] = Form.useForm<FilterForm>();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportFields, setExportFields] = useState<string[]>(['operateTime', 'operatorName', 'module', 'actionType', 'bizNo', 'success']);

  /** ========== 数据概览计算 ========== */

  /** 今日操作总数 */
  const todayTotal = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return auditLogs.filter((l) => dayjs(l.operateTime).format('YYYY-MM-DD') === today).length;
  }, [auditLogs]);

  /** 今日操作趋势(近7天) */
  const last7DaysTrend = useMemo(() => {
    const arr: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      arr.push(auditLogs.filter((l) => dayjs(l.operateTime).format('YYYY-MM-DD') === d).length);
    }
    return arr;
  }, [auditLogs]);

  /** 核心模块操作占比TOP5 */
  const modulePieOption: EChartsOption = useMemo(() => {
    const countMap: Record<string, number> = {};
    auditLogs.forEach((l) => {
      countMap[l.module] = (countMap[l.module] || 0) + 1;
    });
    const sorted = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          emphasis: { scale: true, scaleSize: 6 },
          data: sorted.map(([name, value], idx) => ({
            name,
            value,
            itemStyle: {
              color:
                idx === 0
                  ? COLORS.brand
                  : idx === 1
                  ? COLORS.success
                  : idx === 2
                  ? COLORS.gold
                  : idx === 3
                  ? COLORS.warning
                  : COLORS.purple,
            },
          })),
        },
      ],
    };
  }, [auditLogs]);

  /** 失败/异常操作数 + 近7天趋势 */
  const failedCount = useMemo(() => auditLogs.filter((l) => !l.success).length, [auditLogs]);
  const failedTrend = useMemo(() => {
    const arr: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      arr.push(auditLogs.filter((l) => dayjs(l.operateTime).format('YYYY-MM-DD') === d && !l.success).length);
    }
    return arr;
  }, [auditLogs]);

  /** 不同角色操作分布 - 堆叠条形图 */
  const roleStackOption: EChartsOption = useMemo(() => {
    const roles = ['超级管理员', '审核专员', '财务专员', '调度员', '运营专员', '客服主管'];
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      days.push(dayjs().subtract(i, 'day').format('MM/DD'));
    }
    const series = roles.map((role, idx) => ({
      name: role,
      type: 'bar' as const,
      stack: 'total',
      emphasis: { focus: 'series' as const },
      itemStyle: {
        color:
          idx === 0
            ? COLORS.danger
            : idx === 1
            ? COLORS.brand
            : idx === 2
            ? COLORS.gold
            : idx === 3
            ? COLORS.warning
            : idx === 4
            ? COLORS.success
            : COLORS.cyan,
      },
      barWidth: 14,
      data: days.map((_, dayIdx) => {
        const d = dayjs().subtract(6 - dayIdx, 'day').format('YYYY-MM-DD');
        return auditLogs.filter(
          (l) => l.operatorRole === role && dayjs(l.operateTime).format('YYYY-MM-DD') === d
        ).length;
      }),
    }));
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        show: true,
        top: 0,
        right: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#4A4F5A', fontSize: 11 },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '22%', containLabel: true },
      xAxis: {
        type: 'category',
        data: days,
        axisLabel: { color: '#6B7280', fontSize: 11 },
        axisLine: { lineStyle: { color: '#EBEBEE' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#6B7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#EBEBEE', type: 'dashed' } },
      },
      series,
    };
  }, [auditLogs]);

  /** 风险仪表盘 */
  const riskGaugeOption: EChartsOption = useMemo(() => {
    const totalFailed = auditLogs.filter((l) => !l.success).length;
    const riskScore = Math.min(100, Math.round((totalFailed / Math.max(auditLogs.length, 1)) * 500));
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          splitNumber: 10,
          radius: '90%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: COLORS.success },
                { offset: 0.5, color: COLORS.gold },
                { offset: 1, color: COLORS.danger },
              ],
            },
          },
          progress: { show: true, width: 18 },
          axisLine: { lineStyle: { width: 18 } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: { show: true, width: 5, length: '60%' },
          anchor: { show: true, showAbove: true, size: 14, itemStyle: { borderWidth: 3 } },
          title: { show: false },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '30%'],
            fontSize: 28,
            fontWeight: 700,
            formatter: '{value}',
            color: '#1A1A2E',
          },
          data: [{ value: riskScore, name: '风险指数' }],
        },
      ],
    };
  }, [auditLogs]);

  /** ========== 筛选逻辑 ========== */

  /** 获取筛选条件 */
  const filters = useMemo(() => form.getFieldsValue(), [form]);

  /** 筛选后的日志 */
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (filters.module && log.module !== filters.module) return false;
      if (filters.actionType && log.actionType !== filters.actionType) return false;
      if (filters.operatorRole && log.operatorRole !== filters.operatorRole) return false;
      if (filters.result === 'success' && !log.success) return false;
      if (filters.result === 'failed' && log.success) return false;
      if (filters.operatorName && !log.operatorName.includes(filters.operatorName)) return false;
      if (filters.operatorIp && !log.operatorIp.includes(filters.operatorIp)) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const matchDesc = log.actionDesc?.toLowerCase().includes(kw);
        const matchName = log.bizNo?.toLowerCase().includes(kw);
        const matchId = log.traceId?.toLowerCase().includes(kw);
        if (!matchDesc && !matchName && !matchId) return false;
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        const logTime = dayjs(log.operateTime);
        if (logTime.isBefore(filters.dateRange[0]) || logTime.isAfter(filters.dateRange[1].endOf('day'))) {
          return false;
        }
      }
      if (filters.sessionId && !log.traceId.includes(filters.sessionId)) return false;
      if (filters.bizNo && !log.bizNo?.includes(filters.bizNo)) return false;
      if (filters.changedField && log.dataChanges) {
        const hasField = log.dataChanges.some((c) => c.field.includes(filters.changedField!) || c.fieldLabel.includes(filters.changedField!));
        if (!hasField) return false;
      }
      return true;
    });
  }, [auditLogs, filters]);

  /** 分页数据 */
  const pagedLogs = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    return filteredLogs.slice(start, start + pagination.pageSize);
  }, [filteredLogs, pagination]);

  /** 查询操作 */
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    message.success('筛选条件已应用');
  };

  /** 重置操作 */
  const handleReset = () => {
    form.resetFields();
    setPagination({ current: 1, pageSize: 50 });
    message.info('筛选条件已重置');
  };

  /** 导出Excel */
  const handleExport = () => {
    message.success(`正在生成${exportFormat.toUpperCase()}格式导出文件...`);
  };

  /** 生成合规审计报告 */
  const handleGenerateReport = () => {
    message.success('合规审计报告生成中，请稍后...');
  };

  /** ========== 表格列定义 ========== */

  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间戳',
      dataIndex: 'operateTime',
      key: 'operateTime',
      width: 210,
      fixed: 'left' as const,
      sorter: (a, b) => dayjs(a.operateTime).valueOf() - dayjs(b.operateTime).valueOf(),
      defaultSortOrder: 'descend',
      render: (val) => (
        <span className="font-mono text-xs text-ink-700 tracking-tight">{formatTimestamp(val)}</span>
      ),
    },
    {
      title: '操作人',
      key: 'operator',
      width: 180,
      render: (_, record) => (
        <Space size={8}>
          <Avatar
            size={28}
            style={{
              backgroundColor: MODULE_COLOR_MAP[record.module] || COLORS.brand,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {record.operatorName?.charAt(0) || 'U'}
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-ink-800">{record.operatorName}</span>
            <Tag color={ROLE_COLOR_MAP[record.operatorRole] || 'default'} className="!m-0 !text-[10px] !px-1.5 !py-0 mt-0.5" style={{ display: 'inline-block', width: 'fit-content' }}>
              {record.operatorRole}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 110,
      filters: Object.entries(MODULE_COLOR_MAP).map(([text]) => ({ text, value: text })),
      onFilter: (value, record) => record.module === value,
      render: (val) => {
        const color = MODULE_COLOR_MAP[val] || COLORS.brand;
        return (
          <Tag
            style={{
              backgroundColor: `${color}12`,
              color,
              borderColor: `${color}30`,
              fontWeight: 500,
            }}
            className="!rounded-md"
          >
            {val}
          </Tag>
        );
      },
    },
    {
      title: '操作动作',
      dataIndex: 'actionType',
      key: 'actionType',
      width: 100,
      filters: Object.entries(ACTION_LABEL_MAP).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.actionType === value,
      render: (val: AuditActionType) => {
        const color = ACTION_COLOR_MAP[val] || COLORS.brand;
        const label = ACTION_LABEL_MAP[val] || val;
        return (
          <Tag
            style={{
              backgroundColor: `${color}18`,
              color,
              borderColor: `${color}40`,
              fontWeight: 600,
            }}
            className="!rounded-md"
          >
            {label}
          </Tag>
        );
      },
    },
    {
      title: '目标对象',
      key: 'target',
      width: 180,
      render: (_, record) => {
        if (!record.bizNo && !record.bizId) return <span className="text-ink-400 text-sm">—</span>;
        return (
          <Tooltip title={`业务ID: ${record.bizId || '-'}`}>
            <a className="text-sm font-medium hover:underline" style={{ color: COLORS.brand }}>
              {record.bizType}:{record.bizNo}
            </a>
          </Tooltip>
        );
      },
    },
    {
      title: 'IP地址',
      dataIndex: 'operatorIp',
      key: 'operatorIp',
      width: 140,
      render: (val) => (
        <Tooltip title={`IP归属地: ${mockIpLocation(val)}`}>
          <span className="font-mono text-xs text-ink-600 bg-ink-50 px-2 py-1 rounded">{val}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作结果',
      key: 'result',
      width: 100,
      filters: [
        { text: '成功', value: true },
        { text: '失败', value: false },
      ],
      onFilter: (value, record) => record.success === value,
      render: (_, record) =>
        record.success ? (
          <Space size={4}>
            <CheckCircle2 size={16} className="text-success-500" />
            <span className="text-sm text-success-600 font-medium">成功</span>
          </Space>
        ) : (
          <Tooltip title={record.errorMsg || '未知错误'}>
            <Space size={4}>
              <XCircle size={16} className="text-danger-500" />
              <span className="text-sm text-danger-600 font-medium">失败</span>
            </Space>
          </Tooltip>
        ),
    },
    {
      title: '请求ID',
      dataIndex: 'traceId',
      key: 'traceId',
      width: 140,
      fixed: 'right' as const,
      render: (val) => (
        <div className="flex items-center gap-1.5">
          <code className="font-mono text-[11px] text-ink-500 bg-ink-50 px-2 py-1 rounded truncate max-w-[100px]">
            {val?.slice(0, 12)}...
          </code>
          <Button
            type="text"
            size="small"
            icon={<Copy size={12} />}
            onClick={() => copyToClipboard(val)}
            className="!px-1 !h-6"
          />
        </div>
      ),
    },
  ];

  /** 行展开内容 */
  const expandedRowRender: TableProps<AuditLog>['expandedRowRender'] = (record) => {
    const dataChanges: DataChangeItem[] = record.dataChanges || [];
    const requestParams = record.requestParams || '{}';

    return (
      <div className="bg-ink-50/50 rounded-lg p-5 space-y-4 animate-fade-in-up">
        <Row gutter={24}>
          {/* 左栏: 请求参数 */}
          <Col span={12}>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} style={{ color: COLORS.brand }} />
              <span className="text-sm font-semibold text-ink-700">请求参数</span>
            </div>
            <pre className="bg-[#1e1e2e] text-[#d4d4d8] rounded-lg p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-[280px] overflow-y-auto">
              <code>
                {(() => {
                  try {
                    const obj = typeof requestParams === 'string' ? JSON.parse(requestParams) : requestParams;
                    return JSON.stringify(obj, null, 4);
                  } catch {
                    return String(requestParams);
                  }
                })()}
              </code>
            </pre>
          </Col>

          {/* 右栏: 数据变更对比 */}
          <Col span={12}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} style={{ color: COLORS.success }} />
              <span className="text-sm font-semibold text-ink-700">
                数据变更对比
                {dataChanges.length > 0 && (
                  <Tag color="blue" className="ml-2 !text-[10px]">
                    {dataChanges.length}处变更
                  </Tag>
                )}
              </span>
            </div>
            {dataChanges.length === 0 ? (
              <div className="bg-white border border-dashed border-ink-200 rounded-lg p-8 text-center text-ink-400 text-sm">
                本操作无数据变更记录
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-ink-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-ink-100/50">
                      <th className="text-left px-3 py-2 font-medium text-ink-600 w-[25%]">字段</th>
                      <th className="text-left px-3 py-2 font-medium text-ink-600 w-[37.5%]">旧值</th>
                      <th className="text-left px-3 py-2 font-medium text-ink-600 w-[37.5%]">新值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataChanges.map((change, idx) => (
                      <tr key={idx} className="border-t border-ink-100">
                        <td className="px-3 py-2 font-mono text-ink-700 align-top">
                          <div className="font-medium">{change.fieldLabel}</div>
                          <div className="text-[10px] text-ink-400">{change.field}</div>
                          <div className="mt-1">
                            <Tag
                              color={
                                change.changeType === 'add'
                                  ? 'green'
                                  : change.changeType === 'remove'
                                  ? 'red'
                                  : 'blue'
                              }
                              style={{ fontSize: 10 }}
                              className="!m-0"
                            >
                              {change.changeType === 'add' ? '新增' : change.changeType === 'remove' ? '删除' : '修改'}
                            </Tag>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          {change.changeType === 'add' ? (
                            <span className="text-ink-300">—</span>
                          ) : (
                            <span
                              className="inline-block px-2 py-1 rounded font-mono"
                              style={{
                                backgroundColor: 'rgba(230, 57, 70, 0.08)',
                                color: COLORS.danger,
                                textDecoration: 'line-through',
                              }}
                            >
                              {formatValue(change.oldValue)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {change.changeType === 'remove' ? (
                            <span className="text-ink-300">—</span>
                          ) : (
                            <span
                              className="inline-block px-2 py-1 rounded font-mono font-semibold"
                              style={{
                                backgroundColor: 'rgba(0, 168, 107, 0.08)',
                                color: COLORS.success,
                              }}
                            >
                              {formatValue(change.newValue)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Col>
        </Row>

        {/* 底部详细信息 */}
        <Divider className="!my-3" />
        <Row gutter={16}>
          <Col span={8}>
            <div className="text-xs">
              <Text type="secondary" className="block mb-1">用户Agent</Text>
              <code className="bg-ink-100 px-2 py-1 rounded text-ink-600 break-all">
                {record.operatorUserAgent || '—'}
              </code>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-xs">
              <Text type="secondary" className="block mb-1">会话ID</Text>
              <code className="bg-ink-100 px-2 py-1 rounded text-ink-600 font-mono">
                SESS-{record.traceId?.slice(0, 16) || '-'}
              </code>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-xs">
              <Text type="secondary" className="block mb-1">关联ID / 业务编号</Text>
              <code className="bg-ink-100 px-2 py-1 rounded text-ink-600 font-mono">
                {record.bizNo || record.bizId || '—'}
              </code>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up space-y-6 p-6 bg-ink-50 min-h-screen">
      {/* 页面标题 */}
      <div className="card-standard !py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-800 font-serif">操作审计日志</h1>
            <p className="text-xs text-ink-500 mt-0.5">全链路操作留痕，合规可溯</p>
          </div>
        </div>
      </div>

      {/* 区块1: 数据概览卡片(4张横排) */}
      <div className="grid grid-cols-4 gap-5">
        <DataCard
          title="今日操作总数"
          value={todayTotal}
          unit="次"
          prefix={<Activity className="h-4 w-4" />}
          trend={8.5}
          comparedTo="week"
          accentColor={COLORS.brand}
          sparkline={last7DaysTrend}
        />

        <Card className="!rounded-xl !shadow-card hover:!shadow-cardHover transition-all duration-300 !border-0" styles={{ body: { padding: 20 } }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div
                className="mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${COLORS.purple}12`, color: COLORS.purple }}
              >
                <BarChart3 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-medium text-ink-600">核心模块操作TOP5</h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div style={{ width: 110, height: 110, flexShrink: 0 }}>
              <ReactECharts option={modulePieOption} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {Object.entries(
                auditLogs.reduce<Record<string, number>>((acc, l) => {
                  acc[l.module] = (acc[l.module] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count], idx) => {
                  const color =
                    idx === 0
                      ? COLORS.brand
                      : idx === 1
                      ? COLORS.success
                      : idx === 2
                      ? COLORS.gold
                      : idx === 3
                      ? COLORS.warning
                      : COLORS.purple;
                  const total = auditLogs.length || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={name} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-ink-600 truncate flex-1">{name}</span>
                      <span className="font-mono font-semibold text-ink-800">{pct}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>

        <DataCard
          title="失败/异常操作数"
          value={failedCount}
          unit="次"
          prefix={<FileWarning className="h-4 w-4" />}
          trend={-2.3}
          comparedTo="week"
          accentColor={COLORS.danger}
          sparkline={failedTrend}
        />

        <Card className="!rounded-xl !shadow-card hover:!shadow-cardHover transition-all duration-300 !border-0" styles={{ body: { padding: 20 } }}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <div
                className="mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${COLORS.success}12`, color: COLORS.success }}
              >
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-medium text-ink-600">角色操作分布</h3>
            </div>
          </div>
          <div style={{ height: 115 }}>
            <ReactECharts option={roleStackOption} style={{ width: '100%', height: '100%' }} />
          </div>
        </Card>
      </div>

      {/* 区块2: 高级筛选器 */}
      <Card
        className="!rounded-xl !shadow-card !border-0"
        styles={{ body: { padding: 24 } }}
        title={
          <div className="flex items-center gap-2">
            <Filter size={16} style={{ color: COLORS.brand }} />
            <span className="font-semibold text-ink-700">高级筛选器</span>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          initialValues={{ result: '', module: '', actionType: '', operatorRole: '' }}
        >
          {/* 第一行 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="所属模块" name="module" className="!mb-3">
                <Select options={MODULE_OPTIONS} placeholder="选择模块" size="large" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="操作类型" name="actionType" className="!mb-3">
                <Select
                  options={ACTION_OPTIONS.map((o) => ({
                    ...o,
                    label: o.value
                      ? ACTION_LABEL_MAP[o.value] || o.label
                      : o.label,
                  }))}
                  placeholder="选择操作类型"
                  size="large"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="操作人" name="operatorName" className="!mb-3">
                <Input placeholder="输入操作人姓名" size="large" allowClear prefix={<Search size={14} />} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="角色" name="operatorRole" className="!mb-3">
                <Select options={ROLE_OPTIONS} placeholder="选择角色" size="large" allowClear />
              </Form.Item>
            </Col>
          </Row>

          {/* 第二行 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="操作结果" name="result" className="!mb-3">
                <Select options={RESULT_OPTIONS} placeholder="选择结果" size="large" allowClear />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="时间范围" name="dateRange" className="!mb-3">
                <RangePicker style={{ width: '100%' }} size="large" showTime format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="IP地址" name="operatorIp" className="!mb-3">
                <Input placeholder="输入IP地址段" size="large" allowClear />
              </Form.Item>
            </Col>
          </Row>

          {/* 第三行 */}
          <Row gutter={16} align="bottom">
            <Col span={10}>
              <Form.Item label="关键词搜索" name="keyword" className="!mb-3">
                <Input
                  placeholder="搜索操作描述/目标名称/请求ID"
                  size="large"
                  allowClear
                  prefix={<Search size={14} />}
                />
              </Form.Item>
            </Col>
            <Col span={14}>
              <div className="flex gap-2 justify-end mb-3">
                <Button type="primary" htmlType="submit" size="large" icon={<Search size={16} />}>
                  查询
                </Button>
                <Button size="large" icon={<RefreshCw size={16} />} onClick={handleReset}>
                  重置
                </Button>
                <Button size="large" icon={<Download size={16} />} onClick={handleExport}>
                  导出Excel
                </Button>
                <Button
                  size="large"
                  icon={<Filter size={16} />}
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                >
                  高级筛选
                  <ChevronDown
                    size={14}
                    className={`ml-1 transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`}
                  />
                </Button>
              </div>
            </Col>
          </Row>

          {/* 高级筛选折叠内容 */}
          {advancedOpen && (
            <div className="animate-fade-in-up pt-2 border-t border-ink-100">
              <Row gutter={16} className="pt-4">
                <Col span={8}>
                  <Form.Item label="会话ID(SessionID)" name="sessionId" className="!mb-0">
                    <Input placeholder="输入会话ID片段" size="large" allowClear />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="关联单号" name="bizNo" className="!mb-0">
                    <Input placeholder="输入业务单号" size="large" allowClear />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="变更字段" name="changedField" className="!mb-0">
                    <Input placeholder="输入字段名或中文描述" size="large" allowClear />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}
        </Form>
      </Card>

      {/* 区块3: 审计日志主表格 */}
      <Card
        className="!rounded-xl !shadow-card !border-0"
        styles={{ body: { padding: 0 } }}
        title={
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between mb-0">
              <div className="flex items-center gap-2">
                <FileText size={16} style={{ color: COLORS.brand }} />
                <span className="font-semibold text-ink-700">审计日志明细</span>
                <Tag color="blue" className="!ml-2">
                  共 {filteredLogs.length} 条记录
                </Tag>
              </div>
            </div>
          </div>
        }
      >
        <Table<AuditLog>
          columns={columns}
          dataSource={pagedLogs}
          rowKey="id"
          pagination={{
            ...pagination,
            total: filteredLogs.length,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
          expandable={{
            expandedRowRender,
            expandedRowClassName: () => '!p-0',
          }}
          scroll={{ x: 1300, y: 600 }}
          size="middle"
          sticky={{ offsetHeader: 0 }}
          className="!border-0 [&_.ant-table-thead>tr>th]:!bg-ink-50 [&_.ant-table-thead>tr>th]:!text-ink-600 [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-xs"
        />
      </Card>

      {/* 区块4: 合规功能区 */}
      <Card
        className="!rounded-xl !shadow-card !border-0"
        styles={{ body: { padding: 24 } }}
      >
        <Row gutter={24}>
          {/* 左侧: 日志完整性校验徽章 */}
          <Col span={8}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={16} style={{ color: COLORS.success }} />
              <span className="font-semibold text-ink-700">日志完整性校验</span>
            </div>
            <div className="space-y-3 bg-gradient-to-br from-success-50/50 to-white rounded-xl p-5 border border-success-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status="通过" />
                  <span className="text-sm font-medium text-ink-700">哈希链完整性</span>
                </div>
                <CheckCircle2 size={20} className="text-success-500" />
              </div>
              <Divider className="!my-2 !border-success-100/50" />
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <Text type="secondary">最近一次校验</Text>
                  <Text className="font-mono text-ink-700">{dayjs().format('YYYY-MM-DD')} 08:00</Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text type="secondary">日志保存期限</Text>
                  <Text className="text-ink-700 font-medium">180天 <Tag color="green" className="!ml-1 !text-[10px]">合规</Tag></Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text type="secondary">区块链存证</Text>
                  <Text className="text-ink-700 font-medium">已启用</Text>
                </div>
              </div>
            </div>
          </Col>

          {/* 中间: 风险分布仪表盘 */}
          <Col span={8}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} style={{ color: COLORS.gold }} />
              <span className="font-semibold text-ink-700">操作风险分布</span>
            </div>
            <div className="bg-gradient-to-br from-gold-50/30 to-white rounded-xl p-4 border border-gold-100/50">
              <div style={{ height: 180 }}>
                <ReactECharts option={riskGaugeOption} style={{ width: '100%', height: '100%' }} />
              </div>
              <div className="text-center text-xs mt-1">
                <Text type="secondary">基于近7天异常操作频率智能评估</Text>
              </div>
            </div>
          </Col>

          {/* 右侧: 导出与留存配置 */}
          <Col span={8}>
            <div className="flex items-center gap-2 mb-4">
              <Download size={16} style={{ color: COLORS.purple }} />
              <span className="font-semibold text-ink-700">导出与留存配置</span>
            </div>
            <div className="space-y-4 bg-gradient-to-br from-purple-50/30 to-white rounded-xl p-5 border border-purple-100/50">
              <div>
                <Text type="secondary" className="block text-xs mb-2">导出格式</Text>
                <Select
                  value={exportFormat}
                  onChange={setExportFormat}
                  size="large"
                  style={{ width: '100%' }}
                  options={[
                    { label: 'Excel (.xlsx)', value: 'excel' },
                    { label: 'CSV (.csv)', value: 'csv' },
                    { label: 'PDF 审计报告 (.pdf)', value: 'pdf' },
                  ]}
                />
              </div>
              <div>
                <Text type="secondary" className="block text-xs mb-2">
                  自定义导出字段
                  <Tag color="blue" className="!ml-1 !text-[10px]">{exportFields.length}/{EXPORT_FIELDS.length}</Tag>
                </Text>
                <Checkbox.Group
                  value={exportFields}
                  onChange={(vals) => setExportFields(vals as string[])}
                  className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs"
                >
                  {EXPORT_FIELDS.map((f) => (
                    <Checkbox key={f.value} value={f.value}>
                      {f.label}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
              <Button
                type="primary"
                size="large"
                block
                icon={<FileText size={16} />}
                onClick={handleGenerateReport}
                style={{ background: COLORS.purple, borderColor: COLORS.purple }}
              >
                生成合规审计报告
              </Button>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
