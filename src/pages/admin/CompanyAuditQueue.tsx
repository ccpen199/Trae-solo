import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Building2,
  Star,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  FileText,
  ShieldCheck,
  ClipboardCheck,
  Camera,
  FolderKanban,
  ChevronDown,
  X,
  Copy,
  AlertTriangle,
  Check,
  History,
  User,
  Clock,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import { Table, Tabs, Progress, Switch, Modal, Drawer, Rate, Input, Select, Slider, Card, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

type AuditStatus = 'pending' | 'auditing' | 'passed' | 'rejected';
type QualificationLevel = 'A' | 'B' | 'C';

interface AuditHistoryItem {
  id: string;
  stage: 'submitted' | 'first_audit' | 'recheck' | 'passed' | 'rejected' | 'supplement';
  auditor: string;
  auditorRole: string;
  time: string;
  opinion: string;
  result: 'pass' | 'reject' | 'pending' | 'supplement';
}

interface CompanyItem {
  key: string;
  id: string;
  name: string;
  logo: string;
  level: QualificationLevel;
  foundedYear: number;
  submitTime: string;
  materialProgress: number;
  materials: { name: string; progress: number }[];
  rating: number;
  reviewCount: number;
  ocrStatus: 'all_pass' | 'need_manual';
  ocrPassCount: number;
  ocrTotalCount: number;
  status: AuditStatus;
  city: string;
  historyProjectCount: number;
  auditHistory: AuditHistoryItem[];
}

const mockCompanies: CompanyItem[] = [
  {
    key: '1',
    id: 'CMP-20240612-001',
    name: '筑美装饰设计工程有限公司',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=zhumei&backgroundColor=FBF2ED',
    level: 'A',
    foundedYear: 2008,
    submitTime: '2024-06-12 09:15:23',
    materialProgress: 100,
    materials: [
      { name: '营业执照', progress: 100 },
      { name: '资质证书', progress: 100 },
      { name: '安全生产证', progress: 100 },
      { name: '巡检报告', progress: 100 },
    ],
    rating: 4.9,
    reviewCount: 126,
    ocrStatus: 'all_pass',
    ocrPassCount: 4,
    ocrTotalCount: 4,
    status: 'pending',
    city: '上海',
    historyProjectCount: 328,
    auditHistory: [
      { id: 'h1', stage: 'submitted', auditor: '系统', auditorRole: '自动', time: '2024-06-12 09:15:23', opinion: '公司提交入驻申请，材料齐全', result: 'pending' },
    ],
  },
  {
    key: '2',
    id: 'CMP-20240611-028',
    name: '和盛建筑装饰集团',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=hesheng&backgroundColor=F2F6F7',
    level: 'A',
    foundedYear: 2005,
    submitTime: '2024-06-11 16:42:08',
    materialProgress: 85,
    materials: [
      { name: '营业执照', progress: 100 },
      { name: '资质证书', progress: 100 },
      { name: '安全生产证', progress: 60 },
      { name: '巡检报告', progress: 80 },
    ],
    rating: 4.8,
    reviewCount: 256,
    ocrStatus: 'need_manual',
    ocrPassCount: 2,
    ocrTotalCount: 4,
    status: 'pending',
    city: '北京',
    historyProjectCount: 586,
    auditHistory: [
      { id: 'h1', stage: 'submitted', auditor: '系统', auditorRole: '自动', time: '2024-06-11 16:42:08', opinion: '公司提交入驻申请', result: 'pending' },
      { id: 'h2', stage: 'first_audit', auditor: '王审核', auditorRole: '初审员', time: '2024-06-11 18:05:12', opinion: 'OCR识别2项异常，安全生产证需人工核验', result: 'pending' },
    ],
  },
  {
    key: '3',
    id: 'CMP-20240612-007',
    name: '优家精品装饰',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=youjia&backgroundColor=FBF6EC',
    level: 'B',
    foundedYear: 2015,
    submitTime: '2024-06-12 11:28:45',
    materialProgress: 75,
    materials: [
      { name: '营业执照', progress: 100 },
      { name: '资质证书', progress: 100 },
      { name: '安全生产证', progress: 60 },
      { name: '巡检报告', progress: 40 },
    ],
    rating: 4.6,
    reviewCount: 89,
    ocrStatus: 'need_manual',
    ocrPassCount: 2,
    ocrTotalCount: 4,
    status: 'pending',
    city: '深圳',
    historyProjectCount: 142,
    auditHistory: [
      { id: 'h1', stage: 'submitted', auditor: '系统', auditorRole: '自动', time: '2024-06-12 11:28:45', opinion: '公司提交入驻申请，巡检报告待补充', result: 'supplement' },
      { id: 'h2', stage: 'supplement', auditor: '优家 admin', auditorRole: '申请方', time: '2024-06-12 14:22:08', opinion: '已补充巡检报告照片，安全生产证重新上传', result: 'pending' },
    ],
  },
  {
    key: '4',
    id: 'CMP-20240610-015',
    name: '匠心营造装饰',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=jiangxin&backgroundColor=F5F2ED',
    level: 'B',
    foundedYear: 2012,
    submitTime: '2024-06-10 14:05:32',
    materialProgress: 100,
    materials: [
      { name: '营业执照', progress: 100 },
      { name: '资质证书', progress: 100 },
      { name: '安全生产证', progress: 100 },
      { name: '巡检报告', progress: 100 },
    ],
    rating: 4.7,
    reviewCount: 156,
    ocrStatus: 'all_pass',
    ocrPassCount: 4,
    ocrTotalCount: 4,
    status: 'auditing',
    city: '杭州',
    historyProjectCount: 289,
    auditHistory: [
      { id: 'h1', stage: 'submitted', auditor: '系统', auditorRole: '自动', time: '2024-06-10 14:05:32', opinion: '提交入驻申请，材料齐全', result: 'pending' },
      { id: 'h2', stage: 'first_audit', auditor: '李审核', auditorRole: '初审员', time: '2024-06-10 16:30:45', opinion: '初审通过，资质评分88分，建议进入复审', result: 'pass' },
      { id: 'h3', stage: 'recheck', auditor: '张主管', auditorRole: '复审员', time: '2024-06-11 09:15:22', opinion: '复审中，正在核查历史项目业主评价...', result: 'pending' },
    ],
  },
  {
    key: '5',
    id: 'CMP-20240611-019',
    name: '华庭装饰工程',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=huating&backgroundColor=FBF2ED',
    level: 'C',
    foundedYear: 2018,
    submitTime: '2024-06-11 10:33:17',
    materialProgress: 100,
    materials: [
      { name: '营业执照', progress: 100 },
      { name: '资质证书', progress: 100 },
      { name: '安全生产证', progress: 100 },
      { name: '巡检报告', progress: 100 },
    ],
    rating: 4.3,
    reviewCount: 45,
    ocrStatus: 'all_pass',
    ocrPassCount: 4,
    ocrTotalCount: 4,
    status: 'passed',
    city: '成都',
    historyProjectCount: 76,
    auditHistory: [
      { id: 'h1', stage: 'submitted', auditor: '系统', auditorRole: '自动', time: '2024-06-11 10:33:17', opinion: '提交入驻申请', result: 'pending' },
      { id: 'h2', stage: 'first_audit', auditor: '王审核', auditorRole: '初审员', time: '2024-06-11 14:22:08', opinion: '初审通过，OCR全部匹配，综合评分82分', result: 'pass' },
      { id: 'h3', stage: 'recheck', auditor: '张主管', auditorRole: '复审员', time: '2024-06-12 09:05:33', opinion: '复审通过，评分达标，准予入驻', result: 'pass' },
      { id: 'h4', stage: 'passed', auditor: '系统', auditorRole: '自动', time: '2024-06-12 09:05:34', opinion: '审核完成，已开通服务商后台权限', result: 'pass' },
    ],
  },
  {
    key: '6',
    id: 'CMP-20240608-004',
    name: '宜居空间设计',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=yiju&backgroundColor=F2F6F7',
    level: 'B',
    foundedYear: 2016,
    submitTime: '2024-06-08 09:50:44',
    materialProgress: 90,
    materials: [
      { name: '营业执照', progress: 100 },
      { name: '资质证书', progress: 100 },
      { name: '安全生产证', progress: 80 },
      { name: '巡检报告', progress: 80 },
    ],
    rating: 4.5,
    reviewCount: 78,
    ocrStatus: 'need_manual',
    ocrPassCount: 3,
    ocrTotalCount: 4,
    status: 'auditing',
    city: '广州',
    historyProjectCount: 198,
    auditHistory: [
      { id: 'h1', stage: 'submitted', auditor: '系统', auditorRole: '自动', time: '2024-06-08 09:50:44', opinion: '提交入驻申请', result: 'pending' },
      { id: 'h2', stage: 'first_audit', auditor: '李审核', auditorRole: '初审员', time: '2024-06-08 15:20:18', opinion: '初审发现安全生产证OCR匹配度92%，需复审员人工确认', result: 'pending' },
      { id: 'h3', stage: 'recheck', auditor: '张主管', auditorRole: '复审员', time: '2024-06-09 10:45:33', opinion: '人工核验通过，证件信息真实有效', result: 'pass' },
    ],
  },
];

const LevelBadge: React.FC<{ level: QualificationLevel }> = ({ level }) => {
  const config = {
    A: { label: '一级资质', color: 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-200' },
    B: { label: '二级资质', color: 'bg-gradient-to-r from-haze-100 to-haze-50 text-haze-700 border-haze-200' },
    C: { label: '三级资质', color: 'bg-gradient-to-r from-wood-100 to-wood-50 text-wood-700 border-wood-200' },
  };
  const cfg = config[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.color}`}>
      <ShieldCheck className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const AuditModal: React.FC<{
  open: boolean;
  onClose: () => void;
  company: CompanyItem | null;
  onPass?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
}> = ({ open, onClose, company, onPass, onReject }) => {
  const [activeTab, setActiveTab] = useState('license');
  const [ocrChecks, setOcrChecks] = useState<Record<string, boolean>>({});
  const [comment, setComment] = useState('');
  const [qualificationScore, setQualificationScore] = useState(85);
  const [historyScore, setHistoryScore] = useState(90);
  const [inspectionScore, setInspectionScore] = useState(82);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const stageConfig: Record<AuditHistoryItem['stage'], { label: string; color: string; icon: any }> = {
    submitted: { label: '提交申请', color: 'bg-haze-500', icon: FileText },
    first_audit: { label: '初审', color: 'bg-terracotta-500', icon: ClipboardCheck },
    recheck: { label: '复审', color: 'bg-wood-600', icon: UserCheck },
    passed: { label: '审核通过', color: 'bg-emerald-500', icon: CheckCircle2 },
    rejected: { label: '已驳回', color: 'bg-rose-500', icon: XCircle },
    supplement: { label: '补充材料', color: 'bg-amber-500', icon: AlertTriangle },
  };

  if (!company) return null;

  const totalScore = Math.round(
    qualificationScore * 0.4 + historyScore * 0.3 + inspectionScore * 0.3
  );

  const tabItems: TabsProps['items'] = [
    { key: 'license', label: <span className="flex items-center gap-1"><FileText className="w-4 h-4" />营业执照</span> },
    { key: 'certificate', label: <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" />资质证</span> },
    { key: 'safety', label: <span className="flex items-center gap-1"><ClipboardCheck className="w-4 h-4" />安全证</span> },
    { key: 'inspection', label: <span className="flex items-center gap-1"><Camera className="w-4 h-4" />巡检</span> },
    { key: 'projects', label: <span className="flex items-center gap-1"><FolderKanban className="w-4 h-4" />项目</span> },
  ];

  const ocrComparisons = [
    { field: '公司名称', ocr: company.name, system: company.name, match: true },
    { field: '统一社会信用代码', ocr: '91310115MA1K3X7Y8Z', system: '91310115MA1K3X7Y8Z', match: true },
    { field: '法定代表人', ocr: '张建国', system: '张建国', match: true },
    { field: '注册资本', ocr: '5000万元人民币', system: '5000万元人民币', match: true },
    { field: '成立日期', ocr: '2008年03月15日', system: '2008-03-15', match: true },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1100}
      destroyOnClose
      title={
        <div className="flex items-center justify-between pr-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-100 to-terracotta-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-carbon-800">{company.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-ivory-500 font-mono">{company.id}</span>
                <LevelBadge level={company.level} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-ivory-600">提交于 {company.submitTime}</span>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-6 -mx-6 -mb-6 px-6 pb-6 pt-4">
        <div className="pr-6 border-r border-ivory-200">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="small"
            className="material-tabs"
          />
          <div className="mt-4">
            <div className="aspect-[4/3] rounded-card bg-gradient-to-br from-ivory-100 to-ivory-200/50 border border-ivory-200 flex items-center justify-center overflow-hidden">
              <img
                src={`https://picsum.photos/seed/${activeTab}/600/450`}
                alt="材料预览"
                className="w-full h-full object-cover rounded-card"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-carbon-700">OCR识别核验</span>
                {company.ocrStatus === 'all_pass' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    全部通过
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="w-3 h-3" />
                    {company.ocrTotalCount - company.ocrPassCount}项待人工
                  </span>
                )}
              </div>
              <button className="text-xs text-terracotta-600 font-medium hover:underline flex items-center gap-1">
                <Copy className="w-3 h-3" /> 重新识别
              </button>
            </div>
            <div className="mt-3 rounded-card border border-ivory-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ivory-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-ivory-600 font-sans">字段</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-ivory-600 font-sans">OCR识别</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-ivory-600 font-sans">系统录入</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-ivory-600 font-sans w-20">核验</th>
                  </tr>
                </thead>
                <tbody>
                  {ocrComparisons.map((row, idx) => (
                    <tr key={idx} className="border-t border-ivory-100">
                      <td className="px-4 py-3 text-carbon-600 text-xs">{row.field}</td>
                      <td className="px-4 py-3 font-mono text-xs text-carbon-800">{row.ocr}</td>
                      <td className="px-4 py-3 font-mono text-xs text-carbon-800">{row.system}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setOcrChecks({ ...ocrChecks, [idx]: !(ocrChecks[idx] ?? row.match) })}
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center transition-all ${
                            ocrChecks[idx] ?? row.match
                              ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                              : 'bg-rose-100 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {ocrChecks[idx] ?? row.match ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-card bg-gradient-to-br from-wood-50 to-ivory-50 border border-wood-200/60 p-5">
            <h4 className="font-serif text-base font-semibold text-carbon-800 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              综合评分面板
            </h4>
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <svg width="140" height="140" className="transform -rotate-90">
                  <circle cx="70" cy="70" r="60" stroke="#E8E4DD" strokeWidth="10" fill="none" />
                  <circle
                    cx="70" cy="70" r="60"
                    stroke="url(#scoreGradient)"
                    strokeWidth="10" fill="none"
                    strokeDasharray={`${totalScore * 3.77} 377`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#CBA356" />
                      <stop offset="100%" stopColor="#C4623A" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-3xl font-bold text-carbon-800">{totalScore}</span>
                  <span className="text-xs text-ivory-500">综合评分</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: '资质评分', value: qualificationScore, setter: setQualificationScore, weight: '40%' },
                { label: '历史评分', value: historyScore, setter: setHistoryScore, weight: '30%' },
                { label: '巡检评分', value: inspectionScore, setter: setInspectionScore, weight: '30%' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-carbon-700">{item.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-ivory-200 text-ivory-600">权重 {item.weight}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-terracotta-600">{item.value}</span>
                  </div>
                  <Slider
                    min={0} max={100} value={item.value}
                    onChange={(v) => item.setter(v as number)}
                    tooltip={{ formatter: null }}
                    styles={{ track: { background: 'linear-gradient(to right, #CBA356, #C4623A)' } }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-carbon-700 mb-2">审核意见</label>
            <TextArea
              rows={4}
              placeholder="请填写审核意见，驳回时需填写具体原因..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="!rounded-btn !border-ivory-300 focus:!border-wood-400"
            />
          </div>

          <div className="mt-5 p-4 rounded-card bg-haze-50 border border-haze-200/60 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-haze-700">历史项目评分</span>
              <div className="flex items-center gap-2">
                <Rate disabled allowHalf value={company.rating} className="!text-sm" />
                <span className="font-mono font-semibold text-haze-700">{company.rating}</span>
                <span className="text-xs text-haze-500">({company.reviewCount}条评价)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-haze-700">成立年份</span>
              <span className="font-mono text-haze-800">{company.foundedYear}年 ({2024 - company.foundedYear}年经验)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-haze-700">所在城市</span>
              <span className="font-mono text-haze-800">{company.city}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => {
                Modal.confirm({
                  title: '确认通过审核？',
                  content: `确认通过「${company.name}」的入驻申请？该操作将开通服务商后台权限，并发送通知邮件。`,
                  okText: '确认通过',
                  cancelText: '取消',
                  okButtonProps: { style: { background: '#C4623A', borderColor: '#C4623A' } },
                  onOk: () => {
                    onPass?.(company.id);
                    message.success(`已通过「${company.name}」的审核`);
                    onClose();
                  },
                });
              }}
              className="flex-1 btn-primary"
            >
              <CheckCircle2 className="w-4 h-4" />
              通过审核
            </button>
            <button
              onClick={() => {
                if (!comment.trim() && !rejectReason.trim()) {
                  setRejectModalOpen(true);
                } else {
                  Modal.confirm({
                    title: '确认驳回申请？',
                    content: (
                      <div>
                        <p>驳回原因：{comment || rejectReason || '（未填写）'}</p>
                        <p className="mt-2 text-xs text-ivory-500">该公司将收到驳回通知，可修正后重新提交。</p>
                      </div>
                    ),
                    okText: '确认驳回',
                    okButtonProps: { danger: true },
                    cancelText: '取消',
                    onOk: () => {
                      onReject?.(company.id, comment || rejectReason);
                      message.error(`已驳回「${company.name}」的申请`);
                      onClose();
                    },
                  });
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-btn
              bg-rose-50 text-rose-700 font-medium border border-rose-200
              hover:bg-rose-100 transition-all duration-200"
            >
              <XCircle className="w-4 h-4" />
              驳回（需填原因）
            </button>
            <button
              onClick={() => {
                message.warning(`已向「${company.name}」发送补充材料通知`);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-btn
              bg-amber-50 text-amber-700 font-medium border border-amber-200
              hover:bg-amber-100 transition-all duration-200"
            >
              <AlertTriangle className="w-4 h-4" />
              退回补充
            </button>
          </div>
          <button
            onClick={() => message.success('审核草稿已保存')}
            className="w-full mt-3 py-2.5 rounded-btn border border-ivory-300 text-sm text-carbon-600 font-medium hover:bg-ivory-100 transition-colors"
          >
            保存审核结果草稿
          </button>

          <div className="mt-6 pt-5 border-t border-ivory-200">
            <h4 className="font-serif font-semibold text-carbon-800 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-haze-500" />
              审核复查记录
              <span className="ml-auto text-xs font-normal text-ivory-500">共 {company.auditHistory.length} 条</span>
            </h4>
            <div className="relative pl-2 space-y-4 max-h-[260px] overflow-y-auto pr-1">
              <div className="absolute left-[11px] top-1 bottom-1 w-px bg-gradient-to-b from-haze-200 via-wood-200 to-emerald-200" />
              {company.auditHistory.map((item) => {
                const cfg = stageConfig[item.stage];
                const Icon = cfg.icon;
                return (
                  <div key={item.id} className="relative pl-8">
                    <div className={`absolute left-0 top-0 w-[22px] h-[22px] rounded-full ${cfg.color} text-white flex items-center justify-center shadow-md ring-2 ring-white`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className={`rounded-card p-3 border ${
                      item.result === 'pass' ? 'bg-emerald-50/60 border-emerald-200/60' :
                      item.result === 'reject' ? 'bg-rose-50/60 border-rose-200/60' :
                      item.result === 'supplement' ? 'bg-amber-50/60 border-amber-200/60' :
                      'bg-ivory-50/60 border-ivory-200/60'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-carbon-800">{cfg.label}</span>
                          <Tag color={
                            item.result === 'pass' ? 'success' :
                            item.result === 'reject' ? 'error' :
                            item.result === 'supplement' ? 'warning' : 'default'
                          } className="!text-[10px] !py-0 !mx-0">
                            {item.result === 'pass' ? '通过' : item.result === 'reject' ? '驳回' : item.result === 'supplement' ? '待补充' : '处理中'}
                          </Tag>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-ivory-500">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono">{item.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-carbon-600 mb-1.5">
                        <User className="w-3 h-3 text-haze-500" />
                        <span className="font-medium">{item.auditor}</span>
                        <span className="text-ivory-400">·</span>
                        <span className="text-ivory-500">{item.auditorRole}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs text-carbon-700 bg-white/60 rounded-lg p-2 border border-ivory-100">
                        <MessageSquare className="w-3 h-3 mt-0.5 text-terracotta-500 shrink-0" />
                        <span className="leading-relaxed">{item.opinion}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-500" />
            <span>填写驳回原因</span>
          </div>
        }
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        okText="提交驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onOk={() => {
          if (!rejectReason.trim()) {
            message.warning('请填写驳回原因');
            return Promise.reject();
          }
          onReject?.(company.id, rejectReason);
          message.error(`已驳回「${company.name}」的申请，原因：${rejectReason.slice(0, 30)}...`);
          setRejectModalOpen(false);
          onClose();
        }}
      >
        <div className="mt-3 space-y-3">
          <p className="text-xs text-carbon-600">请详细说明驳回原因，申请方将收到此通知：</p>
          <TextArea
            rows={5}
            placeholder="例如：1. 营业执照经营范围不包含室内外装饰装修工程；2. 资质证书已过有效期（有效期至2023-12-31）；..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="!rounded-btn !border-ivory-300"
          />
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200/60">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              建议逐条列出问题点，以便申请方快速修正后重新提交。驳回原因将永久记录在审核档案中。
            </p>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

const CompanyAuditQueue: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState<AuditStatus | 'all'>('all');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<CompanyItem | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [levelFilter, setLevelFilter] = useState<QualificationLevel | undefined>();
  const [cityFilter, setCityFilter] = useState<string | undefined>();

  const statusTabs = [
    { key: 'all' as const, label: '全部', count: mockCompanies.length, color: '' },
    { key: 'pending' as const, label: '待审核', count: mockCompanies.filter(c => c.status === 'pending').length, color: 'bg-rose-500' },
    { key: 'auditing' as const, label: '审核中', count: mockCompanies.filter(c => c.status === 'auditing').length, color: 'bg-amber-500' },
    { key: 'passed' as const, label: '已通过', count: mockCompanies.filter(c => c.status === 'passed').length, color: '' },
    { key: 'rejected' as const, label: '已驳回', count: mockCompanies.filter(c => c.status === 'rejected').length, color: '' },
  ];

  const filteredData = mockCompanies.filter((c) => {
    if (activeStatus !== 'all' && c.status !== activeStatus) return false;
    if (searchValue && !c.name.includes(searchValue) && !c.id.includes(searchValue)) return false;
    if (levelFilter && c.level !== levelFilter) return false;
    if (cityFilter && c.city !== cityFilter) return false;
    return true;
  });

  const statusConfig: Record<AuditStatus, { label: string; color: string; bg: string; dot: string }> = {
    pending: { label: '待审核', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    auditing: { label: '审核中', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
    passed: { label: '已通过', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    rejected: { label: '已驳回', color: 'text-rose-700', bg: 'bg-rose-50', dot: 'bg-rose-500' },
  };

  const columns: ColumnsType<CompanyItem> = [
    {
      title: '申请公司',
      dataIndex: 'name',
      width: 300,
      fixed: 'left',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <img
            src={record.logo}
            alt={record.name}
            className="w-11 h-11 rounded-xl border border-ivory-200 bg-white p-1 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-carbon-800 text-sm truncate max-w-[160px]" title={record.name}>{record.name}</span>
              <span className="text-[10px] font-mono text-ivory-400 shrink-0">{record.id}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <LevelBadge level={record.level} />
              <span className="text-[11px] text-ivory-500 font-mono">{record.foundedYear}年成立 · {record.city}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      width: 150,
      render: (v: string) => (
        <div>
          <div className="font-mono text-sm text-carbon-700">{dayjs(v).format('YYYY-MM-DD')}</div>
          <div className="font-mono text-xs text-ivory-500">{dayjs(v).format('HH:mm:ss')}</div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.submitTime).valueOf() - dayjs(b.submitTime).valueOf(),
    },
    {
      title: '资质等级',
      dataIndex: 'level',
      width: 100,
      render: (l: QualificationLevel) => <LevelBadge level={l} />,
    },
    {
      title: 'OCR匹配度',
      dataIndex: 'ocrPassCount',
      width: 130,
      render: (_: number, record) => {
        const pct = Math.round((record.ocrPassCount / record.ocrTotalCount) * 100);
        return (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ivory-600">{record.ocrPassCount}/{record.ocrTotalCount}</span>
              <span className={`font-mono text-sm font-semibold ${pct >= 100 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>{pct}%</span>
            </div>
            <Progress
              percent={pct}
              showInfo={false}
              size="small"
              strokeColor={pct >= 100 ? '#22C55E' : pct >= 75 ? '#F59E0B' : '#F43F5E'}
              trailColor="#E8E4DD"
            />
          </div>
        );
      },
    },
    {
      title: '历史项目数',
      dataIndex: 'historyProjectCount',
      width: 110,
      render: (n: number, record) => (
        <div>
          <div className="font-mono text-lg font-bold text-carbon-800 leading-none">{n}</div>
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="font-mono text-[11px] text-carbon-600 font-semibold">{record.rating}</span>
            <span className="text-[10px] text-ivory-500">({record.reviewCount}评)</span>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (s: AuditStatus) => {
        const cfg = statusConfig[s];
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} border-current/20`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: '材料完成度',
      dataIndex: 'materialProgress',
      width: 180,
      render: (progress: number, record) => (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-ivory-600">共{record.materials.length}项</span>
            <span className="font-mono text-sm font-semibold text-terracotta-600">{progress}%</span>
          </div>
          <Progress
            percent={progress}
            showInfo={false}
            size="small"
            strokeColor={{ '0%': '#DE8F69', '100%': '#C4623A' }}
            trailColor="#E8E4DD"
          />
        </div>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setCurrentCompany(record);
              setAuditModalOpen(true);
              message.info(`正在加载「${record.name}」的审核资料...`);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-medium
              bg-gradient-to-b from-terracotta-400 to-terracotta-500 text-white
              border border-terracotta-500/20 shadow-sm
              hover:from-terracotta-500 hover:to-terracotta-600 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            查看资料
          </button>
          {record.status !== 'passed' && (
            <button
              onClick={() =>
                Modal.confirm({
                  title: `快速通过「${record.name}」？`,
                  content: '确认通过后将开通服务商权限，请确保材料已核验。',
                  okText: '确认通过',
                  cancelText: '取消',
                  okButtonProps: { style: { background: '#22C55E', borderColor: '#22C55E' } },
                  onOk: () => message.success(`已通过「${record.name}」的审核`),
                })
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-medium
                bg-emerald-50 text-emerald-700 border border-emerald-200
                hover:bg-emerald-100 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              通过
            </button>
          )}
          {record.status !== 'rejected' && (
            <button
              onClick={() => {
                if (record.status === 'passed') {
                  message.warning('已通过的记录无法驳回，请走申诉流程');
                  return;
                }
                Modal.confirm({
                  title: `快速驳回「${record.name}」？`,
                  content: (
                    <div className="pt-2">
                      <TextArea
                        rows={3}
                        placeholder="请输入驳回原因（可选）..."
                        className="!rounded-btn !border-ivory-300"
                        id={`quick-reject-${record.id}`}
                      />
                    </div>
                  ),
                  okText: '确认驳回',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: () => {
                    const ta = document.getElementById(`quick-reject-${record.id}`) as HTMLTextAreaElement;
                    message.error(`已驳回「${record.name}」${ta?.value ? `：${ta.value.slice(0, 20)}` : ''}`);
                  },
                });
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-medium
                bg-white text-carbon-600 border border-ivory-300
                hover:bg-ivory-100 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              驳回
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-carbon-800">装修公司审核队列</h1>
          <p className="text-sm text-ivory-600 mt-1">管理服务商入驻资质审核 · 共 <span className="font-mono font-semibold text-terracotta-600">{mockCompanies.length}</span> 家待处理</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-btn bg-ivory-50 border border-ivory-200">
            <span className="text-sm text-ivory-600">批量审核模式</span>
            <Switch
              checked={batchMode}
              onChange={setBatchMode}
              size="small"
              style={{ backgroundColor: batchMode ? '#C4623A' : undefined }}
            />
          </div>
        </div>
      </div>

      <div className="card-base p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-1 p-1 bg-ivory-100 rounded-xl overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeStatus === tab.key
                    ? 'bg-white text-terracotta-700 shadow-sm'
                    : 'text-carbon-600 hover:text-carbon-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-mono font-semibold ${
                    activeStatus === tab.key
                      ? 'bg-terracotta-100 text-terracotta-700'
                      : tab.count > 0 && tab.key === 'pending'
                        ? 'bg-rose-500 text-white'
                        : 'bg-ivory-300 text-carbon-600'
                  }`}>
                    {tab.count}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-white border border-ivory-300 rounded-btn px-3 py-2 gap-2 w-64">
              <Search className="w-4 h-4 text-ivory-500 shrink-0" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜索公司名称/编号..."
                className="bg-transparent outline-none flex-1 text-sm text-carbon-800 placeholder-ivory-500"
              />
            </div>
            <Select
              placeholder="资质等级"
              className="w-32"
              allowClear
              size="middle"
              value={levelFilter}
              onChange={setLevelFilter}
              style={{ borderRadius: 8 }}
            >
              <Option value="A">一级资质</Option>
              <Option value="B">二级资质</Option>
              <Option value="C">三级资质</Option>
            </Select>
            <Select
              placeholder="城市筛选"
              className="w-32"
              allowClear
              size="middle"
              value={cityFilter}
              onChange={setCityFilter}
              style={{ borderRadius: 8 }}
            >
              {['上海', '北京', '深圳', '广州', '杭州', '成都'].map(c => (
                <Option key={c} value={c}>{c}</Option>
              ))}
            </Select>
            <button className="btn-secondary text-sm !py-2">
              <Filter className="w-4 h-4" />
              更多筛选
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {batchMode && selectedRowKeys.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky top-20 z-30 rounded-card p-4 bg-gradient-to-r from-terracotta-50 to-wood-50 border border-terracotta-200/60 shadow-card flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-terracotta-500 text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-carbon-800">批量审核模式</p>
                <p className="text-xs text-ivory-600">已选择 <span className="font-mono font-semibold text-terracotta-600">{selectedRowKeys.length}</span> 家公司</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  Modal.confirm({
                    title: `批量通过 ${selectedRowKeys.length} 家公司？`,
                    content: '确认后将为选中的所有公司开通服务商后台权限，此操作不可撤销。',
                    okText: '确认批量通过',
                    cancelText: '取消',
                    okButtonProps: { style: { background: '#22C55E', borderColor: '#22C55E' } },
                    onOk: () => {
                      message.success(`已通过 ${selectedRowKeys.length} 家公司的入驻申请`);
                      setSelectedRowKeys([]);
                    },
                  })
                }
                className="btn-primary text-sm !py-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                批量通过
              </button>
              <button
                onClick={() =>
                  Modal.confirm({
                    title: `批量驳回 ${selectedRowKeys.length} 家公司？`,
                    content: (
                      <div className="pt-2 space-y-3">
                        <p className="text-sm">将驳回选中的所有公司：</p>
                        <TextArea rows={3} placeholder="请输入统一驳回原因..." className="!rounded-btn !border-ivory-300" id="batch-reject-reason" />
                      </div>
                    ),
                    okText: '确认批量驳回',
                    okButtonProps: { danger: true },
                    cancelText: '取消',
                    onOk: () => {
                      const ta = document.getElementById('batch-reject-reason') as HTMLTextAreaElement;
                      message.error(`已驳回 ${selectedRowKeys.length} 家公司${ta?.value ? `：${ta.value.slice(0, 20)}` : ''}`);
                      setSelectedRowKeys([]);
                    },
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium
                bg-rose-50 text-rose-700 border border-rose-200
                hover:bg-rose-100 transition-all">
                <XCircle className="w-4 h-4" />
                批量驳回
              </button>
              <button
                onClick={() => {
                  setSelectedRowKeys([]);
                  message.info('已取消选择');
                }}
                className="text-sm text-ivory-600 hover:text-carbon-800 transition-colors ml-2"
              >
                取消选择
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="!rounded-card !shadow-card !border-ivory-200 !p-0">
        <Table<CompanyItem>
          columns={columns}
          dataSource={filteredData}
          rowSelection={batchMode ? {
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          } : undefined}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1450 }}
          className="admin-table"
        />
      </Card>

      <AuditModal
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        company={currentCompany}
      />
    </div>
  );
};

export default CompanyAuditQueue;
