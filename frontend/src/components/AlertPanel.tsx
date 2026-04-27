import React from 'react';
import { useAppStore } from '../store/appStore';
import { Alert } from '../types';
import { webSocketService } from '../services/webSocketService';

const getAlertLevelColor = (level: Alert['level']): string => {
  switch (level) {
    case 'red':
      return 'bg-red-50 border-red-300 text-red-800';
    case 'orange':
      return 'bg-orange-50 border-orange-300 text-orange-800';
    case 'blue':
      return 'bg-blue-50 border-blue-300 text-blue-800';
    default:
      return 'bg-gray-50 border-gray-300 text-gray-800';
  }
};

const getAlertLevelBadge = (level: Alert['level']): string => {
  switch (level) {
    case 'red':
      return 'bg-red-500 text-white';
    case 'orange':
      return 'bg-orange-500 text-white';
    case 'blue':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getAlertLevelLabel = (level: Alert['level']): string => {
  switch (level) {
    case 'red':
      return '紧急';
    case 'orange':
      return '警告';
    case 'blue':
      return '信息';
    default:
      return '未知';
  }
};

const getAlertStatusColor = (status: Alert['status']): string => {
  switch (status) {
    case 'active':
      return 'text-red-600';
    case 'acknowledged':
      return 'text-yellow-600';
    case 'resolved':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

const getAlertStatusLabel = (status: Alert['status']): string => {
  switch (status) {
    case 'active':
      return '未确认';
    case 'acknowledged':
      return '已确认';
    case 'resolved':
      return '已解决';
    default:
      return '未知';
  }
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
};

export const AlertPanel: React.FC = () => {
  const alerts = useAppStore((state) => state.alerts);
  const [filterStatus, setFilterStatus] = React.useState<Alert['status'] | 'all'>('all');
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  const filteredAlerts = filterStatus === 'all' 
    ? alerts 
    : alerts.filter(a => a.status === filterStatus);

  const handleAcknowledge = (alertId: string) => {
    webSocketService.acknowledgeAlert(alertId, '当前管理员');
  };

  const handleResolve = (alertId: string) => {
    webSocketService.resolveAlert(alertId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          预警中心
        </h3>
        
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
            未确认: {activeAlerts.length}
          </span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
            已确认: {acknowledgedAlerts.length}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
            已解决: {resolvedAlerts.length}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filterStatus === 'all' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部 ({alerts.length})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filterStatus === 'active' 
              ? 'bg-red-600 text-white' 
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          未确认 ({activeAlerts.length})
        </button>
        <button
          onClick={() => setFilterStatus('acknowledged')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filterStatus === 'acknowledged' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          }`}
        >
          已确认 ({acknowledgedAlerts.length})
        </button>
        <button
          onClick={() => setFilterStatus('resolved')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filterStatus === 'resolved' 
              ? 'bg-green-600 text-white' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          已解决 ({resolvedAlerts.length})
        </button>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
          暂无预警记录
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                getAlertLevelColor(alert.level)
              } ${
                selectedAlert?.id === alert.id ? 'ring-2 ring-gray-400' : ''
              }`}
              onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      getAlertLevelBadge(alert.level)
                    }`}>
                      {getAlertLevelLabel(alert.level)}
                    </span>
                    <span className={`text-xs font-medium ${getAlertStatusColor(alert.status)}`}>
                      {getAlertStatusLabel(alert.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(alert.createdAt)}
                    </span>
                  </div>
                  
                  <p className="font-medium mb-1">{alert.message}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>来源: {alert.source}</span>
                    <span>责任人: {alert.operator}</span>
                    {alert.acknowledgedBy && (
                      <span>确认人: {alert.acknowledgedBy}</span>
                    )}
                  </div>
                </div>

                {alert.status === 'active' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcknowledge(alert.id);
                      }}
                      className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
                    >
                      确认
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(alert.id);
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                    >
                      解决
                    </button>
                  </div>
                )}

                {alert.status === 'acknowledged' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolve(alert.id);
                    }}
                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors ml-4"
                  >
                    标记已解决
                  </button>
                )}
              </div>

              {selectedAlert?.id === alert.id && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">下一步动作:</span>
                      <p className="mt-1 p-2 bg-white/50 rounded">
                        {alert.nextAction}
                      </p>
                    </div>
                    
                    {alert.acknowledgedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>确认时间:</span>
                        <span>{formatTime(alert.acknowledgedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertPanel;
