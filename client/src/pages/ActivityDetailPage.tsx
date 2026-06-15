import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { activityStatusLabels } from '../utils/constants';
import { formatTime } from '../utils/format';
import Card from '../components/Card';
import Button from '../components/Button';
import Tag from '../components/Tag';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';
import { useAuthStore } from '../stores/authStore';
import type { Activity } from '@/types/shared';

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    try {
      const res = await api.get(`/activities/${id}`);
      setActivity(res.data.data);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setJoining(true);
    try {
      if (activity?.isParticipant) {
        await api.post(`/activities/${id}/leave`);
        setActivity((prev) => prev ? {
          ...prev,
          isParticipant: false,
          participantCount: prev.participantCount - 1,
        } : null);
      } else {
        await api.post(`/activities/${id}/join`);
        setActivity((prev) => prev ? {
          ...prev,
          isParticipant: true,
          participantCount: prev.participantCount + 1,
        } : null);
      }
    } catch (error) {
      console.error('Failed to join activity:', error);
    } finally {
      setJoining(false);
    }
  };

  if (loading || !activity) {
    return (
      <div className="py-12">
        <Loading text="加载中..." />
      </div>
    );
  }

  const isFull = activity.participantCount >= activity.maxParticipants;
  const isEnded = activity.status === 'ended';

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="overflow-hidden">
        <div className="h-56 relative">
          <img
            src={activity.coverImage}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <Tag color="primary" className="mb-2">
              {activityStatusLabels[activity.status]}
            </Tag>
            <h1 className="text-2xl font-bold text-white">{activity.title}</h1>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{activity.participantCount}</p>
              <p className="text-sm text-gray-500">已报名</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-2xl font-bold text-gray-800">{activity.maxParticipants}</p>
              <p className="text-sm text-gray-500">名额</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {activity.fee > 0 ? `¥${activity.fee}` : '免费'}
              </p>
              <p className="text-sm text-gray-500">费用</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-xl">🕐</span>
              <div>
                <p className="text-sm text-gray-500 mb-1">活动时间</p>
                <p className="text-gray-800">
                  {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                </p>
              </div>
            </div>

            {activity.location && (
              <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-sm text-gray-500 mb-1">活动地点</p>
                  <p className="text-gray-800">
                    {activity.location.district} · {activity.location.address}
                  </p>
                </div>
              </div>
            )}

            {activity.organizer && (
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <div className="flex items-center gap-2">
                  <Avatar src={activity.organizer.avatar} alt={activity.organizer.nickname} />
                  <span className="text-gray-800">{activity.organizer.nickname}</span>
                  <Tag color="secondary" size="sm">发起人</Tag>
                </div>
              </div>
            )}

            {activity.circle && (
              <div className="flex items-center gap-3">
                <span className="text-xl">👥</span>
                <p className="text-gray-800">{activity.circle.name}</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">活动介绍</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{activity.description}</p>
          </div>

          {activity.participants && activity.participants.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                已报名 ({activity.participants.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {activity.participants.slice(0, 10).map((p: any) => (
                  <Avatar
                    key={p.id}
                    src={p.avatar}
                    alt={p.nickname}
                    size="md"
                    className="cursor-pointer hover:ring-2 hover:ring-primary-300"
                  />
                ))}
                {activity.participants.length > 10 && (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                    +{activity.participants.length - 10}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="secondary" className="flex-1">分享活动</Button>
            <Button
              variant={activity.isParticipant ? 'outline' : 'primary'}
              onClick={handleJoin}
              loading={joining}
              disabled={isFull || isEnded}
              className="flex-1"
            >
              {isEnded ? '活动已结束' : activity.isParticipant ? '取消报名' : isFull ? '名额已满' : '立即报名'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
