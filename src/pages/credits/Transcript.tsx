import { Printer, FileDown, User, BookOpen } from 'lucide-react';
import { mockTranscript } from '@/mock/credits';

export default function Transcript() {
  const t = mockTranscript;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">第二课堂成绩单</h1>
        <div className="flex gap-3">
          <button className="btn-outline flex items-center gap-2">
            <Printer className="w-4 h-4" />
            打印成绩单
          </button>
          <button className="btn-primary flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            导出PDF
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-7 h-7 text-primary-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-surface-900">{t.name}</h2>
              <p className="text-sm text-surface-500 font-mono">{t.studentId}</p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-surface-400">院系</span>
              <p className="text-surface-700 font-medium mt-0.5">{t.department}</p>
            </div>
            <div>
              <span className="text-surface-400">专业</span>
              <p className="text-surface-700 font-medium mt-0.5">{t.major}</p>
            </div>
            <div>
              <span className="text-surface-400">年级</span>
              <p className="text-surface-700 font-medium mt-0.5">{t.grade}</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-primary-50 rounded-lg p-3">
              <BookOpen className="w-5 h-5 text-primary-600 mb-1" />
              <span className="text-xs text-primary-600">累计学分</span>
              <span className="text-3xl font-bold text-primary-800 font-mono">{t.totalCredits}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100">
          <h2 className="text-lg font-semibold text-surface-900">学分记录</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                <th className="text-left py-3 px-4 text-surface-500 font-medium">类型</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">名称</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">学时</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">日期</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {t.records.map((record) => (
                <tr key={record.id} className="border-b border-surface-100 hover:bg-surface-50/50">
                  <td className="py-3 px-4">
                    <span className="status-badge bg-primary-100 text-primary-700">{record.type}</span>
                  </td>
                  <td className="py-3 px-4 text-surface-700">{record.name}</td>
                  <td className="py-3 px-4 text-surface-700 font-mono font-medium">{record.creditHours}</td>
                  <td className="py-3 px-4 text-surface-500">{record.date}</td>
                  <td className="py-3 px-4">
                    <span className="status-badge bg-success-50 text-success-600">{record.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
