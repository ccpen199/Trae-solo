import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { liveAPI, giftAPI, userAPI } from '../api';
import { useStore } from '../store';
import { useToast } from '../App';

export default function LiveRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, triggerProfileRefresh } = useStore();
  const { showToast } = useToast();
  const [room, setRoom] = useState(null);
  const [comments, setComments] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const loadData = async () => {
    try {
      const [roomRes, commentsRes, giftsRes] = await Promise.all([
        liveAPI.getRoom(id),
        liveAPI.getComments(id),
        giftAPI.getGifts()
      ]);
      
      if (roomRes.data.success) setRoom(roomRes.data.data);
      if (commentsRes.data.success) setComments(commentsRes.data.data);
      if (giftsRes.data.success) setGifts(giftsRes.data.data);

      if (user && roomRes.data.success) {
        try {
          const followRes = await userAPI.getFollowStatus(roomRes.data.data.anchor_id);
          if (followRes.data.success) {
            setIsFollowing(followRes.data.data.isFollowing);
          }
        } catch {
          setIsFollowing(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/live/${id}`, needLogin: true } });
      return;
    }
    try {
      const res = await userAPI.follow(room.anchor_id);
      if (res.data.success) {
        const newFollowing = res.data.data.isFollowing;
        setIsFollowing(newFollowing);
        setRoom(prev => ({
          ...prev,
          followers: newFollowing ? (prev.followers || 0) + 1 : (prev.followers || 0) - 1
        }));
        triggerProfileRefresh();
        showToast(newFollowing ? '关注成功' : '已取消关注', 'success');
      }
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  const handleSendComment = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/live/${id}`, needLogin: true } });
      return;
    }
    if (!newComment.trim()) return;

    try {
      const res = await liveAPI.sendComment(id, newComment);
      if (res.data.success) {
        setNewComment('');
        const commentsRes = await liveAPI.getComments(id);
        if (commentsRes.data.success) {
          setComments(commentsRes.data.data);
        }
      }
    } catch (err) {
      showToast('发送失败', 'error');
    }
  };

  const handleSendGift = async (gift) => {
    if (!user) {
      navigate('/login', { state: { from: `/live/${id}`, needLogin: true } });
      return;
    }
    try {
      const res = await giftAPI.sendGift({
        receiverId: room.anchor_id,
        giftId: gift.id,
        count: 1,
        liveRoomId: id
      });
      if (res.data.success) {
        showToast(`送出 ${gift.name} x1`, 'success');
        setShowGiftPanel(false);
      } else {
        showToast(res.data.message, 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || '发送失败', 'error');
    }
  };

  const handleShare = () => {
    showToast('分享链接已复制', 'success');
  };

  if (loading) {
    return (
      <div className="loading" style={{ height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        直播间不存在
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-900)', position: 'relative' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
        <img
          src={room.cover}
          alt={room.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 8
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12
          }}>
            👁 {room.viewers}
          </div>
        </div>
      </div>

      <div style={{ padding: 16, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={room.avatar}
              alt={room.nickname}
              className="avatar"
              style={{ width: 48, height: 48, border: '2px solid var(--primary)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                {room.nickname}
                {room.is_verified && <span style={{ color: 'var(--primary)' }}>✓</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                {room.followers} 粉丝
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleFollow}
              className="btn"
              style={{
                background: isFollowing ? 'var(--gray-600)' : 'var(--primary)',
                color: 'white',
                padding: '8px 16px',
                fontSize: 14
              }}
            >
              {isFollowing ? '已关注' : '+ 关注'}
            </button>
            <button
              onClick={handleShare}
              className="btn"
              style={{ background: 'var(--gray-600)', color: 'white', padding: '8px 16px', fontSize: 14 }}
            >
              分享
            </button>
          </div>
        </div>

        <h2 style={{ fontSize: 16, marginBottom: 16 }}>{room.title}</h2>

        <div style={{
          height: 200,
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 16
        }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 40 }}>
              暂无评论，来说点什么吧
            </div>
          ) : (
            comments.map((comment, index) => (
              <div key={index} style={{ marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{comment.nickname}：</span>
                <span>{comment.content}</span>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
            placeholder="说点什么..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 24,
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              outline: 'none'
            }}
          />
          <button
            onClick={() => setShowGiftPanel(true)}
            style={{
              padding: '12px 20px',
              borderRadius: 24,
              border: 'none',
              background: 'var(--secondary)',
              color: 'white',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            🎁
          </button>
          <button
            onClick={handleSendComment}
            className="btn btn-primary"
            style={{ padding: '12px 20px', borderRadius: 24 }}
          >
            发送
          </button>
        </div>
      </div>

      {showGiftPanel && (
        <>
          <div
            onClick={() => setShowGiftPanel(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 400
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '20px 20px 0 0',
            padding: 20,
            zIndex: 401
          }}>
            <h3 style={{ marginBottom: 16, textAlign: 'center' }}>送礼物</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: 12,
                    border: '1px solid var(--gray-200)',
                    borderRadius: 12,
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: 28 }}>{gift.icon}</span>
                  <span style={{ fontSize: 12 }}>{gift.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--gray-500)' }}>¥{gift.price}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowGiftPanel(false)}
              className="btn"
              style={{ width: '100%', background: 'var(--gray-100)' }}
            >
              取消
            </button>
          </div>
        </>
      )}
    </div>
  );
}
