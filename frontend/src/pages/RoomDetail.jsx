import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function RoomDetailPage({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [micSlots, setMicSlots] = useState([]);
  const [queue, setQueue] = useState([]);
  const [barrages, setBarrages] = useState([]);
  const [events, setEvents] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showGift, setShowGift] = useState(null);
  const [barrageInput, setBarrageInput] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ target_user_id: '', reason: '', description: '' });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', reward: 0 });
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const barrageEndRef = useRef(null);
  const eventEndRef = useRef(null);

  const loadRoom = () => {
    api.getRoom(id).then(r => {
      setRoom(r);
      setMicSlots(r.micSlots || []);
      setQueue(r.queue || []);
      setAnnouncements(r.announcements || []);
    }).catch(e => console.error(e));
  };

  const loadBarrages = () => {
    api.getBarrages(id, 30).then(r => setBarrages(r.barrages || [])).catch(() => {});
  };

  const loadEvents = () => {
    api.getEvents(id, { limit: 50 }).then(r => setEvents(r.events || [])).catch(() => {});
  };

  const loadGifts = () => {
    api.getGifts().then(r => setGifts(r.gifts || [])).catch(() => {});
  };

  const loadTasks = () => {
    api.getTasks(id).then(r => setTasks(r.tasks || [])).catch(() => {});
  };

  useEffect(() => {
    if (!id) return;
    loadRoom();
    loadBarrages();
    loadEvents();
    loadGifts();
    loadTasks();
    const t1 = setInterval(loadBarrages, 3000);
    const t2 = setInterval(loadEvents, 3000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [id]);

  useEffect(() => {
    barrageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [barrages]);

  useEffect(() => {
    eventEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const isHost = currentUser && room && (room.host_id === currentUser.id || currentUser.role === 'admin');
  const onMicSlot = micSlots.find(s => s.user_id === currentUser?.id);

  const handleApplyMic = () => {
    api.applyMic(id).then(() => { alert('已申请排麦'); loadRoom(); }).catch(e => alert(e.message));
  };

  const handleLeaveMic = () => {
    api.leaveMic(id).then(() => { loadRoom(); loadEvents(); }).catch(e => alert(e.message));
  };

  const handleApprove = (queueId) => {
    api.approveMic(id, queueId).then(() => { loadRoom(); loadEvents(); }).catch(e => alert(e.message));
  };

  const handleReject = (queueId) => {
    api.rejectMic(id, queueId).then(() => { loadRoom(); }).catch(e => alert(e.message));
  };

  const handleLock = (slotId) => {
    api.lockMic(id, slotId).then(() => { loadRoom(); loadEvents(); }).catch(e => alert(e.message));
  };

  const handleMute = (slotId) => {
    api.muteMic(id, slotId).then(() => { loadRoom(); loadEvents(); }).catch(e => alert(e.message));
  };

  const handleKick = (slotId) => {
    if (!confirm('确定踢出该用户？')) return;
    api.kickMic(id, slotId).then(() => { loadRoom(); loadEvents(); }).catch(e => alert(e.message));
  };

  const handleSendBarrage = () => {
    if (!barrageInput.trim()) return;
    api.sendBarrage(id, { content: barrageInput.trim() }).then(() => {
      setBarrageInput('');
      loadBarrages();
      loadEvents();
    }).catch(e => alert(e.message));
  };

  const handleSendGift = (gift) => {
    if (!showGift) return;
    api.sendGift(id, { to_user_id: showGift, gift_id: gift.id, quantity: 1 }).then(() => {
      setShowGift(null);
      loadRoom();
      loadEvents();
      alert(`赠送 ${gift.icon} ${gift.name} 成功！`);
    }).catch(e => alert(e.message));
  };

  const handleSubmitReport = () => {
    if (!reportForm.reason) return alert('请填写举报原因');
    api.submitReport(id, reportForm).then(() => {
      setShowReport(false);
      setReportForm({ target_user_id: '', reason: '', description: '' });
      alert('举报已提交');
    }).catch(e => alert(e.message));
  };

  const handleCreateTask = () => {
    if (!taskForm.title) return alert('请填写任务标题');
    api.createTask(id, taskForm).then(() => {
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', reward: 0 });
      loadTasks();
    }).catch(e => alert(e.message));
  };

  const handleCompleteTask = (taskId) => {
    api.completeTask(taskId).then(() => {
      loadTasks();
      loadRoom();
      loadEvents();
      alert('任务已完成');
    }).catch(e => alert(e.message));
  };

  const handlePostAnnouncement = () => {
    if (!announcementText.trim()) return;
    api.postAnnouncement(id, { content: announcementText.trim() }).then(() => {
      setShowAnnouncement(false);
      setAnnouncementText('');
      loadRoom();
      loadEvents();
    }).catch(e => alert(e.message));
  };

  const handlePlayGame = () => {
    const types = ['dice', 'rps', 'guess_number'];
    const type = types[Math.floor(Math.random() * types.length)];
    const data = { dice: type === 'dice' ? Math.floor(Math.random() * 6) + 1 : undefined };
    api.playGame(id, { game_type: type, data }).then(() => {
      loadEvents();
      alert(type === 'dice' ? `🎲 摇骰子结果: ${data.dice}` : type === 'rps' ? '✊ 石头剪刀布！' : '🔢 猜数字游戏');
    }).catch(e => alert(e.message));
  };

  const handleEnter = () => {
    api.enterRoom(id).then(() => loadRoom()).catch(e => alert(e.message));
  };

  const handleLeave = () => {
    api.leaveRoom(id).then(() => { loadRoom(); navigate('/rooms'); }).catch(e => alert(e.message));
  };

  if (!room) return <div style={{ color: '#888', padding: '40px', textAlign: 'center' }}>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <button onClick={() => navigate('/rooms')} style={styles.backBtn}>← 返回</button>
          <h2 style={{ color: '#fff', fontSize: '22px', marginTop: '8px' }}>{room.topic}</h2>
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#aaa', marginTop: '8px' }}>
            <span>房主: {room.host_name}</span>
            <span>分类: {room.category}</span>
            <span>🔥 {room.popularity}</span>
            <span>👥 {room.online_count}/{room.max_viewers}</span>
            <span style={{
              padding: '2px 8px', borderRadius: '4px',
              background: room.status === 'open' ? '#27ae60' : '#555', color: '#fff'
            }}>{room.status === 'open' ? '开放中' : '已关闭'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {room.status === 'open' && (
            <>
              <button onClick={handleEnter} style={styles.primaryBtn}>进入房间</button>
              <button onClick={handleLeave} style={styles.btn}>离开房间</button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={styles.panel}>
            <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>🎤 麦位 ({micSlots.filter(s => s.user_id).length}/{room.mic_count})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
              {micSlots.map(slot => (
                <div key={slot.id} style={{
                  ...styles.micSlot,
                  background: slot.locked ? '#3a2a2a' : slot.user_id ? '#2a3a5e' : '#1a1a2e',
                  opacity: slot.muted ? 0.6 : 1
                }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>麦位 {slot.slot_index + 1}</div>
                  {slot.user_id ? (
                    <>
                      <div style={{ color: '#fff', fontSize: '13px', marginTop: '4px' }}>{slot.nickname}</div>
                      <div style={{ fontSize: '10px', color: '#666' }}>{slot.role}</div>
                      {slot.muted && <div style={{ fontSize: '10px', color: '#e74c3c' }}>🔇 禁言中</div>}
                      {isHost && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleMute(slot.id)} style={styles.miniBtn}>{slot.muted ? '解禁' : '禁言'}</button>
                          <button onClick={() => handleKick(slot.id)} style={{ ...styles.miniBtn, background: '#e74c3c' }}>踢出</button>
                        </div>
                      )}
                    </>
                  ) : slot.locked ? (
                    <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '8px' }}>🔒 已锁</div>
                  ) : (
                    <div style={{ color: '#555', fontSize: '12px', marginTop: '8px' }}>空闲</div>
                  )}
                  {isHost && (
                    <button onClick={() => handleLock(slot.id)} style={{ ...styles.miniBtn, marginTop: '4px', width: '100%' }}>
                      {slot.locked ? '解锁' : '锁麦'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {queue.length > 0 && (
            <div style={styles.panel}>
              <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>📋 排麦队列 ({queue.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {queue.map(q => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#1a1a2e', borderRadius: '8px' }}>
                    <span style={{ color: '#fff' }}>{q.nickname} <span style={{ color: '#888', fontSize: '12px' }}>({q.role})</span></span>
                    {isHost && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleApprove(q.id)} style={{ ...styles.miniBtn, background: '#27ae60' }}>通过</button>
                        <button onClick={() => handleReject(q.id)} style={{ ...styles.miniBtn, background: '#e74c3c' }}>拒绝</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length > 0 && (
            <div style={styles.panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ color: '#fff', fontSize: '16px' }}>📋 房间任务</h3>
                {isHost && <button onClick={() => setShowTaskModal(true)} style={styles.miniBtn}>+ 新任务</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#1a1a2e', borderRadius: '8px' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px' }}>{t.title} {t.completed && <span style={{ color: '#27ae60', fontSize: '12px' }}>✓ 已完成</span>}</div>
                      {t.description && <div style={{ color: '#888', fontSize: '12px' }}>{t.description}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#f39c12', fontSize: '13px' }}>💰 {t.reward}</span>
                      {!t.completed && <button onClick={() => handleCompleteTask(t.id)} style={styles.miniBtn}>完成</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onMicSlot && (
            <button onClick={handleLeaveMic} style={{ ...styles.dangerBtn, padding: '12px' }}>下麦</button>
          )}

          {!onMicSlot && room.status === 'open' && currentUser && (
            <button onClick={handleApplyMic} style={{ ...styles.primaryBtn, padding: '12px' }}>🎤 申请上麦</button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={styles.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ color: '#fff', fontSize: '15px' }}>📢 公告</h3>
              {isHost && <button onClick={() => setShowAnnouncement(true)} style={styles.miniBtn}>发布</button>}
            </div>
            <div style={{ maxHeight: '100px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {announcements.length === 0 ? (
                <div style={{ color: '#666', fontSize: '12px' }}>暂无公告</div>
              ) : announcements.map(a => (
                <div key={a.id} style={{ background: '#1a1a2e', padding: '8px', borderRadius: '6px', fontSize: '12px', color: '#aaa' }}>
                  {a.content}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.panel}>
            <h3 style={{ color: '#fff', fontSize: '15px', marginBottom: '10px' }}>💬 弹幕</h3>
            <div style={{ maxHeight: '200px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
              {barrages.map((b, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#ccc' }}>
                  <span style={{ color: '#5b5fc7' }}>{b.nickname}:</span> {b.content}
                </div>
              ))}
              <div ref={barrageEndRef} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input value={barrageInput} onChange={e => setBarrageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendBarrage()}
                placeholder="发送弹幕..." style={{ ...styles.input, flex: 1 }} />
              <button onClick={handleSendBarrage} style={styles.miniBtn}>发送</button>
            </div>
          </div>

          <div style={styles.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ color: '#fff', fontSize: '15px' }}>🎁 礼物互动</h3>
              <button onClick={handlePlayGame} style={styles.miniBtn}>🎮 小游戏</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {micSlots.filter(s => s.user_id).map(slot => (
                <button key={slot.id} onClick={() => setShowGift(slot.user_id)}
                  style={{ ...styles.btn, textAlign: 'left', padding: '8px 12px', fontSize: '13px' }}>
                  赠送礼物给 {slot.nickname}
                </button>
              ))}
              {micSlots.filter(s => s.user_id).length === 0 && (
                <div style={{ color: '#666', fontSize: '12px' }}>麦上暂无用户</div>
              )}
            </div>
          </div>

          <div style={styles.panel}>
            <h3 style={{ color: '#fff', fontSize: '15px', marginBottom: '10px' }}>📜 房间事件</h3>
            <div style={{ maxHeight: '250px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {events.map((e, i) => (
                <div key={i} style={{ fontSize: '11px', color: '#888', padding: '4px 0', borderBottom: '1px solid #1a1a2e' }}>
                  <span style={{ color: '#555' }}>{e.created_at?.slice(11, 19)}</span>{' '}
                  <span style={{ color: '#5b5fc7' }}>{e.nickname || '系统'}</span>{' '}
                  <span style={{ color: '#aaa' }}>{formatEvent(e)}</span>
                </div>
              ))}
              <div ref={eventEndRef} />
            </div>
          </div>

          <button onClick={() => setShowReport(true)} style={styles.dangerBtn}>🚨 举报</button>
        </div>
      </div>

      {showGift && (
        <div style={styles.modalOverlay} onClick={() => setShowGift(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '16px' }}>选择礼物</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {gifts.map(g => (
                <button key={g.id} onClick={() => handleSendGift(g)} style={{
                  ...styles.btn, padding: '16px', textAlign: 'center', display: 'flex',
                  flexDirection: 'column', gap: '4px'
                }}>
                  <span style={{ fontSize: '28px' }}>{g.icon}</span>
                  <span style={{ color: '#fff', fontSize: '13px' }}>{g.name}</span>
                  <span style={{ color: '#f39c12', fontSize: '12px' }}>💰 {g.price}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowGift(null)} style={{ ...styles.btn, width: '100%', marginTop: '12px' }}>取消</button>
          </div>
        </div>
      )}

      {showReport && (
        <div style={styles.modalOverlay} onClick={() => setShowReport(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '16px' }}>提交举报</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select value={reportForm.target_user_id} onChange={e => setReportForm({ ...reportForm, target_user_id: e.target.value })} style={styles.input}>
                <option value="">选择举报对象（可选）</option>
                {micSlots.filter(s => s.user_id).map(s => (
                  <option key={s.id} value={s.user_id}>{s.nickname}</option>
                ))}
              </select>
              <select value={reportForm.reason} onChange={e => setReportForm({ ...reportForm, reason: e.target.value })} style={styles.input}>
                <option value="">选择举报原因</option>
                <option value="涉敏语音">涉敏语音</option>
                <option value="恶意霸麦">恶意霸麦</option>
                <option value="骚扰言论">骚扰言论</option>
                <option value="其他违规">其他违规</option>
              </select>
              <textarea placeholder="详细描述（可选）" value={reportForm.description}
                onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setShowReport(false)} style={{ ...styles.btn, flex: 1 }}>取消</button>
              <button onClick={handleSubmitReport} style={{ ...styles.primaryBtn, flex: 1 }}>提交</button>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div style={styles.modalOverlay} onClick={() => setShowTaskModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '16px' }}>创建任务</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="任务标题" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} style={styles.input} />
              <textarea placeholder="任务描述（可选）" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} style={{ ...styles.input, minHeight: '60px' }} />
              <input type="number" min="0" placeholder="奖励金额" value={taskForm.reward} onChange={e => setTaskForm({ ...taskForm, reward: parseFloat(e.target.value) || 0 })} style={styles.input} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setShowTaskModal(false)} style={{ ...styles.btn, flex: 1 }}>取消</button>
              <button onClick={handleCreateTask} style={{ ...styles.primaryBtn, flex: 1 }}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showAnnouncement && (
        <div style={styles.modalOverlay} onClick={() => setShowAnnouncement(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '16px' }}>发布公告</h3>
            <textarea placeholder="公告内容" value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
              style={{ ...styles.input, minHeight: '80px', marginBottom: '12px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowAnnouncement(false)} style={{ ...styles.btn, flex: 1 }}>取消</button>
              <button onClick={handlePostAnnouncement} style={{ ...styles.primaryBtn, flex: 1 }}>发布</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatEvent(e) {
  const data = e.data ? JSON.parse(e.data) : {};
  const typeMap = {
    room_open: '创建了房间',
    room_close: '关闭了房间',
    user_enter: '进入房间',
    user_leave: '离开房间',
    mic_join: `上麦(麦位${data.slot + 1 || ''})`,
    mic_leave: '下麦',
    mic_approve: `通过了 ${data.userId ? '用户' + data.userId : ''} 的上麦申请`,
    mic_lock: `锁定了麦位${data.slot + 1 || ''}`,
    mic_unlock: `解锁了麦位${data.slot + 1 || ''}`,
    mic_mute: `禁言了麦位${data.slot + 1 || ''}`,
    mic_unmute: `解禁了麦位${data.slot + 1 || ''}`,
    mic_kick: `踢出了麦位${data.slot + 1 || ''}的用户`,
    queue_apply: '申请上麦',
    queue_reject: '拒绝了上麦申请',
    gift: `送出了 ${data.gift || ''} ${data.quantity ? 'x' + data.quantity : ''} (${data.amount || 0})`,
    barrage: `说: "${data.content || ''}"`,
    announcement: `发布公告: "${data.content || ''}"`,
    task_complete: `完成了任务 (奖励 ${data.reward || 0})`,
    game: `玩了 ${data.game_type || ''} 游戏`
  };
  return typeMap[e.event_type] || e.event_type;
}

const styles = {
  panel: { background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: '12px', padding: '16px' },
  micSlot: { border: '1px solid #2a2a4e', borderRadius: '8px', padding: '10px', textAlign: 'center', minHeight: '90px' },
  backBtn: { background: 'transparent', color: '#888', fontSize: '14px', border: 'none', cursor: 'pointer' },
  primaryBtn: { background: '#5b5fc7', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 },
  dangerBtn: { background: '#e74c3c', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px' },
  btn: { background: '#2a2a4e', color: '#e0e0e0', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', border: 'none' },
  miniBtn: { background: '#3a3a5e', color: '#e0e0e0', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', border: 'none' },
  input: { background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4e', borderRadius: '6px', padding: '10px 12px', fontSize: '14px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: '12px', padding: '24px', width: '450px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto' }
};
