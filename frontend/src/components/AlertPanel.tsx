import React from 'react';
import { useAppStore } from '../store/appStore';
import { Alert } from '../types';
import { webSocketService } from '../services/webSocketService';
import { Bell, AlertTriangle, Info, CheckCircle, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';

const getAlertLevelStyle = (level: Alert['level']): { bg: string; border: string; text: string; badge: string; icon: React.ElementType } => {
  switch (level) {
    case 'red':
      return { 
        bg: 'bg-red-50', 
        border: 'border-red-200', 
        text: 'text-red-800', 
        badge: 'bg-red-500',
        icon: AlertTriangle 
      };
    case 'orange':
      return { 
        bg: 'bg-orange-50', 
        border: 'border-orange-200', 
        text: 'text-orange-800', 
        badge: 'bg-orange-500',
        icon: Bell 
      };
    case 'blue':
      return { 
        bg: 'bg-blue-50', 
        border: 'border-blue-200', 
        text: 'text-blue-800', 
        badge: 'bg-blue-500',
        icon: Info 
      };
    default:
      return { 
        bg: 'bg-gray-50', 
        border: 'border-gray-200', 
        text: 'text-gray-800', 
        badge: 'bg-gray-500',
        icon: Info 
      };
  }
};

const getAlertLevelLabel = (level: Alert['level']): string => {
  switch (level) {
    case 'red': return '紧急';
    case 'orange': return '警告';
    case 'blue': return '信息';
    default: return '未知';
  }
};

const getAlertStatusStyle = (status: Alert['status']): { text: string; bg: string; label: string } => {
  switch (status) {
    case 'active':
      return { text: 'text-red-600', bg: 'bg-red-100', label: '未确认' };
    case 'acknowledged':
      return { text: 'text-yellow-600', bg: 'bg-yellow-100', label: '已确认' };
    case 'resolved':
      return { text: 'text-green-600', bg: 'bg-green-100', label: '已解决' };
    default:
      return { text: 'text-gray-600', bg: 'bg-gray-100', label: '未知' };
  }
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
};

const AlertPanel: React.FC = () => {
  const alerts = useAppStore((state) => state.alerts);
  const [filterStatus, setFilterStatus] = React.useState<Alert['status'] | 'all'>('all');
  const [expandedAlert, setExpandedAlert] = React.useState<string | null>(null);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">预警中心</h3>
            <p className="text-sm text-gray-500">实时监控系统告警信息</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="text-sm text-red-700 font-medium">{activeAlerts.length} 未确认</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-full">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-sm text-yellow-700 font-medium">{acknowledgedAlerts.length} 已确认</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-green-700 font-medium">{resolvedAlerts.length} 已解决</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {[
          { value: 'all', label: '全部', count: alerts.length },
          { value: 'active', label: '未确认', count: activeAlerts.length, color: 'text-red-600' },
          { value: 'acknowledged', label: '已确认', count: acknowledgedAlerts.length, color: 'text-yellow-600' },
          { value: 'resolved', label: '已解决', count: resolvedAlerts.length, color: 'text-green-600' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value as Alert['status'] | 'all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filterStatus === filter.value 
                ? 'bg-white shadow-md text-gray-800' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            {filter.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${filterStatus === filter.value ? 'bg-gray-100 text-gray-600' : `bg-gray-200 ${filter.color}`}`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-gray-700 text-lg font-medium">暂无预警记录</p>
          <p className="text-gray-400 text-sm mt-2">系统运行正常，没有需要处理的告警</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const style = getAlertLevelStyle(alert.level);
            const statusStyle = getAlertStatusStyle(alert.status);
            const Icon = style.icon;
            const isExpanded = expandedAlert === alert.id;

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all duration-300 ${style.border}`}
              >
                <div 
                  className={`p-5 ${style.bg} cursor-pointer`}
                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${style.text}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${style.badge}`}>
                          {getAlertLevelLabel(alert.level)}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(alert.createdAt)}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-gray-800 mb-2">{alert.message}</h4>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                          来源: {alert.source}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          责任人: {alert.operator}
                        </span>
                        {alert.acknowledgedBy && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            确认人: {alert.acknowledgedBy}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {alert.status === 'active' && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledge(alert.id);
                            }}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            确认
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolve(alert.id);
                            }}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
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
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          标记已解决
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">下一步动作</p>
                        <p className="text-sm text-gray-600 bg-white px-4 py-3 rounded-lg border border-gray-200">
                          {alert.nextAction}
                        </p>
                      </div>
                      {alert.acknowledgedAt && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">确认时间</p>
                          <p className="text-sm text-gray-600 bg-white px-4 py-3 rounded-lg border border-gray-200">
                            {formatTime(alert.acknowledgedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertPanel;
