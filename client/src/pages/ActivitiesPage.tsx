import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { activityStatusLabels } from '../utils/constants';
import { formatDate } from '../utils/format';
import Card from '../components/Card';
import Button from '../components/Button';
import Tag from '../components/Tag';
import Loading from '../components/Loading';
import type { Activity } from '@/types/shared';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activities', {
        params: {
          status: activeStatus || undefined,
          pageSize: 20,
        },
      });
      setActivities(res.data.data.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activeStatus]);

  const statusTabs = [
    { key: '', label: '全部' },
    { key: 'upcoming', label: '即将开始' },
    { key: 'ongoing', label: '进行中' },
    { key: 'ended', label: '已结束' },
  ];

  const statusColorMap: Record<string, 'primary' | 'success' | 'warning' | 'secondary'> = {
    upcoming: 'primary',
    ongoing: 'success',
    ended: 'secondary',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">同城活动</h1>
        <Button>+ 发起活动</Button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeStatus === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12">
          <Loading text="加载中..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => (
            <Card key={activity.id} hoverable className="overflow-hidden">
              <Link to={`/activity/${activity.id}`}>
                <div className="h-40 relative">
                  <img
                    src={activity.coverImage}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Tag color={statusColorMap[activity.status] || 'secondary'}>
                      {activityStatusLabels[activity.status]}
                    </Tag>
                  </div>
                  {activity.fee > 0 && (
                    <div className="absolute top-3 right-3 bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium">
                      ¥{activity.fee}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">
                    {activity.title}
                  </h3>
                  {activity.circle && (
                    <p className="text-xs text-gray-500 mb-2">
                      来自：{activity.circle.name}
                    </p>
                  )}
                  <div className="space-y-1 text-sm text-gray-500">
                    <p>🕐 {formatDate(activity.startTime)}</p>
                    {activity.location && (
                      <p className="truncate">📍 {activity.location.district}</p>
                    )}
                    <p>👥 {activity.participantCount}/{activity.maxParticipants} 人报名</p>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full"
                        style={{ width: `${(activity.participantCount / activity.maxParticipants) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
