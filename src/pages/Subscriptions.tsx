import { useState } from 'react';
import { Bell, School, Heart, Bus, Shield, Check, Mail, MailOpen } from 'lucide-react';

const subscriptionTypes = [
  { key: 'school', label: '学区预警', icon: School, desc: '学区划分变动及学位预警通知' },
  { key: 'medical', label: '医保变动', icon: Heart, desc: '医保缴费和余额变动提醒' },
  { key: 'transport', label: '交通出行', icon: Bus, desc: '公交地铁运营异常通知' },
  { key: 'social', label: '社保变动', icon: Shield, desc: '社保缴费和政策变动提醒' },
];

const mockNotifications = [
  { id: 1, type: 'medical', title: '医保个人账户入账 ¥458.00', time: '2026-06-04 10:30', read: false },
  { id: 2, type: 'school', title: '鼓楼区学区划分调整通知', time: '2026-06-03 14:00', read: false },
  { id: 3, type: 'transport', title: '地铁2号线延时运营公告', time: '2026-06-02 09:15', read: true },
  { id: 4, type: 'social', title: '社保缴费基数调整通知', time: '2026-06-01 08:00', read: true },
  { id: 5, type: 'medical', title: '医保门诊报销政策更新', time: '2026-05-30 16:45', read: true },
];

export default function Subscriptions() {
  const [subs, setSubs] = useState<Record<string, boolean>>({
    school: true,
    medical: true,
    transport: false,
    social: true,
  });

  const [notifications, setNotifications] = useState(mockNotifications);

  const toggleSub = (key: string) => {
    setSubs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const typeLabel = (key: string) =>
    subscriptionTypes.find((t) => t.key === key)?.label || key;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif-cn text-2xl font-bold text-warm-800 mb-6 flex items-center gap-2">
        <Bell className="w-6 h-6 text-primary" />
        消息订阅
      </h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {subscriptionTypes.map((sub) => (
          <div
            key={sub.key}
            className="bg-white rounded-lg shadow-sm p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
              <sub.icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-warm-800">{sub.label}</h3>
              <p className="text-sm text-warm-500 mt-0.5">{sub.desc}</p>
            </div>
            <button
              onClick={() => toggleSub(sub.key)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                subs[sub.key] ? 'bg-primary' : 'bg-warm-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${
                  subs[sub.key] ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-serif-cn text-lg font-bold text-warm-800 mb-4">通知列表</h2>
        <div className="bg-white rounded-lg shadow-sm divide-y divide-warm-100">
          {notifications.length === 0 ? (
            <p className="text-center text-warm-500 py-8">暂无通知</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className="flex items-start gap-3 px-5 py-4 hover:bg-warm-50 cursor-pointer"
              >
                {n.read ? (
                  <MailOpen className="w-5 h-5 text-warm-400 mt-0.5 shrink-0" />
                ) : (
                  <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-warm-500' : 'text-warm-800 font-medium'}`}>
                    {n.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-primary-50 text-primary px-1.5 py-0.5 rounded">
                      {typeLabel(n.type)}
                    </span>
                    <span className="text-xs text-warm-400">{n.time}</span>
                  </div>
                </div>
                {!n.read && (
                  <Check className="w-4 h-4 text-warm-400 hover:text-primary shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
