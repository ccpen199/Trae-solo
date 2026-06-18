import { Link } from 'react-router-dom';
import { mockScholarships } from '@/mock/scholarships';
import { ScholarshipStatus } from '@/constants/enums';
import dayjs from 'dayjs';

export default function ProjectList() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-surface-900">奖学金项目</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockScholarships.map((project) => (
          <Link key={project.id} to={`/scholarship/projects/${project.id}`} className="card card-hover p-5 space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-surface-900">{project.name}</h3>
              <span className={`status-badge ${ScholarshipStatus[project.status as keyof typeof ScholarshipStatus]?.color}`}>
                {ScholarshipStatus[project.status as keyof typeof ScholarshipStatus]?.label}
              </span>
            </div>
            <p className="text-sm text-surface-500">{project.donorName}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-accent-600 font-semibold">¥{project.amount}/人</span>
              <span className="text-surface-400">名额 {project.slots}</span>
            </div>
            <p className="text-xs text-surface-400">截止: {dayjs(project.applicationDeadline).format('YYYY-MM-DD')}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
