import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { roomApi, movieApi } from '../api';
import Loading from '../components/Loading';

const CreateRoom = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState({
    room_type: 'multi',
    room_name: '',
    is_public: true,
    password: '',
    max_members: 8,
    filter_gender: 'any',
    movie_id: null,
    movie_title: ''
  });

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const response = await movieApi.getMovies({});
      setMovies(response.data?.movies || []);
    } catch (error) {
      showError(error.message || '加载影片失败');
    }
  };

  const handleCreate = async () => {
    if (!form.room_name.trim()) {
      showError('请输入房间名称');
      return;
    }

    setLoading(true);
    try {
      const response = await roomApi.createRoom(form);
      showSuccess('房间创建成功');
      navigate(`/room/${response.data.room.id}`);
    } catch (error) {
      showError(error.message || '创建房间失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Loading text="创建中..." />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <h1 style={styles.title}>创建房间</h1>
        <div style={{ width: '32px' }} />
      </div>

      <div style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>房间类型</label>
          <div style={styles.typeSelect}>
            <button
              style={{ ...styles.typeBtn, ...(form.room_type === 'multi' ? styles.typeBtnActive : {}) }}
              onClick={() => setForm({ ...form, room_type: 'multi' })}
            >
              多人房间
            </button>
            <button
              style={{ ...styles.typeBtn, ...(form.room_type === '1v1' ? styles.typeBtnActive : {}) }}
              onClick={() => setForm({ ...form, room_type: '1v1' })}
            >
              1v1房间
            </button>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>房间名称</label>
          <input
            style={styles.input}
            placeholder="给房间起个名字吧"
            value={form.room_name}
            onChange={(e) => setForm({ ...form, room_name: e.target.value })}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>公开设置</label>
          <div style={styles.typeSelect}>
            <button
              style={{ ...styles.typeBtn, ...(form.is_public ? styles.typeBtnActive : {}) }}
              onClick={() => setForm({ ...form, is_public: true })}
            >
              公开
            </button>
            <button
              style={{ ...styles.typeBtn, ...(!form.is_public ? styles.typeBtnActive : {}) }}
              onClick={() => setForm({ ...form, is_public: false })}
            >
              私密
            </button>
          </div>
        </div>

        {!form.is_public && (
          <div style={styles.formGroup}>
            <label style={styles.label}>房间密码</label>
            <input
              style={styles.input}
              placeholder="设置房间密码"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        )}

        {form.room_type === '1v1' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>性别筛选</label>
            <div style={styles.typeSelect}>
              {['any', 'male', 'female'].map(gender => (
                <button
                  key={gender}
                  style={{ ...styles.typeBtn, ...(form.filter_gender === gender ? styles.typeBtnActive : {}) }}
                  onClick={() => setForm({ ...form, filter_gender: gender })}
                >
                  {gender === 'any' ? '不限' : gender === 'male' ? '男生' : '女生'}
                </button>
              ))}
            </div>
          </div>
        )}

        {form.room_type === 'multi' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>最大人数</label>
            <div style={styles.typeSelect}>
              {[4, 6, 8, 10].map(num => (
                <button
                  key={num}
                  style={{ ...styles.typeBtn, ...(form.max_members === num ? styles.typeBtnActive : {}) }}
                  onClick={() => setForm({ ...form, max_members: num })}
                >
                  {num}人
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>选择影片</label>
          <div style={styles.movieList}>
            {movies.map(movie => (
              <div
                key={movie.id}
                style={{ ...styles.movieItem, ...(form.movie_id === movie.id ? styles.movieItemActive : {}) }}
                onClick={() => setForm({ ...form, movie_id: movie.id, movie_title: movie.title })}
              >
                <span style={styles.movieIcon}>🎬</span>
                <span style={styles.movieName}>{movie.title}</span>
              </div>
            ))}
          </div>
        </div>

        <button style={styles.submitBtn} onClick={handleCreate}>
          创建房间
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  backBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer'
  },
  title: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '600'
  },
  form: {
    background: 'white',
    borderRadius: '24px',
    padding: '24px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '12px'
  },
  typeSelect: {
    display: 'flex',
    gap: '8px'
  },
  typeBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: '2px solid #eee',
    background: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  typeBtnActive: {
    borderColor: '#667eea',
    background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
    color: '#667eea',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '2px solid #eee',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  movieList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  movieItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    border: '2px solid #eee',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  movieItemActive: {
    borderColor: '#667eea',
    background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)'
  },
  movieIcon: {
    fontSize: '20px'
  },
  movieName: {
    fontSize: '14px',
    color: '#333'
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px'
  }
};

export default CreateRoom;
