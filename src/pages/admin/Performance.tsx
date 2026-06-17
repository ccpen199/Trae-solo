import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Card, Table, Tag, Select, DatePicker, Button, Space, Statistic, Row, Col,
  Progress, List, Avatar, Tooltip, Divider, Empty, Badge, Steps, Timeline, Modal,
} from 'antd';
import {
  BarChart3, TrendingUp, Clock, XCircle, Filter, RefreshCw, ArrowUp, ArrowDown,
  Trophy, FileWarning, GitBranch, FileCheck2, ShieldAlert, FileKey, FileSearch,
  Network, AlertTriangle, CheckCircle2, Database, Zap, FileText, Users, Info,
  Bell, Eye, Send,
} from 'lucide-react';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { mockPerformanceData, mockDepartments } from '../../mock/data';
import type { PerformanceData, Department } from '../../shared/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SERVICE_TYPES = [
  { value: 'all', label: '全部事项类型' },
  { value: '社会保障', label: '社会保障' },
  { value: '户籍管理', label: '户籍管理' },
  { value: '医疗卫生', label: '医疗卫生' },
  { value: '住房建设', label: '住房建设' },
  { value: '市场监管', label: '市场监管' },
  { value: '税务服务', label: '税务服务' },
  { value: '民政服务', label: '民政服务' },
  { value: '交通运输', label: '交通运输' },
  { value: '教育服务', label: '教育服务' },
  { value: '生态环境', label: '生态环境' },
  { value: '农业农村', label: '农业农村' },
  { value: '自然资源', label: '自然资源' },
];

const CHANNELS = [
  { value: 'all', label: '全部办理渠道' },
  { value: 'online', label: '掌上办事（APP）' },
  { value: 'web', label: '政务服务网（PC）' },
  { value: 'hall', label: '政务大厅（线下）' },
  { value: 'self', label: '自助终端' },
  { value: 'cross', label: '跨域协同办件' },
];

const REJECTION_CATEGORIES = [
  { value: 'all', label: '全部退件原因' },
  { value: 'material', label: '材料不齐全/不规范' },
  { value: 'condition', label: '不符合办理条件' },
  { value: 'info', label: '填写信息有误' },
  { value: 'policy', label: '政策适配失败' },
  { value: 'cert', label: '电子证照缺失' },
];

const CROSS_SCENARIOS = [
  { value: 'all', label: '全部协同场景' },
  { value: 'province', label: '省内通办' },
  { value: 'cross_province', label: '跨省通办' },
  { value: 'city', label: '市域通办' },
  { value: 'one_thing', label: '一件事联办' },
  { value: 'department', label: '部门协办' },
];

const CHANNEL_COLORS: Record<string, string> = {
  online: '#165DFF',
  web: '#722ED1',
  hall: '#FF7D00',
  self: '#00B42A',
  cross: '#F53F3F',
};

const generateDepartmentRanking = () => {
  return mockDepartments.map((dept: Department, index: number) => {
    const baseRate = 82 + Math.random() * 17;
    const baseTime = 18 + Math.random() * 42;
    const totalApps = Math.floor(Math.random() * 3500) + 600;
    const rejectionRate = Math.random() * 6 + 0.5;
    const certCalls = Math.floor(Math.random() * 2000) + 300;
    const subsidyMatch = Math.floor(Math.random() * 500) + 20;
    const crossCases = Math.floor(Math.random() * 800) + 50;

    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      completionRate: Math.round(baseRate * 10) / 10,
      avgHandlingTime: Math.round(baseTime * 10) / 10,
      totalApplications: totalApps,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
      certCalls,
      subsidyMatch,
      crossCases,
      rank: index + 1,
    };
  }).sort((a, b) => b.completionRate - a.completionRate).map((item, index) => ({ ...item, rank: index + 1 }));
};

const REJECTION_CLUSTER_INSIGHTS = [
  {
    level: 'high',
    title: '材料不齐全高风险预警',
    desc: '住建、人社部门近7天"材料缺失"退件环比上升23%，集中在公积金提取、社保转移事项，建议更新办事指南并增加AI预填引导。',
    affected: ['住房和城乡建设厅', '人力资源和社会保障厅'],
    suggestion: '更新办事指南 + AI材料预检',
  },
  {
    level: 'medium',
    title: '政策适配异常',
    desc: '农业农村厅涉农补贴事项因政策规则引擎参数未同步，导致18件符合条件申请被误退，已通知政策适配中心紧急校准。',
    affected: ['农业农村厅'],
    suggestion: '政策规则引擎紧急校准',
  },
  {
    level: 'medium',
    title: '电子证照互认不足',
    desc: '公安厅户籍类事项调用电子结婚证、电子出生证成功率仅76%，卫健、民政部门证照库接口偶发超时，需通知容灾中心切换缓存。',
    affected: ['公安厅', '卫生健康委员会', '民政局'],
    suggestion: '切换证照缓存容灾通道',
  },
  {
    level: 'low',
    title: '表单信息填写规范',
    desc: '市监、税务部门企业开办事项"统一社会信用代码"填写错误率约3.2%，建议增加格式自动校验和企业信息自动回填。',
    affected: ['市场监督管理局', '税务局'],
    suggestion: '增加格式校验 + 企业信息回填',
  },
];

const HANDLING_CHAINS = [
  {
    id: 'hc1',
    service: '新生儿出生"一件事"联办',
    citizen: '李某某',
    applyTime: '2026-06-15 09:32:18',
    status: 'processing',
    currentStep: 3,
    steps: [
      { title: '群众提交', time: '06-15 09:32', dept: '掌上办事APP', status: 'done', desc: '在线提交出生医学证明+父母身份证' },
      { title: '卫健证照核验', time: '06-15 09:35', dept: '卫生健康委员会', status: 'done', desc: '调用电子证照库：出生医学证明核验通过' },
      { title: '公安户口登记', time: '06-15 09:41', dept: '公安厅', status: 'processing', desc: '正在办理出生登记，预计2小时内完成' },
      { title: '人社社保参保', time: '待处理', dept: '人力资源和社会保障厅', status: 'pending', desc: '少儿医保自动参保登记' },
      { title: '民政补贴推送', time: '待处理', dept: '民政局', status: 'pending', desc: '育儿补贴政策自动匹配+发放' },
    ],
  },
  {
    id: 'hc2',
    service: '企业开办"一网通办"',
    citizen: '某科技有限公司',
    applyTime: '2026-06-15 14:08:55',
    status: 'warning',
    currentStep: 2,
    steps: [
      { title: '企业提交', time: '06-15 14:09', dept: '政务服务网', status: 'done', desc: '提交工商注册+税务登记+银行开户' },
      { title: '市监工商登记', time: '06-15 14:12', dept: '市场监督管理局', status: 'warning', desc: '经营地址需补充材料，已通过短信+站内信推送补正通知' },
      { title: '税务税务登记', time: '待补正', dept: '税务局', status: 'pending', desc: '等待市监证照同步后自动登记' },
      { title: '银行开户预约', time: '待处理', dept: '建设银行', status: 'pending', desc: '预约对公账户开户' },
      { title: '社保公积金开户', time: '待处理', dept: '人力资源和社会保障厅', status: 'pending', desc: '企业社保账户自动开立' },
    ],
  },
  {
    id: 'hc3',
    service: '跨省户口迁移（京津冀通办）',
    citizen: '张某某',
    applyTime: '2026-06-14 16:45:02',
    status: 'done',
    currentStep: 5,
    steps: [
      { title: '迁入申请', time: '06-14 16:45', dept: '掌上办事APP', status: 'done', desc: '跨省户口迁移申请，选择京津冀通办通道' },
      { title: '迁入地受理', time: '06-14 17:02', dept: '公安厅（北京）', status: 'done', desc: '受理通过，调用跨省协同接口通知迁出地' },
      { title: '迁出地核验', time: '06-15 08:31', dept: '公安厅（河北）', status: 'done', desc: '户籍信息核验通过，电子证照调阅完成' },
      { title: '公安户口核准', time: '06-15 10:18', dept: '公安厅', status: 'done', desc: '户口迁出核准完成' },
      { title: '证照同步更新', time: '06-15 11:05', dept: '多部门同步', status: 'done', desc: '身份证、居住证、社保等信息已联动更新' },
    ],
  },
];

