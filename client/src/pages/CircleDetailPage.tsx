import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { circleCategoryLabels } from '../utils/constants';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';
import { useAuthStore } from '../stores/authStore';
import type { Circle, Activity } from '@/types/shared';

export default function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchCircle();
    fetchActivities();
  }, [id]);

  const fetchCircle = async () => {
    try {
      const res = await api.get(`/circles/${id}`);
      setCircle(res.data.data);
    } catch (error) {
      console.error('Failed to fetch circle:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities', {
        params: { circleId: id, pageSize: 5 },
      });
      setActivities(res.data.data.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
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
      if (circle?.isJoined) {
        await api.post(`/circles/${id}/leave`);
        setCircle((prev) => prev ? { ...prev, isJoined: false, memberCount: prev.memberCount - 1 } : null);
      } else {
        await api.post(`/circles/${id}/join`);
        setCircle((prev) => prev ? { ...prev, isJoined: true, memberCount: prev.memberCount + 1 } : null);
      }
    } catch (error) {
      console.error('Failed to join circle:', error);
    } finally {
      setJoining(false);
    }
  };

  if (loading || !circle) {
    return (
      <div className="py-12">
        <Loading text="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-48 rounded-xl overflow-hidden mb-6">
        <img
          src={circle.coverImage}
          alt={circle.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end gap-4">
            <Avatar src={circle.avatar} alt={circle.name} size="xl" className="border-4 border-white" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{circle.name}</h1>
              <div className="flex items-center gap-3 text-white/80 text-sm">
                <span>{circle.memberCount} 成员</span>
                <span>{circle.postCount} 帖子</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  {circleCategoryLabels[circle.category as keyof typeof circleCategoryLabels]}
                </span>
              </div>
            </div>
            <Button
              variant={circle.isJoined ? 'secondary' : 'primary'}
              onClick={handleJoin}
              loading={joining}
            >
              {circle.isJoined ? '已加入' : '+ 加入圈子'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-800 mb-3">圈子介绍</h2>
            <p className="text-gray-600">{circle.description}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">近期活动</h2>
              <Link to="/activities" className="text-sm text-primary-600 hover:underline">查看全部</Link>
            </div>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无活动
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <Link key={activity.id} to={`/activity/${activity.id}`}>
                    <div className="flex gap-4 p-3 rounded-lg hover:bg-gray-50">
                      <img
                        src={activity.coverImage}
                        alt={activity.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">{activity.title}</h4>
                        <p className="text-sm text-gray-500">
                          🕐 {new Date(activity.startTime).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          👥 {activity.participantCount}/{activity.maxParticipants} 人报名
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">圈子管理</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">发布帖子</Button>
              <Button variant="outline" className="w-full">发起活动</Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">活跃成员</h3>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Avatar
                  key={i}
                  src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20${i}&image_size=square`}
                  alt=""
                  size="md"
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
