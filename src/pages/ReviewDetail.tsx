import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Stethoscope,
  Building2,
  Store,
  ChevronRight,
  Upload,
  MessageSquare,
  BadgeCheck,
  History,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface ReviewDetail {
  id: string;
  type: 'doctor' | 'hospital' | 'merchant' | 'user';
  name: string;
  phone: string;
  submitted: string;
  desc: string;
  status: 'pending' | 'approved' | 'rejected';
  licenseInfo: Array<{ label: string; value: string; verified?: boolean }>;
  documents: Array<{ name: string; uploadDate: string; verified?: boolean }>;
  reviewHistory: Array<{ time: string; reviewer: string; action: string; comment: string }>;
  reviewComments: string;
}

const mockReviewData: Record<string, ReviewDetail> = {
  'DOC2024NEW021': {
    id: 'DOC2024NEW021',
    type: 'doctor',
    name: '孙医生',
    phone: '13912345678',
    submitted: '2026-06-14 14:28',
    desc: '执业资质审核 · 内科',
    status: 'pending',
    licenseInfo: [
      { label: '医师资格证号', value: '2020110110000123', verified: false },
      { label: '执业兽医师证', value: 'VET-BJ-2024-00891', verified: false },
      { label: '身份证号', value: '110101********1234', verified: true },
      { label: '执业范围', value: '小动物内科', verified: false },
      { label: '学历', value: '中国农业大学 临床兽医学 硕士', verified: true },
    ],
    documents: [
      { name: '医师资格证书扫描件.pdf', uploadDate: '2026-06-14 14:20', verified: false },
      { name: '执业兽医师证书扫描件.pdf', uploadDate: '2026-06-14 14:22', verified: false },
      { name: '身份证正反面.jpg', uploadDate: '2026-06-14 14:18', verified: true },
      { name: '学历学位证书.pdf', uploadDate: '2026-06-14 14:25', verified: true },
      { name: '在职证明.pdf', uploadDate: '2026-06-14 14:26', verified: false },
    ],
    reviewHistory: [
      { time: '2026-06-14 14:28', reviewer: 'system', action: '提交申请', comment: '资质材料已提交，等待人工审核' },
    ],
    reviewComments: '',
  },
  'HOS-2026-06-128': {
    id: 'HOS-2026-06-128',
    type: 'hospital',
    name: '瑞康宠物医院',
    phone: '010-66668888',
    submitted: '2026-06-14 11:05',
    desc: '营业执照 & 医疗执业许可',
    status: 'pending',
    licenseInfo: [
      { label: '统一社会信用代码', value: '91110105MA01234567', verified: true },
      { label: '动物诊疗许可证', value: 'BJ-CW-2024-0156', verified: false },
      { label: '营业执照', value: '91110105MA01234567', verified: true },
      { label: '诊疗范围', value: '动物疾病预防、诊断、治疗', verified: false },
      { label: '营业面积', value: '380㎡', verified: true },
      { label: '执业兽医数量', value: '注册兽医 5 人', verified: false },
    ],
    documents: [
      { name: '营业执照正本扫描件.pdf', uploadDate: '2026-06-14 11:00', verified: true },
      { name: '动物诊疗许可证.pdf', uploadDate: '2026-06-14 11:02', verified: false },
      { name: '环评报告.pdf', uploadDate: '2026-06-14 11:03', verified: false },
      { name: '医疗设备清单.xlsx', uploadDate: '2026-06-14 11:04', verified: false },
      { name: '兽医资质汇总.pdf', uploadDate: '2026-06-14 11:05', verified: false },
    ],
    reviewHistory: [
      { time: '2026-06-14 11:05', reviewer: 'system', action: '提交申请', comment: '医院资质已提交，等待人工审核' },
    ],
    reviewComments: '',
  },
  'MER-2026-06-086': {
    id: 'MER-2026-06-086',
    type: 'merchant',
    name: '爱宠优选供应链',
    phone: '13688888888',
    submitted: '2026-06-14 09:30',
    desc: '药品经营许可证 & 食品备案',
    status: 'pending',
    licenseInfo: [
      { label: '统一社会信用代码', value: '91110106MA0ABCDEF12', verified: true },
      { label: '药品经营许可证', value: 'BJ-YAOPIN-2024-00234', verified: false },
      { label: '食品经营许可证', value: 'JY11101060012345', verified: true },
      { label: 'ICP备案', value: '京ICP备2024001234号', verified: true },
      { label: '仓储面积', value: '1200㎡', verified: true },
      { label: '经营范围', value: '兽药、宠物食品、宠物用品', verified: false },
    ],
    documents: [
      { name: '营业执照.pdf', uploadDate: '2026-06-14 09:20', verified: true },
      { name: '药品经营许可证.pdf', uploadDate: '2026-06-14 09:22', verified: false },
      { name: '食品经营许可证.pdf', uploadDate: '2026-06-14 09:24', verified: true },
      { name: 'GSP认证证书.pdf', uploadDate: '2026-06-14 09:26', verified: false },
      { name: '产品质量承诺书.pdf', uploadDate: '2026-06-14 09:28', verified: false },
    ],
    reviewHistory: [
      { time: '2026-06-14 09:30', reviewer: 'system', action: '提交申请', comment: '商家资质已提交，等待人工审核' },
    ],
    reviewComments: '',
  },
  'APPEAL-0521': {
    id: 'APPEAL-0521',
    type: 'user',
    name: '违规账号申诉',
    phone: '13500000001',
    submitted: '2026-06-13 18:42',
    desc: '账号禁用申诉 · 需人工复核',
    status: 'pending',
    licenseInfo: [
      { label: '原账号角色', value: '宠主 owner', verified: true },
      { label: '禁用原因', value: '疑似刷单评价作弊', verified: true },
      { label: '禁用时间', value: '2026-06-10 14:32', verified: true },
      { label: '申诉理由', value: '账号被盗用，已完成密码修改', verified: false },
    ],
    documents: [
      { name: '账号申诉书.pdf', uploadDate: '2026-06-13 18:40', verified: false },
      { name: '近期登录异常证明.jpg', uploadDate: '2026-06-13 18:41', verified: false },
      { name: '实名认证截图.jpg', uploadDate: '2026-06-13 18:42', verified: true },
    ],
    reviewHistory: [
      { time: '2026-06-10 14:32', reviewer: 'system', action: '账号禁用', comment: '反作弊系统检测到异常评价行为' },
      { time: '2026-06-13 18:42', reviewer: 'user(13500000001)', action: '提交申诉', comment: '申请账号复核与解封' },
    ],
    reviewComments: '',
  },
};

