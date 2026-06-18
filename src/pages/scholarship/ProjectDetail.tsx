import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, Users, Calendar } from 'lucide-react';
import { mockScholarships } from '@/mock/scholarships';
import { ScholarshipStatus } from '@/constants/enums';
import dayjs from 'dayjs';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const project = mockScholarships.find((s) => s.id === id);

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-400">项目未找到</p>
        <Link to="/scholarship/projects" className="text-primary-600 hover:underline mt-2 inline-block">返回项目列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Link to="/scholarship/projects" className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" />
        返回项目列表
      </Link>
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-surface-900">{project.name}</h1>
          <span className={`status-badge ${ScholarshipStatus[project.status as keyof typeof ScholarshipStatus]?.color}`}>
            {ScholarshipStatus[project.status as keyof typeof ScholarshipStatus]?.label}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-accent-50 rounded-lg p-3 text-center">
            <DollarSign className="w-5 h-5 text-accent-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-accent-600">¥{project.amount}</p>
            <p className="text-xs text-surface-500">金额/人</p>
          </div>
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <Users className="w-5 h-5 text-primary-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-primary-700">{project.slots}</p>
            <p className="text-xs text-surface-500">名额</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3 text-center">
            <Calendar className="w-5 h-5 text-surface-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-surface-700">{dayjs(project.applicationDeadline).format('MM/DD')}</p>
            <p className="text-xs text-surface-500">截止日期</p>
          </div>
        </div>
        <p className="text-surface-600 leading-relaxed">{project.description}</p>
      </div>
      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold text-surface-900">申请条件</h2>
        <p className="text-sm text-surface-600 whitespace-pre-line leading-relaxed">{project.eligibility}</p>
      </div>
    </div>
  );
}
