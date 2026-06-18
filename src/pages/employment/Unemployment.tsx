import { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import StatusSteps from '@/components/StatusSteps';
import { apiFetch } from '@/lib/api';

interface Application {
  id: number;
  reason: string;
  bankName: string;
  bankAccount: string;
  status: number;
  rejected: boolean;
  rejectReason?: string;
  createdAt: string;
}

const statusSteps = [
  { label: '已提交' },
  { label: '审核中' },
  { label: '审批通过' },
  { label: '发放完成' },
];

const mockApps: Application[] = [
  { id: 1, reason: '合同到期未续签', bankName: '中国工商银行', bankAccount: '6222****1234', status: 3, rejected: false, createdAt: '2026-04-10' },
  { id: 2, reason: '公司裁员', bankName: '中国建设银行', bankAccount: '6227****5678', status: 1, rejected: false, createdAt: '2026-06-01' },
  { id: 3, reason: '个人原因离职', bankName: '中国银行', bankAccount: '6216****9012', status: 1, rejected: true, rejectReason: '材料不完整，请补充离职证明', createdAt: '2026-05-15' },
];

export default function Unemployment() {
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [apps, setApps] = useState<Application[]>(mockApps);
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = () => {
    const name = `材料_${files.length + 1}.pdf`;
    setFiles([...files, name]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/api/employment/unemployment', {
        method: 'POST',
        body: JSON.stringify({ reason, bankName, bankAccount, files }),
      });
      const newApp: Application = {
        id: apps.length + 1,
        reason,
        bankName,
        bankAccount,
        status: 0,
        rejected: false,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setApps([newApp, ...apps]);
      setStep(0);
      setReason('');
      setBankName('');
      setBankAccount('');
      setFiles([]);
    } catch {
      const newApp: Application = {
        id: apps.length + 1,
        reason,
        bankName,
        bankAccount,
        status: 0,
        rejected: false,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setApps([newApp, ...apps]);
      setStep(0);
      setReason('');
      setBankName('');
      setBankAccount('');
      setFiles([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = (app: Application) => {
    setReason(app.reason);
    setBankName(app.bankName);
    setBankAccount(app.bankAccount);
    setStep(0);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">失业金申领</h1>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          {['基本信息', '材料上传', '确认提交'].map((label, idx) => (
            <button
              key={idx}
              onClick={() => { if (idx < step) setStep(idx); }}
              className={`flex items-center gap-2 text-sm font-medium ${
                idx === step ? 'text-primary-700' : idx < step ? 'text-success-600' : 'text-neutral-400'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                idx === step ? 'bg-primary-700 text-white' : idx < step ? 'bg-success-500 text-white' : 'bg-neutral-200 text-neutral-500'
              }`}>
                {idx < step ? '✓' : idx + 1}
              </span>
              {label}
            </button>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">失业原因</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请描述失业原因"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">开户银行</label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入开户银行名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">银行账号</label>
              <input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入银行账号"
              />
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!reason || !bankName || !bankAccount}
              className="px-6 py-2 bg-primary-700 text-white rounded-lg text-sm hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 max-w-lg">
            <div
              onClick={handleFileSelect}
              className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">点击上传材料</p>
              <p className="text-xs text-neutral-400 mt-1">支持 PDF、JPG、PNG 格式</p>
            </div>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2">
                    <CheckCircle className="w-4 h-4 text-success-500" />
                    {f}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-2 border border-neutral-300 text-neutral-600 rounded-lg text-sm hover:bg-neutral-50"
              >
                上一步
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-primary-700 text-white rounded-lg text-sm hover:bg-primary-800"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 max-w-lg">
            <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">失业原因</span>
                <span className="text-neutral-800">{reason}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">开户银行</span>
                <span className="text-neutral-800">{bankName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">银行账号</span>
                <span className="text-neutral-800">{bankAccount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">上传材料</span>
                <span className="text-neutral-800">{files.length} 份</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-neutral-300 text-neutral-600 rounded-lg text-sm hover:bg-neutral-50"
              >
                上一步
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-accent-500 text-white rounded-lg text-sm hover:bg-accent-600 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-neutral-800 mb-4">申领记录</h2>
        <div className="space-y-4">
          {apps.map((app) => (
            <div key={app.id} className="border border-neutral-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-neutral-500">申请时间：{app.createdAt}</span>
                {app.rejected && (
                  <button
                    onClick={() => handleResubmit(app)}
                    className="text-xs px-3 py-1 bg-accent-100 text-accent-600 rounded-md hover:bg-accent-200"
                  >
                    重新提交
                  </button>
                )}
              </div>
              <StatusSteps steps={statusSteps} current={app.status} rejected={app.rejected} />
              {app.rejected && app.rejectReason && (
                <p className="text-sm text-danger-500 mt-3">退回原因：{app.rejectReason}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