const MATERIAL_CORRECTION_CASES = [
  {
    id: 'mc1',
    service: '公积金提取（购房）',
    applicant: '王某某',
    department: '住房和城乡建设厅',
    submitTime: '2026-06-16 10:23',
    rejectTime: '2026-06-16 11:08',
    fixDeadline: '2026-06-23 23:59',
    missingItems: [
      { name: '购房合同原件扫描件', reason: '模糊不清，请重新上传清晰版本', status: 'pending' },
      { name: '首付款发票', reason: '上传的收据不具备法律效力，请提供正式发票', status: 'pending' },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent', time: '11:09:02' },
      { channel: '手机短信', status: 'sent', time: '11:09:05' },
      { channel: '邮件通知', status: 'sent', time: '11:09:07' },
      { channel: '人工电话', status: 'pending', time: '-' },
    ],
  },
  {
    id: 'mc2',
    service: '食品经营许可证核发',
    applicant: '某餐饮管理公司',
    department: '市场监督管理局',
    submitTime: '2026-06-15 15:41',
    rejectTime: '2026-06-16 09:17',
    fixDeadline: '2026-06-22 23:59',
    missingItems: [
      { name: '从业人员健康证明', reason: '健康证已过期，请上传最新版本（有效期内）', status: 'pending' },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent', time: '09:17:33' },
      { channel: '手机短信', status: 'sent', time: '09:17:36' },
      { channel: '邮件通知', status: 'sent', time: '09:17:39' },
      { channel: '人工电话', status: 'sent', time: '09:25:12' },
    ],
  },
  {
    id: 'mc3',
    service: '灵活就业人员社保参保',
    applicant: '李某某',
    department: '人力资源和社会保障厅',
    submitTime: '2026-06-16 08:52',
    rejectTime: '2026-06-16 09:34',
    fixDeadline: '2026-06-30 23:59',
    missingItems: [
      { name: '居住证明', reason: '电子居住证调用失败，请手动上传居住证明材料', status: 'done' },
      { name: '身份证正反面', reason: '上传成功但仅正面，请补充反面', status: 'pending' },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent', time: '09:34:11' },
      { channel: '手机短信', status: 'sent', time: '09:34:14' },
      { channel: '邮件通知', status: 'failed', time: '09:34:18' },
      { channel: '人工电话', status: 'sent', time: '09:40:03' },
    ],
  },
];

const LEDGER_SERVICES = [
  '住房公积金提取（购房）', '居住证签注', '社保关系跨省转移',
  '食品经营许可证核发', '户口迁移（跨省）', '医保异地就医备案',
  '新生儿出生登记', '营业执照变更', '不动产登记',
  '纳税申报（增值税）', '婚姻登记预约', '道路运输经营许可',
  '建房审批', '再生育审批', '排污许可',
];

const LEDGER_NODES = ['材料审核', '信息核验', '跨区协办', '现场核查', '审批签发', '部门会签', '领导审批', '系统处理', '证照核验', '材料预审', '受理登记', '结果送达', '材料审核', '信息核验', '审批签发'];

const LEDGER_PERSONS = ['张主任', '李科长', '王副主任', '赵科员', '孙所长', '周处长', '吴主管', '郑科长', '钱干事', '冯书记', '陈主任', '许组长', '韩科长', '曹主任', '魏处长'];

const LEDGER_APPLICANTS = ['王某某', '李某某', '张某某', '赵某某', '刘某某', '陈某某', '杨某某', '黄某某', '周某某', '吴某某', '郑某某', '孙某某', '马某某', '朱某某', '何某某'];

const LEDGER_STATUSES = ['办理中', '审核中', '补正中', '即将超期', '办理中', '审核中', '办理中', '即将超期', '补正中', '办理中', '审核中', '办理中', '审核中', '办理中', '即将超期'];

const LEDGER_ELAPSED = [12, 8, 36, 72, 5, 18, 24, 96, 48, 3, 15, 6, 20, 10, 84];

const LEDGER_RECORDS = Array.from({ length: 15 }, (_, index) => {
  const dept = mockDepartments[index % mockDepartments.length];
  return {
    key: String(index + 1),
    applyNo: `2026-BS-${String(index + 31).padStart(4, '0')}`,
    serviceName: LEDGER_SERVICES[index],
    applicant: LEDGER_APPLICANTS[index],
    department: dept.name,
    currentNode: LEDGER_NODES[index],
    nodePerson: LEDGER_PERSONS[index],
    status: LEDGER_STATUSES[index],
    elapsed: LEDGER_ELAPSED[index],
  };
});

const ALL_CORRECTION_CASES = [
  ...MATERIAL_CORRECTION_CASES,
  {
    id: 'mc4',
    service: '营业执照变更',
    applicant: '某商贸有限公司',
    department: '市场监督管理局',
    submitTime: '2026-06-14 11:20',
    rejectTime: '2026-06-15 09:42',
    fixDeadline: '2026-06-22 23:59',
    missingItems: [
      { name: '股东会决议原件', reason: '需全体股东签字盖章', status: 'pending' as const },
      { name: '章程修正案', reason: '修正案未加盖公章', status: 'pending' as const },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent' as const, time: '09:42:15' },
      { channel: '手机短信', status: 'sent' as const, time: '09:42:18' },
      { channel: '邮件通知', status: 'sent' as const, time: '09:42:21' },
      { channel: '人工电话', status: 'pending' as const, time: '-' },
    ],
  },
  {
    id: 'mc5',
    service: '不动产登记（二手房过户）',
    applicant: '杨某某',
    department: '自然资源厅',
    submitTime: '2026-06-15 16:33',
    rejectTime: '2026-06-16 08:51',
    fixDeadline: '2026-06-23 23:59',
    missingItems: [
      { name: '原产权证书', reason: '原产权证信息与系统登记不一致', status: 'pending' as const },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent' as const, time: '08:51:03' },
      { channel: '手机短信', status: 'sent' as const, time: '08:51:06' },
      { channel: '邮件通知', status: 'failed' as const, time: '08:51:09' },
      { channel: '人工电话', status: 'sent' as const, time: '09:10:22' },
    ],
  },
  {
    id: 'mc6',
    service: '道路运输经营许可',
    applicant: '某物流有限公司',
    department: '交通运输厅',
    submitTime: '2026-06-16 07:45',
    rejectTime: '2026-06-16 10:18',
    fixDeadline: '2026-06-23 23:59',
    missingItems: [
      { name: '车辆行驶证复印件', reason: '部分车辆行驶证已过期，请更新', status: 'pending' as const },
      { name: '安全生产管理制度', reason: '未提供完整的安全生产管理制度文本', status: 'pending' as const },
      { name: '驾驶员从业资格证', reason: '3名驾驶员从业资格证到期需换证', status: 'pending' as const },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent' as const, time: '10:18:30' },
      { channel: '手机短信', status: 'sent' as const, time: '10:18:33' },
      { channel: '邮件通知', status: 'sent' as const, time: '10:18:36' },
      { channel: '人工电话', status: 'pending' as const, time: '-' },
    ],
  },
  {
    id: 'mc7',
    service: '再生育审批',
    applicant: '刘某某',
    department: '卫生健康委员会',
    submitTime: '2026-06-15 13:50',
    rejectTime: '2026-06-16 09:35',
    fixDeadline: '2026-06-30 23:59',
    missingItems: [
      { name: '夫妻双方婚育情况证明', reason: '需户籍地街道办出具盖章版证明', status: 'done' as const },
      { name: '再婚相关法律文书', reason: '再婚情况需提供法院判决书或调解书', status: 'pending' as const },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent' as const, time: '09:35:12' },
      { channel: '手机短信', status: 'sent' as const, time: '09:35:15' },
      { channel: '邮件通知', status: 'sent' as const, time: '09:35:18' },
      { channel: '人工电话', status: 'sent' as const, time: '09:42:08' },
    ],
  },
  {
    id: 'mc8',
    service: '排污许可证核发',
    applicant: '某化工有限公司',
    department: '生态环境厅',
    submitTime: '2026-06-14 09:18',
    rejectTime: '2026-06-15 15:40',
    fixDeadline: '2026-06-22 23:59',
    missingItems: [
      { name: '环境影响评价批复文件', reason: '环评批复文号与系统登记不一致', status: 'pending' as const },
      { name: '监测报告（近3个月）', reason: '需提供具有CMA资质的第三方监测报告', status: 'pending' as const },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent' as const, time: '15:40:05' },
      { channel: '手机短信', status: 'sent' as const, time: '15:40:08' },
      { channel: '邮件通知', status: 'sent' as const, time: '15:40:11' },
      { channel: '人工电话', status: 'sent' as const, time: '15:55:41' },
    ],
  },
];

