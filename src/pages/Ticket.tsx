import React, { useState, useEffect } from "react";
import { api, type Queue, type Ticket, type TicketLog } from "@/lib/api";

export default function TicketPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [customerCount, setCustomerCount] = useState(1);
  const [phone, setPhone] = useState("");
  const [notifyMethod, setNotifyMethod] = useState("none");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [ticketLogs, setTicketLogs] = useState<TicketLog[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [queueStatus, setQueueStatus] = useState<Record<number, { waiting: number; wait_time: number; current: string | null }>>({});

  useEffect(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadQueues() {
    setDataLoading(true);
    try {
      const data = await api.getQueues(1);
      setQueues(data.filter(q => q.status === 'active'));
      
      for (const q of data) {
        const status = await api.getQueueStatus(q.id);
        setQueueStatus(prev => ({
          ...prev,
          [q.id]: { 
            waiting: status.waiting_count, 
            wait_time: status.next_wait_time,
            current: status.current_called?.ticket_number || null
          }
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQueue) return;
    
    setLoading(true);
    setError("");
    try {
      const result = await api.createTicket({
        store_id: 1,
        queue_id: selectedQueue.id,
        customer_count: customerCount,
        phone: phone || undefined,
        notify_method: notifyMethod,
      });
      setTicket(result);
      const logs = await api.getTicketLogs(result.id).catch(() => []);
      setTicketLogs(logs);
      loadQueues();
    } catch (e: any) {
      setError(e.error || "取号失败");
      if (e.ticket) {
        setTicket(e.ticket);
        const logs = await api.getTicketLogs(e.ticket.id).catch(() => []);
        setTicketLogs(logs);
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTicket(null);
    setTicketLogs([]);
    setSelectedQueue(null);
    setCustomerCount(1);
    setPhone("");
    setNotifyMethod("none");
    setError("");
  }

  const steps = [
    { num: 1, title: '选择业务队列', desc: '选择您要办理的业务类型' },
    { num: 2, title: '填写信息', desc: '填写人数、手机号和通知方式' },
    { num: 3, title: '取号完成', desc: '获取您的排队号码' },
  ];

  const currentStep = ticket ? 3 : selectedQueue ? 2 : 1;

  if (dataLoading && queues.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <div className="text-xl text-gray-500">加载队列信息中...</div>
        </div>
      </div>
    );
  }

  if (ticket) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">✅ 取号成功 v2.0</h2>
              <p className="text-green-100 mt-1">完整功能已上线 · 支持操作记录追溯</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-100">取号时间</div>
              <div className="text-xl font-bold">{new Date(ticket.created_at).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error ? '您已取号' : '取号成功'}
          </h2>
          <p className="text-gray-500 mb-6">请在候位区等待叫号</p>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 mb-6 text-white">
            <div className="text-7xl font-bold mb-2 tracking-wider">{ticket.ticket_number}</div>
            <div className="text-blue-100">{ticket.queue_name}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-left">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">前面等待</div>
              <div className="text-2xl font-bold text-gray-800">
                {Math.max((queueStatus[selectedQueue?.id || 0]?.waiting || 1) - 1, 0)} 位
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">预计等待</div>
              <div className="text-2xl font-bold text-gray-800">{ticket.estimated_wait_time} 分钟</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">办理人数</div>
              <div className="text-2xl font-bold text-gray-800">{ticket.customer_count} 人</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">取号时间</div>
              <div className="text-lg font-bold text-gray-800">{new Date(ticket.created_at).toLocaleTimeString()}</div>
            </div>
          </div>

          {phone && (
            <div className="bg-green-50 text-green-700 rounded-lg p-3 mb-4 text-sm">
              📱 手机号 {phone.slice(0, 3)}****{phone.slice(7)} 已登记
              {notifyMethod === 'sms' && <span className="ml-2">· 将通过短信通知</span>}
              {notifyMethod === 'wechat' && <span className="ml-2">· 将通过微信通知</span>}
            </div>
          )}

          {error && (
            <div className="bg-yellow-50 text-yellow-700 rounded-lg p-3 mb-4 text-sm">
              ⚠️ {error}
            </div>
          )}

          {ticketLogs.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-medium text-gray-700 mb-3">📝 取号记录（可复查）</h4>
              <div className="space-y-2">
                {ticketLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm p-2 bg-white rounded">
                    <span className="text-gray-600">
                      {log.action === 'create' && '🎫 取号成功'}
                      {log.action !== 'create' && log.action}
                      {log.remark && <span className="ml-2 text-gray-400">({log.remark})</span>}
                    </span>
                    <span className="text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              继续取号
            </button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="text-sm text-gray-500">
              当前呼叫: <span className="font-bold text-blue-600">{queueStatus[selectedQueue?.id || 0]?.current || '暂无'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📱 顾客取号系统 v2.0</h2>
            <p className="text-blue-100 mt-1">完整功能已升级 · 支持信息采集和重复取号检测</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">当前时间</div>
            <div className="text-xl font-bold">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6 shadow-md">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                  currentStep >= step.num 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  {currentStep > step.num ? '✓' : step.num}
                </div>
                <div className="mt-2 text-center">
                  <div className={`font-medium ${currentStep >= step.num ? 'text-blue-600' : 'text-gray-400'}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400">{step.desc}</div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                  currentStep > step.num ? 'bg-blue-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
        {currentStep === 1 ? '第一步：选择业务类型' : 
        currentStep === 2 ? '第二步：填写顾客信息' : 
        '第三步：取号结果'}
      </h2>
      <p className="text-gray-500 text-center mb-6">
        {currentStep === 1 ? '点击下方卡片选择您要办理的业务类型' : 
        currentStep === 2 ? '请填写以下信息，我们将为您安排排队' : 
        '请在候位区等待叫号'}
      </p>
      
      {!selectedQueue ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {queues.map((q) => (
            <button
              key={q.id}
              onClick={() => setSelectedQueue(q)}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 text-left border-2 border-transparent hover:border-blue-300 group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {q.prefix === 'A' && '👥'}
                {q.prefix === 'B' && '⭐'}
                {q.prefix === 'C' && '⚡'}
                {!['A','B','C'].includes(q.prefix) && '🎫'}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{q.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">等待中</span>
                  <span className="font-semibold text-blue-600">{queueStatus[q.id]?.waiting || 0} 人</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">预计等待</span>
                  <span className="font-semibold">{queueStatus[q.id]?.wait_time || 0} 分钟</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">平均时长</span>
                  <span className="font-semibold">{q.average_duration} 分钟</span>
                </div>
              </div>
              {queueStatus[q.id]?.current && (
                <div className="mt-3 pt-3 border-t text-sm">
                  <span className="text-gray-500">当前呼叫: </span>
                  <span className="font-bold text-red-600 animate-pulse">{queueStatus[q.id]?.current}</span>
                </div>
              )}
              <div className="mt-4 text-center">
                <span className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium group-hover:bg-blue-100 transition-colors">
                  点击选择此业务 →
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm text-gray-500">已选择</div>
              <h3 className="text-2xl font-semibold text-gray-800">{selectedQueue.name}</h3>
            </div>
            <button
              onClick={() => setSelectedQueue(null)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← 返回选择
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-blue-50 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                👥 办理人数 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setCustomerCount(Math.max(1, customerCount - 1))}
                  className="w-14 h-14 rounded-full bg-gray-100 text-2xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  -
                </button>
                <span className="text-5xl font-bold text-blue-600 w-20 text-center">{customerCount}</span>
                <button
                  type="button"
                  onClick={() => setCustomerCount(Math.min(10, customerCount + 1))}
                  className="w-14 h-14 rounded-full bg-blue-100 text-2xl font-bold text-blue-600 hover:bg-blue-200 transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-center text-gray-400 text-sm mt-2">请选择实际办理业务的人数（1-10人）</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 手机号 <span className="text-gray-400 font-normal">（选填，用于排队提醒）</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入11位手机号"
                className="w-full px-5 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">填写手机号可接收排队提醒，避免过号</p>
            </div>

            {phone && (
              <div className="bg-green-50 rounded-xl p-5">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🔔 通知方式 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'none', label: '无需通知', icon: '🔕', desc: '现场等待' },
                    { value: 'sms', label: '短信通知', icon: '📱', desc: '发送提醒' },
                    { value: 'wechat', label: '微信通知', icon: '💬', desc: '微信提醒' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNotifyMethod(opt.value)}
                      className={`py-4 px-3 rounded-xl border-2 transition-all ${
                        notifyMethod === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{opt.icon}</span>
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 rounded-xl p-4 text-center">
                ❌ {error}
              </div>
            )}

            <div className="bg-blue-50 rounded-xl p-5">
              <h4 className="font-medium text-blue-800 mb-3">📊 排队信息预览</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700">业务类型</span>
                <span className="font-bold text-blue-800">{selectedQueue.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700">预计等待时间</span>
                <span className="text-2xl font-bold text-blue-600">
                  {queueStatus[selectedQueue.id]?.wait_time || 0} 分钟
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-700">前面还有</span>
                <span className="text-xl font-bold text-blue-600">
                  {queueStatus[selectedQueue.id]?.waiting || 0} 人
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 rounded-xl font-bold text-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> 取号中...
                </span>
              ) : (
                '🎫 确认取号'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
