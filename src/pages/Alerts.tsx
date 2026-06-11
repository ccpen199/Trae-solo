import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MapPin, Shield, ChevronDown, ChevronUp, Bell, MessageSquare, Check } from 'lucide-react';
import { useWeatherStore } from '../stores/weatherStore';
import { cn } from '../lib/utils';
import type { WeatherAlert } from '../../shared/types';

export default function Alerts() {
  const { alerts, currentCity, fetchAlerts } = useWeatherStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsSending, setSmsSending] = useState(false);

  useEffect(() => {
    if (currentCity) {
      fetchAlerts(currentCity.id);
    }
  }, [currentCity?.id]);

  const getLevelConfig = (levelCode: number) => {
    const configs = [
      { level: '蓝色', bg: 'bg-blue-500', bgLight: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', pulse: 'shadow-blue-500/50' },
      { level: '黄色', bg: 'bg-yellow-500', bgLight: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', pulse: 'shadow-yellow-500/50' },
      { level: '橙色', bg: 'bg-orange-500', bgLight: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', pulse: 'shadow-orange-500/50' },
      { level: '红色', bg: 'bg-red-500', bgLight: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', pulse: 'shadow-red-500/50' },
    ];
    return configs[Math.min(levelCode - 1, 3)] || configs[0];
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetail = (alert: WeatherAlert) => {
    setSelectedAlert(alert);
    setShowModal(true);
    setSmsSent(false);
    setSmsSending(false);
  };

  const handleSendSms = () => {
    if (!smsPhone || smsPhone.length < 11) return;
    setSmsSending(true);
    setTimeout(() => {
      setSmsSending(false);
      setSmsSent(true);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="text-gradient">灾害预警中心</span>
        </h1>
        <p className="text-slate-400">
          <MapPin className="w-4 h-4 inline mr-1" />
          {currentCity?.name} · 实时预警信息
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">暂无预警信息</h3>
          <p className="text-slate-400">当前城市天气平稳，请注意关注最新动态</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const config = getLevelConfig(alert.levelCode);
            const isExpanded = expandedId === alert.id;

            return (
              <div
                key={alert.id}
                className={cn(
                  'glass-card overflow-hidden transition-all duration-300',
                  config.border,
                  'border-l-4'
                )}
              >
                <div
                  className="p-5 cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center animate-pulse',
                        config.bgLight
                      )}>
                        <AlertTriangle className={cn('w-6 h-6', config.text)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={cn(
                            'px-2.5 py-0.5 rounded text-xs font-semibold',
                            config.bg,
                            'text-white'
                          )}>
                            {alert.level}预警
                          </span>
                          <span className="text-white font-semibold text-lg">{alert.title}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            发布时间：{formatTime(alert.publishTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {alert.cityName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(alert);
                      }}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      查看详情
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-700/50 pt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">预警内容</h4>
                        <p className="text-slate-300 leading-relaxed">{alert.content}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">防御指南</h4>
                        <p className="text-slate-300 leading-relaxed">{alert.defenseGuide}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>生效时间：{formatTime(alert.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>预计结束：{formatTime(alert.endTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg glass-card p-6 border border-slate-700/50 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse',
                getLevelConfig(selectedAlert.levelCode).bgLight
              )}>
                <AlertTriangle className={cn('w-8 h-8', getLevelConfig(selectedAlert.levelCode).text)} />
              </div>
              <div>
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold',
                  getLevelConfig(selectedAlert.levelCode).bg,
                  'text-white'
                )}>
                  {selectedAlert.level}预警
                </span>
                <h2 className="text-xl font-bold text-white mt-2">{selectedAlert.title}</h2>
                <p className="text-slate-400 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  {selectedAlert.cityName}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto scrollbar-thin">
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <h4 className="text-sm font-medium text-slate-400 mb-2">预警内容</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{selectedAlert.content}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <h4 className="text-sm font-medium text-slate-400 mb-2">防御指南</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{selectedAlert.defenseGuide}</p>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span>发布时间：{formatTime(selectedAlert.publishTime)}</span>
                <span>数据来源：{selectedAlert.source || '国家气象局'}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-medium">短信预警通知</span>
              </div>
              {smsSent ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-5 h-5" />
                  <span>短信已发送至 {smsPhone}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={handleSendSms}
                    disabled={smsSending || !smsPhone}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {smsSending ? '发送中...' : '发送'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
              >
                稍后再看
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25"
              >
                我已知晓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
