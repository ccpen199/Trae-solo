import React, { useState, useMemo } from 'react';
import {
  Bell,
  AlertCircle,
  Briefcase,
  FileText,
  Settings,
  Check,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Inbox,
  ExternalLink,
  Clock,
  Tag,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockMessages } from '@/mock/data';
import { formatDateTime, getStatusText } from '@/utils/format';
import type { Message } from '@/types';

type MessageCategory = 'all' | 'system' | 'business' | 'warning' | 'policy';

interface CategoryItem {
  key: MessageCategory;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [activeCategory, setActiveCategory] = useState<MessageCategory>('all');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(mockMessages[0]?.id || null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const categories: CategoryItem[] = [
    { key: 'all', label: '全部消息', icon: Inbox, color: 'text-primary-500', bgColor: 'bg-primary-50' },
    { key: 'system', label: '系统通知', icon: Settings, color: 'text-neutral-500', bgColor: 'bg-neutral-100' },
    { key: 'business', label: '业务通知', icon: Briefcase, color: 'text-primary-500', bgColor: 'bg-primary-100' },
    { key: 'warning', label: '预警提醒', icon: AlertCircle, color: 'text-warning-500', bgColor: 'bg-warning-500/10' },
    { key: 'policy', label: '政策推送', icon: FileText, color: 'text-secondary-500', bgColor: 'bg-secondary-500/10' },
  ];

  const filteredMessages = useMemo(() => {
    if (activeCategory === 'all') return messages;
    return messages.filter((msg) => msg.type === activeCategory);
  }, [messages, activeCategory]);

  const unreadCounts = useMemo(() => {
    const counts: Record<MessageCategory, number> = {
      all: 0,
      system: 0,
      business: 0,
      warning: 0,
      policy: 0,
    };
    messages.forEach((msg) => {
      if (!msg.isRead) {
        counts.all++;
        counts[msg.type as MessageCategory]++;
      }
    });
    return counts;
  }, [messages]);

  const selectedMessage = useMemo(() => {
    return messages.find((msg) => msg.id === selectedMessageId) || null;
  }, [messages, selectedMessageId]);

  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMessages.slice(start, start + pageSize);
  }, [filteredMessages, currentPage]);

  const totalPages = Math.ceil(filteredMessages.length / pageSize);

  const handleSelectMessage = (id: string) => {
    setSelectedMessageId(id);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isRead: true } : msg))
    );
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMarkAllRead = () => {
    setMessages((prev) =>
      prev.map((msg) =>
        filteredMessages.find((m) => m.id === msg.id) ? { ...msg, isRead: true } : msg
      )
    );
  };

  const handleDeleteSelected = () => {
    setMessages((prev) => prev.filter((msg) => !selectedIds.has(msg.id)));
    setSelectedIds(new Set());
    if (selectedMessageId && selectedIds.has(selectedMessageId)) {
      const remaining = filteredMessages.filter((m) => !selectedIds.has(m.id));
      setSelectedMessageId(remaining[0]?.id || null);
    }
  };

  const handleDeleteCurrent = () => {
    if (!selectedMessageId) return;
    const currentIndex = filteredMessages.findIndex((m) => m.id === selectedMessageId);
    const nextMessage = filteredMessages[currentIndex + 1] || filteredMessages[currentIndex - 1];
    setMessages((prev) => prev.filter((msg) => msg.id !== selectedMessageId));
    setSelectedMessageId(nextMessage?.id || null);
  };

  const handlePrevMessage = () => {
    if (!selectedMessageId) return;
    const currentIndex = filteredMessages.findIndex((m) => m.id === selectedMessageId);
    if (currentIndex > 0) {
      handleSelectMessage(filteredMessages[currentIndex - 1].id);
    }
  };

  const handleNextMessage = () => {
    if (!selectedMessageId) return;
    const currentIndex = filteredMessages.findIndex((m) => m.id === selectedMessageId);
    if (currentIndex < filteredMessages.length - 1) {
      handleSelectMessage(filteredMessages[currentIndex + 1].id);
    }
  };

  const getTypeInfo = (type: string) => {
    const map: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
      system: { label: '系统通知', color: 'text-neutral-500', bgColor: 'bg-neutral-100', icon: Settings },
      business: { label: '业务通知', color: 'text-primary-500', bgColor: 'bg-primary-100', icon: Briefcase },
      warning: { label: '预警提醒', color: 'text-warning-500', bgColor: 'bg-warning-500/10', icon: AlertCircle },
      policy: { label: '政策推送', color: 'text-secondary-500', bgColor: 'bg-secondary-500/10', icon: FileText },
    };
    return map[type] || map.system;
  };

  const currentIndex = selectedMessageId
    ? filteredMessages.findIndex((m) => m.id === selectedMessageId)
    : -1;

  return (
    <div className="animate-fade-in h-[calc(100vh-120px)] flex gap-4 p-4">
      {/* 左侧分类栏 */}
      <div className="w-56 flex-shrink-0 animate-fade-in-left">
        <Card padding="sm" className="h-full">
          <div className="p-3 border-b border-neutral-100">
            <h2 className="font-semibold text-neutral-600 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-500" />
              消息中心
            </h2>
          </div>
          <div className="py-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.key;
              const unread = unreadCounts[category.key];
              return (
                <div
                  key={category.key}
                  onClick={() => {
                    setActiveCategory(category.key);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 mx-2 my-0.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive
                      ? `${category.bgColor} ${category.color} font-medium`
                      : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{category.label}</span>
                  </div>
                  {unread > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/80 text-current'
                          : 'bg-primary-500 text-white'
                      }`}
                    >
                      {unread}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 中部消息列表 */}
      <div className="flex-1 flex flex-col min-w-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
          {/* 工具栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<Check className="w-4 h-4" />}
                onClick={handleMarkAllRead}
              >
                全部已读
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
              >
                删除选中
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">
                共 {filteredMessages.length} 条
              </span>
              <Button variant="ghost" size="sm" icon={<Filter className="w-4 h-4" />}>
                筛选
              </Button>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto">
            {paginatedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <Inbox className="w-12 h-12 text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-400">暂无消息</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {paginatedMessages.map((msg, index) => {
                  const typeInfo = getTypeInfo(msg.type);
                  const TypeIcon = typeInfo.icon;
                  const isSelected = selectedMessageId === msg.id;
                  const isChecked = selectedIds.has(msg.id);
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg.id)}
                      className={`relative px-4 py-3 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary-50/70 border-l-2 border-l-primary-500'
                          : 'hover:bg-neutral-50 border-l-2 border-l-transparent'
                      } ${!msg.isRead ? 'bg-blue-50/30' : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          onClick={(e) => handleToggleSelect(msg.id, e)}
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-neutral-300 hover:border-primary-400'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.bgColor} ${typeInfo.color}`}
                        >
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`text-sm truncate ${
                                msg.isRead ? 'text-neutral-400 font-normal' : 'text-neutral-600 font-medium'
                              }`}
                            >
                              {msg.title}
                            </h3>
                            {!msg.isRead && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 line-clamp-1 mb-1.5">
                            {msg.content}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-neutral-300">
                            <Clock className="w-3 h-3" />
                            <span>{formatDateTime(msg.createTime, 'MM-DD HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 分页器 */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
              <span className="text-xs text-neutral-400">
                第 {currentPage} / {totalPages} 页
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0 min-w-0"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 右侧消息详情 */}
      <div className="w-96 flex-shrink-0 animate-fade-in-right" style={{ animationDelay: '0.2s' }}>
        <Card padding="none" className="h-full flex flex-col overflow-hidden">
          {selectedMessage ? (
            <>
              {/* 详情头部 */}
              <div className="px-4 py-3 border-b border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const typeInfo = getTypeInfo(selectedMessage.type);
                      const TypeIcon = typeInfo.icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${typeInfo.bgColor} ${typeInfo.color}`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          {typeInfo.label}
                        </span>
                      );
                    })()}
                    {!selectedMessage.isRead && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500">
                        未读
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400">
                    {formatDateTime(selectedMessage.createTime)}
                  </span>
                </div>
                <h3 className="font-semibold text-neutral-600 text-base">
                  {selectedMessage.title}
                </h3>
              </div>

              {/* 消息正文 */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-sm text-neutral-500 leading-relaxed">
                  {selectedMessage.content}
                </div>

                {/* 相关业务链接 */}
                {selectedMessage.relatedBusinessId && (
                  <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-neutral-400 mb-2">
                      <Tag className="w-3 h-3" />
                      相关业务
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        {getStatusText(selectedMessage.relatedBusinessType || '')}
                      </span>
                      <button className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1">
                        查看详情
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 操作栏 */}
              <div className="px-4 py-3 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-neutral-400">
                    {currentIndex + 1} / {filteredMessages.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevMessage}
                      disabled={currentIndex === 0}
                      className="w-8 h-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextMessage}
                      disabled={currentIndex === filteredMessages.length - 1}
                      className="w-8 h-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Check className="w-4 h-4" />}
                    className="flex-1"
                    onClick={() => {
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === selectedMessageId ? { ...msg, isRead: true } : msg
                        )
                      );
                    }}
                    disabled={selectedMessage.isRead}
                  >
                    {selectedMessage.isRead ? '已读' : '标记已读'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    className="flex-1"
                    onClick={handleDeleteCurrent}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <Inbox className="w-16 h-16 text-neutral-200 mb-4" />
              <p className="text-sm text-neutral-400">请选择一条消息查看详情</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;
