import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  ShieldCheck,
  BadgeCheck,
  AlertTriangle,
  Settings,
  ArrowLeft,
  Eye,
  EyeOff,
  Edit3,
  Save,
  LogOut,
  Globe,
  Clock,
  CheckCircle2,
  Stethoscope,
  Building2,
  Store,
  Cpu,
  Lock,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  FileText,
  Shield,
  Mail,
  X,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import type { UserRole, UserStatus } from '@shared/types';
import { cn } from '@/lib/utils';

const roleConfig: Record<UserRole, { label: string; color: string; desc: string; Icon: React.ComponentType<{ className?: string }> }> = {
  owner: { label: '宠主', color: 'from-forest-400 to-emerald-600', desc: '宠物档案 · 在线问诊 · 商城购物', Icon: User },
  doctor: { label: '执业兽医', color: 'from-blue-400 to-sky-600', desc: '图文问诊 · 电子病历 · 处方开具', Icon: Stethoscope },
  hospital: { label: '医院管理员', color: 'from-orange-400 to-amber-600', desc: '服务定价 · 医生排班 · 评价管理', Icon: Building2 },
  merchant: { label: '商家运营', color: 'from-rose-400 to-pink-600', desc: 'SKU上架 · 合规备案 · 订单履约', Icon: Store },
  admin: { label: '超级管理员', color: 'from-purple-400 to-indigo-600', desc: '资质审核 · 权限管理 · 审计复查', Icon: ShieldCheck },
  platform: { label: '平台运营', color: 'from-sky-400 to-cyan-600', desc: '内容审核 · 商家入驻 · 转化漏斗', Icon: Globe },
  ops: { label: '运维工程师', color: 'from-slate-500 to-zinc-700', desc: '服务监控 · 密钥轮询 · 基础设施', Icon: Cpu },
};

const statusConfig: Record<UserStatus, { label: string; color: string; desc: string }> = {
  active: { label: '正常启用', color: 'bg-forest-100 text-forest-700', desc: '账号功能全部正常可用' },
  disabled: { label: '已禁用', color: 'bg-red-100 text-red-700', desc: '账号已被管理员禁用' },
  pending_review: { label: '资质审核中', color: 'bg-warm-100 text-warm-600', desc: '资质材料审核中，部分功能受限' },
};

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface MaterialItem {
  id: string;
  name: string;
  status: UploadStatus;
  fileName?: string;
}

const initialMaterials: MaterialItem[] = [
  { id: '1', name: '执业证书', status: 'pending' },
  { id: '2', name: '营业执照', status: 'pending' },
  { id: '3', name: 'GSP认证证书', status: 'pending' },
  { id: '4', name: '医师资格证', status: 'pending' },
];

type QualificationReviewStep = 'submitted' | 'material_verify' | 'compliance_review' | 'final_approval';

const qualificationReviewSteps: { key: QualificationReviewStep; label: string }[] = [
  { key: 'submitted', label: '已提交' },
  { key: 'material_verify', label: '材料核验' },
  { key: 'compliance_review', label: '合规审核' },
  { key: 'final_approval', label: '复核通过' },
];

interface QualificationReviewHistory {
  id: string;
  submitTime: string;
  reviewer: string;
  result: '通过' | '驳回' | '待审核';
  opinion: string;
}

const initialQualificationReviewHistory: QualificationReviewHistory[] = [
  { id: '1', submitTime: '2026-05-20 14:30', reviewer: '张管理员', result: '驳回', opinion: '营业执照副本不清晰，请重新上传' },
  { id: '2', submitTime: '2026-05-10 09:15', reviewer: '李审核员', result: '通过', opinion: '材料齐全，资质有效' },
];

type RoleChangeApprovalStep = 'pending_first_review' | 'business_review' | 'security_verify' | 'effective';

const roleChangeApprovalSteps: { key: RoleChangeApprovalStep; label: string }[] = [
  { key: 'pending_first_review', label: '待初审' },
  { key: 'business_review', label: '业务复核' },
  { key: 'security_verify', label: '安全校验' },
  { key: 'effective', label: '生效' },
];

interface RoleChangeRecord {
  id: string;
  changeTime: string;
  originalRole: UserRole;
  targetRole: UserRole;
  reviewer: string;
  effectiveTime: string;
  reason: string;
}

const initialRoleChangeHistory: RoleChangeRecord[] = [
  {
    id: '1',
    changeTime: '2026-04-15 10:00',
    originalRole: 'owner',
    targetRole: 'doctor',
    reviewer: '王管理员',
    effectiveTime: '2026-04-16 09:00',
    reason: '取得执业兽医资格证，申请开通医生权限',
  },
];

interface AuditDetail {
  fieldChanges: { field: string; before: string; after: string }[];
  ip: string;
  device: string;
  verifyMethod: string;
}

const initialAuditTrail = [
  { time: '2026-06-17 10:32', action: '登录账号', detail: '通过手机号+密码验证', result: '成功', ip: '127.0.0.1', type: '安全验证' as const },
  { time: '2026-06-16 18:45', action: '修改昵称', detail: '超级管理员 → 超级管理员-正式', result: '成功', ip: '127.0.0.1', type: '资料修改' as const },
  { time: '2026-06-16 10:08', action: '资质审核', detail: '通过医生-李静怡资质申请', result: '成功', ip: '127.0.0.1', type: '资质复查' as const },
  { time: '2026-06-15 15:20', action: '权限变更', detail: '新增运营角色访问处方监管', result: '成功', ip: '127.0.0.1', type: '角色变更' as const },
  { time: '2026-06-14 09:30', action: '密码修改', detail: '通过验证码安全校验', result: '成功', ip: '192.168.1.100', type: '密码修改' as const },
  { time: '2026-06-12 14:02', action: '登录异常', detail: '设备指纹不匹配，二次验证通过', result: '放行', ip: '10.0.0.88', type: '安全验证' as const },
  { time: '2026-06-10 11:20', action: '更换手机号', detail: '尾号0001 → 尾号0002', result: '成功', ip: '127.0.0.1', type: '手机号变更' as const },
];

const auditActionTypes = ['全部', '资料修改', '密码修改', '手机号变更', '资质复查', '角色变更', '安全验证'] as const;

interface SecurityVerifyRecord {
  id: string;
  time: string;
  method: '密码校验' | '短信验证码' | '邮箱验证';
  result: '成功' | '失败';
  ip: string;
}

