import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api';
import { useStore } from '../store';
import { useToast } from '../App';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser, needRefreshProfile } = useStore();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ nickname: '', bio: '', avatar: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadProfile();
  }, [user, needRefreshProfile]);

  const loadProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      if (res.data.success) {
        setProfile(res.data.data);
        setEditForm({
          nickname: res.data.data.nickname,
          bio: res.data.data.bio || '',
          avatar: res.data.data.avatar
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.nickname.trim()) {
      showToast('请输入昵称', 'error');
      return;
    }

    try {
      const res = await userAPI.updateProfile(editForm);
      if (res.data.success) {
        showToast('保存成功', 'success');
        setShowEdit(false);
        updateUser(editForm);
        loadProfile();
      } else {
        showToast(res.data.message, 'error');
      }
    } catch (err) {
      showToast('保存失败', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    showToast('已退出登录', 'success');
  };

  if (loading) {
    return (
      <div className="loading" style={{ height: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const displayProfile = profile || user;

  return (
    <div style={{ padding: 16 }}>
      <div className="card" style={{ padding: 24, marginBottom: 20, textAlign: 'center' }}>
        <img
          src={displayProfile?.avatar}
          alt="头像"
          className="avatar"
          style={{ width: 80, height: 80, marginBottom: 16 }}
        />
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          {displayProfile?.nickname}
          {displayProfile?.is_verified && (
            <span style={{ color: 'var(--primary)', marginLeft: 6 }}>✓</span>
          )}
        </h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>{displayProfile?.bio || '这个人很懒，什么都没写'}</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{displayProfile?.followers || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>粉丝</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{displayProfile?.following || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>关注</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>¥{displayProfile?.balance?.toFixed?.(2) || '0.00'}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>余额</div>
          </div>
        </div>

        <button
          onClick={() => setShowEdit(true)}
          className="btn btn-outline"
          style={{ width: '100%' }}
        >
          编辑资料
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚙️</span>
            <span>账号设置</span>
          </div>
          <span style={{ color: 'var(--gray-400)' }}>→</span>
        </div>
        <div
          style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📜</span>
            <span>我的直播</span>
          </div>
          <span style={{ color: 'var(--gray-400)' }}>→</span>
        </div>
        <div
          style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🎁</span>
            <span>收到的礼物</span>
          </div>
          <span style={{ color: 'var(--gray-400)' }}>→</span>
        </div>
        <div
          style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <span>关于我们</span>
          </div>
          <span style={{ color: 'var(--gray-400)' }}>→</span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="btn"
        style={{
          width: '100%',
          marginTop: 20,
          background: 'var(--gray-100)',
          color: 'var(--danger)'
        }}
      >
        退出登录
      </button>

      {showEdit && (
        <>
          <div
            onClick={() => setShowEdit(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 300
            }}
          />
          <div className="card" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 400,
            padding: 24,
            zIndex: 301
          }}>
            <h3 style={{ marginBottom: 20, textAlign: 'center' }}>编辑资料</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>头像链接</label>
              <input
                type="text" className="input" value={editForm.avatar} onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })} placeholder="请输入头像图片链接" />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>昵称</label>
              <input
                type="text" className="input" value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} placeholder="请输入昵称" />
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>简介</label>
              <textarea
                className="input" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="介绍一下自己吧" rows={3} style={{ resize: 'none' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowEdit(false)} className="btn" style={{ flex: 1, background: 'var(--gray-100)' }}>取消</button>
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>保存</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