const CROSS_MODULE_STATUS = [
  {
    key: 'policy',
    title: '政策引擎 · 补贴匹配状态',
    icon: <FileSearch className="w-5 h-5 text-purple-600" />,
    color: 'purple',
    totalMatched: 8642,
    activePolicies: 147,
    todayNew: 231,
    exceptionCount: 3,
    topItems: [
      { name: '涉农补贴自动匹配', count: 1289, rate: 97.2, status: 'normal' },
      { name: '育儿津贴政策适配', count: 856, rate: 98.5, status: 'normal' },
      { name: '稳岗返还智能核准', count: 421, rate: 95.8, status: 'warning' },
      { name: '高校毕业生就业补贴', count: 312, rate: 99.1, status: 'normal' },
    ],
  },
  {
    key: 'disaster',
    title: '容灾中心 · 应急受理状态',
    icon: <ShieldAlert className="w-5 h-5 text-orange-600" />,
    color: 'orange',
    totalCached: 28347,
    activeSystems: 12,
    failoverNow: 1,
    cacheHitRate: 99.7,
    topItems: [
      { name: '税务业务系统', count: 0, rate: 98.2, status: 'error', note: '主系统故障，缓存应急受理中' },
      { name: '卫健业务系统', count: 342, rate: 96.8, status: 'warning', note: '接口超时时，自动切换缓存证照' },
      { name: '人社业务系统', count: 0, rate: 99.5, status: 'normal' },
      { name: '市监业务系统', count: 0, rate: 99.8, status: 'normal' },
    ],
  },
  {
    key: 'cert',
    title: '电子证照 · 互认调用状态',
    icon: <FileKey className="w-5 h-5 text-blue-600" />,
    color: 'blue',
    totalCalls: 156842,
    certTypes: 234,
    successRate: 96.8,
    todayFail: 113,
    topItems: [
      { name: '居民身份证调用', count: 42187, rate: 99.2, status: 'normal' },
      { name: '居民户口簿调用', count: 28543, rate: 98.7, status: 'normal' },
      { name: '结婚证/离婚证调用', count: 15823, rate: 89.3, status: 'warning', note: '民政接口偶发超时' },
      { name: '出生医学证明调用', count: 9231, rate: 94.5, status: 'warning', note: '卫健系统每日凌晨维护' },
    ],
  },
];

