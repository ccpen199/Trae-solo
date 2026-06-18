import { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import StatusSteps from '@/components/StatusSteps';
import { apiFetch } from '@/lib/api';

interface Complaint {
  id: number;
  target: string;
  subject: string;
  status: number;
  rejected: boolean;
  createdAt: string;
}

const statusSteps = [
  { label: '已提交' },
  { label: '已受理' },
  { label: '调查中' },
  { label: '已处理' },
  { label: '已结案' },
];

const mockComplaints: Complaint[] = [
  { id: 1, target: '某建筑公司', subject: '拖欠工资', status: 3, rejected: false, createdAt: '2026-04-15' },
  { id: 2, target: '某餐饮企业', subject: '未签劳动合同', status: 1, rejected: false, createdAt: '2026-05-20' },
  { id: 3, target: '某物流公司', subject: '加班费争议', status: 4, rejected: false, createdAt: '2026-02-10' },
];

export default function Complaint() {
  const [target, setTarget] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = () => {
    setFiles([...files, `证据_${files.length + 1}.jpg`]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/api/labor/complaint', {
        method: 'POST',
        body: JSON.stringify({ target, subject, description, files }),
      });
    } catch {}
    const newComplaint: Complaint = {
      id: complaints.length + 1,
      target,
      subject,
      status: 0,
      rejected: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setComplaints([newComplaint, ...complaints]);
    setTarget('');
    setSubject('');
    setDescription('');
    setFiles([]);
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">劳动监察投诉</h1>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-neutral-700 mb-4">提交投诉</h2>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">被投诉单位</label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请输入被投诉单位名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">投诉事由</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请输入投诉事由"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">详细描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请详细描述投诉事项"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">证据材料</label>
            <div
              onClick={handleFileSelect}
              className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
              <p className="text-sm text-neutral-500">点击上传证据</p>
            </div>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-neutral-600 bg-neutral-50 rounded px-3 py-2">
                    <CheckCircle className="w-4 h-4 text-success-500" />
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!target || !subject || submitting}
            className="px-6 py-2 bg-accent-500 text-white rounded-lg text-sm hover:bg-accent-600 disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交投诉'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-neutral-700 mb-4">投诉记录</h2>
        <div className="space-y-4">
          {complaints.map((c) => (
            <div key={c.id} className="border border-neutral-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-neutral-700">
                  {c.target} · {c.subject}
                </span>
                <span className="text-xs text-neutral-400">{c.createdAt}</span>
              </div>
              <StatusSteps steps={statusSteps} current={c.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
