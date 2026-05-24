import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

const getStatusBadge = (status) => {
  const statusMap = {
    recruiting: { text: '招募中', className: 'info' },
    confirmed: { text: '已成局', className: 'success' },
    completed: { text: '已完成', className: 'success' },
    cancelled: { text: '已取消', className: 'danger' }
  };
  const s = statusMap[status] || { text: status, className: '' };
  return <span className={`badge ${s.className}`}>{s.text}</span>;
};

function GameDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ target_user_id: '', rating: 5, comment: '', credit_impact: 0 });

  useEffect(() => {
    loadGame();
  }, [id]);

  const loadGame = async () => {
    try {
      const res = await api.get(`/games/${id}`);
      setGame(res.data);
    } catch (err) {
      console.error('加载球局失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      const res = await api.post(`/games/${id}/join`);
      alert(res.data.message);
      loadGame();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleConfirm = async () => {
    try {
      await api.post(`/games/${id}/confirm`);
      alert('球局已确认');
      loadGame();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleCancel = async () => {
    if (!confirm('确定要取消此球局吗？')) return;
    try {
      await api.post(`/games/${id}/cancel`);
      alert('球局已取消');
      loadGame();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleCheckin = async () => {
    try {
      await api.post(`/game/${id}/checkin`);
      alert('核销成功');
      loadGame();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleComplete = async () => {
    try {
      const res = await api.post(`/game/${id}/complete`);
      alert(`球局已完成，AA费用：¥${res.data.per_person.toFixed(2)}`);
      loadGame();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleMarkNoShow = async (userId) => {
    try {
      await api.post(`/game/${id}/mark-no-show`, { user_id: userId });
      alert('已标记爽约');
      loadGame();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/game/${id}/review`, reviewForm);
      alert('评价成功');
      setShowReview(false);
      setReviewForm({ target_user_id: '', rating: 5, comment: '', credit_impact: 0 });
    } catch (err) {
      alert(err.response?.data?.error || '评价失败');
    }
  };

  const isOrganizer = game?.organizer_id === user.id;
  const isMember = game?.members?.some(m => m.user_id === user.id);
  const myMember = game?.members?.find(m => m.user_id === user.id);

  if (loading) return <div>加载中...</div>;
  if (!game) return <div className="card">球局不存在</div>;

  return (
    <div>
      <div className="card">
        <div className="game-header">
          <h2>{game.title}</h2>
          {getStatusBadge(game.status)}
        </div>
        <div className="game-meta">
          发起人：{game.organizer_name} | 运动类型：{game.sport_type}
        </div>
        <div className="game-meta">
          📍 {game.venue_name} ({game.venue_address}) - {game.court_name}
        </div>
        <div className="game-meta">
          🕐 {game.date} {game.start_time}-{game.end_time}
        </div>
        <div className="game-meta">
          👥 {game.members.length}/{game.max_players} 人 | ⭐ 等级要求：Lv.{game.level_required}
        </div>
        <div className="game-meta">
          💰 订金 ¥{game.deposit_amount} | AA规则：{game.aa_rule}
        </div>
        {game.description && (
          <div className="game-meta" style={{ marginTop: '15px' }}>
            <strong>球局说明：</strong>{game.description}
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          {game.status === 'recruiting' && !isMember && (
            <button className="btn btn-primary" onClick={handleJoin}>立即报名</button>
          )}
          {isOrganizer && game.status === 'recruiting' && (
            <>
              <button className="btn btn-success" onClick={handleConfirm}>确认成局</button>
              <button className="btn btn-danger" onClick={handleCancel}>取消球局</button>
            </>
          )}
          {isMember && game.status === 'confirmed' && !myMember?.checked_in && (
            <button className="btn btn-success" onClick={handleCheckin}>扫码核销</button>
          )}
          {isOrganizer && game.status === 'confirmed' && (
            <button className="btn btn-success" onClick={handleComplete}>完成球局并结算</button>
          )}
          {game.status === 'completed' && isMember && (
            <button className="btn btn-primary" onClick={() => setShowReview(true)}>评价成员</button>
          )}
        </div>
      </div>

      <div className="card">
        <h3>成员名单 ({game.members.length}/{game.max_players})</h3>
        <table>
          <thead>
            <tr>
              <th>用户</th>
              <th>角色</th>
              <th>等级</th>
              <th>信用分</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {game.members.map(m => (
              <tr key={m.id}>
                <td>{m.nickname}</td>
                <td><span className="badge">{m.role === 'organizer' ? '发起人' : '队员'}</span></td>
                <td>Lv.{m.level}</td>
                <td>{m.credit_score}</td>
                <td>
                  {m.checked_in ? <span className="badge success">已到场</span> :
                   m.no_show ? <span className="badge danger">爽约</span> :
                   <span className="badge">待到场</span>}
                </td>
                <td>
                  {isOrganizer && game.status === 'confirmed' && !m.checked_in && m.role !== 'organizer' && (
                    <button className="btn btn-danger" onClick={() => handleMarkNoShow(m.user_id)}>标记爽约</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {game.waitlist && game.waitlist.length > 0 && (
        <div className="card">
          <h3>候补队列 ({game.waitlist.length})</h3>
          {game.waitlist.map(w => (
            <div key={w.id} className="log-item">
              #{w.position} {w.nickname} (Lv.{w.level})
            </div>
          ))}
        </div>
      )}

      {showReview && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>评价成员</h3>
              <button className="close-btn" onClick={() => setShowReview(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label>选择成员</label>
                <select value={reviewForm.target_user_id} onChange={(e) => setReviewForm({ ...reviewForm, target_user_id: e.target.value })} required>
                  <option value="">请选择</option>
                  {game.members.filter(m => m.user_id !== user.id).map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.nickname}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>评分（1-5）</label>
                <input type="number" min="1" max="5" value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })} required />
              </div>
              <div className="form-group">
                <label>信用分影响（-10到+10）</label>
                <input type="number" min="-10" max="10" value={reviewForm.credit_impact}
                  onChange={(e) => setReviewForm({ ...reviewForm, credit_impact: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>评价内容</label>
                <textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows="3" />
              </div>
              <button type="submit" className="btn btn-primary">提交评价</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameDetail;
