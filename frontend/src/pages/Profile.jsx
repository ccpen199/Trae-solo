import React, { useState, useEffect } from 'react';
import {
  Settings, Camera, Edit, Crown, Gift, Heart, Users,
  ChevronRight, LogOut, Calendar, Coins, Star
} from 'lucide-react';
import api from '../utils/api';
import useStore from '../store';

function Profile() {
  const { user, logout } = useStore();
  const [profile, setProfile] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [todayPoints, setTodayPoints] = useState(0);

  useEffect(() => {
    if (user) {
      setProfile(user);
    }
  }, [user]);

  const handleCheckIn = async () => {
    try {
      const response = await api.post('/checkin');
      if (response.data.success) {
        setCheckedIn(true);
        setTodayPoints(response.data.data.points || 10);
      }
    } catch (err) {
      console.error('签到失败');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (!profile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <p style={{ color: '#999' }}>加载中...</p>
      </div>
    );
  }

  const menuItems = [
    { icon: Crown, label: 'VIP特权', badge: '升级', color: '#ffd700' },
    { icon: Coins, label: '我的映币', value: `${profile?.coins || 0}`, color: '#ff4757' },
    { icon: Gift, label: '礼物记录', color: '#ff6b81' },
    { icon: Users, label: '我的关注', color: '#667eea' },
    { icon: Heart, label: '我的粉丝', color: '#764ba2' },
    { icon: Star, label: '我的等级', value: `Lv.${profile?.level || 1}`, color: '#12b7f5' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 }}>
      <div style={{
        background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
        padding: '50px 20px 30px',
        color: 'white',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 50,
          right: 20
        }}>
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}>
            <Settings size={24} color="white" />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <Camera size={28} color="white" style={{ opacity: 0.7 }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{profile?.nickname || '用户'}</h2>
              {profile?.vip_level > 0 && (
                <span style={{
                  background: 'rgba(255,215,0,0.3)',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 11
                }}>
                  VIP{profile.vip_level}
                </span>
              )}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.8 }}>
              ID: {profile?.id || '100000'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>
              {profile?.signature || '这个人很懒，什么都没写'}
            </p>
          </div>

          <button style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 20,
            color: 'white',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <Edit size={14} />
            编辑
          </button>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: 30,
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{profile?.following || 0}</p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>关注</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{profile?.followers || 0}</p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>粉丝</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>0</p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>获赞</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calendar size={24} color="#ff4757" />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>每日签到</p>
              <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
                {checkedIn ? `已获得${todayPoints}积分` : '签到领取积分奖励'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={checkedIn}
            style={{
              padding: '8px 20px',
              background: checkedIn ? '#ccc' : 'linear-gradient(135deg, #ff4757, #ff6b81)',
              color: 'white',
              border: 'none',
              borderRadius: 20,
              fontSize: 13,
              cursor: checkedIn ? 'not-allowed' : 'pointer'
            }}
          >
            {checkedIn ? '已签到' : '去签到'}
          </button>
        </div>

        <div style={{
          background: 'white',
          borderRadius: 12,
          overflow: 'hidden'
        }}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderBottom: index < menuItems.length - 1 ? '1px solid #f5f5f5' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${item.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <item.icon size={20} color={item.color} />
              </div>
              <span style={{ flex: 1, marginLeft: 12, fontSize: 14 }}>{item.label}</span>
              {item.value && (
                <span style={{ fontSize: 14, color: '#666', marginRight: 8 }}>{item.value}</span>
              )}
              {item.badge && (
                <span style={{
                  background: '#ff4757',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 11,
                  marginRight: 8
                }}>
                  {item.badge}
                </span>
              )}
              <ChevronRight size={18} color="#ccc" />
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            marginTop: 20,
            padding: '14px',
            background: 'white',
            color: '#ff4757',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <LogOut size={18} />
          退出登录
        </button>
      </div>
    </div>
  );
}

export default Profile;