export default function Performance() {
  const trendChartRef = useRef<HTMLDivElement>(null);
  const timeChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const channelChartRef = useRef<HTMLDivElement>(null);
  const chainChartRef = useRef<HTMLDivElement>(null);
  const certChartRef = useRef<HTMLDivElement>(null);

  const trendChartInstance = useRef<echarts.ECharts | null>(null);
  const timeChartInstance = useRef<echarts.ECharts | null>(null);
  const pieChartInstance = useRef<echarts.ECharts | null>(null);
  const channelChartInstance = useRef<echarts.ECharts | null>(null);
  const chainChartInstance = useRef<echarts.ECharts | null>(null);
  const certChartInstance = useRef<echarts.ECharts | null>(null);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedRejection, setSelectedRejection] = useState<string>('all');
  const [selectedScenario, setSelectedScenario] = useState<string>('all');
  const [departmentRanking] = useState(generateDepartmentRanking);
  const [expandedLedger, setExpandedLedger] = useState(false);
  const [expandedCorrection, setExpandedCorrection] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);

  const filteredData = useMemo(() => {
    let result = [...mockPerformanceData];
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      result = result.filter(d => d.date >= startDate && d.date <= endDate);
    }
    return result;
  }, [dateRange]);

  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        avgCompletionRate: 0, avgHandlingTime: 0, totalRejections: 0,
        totalApplications: 0, crossCases: 0, certCalls: 0, subsidyMatch: 0, correctionCases: 0,
      };
    }
    const avgCompletionRate = filteredData.reduce((s, d) => s + d.completionRate, 0) / filteredData.length;
    const avgHandlingTime = filteredData.reduce((s, d) => s + d.averageHandlingTime, 0) / filteredData.length;
    const totalRejections = filteredData.reduce((s, d) => s + d.rejectionCount, 0);
    const totalApplications = filteredData.reduce((s, d) => s + d.totalApplications, 0);
    return {
      avgCompletionRate: Math.round(avgCompletionRate * 10) / 10,
      avgHandlingTime: Math.round(avgHandlingTime * 10) / 10,
      totalRejections,
      totalApplications,
      crossCases: Math.round(totalApplications * 0.18),
      certCalls: Math.round(totalApplications * 3.2),
      subsidyMatch: Math.round(totalApplications * 0.08),
      correctionCases: Math.round(totalRejections * 0.35),
    };
  }, [filteredData]);

  const rejectionReasonsAggregated = useMemo(() => {
    const reasonMap: Record<string, number> = {};
    filteredData.forEach(d => {
      d.rejectionReasons.forEach(r => {
        reasonMap[r.reason] = (reasonMap[r.reason] || 0) + r.count;
      });
    });
    return Object.entries(reasonMap).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const channelDistribution = useMemo(() => [
    { name: '掌上办事APP', value: Math.round(summaryStats.totalApplications * 0.42), code: 'online' },
    { name: '政务服务网', value: Math.round(summaryStats.totalApplications * 0.23), code: 'web' },
    { name: '政务大厅', value: Math.round(summaryStats.totalApplications * 0.18), code: 'hall' },
    { name: '自助终端', value: Math.round(summaryStats.totalApplications * 0.09), code: 'self' },
    { name: '跨域协同', value: Math.round(summaryStats.totalApplications * 0.08), code: 'cross' },
  ], [summaryStats.totalApplications]);

  useEffect(() => {
    if (!trendChartRef.current) return;
    trendChartInstance.current = echarts.init(trendChartRef.current);
    const dates = filteredData.map(d => d.date.slice(5));
    const completionRates = filteredData.map(d => d.completionRate);
    const crossRates = filteredData.map(d => 78 + Math.random() * 18);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: (params: any) => {
          const date = params[0].axisValue;
          let result = `<div style="font-weight:600;margin-bottom:8px;">${date}</div>`;
          params.forEach((p: any) => {
            result += `<div style="display:flex;align-items:center;margin:4px 0;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:8px;"></span>
              <span style="margin-right:8px;">${p.seriesName}:</span>
              <span style="font-weight:600;">${p.value}%</span>
            </div>`;
          });
          return result;
        },
      },
      legend: { data: ['整体办结率', '跨域办结率'], top: 0, right: 0, textStyle: { fontSize: 11, color: '#4E5969' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category', data: dates,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value', min: 70, max: 100,
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 10, formatter: '{value}%' },
      },
      series: [
        {
          name: '整体办结率', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
          showSymbol: false, lineStyle: { width: 3, color: '#165DFF' },
          itemStyle: { color: '#165DFF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22,93,255,0.3)' },
              { offset: 1, color: 'rgba(22,93,255,0.02)' },
            ]),
          },
          data: completionRates,
          markLine: {
            silent: true, lineStyle: { color: '#F53F3F', type: 'dashed' },
            data: [{ yAxis: 80, label: { formatter: '达标线 80%', color: '#F53F3F', fontSize: 10 } }],
          },
        },
        {
          name: '跨域办结率', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
          showSymbol: false, lineStyle: { width: 2.5, color: '#722ED1', type: 'dashed' },
          itemStyle: { color: '#722ED1' },
          data: crossRates,
        },
      ],
    };
    trendChartInstance.current.setOption(option);
    const resize = () => trendChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); trendChartInstance.current?.dispose(); };
  }, [filteredData]);

  useEffect(() => {
    if (!timeChartRef.current) return;
    timeChartInstance.current = echarts.init(timeChartRef.current);
    const dates = filteredData.map(d => d.date.slice(5));
    const avgTimes = filteredData.map(d => d.averageHandlingTime);
    const targetTimes = filteredData.map(() => 30);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129' },
      },
      legend: { data: ['实际办理时长', '目标时长'], top: 0, right: 0, textStyle: { fontSize: 11, color: '#4E5969' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category', data: dates,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 10, formatter: '{value}分' },
      },
      series: [
        {
          name: '实际办理时长', type: 'bar', barWidth: '50%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#722ED1' }, { offset: 1, color: '#722ED166' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          data: avgTimes,
        },
        {
          name: '目标时长', type: 'line', lineStyle: { color: '#00B42A', width: 2, type: 'dashed' },
          itemStyle: { color: '#00B42A' }, symbol: 'none',
          data: targetTimes,
        },
      ],
    };
    timeChartInstance.current.setOption(option);
    const resize = () => timeChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); timeChartInstance.current?.dispose(); };
  }, [filteredData]);

  useEffect(() => {
    if (!pieChartRef.current) return;
    pieChartInstance.current = echarts.init(pieChartRef.current);
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129' },
        formatter: '{b}: {c}件 ({d}%)',
      },
      legend: {
        orient: 'vertical', right: '3%', top: 'center',
        icon: 'circle', itemWidth: 8, itemHeight: 8,
        textStyle: { color: '#4E5969', fontSize: 11 },
      },
      color: ['#165DFF', '#722ED1', '#FF7D00', '#00B42A', '#F53F3F', '#14C9C9'],
      series: [{
        name: '退件原因', type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 15, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: rejectionReasonsAggregated,
      }],
    };
    pieChartInstance.current.setOption(option);
    const resize = () => pieChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); pieChartInstance.current?.dispose(); };
  }, [rejectionReasonsAggregated]);

  useEffect(() => {
    if (!channelChartRef.current) return;
    channelChartInstance.current = echarts.init(channelChartRef.current);
    const colors = channelDistribution.map(c => CHANNEL_COLORS[c.code] || '#86909C');
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129' },
        formatter: (params: any) => {
          const p = params[0];
          const total = channelDistribution.reduce((s, c) => s + c.value, 0);
          const pct = ((p.value / total) * 100).toFixed(1);
          return `${p.name}: ${p.value.toLocaleString()}件 (${pct}%)`;
        },
      },
      grid: { left: '3%', right: '10%', bottom: '3%', top: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 10 },
      },
      yAxis: {
        type: 'category', data: channelDistribution.map(c => c.name),
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#4E5969', fontSize: 11 },
        axisTick: { show: false },
      },
      series: [{
        name: '办件量', type: 'bar', barWidth: '55%',
        itemStyle: {
          color: (p: any) => colors[p.dataIndex],
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true, position: 'right', color: '#4E5969',
          fontSize: 11, formatter: (p: any) => {
            const total = channelDistribution.reduce((s, c) => s + c.value, 0);
            return `${p.value.toLocaleString()} (${((p.value / total) * 100).toFixed(1)}%)`;
          },
        },
        data: channelDistribution.map(c => c.value),
      }],
    };
    channelChartInstance.current.setOption(option);
    const resize = () => channelChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); channelChartInstance.current?.dispose(); };
  }, [channelDistribution]);

  useEffect(() => {
    if (!chainChartRef.current) return;
    chainChartInstance.current = echarts.init(chainChartRef.current);
    const chainStages = ['申请提交', '材料预审', '部门受理', '业务审核', '证照调用', '结果送达'];
    const chainDepts = [
      [100, 98, 95, 88, 92, 97],
      [100, 92, 89, 85, 82, 95],
      [100, 99, 97, 95, 96, 99],
    ];
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129' },
      },
      legend: {
        data: ['即办件（社保类）', '承诺件（市监类）', '联办件（新生儿一件事）'],
        top: 0, right: 0, textStyle: { fontSize: 11, color: '#4E5969' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category', data: chainStages, boundaryGap: false,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value', min: 60, max: 100,
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 10, formatter: '{value}%' },
      },
      series: [
        {
          name: '即办件（社保类）', type: 'line', smooth: true,
          symbol: 'circle', symbolSize: 7, lineStyle: { width: 2.5, color: '#165DFF' },
          itemStyle: { color: '#165DFF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22,93,255,0.25)' },
              { offset: 1, color: 'rgba(22,93,255,0.02)' },
            ]),
          },
          data: chainDepts[0],
        },
        {
          name: '承诺件（市监类）', type: 'line', smooth: true,
          symbol: 'circle', symbolSize: 7, lineStyle: { width: 2.5, color: '#FF7D00' },
          itemStyle: { color: '#FF7D00' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255,125,0,0.2)' },
              { offset: 1, color: 'rgba(255,125,0,0.02)' },
            ]),
          },
          data: chainDepts[1],
        },
        {
          name: '联办件（新生儿一件事）', type: 'line', smooth: true,
          symbol: 'circle', symbolSize: 7, lineStyle: { width: 2.5, color: '#00B42A' },
          itemStyle: { color: '#00B42A' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,180,42,0.2)' },
              { offset: 1, color: 'rgba(0,180,42,0.02)' },
            ]),
          },
          data: chainDepts[2],
        },
      ],
    };
    chainChartInstance.current.setOption(option);
    const resize = () => chainChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); chainChartInstance.current?.dispose(); };
  }, []);

  useEffect(() => {
    if (!certChartRef.current) return;
    certChartInstance.current = echarts.init(certChartRef.current);
    const deptCodes = ['人社', '公安', '卫健', '住建', '市监', '税务', '民政', '交通', '教育', '环保', '农业', '自然资源'];
    const certSuccess = [99.2, 98.7, 94.5, 97.8, 98.3, 89.3, 96.8, 97.1, 98.5, 95.2, 96.7, 97.3];
    const certVolume = [42187, 38543, 23124, 18542, 15234, 12543, 9823, 7234, 6534, 4231, 3842, 3421];

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129' },
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['证照调用成功率', '证照调用量（次）'],
        top: 0, right: 0, textStyle: { fontSize: 11, color: '#4E5969' },
      },
      grid: { left: '3%', right: '8%', bottom: '3%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category', data: deptCodes,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value', name: '成功率', min: 80, max: 100,
          axisLine: { show: false }, axisTick: { show: false },
          splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
          axisLabel: { color: '#86909C', fontSize: 10, formatter: '{value}%' },
          nameTextStyle: { color: '#86909C', fontSize: 10 },
        },
        {
          type: 'value', name: '调用量',
          axisLine: { show: false }, axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { color: '#86909C', fontSize: 10, formatter: (v: number) => (v / 1000).toFixed(0) + 'k' },
          nameTextStyle: { color: '#86909C', fontSize: 10 },
        },
      ],
      series: [
        {
          name: '证照调用成功率', type: 'bar', barWidth: '45%',
          itemStyle: {
            color: (p: any) => p.value >= 97 ? '#00B42A' : p.value >= 93 ? '#FF7D00' : '#F53F3F',
            borderRadius: [4, 4, 0, 0],
          },
          label: {
            show: true, position: 'top', color: '#4E5969',
            fontSize: 10, formatter: '{c}%',
          },
          data: certSuccess,
        },
        {
          name: '证照调用量（次）', type: 'line', yAxisIndex: 1,
          smooth: true, symbol: 'circle', symbolSize: 6,
          lineStyle: { width: 2.5, color: '#722ED1' },
          itemStyle: { color: '#722ED1' },
          data: certVolume,
        },
      ],
    };
    certChartInstance.current.setOption(option);
    const resize = () => certChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); certChartInstance.current?.dispose(); };
  }, []);

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 72,
      fixed: 'left' as const,
      render: (rank: number) => {
        let rankClass = 'bg-gov-gray-100 text-gov-gray-600';
        if (rank === 1) rankClass = 'bg-yellow-100 text-yellow-700';
        else if (rank === 2) rankClass = 'bg-gray-200 text-gray-700';
        else if (rank === 3) rankClass = 'bg-orange-100 text-orange-700';
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankClass}`}>
            {rank <= 3 ? <Trophy className="w-4 h-4" /> : rank}
          </div>
        );
      },
    },
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gov-gray-700">{name}</span>
          <Tag className="m-0 text-[10px]" color="geekblue">{record.code}</Tag>
        </div>
      ),
    },
    {
      title: '办结率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      width: 150,
      render: (rate: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={rate}
            size="small"
            strokeColor={rate >= 90 ? '#00B42A' : rate >= 80 ? '#FF7D00' : '#F53F3F'}
            showInfo={false}
            style={{ width: 80 }}
          />
          <span className={`font-semibold text-xs ${rate >= 90 ? 'text-green-600' : rate >= 80 ? 'text-orange-600' : 'text-red-600'}`}>
            {rate}%
          </span>
        </div>
      ),
    },
    {
      title: '平均耗时',
      dataIndex: 'avgHandlingTime',
      key: 'avgHandlingTime',
      width: 90,
      render: (time: number) => (
        <span className="font-medium text-gov-gray-700 text-xs">{time}分钟</span>
      ),
    },
    {
      title: '办件量',
      dataIndex: 'totalApplications',
      key: 'totalApplications',
      width: 95,
      render: (count: number) => (
        <span className="font-medium text-gov-gray-700 text-xs">{count.toLocaleString()}</span>
      ),
    },
    {
      title: '退件率',
      dataIndex: 'rejectionRate',
      key: 'rejectionRate',
      width: 85,
      render: (rate: number) => (
        <Tag color={rate > 3 ? 'red' : rate > 2 ? 'orange' : 'green'} className="text-xs m-0">
          {rate}%
        </Tag>
      ),
    },
    {
      title: '证照调用',
      dataIndex: 'certCalls',
      key: 'certCalls',
      width: 100,
      render: (v: number) => (
        <span className="text-xs text-blue-600 font-medium">{v.toLocaleString()}</span>
      ),
    },
    {
      title: '补贴匹配',
      dataIndex: 'subsidyMatch',
      key: 'subsidyMatch',
      width: 90,
      render: (v: number) => (
        <span className="text-xs text-purple-600 font-medium">{v.toLocaleString()}</span>
      ),
    },
    {
      title: '跨域办件',
      dataIndex: 'crossCases',
      key: 'crossCases',
      width: 90,
      render: (v: number) => (
        <span className="text-xs text-red-600 font-medium">{v.toLocaleString()}</span>
      ),
    },
    {
      title: '趋势',
      key: 'trend',
      width: 80,
      render: () => {
        const isUp = Math.random() > 0.5;
        return (
          <div className={`flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            {isUp ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            <span className="text-xs font-medium">{(Math.random() * 5).toFixed(1)}%</span>
          </div>
        );
      },
    },
  ];

  const handleReset = () => {
    setDateRange([dayjs().subtract(29, 'day'), dayjs()]);
    setSelectedDepartment('all');
    setSelectedServiceType('all');
    setSelectedChannel('all');
    setSelectedRejection('all');
    setSelectedScenario('all');
  };

  const chainStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#00B42A';
      case 'processing': return '#165DFF';
      case 'warning': return '#FF7D00';
      default: return '#C9CDD4';
    }
  };

  const chainStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-4 h-4" style={{ color: '#00B42A' }} />;
      case 'processing': return <Zap className="w-4 h-4 animate-pulse" style={{ color: '#165DFF' }} />;
      case 'warning': return <AlertTriangle className="w-4 h-4" style={{ color: '#FF7D00' }} />;
      default: return <Clock className="w-4 h-4" style={{ color: '#C9CDD4' }} />;
    }
  };

  return (
    <div className="min-h-screen bg-gov-gray-50 p-4 sm:p-6">
      <div className="max-w-[1680px] mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-gov-gray-700">效能监测中心</h1>
            <Space>
              <Tag color="green" className="text-sm m-0">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                实时监测中 · {mockDepartments.length}个委办局在线
              </Tag>
              <Button
                type="primary"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleReset}
                size="middle"
              >
                重置筛选
              </Button>
            </Space>
          </div>
          <p className="text-gov-gray-500">全量监测12个委办局政务服务效能，穿透至事项链路、材料补正、跨模块协同</p>
        </div>

        <Card className="shadow-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-gov-gray-700">筛选条件</span>
            <Tag color="blue" className="m-0 ml-2">6维筛选</Tag>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">时间范围</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                allowClear={false}
                size="middle"
                style={{ flex: 1 }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">责任部门</span>
              <Select
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                style={{ flex: 1 }}
                allowClear
                size="middle"
              >
                <Option value="all">全部部门（12个委办局）</Option>
                {mockDepartments.map(dept => (
                  <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">事项类型</span>
              <Select
                value={selectedServiceType}
                onChange={setSelectedServiceType}
                style={{ flex: 1 }}
                allowClear
                size="middle"
              >
                {SERVICE_TYPES.map(s => (
                  <Option key={s.value} value={s.value}>{s.label}</Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">办理渠道</span>
              <Select
                value={selectedChannel}
                onChange={setSelectedChannel}
                style={{ flex: 1 }}
                allowClear
                size="middle"
              >
                {CHANNELS.map(s => (
                  <Option key={s.value} value={s.value}>{s.label}</Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">退件原因</span>
              <Select
                value={selectedRejection}
                onChange={setSelectedRejection}
                style={{ flex: 1 }}
                allowClear
                size="middle"
              >
                {REJECTION_CATEGORIES.map(s => (
                  <Option key={s.value} value={s.value}>{s.label}</Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">协同场景</span>
              <Select
                value={selectedScenario}
                onChange={setSelectedScenario}
                style={{ flex: 1 }}
                allowClear
                size="middle"
              >
                {CROSS_SCENARIOS.map(s => (
                  <Option key={s.value} value={s.value}>{s.label}</Option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-blue-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><BarChart3 className="w-3.5 h-3.5" />平均办结率</div>}
                value={summaryStats.avgCompletionRate}
                suffix="%"
                valueStyle={{ color: '#165DFF', fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-purple-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><Clock className="w-3.5 h-3.5" />平均办理时长</div>}
                value={summaryStats.avgHandlingTime}
                suffix="分钟"
                valueStyle={{ color: '#722ED1', fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-green-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><TrendingUp className="w-3.5 h-3.5" />总办件量</div>}
                value={summaryStats.totalApplications}
                valueStyle={{ color: '#00B42A', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-red-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><XCircle className="w-3.5 h-3.5" />累计退件</div>}
                value={summaryStats.totalRejections}
                valueStyle={{ color: '#F53F3F', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-cyan-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><Network className="w-3.5 h-3.5" />跨域协同办件</div>}
                value={summaryStats.crossCases}
                valueStyle={{ color: '#14C9C9', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-indigo-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><FileKey className="w-3.5 h-3.5" />证照互认调用</div>}
                value={summaryStats.certCalls}
                valueStyle={{ color: '#6366F1', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-fuchsia-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><FileSearch className="w-3.5 h-3.5" />政策补贴匹配</div>}
                value={summaryStats.subsidyMatch}
                valueStyle={{ color: '#D946EF', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-amber-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><FileWarning className="w-3.5 h-3.5" />材料补正案件</div>}
                value={summaryStats.correctionCases}
                valueStyle={{ color: '#F59E0B', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={24} xl={12}>
            <Card
              title={<div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-600" /><span className="font-semibold">办结率趋势（整体 vs 跨域）</span></div>}
              className="shadow-card h-full"
              size="small"
            >
              <div ref={trendChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              title={<div className="flex items-center gap-2"><Clock className="w-5 h-5 text-purple-600" /><span className="font-semibold">平均办理耗时 vs 目标</span></div>}
              className="shadow-card h-full"
              size="small"
            >
              <div ref={timeChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card
              title={<div className="flex items-center gap-2"><XCircle className="w-5 h-5 text-red-600" /><span className="font-semibold">退件原因分布</span></div>}
              className="shadow-card h-full"
              size="small"
            >
              <div ref={pieChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={<div className="flex items-center gap-2"><Users className="w-5 h-5 text-orange-600" /><span className="font-semibold">办理渠道分布</span></div>}
              className="shadow-card h-full"
              size="small"
            >
              <div ref={channelChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-orange-600" />
                <span className="font-semibold">退件原因聚类结论</span>
                <Badge count={REJECTION_CLUSTER_INSIGHTS.length} className="ml-1" offset={[0, 0]} />
              </div>
              <Space size="small">
                <Tag color="red" className="m-0">高危 1</Tag>
                <Tag color="orange" className="m-0">中危 2</Tag>
                <Tag color="blue" className="m-0">低危 1</Tag>
              </Space>
            </div>
          }
          className="shadow-card mb-6"
          size="small"
        >
          <List
            itemLayout="vertical"
            dataSource={REJECTION_CLUSTER_INSIGHTS}
            renderItem={(item) => (
              <List.Item key={item.title}>
                <div className="flex items-start gap-3 w-full">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.level === 'high' ? 'bg-red-50' : item.level === 'medium' ? 'bg-orange-50' : 'bg-blue-50'
                  }`}>
                    {item.level === 'high' ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                      item.level === 'medium' ? <ShieldAlert className="w-5 h-5 text-orange-600" /> :
                      <Info className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h4 className="font-semibold text-gov-gray-700 m-0">{item.title}</h4>
                      <Tag color={
                        item.level === 'high' ? 'red' : item.level === 'medium' ? 'orange' : 'blue'
                      } className="m-0 text-xs">
                        {item.level === 'high' ? '高风险' : item.level === 'medium' ? '中风险' : '低风险'}
                      </Tag>
                    </div>
                    <p className="text-sm text-gov-gray-600 leading-relaxed mb-3">{item.desc}</p>
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <span className="text-xs text-gov-gray-500 mb-1.5 block">涉及部门</span>
                        <Space size={[4, 4]} wrap>
                          {item.affected.map(d => (
                            <Tag key={d} color="geekblue" className="m-0 text-xs">{d}</Tag>
                          ))}
                        </Space>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <span className="text-xs text-gov-gray-500 mb-1.5 block">优化建议</span>
                        <Tag color="green" className="m-0 text-xs bg-green-50">
                          {item.suggestion}
                        </Tag>
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={24} xl={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">事项办理链路穿透</span>
                  <Tag color="cyan" className="m-0 ml-1 text-xs">跨部门追踪</Tag>
                </div>
              }
              className="shadow-card h-full"
              size="small"
              extra={
                <Button type="link" size="small" icon={expandedLedger ? <Eye className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} onClick={() => setExpandedLedger(!expandedLedger)}>
                  {expandedLedger ? '收起台账' : `查看全部 ${HANDLING_CHAINS.length}+`}
                </Button>
              }
            >
              {HANDLING_CHAINS.map(chain => (
                <div key={chain.id} className="mb-5 pb-5 border-b border-gov-gray-100 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        status={chain.status === 'done' ? 'success' : chain.status === 'warning' ? 'warning' : 'processing'}
                        text={<span className="font-semibold text-gov-gray-700 text-sm">{chain.service}</span>}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Tag color="geekblue" className="m-0 text-xs">{chain.citizen}</Tag>
                      <span className="text-[11px] text-gov-gray-400">{chain.applyTime}</span>
                    </div>
                  </div>
                  <div className="pl-1">
                    <Steps
                      size="small"
                      current={chain.currentStep}
                      direction="vertical"
                      className="performance-chain-steps"
                      items={chain.steps.map(step => ({
                        title: (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-xs" style={{ color: chainStatusColor(step.status) }}>
                              {step.title}
                            </span>
                            <Tag color="geekblue" className="m-0 text-[10px]">{step.dept}</Tag>
                            {step.time !== '待处理' && step.time !== '待补正' && (
                              <span className="text-[10px] text-gov-gray-400">{step.time}</span>
                            )}
                          </div>
                        ),
                        description: (
                          <div className="text-[11px] text-gov-gray-500 leading-relaxed pl-1 mt-0.5">
                            {step.desc}
                          </div>
                        ),
                        status: step.status === 'warning' ? 'error' : (step.status as any),
                        icon: chainStatusIcon(step.status),
                      }))}
                    />
                  </div>
                </div>
              ))}
              <style>{`
                .performance-chain-steps .ant-steps-item-icon {
                  width: 22px !important;
                  height: 22px !important;
                  line-height: 22px !important;
                }
                .performance-chain-steps .ant-steps-item-title::after {
                  top: 14px !important;
                }
              `}</style>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">材料补正与进度推送闭环</span>
                  <Tag color="orange" className="m-0 ml-1 text-xs">多渠道通知</Tag>
                </div>
              }
              className="shadow-card h-full"
              size="small"
              extra={
                <Space size="small">
                  <Button type="link" size="small" icon={expandedCorrection ? <Eye className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} onClick={() => setExpandedCorrection(!expandedCorrection)}>
                    {expandedCorrection ? '收起' : '查看全部'}
                  </Button>
                  <Button type="link" size="small" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => setReminderModalVisible(true)}>
                    催办统计
                  </Button>
                </Space>
              }
            >
              {MATERIAL_CORRECTION_CASES.map(c => (
                <div key={c.id} className="mb-5 pb-5 border-b border-gov-gray-100 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-gov-gray-700 text-sm m-0">{c.service}</h4>
                        <Tag color="purple" className="m-0 text-xs">{c.department}</Tag>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gov-gray-400 flex-wrap">
                        <span>申请人：{c.applicant}</span>
                        <span>提交：{c.submitTime}</span>
                        <span>退件：{c.rejectTime}</span>
                      </div>
                    </div>
                    <Tag color="red" className="m-0 text-xs flex-shrink-0">
                      补正截止：{c.fixDeadline.slice(5)}
                    </Tag>
                  </div>
                  <div className="mb-3 bg-gov-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gov-gray-600 mb-2 flex items-center gap-1.5">
                      <FileWarning className="w-3.5 h-3.5 text-orange-600" />
                      待补正材料（{c.missingItems.length}项）
                    </div>
                    <div className="space-y-1.5">
                      {c.missingItems.map((m, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                          <div className="flex-1 min-w-0">
                            <span className={`font-medium mr-1.5 ${m.status === 'done' ? 'text-green-600' : 'text-orange-600'}`}>
                              {m.status === 'done' ? '✓' : '○'}
                            </span>
                            <span className="text-gov-gray-700">{m.name}</span>
                            <span className="text-gov-gray-400 ml-2">— {m.reason}</span>
                          </div>
                          <Tag color={m.status === 'done' ? 'green' : 'orange'} className="m-0 text-[10px] flex-shrink-0">
                            {m.status === 'done' ? '已补正' : '待补正'}
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gov-gray-600 mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      进度推送渠道状态
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {c.pushStatus.map((ps, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white border border-gov-gray-100 rounded-lg">
                          <span className="text-[11px] text-gov-gray-600">{ps.channel}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gov-gray-400">{ps.time}</span>
                            {ps.status === 'sent' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            ) : ps.status === 'failed' ? (
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-gov-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </Col>
        </Row>

        {expandedLedger && (
          <Card
            className="shadow-card mb-6"
            size="small"
            title={
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                <span className="font-semibold">办件台账（全量穿透）</span>
                <Tag color="green" className="m-0 ml-1 text-xs">{LEDGER_RECORDS.length}条在办</Tag>
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => setExpandedLedger(false)} icon={<Eye className="w-3.5 h-3.5" />}>
                收起台账
              </Button>
            }
          >
            <Table
              dataSource={LEDGER_RECORDS}
              size="small"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条在办记录` }}
              columns={[
                { title: '申请编号', dataIndex: 'applyNo', key: 'applyNo', width: 140, render: (v: string) => <span className="text-xs font-mono text-blue-600">{v}</span> },
                { title: '事项名称', dataIndex: 'serviceName', key: 'serviceName', width: 180, render: (v: string) => <span className="text-xs font-medium text-gov-gray-700">{v}</span> },
                { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100, render: (v: string) => <span className="text-xs text-gov-gray-600">{v}</span> },
                { title: '责任部门', dataIndex: 'department', key: 'department', width: 160, render: (v: string) => <Tag color="geekblue" className="m-0 text-xs">{v}</Tag> },
                { title: '当前节点', dataIndex: 'currentNode', key: 'currentNode', width: 100, render: (v: string) => <span className="text-xs text-gov-gray-600">{v}</span> },
                { title: '节点责任人', dataIndex: 'nodePerson', key: 'nodePerson', width: 100, render: (v: string) => <span className="text-xs text-gov-gray-600">{v}</span> },
                {
                  title: '办理状态', dataIndex: 'status', key: 'status', width: 100,
                  render: (v: string) => {
                    const colorMap: Record<string, string> = { '办理中': 'blue', '审核中': 'purple', '补正中': 'orange', '即将超期': 'red' };
                    return <Tag color={colorMap[v] || 'default'} className="m-0 text-xs">{v}</Tag>;
                  },
                },
                {
                  title: '已耗时', dataIndex: 'elapsed', key: 'elapsed', width: 90,
                  render: (v: number) => (
                    <span className={`text-xs font-medium ${v >= 72 ? 'text-red-600' : v >= 24 ? 'text-orange-600' : 'text-gov-gray-600'}`}>
                      {v}小时
                    </span>
                  ),
                },
                {
                  title: '操作', key: 'action', width: 140, fixed: 'right' as const,
                  render: () => (
                    <Space size="small">
                      <Button type="link" size="small" className="text-xs p-0" icon={<Bell className="w-3 h-3" />} onClick={() => setReminderModalVisible(true)}>催办</Button>
                      <Button type="link" size="small" className="text-xs p-0" icon={<GitBranch className="w-3 h-3" />}>查看链路</Button>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        )}

        {expandedCorrection && (
          <Card
            className="shadow-card mb-6"
            size="small"
            title={
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">材料补正台账（全量追踪）</span>
                <Tag color="orange" className="m-0 ml-1 text-xs">{ALL_CORRECTION_CASES.length}条补正中</Tag>
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => setExpandedCorrection(false)} icon={<Eye className="w-3.5 h-3.5" />}>
                收起
              </Button>
            }
          >
            <List
              itemLayout="vertical"
              dataSource={ALL_CORRECTION_CASES}
              renderItem={(c) => {
                const deadline = dayjs(c.fixDeadline);
                const now = dayjs();
                const daysLeft = deadline.diff(now, 'day');
                return (
                  <List.Item key={c.id}>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-gov-gray-700 text-sm m-0">{c.service}</h4>
                          <Tag color="purple" className="m-0 text-xs">{c.department}</Tag>
                          <Tag color="geekblue" className="m-0 text-xs">{c.applicant}</Tag>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gov-gray-400 flex-wrap">
                          <span>退件时间：{c.rejectTime}</span>
                        </div>
                      </div>
                      <Tag color={daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'orange' : 'green'} className="m-0 text-xs flex-shrink-0">
                        补正截止倒计时：{daysLeft}天
                      </Tag>
                    </div>
                    <div className="mb-3 bg-gov-gray-50 rounded-lg p-3">
                      <div className="text-xs font-medium text-gov-gray-600 mb-2 flex items-center gap-1.5">
                        <FileWarning className="w-3.5 h-3.5 text-orange-600" />
                        待补正材料（{c.missingItems.length}项）
                      </div>
                      <div className="space-y-1.5">
                        {c.missingItems.map((m, i) => (
                          <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                            <div className="flex-1 min-w-0">
                              <span className={`font-medium mr-1.5 ${m.status === 'done' ? 'text-green-600' : 'text-orange-600'}`}>
                                {m.status === 'done' ? '✓' : '○'}
                              </span>
                              <span className="text-gov-gray-700">{m.name}</span>
                              <span className="text-gov-gray-400 ml-2">— {m.reason}</span>
                            </div>
                            <Tag color={m.status === 'done' ? 'green' : 'orange'} className="m-0 text-[10px] flex-shrink-0">
                              {m.status === 'done' ? '已补正' : '待补正'}
                            </Tag>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gov-gray-600 mb-2 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                        推送状态
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {c.pushStatus.map((ps, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white border border-gov-gray-100 rounded-lg">
                            <span className="text-[11px] text-gov-gray-600">{ps.channel}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gov-gray-400">{ps.time}</span>
                              {ps.status === 'sent' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                              ) : ps.status === 'failed' ? (
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-gov-gray-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        )}

        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-cyan-600" />
                  <span className="font-semibold">事项办理链路阶段通过率</span>
                  <Tag color="cyan" className="m-0 ml-1 text-xs">6环节穿透</Tag>
                </div>
              }
              className="shadow-card h-full"
              size="small"
            >
              <div ref={chainChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <FileKey className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold">12委办局电子证照互认调用</span>
                  <Tag color="indigo" className="m-0 ml-1 text-xs">全量穿透</Tag>
                </div>
              }
              className="shadow-card h-full"
              size="small"
            >
              <div ref={certChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <div className="flex items-center justify-between flex-wrap gap-3 mb-0">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-600" />
                <span className="font-semibold">跨模块能力关联监测</span>
                <Tag color="purple" className="m-0 ml-1">政策引擎 · 容灾中心 · 电子证照</Tag>
              </div>
            </div>
          }
          className="shadow-card mb-6"
          size="small"
        >
          <Row gutter={[12, 12]}>
            {CROSS_MODULE_STATUS.map(mod => (
              <Col xs={24} lg={8} key={mod.key}>
                <div className={`h-full rounded-2xl p-4 border-2 ${
                  mod.color === 'purple' ? 'border-purple-100 bg-gradient-to-br from-purple-50/50 to-white' :
                  mod.color === 'orange' ? 'border-orange-100 bg-gradient-to-br from-orange-50/50 to-white' :
                  'border-blue-100 bg-gradient-to-br from-blue-50/50 to-white'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        mod.color === 'purple' ? 'bg-purple-100' :
                        mod.color === 'orange' ? 'bg-orange-100' : 'bg-blue-100'
                      }`}>
                        {mod.icon}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm m-0 ${
                          mod.color === 'purple' ? 'text-purple-700' :
                          mod.color === 'orange' ? 'text-orange-700' : 'text-blue-700'
                        }`}>{mod.title}</h4>
                      </div>
                    </div>
                    {mod.key === 'disaster' && mod.failoverNow > 0 && (
                      <Badge count={`${mod.failoverNow}系统应急`} color="red" />
                    )}
                  </div>

                  <Row gutter={[8, 8]} className="mb-4">
                    <Col xs={12}>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gov-gray-100">
                        <div className={`text-[10px] mb-1 ${
                          mod.color === 'purple' ? 'text-purple-500' :
                          mod.color === 'orange' ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          {mod.key === 'policy' ? '累计匹配成功' :
                           mod.key === 'disaster' ? '缓存受理办件' : '累计调用量'}
                        </div>
                        <div className={`font-bold text-lg ${
                          mod.color === 'purple' ? 'text-purple-700' :
                          mod.color === 'orange' ? 'text-orange-700' : 'text-blue-700'
                        }`}>
                          {(mod.key === 'policy' ? mod.totalMatched :
                            mod.key === 'disaster' ? mod.totalCached :
                            mod.totalCalls).toLocaleString()}
                        </div>
                      </div>
                    </Col>
                    <Col xs={12}>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gov-gray-100">
                        <div className={`text-[10px] mb-1 ${
                          mod.color === 'purple' ? 'text-purple-500' :
                          mod.color === 'orange' ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          {mod.key === 'policy' ? '生效政策' :
                           mod.key === 'disaster' ? '监测系统数' : '证照类型数'}
                        </div>
                        <div className="font-bold text-lg text-gov-gray-700">
                          {mod.key === 'policy' ? mod.activePolicies :
                           mod.key === 'disaster' ? `${mod.activeSystems}` :
                           `${mod.certTypes}`}
                          {mod.key === 'policy' ? '项' : mod.key === 'disaster' ? '个' : '类'}
                        </div>
                      </div>
                    </Col>
                    <Col xs={12}>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gov-gray-100">
                        <div className={`text-[10px] mb-1 ${
                          mod.color === 'purple' ? 'text-purple-500' :
                          mod.color === 'orange' ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          {mod.key === 'policy' ? '今日新匹配' :
                           mod.key === 'disaster' ? '缓存命中率' : '调用成功率'}
                        </div>
                        <div className={`font-bold text-lg ${
                          mod.color === 'purple' ? 'text-purple-700' :
                          mod.color === 'orange' ? 'text-orange-700' : 'text-blue-700'
                        }`}>
                          {mod.key === 'policy' ? `+${mod.todayNew}` :
                           mod.key === 'disaster' ? `${mod.cacheHitRate}%` :
                           `${mod.successRate}%`}
                        </div>
                      </div>
                    </Col>
                    <Col xs={12}>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gov-gray-100">
                        <div className={`text-[10px] mb-1 ${
                          mod.color === 'purple' ? 'text-purple-500' :
                          mod.color === 'orange' ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          {mod.key === 'policy' ? '异常规则' :
                           mod.key === 'disaster' ? '容灾切换' : '今日失败'}
                        </div>
                        <div className={`font-bold text-lg ${
                          mod.key === 'policy' ? (mod.exceptionCount > 0 ? 'text-red-600' : 'text-green-600') :
                          mod.key === 'disaster' ? (mod.failoverNow > 0 ? 'text-orange-600' : 'text-green-600') :
                          (mod.todayFail > 100 ? 'text-orange-600' : 'text-green-600')
                        }`}>
                          {mod.key === 'policy' ? `${mod.exceptionCount}项` :
                           mod.key === 'disaster' ? `${mod.failoverNow}次` :
                           `${mod.todayFail}次`}
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div>
                    <div className={`text-[11px] mb-2 font-medium ${
                      mod.color === 'purple' ? 'text-purple-600' :
                      mod.color === 'orange' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      TOP监测项
                    </div>
                    <div className="space-y-1.5">
                      {mod.topItems.map((t, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-2 border border-gov-gray-100">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {t.status === 'normal' ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                             t.status === 'warning' ? <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" /> :
                             <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            <span className="text-xs text-gov-gray-700 truncate">{t.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Progress percent={t.rate} size="small" style={{ width: 50 }} showInfo={false}
                              strokeColor={t.rate >= 97 ? '#00B42A' : t.rate >= 93 ? '#FF7D00' : '#F53F3F'} />
                            {t.note ? (
                              <Tooltip title={t.note}>
                                <Tag color={t.status === 'normal' ? 'green' : t.status === 'warning' ? 'orange' : 'red'} className="m-0 text-[10px]">
                                  {t.count.toLocaleString()}
                                </Tag>
                              </Tooltip>
                            ) : (
                              <span className="text-[11px] text-gov-gray-500 font-medium">{t.count.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold">12委办局效能综合排名</span>
              <Tag color="gold" className="m-0 ml-1 text-xs">穿透至各业务模块</Tag>
            </div>
          }
          className="shadow-card"
          size="small"
        >
          <Table
            dataSource={departmentRanking}
            columns={columns}
            rowKey="id"
            scroll={{ x: 1100 }}
            size="middle"
            pagination={{
              pageSize: 12,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个委办局 · 监测周期：${dateRange[0].format('YYYY-MM-DD')} ~ ${dateRange[1].format('YYYY-MM-DD')}`,
            }}
          />
        </Card>

        <Modal
          title={<div className="flex items-center gap-2"><Bell className="w-5 h-5 text-orange-600" /><span className="font-semibold">催办记录</span></div>}
          open={reminderModalVisible}
          onCancel={() => setReminderModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setReminderModalVisible(false)}>关闭</Button>,
            <Button key="remind" type="primary" icon={<Send className="w-4 h-4" />} onClick={() => setReminderModalVisible(false)}>发起催办</Button>,
          ]}
          width={600}
        >
          <Timeline
            items={[
              {
                color: 'blue',
                children: (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gov-gray-700">系统自动催办</span>
                        <Tag color="blue" className="m-0 text-xs">自动</Tag>
                      </div>
                      <div className="text-xs text-gov-gray-500">2026-06-16 14:30</div>
                      <div className="text-xs text-gov-gray-600 mt-1">系统检测到住建厅窗口办理超时，自动发起催办通知</div>
                      <Tag color="geekblue" className="m-0 text-xs mt-1">→ 住建厅窗口</Tag>
                    </div>
                  </div>
                ),
              },
              {
                color: 'orange',
                children: (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gov-gray-700">人工电话催办</span>
                        <Tag color="orange" className="m-0 text-xs">人工</Tag>
                      </div>
                      <div className="text-xs text-gov-gray-500">2026-06-16 10:15</div>
                      <div className="text-xs text-gov-gray-600 mt-1">督办员通过电话联系经办人，督促加快办理进度</div>
                      <Tag color="geekblue" className="m-0 text-xs mt-1">→ 经办人王主任</Tag>
                    </div>
                  </div>
                ),
              },
              {
                color: 'green',
                children: (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gov-gray-700">短信催办通知已发送</span>
                        <Tag color="green" className="m-0 text-xs">短信</Tag>
                      </div>
                      <div className="text-xs text-gov-gray-500">2026-06-15 16:00</div>
                      <div className="text-xs text-gov-gray-600 mt-1">已通过短信平台向责任人发送催办提醒</div>
                    </div>
                  </div>
                ),
              },
              {
                color: 'gray',
                children: (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gov-gray-700">事项首次推送</span>
                        <Tag color="default" className="m-0 text-xs">初始</Tag>
                      </div>
                      <div className="text-xs text-gov-gray-500">2026-06-15 09:30</div>
                      <div className="text-xs text-gov-gray-600 mt-1">事项已推送至责任部门，开始办理流程</div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Modal>
      </div>
    </div>
  );
}