const typeConfig: Record<string, { color: string; Icon: React.ComponentType<{ className?: string }>; label: string }> = {
  doctor: { color: 'from-blue-400 to-sky-600 text-white', Icon: Stethoscope, label: '医生' },
  hospital: { color: 'from-orange-400 to-amber-600 text-white', Icon: Building2, label: '医院' },
  merchant: { color: 'from-rose-400 to-pink-600 text-white', Icon: Store, label: '商家' },
  user: { color: 'from-red-400 to-orange-600 text-white', Icon: AlertTriangle, label: '申诉' },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-warm-100 text-warm-600', label: '待审核' },
  approved: { color: 'bg-forest-100 text-forest-600', label: '已通过' },
  rejected: { color: 'bg-red-100 text-red-600', label: '已驳回' },
};

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const data = mockReviewData[id || 'DOC2024NEW021'];
  const cfg = typeConfig[data.type];
  const Icon = cfg.Icon;
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = () => {
    setProcessing('approve');
    setTimeout(() => {
      setProcessing(null);
      navigate('/admin/dashboard');
    }, 800);
  };

  const handleReject = () => {
    setProcessing('reject');
    setTimeout(() => {
      setProcessing(null);
      navigate('/admin/dashboard');
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cfg.color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              {cfg.label}资质审核详情
            </h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-purple-500" />
              {data.name} · {data.id} · 提交于 {data.submitted}
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig[data.status].color}`}>
            {statusConfig[data.status].label}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" /> 资质信息
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.licenseInfo.map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                  <div className="text-[11px] text-gray-400 mb-1">{item.label}</div>
                  <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    {item.value}
                    {item.verified !== undefined && (
                      item.verified
                        ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                        : <Clock className="w-4 h-4 text-warm-500 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" /> 证照材料
            </h2>
            <div className="space-y-2">
              {data.documents.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${doc.verified ? 'bg-forest-100 text-forest-600' : 'bg-gray-100 text-gray-500'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{doc.name}</div>
                    <div className="text-[11px] text-gray-400">上传于 {doc.uploadDate}</div>
                  </div>
                  {doc.verified ? (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-forest-100 text-forest-700">已核验</span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-warm-100 text-warm-600">待核验</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" /> 复查记录
            </h2>
            <div className="relative pl-4 border-l-2 border-dashed border-gray-200 space-y-4">
              {[...data.reviewHistory].reverse().map((log, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 ring-4 ring-white" />
                  <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-purple-600">{log.reviewer}</span>
                      <span className="text-xs text-gray-400">· {log.time}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 ml-auto">{log.action}</span>
                    </div>
                    <p className="text-sm text-gray-600">{log.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-500" /> 审核意见
            </h2>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="请输入审核意见（选填，将作为复查记录永久保存）..."
              className="w-full h-32 p-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
            />
            <div className="space-y-2">
              <button
                onClick={handleApprove}
                disabled={data.status !== 'pending' || processing !== null}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-forest-500 to-emerald-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {processing === 'approve' ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" /> 处理中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> 通过审核
                  </>
                )}
              </button>
              <button
                onClick={handleReject}
                disabled={data.status !== 'pending' || processing !== null}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {processing === 'reject' ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" /> 处理中...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" /> 驳回申请
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center">
              操作将由 {user?.nickname || '审核员'} 实名记录至审计日志
            </p>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 space-y-3 border-purple-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900 text-sm">审核规范提醒</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-purple-700">
              <li className="flex gap-2"><span>•</span>证照真实性需人工交叉核验</li>
              <li className="flex gap-2"><span>•</span>医生执业证需在国家系统核实</li>
              <li className="flex gap-2"><span>•</span>医院诊疗许可证需确认范围匹配</li>
              <li className="flex gap-2"><span>•</span>商家药品经营许可需含兽药类目</li>
              <li className="flex gap-2"><span>•</span>申诉需核实事发账号行为证据</li>
              <li className="flex gap-2"><span>•</span>所有操作永久留痕，可审计追溯</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
