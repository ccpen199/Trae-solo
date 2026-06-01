import React, { useState, useEffect } from "react";
import { api, type Window, type Queue, type Ticket, type TicketLog } from "@/lib/api";

export default function CallStation() {
  const [windows, setWindows] = useState<Window[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [waitingTickets, setWaitingTickets] = useState<Ticket[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<Window | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [logs, setLogs] = useState<TicketLog[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferQueueId, setTransferQueueId] = useState<number | null>(null);
  const [callingAnimation, setCallingAnimation] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [selectedWindow?.id]);

  useEffect(() => {
    setCurrentTicket(null);
    setLogs([]);
  }, [selectedWindow?.id]);

  async function loadData() {
    try {
      setDataLoading(true);
      const [windowsData, queuesData, waitingData] = await Promise.all([
        api.getWindows(1),
        api.getQueues(1),
        api.getWaitingTickets(1),
      ]);
      setWindows(windowsData);
      setQueues(queuesData);
      setWaitingTickets(waitingData);

      if (selectedWindow) {
        const updatedWindow = windowsData.find(w => w.id === selectedWindow.id);
        if (updatedWindow) {
          setSelectedWindow(updatedWindow);
          if (updatedWindow.current_ticket_id) {
            try {
              const [ticket, ticketLogs] = await Promise.all([
                api.getTicket(updatedWindow.current_ticket_id),
                api.getTicketLogs(updatedWindow.current_ticket_id),
              ]);
              setCurrentTicket(ticket);
              setLogs(ticketLogs);
            } catch (e) {
              console.error('Failed to load current ticket:', e);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  }

  async function handleCallNext() {
    if (!selectedWindow) return;
    setLoading(true);
    setMessage("");
    setCallingAnimation(true);
    try {
      const result = await api.callNext(selectedWindow.id, '前台操作员');
      const ticket = await api.getTicket(result.id);
      const ticketLogs = await api.getTicketLogs(result.id);
      setCurrentTicket(ticket);
      setLogs(ticketLogs);
      setMessage("🔔 叫号成功！");
      loadData();
    } catch (e: any) {
      setMessage(`❌ ${e.error || '叫号失败'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setCallingAnimation(false), 3000);
    }
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleMiss() {
    if (!currentTicket || !selectedWindow) return;
    setLoading(true);
    try {
      await api.missTicket(currentTicket.id, '前台操作员', '顾客未到');
      setMessage("⏭️ 已过号");
      const ticketLogs = await api.getTicketLogs(currentTicket.id);
      setLogs(ticketLogs);
      loadData();
    } catch (e: any) {
      setMessage(`❌ ${e.error || '操作失败'}`);
    } finally {
      setLoading(false);
    }
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleRecall() {
    if (!currentTicket || !selectedWindow) return;
    setLoading(true);
    setCallingAnimation(true);
    try {
      await api.recallTicket(currentTicket.id, '前台操作员');
      setMessage("🔔 重新叫号成功！");
      const ticketLogs = await api.getTicketLogs(currentTicket.id);
      setLogs(ticketLogs);
      loadData();
    } catch (e: any) {
      setMessage(`❌ ${e.error || '操作失败'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setCallingAnimation(false), 3000);
    }
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleComplete() {
    if (!currentTicket || !selectedWindow) return;
    setLoading(true);
    try {
      await api.completeTicket(currentTicket.id, '前台操作员');
      setMessage("✅ 服务已完成！");
      const ticketLogs = await api.getTicketLogs(currentTicket.id);
      setLogs(ticketLogs);
      setCurrentTicket(null);
      loadData();
    } catch (e: any) {
      setMessage(`❌ ${e.error || '操作失败'}`);
    } finally {
      setLoading(false);
    }
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleTransfer() {
    if (!currentTicket || !selectedWindow || !transferQueueId) return;
    setLoading(true);
    try {
      await api.transferTicket(currentTicket.id, transferQueueId, '前台操作员', '转至其他队列');
      setMessage("🔄 已转队列");
      const ticketLogs = await api.getTicketLogs(currentTicket.id);
      setLogs(ticketLogs);
      setCurrentTicket(null);
      setShowTransfer(false);
      setTransferQueueId(null);
      loadData();
    } catch (e: any) {
      setMessage(`❌ ${e.error || '操作失败'}`);
    } finally {
      setLoading(false);
    }
    setTimeout(() => setMessage(""), 3000);
  }

  async function toggleWindow(window: Window) {
    try {
      await api.toggleWindowStatus(window.id);
      setMessage(window.status === 'open' ? '⏸️ 窗口已暂停' : '▶️ 窗口已恢复');
      loadData();
    } catch (e: any) {
      console.error(e);
      setMessage(`❌ ${e.error || '操作失败'}`);
    }
    setTimeout(() => setMessage(""), 3000);
  }

  const queueCounts = queues.map(q => ({
    ...q,
    count: waitingTickets.filter(t => t.queue_id === q.id).length
  }));

  if (dataLoading && windows.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <div className="text-xl text-gray-500">加载叫号台数据中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📣 叫号台 v2.0</h2>
            <p className="text-purple-100 mt-1">完整功能已升级 · 支持过号/重新叫号/转队列/服务完成全流程</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-purple-100">当前时间</div>
            <div className="text-xl font-bold">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-xl text-center font-medium animate-pulse">
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🪟 选择服务窗口
          {dataLoading && <span className="text-sm font-normal text-blue-600 flex items-center gap-1">
            <span className="animate-spin text-sm">⏳</span> 数据刷新中
          </span>}
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {windows.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWindow(w)}
              className={`p-5 rounded-xl border-2 transition-all text-left ${
                selectedWindow?.id === w.id
                  ? 'border-purple-500 bg-purple-50 ring-4 ring-purple-200'
                  : w.status === 'open'
                  ? 'border-gray-200 hover:border-purple-300 bg-white hover:bg-purple-50'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-gray-800">{w.name}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  w.status === 'open' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {w.status === 'open' ? '● 营业中' : '● 已暂停'}
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                绑定队列: <span className="font-medium text-gray-700">{w.queue_name || '未绑定'}</span>
              </div>
              {w.current_ticket_id && (
                <div className="text-sm">
                  <span className="text-gray-500">当前叫号: </span>
                  <span className="font-bold text-red-600 animate-pulse">正在呼叫</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedWindow && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className={`bg-white rounded-2xl p-8 shadow-md ${callingAnimation ? 'ring-4 ring-red-300 animate-pulse' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">📢 当前叫号</h3>
                {callingAnimation && (
                  <span className="text-red-600 font-bold animate-bounce">🔔 呼叫中...</span>
                )}
              </div>

              {currentTicket ? (
                <div className="text-center">
                  <div className={`text-8xl font-bold mb-4 tracking-widest ${callingAnimation ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                    {currentTicket.ticket_number}
                  </div>
                  <div className="text-xl text-gray-600 mb-4">{currentTicket.queue_name}</div>
                  
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">办理人数</div>
                      <div className="text-2xl font-bold text-gray-800">{currentTicket.customer_count}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">等待时长</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {currentTicket.actual_wait_time || 0}分钟
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">当前状态</div>
                      <div className={`text-2xl font-bold ${
                        currentTicket.status === 'called' ? 'text-blue-600' :
                        currentTicket.status === 'missed' ? 'text-red-600' :
                        currentTicket.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {currentTicket.status === 'called' ? '呼叫中' :
                         currentTicket.status === 'missed' ? '已过号' :
                         currentTicket.status === 'completed' ? '已完成' : currentTicket.status}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">取号时间</div>
                      <div className="text-lg font-bold text-gray-800">
                        {new Date(currentTicket.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="font-medium text-yellow-800 mb-2">⚠️ 操作流程提示</div>
                    <div className="text-sm text-yellow-700">
                      1. 呼叫顾客 → 2. 顾客到店办理 → 3. 服务完成
                      <br />
                      如顾客未到可过号，过号后可重新叫号或转队列
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-gray-700 mb-3 text-left">🔧 操作按钮组</h4>
                  <div className="grid grid-cols-5 gap-3">
                    <button
                      onClick={handleCallNext}
                      disabled={loading}
                      className="py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30"
                    >
                      🔔 呼叫<br/>下一位
                    </button>
                    <button
                      onClick={handleMiss}
                      disabled={loading || !currentTicket || currentTicket.status === 'missed'}
                      className="py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/30"
                    >
                      ⏭️ 过号
                    </button>
                    <button
                      onClick={handleRecall}
                      disabled={loading || !currentTicket || currentTicket.status !== 'missed'}
                      className="py-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
                    >
                      🔄 重新<br/>叫号
                    </button>
                    <button
                      onClick={() => setShowTransfer(true)}
                      disabled={loading || !currentTicket}
                      className="py-4 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold hover:from-pink-600 hover:to-pink-700 transition-all disabled:opacity-50 shadow-lg shadow-pink-500/30"
                    >
                      🔀 转<br/>队列
                    </button>
                    <button
                      onClick={handleComplete}
                      disabled={loading || !currentTicket || currentTicket.status === 'completed'}
                      className="py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 shadow-lg shadow-green-500/30"
                    >
                      ✅ 服务<br/>完成
                    </button>
                  </div>

                  <button
                    onClick={() => toggleWindow(selectedWindow)}
                    className="mt-4 w-full py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  >
                    {selectedWindow.status === 'open' ? '⏸️ 暂停窗口服务' : '▶️ 恢复窗口服务'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎯</div>
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">暂无正在叫号</h4>
                  <p className="text-gray-400 mb-6">点击下方按钮呼叫下一位顾客</p>
                  <button
                    onClick={handleCallNext}
                    disabled={loading}
                    className="px-12 py-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30"
                  >
                    🔔 呼叫下一位
                  </button>
                </div>
              )}
            </div>

            {showTransfer && currentTicket && (
              <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-pink-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🔀 转队列处理</h3>
                <p className="text-gray-600 mb-4">将 {currentTicket.ticket_number} 转至其他队列：</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {queues.filter(q => q.id !== currentTicket.queue_id).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setTransferQueueId(q.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        transferQueueId === q.id
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <div className="font-semibold">{q.name}</div>
                      <div className="text-sm text-gray-500">
                        等待 {waitingTickets.filter(t => t.queue_id === q.id).length} 人
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleTransfer}
                    disabled={!transferQueueId || loading}
                    className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 disabled:opacity-50"
                  >
                    ✅ 确认转队列
                  </button>
                  <button
                    onClick={() => { setShowTransfer(false); setTransferQueueId(null); }}
                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">📝 现场操作记录（可复查）</h3>
                <span className="text-sm text-gray-500">最近 5 条记录</span>
              </div>
              {logs.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl">
                        {log.action === 'call' && '🔔'}
                        {log.action === 'miss' && '⏭️'}
                        {log.action === 'recall' && '🔄'}
                        {log.action === 'complete' && '✅'}
                        {log.action === 'transfer' && '🔀'}
                        {log.action === 'create' && '🎫'}
                        {!['call','miss','recall','complete','transfer','create'].includes(log.action) && '📋'}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {log.action === 'call' && '呼叫顾客'}
                          {log.action === 'miss' && '过号处理'}
                          {log.action === 'recall' && '重新叫号'}
                          {log.action === 'complete' && '服务完成'}
                          {log.action === 'transfer' && '转队列'}
                          {log.action === 'create' && '取号'}
                          {!['call','miss','recall','complete','transfer','create'].includes(log.action) && log.action}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.operator && `操作员: ${log.operator}`}
                          {log.remark && ` · 备注: ${log.remark}`}
                        </div>
                      </div>
                      <span className="text-sm text-gray-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  暂无操作记录，呼叫下一位后将显示操作日志
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 队列概览</h3>
              <div className="space-y-3">
                {queueCounts.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {q.prefix}
                      </span>
                      <span className="font-medium">{q.name}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      q.count > 10 ? 'bg-red-100 text-red-600' :
                      q.count > 5 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {q.count} 人等待
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">⏳ 等待队列</h3>
                <span className="text-sm text-blue-600 font-medium">共 {waitingTickets.length} 人</span>
              </div>
              {waitingTickets.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {waitingTickets.slice(0, 10).map((t, i) => (
                    <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl ${
                      i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-bold text-gray-800">{t.ticket_number}</span>
                          <span className="text-xs text-gray-500 ml-2">{t.queue_name}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {t.customer_count}人 · {new Date(t.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {waitingTickets.length > 10 && (
                    <div className="text-center text-sm text-gray-400 py-2">
                      还有 {waitingTickets.length - 10} 人等待
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">🎉</div>
                  暂无等待顾客
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!selectedWindow && (
        <div className="bg-white rounded-2xl p-16 text-center shadow-md">
          <div className="text-6xl mb-4">👆</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">请选择服务窗口</h3>
          <p className="text-gray-500">点击上方窗口卡片开始叫号操作</p>
        </div>
      )}
    </div>
  );
}
