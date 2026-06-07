import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Eye, Award } from 'lucide-react';

interface Nurse {
  id: number;
  name: string;
  license_number: string;
  qualification: string;
  status: 'pending' | 'verified' | 'online' | 'offline' | 'suspended';
  rating: number;
  today_load: number;
}

const statusLabels: Record<string, string> = {
  pending: '待核验', verified: '已核验', online: '在线', offline: '离线', suspended: '已暂停',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  online: 'bg-cyan-100 text-cyan-700',
  offline: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
};

const qualLabels: Record<string, string> = {
  junior: '护士', intermediate: '护师', senior: '主管护师', deputy: '副主任护师', chief: '主任护师',
};

export default function Nurses() {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);

  useEffect(() => {
    api<Nurse[]>('/admin/nurses')
      .then(setNurses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">护士管理</h1>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (<div key={i} className="h-10 bg-gray-200 rounded" />))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">姓名</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">执业证号</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">资质</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">评分</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">今日负荷</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {nurses.map((nurse) => (
                <tr key={nurse.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{nurse.name}</td>
                  <td className="py-3 px-4 text-gray-500">{nurse.license_number}</td>
                  <td className="py-3 px-4">{qualLabels[nurse.qualification] || nurse.qualification}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[nurse.status]}`}>
                      {statusLabels[nurse.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4">{nurse.rating}</td>
                  <td className="py-3 px-4">{nurse.today_load}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => setSelectedNurse(nurse)} className="text-[#0F6CBD] hover:underline flex items-center gap-1">
                      <Eye className="w-4 h-4" /> 查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedNurse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[420px]">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-[#0F6CBD]" />
              <h3 className="font-semibold text-[#1E293B]">护士详情</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">姓名：</span>{selectedNurse.name}</p>
              <p><span className="text-gray-500">执业证号：</span>{selectedNurse.license_number}</p>
              <p><span className="text-gray-500">资质：</span>{qualLabels[selectedNurse.qualification] || selectedNurse.qualification}</p>
              <p>
                <span className="text-gray-500">核验状态：</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[selectedNurse.status]}`}>
                  {statusLabels[selectedNurse.status]}
                </span>
              </p>
              <p><span className="text-gray-500">评分：</span>{selectedNurse.rating}</p>
              <p><span className="text-gray-500">今日负荷：</span>{selectedNurse.today_load} 单</p>
            </div>
            <button onClick={() => setSelectedNurse(null)} className="mt-4 w-full px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
