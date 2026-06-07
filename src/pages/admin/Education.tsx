import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BookOpen, Plus, X, Award } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  credits: number;
  category: string;
  status: 'active' | 'inactive';
}

interface EducationRecord {
  id: number;
  nurse_name: string;
  course_title: string;
  credits: number;
  completed_at: string;
}

export default function Education() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [records, setRecords] = useState<EducationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', credits: '', category: '' });
  const [tab, setTab] = useState<'courses' | 'records'>('courses');

  const fetchData = async () => {
    try {
      const [coursesData, recordsData] = await Promise.all([
        api<Course[]>('/admin/education/courses'),
        api<EducationRecord[]>('/admin/education/records'),
      ]);
      setCourses(coursesData);
      setRecords(recordsData);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/admin/education/courses', {
        method: 'POST',
        body: JSON.stringify({ ...form, credits: Number(form.credits) }),
      });
      setShowForm(false);
      setForm({ title: '', credits: '', category: '' });
      fetchData();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E293B]">继续教育</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#0F6CBD] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0D5DA8]">
          <Plus className="w-4 h-4" /> 添加课程
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('courses')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'courses' ? 'bg-[#0F6CBD] text-white' : 'bg-white text-gray-600'}`}>
          课程列表
        </button>
        <button onClick={() => setTab('records')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'records' ? 'bg-[#0F6CBD] text-white' : 'bg-white text-gray-600'}`}>
          学习记录
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (<div key={i} className="h-10 bg-gray-200 rounded" />))}
        </div>
      ) : tab === 'courses' ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">课程名称</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">学分</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">分类</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-gray-400" />{course.title}</td>
                  <td className="py-3 px-4"><span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-yellow-500" />{course.credits}</span></td>
                  <td className="py-3 px-4">{course.category}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${course.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {course.status === 'active' ? '启用' : '停用'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">护士</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">课程</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">学分</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">完成时间</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">{record.nurse_name}</td>
                  <td className="py-3 px-4">{record.course_title}</td>
                  <td className="py-3 px-4">{record.credits}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(record.completed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[420px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1E293B]">添加课程</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学分</label>
                <input type="number" value={form.credits} onChange={(e) => setForm((p) => ({ ...p, credits: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]" required />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-[#0F6CBD] text-white hover:bg-[#0D5DA8]">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
