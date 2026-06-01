import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingApi, controlApi } from '../api';

const MeetingRoomPage = () => {
  const { meetingNumber } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadMeetingData();
    const interval = setInterval(loadMeetingData, 3000);
    return () => clearInterval(interval);
  }, [meetingNumber]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadMeetingData = async () => {
    try {
      const data = await meetingApi.getMeeting(meetingNumber);
      setMeeting(data.meeting);
      setParticipants(data.participants || []);
      setMessages(data.messages || []);
      setIsHost(data.is_host || false);
      setWaitingRoomEnabled(data.meeting.waiting_room_enabled === 1 || data.meeting.waiting_room_enabled === true);
      setIsScreenSharing(data.meeting.is_sharing === 1 || data.meeting.is_sharing === true);
      setIsRecording(data.meeting.is_recording === 1 || data.meeting.is_recording === true);
      setWaitingParticipants(data.waiting_participants || []);

      const myParticipant = data.participants?.find(p => p.is_current_user || p.user_id);
      if (myParticipant) {
        setIsAudioEnabled(myParticipant.audio_enabled !== 0);
        setIsVideoEnabled(myParticipant.video_enabled !== 0);
      }
    } catch (error) {
      console.error('Failed to load meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAudio = async () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    try {
      await controlApi.toggleAudio(meetingNumber, newState);
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  };

  const handleToggleVideo = async () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    try {
      await controlApi.toggleVideo(meetingNumber, newState);
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await controlApi.sendMessage(meetingNumber, newMessage.trim());
      setNewMessage('');
      loadMeetingData();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEndMeeting = async () => {
    if (!window.confirm('确定要结束会议吗？')) return;
    try {
      await controlApi.endMeeting(meetingNumber);
      navigate('/');
    } catch (error) {
      alert('结束会议失败');
    }
  };

  const handleLeaveMeeting = async () => {
    try {
      await controlApi.leaveMeeting(meetingNumber);
      navigate('/');
    } catch (error) {
      alert('离开会议失败');
    }
  };

  const handleMuteAll = async () => {
    try {
      await controlApi.muteAll(meetingNumber);
      loadMeetingData();
    } catch (error) {
      alert('全员静音失败');
    }
  };

  const handleMuteParticipant = async (participantId, mute) => {
    try {
      if (mute) {
        await controlApi.muteParticipant(meetingNumber, participantId);
      } else {
        await controlApi.unmuteParticipant(meetingNumber, participantId);
      }
      loadMeetingData();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!window.confirm('确定要移除该参会者吗？')) return;
    try {
      await controlApi.removeParticipant(meetingNumber, participantId);
      loadMeetingData();
    } catch (error) {
      alert('移除失败');
    }
  };

  const handleAdmitParticipant = async (participantId) => {
    try {
      await controlApi.admitParticipant(meetingNumber, participantId);
      loadMeetingData();
    } catch (error) {
      alert('准入失败');
    }
  };

  const handleAdmitAll = async () => {
    try {
      await controlApi.admitAll(meetingNumber);
      loadMeetingData();
    } catch (error) {
      alert('准入失败');
    }
  };

  const handleToggleRecording = async () => {
    try {
      await controlApi.toggleRecording(meetingNumber, !isRecording);
      setIsRecording(!isRecording);
    } catch (error) {
      alert('录制控制失败: ' + error.message);
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      await controlApi.toggleScreenShare(meetingNumber, !isScreenSharing);
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      alert('屏幕共享控制失败: ' + error.message);
    }
  };

  const handleToggleWaitingRoom = async () => {
    try {
      await controlApi.toggleWaitingRoom(meetingNumber, !waitingRoomEnabled);
      setWaitingRoomEnabled(!waitingRoomEnabled);
    } catch (error) {
      alert('等候室控制失败');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '20px' }}>加载中...</div>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div style={{ fontSize: '18px', marginBottom: '20px' }}>会议不存在</div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 24px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a2e' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        background: '#16213e',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{meeting.title}</h2>
          <span style={{ fontSize: '14px', opacity: 0.7 }}>会议号: {meeting.meeting_number}</span>
          {isRecording && (
            <span style={{
              background: '#ef4444',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
            }}>
              🔴 录制中
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px' }}>
            👥 {participants.length} 人
          </span>
          {waitingParticipants.length > 0 && (
            <span style={{
              background: '#f59e0b',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
            }}>
              ⏳ {waitingParticipants.length} 等候中
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative', padding: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(participants.length, 2) === 1 ? 1 : 2}, 1fr)`,
            gap: '16px',
            height: '100%',
          }}>
            {participants.map((p, index) => (
              <div
                key={index}
                style={{
                  background: '#2d3a5a',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  position: 'relative',
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#4a5568',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  marginBottom: '12px',
                }}>
                  {(p.nickname || p.username || '用户').charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>
                  {p.nickname || p.username || '用户'}
                  {p.role === 'host' && ' 👑'}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  display: 'flex',
                  gap: '8px',
                }}>
                  {p.is_audio_muted === 1 || p.audio_enabled === 0 ? <span>🔇</span> : <span>🔊</span>}
                  {p.video_enabled === 0 && <span>📵</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {showParticipants && (
          <div style={{
            width: '300px',
            background: '#16213e',
            borderLeft: '1px solid #2d3a5a',
            padding: '20px',
            color: 'white',
            overflowY: 'auto',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
              参会者 ({participants.length})
            </h3>

            {waitingParticipants.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}>
                  <span style={{ color: '#f59e0b', fontSize: '14px' }}>
                    等候室 ({waitingParticipants.length})
                  </span>
                  {isHost && (
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                      onClick={handleAdmitAll}
                    >
                      全部准入
                    </button>
                  )}
                </div>
                {waitingParticipants.map((p, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#2d3a5a',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}>
                    <span>{p.nickname || '访客'}</span>
                    {isHost && (
                      <button
                        style={{
                          background: '#10b981',
                          border: 'none',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                        onClick={() => handleAdmitParticipant(p.id)}
                      >
                        准入
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              {participants.map((p, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#2d3a5a',
                  borderRadius: '8px',
                  marginBottom: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{(p.nickname || p.username || '用户')}</span>
                    {p.role === 'host' && <span>👑</span>}
                    {p.is_audio_muted === 1 || p.audio_enabled === 0 ? <span>🔇</span> : <span>🔊</span>}
                  </div>
                  {isHost && p.role !== 'host' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: p.is_audio_muted ? '#10b981' : '#ef4444',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                        onClick={() => handleMuteParticipant(p.id, !p.is_audio_muted)}
                      >
                        {p.is_audio_muted ? '🔊' : '🔇'}
                      </button>
                      <button
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                        onClick={() => handleRemoveParticipant(p.id)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showChat && (
          <div style={{
            width: '320px',
            background: '#16213e',
            borderLeft: '1px solid #2d3a5a',
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              padding: '20px 20px 16px',
              margin: 0,
              borderBottom: '1px solid #2d3a5a',
            }}>
              聊天
            </h3>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: '40px', opacity: 0.6 }}>
                  暂无聊天消息
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#60a5fa' }}>
                        {msg.nickname || msg.username || '访客'}
                      </span>
                      <span style={{ fontSize: '11px', opacity: 0.5 }}>
                        {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{
                      background: '#2d3a5a',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} style={{
              padding: '16px',
              borderTop: '1px solid #2d3a5a',
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="输入消息..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    background: '#2d3a5a',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#60a5fa',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  ➤
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        padding: '20px',
        background: '#16213e',
      }}>
        <button
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: isAudioEnabled ? '#2d3a5a' : '#ef4444',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
          }}
          onClick={handleToggleAudio}
        >
          {isAudioEnabled ? '🎤' : '🔇'}
        </button>

        <button
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: isVideoEnabled ? '#2d3a5a' : '#ef4444',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
          }}
          onClick={handleToggleVideo}
        >
          {isVideoEnabled ? '📹' : '📵'}
        </button>

        <button
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: showParticipants ? '#60a5fa' : '#2d3a5a',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
          }}
          onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
        >
          👥
        </button>

        <button
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: showChat ? '#60a5fa' : '#2d3a5a',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
          }}
          onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
        >
          💬
        </button>

        {isHost && (
          <>
            <button
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: 'none',
                background: isScreenSharing ? '#10b981' : '#2d3a5a',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
              }}
              onClick={handleToggleScreenShare}
            >
              🖥
            </button>

            <button
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: 'none',
                background: isRecording ? '#ef4444' : '#2d3a5a',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
              }}
              onClick={handleToggleRecording}
            >
              ⏺
            </button>

            <button
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: 'none',
                background: waitingRoomEnabled ? '#f59e0b' : '#2d3a5a',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
              }}
              onClick={handleToggleWaitingRoom}
              title="等候室"
            >
              ⏳
            </button>

            <button
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: 'none',
                background: '#2d3a5a',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
              }}
              onClick={handleMuteAll}
              title="全员静音"
            >
              🔇
            </button>
          </>
        )}

        <button
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#ef4444',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
          }}
          onClick={isHost ? handleEndMeeting : handleLeaveMeeting}
          title={isHost ? '结束会议' : '离开会议'}
        >
          📞
        </button>
      </div>
    </div>
  );
};

export default MeetingRoomPage;
