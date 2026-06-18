import { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import StatusSteps from '@/components/StatusSteps';
import { apiFetch } from '@/lib/api';

interface TitleApp {
  id: number;
  series: string;
  level: string;
  status: number;
  rejected: boolean;
  rejectReason?: string;
  createdAt: string;
}

const statusSteps = [
  { label: '已提交' },
  { label: '审核中' },
  { label: '评审通过' },
  { label: '已发证' },
];

const seriesOptions = ['工程系列', '教育系列', '卫生系列', '经济系列', '会计系列'];
const levelOptions = ['初级', '中级', '高级', '正高级'];

const mockApps: TitleApp[] = [
  { id: 1, series: '工程系列', level: '中级', status: 2, rejected: false, createdAt: '2026-03-20' },
  { id: 2, series: '经济系列', level: '初级', status: 1, rejected: true, rejectReason: '业绩材料不充分', createdAt: '2026-05-10' },
];

export default function Title() {
  const [series, setSeries] = useState('');
  const [level, setLevel] = useState('');
  const [achievements, setAchievements] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [apps, setApps] = useState<TitleApp[]>(mockApps);
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = () => {
    setFiles([...files, `材料_${files.length + 1}.pdf`]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/api/talent/title', {
        method: 'POST',
        body: JSON.stringify({ series, level, achievements, files }),
      });
    } catch {}
    const newApp: TitleApp = {
      id: apps.length + 1,
      series,
      level,
      status: 0,
      rejected: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setApps([newApp, ...apps]);
    setSeries('');
    setLevel('');
    setAchievements('');
    setFiles([]);
    setSubmitting(false);
  };

  const handleResubmit = (app: TitleApp) => {
    setSeries(app.series);
    setLevel(app.level);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">职称申报</h1>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-neutral-700 mb-4">新建申报</h2>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">系列</label>
            <select
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择系列</option>
              {seriesOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">级别</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择级别</option>
              {levelOptions.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">业绩成果</label>
            <textarea
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请描述主要业绩成果"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">材料上传</label>
            <div
              onClick={handleFileSelect}
              className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
              <p className="text-sm text-neutral-500">点击上传</p>
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
            disabled={!series || !level || submitting}
            className="px-6 py-2 bg-primary-700 text-white rounded-lg text-sm hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '提交申报'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-neutral-700 mb-4">申报记录</h2>
        <div className="space-y-4">
          {apps.map((app) => (
            <div key={app.id} className="border border-neutral-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-neutral-700">
                  {app.series} · {app.level}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">{app.createdAt}</span>
                  {app.rejected && (
                    <button
                      onClick={() => handleResubmit(app)}
                      className="text-xs px-3 py-1 bg-accent-100 text-accent-600 rounded-md hover:bg-accent-200"
                    >
                      重新提交
                    </button>
                  )}
                </div>
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
