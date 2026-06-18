import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, MapPin, Calendar, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockActivities } from '@/mock/activities';
import { ActivityStatus } from '@/constants/enums';
import { useAuthStore } from '@/store/useAuthStore';
import dayjs from 'dayjs';

const statusTabs = [
  { key: 'all', label: '全部' },
  ...Object.entries(ActivityStatus).map(([key, val]) => ({ key, label: val.label })),
];

export default function ActivityList() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();

  const filtered = mockActivities.filter((a) => {
    const matchFilter = activeFilter === 'all' || a.status === activeFilter;
    const matchSearch = a.title.includes(search) || a.organizer.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">实践活动</h1>
        {(user?.role === 'school_admin' || user?.role === 'department_admin') && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            发布活动
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.key
                  ? 'bg-primary-800 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="搜索活动..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={`/activities/${activity.id}`} className="block card card-hover overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-primary-100 to-accent-100 relative">
                {activity.coverImage ? (
                  <img src={activity.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Calendar className="w-12 h-12 text-primary-300" />
                  </div>
                )}
                <span className={`status-badge absolute top-3 right-3 ${ActivityStatus[activity.status as keyof typeof ActivityStatus]?.color}`}>
                  {ActivityStatus[activity.status as keyof typeof ActivityStatus]?.label}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-surface-900 line-clamp-2">{activity.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-surface-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activity.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {dayjs(activity.startTime).format('MM/DD')}-{dayjs(activity.endTime).format('MM/DD')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-surface-500">
                    <Users className="w-3 h-3" />
                    {activity.registeredCount}/{activity.maxParticipants}
                  </span>
                  <span className="status-badge bg-accent-100 text-accent-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.creditStandard}学分
                  </span>
                </div>
                <span className="text-xs text-surface-400">{activity.organizer}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-surface-400">暂无符合条件的活动</div>
      )}
    </div>
  );
}
