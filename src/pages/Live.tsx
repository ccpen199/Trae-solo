import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  Calendar,
  Clock,
  User,
  CheckCircle,
  ArrowLeft,
  Play,
  Users,
  Tag,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { live } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { LiveSession, LiveReservation, User as UserType } from '../../shared/types';

const mockExperts: UserType[] = [
  {
    id: 101,
    phone: '13800000101',
    role: 'expert',
    name: '张教授',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expert1',
    expertCertified: true,
    createdAt: '2024-01-01',
  },
  {
    id: 102,
    phone: '13800000102',
    role: 'expert',
    name: '李老师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expert2',
    expertCertified: true,
    createdAt: '2024-01-01',
  },
  {
    id: 103,
    phone: '13800000103',
    role: 'expert',
    name: '王老师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expert3',
    expertCertified: true,
    createdAt: '2024-01-01',
  },
];

const mockUpcomingSessions: (LiveSession & { expert: UserType; reservationCount: number })[] = [
  {
    id: 1,
    expertId: 101,
    title: '2024高考志愿填报政策解读',
    description: '详细解读2024年各省市高考志愿填报政策变化，重点分析平行志愿、梯度志愿的填报技巧，帮助考生和家长准确把握政策要点。',
    scheduledAt: '2024-06-15T19:00:00',
    duration: 120,
    status: 'scheduled',
    createdAt: '2024-06-01',
    expert: mockExperts[0],
    reservationCount: 1256,
  },
  {
    id: 2,
    expertId: 102,
    title: '冲稳保梯度设置策略',
    description: '如何科学设置冲、稳、保三个梯度的志愿比例，根据分数和位次精准定位院校，最大化录取机会。',
    scheduledAt: '2024-06-16T14:00:00',
    duration: 90,
    status: 'scheduled',
    createdAt: '2024-06-02',
    expert: mockExperts[1],
    reservationCount: 892,
  },
  {
    id: 3,
    expertId: 103,
    title: '专业选择与职业规划',
    description: '结合霍兰德职业兴趣测评和MBTI性格分析，帮助考生找到最适合自己的专业方向，规划未来职业发展路径。',
    scheduledAt: '2024-06-17T19:30:00',
    duration: 150,
    status: 'live',
    streamUrl: 'https://example.com/live/3',
    createdAt: '2024-06-03',
    expert: mockExperts[2],
    reservationCount: 2341,
  },
  {
    id: 4,
    expertId: 101,
    title: '985/211院校报考指南',
    description: '全国重点大学历年投档线分析，热门专业录取规律，帮助高分考生冲击理想院校。',
    scheduledAt: '2024-06-18T20:00:00',
    duration: 120,
    status: 'scheduled',
    createdAt: '2024-06-04',
    expert: mockExperts[0],
    reservationCount: 1567,
  },
];

const mockReservations: (LiveReservation & { session: LiveSession & { expert: UserType } })[] = [
  {
    id: 1,
    sessionId: 1,
    userId: 1,
    createdAt: '2024-06-10',
    session: mockUpcomingSessions[0],
  },
  {
    id: 2,
    sessionId: 3,
    userId: 1,
    createdAt: '2024-06-12',
    session: mockUpcomingSessions[2],
  },
];

