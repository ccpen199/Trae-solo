import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { eventAPI } from '../api/client';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      const data = await eventAPI.get(id);
      setEvent(data);
    } catch (e) {
      console.error('Load event failed:', e);
    }
  };

  const getStatusClass = (status) => {
    const map = {
      onsale: 'status-onsale',
      presale: 'status-presale',
      seckill: 'status-seckill',
      soldout: 'status-soldout',
    };
    return map[status] || '';
  };

  const getStatusLabel = (status) => {
    const map = {
      onsale: '售票中',
      presale: '预售',
      seckill: '秒杀',
      soldout: '已售罄',
    };
    return map[status] || status;
  };

  if (!event) return <div>加载中...</div>;

  return (
    <div className="detail-page">
      <div className="detail-header">
        <img
          src={event.poster_url || 'https://picsum.photos/400/500'}
          alt={event.title}
          className="detail-poster"
        />
        <div className="detail-info">
          <h1>{event.title}</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>{event.description}</p>
          <p>类型：{event.type === 'concert' ? '演唱会' : event.type === 'performance' ? '演出' : event.type === 'exhibition' ? '展览' : '亲子'}</p>
          <p>时长：{event.duration} 分钟</p>
          <p>场次数量：{event.sessions?.length || 0} 场</p>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>选择场次</h2>
      <div className="sessions-list">
        {event.sessions?.map((session) => (
          <div
            key={session.id}
            className="session-item"
            onClick={() => navigate(`/session/${session.id}/select-seat`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{dayjs(session.start_time).format('YYYY年MM月DD日 HH:mm')}</strong>
                <span style={{ marginLeft: '1rem', color: '#666' }}>
                  {session.venue_name} - {session.city}
                </span>
              </div>
              <span className={`status-badge ${getStatusClass(session.status)}`}>
                {getStatusLabel(session.status)}
              </span>
            </div>
            <div style={{ marginTop: '0.5rem', color: '#666' }}>
              已售 {session.sold_count} / {session.total_inventory} 张
              {session.is_seckill && <span style={{ color: '#dc3545', marginLeft: '1rem' }}>⚡ 秒杀场</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventDetail;