const initialSecurityVerifyRecords: SecurityVerifyRecord[] = [
  { id: '1', time: '2026-06-17 10:32', method: '密码校验', result: '成功', ip: '127.0.0.1' },
  { id: '2', time: '2026-06-17 08:15', method: '短信验证码', result: '成功', ip: '127.0.0.1' },
  { id: '3', time: '2026-06-16 20:05', method: '密码校验', result: '失败', ip: '192.168.1.50' },
  { id: '4', time: '2026-06-15 14:30', method: '邮箱验证', result: '成功', ip: '127.0.0.1' },
  { id: '5', time: '2026-06-14 09:30', method: '短信验证码', result: '成功', ip: '192.168.1.100' },
];

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, token, logout, login, impersonateRole, originalCredentials, startImpersonation } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  const [phoneEditing, setPhoneEditing] = useState(false);
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [verifyCode, setVerifyCode] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const [roleRequestOpen, setRoleRequestOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<UserRole>('doctor');
  const [roleReason, setRoleReason] = useState('');
  const [roleRequestSubmitting, setRoleRequestSubmitting] = useState(false);
  const [roleRequestSuccess, setRoleRequestSuccess] = useState(false);

  const [editEmail, setEditEmail] = useState('');
  const [editEmailChanging, setEditEmailChanging] = useState(false);
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editPhoneChanging, setEditPhoneChanging] = useState(false);
  const [editNewPhone, setEditNewPhone] = useState(user?.phone || '');
  const [editPasswordChanging, setEditPasswordChanging] = useState(false);
  const [editRoleChanging, setEditRoleChanging] = useState<'none' | 'change'>('none');
  const [editTargetRole, setEditTargetRole] = useState<UserRole>('doctor');
  const [editRoleReason, setEditRoleReason] = useState('');

  const [auditTrail, setAuditTrail] = useState(initialAuditTrail);
  const [roleRequestStatus, setRoleRequestStatus] = useState<'none' | 'submitted'>('none');
  const [qualificationReviewOpen, setQualificationReviewOpen] = useState(false);
  const [qualificationReviewSubmitted, setQualificationReviewSubmitted] = useState(false);
  const [qualificationMaterials, setQualificationMaterials] = useState('');
  const [changeSummary, setChangeSummary] = useState<string[]>([]);

  const [materials, setMaterials] = useState<MaterialItem[]>(initialMaterials);
  const [currentReviewStep, setCurrentReviewStep] = useState<QualificationReviewStep | null>(null);
  const [qualificationReviewHistory, setQualificationReviewHistory] = useState<QualificationReviewHistory[]>(initialQualificationReviewHistory);

  const [roleChangeCurrentStep, setRoleChangeCurrentStep] = useState<RoleChangeApprovalStep | null>(null);
  const [roleChangeRequestTime, setRoleChangeRequestTime] = useState<string | null>(null);
  const [roleChangeHistory, setRoleChangeHistory] = useState<RoleChangeRecord[]>(initialRoleChangeHistory);

  const [auditFilter, setAuditFilter] = useState<typeof auditActionTypes[number]>('全部');
  const [expandedAuditId, setExpandedAuditId] = useState<number | null>(null);
  const [auditDetails, setAuditDetails] = useState<Record<number, AuditDetail>>({});

  const [securityRecords, setSecurityRecords] = useState<SecurityVerifyRecord[]>(initialSecurityVerifyRecords);

  const roleInfo = user?.role ? roleConfig[user.role] : null;
  const RoleIcon = roleInfo?.Icon || User;
  const statusInfo = user?.status ? statusConfig[user.status] : null;

  const roleOrder: UserRole[] = ['owner', 'doctor', 'hospital', 'merchant', 'admin', 'platform', 'ops'];

  const sendVerifyCode = () => {
    if (codeCountdown > 0) return;
    setCodeCountdown(60);
    const timer = setInterval(() => {
      setCodeCountdown(c => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    if (user) login({ ...user, nickname }, token || '');
    setSaving(false);
    setEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSavePhone = async () => {
    if (!newPhone.trim() || verifyCode.length !== 6) return;
    setPhoneSaving(true);
    await new Promise(r => setTimeout(r, 700));
    if (user) login({ ...user, phone: newPhone }, token || '');
    setPhoneSaving(false);
    setPhoneEditing(false);
    setPhoneSuccess(true);
    setVerifyCode('');
    setTimeout(() => setPhoneSuccess(false), 2500);
  };

  const handleSavePassword = async () => {
    if (!oldPassword || newPassword.length < 6 || newPassword !== confirmPassword) return;
    setPasswordSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setPasswordSaving(false);
    setPasswordOpen(false);
    setPasswordSuccess(true);
    setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 2500);
  };

  const handleSubmitRoleRequest = async () => {
    if (!roleReason.trim()) return;
    setRoleRequestSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setRoleRequestSubmitting(false);
    setRoleRequestSuccess(true);
    setTimeout(() => {
      setRoleRequestOpen(false);
      setRoleRequestSuccess(false);
      setRoleReason('');
    }, 1800);
  };

  const handleRolePreview = async (targetRole: UserRole) => {
    if (!token || !user || targetRole === user?.role) return;
    setPreviewRole(targetRole);
    const demoCredentials: Record<UserRole, string> = {
      owner: '13800000001',
      doctor: '13900000001',
      hospital: '13700000001',
      merchant: '13600000001',
      admin: 'admin',
      platform: 'platform',
      ops: 'ops',
    };
    const phone = demoCredentials[targetRole];
    if (!phone) return;
    try {
      const { user: previewUser, token: previewToken } = await api.auth.login(phone, '123456');
      if (!impersonateRole) {
        startImpersonation(targetRole, { phone: user.phone, password: '123456', role: user.role });
      } else {
        startImpersonation(targetRole, originalCredentials as { phone: string; password: string; role: UserRole });
      }
      login(previewUser, previewToken);
      navigate(targetRole === 'owner' ? '/' : `/${targetRole}/dashboard`, { replace: true });
    } catch {
      setPreviewRole(null);
    }
  };

  const handleSaveAll = async () => {
    if (!nickname.trim() || !editOldPassword.trim()) return;
    if (editPhoneChanging && (verifyCode.length !== 6 || !/^1\d{10}$/.test(editNewPhone))) return;
    if (editPasswordChanging && (editNewPassword.length < 6 || editNewPassword !== editConfirmPassword)) return;
    if (editRoleChanging === 'change' && !editTargetRole && !editRoleReason.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEntries: typeof initialAuditTrail = [];
    const changes: string[] = [];

    if (user && nickname.trim() !== (user.nickname || '')) {
      newEntries.push({ time: timeStr, action: '修改昵称', detail: `${user.nickname || ''} → ${nickname}`, result: '成功', ip: '127.0.0.1', type: '资料修改' as const });
      changes.push('昵称');
    }

    if (editPhoneChanging && user) {
      const oldTail = user.phone?.slice(-4) || '****';
      const newTail = editNewPhone.slice(-4);
      newEntries.push({ time: timeStr, action: '更换手机号', detail: `尾号${oldTail} → 尾号${newTail}`, result: '成功', ip: '127.0.0.1', type: '手机号变更' as const });
      changes.push('手机号');
    }

    if (editPasswordChanging) {
      newEntries.push({ time: timeStr, action: '修改密码', detail: '通过安全校验验证', result: '成功', ip: '127.0.0.1', type: '密码修改' as const });
      changes.push('密码');
    }

    if (editEmailChanging && editEmail.trim()) {
      newEntries.push({ time: timeStr, action: '绑定邮箱', detail: `绑定邮箱 ${editEmail}`, result: '验证邮件已发送', ip: '127.0.0.1', type: '资料修改' as const });
      changes.push('邮箱');
    }

    if (editRoleChanging === 'change' && editRoleReason.trim()) {
      newEntries.push({ time: timeStr, action: '角色变更申请', detail: `申请变更为${roleConfig[editTargetRole]?.label}，原因：${editRoleReason}`, result: '已提交', ip: '127.0.0.1', type: '角色变更' as const });
      setRoleRequestStatus('submitted');
      setRoleChangeCurrentStep('pending_first_review');
      setRoleChangeRequestTime(timeStr);
      setTimeout(() => setRoleChangeCurrentStep('business_review'), 1500);
      setTimeout(() => setRoleChangeCurrentStep('security_verify'), 3000);
      changes.push('角色申请');
    }

    if (user?.status === 'pending_review') {
      newEntries.push({ time: timeStr, action: '资质复查状态更新', detail: '编辑资料后资质状态同步更新', result: '成功', ip: '127.0.0.1', type: '资质复查' as const });
    }

    if (user) {
      const merged: Partial<typeof user> = { nickname };
      if (editPhoneChanging) merged.phone = editNewPhone;
      login({ ...user, ...merged }, token || '');
    }

    if (newEntries.length > 0) {
      setAuditTrail(prev => [...newEntries, ...prev]);
    }
    setChangeSummary(changes);

    setSaving(false);
    setEditing(false);
    setSaveSuccess(true);
    setEditOldPassword(''); setEditNewPassword(''); setEditConfirmPassword('');
    setEditPhoneChanging(false); setVerifyCode('');
    setEditPasswordChanging(false);
    setEditRoleChanging('none'); setEditRoleReason('');
    setTimeout(() => { setSaveSuccess(false); setChangeSummary([]); }, 4000);
  };

  const handleMaterialUpload = (materialId: string) => {
    setMaterials(prev => prev.map(m =>
      m.id === materialId ? { ...m, status: 'uploading' as UploadStatus } : m
    ));
    setTimeout(() => {
      const mockFileNames: Record<string, string> = {
        '1': '执业证书_2026.pdf',
        '2': '营业执照_2026.jpg',
        '3': 'GSP认证证书.pdf',
        '4': '医师资格证.png',
      };
      setMaterials(prev => prev.map(m =>
        m.id === materialId
          ? { ...m, status: 'success' as UploadStatus, fileName: mockFileNames[materialId] || `${m.name}.pdf` }
          : m
      ));
    }, 800);
  };

  const handleMaterialDelete = (materialId: string) => {
    setMaterials(prev => prev.map(m =>
      m.id === materialId ? { ...m, status: 'pending' as UploadStatus, fileName: undefined } : m
    ));
  };

  const getAuditDetail = (index: number): AuditDetail => {
    if (auditDetails[index]) return auditDetails[index];
    const log = auditTrail[index];
    const detail: AuditDetail = {
      fieldChanges: [
        { field: log.action, before: log.detail.split('→')[0]?.trim() || '-', after: log.detail.split('→')[1]?.trim() || '-' },
      ],
      ip: log.ip,
      device: 'MacBook Pro / Chrome 125.0',
      verifyMethod: log.type === '安全验证' ? '密码+设备指纹' : '密码校验',
    };
    setAuditDetails(prev => ({ ...prev, [index]: detail }));
    return detail;
  };

  const handleExportAudit = () => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const header = '操作时间,操作类型,操作详情,操作结果,IP地址\n';
    const content = auditTrail
      .filter(log => {
        const logDate = new Date(log.time.replace(' ', 'T'));
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return logDate >= thirtyDaysAgo;
      })
      .map(log => `"${log.time}","${log.type}","${log.detail}","${log.result}","${log.ip}"`)
      .join('\n');
    const blob = new Blob([`\uFEFF${header}${content}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `审计日志_${timeStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitQualificationReview = () => {
    const hasUploadedMaterial = materials.some(m => m.status === 'success');
    if (!qualificationMaterials.trim() && !hasUploadedMaterial) return;
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setQualificationReviewSubmitted(true);
    setCurrentReviewStep('submitted');
    setQualificationReviewHistory(prev => [{
      id: String(Date.now()),
      submitTime: timeStr,
      reviewer: '-',
      result: '待审核',
      opinion: qualificationMaterials || '已上传材料清单',
    }, ...prev]);
    setAuditTrail(prev => [{
      time: timeStr,
      action: '申请资质复查',
      detail: '提交补充材料，申请资质复查复核',
      result: '已提交',
      ip: '127.0.0.1',
      type: '资质复查' as const,
    }, ...prev]);
    setTimeout(() => setCurrentReviewStep('material_verify'), 1500);
    setTimeout(() => setCurrentReviewStep('compliance_review'), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-gray-900">账号设置</h1>
          <p className="text-gray-500 text-sm">管理您的账号资料、安全设置、权限边界与操作审计</p>
        </div>
        {(saveSuccess || phoneSuccess || passwordSuccess) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-forest-50 text-forest-700 text-sm font-semibold border border-forest-200">
            <CheckCircle2 className="w-4 h-4" />
            {saveSuccess ? '资料已更新' : phoneSuccess ? '手机号已更换' : '密码已更新'}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 账号资料 - 完整编辑 */}
          <div className="card space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-forest-500" /> 账号资料
              </h2>
              {!editing ? (
                <button onClick={() => { setEditing(true); setEditPhoneChanging(false); setEditPasswordChanging(false); setEditRoleChanging('none'); }} className="btn-ghost text-sm !py-1.5 !px-3 gap-1">
                  <Edit3 className="w-4 h-4" /> 编辑资料
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setNickname(user?.nickname || '');
                      setEditOldPassword(''); setEditNewPassword(''); setEditConfirmPassword('');
                      setEditPhoneChanging(false); setEditNewPhone(user?.phone || ''); setVerifyCode('');
                      setEditPasswordChanging(false);
                      setEditRoleChanging('none'); setEditRoleReason(''); setEditTargetRole('doctor');
                    }}
                    className="btn-ghost text-sm !py-1.5 !px-3"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={saving || !nickname.trim() || !editOldPassword.trim() || (editPhoneChanging && (verifyCode.length !== 6 || !/^1\d{10}$/.test(editNewPhone))) || (editPasswordChanging && (editNewPassword.length < 6 || editNewPassword !== editConfirmPassword))}
                    className="btn-primary text-sm !py-1.5 !px-3 gap-1"
                  >
                    {saving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? '保存中' : '保存修改'}
                  </button>
                </div>
              )}
            </div>

            {editing && (
              <div className="p-3 rounded-xl bg-gradient-to-br from-warm-50 to-orange-50 border border-warm-100 text-[11px] text-warm-700 space-y-1">
                <p className="font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> 编辑安全校验：提交时必须输入当前登录密码进行二次验证，所有变更将写入审计日志永久留痕。</p>
                <p>可在本次编辑内一次性修改：昵称 / 手机号（含验证码） / 绑定邮箱 / 登录密码 / 发起角色变更申请</p>
              </div>
            )}

            {changeSummary.length > 0 && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-forest-50 to-emerald-50 border border-forest-200 text-[11px] font-semibold text-forest-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>本次修改：{changeSummary.join(' / ')}</span>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${roleInfo?.color || 'from-gray-400 to-gray-600'} flex items-center justify-center shrink-0 shadow-lg`}>
                <RoleIcon className="w-10 h-10 text-white" />
              </div>

              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <label className="text-[11px] text-gray-400 mb-1 block">昵称</label>
                  {editing ? (
                    <input
                      type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-200"
                      maxLength={20} placeholder="请输入昵称"
                    />
                  ) : (
                    <div className="text-xl font-bold text-gray-900">{user?.nickname}</div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* 手机号 + 验证码校验 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> 账号/手机号
                      </label>
                      {editing && !editPhoneChanging && (
                        <button onClick={() => { setEditPhoneChanging(true); setEditNewPhone(user?.phone || ''); }} className="text-[11px] text-purple-600 font-semibold hover:underline">更换手机号</button>
                      )}
                      {editing && editPhoneChanging && (
                        <button onClick={() => { setEditPhoneChanging(false); setEditNewPhone(user?.phone || ''); setVerifyCode(''); }} className="text-[11px] text-gray-400 font-semibold hover:underline">取消更换</button>
                      )}
                    </div>
                    {!editing || !editPhoneChanging ? (
                      <div className="font-mono text-sm text-gray-700 flex items-center gap-2">
                        {user?.phone}
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="tel" value={editNewPhone} onChange={(e) => setEditNewPhone(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-200"
                            placeholder="请输入新手机号" maxLength={11}
                          />
                          <button
                            onClick={sendVerifyCode}
                            disabled={codeCountdown > 0 || !/^1\d{10}$/.test(editNewPhone)}
                            className="px-3 py-2 rounded-xl bg-forest-50 text-forest-700 text-xs font-semibold hover:bg-forest-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            {codeCountdown > 0 ? `${codeCountdown}s后重发` : '获取验证码'}
                          </button>
                        </div>
                        <input
                          type="text" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-forest-200"
                          placeholder="6位验证码(将在提交时一并校验)" maxLength={6}
                        />
                      </div>
                    )}
                  </div>

                  {/* 邮箱绑定 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> 邮箱绑定
                      </label>
                      {editing && !editEmailChanging && (
                        <button onClick={() => setEditEmailChanging(true)} className="text-[11px] text-purple-600 font-semibold hover:underline">{editEmail ? '更换' : '去绑定'}</button>
                      )}
                      {editing && editEmailChanging && (
                        <button onClick={() => { setEditEmailChanging(false); setEditEmail(''); }} className="text-[11px] text-gray-400 font-semibold hover:underline">取消</button>
                      )}
                    </div>
                    {!editing || !editEmailChanging ? (
                      editEmail ? (
                        <div className="font-mono text-sm text-gray-700 flex items-center gap-2">{editEmail}<CheckCircle2 className="w-3.5 h-3.5 text-forest-500" /></div>
                      ) : (
                        <div className="text-sm text-gray-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> 未绑定，绑定后可找回密码</div>
                      )
                    ) : (
                      <input
                        type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-200"
                        placeholder="请输入邮箱，将在保存后发送验证邮件"
                      />
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* 账号状态 + 资质复查 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-gray-400 flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" /> 账号状态 · 资质复查
                      </label>
                      {user?.status === 'pending_review' && editing && (
                        <button onClick={() => navigate('/admin/dashboard')} className="text-[11px] text-warm-600 font-semibold hover:underline inline-flex items-center gap-0.5">
                          <FileText className="w-3 h-3" /> 复查进度
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusInfo && (
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">ID: {user?.id}</span>
                      {user?.licenseVerified ? (
                        <span className="text-[10px] font-semibold text-forest-600 bg-forest-50 px-1.5 py-0.5 rounded">✓ 资质已核验</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-warm-600 bg-warm-50 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> 资质审核中
                        </span>
                      )}
                    </div>
                    {currentReviewStep && (
                      <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200">
                        <p className="text-[11px] font-semibold text-blue-700 mb-2">审批进度</p>
                        <div className="flex items-center gap-1">
                          {qualificationReviewSteps.map((step, idx) => {
                            const stepIndex = qualificationReviewSteps.findIndex(s => s.key === currentReviewStep);
                            const isActive = idx <= stepIndex;
                            const isCurrent = step.key === currentReviewStep;
                            return (
                              <div key={step.key} className="flex items-center flex-1">
                                <div className={cn(
                                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all',
                                  isCurrent
                                    ? 'bg-blue-500 text-white ring-2 ring-blue-200 scale-110'
                                    : isActive
                                      ? 'bg-blue-400 text-white'
                                      : 'bg-gray-200 text-gray-500'
                                )}>
                                  {isActive && idx < stepIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                                </div>
                                <span className={cn(
                                  'ml-1 text-[9px] font-semibold flex-1',
                                  isCurrent ? 'text-blue-700' : isActive ? 'text-blue-600' : 'text-gray-400'
                                )}>
                                  {step.label}
                                </span>
                                {idx < qualificationReviewSteps.length - 1 && (
                                  <div className={cn(
                                    'h-0.5 flex-1 mx-1 rounded transition-all',
                                    idx < stepIndex ? 'bg-blue-400' : 'bg-gray-200'
                                  )} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {['doctor', 'hospital', 'merchant'].includes(user?.role || '') && !user?.licenseVerified && !qualificationReviewSubmitted && (
                      <div className="mt-2">
                        {!qualificationReviewOpen ? (
                          <button onClick={() => setQualificationReviewOpen(true)} className="text-[11px] font-semibold text-purple-600 hover:underline inline-flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> 申请资质复查
                          </button>
                        ) : (
                          <div className="p-3 rounded-xl bg-gradient-to-br from-warm-50 to-orange-50 border border-warm-200 space-y-2">
                            <div className="text-[11px] text-warm-700">
                              <p className="font-bold">当前资质状态：{statusInfo?.label}</p>
                              <p className="text-warm-600 mt-0.5">您的资质材料尚未通过核验，部分功能受限。请在下方补充材料后提交复查申请。</p>
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-semibold text-warm-700">材料上传清单</p>
                              <div className="grid grid-cols-2 gap-1.5">
                                {materials.map(m => (
                                  <div key={m.id} className="p-2 rounded-lg bg-white/80 border border-warm-100 flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                      <FileText className={cn(
                                        'w-3 h-3 shrink-0',
                                        m.status === 'success' ? 'text-forest-500' :
                                        m.status === 'uploading' ? 'text-blue-500' : 'text-gray-400'
                                      )} />
                                      <span className="text-[10px] font-medium text-gray-700 truncate">{m.name}</span>
                                    </div>
                                    {m.status === 'success' ? (
                                      <button onClick={() => handleMaterialDelete(m.id)} className="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0">
                                        <X className="w-3 h-3" />
                                      </button>
                                    ) : m.status === 'uploading' ? (
                                      <Clock className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
                                    ) : (
                                      <button onClick={() => handleMaterialUpload(m.id)} className="text-[9px] font-semibold text-blue-600 hover:underline shrink-0">
                                        上传
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {materials.some(m => m.status === 'success') && (
                                <div className="space-y-1 pt-1 border-t border-warm-100">
                                  <p className="text-[9px] font-semibold text-warm-600">已上传文件：</p>
                                  {materials.filter(m => m.status === 'success').map(m => (
                                    <div key={m.id} className="text-[10px] text-forest-700 flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      <span className="font-mono">{m.fileName}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <textarea
                              value={qualificationMaterials}
                              onChange={(e) => setQualificationMaterials(e.target.value)}
                              rows={2}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 bg-white/60 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-warm-200"
                              placeholder="补充说明（可选）..."
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleSubmitQualificationReview}
                                disabled={!qualificationMaterials.trim() && !materials.some(m => m.status === 'success')}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-warm-500 to-orange-500 text-white text-[11px] font-semibold hover:shadow-md disabled:opacity-50 transition-all inline-flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> 提交复查申请
                              </button>
                              <button onClick={() => { setQualificationReviewOpen(false); setQualificationMaterials(''); setMaterials(initialMaterials); }} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
                                取消
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {qualificationReviewSubmitted && !currentReviewStep && (
                      <div className="mt-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 text-[11px] text-blue-700 font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 已提交复查 · 等待管理员复核
                      </div>
                    )}
                    {['doctor', 'hospital', 'merchant'].includes(user?.role || '') && qualificationReviewHistory.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 复查审核历史
                        </p>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {qualificationReviewHistory.map(record => (
                            <div key={record.id} className="p-2 rounded-lg bg-white border border-gray-100 text-[10px]">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-gray-500">{record.submitTime}</span>
                                <span className={cn(
                                  'px-1.5 py-0.5 rounded-full font-semibold',
                                  record.result === '通过' ? 'bg-forest-100 text-forest-700' :
                                  record.result === '驳回' ? 'bg-red-100 text-red-700' :
                                  'bg-warm-100 text-warm-700'
                                )}>
                                  {record.result}
                                </span>
                              </div>
                              <p className="text-gray-700">
                                <span className="font-semibold">审核人：</span>{record.reviewer}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-semibold">审核意见：</span>{record.opinion}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 当前角色 + 角色变更申请入口 */}
                  {user?.role && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-gray-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 当前身份角色
                        </label>
                        {editing && editRoleChanging === 'none' && (
                          <button onClick={() => setEditRoleChanging('change')} className="text-[11px] text-purple-600 font-semibold hover:underline inline-flex items-center gap-0.5">
                            <FileText className="w-3 h-3" /> 申请角色变更
                          </button>
                        )}
                        {editing && editRoleChanging === 'change' && (
                          <button onClick={() => { setEditRoleChanging('none'); setEditRoleReason(''); }} className="text-[11px] text-gray-400 font-semibold hover:underline">取消申请</button>
                        )}
                      </div>
                      {!editing || editRoleChanging === 'none' ? (
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-br ${roleInfo?.color} text-white`}>
                              {roleInfo?.label}
                            </span>
                            <span className="text-[11px] text-purple-600 font-semibold">
                              {user.licenseVerified ? '✓ 资质已核验' : '⏳ 资质待审核'}
                            </span>
                          </div>
                          <p className="text-[11px] text-purple-600/80">{roleInfo?.desc}</p>
                          {roleChangeCurrentStep && roleChangeRequestTime && (
                            <div className="mt-2 p-2.5 rounded-lg bg-white border border-purple-200">
                              <div className="text-[10px] text-purple-700 space-y-1.5">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span className="font-semibold">申请时间：</span>{roleChangeRequestTime}
                                </div>
                                <div className="flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  <span className="font-semibold">变更类型：</span>
                                  {roleConfig[user.role]?.label} → {roleConfig[editTargetRole]?.label || '目标角色'}
                                </div>
                                <div className="flex items-start gap-1">
                                  <FileText className="w-2.5 h-2.5 mt-0.5" />
                                  <span className="font-semibold">变更原因：</span>{editRoleReason || '已提交变更申请'}
                                </div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-purple-100">
                                <p className="text-[10px] font-semibold text-purple-700 mb-1.5">审批进度</p>
                                <div className="flex items-center gap-0.5">
                                  {roleChangeApprovalSteps.map((step, idx) => {
                                    const stepIndex = roleChangeApprovalSteps.findIndex(s => s.key === roleChangeCurrentStep);
                                    const isActive = idx <= stepIndex;
                                    const isCurrent = step.key === roleChangeCurrentStep;
                                    return (
                                      <div key={step.key} className="flex items-center flex-1">
                                        <div className={cn(
                                          'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all',
                                          isCurrent
                                            ? 'bg-purple-500 text-white ring-2 ring-purple-200 scale-110'
                                            : isActive
                                              ? 'bg-purple-400 text-white'
                                              : 'bg-gray-200 text-gray-500'
                                        )}>
                                          {isActive && idx < stepIndex ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                                        </div>
                                        <span className={cn(
                                          'ml-0.5 text-[8px] font-semibold flex-1',
                                          isCurrent ? 'text-purple-700' : isActive ? 'text-purple-600' : 'text-gray-400'
                                        )}>
                                          {step.label}
                                        </span>
                                        {idx < roleChangeApprovalSteps.length - 1 && (
                                          <div className={cn(
                                            'h-0.5 flex-1 mx-0.5 rounded transition-all',
                                            idx < stepIndex ? 'bg-purple-400' : 'bg-gray-200'
                                          )} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                          {roleRequestStatus === 'submitted' && !roleChangeCurrentStep && (
                            <div className="mt-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 text-[11px] text-blue-700 font-semibold inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> 变更申请已提交 · 等待复核
                            </div>
                          )}
                          {roleChangeHistory.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-purple-100">
                              <p className="text-[10px] font-semibold text-purple-700 mb-1.5 flex items-center gap-1">
                                <Activity className="w-2.5 h-2.5" /> 角色变更历史
                              </p>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                {roleChangeHistory.map((record, idx) => (
                                  <div key={record.id} className="relative pl-3">
                                    {idx < roleChangeHistory.length - 1 && (
                                      <div className="absolute left-1.5 top-3 bottom-0 w-px bg-purple-200" />
                                    )}
                                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-purple-400 ring-2 ring-purple-100" />
                                    <div className="text-[9px] text-purple-700">
                                      <div className="font-mono text-purple-500">{record.changeTime}</div>
                                      <div className="font-semibold mt-0.5">
                                        {roleConfig[record.originalRole]?.label} → {roleConfig[record.targetRole]?.label}
                                      </div>
                                      <div className="text-purple-600">审批人：{record.reviewer} · 生效：{record.effectiveTime}</div>
                                      <div className="text-purple-600/80">原因：{record.reason}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {roleOrder.filter(r => r !== user?.role && r !== 'admin').map(r => {
                              const rc = roleConfig[r];
                              return (
                                <button
                                  key={r} onClick={() => setEditTargetRole(r)}
                                  className={cn(
                                    'px-2 py-1 rounded-lg text-[10px] font-bold transition-all border',
                                    editTargetRole === r
                                      ? 'border-purple-400 bg-purple-200/60 text-purple-800 shadow-sm'
                                      : 'border-purple-100 bg-white/60 text-purple-700 hover:border-purple-200'
                                  )}
                                >
                                  {rc.label}
                                </button>
                              );
                            })}
                          </div>
                          <textarea
                            value={editRoleReason} onChange={(e) => setEditRoleReason(e.target.value)}
                            rows={2}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white/60 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
                            placeholder="请说明角色变更原因（提交后进入管理员复核队列，审计永久留痕）..."
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 登录密码安全校验 */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl transition-colors',
                      editing ? 'bg-warm-50 cursor-default border border-warm-100' : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                    )}
                    onClick={() => !editing && setPasswordOpen(!passwordOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-warm-50 flex items-center justify-center shrink-0 border border-warm-100">
                        <Lock className="w-4 h-4 text-warm-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          登录密码
                          {editing && <span className="text-[10px] text-warm-600 bg-warm-100 px-1.5 py-0.5 rounded font-bold">必填校验</span>}
                        </p>
                        <p className="text-[10px] text-gray-500">上次修改：2026-06-14</p>
                      </div>
                    </div>
                    {editing ? null : (
                      <RefreshCw className={cn('w-4 h-4 text-gray-400 transition-transform', passwordOpen && 'rotate-180')} />
                    )}
                  </div>

                  {editing ? (
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-500 mb-1 block">
                          当前密码 <span className="text-red-500 font-bold">*必填安全校验</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showOldPwd ? 'text' : 'password'} value={editOldPassword} onChange={(e) => setEditOldPassword(e.target.value)}
                            className={cn(
                              'w-full px-3 py-2 pr-8 rounded-lg border text-sm focus:outline-none focus:ring-2',
                              !editOldPassword.trim() ? 'border-warm-300 focus:ring-warm-200 ring-1 ring-warm-200' : 'border-warm-200 focus:ring-warm-200'
                            )}
                            placeholder="请输入当前密码校验"
                          />
                          <button onClick={() => setShowOldPwd(!showOldPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showOldPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-1 block">
                          新密码 <span className="text-gray-400">（不改留空）</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPwd ? 'text' : 'password'} value={editNewPassword} onChange={(e) => setEditNewPassword(e.target.value)}
                            onFocus={() => setEditPasswordChanging(true)}
                            className="w-full px-3 py-2 pr-8 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-warm-200"
                            placeholder="≥6位"
                          />
                          <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-1 block">
                          确认新密码
                        </label>
                        <input
                          type="password" value={editConfirmPassword} onChange={(e) => setEditConfirmPassword(e.target.value)}
                          onFocus={() => setEditPasswordChanging(true)}
                          className={cn(
                            'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2',
                            editConfirmPassword && editNewPassword !== editConfirmPassword
                              ? 'border-red-300 focus:ring-red-200 ring-1 ring-red-200'
                              : 'border-warm-200 focus:ring-warm-200'
                          )}
                          placeholder="再次输入新密码"
                        />
                      </div>
                    </div>
                  ) : passwordOpen && (
                    <div className="p-4 rounded-xl bg-warm-50 border border-warm-100 space-y-3">
                      {passwordSuccess && (
                        <div className="flex items-center gap-2 text-xs text-forest-700 font-semibold bg-forest-50 border border-forest-200 p-2 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" /> 密码修改成功！
                        </div>
                      )}
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">当前密码</label>
                          <div className="relative">
                            <input
                              type={showOldPwd ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                              className="w-full px-3 py-2 pr-8 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-warm-200"
                              placeholder="请输入当前密码"
                            />
                            <button onClick={() => setShowOldPwd(!showOldPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showOldPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">新密码 (≥6位)</label>
                          <div className="relative">
                            <input
                              type={showNewPwd ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-3 py-2 pr-8 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-warm-200"
                              placeholder="请输入新密码"
                            />
                            <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">确认新密码</label>
                          <input
                            type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className={cn(
                              'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2',
                              confirmPassword && newPassword !== confirmPassword
                                ? 'border-red-300 focus:ring-red-200 ring-1 ring-red-200'
                                : 'border-warm-200 focus:ring-warm-200'
                            )}
                            placeholder="再次输入新密码"
                          />
                        </div>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-[10px] text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> 两次输入的密码不一致
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setPasswordOpen(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          取消
                        </button>
                        <button
                          onClick={handleSavePassword}
                          disabled={passwordSaving || !oldPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-warm-500 to-orange-500 text-white text-xs font-semibold hover:shadow-md disabled:opacity-50 transition-all inline-flex items-center gap-1"
                        >
                          {passwordSaving ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                          确认修改
                        </button>
                      </div>
                    </div>
                  )}

                  {!editing && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">邮箱绑定</p>
                          <p className="text-[10px] text-gray-500">{editEmail ? `已绑定：${editEmail}` : '未绑定，绑定后可找回密码'}</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-200 transition-colors">
                        {editEmail ? '更换' : '去绑定'}
                      </button>
                    </div>
                  )}

                  {user?.role !== 'owner' && (
                    <div className="p-3 rounded-xl bg-gray-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-sky-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">安全 Token ({showSensitive ? '可见' : '已隐藏'})</p>
                            <p className="text-[10px] text-gray-500">用于 API 访问 · 请勿泄露</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowSensitive(!showSensitive)} className="p-2 rounded-lg hover:bg-white transition-colors" title="显示/隐藏">
                            {showSensitive ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                          </button>
                          <button className="p-2 rounded-lg hover:bg-white transition-colors" title="刷新 Token">
                            <RefreshCw className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <code className="block w-full px-3 py-2 rounded-lg bg-white border border-gray-100 text-[10px] font-mono text-gray-600 break-all">
                        {showSensitive ? token : `${token?.slice(0, 16)}...${token?.slice(-8)}`}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 角色预览/切换 */}
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" /> 角色权限 · 平台预览
            </h2>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 space-y-1.5 text-[11px] text-purple-700">
              <p className="font-bold flex items-center gap-1">
                🔐 重新验证说明：点击下方任一角色卡片，将使用该角色演示账号通过账号密码重新鉴权，通过鉴权后进入目标角色工作台。
              </p>
              <p className="flex items-start gap-1">
                <span className="font-bold shrink-0">操作生效范围：</span>
                <span>预览期间，问诊下单、商城购买、档案修改、预约挂号等业务操作均以预览身份真实写入数据库，操作结果对该角色的所有账号生效。</span>
              </p>
              <p className="flex items-start gap-1">
                <span className="font-bold shrink-0">权限边界：</span>
                <span>页面导航、数据可见性、操作按钮、API 访问均严格按预览角色的 RBAC 权限矩阵实时生效，超出权限的操作会被服务端拦截。</span>
              </p>
              <p className="flex items-start gap-1">
                <span className="font-bold shrink-0">审计留痕：</span>
                <span>角色切换、预览期间所有业务操作均会被平台审计日志完整记录（含原身份→预览身份切换链路），超级管理员可在管理后台复查。</span>
              </p>
              {impersonateRole && originalCredentials && (
                <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-purple-200/60">
                  <AlertTriangle className="w-3.5 h-3.5 text-warm-600 shrink-0" />
                  <span className="font-semibold text-warm-700">
                    您当前正在以【{roleConfig[impersonateRole]?.label}】身份预览中，原身份为【{roleConfig[originalCredentials.role]?.label}】
                  </span>
                </div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roleOrder.map((r) => {
                const rc = roleConfig[r];
                const RIcon = rc.Icon;
                const isCurrent = r === user?.role;
                const isPreviewing = previewRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleRolePreview(r)}
                    disabled={isCurrent || !!previewRole}
                    className={cn(
                      'p-4 rounded-2xl text-left transition-all',
                      isCurrent
                        ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 cursor-default'
                        : 'bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-purple-200 hover:shadow-sm disabled:opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rc.color} flex items-center justify-center shrink-0`}>
                        <RIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{rc.label}</div>
                        {isCurrent ? (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-600">
                            <CheckCircle2 className="w-3 h-3" /> 当前登录
                          </div>
                        ) : isPreviewing ? (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-600">
                            <Clock className="w-3 h-3 animate-spin" /> 验证身份中
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400">点击进入预览</div>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{rc.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 审计日志 */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" /> 账号操作审计
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAudit}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold hover:bg-slate-200 transition-colors inline-flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> 导出最近30天
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 -mt-2">近期账号的所有敏感操作记录，用于审计复查与安全追溯</p>
            <div className="flex flex-wrap gap-1.5">
              {auditActionTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setAuditFilter(type)}
                  className={cn(
                    'px-2 py-1 rounded-lg text-[10px] font-semibold transition-all border',
                    auditFilter === type
                      ? 'bg-slate-500 text-white border-slate-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-slate-300'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {auditTrail
                .filter(log => auditFilter === '全部' || log.type === auditFilter)
                .map((log) => {
                  const i = auditTrail.indexOf(log);
                  const isExpanded = expandedAuditId === i;
                  const detail = isExpanded ? getAuditDetail(i) : null;
                  return (
                    <div key={i} className="p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-semibold text-gray-800">{log.action}</span>
                            <span className={cn(
                              'text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
                              log.type === '资料修改' ? 'bg-blue-100 text-blue-700' :
                              log.type === '密码修改' ? 'bg-red-100 text-red-700' :
                              log.type === '手机号变更' ? 'bg-orange-100 text-orange-700' :
                              log.type === '资质复查' ? 'bg-warm-100 text-warm-700' :
                              log.type === '角色变更' ? 'bg-purple-100 text-purple-700' :
                              'bg-slate-100 text-slate-700'
                            )}>
                              {log.type}
                            </span>
                            <span className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                              log.result === '成功' ? 'bg-forest-100 text-forest-700' :
                              log.result === '放行' ? 'bg-blue-100 text-blue-700' :
                              log.result === '已提交' ? 'bg-warm-100 text-warm-700' :
                              log.result === '验证邮件已发送' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-600'
                            )}>
                              {log.result}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600">{log.detail}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] text-gray-400 font-mono">{log.time}</div>
                          </div>
                          <button
                            onClick={() => setExpandedAuditId(isExpanded ? null : i)}
                            className={cn(
                              'p-1 rounded transition-colors',
                              isExpanded ? 'bg-slate-100 text-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            )}
                          >
                            <Activity className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')} />
                          </button>
                        </div>
                      </div>
                      {isExpanded && detail && (
                        <div className="mt-2 ml-5 pt-2 border-t border-gray-100 text-[10px] space-y-1.5">
                          <div className="font-semibold text-gray-700 mb-1">操作详情</div>
                          {detail.fieldChanges.length > 0 && (
                            <div className="space-y-1">
                              <div className="font-semibold text-gray-600">字段变更：</div>
                              {detail.fieldChanges.map((fc, idx) => (
                                <div key={idx} className="flex items-start gap-2 pl-2">
                                  <span className="text-gray-500 shrink-0">{fc.field}:</span>
                                  <span className="text-red-600 line-through">{fc.before}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-forest-600">{fc.after}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 pl-2">
                            <span className="text-gray-600"><span className="font-semibold">IP地址：</span>{detail.ip}</span>
                            <span className="text-gray-600"><span className="font-semibold">设备信息：</span>{detail.device}</span>
                            <span className="text-gray-600"><span className="font-semibold">验证方式：</span>{detail.verifyMethod}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 安全验证记录 */}
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-500" /> 安全验证记录
            </h2>
            <p className="text-xs text-gray-500 -mt-2">最近30天所有二次安全验证记录</p>
            <div className="space-y-2">
              {securityRecords.map(record => (
                <div key={record.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    record.method === '密码校验' ? 'bg-warm-50' :
                    record.method === '短信验证码' ? 'bg-blue-50' : 'bg-purple-50'
                  )}>
                    {record.method === '密码校验' ? (
                      <Lock className={cn('w-4 h-4', record.result === '成功' ? 'text-warm-600' : 'text-red-500')} />
                    ) : record.method === '短信验证码' ? (
                      <Phone className={cn('w-4 h-4', record.result === '成功' ? 'text-blue-600' : 'text-red-500')} />
                    ) : (
                      <Mail className={cn('w-4 h-4', record.result === '成功' ? 'text-purple-600' : 'text-red-500')} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-semibold text-gray-800">{record.method}</span>
                      <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        record.result === '成功' ? 'bg-forest-100 text-forest-700' : 'bg-red-100 text-red-700'
                      )}>
                        {record.result}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span className="font-mono">{record.time}</span>
                      <span className="font-mono">IP: {record.ip}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {statusInfo && (
            <div className="card space-y-3 bg-gradient-to-br from-cream-50 to-forest-50 border-forest-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-forest-600" />
                <span className="font-semibold text-forest-900 text-sm">资质状态说明</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-start gap-2">
                  {statusInfo.color.includes('forest') ? (
                    <CheckCircle2 className="w-4 h-4 text-forest-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warm-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{statusInfo.label}</p>
                    <p className="text-gray-600">{statusInfo.desc}</p>
                    {user?.licenseVerified === false && user.role === 'doctor' && (
                      <p className="text-warm-600 mt-1">您的执业资质正在审核中，审核期间无法承接问诊、开具处方。</p>
                    )}
                    {user?.status === 'pending_review' && (user.role === 'hospital' || user.role === 'merchant') && (
                      <p className="text-warm-600 mt-1">您的营业执照和经营资质正在审核，审核期间无法上架商品、服务定价。</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧栏 */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-forest-500" /> 权限边界
            </h2>
            <div className="space-y-2 text-[11px]">
              {[
                { label: '在线问诊模块', roles: ['admin', 'platform', 'ops', 'doctor', 'owner'] },
                { label: '处方流转 / 双签', roles: ['admin', 'platform', 'ops', 'doctor', 'owner'] },
                { label: '医院服务定价', roles: ['admin', 'platform', 'ops', 'hospital'] },
                { label: '商城商品上架', roles: ['admin', 'platform', 'ops', 'merchant'] },
                { label: '资质审核队列', roles: ['admin', 'platform'] },
                { label: '审计日志复查', roles: ['admin', 'platform'] },
                { label: '基础设施监控', roles: ['admin', 'ops'] },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                  <span className="text-gray-700">{m.label}</span>
                  <span className={cn(
                    'font-semibold',
                    m.roles.includes(user?.role || '') ? 'text-forest-600' : 'text-gray-400'
                  )}>
                    {m.roles.includes(user?.role || '') ? '✓ 可访问' : '— 受限'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-purple-700 font-mono text-[10px]">RBAC 实时生效</span>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" /> 账号操作
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/calendar')}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-forest-50 to-emerald-50 text-forest-700 font-medium text-sm hover:from-forest-100 hover:to-emerald-100 transition-colors inline-flex items-center justify-between"
              >
                查看健康日历提醒 <span className="text-xs bg-white px-2 py-0.5 rounded-full">4 项待办</span>
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 font-medium text-sm hover:from-purple-100 hover:to-indigo-100 transition-colors inline-flex items-center justify-between"
                >
                  返回超级管理控制台 <span className="text-xs bg-white px-2 py-0.5 rounded-full">7 大业务模块</span>
                </button>
              )}
              <button
                onClick={() => { logout(); navigate('/login', { replace: true }); }}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 text-red-600 font-medium text-sm hover:from-red-100 hover:to-rose-100 transition-colors inline-flex items-center gap-2 justify-center"
              >
                <LogOut className="w-4 h-4" /> 安全退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 角色变更申请弹窗 */}
      {roleRequestOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !roleRequestSuccess && setRoleRequestOpen(false)}>
          <div className="w-full max-w-lg card shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-500" /> 申请角色变更
              </h3>
              <button onClick={() => !roleRequestSuccess && setRoleRequestOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            {roleRequestSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-forest-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-forest-600" />
                </div>
                <p className="font-semibold text-gray-900">申请已提交</p>
                <p className="text-sm text-gray-500">管理员将在 1-3 个工作日内完成复核</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500">
                  角色变更需要管理员复核，请如实填写变更原因。申请记录将永久留痕，可在审计日志中追溯。
                </p>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">目标角色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOrder.filter(r => r !== user?.role && r !== 'admin').map((r) => {
                      const rc = roleConfig[r];
                      const RIcon = rc.Icon;
                      return (
                        <button
                          key={r} onClick={() => setTargetRole(r)}
                          className={cn(
                            'p-2.5 rounded-xl text-center transition-all border',
                            targetRole === r
                              ? 'border-purple-400 bg-purple-50 shadow-sm'
                              : 'border-gray-100 bg-gray-50 hover:border-purple-200'
                          )}
                        >
                          <div className={cn('w-8 h-8 mx-auto rounded-lg bg-gradient-to-br', rc.color, 'flex items-center justify-center mb-1')}>
                            <RIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-[11px] font-semibold text-gray-800">{rc.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">变更原因（必填）</label>
                  <textarea
                    value={roleReason} onChange={(e) => setRoleReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="请说明角色变更的原因和必要性..."
                  />
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 申请提交后将由超级管理员复核，全程留痕审计
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setRoleRequestOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitRoleRequest}
                    disabled={roleRequestSubmitting || !roleReason.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium hover:shadow-md disabled:opacity-50 transition-all inline-flex items-center gap-1"
                  >
                    {roleRequestSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    提交复核申请
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
