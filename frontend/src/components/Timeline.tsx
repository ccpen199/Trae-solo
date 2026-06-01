import type { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
}

const eventTypeColors: Record<string, string> = {
  create: 'bg-green-500',
  update: 'bg-blue-500',
  delete: 'bg-red-500',
  scan: 'bg-orange-500',
  alert: 'bg-red-500',
  change: 'bg-purple-500',
  default: 'bg-gray-500',
};

export default function Timeline({ events }: TimelineProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-8">暂无时间线数据</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          {events.map((event, index) => {
            const color = eventTypeColors[event.type] || eventTypeColors.default;
            const isLast = index === events.length - 1;
            return (
              <div key={event.id} className="relative pl-10 pb-6">
                <div
                  className={`absolute left-2 w-5 h-5 rounded-full ${color} border-4 border-white shadow`}
                />
                {!isLast && (
                  <div className="absolute left-4 top-5 w-0.5 h-full bg-gray-200" />
                )}
                <div className="card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{event.action}</p>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                  {event.user && (
                    <div className="mt-2 text-sm text-gray-500">
                      操作者: {event.user.username}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
