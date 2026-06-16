import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { helpApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Card, Button, Avatar, Badge, EmptyState, Icon } from '../components/ui';
import type { HelpRequest, HelpResponse, Message } from '../types';
import {
  formatTime,
  formatDistance,
  formatDateTime,
  getHelpTypeColor,
  getHelpTypeLabel,
  getHelpStatusColor,
  getHelpStatusLabel,
} from '../utils/format';

const HelpDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, location } = useAuthStore();
  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [response, setResponse] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const res = await helpApi.getRequest(id!);
      setRequest(res.helpRequest);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !response.trim()) return;
    setSubmitting(true);
    try {
      await helpApi.respond(request!.id, response);
      setResponse('');
      await loadRequest();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    setSubmitting(true);
    try {
      await helpApi.sendMessage(request!.id, message);
      setMessage('');
      await loadRequest();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (responseId: string) => {
    if (!user || request?.userId !== user.id) return;
    if (!confirm('确认采纳该响应？采纳后求助状态将变为已解决')) return;
    try {
      await helpApi.accept(request!.id, responseId);
      await loadRequest();
      alert('✅ 已采纳，感谢邻里互助！');
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 animate-pulse">
          <div className="flex gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
          </div>
        </Card>
      </div>
    );
  }

  if (!request) {
    return <EmptyState icon="❌" title="求助信息不存在" />;
  }

  const isOwner = user?.id === request.userId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        <Icon name="back" /> 返回互助列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Detail */}
          <Card className={`p-6 md:p-8 ${request.type === 'EMERGENCY' ? 'border-2 border-red-200' : ''}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${getHelpTypeColor(request.type)} text-sm px-3 py-1`}>
                  {request.type === 'EMERGENCY' && '🚨 '}
                  {getHelpTypeLabel(request.type)}
                </Badge>
                <Badge className={`${getHelpStatusColor(request.status)} text-white text-sm px-3 py-1`}>
                  {getHelpStatusLabel(request.status)}
                </Badge>
                {request.urgency >= 2 && (
                  <Badge className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1">
                    ⚡ 紧急等级 {request.urgency}
                  </Badge>
                )}
              </div>
              {request.distance !== undefined && (
                <span className="text-primary-600 font-semibold">
                  📍 {formatDistance(request.distance)}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-5 leading-tight">
              {request.title}
            </h1>

            <div className="mt-4 flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <Avatar src={request.user.avatar} name={request.user.nickname} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{request.user.nickname}</span>
                  <Badge className="bg-blue-50 text-blue-600">
                    信用分 {request.user.creditScore}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  📍 {request.locationName} · {formatDateTime(request.createdAt)}
                  {request.closedAt && ` · 解决于 ${formatDateTime(request.closedAt)}`}
                </div>
              </div>
            </div>

            <div className="mt-6 p-5 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-xl border border-blue-100">
              <div className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                📝 详细描述
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {request.content}
              </p>
              {request.user.phone && (
                <div className="mt-4 pt-4 border-t border-blue-100 flex items-center gap-2 text-sm">
                  <span className="text-gray-500">联系方式：</span>
                  <span className="font-mono font-semibold text-blue-700">{request.user.phone}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Respond */}
          {request.status !== 'RESOLVED' && request.status !== 'CLOSED' && user && !isOwner && (
            <Card className="p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">💬</span> 我来帮TA
              </h3>
              <form onSubmit={handleRespond}>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="描述你能提供的帮助..."
                  rows={4}
                  className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <div className="flex justify-end mt-4">
                  <Button type="submit" disabled={submitting || !response.trim()}>
                    {submitting ? '提交中...' : '提交响应'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Responses */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-xl">🤝</span> 邻里响应 ({request.responses?.length || 0})
            </h3>
            {request.responses && request.responses.length > 0 ? (
              <div className="space-y-5">
                {request.responses.map((r: HelpResponse, i: number) => (
                  <div
                    key={r.id}
                    className={`p-5 rounded-xl border-2 relative overflow-hidden ${
                      r.isAccepted
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {r.isAccepted && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
                        ✅ 已采纳
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar src={r.user.avatar} name={r.user.nickname} />
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800">{r.user.nickname}</span>
                          <Badge className="bg-blue-50 text-blue-600">
                            信用 {r.user.creditScore}
                          </Badge>
                          <span className="text-xs text-gray-400">{formatTime(r.createdAt)}</span>
                        </div>
                        <p className="mt-3 text-gray-700 leading-relaxed">{r.content}</p>

                        {isOwner && !r.isAccepted && request.status !== 'RESOLVED' && (
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(r.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            >
                              ✅ 采纳此帮助
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🤝"
                title="还没有人响应"
                description={isOwner ? '耐心等待，好邻居正在赶来的路上' : '成为第一个伸出援手的人吧'}
              />
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Contact */}
          {user && request.status !== 'CLOSED' && (
            <Card className="p-5 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>💌</span> 私密沟通
              </h3>
              <div className="h-64 overflow-y-auto space-y-3 mb-4 pr-1">
                {request.messages?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    暂无消息
                  </div>
                ) : (
                  request.messages?.map((m: Message) => (
                    <div
                      key={m.id}
                      className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                          m.senderId === user.id
                            ? 'bg-primary-500 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {m.senderId !== user.id && (
                          <div className="text-xs text-gray-500 mb-1 font-medium">
                            {m.sender.nickname}
                          </div>
                        )}
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="发送消息..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <Button type="submit" size="sm" disabled={submitting || !message.trim()}>
                  发送
                </Button>
              </form>
            </Card>
          )}

          {/* Tips */}
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>💡</span> 互助小贴士
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span>✅</span> 见面交易请选择公共场所
              </li>
              <li className="flex gap-2">
                <span>✅</span> 涉及金钱请提高警惕
              </li>
              <li className="flex gap-2">
                <span>✅</span> 紧急情况请先拨打110/120
              </li>
              <li className="flex gap-2">
                <span>✅</span> 完成互助后互相评价
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HelpDetailPage;