export default function Live() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'my'>('upcoming');
  const [upcomingSessions, setUpcomingSessions] = useState(mockUpcomingSessions);
  const [myReservations, setMyReservations] = useState(mockReservations);
  const [selectedSession, setSelectedSession] = useState<(LiveSession & { expert: UserType; reservationCount: number }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      const session = mockUpcomingSessions.find(s => s.id === Number(id));
      if (session) {
        setSelectedSession(session);
      }
    }
  }, [id]);

  const handleReserve = async (sessionId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setReservingId(sessionId);
      await live.reserve(sessionId);
      setMyReservations(prev => [
        ...prev,
        {
          id: Date.now(),
          sessionId,
          userId: 1,
          createdAt: new Date().toISOString(),
          session: mockUpcomingSessions.find(s => s.id === sessionId)!,
        },
      ]);
      setUpcomingSessions(prev =>
        prev.map(s =>
          s.id === sessionId ? { ...s, reservationCount: s.reservationCount + 1 } : s
        )
      );
      alert('预约成功！直播开始前会提醒您。');
    } catch (error) {
      alert('预约失败，请稍后重试');
    } finally {
      setReservingId(null);
    }
  };

  const isReserved = (sessionId: number) => {
    return myReservations.some(r => r.sessionId === sessionId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            直播中
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Calendar className="w-3 h-3" />
            即将开始
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            已结束
          </span>
        );
      default:
        return null;
    }
  };

  if (selectedSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <button
              onClick={() => {
                setSelectedSession(null);
                navigate('/live');
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回直播列表
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl aspect-video flex items-center justify-center relative overflow-hidden">
                {selectedSession.status === 'live' ? (
                  <div className="text-center">
                    <Play className="w-20 h-20 text-red-500 mx-auto mb-4" />
                    <p className="text-white text-xl font-medium">点击进入直播间</p>
                    <a
                      href={selectedSession.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors"
                    >
                      <Video className="w-5 h-5" />
                      观看直播
                    </a>
                  </div>
                ) : (
                  <div className="text-center">
                    <Video className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 text-xl font-medium">直播尚未开始</p>
                    <p className="text-gray-400 mt-2">
                      {formatDate(selectedSession.scheduledAt)} {formatTime(selectedSession.scheduledAt)}
                    </p>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  {getStatusBadge(selectedSession.status)}
                </div>
              </div>

              <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">{selectedSession.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-gray-600">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedSession.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTime(selectedSession.scheduledAt)} · {selectedSession.duration}分钟
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {selectedSession.reservationCount}人已预约
                  </span>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">直播简介</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedSession.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">主讲专家</h3>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedSession.expert.avatar}
                    alt={selectedSession.expert.name}
                    className="w-16 h-16 rounded-full bg-gray-100"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{selectedSession.expert.name}</span>
                      {selectedSession.expert.expertCertified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500">资深志愿填报专家</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  拥有15年高考志愿填报指导经验，帮助数千名考生成功录取理想院校。
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                {selectedSession.status === 'live' ? (
                  <button
                    className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                    onClick={() => window.open(selectedSession.streamUrl, '_blank')}
                  >
                    <Play className="w-5 h-5" />
                    立即观看
                  </button>
                ) : isReserved(selectedSession.id) ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">已预约</p>
                    <p className="text-sm text-gray-500 mt-1">直播开始前会提醒您</p>
                  </div>
                ) : (
                  <button
                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    onClick={() => handleReserve(selectedSession.id)}
                    disabled={reservingId === selectedSession.id}
                  >
                    {reservingId === selectedSession.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Calendar className="w-5 h-5" />
                    )}
                    预约直播
                  </button>
                )}
              </div>

              <div className="bg-yellow-50 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">温馨提示</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      请提前10分钟进入直播间，准备好您的问题，专家会在互动环节为您解答。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Video className="w-10 h-10" />
            <h1 className="text-3xl font-bold">直播答疑</h1>
          </div>
          <p className="text-blue-100 text-lg">
            资深志愿填报专家在线直播，为您解答志愿填报中的各种疑问
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8 border-b">
          <button
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'upcoming'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            即将开始
          </button>
          <button
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'my'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('my')}
          >
            我的预约
            {myReservations.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                {myReservations.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center relative">
                      <Video className="w-12 h-12 text-white" />
                      <div className="absolute top-2 left-2">
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedSession(session);
                        navigate(`/live/${session.id}`);
                      }}
                    >
                      {session.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(session.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {session.duration}分钟
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {session.reservationCount}人预约
                      </span>
                    </div>
                    <p className="mt-3 text-gray-600 line-clamp-2">{session.description}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <img
                        src={session.expert.avatar}
                        alt={session.expert.name}
                        className="w-8 h-8 rounded-full bg-gray-100"
                      />
                      <span className="text-sm text-gray-600">
                        {session.expert.name}
                        {session.expert.expertCertified && (
                          <CheckCircle className="w-4 h-4 text-blue-500 inline ml-1" />
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-3">
                    {session.status === 'live' ? (
                      <button
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                        onClick={() => window.open(session.streamUrl, '_blank')}
                      >
                        <Play className="w-4 h-4" />
                        观看直播
                      </button>
                    ) : isReserved(session.id) ? (
                      <div className="px-6 py-3 bg-green-50 text-green-700 rounded-xl font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        已预约
                      </div>
                    ) : (
                      <button
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        onClick={() => handleReserve(session.id)}
                        disabled={reservingId === session.id}
                      >
                        {reservingId === session.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                        预约
                      </button>
                    )}
                    <button
                      className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors"
                      onClick={() => {
                        setSelectedSession(session);
                        navigate(`/live/${session.id}`);
                      }}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'my' && (
          <div>
            {myReservations.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">暂无预约</p>
                <button
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  onClick={() => setActiveTab('upcoming')}
                >
                  去预约直播
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h4
                            className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => {
                              const session = mockUpcomingSessions.find(
                                s => s.id === reservation.sessionId
                              );
                              if (session) {
                                setSelectedSession(session);
                                navigate(`/live/${session.id}`);
                              }
                            }}
                          >
                            {reservation.session.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(reservation.session.scheduledAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(reservation.session.scheduledAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(reservation.session.status)}
                        <button
                          className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                          onClick={() => {
                            const session = mockUpcomingSessions.find(
                              s => s.id === reservation.sessionId
                            );
                            if (session) {
                              setSelectedSession(session);
                              navigate(`/live/${session.id}`);
                            }
                          }}
                        >
                          查看
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
