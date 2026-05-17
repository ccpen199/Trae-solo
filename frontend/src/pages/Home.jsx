import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { roomApi, movieApi } from '../api';
import useStore from '../store';
import Loading from '../components/Loading';

const Home = () => {
  const navigate = useNavigate();
  const { showError, showInfo } = useToast();
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [movies, setMovies] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [filterGender, setFilterGender] = useState('any');
  const [activeTag, setActiveTag] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const interestTags = ['爱情', '科幻', '悬疑', '喜剧', '恐怖', '动作', '动画', '纪录片'];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [roomsRes, moviesRes] = await Promise.all([
        roomApi.getRooms({ room_type: 'multi' }),
        movieApi.getHotMovies()
      ]);
      setRooms(roomsRes.data?.rooms || []);
      setMovies(moviesRes.data?.movies || []);
    } catch (error) {
      showError(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (room) => {
    try {
      await roomApi.joinRoom(room.id, room.password);
      navigate(`/room/${room.id}`);
    } catch (error) {
      showError(error.message || '加入房间失败');
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Loading text="加载中..." />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>微光</h1>
          <p style={styles.greeting}>你好，{user?.nickname || '用户'}</p>
        </div>
        <div style={styles.avatar}>{user?.nickname?.charAt(0) || '👤'}</div>
      </div>

      <div style={styles.actionCards}>
        <div style={styles.actionCard} onClick={() => navigate('/create-room')}>
          <span style={styles.actionIcon}>🎬</span>
          <span style={styles.actionText}>创建房间</span>
        </div>
        <div style={styles.actionCard}>
          <span style={styles.actionIcon}>💕</span>
          <span style={styles.actionText}>1v1匹配</span>
        </div>
        <div style={styles.actionCard} onClick={() => navigate('/chat')}>
          <span style={styles.actionIcon}>💬</span>
          <span style={styles.actionText}>私聊</span>
        </div>
        <div style={styles.actionCard} onClick={() => navigate('/profile')}>
          <span style={styles.actionIcon}>👤</span>
          <span style={styles.actionText}>我的</span>
        </div>
      </div>

      <div style={styles.searchBox}>
        <input
          style={styles.searchInput}
          placeholder="搜索房间或影片..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <span style={styles.searchIcon}>🔍</span>
        <button style={styles.refreshBtn} onClick={loadData}>🔄</button>
      </div>

      <div style={styles.tags}>
        {interestTags.map(tag => (
          <button 
            key={tag} 
            style={activeTag === tag ? styles.tagActive : styles.tag}
            onClick={() => {
              const newTag = activeTag === tag ? null : tag;
              setActiveTag(newTag);
              if (newTag) {
                showInfo(`已选择${tag}标签`);
              } else {
                showInfo(`已取消${tag}筛选`);
              }
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div style={styles.sectionTabs}>
        <button
          style={{ ...styles.sectionTab, ...(activeTab === 'rooms' ? styles.sectionTabActive : {}) }}
          onClick={() => setActiveTab('rooms')}
        >
          放映厅
        </button>
        <button
          style={{ ...styles.sectionTab, ...(activeTab === 'movies' ? styles.sectionTabActive : {}) }}
          onClick={() => setActiveTab('movies')}
        >
          热门影片
        </button>
      </div>

      {activeTab === 'rooms' && (
        <>
          <div style={styles.filters}>
            <button
              style={{ ...styles.filterBtn, ...(filterGender === 'any' ? styles.filterBtnActive : {}) }}
              onClick={() => setFilterGender('any')}
            >
              全部
            </button>
            <button
              style={{ ...styles.filterBtn, ...(filterGender === 'male' ? styles.filterBtnActive : {}) }}
              onClick={() => setFilterGender('male')}
            >
              男生
            </button>
            <button
              style={{ ...styles.filterBtn, ...(filterGender === 'female' ? styles.filterBtnActive : {}) }}
              onClick={() => setFilterGender('female')}
            >
              女生
            </button>
          </div>

          <div style={styles.roomList}>
            {rooms.length === 0 ? (
              <div style={styles.empty}>
                <p>暂无房间，快去创建一个吧！</p>
              </div>
            ) : (
              rooms.map(room => (
                <div key={room.id} style={styles.roomCard} onClick={() => handleJoinRoom(room)}>
                  <div style={styles.roomHeader}>
                    <span style={styles.roomType}>{room.room_type === '1v1' ? '1v1' : '多人'}</span>
                    <span style={styles.roomName}>{room.room_name}</span>
                  </div>
                  <div style={styles.roomInfo}>
                    <span>🎬 {room.current_movie_title || '选择影片'}</span>
                    <span>👥 {room.member_count || 1}人</span>
                  </div>
                  <div style={styles.roomOwner}>
                    <span>房主：{room.owner_name || '未知'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'movies' && (
        <div style={styles.movieList}>
          {movies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p>暂无影片数据</p>
            </div>
          ) : (
            movies.map(movie => (
              <div key={movie.id} style={styles.movieCard}>
                <div style={styles.moviePoster}>{'🎬'}</div>
                <div style={styles.movieInfo}>
                  <h4 style={styles.movieTitle}>{movie.title}</h4>
                  <p style={styles.movieMeta}>⭐ {movie.rating || 0} | {movie.tags || '未知'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    paddingBottom: '100px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    color: 'white',
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '4px'
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px'
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  actionCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px'
  },
  actionCard: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '16px',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  actionIcon: {
    fontSize: '28px'
  },
  actionText: {
    fontSize: '12px',
    color: '#333',
    fontWeight: '500'
  },
  searchBox: {
    position: 'relative',
    marginBottom: '16px'
  },
  searchInput: {
    width: '100%',
    padding: '16px 52px 16px 48px',
    borderRadius: '16px',
    border: 'none',
    fontSize: '14px',
    outline: 'none',
    background: 'rgba(255,255,255,0.95)'
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '20px'
  },
  refreshBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '20px'
  },
  tag: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none'
  },
  tagActive: {
    background: 'white',
    color: '#667eea',
    fontWeight: '500'
  },
  sectionTabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px'
  },
  sectionTab: {
    padding: '10px 24px',
    borderRadius: '12px',
    border: 'none',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer'
  },
  sectionTabActive: {
    background: 'white',
    color: '#667eea',
    fontWeight: '600'
  },
  filters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  },
  filterBtn: {
    padding: '6px 16px',
    borderRadius: '20px',
    border: 'none',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    fontSize: '12px',
    cursor: 'pointer'
  },
  filterBtnActive: {
    background: 'white',
    color: '#667eea',
    fontWeight: '500'
  },
  roomList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '16px'
  },
  roomCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '16px',
    cursor: 'pointer'
  },
  roomHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  roomType: {
    padding: '4px 10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px'
  },
  roomName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  roomInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px'
  },
  roomOwner: {
    fontSize: '12px',
    color: '#999'
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: 'white',
    fontSize: '14px'
  },
  movieList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'white',
    borderRadius: '16px',
    padding: '16px'
  },
  movieCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  moviePoster: {
    width: '60px',
    height: '80px',
    background: '#f5f5f5',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  movieInfo: {
    flex: 1
  },
  movieTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  movieMeta: {
    fontSize: '12px',
    color: '#999'
  }
};

export default Home;
