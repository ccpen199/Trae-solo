import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyApplications } from '@/api/jobs';
import type { JobApplication, Job } from '@/types';

const appStatusLabel: Record<string, string> = { applied: '已申请', accepted: '已接受', rejected: '已拒绝', completed: '已完成' };
const appStatusColor: Record<string, string> = { applied: 'badge-blue', accepted: 'badge-green', rejected: 'badge-red', completed: 'badge-gray' };

interface AppWithJob extends JobApplication {
  job?: Job;
}

export default function MyApplications() {
  const [applications, setApplications] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyApps = async () => {
      try {
        const appsWithJobs = await getMyApplications();
        setApplications(appsWithJobs);
      } finally {
        setLoading(false);
      }
    };

    fetchMyApps();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96 text-slate-400">加载中...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">我的申请</h1>

      {applications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-slate-400 mb-4">您还没有申请过任何岗位</p>
          <Link to="/jobs" className="btn-primary text-sm">浏览岗位</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Link to={`/jobs/${app.job_id}`} className="font-semibold text-slate-800 hover:text-brand-500 transition-colors">
                    {app.job?.title || `岗位 #${app.job_id}`}
                  </Link>
                  <p className="text-sm text-slate-400 mt-1">
                    {app.job?.location && <span>{app.job.location} · </span>}
                    申请时间: {app.created_at}
                  </p>
                  {app.cover_letter && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{app.cover_letter}</p>
                  )}
                </div>
                <span className={appStatusColor[app.status]}>{appStatusLabel[app.status]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
