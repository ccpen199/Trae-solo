import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockCreditApplications } from '@/mock/credits';
import { CreditStatus } from '@/constants/enums';
import dayjs from 'dayjs';

const typeOptions = [
  { value: 'sanxiaxiang', label: '三下乡' },
  { value: 'activity', label: '活动' },
  { value: 'volunteer', label: '志愿者' },
  { value: 'other', label: '其他' },
];

export default function CreditApply() {
  const [form, setForm] = useState({
    type: 'sanxiaxiang',
    relatedName: '',
    creditHours: 1,
    remark: '',
  });
  const [files, setFiles] = useState<string[]>([]);

  const myApplications = mockCreditApplications.filter((a) => a.userId === 'u001');

  const updateForm = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = () => {
    setFiles((prev) => [...prev, `证明材料_${prev.length + 1}.pdf`]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForm({ type: 'sanxiaxiang', relatedName: '', creditHours: 1, remark: '' });
    setFiles([]);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-surface-900">学分认定申请</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">申请类型</label>
            <select
              value={form.type}
              onChange={(e) => updateForm('type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">关联活动/团队名称</label>
            <input
              type="text"
              value={form.relatedName}
              onChange={(e) => updateForm('relatedName', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">申请学时</label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.creditHours}
              onChange={(e) => updateForm('creditHours', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">证明材料</label>
          <div
            onClick={handleFileUpload}
            className="border-2 border-dashed border-surface-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
          >
            <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
            <p className="text-sm text-surface-500">点击上传证明材料</p>
            <p className="text-xs text-surface-400 mt-1">支持 PDF、图片、压缩包</p>
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-surface-600 bg-surface-50 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-primary-500" />
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">申请说明</label>
          <textarea
            value={form.remark}
            onChange={(e) => updateForm('remark', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="请简要说明申请理由..."
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">提交申请</button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100">
          <h2 className="text-lg font-semibold text-surface-900">我的申请</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                <th className="text-left py-3 px-4 text-surface-500 font-medium">类型</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">关联名称</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">学时</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">状态</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">申请日期</th>
              </tr>
            </thead>
            <tbody>
              {myApplications.map((app, i) => (
                <motion.tr
                  key={app.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-surface-100 hover:bg-surface-50/50"
                >
                  <td className="py-3 px-4 text-surface-700">{typeOptions.find((t) => t.value === app.type)?.label}</td>
                  <td className="py-3 px-4 text-surface-700">{app.relatedName}</td>
                  <td className="py-3 px-4 text-surface-700 font-mono">{app.creditHours}</td>
                  <td className="py-3 px-4">
                    <span className={`status-badge ${CreditStatus[app.status as keyof typeof CreditStatus]?.color}`}>
                      {CreditStatus[app.status as keyof typeof CreditStatus]?.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-surface-500">{dayjs(app.appliedAt).format('YYYY-MM-DD')}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
