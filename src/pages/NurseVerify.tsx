import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, Tag, Input, Steps, Button, message } from 'antd';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Shield,
  Search,
  Building2,
  Star,
  Phone,
  FileKey,
  Lock,
  User,
  Award,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Timeline from '@/components/Timeline';
import type { TimelineItem } from '@/components/Timeline';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockNurses } from '@/mock';
import { cn } from '@/lib/utils';
import type { Nurse, VerifyStatus } from '@/types';

const { TextArea } = Input;

const systemCheckItems = [
  { key: 'registry', label: '医师执业注册信息系统核验', passed: true, message: '证书编号有效，注册状态正常' },
  { key: 'qualification', label: '执业资格有效性核验', passed: true, message: '执业资格在有效期内，未被吊销或注销' },
  { key: 'practice', label: '执业范围核验', passed: true, message: '执业范围与申报匹配，可从事居家护理服务' },
  { key: 'sanction', label: '违规记录核验', passed: false, message: '近三年无重大医疗违规处罚记录（提示：1条轻微警告，已处理）' },
];

export default function NurseVerify() {
  const { id = 'n001' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getNurseById, updateNurse, setNurses, nurses } = useGlobalStore();
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState<{ pass: boolean; reject: boolean }>({ pass: false, reject: false });

  useEffect(() => {
    if (nurses.length === 0) {
      setNurses(mockNurses);
    }
  }, [nurses.length, setNurses]);

  const nurse: Nurse | undefined = useMemo(
    () => getNurseById(id) ?? mockNurses.find((n) => n.id === id) ?? mockNurses[0],
    [getNurseById, id]
  );

  const currentStep = useMemo(() => {
    if (!nurse) return 0;
    if (nurse.verifyStatus === 'verified' || nurse.verifyStatus === 'rejected') return 2;
    if (nurse.verifyStatus === 'verifying') return 1;
    return 0;
  }, [nurse]);

  const handlePass = () => {
    setLoading((s) => ({ ...s, pass: true }));
    setTimeout(() => {
      if (nurse) {
        updateNurse(nurse.id, {
          verifyStatus: 'verified' as VerifyStatus,
          verifyResult: {
            systemChecked: true,
            systemMessage: '证书信息核验通过',
            manualChecked: true,
            manualRemark: remark || '资料齐全，审核通过',
          },
        });
      }
      message.success('核验已通过');
      setLoading((s) => ({ ...s, pass: false }));
    }, 800);
  };

  const handleReject = () => {
    if (!remark.trim()) {
      message.warning('请填写驳回意见');
      return;
    }
    setLoading((s) => ({ ...s, reject: true }));
    setTimeout(() => {
      if (nurse) {
        updateNurse(nurse.id, {
          verifyStatus: 'rejected' as VerifyStatus,
          verifyResult: {
            systemChecked: true,
            systemMessage: '证书信息核验通过',
            manualChecked: true,
            manualRemark: remark,
          },
        });
      }
      message.error('已驳回核验申请');
      setLoading((s) => ({ ...s, reject: false }));
    }, 800);
  };

  if (!nurse) return null;

  const verifyHistory: TimelineItem[] = [
    {
      id: 'h1',
      title: '提交资质申请',
      description: `护士 ${nurse.name} 提交了执业资质核验申请，附证书扫描件 1 份`,
      time: nurse.createdAt,
      status: 'completed' as const,
    },
    {
      id: 'h2',
      title: '系统自动核验',
      description: '对接国家卫健委医师执业注册信息系统完成 4 项自动核验',
      time: nurse.verifyStatus !== 'pending' ? nurse.createdAt : undefined,
      status: nurse.verifyStatus === 'pending' ? 'pending' : 'completed',
    },
    {
      id: 'h3',
      title: '人工审核处理',
      description: nurse.verifyResult?.manualRemark ?? '等待审核员处理',
      time: nurse.verifyStatus === 'verified' || nurse.verifyStatus === 'rejected' ? nurse.createdAt : undefined,
      status: nurse.verifyStatus === 'verified' || nurse.verifyStatus === 'rejected' ? 'completed' : 'current',
      color: (nurse.verifyStatus === 'rejected' ? 'red' : nurse.verifyStatus === 'verified' ? 'green' : undefined) as 'red' | 'green' | undefined,
    },
  ];

  return (
    <div>
      <PageHeader
        showBack
        onBack={() => navigate('/nurses')}
        title="护士资质核验"
        description={nurse.certificateNumber}
        icon={<Shield className="h-6 w-6" />}
        actions={[
          {
            key: 'pass',
            label: '核验通过',
            type: 'primary',
            icon: <CheckCircle className="h-4 w-4" />,
            onClick: handlePass,
            loading: loading.pass,
            disabled: nurse.verifyStatus === 'verified',
          },
          {
            key: 'reject',
            label: '驳回申请',
            icon: <XCircle className="h-4 w-4" />,
            danger: true,
            onClick: handleReject,
            loading: loading.reject,
            disabled: nurse.verifyStatus === 'rejected',
          },
        ]}
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar size={84} src={nurse.avatar} className="mb-4 !text-3xl !font-semibold !bg-sky-100 !text-sky-600">
                {nurse.name.charAt(0)}
              </Avatar>
              <h2 className="text-lg font-bold text-slate-900">{nurse.name}</h2>
              <div className="mt-2">
                <StatusBadge type="verify" status={nurse.verifyStatus} />
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm text-amber-500">
                <Star className="h-4 w-4 fill-amber-400" />
                <span className="font-semibold">{nurse.rating}</span>
                <span className="text-slate-400">· 完成订单 {nurse.completedOrders}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <InfoRow icon={<Award className="h-4 w-4 text-slate-400" />} label="执业证号" value={<span className="font-mono">{nurse.certificateNumber}</span>} />
              <InfoRow icon={<FileKey className="h-4 w-4 text-slate-400" />} label="资质类型" value={<Tag color="blue" className="!my-0">{nurse.certificateType}</Tag>} />
              <InfoRow icon={<Phone className="h-4 w-4 text-slate-400" />} label="手机号码" value={nurse.phone} />
              <InfoRow icon={<User className="h-4 w-4 text-slate-400" />} label="身份证号" value={<span className="font-mono">{nurse.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}</span>} />
              <InfoRow icon={<Building2 className="h-4 w-4 text-slate-400" />} label="所属机构" value={nurse.organizationName} />
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="mb-2 text-xs font-medium text-slate-500">执业范围</div>
              <div className="flex flex-wrap gap-1.5">
                {nurse.practiceScope.map((scope) => (
                  <Tag key={scope} color="cyan" className="!my-0">{scope}</Tag>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">证书预览</h3>
                <p className="mt-0.5 text-xs text-slate-500">执业证书扫描件</p>
              </div>
              <StatusBadge type="verify" status={nurse.verifyStatus} showDot={false} />
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Upload className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-slate-600">执业证书扫描件预览</div>
                  <div className="mt-1 text-xs text-slate-400">点击查看高清原件</div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-3.5">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">文件名称</span>
                  <span className="font-mono text-slate-700 truncate ml-3">{nurse.name}_执业证.pdf</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">文件大小</span>
                  <span className="text-slate-700">2.48 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">上传时间</span>
                  <span className="text-slate-700">{nurse.createdAt.slice(0, 16)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
              <Lock className="h-4 w-4 shrink-0" />
              <span>文件已采用 AES-256 加密存储，仅授权人员可访问</span>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-slate-900">系统核验流程</h3>
              <p className="mt-0.5 text-xs text-slate-500">对接国家执业注册系统</p>
            </div>

            <Steps
              direction="vertical"
              size="small"
              current={currentStep}
              status={nurse.verifyStatus === 'rejected' ? 'error' : undefined}
              items={[
                { title: '提交申请', description: nurse.createdAt.slice(0, 16), icon: <Upload className="h-4 w-4" /> },
                { title: '系统核验', description: '对接医师执业注册信息系统', icon: <Search className="h-4 w-4" /> },
                { title: '人工审核', description: '审核员最终确认', icon: <Shield className="h-4 w-4" /> },
              ]}
              className="verify-steps"
            />

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">系统核验详情</span>
              </div>
              <div className="space-y-2">
                {systemCheckItems.map((item) => (
                  <div key={item.key} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <div className={cn(
                      'mt-0.5 shrink-0',
                      item.passed ? 'text-emerald-500' : 'text-amber-500'
                    )}>
                      {item.passed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-800">{item.label}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="mb-2 text-xs font-medium text-slate-700">人工审核意见</div>
              <TextArea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder={nurse.verifyResult?.manualRemark ?? '请填写审核意见，驳回时必填'}
                rows={4}
                className="!text-sm"
                disabled={nurse.verifyStatus === 'verified' || nurse.verifyStatus === 'rejected'}
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircle className="h-4 w-4" />}
                  onClick={handlePass}
                  loading={loading.pass}
                  disabled={nurse.verifyStatus === 'verified'}
                  className="!h-11"
                >
                  通过核验
                </Button>
                <Button
                  size="large"
                  danger
                  icon={<XCircle className="h-4 w-4" />}
                  onClick={handleReject}
                  loading={loading.reject}
                  disabled={nurse.verifyStatus === 'rejected'}
                  className="!h-11"
                >
                  驳回申请
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <History className="h-5 w-5 text-slate-500" />
          <h3 className="text-base font-semibold text-slate-900">核验历史</h3>
        </div>
        <Timeline items={verifyHistory} />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-slate-500 shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-right text-slate-800 font-medium truncate">{value}</div>
    </div>
  );
}
