import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI } from '../api';
import { useStore } from '../store';
import { useToast } from '../App';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, triggerProfileRefresh } = useStore();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id, user]);

  const loadData = async () => {
    try {
      const res = await userAPI.getUser(id);
      if (res.data.success) {
        setProfile(res.data.data);
      }
      
      if (user) {
        const followRes = await userAPI.getFollowStatus(id);
        if (followRes.data.success) {
          setIsFollowing(followRes.data.data.isFollowing);
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
      navigate('/login', { state: { from: `/user/${id}`, needLogin: true } });
      return;
    }

    try {
      const res = await userAPI.follow(id);
      if (res.data.success) {
        const newFollowing = res.data.data.isFollowing;
        setIsFollowing(newFollowing);
        setProfile(prev => ({
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

  if (loading) {
    return (
      <div className="loading" style={{ height: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        用户不存在
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 20,
          padding: '8px 16px',
          background: 'var(--gray-100)',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        ← 返回
      </button>

      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <img
          src={profile.avatar}
          alt={profile.nickname}
          className="avatar"
          style={{ width: 80, height: 80, marginBottom: 16 }}
        />
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          {profile.nickname}
          {profile.is_verified && (
            <span style={{ color: 'var(--primary)', marginLeft: 6 }}>✓</span>
          )}
        </h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>
          {profile.bio || '这个人很懒，什么都没写'}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.followers || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>粉丝</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.following || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>关注</div>
          </div>
        </div>

        {user && user.id !== parseInt(id) && (
          <button
            onClick={handleFollow}
            className="btn"
            style={{
              width: '100%',
              background: isFollowing ? 'var(--gray-100)' : 'var(--primary)',
              color: isFollowing ? 'var(--gray-600)' : 'white'
            }}
          >
            {isFollowing ? '已关注' : '+ 关注'}
          </button>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>个人成就</h3>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 20 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24 }}>🎬</div>
            <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 4 }}>0 场直播</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24 }}>🎁</div>
            <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 4 }}>0 个礼物</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24 }}>📅</div>
            <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 4 }}>新成员</div>
          </div>
        </div>
      </div>
    </div>
  );
}
