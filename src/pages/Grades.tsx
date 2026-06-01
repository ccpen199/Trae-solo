import { useEffect, useState } from 'react';
import { Download, Filter, Search, Calendar, User } from 'lucide-react';
import { gradeApi, gradingApi } from '../utils/api';
import type { GradeRecord, Course, GradeArchive } from '../../shared/types';

const Grades = () => {
  const [grades, setGrades] = useState<GradeArchive[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gradesRes, coursesRes] = await Promise.all([
        gradeApi.list(),
        gradingApi.courses()
      ]);
      if (gradesRes.success) setGrades(gradesRes.data || []);
      if (coursesRes.success) setCourses(coursesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await gradeApi.export(courseFilter);
      if (res.success && res.data) {
        const url = URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `grades_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  const filtered = grades.filter(g => {
    if (courseFilter && g.courseId !== courseFilter) return false;
    if (keyword && !((g as unknown as { studentName?: string }).studentName || '').includes(keyword)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">成绩管理</h2>
          <p className="text-sm text-slate-500 mt-1">共 {grades.length} 条成绩记录</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? '导出中...' : '导出成绩'}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索学生姓名..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={courseFilter || ''}
          onChange={(e) => setCourseFilter(e.target.value ? parseInt(e.target.value) : undefined)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="">全部课程</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">学生</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">课程</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">实验</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">成绩</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">版本</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(grade => (
              <tr key={grade.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {((grade as unknown as { studentName?: string }).studentName || 'S').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{(grade as unknown as { studentName?: string }).studentName}</p>
                      <p className="text-xs text-slate-400">{(grade as unknown as { studentNumber?: string }).studentNumber}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{(grade as unknown as { courseName?: string }).courseName}</td>
                <td className="px-6 py-4 text-slate-600">{(grade as unknown as { experimentTitle?: string }).experimentTitle}</td>
                <td className="px-6 py-4">
                  <span className={`font-semibold ${
                    grade.totalScore >= 90 ? 'text-green-600' :
                    grade.totalScore >= 60 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {grade.totalScore}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">v{grade.gradingVersion}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(grade.archivedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">暂无成绩记录</div>
        )}
      </div>
    </div>
  );
};

export default Grades;
