import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Eye, Edit2, XCircle, Users, MapPin, Clock, Briefcase } from 'lucide-react';
import { mockJobs } from '@/mock/data';
import type { Job, JobStatus, EmploymentType } from '@/types';

export default function JobList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EmploymentType | 'all'>('all');

  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesType = typeFilter === 'all' || job.employmentType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusBadge: Record<JobStatus, string> = {
    active: 'bg-spruce-100 text-spruce-700',
    closed: 'bg-ash-100 text-ash-600',
    draft: 'bg-sand-100 text-sand-700',
  };

  const statusLabel: Record<JobStatus, string> = {
    active: '招聘中',
    closed: '已关闭',
    draft: '草稿',
  };

  const typeLabel: Record<EmploymentType, string> = {
    fulltime: '全职',
    parttime: '兼职',
    project: '项目制',
  };

  const typeBadge: Record<EmploymentType, string> = {
    fulltime: 'bg-terracotta-100 text-terracotta-700',
    parttime: 'bg-spruce-100 text-spruce-700',
    project: 'bg-sand-100 text-sand-700',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索职位名称..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
            className="input-field w-40"
          >
            <option value="all">全部状态</option>
            <option value="active">招聘中</option>
            <option value="closed">已关闭</option>
            <option value="draft">草稿</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EmploymentType | 'all')}
            className="input-field w-40"
          >
            <option value="all">全部用工</option>
            <option value="fulltime">全职</option>
            <option value="parttime">兼职</option>
            <option value="project">项目制</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={16} />
            更多筛选
          </button>
        </div>
        <button onClick={() => navigate('/enterprise/jobs/create')} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          发布新职位
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '招聘中', value: mockJobs.filter((j) => j.status === 'active').length, color: 'text-spruce-500' },
          { label: '总投递', value: mockJobs.reduce((s, j) => s + j.applicationsCount, 0), color: 'text-terracotta-500' },
          { label: '已关闭', value: mockJobs.filter((j) => j.status === 'closed').length, color: 'text-ash-500' },
          { label: '草稿', value: mockJobs.filter((j) => j.status === 'draft').length, color: 'text-sand-500' },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-ash-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 font-serif ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-ash-50">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">职位信息</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">薪资范围</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">用工性质</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">工作地点</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">投递人数</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">状态</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">发布时间</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-ash-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ash-100">
            {filteredJobs.map((job) => (
              <tr key={job.id} className="hover:bg-ash-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-ash-700">{job.title}</p>
                  <p className="text-xs text-ash-400 flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    到岗时间：{job.arrivalTime}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-terracotta-600 font-semibold">
                    {job.salaryMin / 1000}K-{job.salaryMax / 1000}K
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${typeBadge[job.employmentType]}`}>
                    {typeLabel[job.employmentType]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-ash-600 flex items-center gap-1">
                    <MapPin size={14} className="text-ash-400" />
                    {job.location}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-ash-700 flex items-center gap-1">
                    <Users size={14} className="text-ash-400" />
                    {job.applicationsCount} 人
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${statusBadge[job.status]}`}>
                    {statusLabel[job.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-ash-500">{job.createdAt}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/enterprise/jobs/${job.id}`)}
                      className="p-2 hover:bg-ash-100 rounded-lg transition-colors text-ash-500 hover:text-ash-700"
                      title="查看详情"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="p-2 hover:bg-ash-100 rounded-lg transition-colors text-ash-500 hover:text-ash-700"
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    {job.status === 'active' && (
                      <button
                        className="p-2 hover:bg-terracotta-50 rounded-lg transition-colors text-ash-500 hover:text-terracotta-600"
                        title="关闭职位"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    <button className="p-2 hover:bg-ash-100 rounded-lg transition-colors text-ash-500 hover:text-ash-700">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
