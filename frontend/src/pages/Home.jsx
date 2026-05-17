import { useState, useEffect } from 'react';
import { getNotes } from '../api/notes';
import Loading, { EmptyState } from '../components/Loading';
import './Home.css';

const Home = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortType, setSortType] = useState('recommend');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {
        sort: sortType,
        pageSize: 20,
      };
      if (activeTab === 'video') {
        params.type = 'video';
      }
      const res = await getNotes(params);
      setNotes(res.data?.list || []);
    } catch (err) {
      console.error('Get notes error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [activeTab, sortType]);

  const handleNoteClick = (noteId) => {
    console.log('Click note:', noteId);
  };

  const renderGrid = () => (
    <div className="notes-grid">
      {notes.map((note) => (
      <div 
        key={note.id} 
        className="note-card"
        onClick={() => handleNoteClick(note.id)}
      >
        <div className="note-image">
          {note.images?.[0] ? (
            <img src={note.images[0]} alt="" />
          ) : (
            <div className="note-image-placeholder">📷</div>
          )}
          {note.type === 'video' && (
            <span className="video-badge">▶️</span>
          )}
        </div>
        <div className="note-content">
          <h3 className="note-title">{note.title}</h3>
          <div className="note-stats">
            <span className="stat">❤️ {note.like_count || 0}</span>
            <span className="stat">💬 {note.comment_count || 0}</span>
          </div>
        </div>
      </div>
    ))}
    </div>
  );

  const renderGallery = () => (
    <div className="gallery-grid">
      {notes.map((note) => (
        <div 
          key={note.id} 
          className="gallery-item"
          onClick={() => handleNoteClick(note.id)}
        >
          {note.images?.[0] ? (
            <img src={note.images[0]} alt="" className="gallery-image" />
          ) : (
            <div className="gallery-image-placeholder">📷</div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="home-page">
      <div className="home-header">
      <div className="type-tabs">
        <button
          className={`type-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部
        </button>
        <button
          className={`type-tab ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          视频
        </button>
        <div className="tab-divider">|</div>
        <button
          className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
        >
          📱
        </button>
        <button
          className={`view-btn ${viewMode === 'gallery' ? 'active' : ''}`}
          onClick={() => setViewMode('gallery')}
        >
          🖼️
        </button>
      </div>
      <div className="sort-tabs">
        <button
          className={`sort-tab ${sortType === 'recommend' ? 'active' : ''}`}
          onClick={() => setSortType('recommend')}
        >
          推荐
        </button>
        <button
          className={`sort-tab ${sortType === 'newest' ? 'active' : ''}`}
          onClick={() => setSortType('newest')}
        >
          最新
        </button>
        <button
          className={`sort-tab ${sortType === 'hot' ? 'active' : ''}`}
          onClick={() => setSortType('hot')}
        >
          最热
        </button>
      </div>
      </div>

      <div className="notes-section">
        {loading ? (
          <Loading />
        ) : notes.length === 0 ? (
          <EmptyState message="暂无笔记" />
        ) : viewMode === 'gallery' ? (
          renderGallery()
        ) : (
          renderGrid()
        )}
      </div>
    </div>
  );
};

export default Home;
