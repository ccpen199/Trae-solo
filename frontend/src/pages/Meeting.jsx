import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { meetingAPI } from '../services/api';

export default function Meeting() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [newParticipantName, setNewParticipantName] = useState('');

  useEffect(() => {
    loadParticipants();
    loadSettings();
    const currentUserRole = participants.find(p => p.userId === user?.id);
    setIsHost(currentUserRole?.role === 'host' || participants.length === 1);
  }, [meetingId, user?.id, participants.length]);

  const loadParticipants = async () => {
    try {
      const res = await meetingAPI.getParticipants(meetingId);
      setParticipants(res.data.participants || []);
      const myParticipant = res.data.participants?.find(p => p.userId === user?.id);
      if (myParticipant) {
        setIsHost(myParticipant.role === 'host');
      }
    } catch (e) {
      console.error('加载参与者失败', e);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await meetingAPI.getSettings(meetingId);
      setSettings(res.data.settings);
    } catch (e) {
      console.error('加载设置失败', e);
    }
  };

  const handleMuteParticipant = async (participantId) => {
    try {
      await meetingAPI.manageParticipant(meetingId, participantId, { action: 'mute' });
      loadParticipants();
    } catch (e) {
      console.error('静音失败', e);
    }
  };

  const handleAdmitParticipant = async (participantId) => {
    try {
      await meetingAPI.manageParticipant(meetingId, participantId, { action: 'admit' });
      loadParticipants();
    } catch (e) {
      console.error('准入失败', e);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    try {
      await meetingAPI.manageParticipant(meetingId, participantId, { action: 'remove' });
      loadParticipants();
    } catch (e) {
      console.error('移除失败', e);
    }
  };

  const handleSetCoHost = async (participantId) => {
    try {
      await meetingAPI.manageParticipant(meetingId, participantId, { action: 'set_cohost' });
      loadParticipants();
    } catch (e) {
      console.error('设置联席主持人失败', e);
    }
  };

  const handleMuteAll = async () => {
    try {
      await meetingAPI.muteAll(meetingId, { allowUnmuteSelf: true });
      loadParticipants();
    } catch (e) {
      console.error('全体静音失败', e);
    }
  };

  const handleEndMeeting = async () => {
    try {
      await meetingAPI.end(meetingId);
      navigate('/');
    } catch (e) {
      console.error('结束会议失败', e);
    }
  };

  const handleUpdateSetting = async (key, value) => {
    try {
      await meetingAPI.updateSettings(meetingId, { [key]: value });
      loadSettings();
    } catch (e) {
      console.error('更新设置失败', e);
    }
  };

  const handleInvite = async () => {
    if (!newParticipantName) return;
    try {
      await meetingAPI.invite(meetingId, { name: newParticipantName });
      setNewParticipantName('');
      loadParticipants();
    } catch (e) {
      console.error('邀请失败', e);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1f2937' }}>
      <div style={{ padding: '20px' }}>
        <div className="video-grid">
          {participants.filter(p => p.status === 'joined').map((p) => (
            <div key={p.id} className="video-item">
              <span style={{ fontSize: '48px' }}>{p.name?.charAt(0) || 'U'}</span>
              <div className="name-tag">
                {p.name}
                {p.role === 'host' && <span className="badge badge-host" style={{ marginLeft: '8px' }}>主持人</span>}
                {p.role === 'cohost' && <span className="badge badge-cohost" style={{ marginLeft: '8px' }}>联席</span>}
                {!p.audioEnabled && <span className="badge badge-muted" style={{ marginLeft: '8px' }}>静音</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="control-panel" style={{ justifyContent: 'center' }}>
          <button className="control-btn audio" onClick={() => setAudioEnabled(!audioEnabled)}>
            {audioEnabled ? '🎤 开启' : '🔇 静音'}
          </button>
          <button className="control-btn video" onClick={() => setVideoEnabled(!videoEnabled)}>
            {videoEnabled ? '📹 开启' : '📷 关闭'}
          </button>
          <button className="control-btn" style={{ background: '#f3e8ff', color: '#6b21a8' }} onClick={() => setShowParticipants(!showParticipants)}>
            👥 参与者 ({participants.filter(p => p.status === 'joined').length})
          </button>
          <button className="control-btn" style={{ background: '#fef3c7', color: '#92400e' }} onClick={() => setShowSettings(!showSettings)}>
            ⚙️ 设置
          </button>
          {isHost && (
            <>
              <button className="control-btn" style={{ background: '#dcfce7', color: '#166534' }} onClick={handleMuteAll}>
                🔇 全体静音
              </button>
              <button className="control-btn end" onClick={handleEndMeeting}>
                ❌ 结束会议
              </button>
            </>
          )}
          <button className="control-btn" style={{ background: '#dbeafe', color: '#1e40af' }} onClick={() => navigate('/')}>
            🏠 返回
          </button>
        </div>

        {showParticipants && (
          <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="title" style={{ fontSize: '18px', margin: 0 }}>参与者管理</h3>
              <button onClick={() => setShowParticipants(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>

            {isHost && (
              <div className="flex gap-2 mb-4">
                <input type="text" className="input" placeholder="输入参与者姓名" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} />
                <button className="btn btn-primary" onClick={handleInvite}>邀请</button>
              </div>
            )}

            <div className="participant-list">
              {participants.map((p) => (
                <div key={p.id} className={`participant-item ${p.role} ${p.isInWaitingRoom ? 'waiting' : ''}`}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    {p.isInWaitingRoom && <span className="text-sm" style={{ color: '#f59e0b', marginLeft: '8px' }}>(等候室)</span>}
                  </div>
                  {isHost && p.role !== 'host' && (
                    <div className="flex gap-2">
                      {p.isInWaitingRoom && (
                        <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleAdmitParticipant(p.id)}>准入</button>
                      )}
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleMuteParticipant(p.id)}>静音</button>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleSetCoHost(p.id)}>设联席</button>
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleRemoveParticipant(p.id)}>移除</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showSettings && (
          <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="title" style={{ fontSize: '18px', margin: 0 }}>会议设置</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>

            {isHost ? (
              <>
                <div className="settings-row">
                  <span>锁定会议</span>
                  <label className="switch">
                    <input type="checkbox" checked={settings?.lockEnabled || false} onChange={(e) => handleUpdateSetting('lockEnabled', e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="settings-row">
                  <span>等候室</span>
                  <label className="switch">
                    <input type="checkbox" checked={settings?.waitingRoomEnabled || false} onChange={(e) => handleUpdateSetting('waitingRoomEnabled', e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="settings-row">
                  <span>共享权限</span>
                  <select className="select" value={settings?.sharePermission || 'host_only'} onChange={(e) => handleUpdateSetting('sharePermission', e.target.value)}>
                    <option value="host_only">仅主持人</option>
                    <option value="all">所有人</option>
                  </select>
                </div>
                <div className="settings-row">
                  <span>聊天权限</span>
                  <select className="select" value={settings?.chatPermission || 'all'} onChange={(e) => handleUpdateSetting('chatPermission', e.target.value)}>
                    <option value="host_only">仅主持人</option>
                    <option value="all">所有人</option>
                  </select>
                </div>
                <div className="settings-row">
                  <span>录制权限</span>
                  <select className="select" value={settings?.recordPermission || 'host_only'} onChange={(e) => handleUpdateSetting('recordPermission', e.target.value)}>
                    <option value="host_only">仅主持人</option>
                    <option value="all">所有人</option>
                  </select>
                </div>
                <div className="settings-row">
                  <span>允许解除静音</span>
                  <label className="switch">
                    <input type="checkbox" checked={settings?.allowUnmute || false} onChange={(e) => handleUpdateSetting('allowUnmute', e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="settings-row">
                  <span>红包功能</span>
                  <label className="switch">
                    <input type="checkbox" checked={settings?.redPacketEnabled || false} onChange={(e) => handleUpdateSetting('redPacketEnabled', e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="settings-row">
                  <span>音频增强</span>
                  <label className="switch">
                    <input type="checkbox" checked={settings?.audioEnhance || false} onChange={(e) => handleUpdateSetting('audioEnhance', e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="settings-row">
                  <span>视频增强</span>
                  <label className="switch">
                    <input type="checkbox" checked={settings?.videoEnhance || false} onChange={(e) => handleUpdateSetting('videoEnhance', e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </>
            ) : (
              <p className="text-gray text-center">只有主持人可以修改设置</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
