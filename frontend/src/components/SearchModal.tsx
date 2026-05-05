import React, { useState, useCallback } from 'react';
import { userApi, friendApi } from '@/services/api';
import { useFriendStore } from '@/store';
import { User, SearchUsersParams } from '@/types';

interface SearchModalProps {
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
  const { setFriends } = useFriendStore();
  const [searchParams, setSearchParams] = useState<SearchUsersParams>({
    qqNumber: '',
    nickname: '',
    age: undefined,
    gender: undefined
  });
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);

  const refreshFriends = async () => {
    try {
      const result = await friendApi.getFriends();
      if (result.success && result.data) {
        setFriends(result.data);
      }
    } catch (err) {
      console.error('Failed to refresh friends:', err);
    }
  };

  const handleSearch = useCallback(async () => {
    const hasParams = searchParams.qqNumber?.trim() || searchParams.nickname?.trim() || searchParams.age || searchParams.gender;
    
    if (!hasParams) {
      setError('请输入至少一个搜索条件');
      return;
    }
    
    if (searchParams.qqNumber && !/^\d{1,10}$/.test(searchParams.qqNumber)) {
      setError('QQ号必须是数字');
      return;
    }
    
    setSearching(true);
    setError('');
    setHasSearched(true);
    
    try {
      const params: SearchUsersParams = {};
      if (searchParams.qqNumber?.trim()) {
        params.qqNumber = searchParams.qqNumber.trim();
      }
      if (searchParams.nickname?.trim()) {
        params.nickname = searchParams.nickname.trim();
      }
      if (searchParams.age) {
        params.age = searchParams.age;
      }
      if (searchParams.gender && searchParams.gender !== 'unknown') {
        params.gender = searchParams.gender;
      }
      
      const result = await userApi.searchUsers(params);
      
      if (result.success && result.data) {
        setSearchResults(result.data.users);
      } else {
        setError(result.message || '搜索失败');
      }
    } catch (err) {
      setError('搜索失败，请稍后重试');
    } finally {
      setSearching(false);
    }
  }, [searchParams]);

  const handleAddFriend = async (user: User) => {
    setAddingFriend(user.id);
    setError('');
    
    try {
      const result = await friendApi.addFriend({
        targetQQNumber: user.qqNumber,
        message: '你好，我想加你为好友'
      });
      
      if (result.success) {
        setError('');
        const data = result.data as { status: string; message?: string };
        if (data.status === 'accepted') {
          await refreshFriends();
          alert(`已成功添加 ${user.nickname} 为好友！`);
        } else {
          alert('好友请求已发送，等待对方验证！');
        }
      } else {
        setError(result.message || '添加失败');
      }
    } catch (err) {
      setError('添加失败，请稍后重试');
    } finally {
      setAddingFriend(null);
    }
  };

  const handleQuickAdd = async () => {
    if (!searchParams.qqNumber?.trim()) {
      setError('请输入QQ号');
      return;
    }
    
    if (!/^\d{5,10}$/.test(searchParams.qqNumber.trim())) {
      setError('QQ号必须是5-10位数字');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await friendApi.addFriend({
        targetQQNumber: searchParams.qqNumber.trim(),
        message: '你好，我想加你为好友'
      });
      
      if (result.success) {
        const data = result.data as { status: string; message?: string };
        if (data.status === 'accepted') {
          await refreshFriends();
          alert('已成功添加为好友！');
        } else {
          alert('好友请求已发送，等待对方验证！');
        }
      } else {
        setError(result.message || '添加失败');
      }
    } catch (err) {
      setError('添加失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || undefined : value || undefined
    }));
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">搜索或添加好友</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="profile-section" style={{ marginBottom: '16px' }}>
            <div className="profile-section-title">快速添加（按QQ号）</div>
            <div className="flex gap-12" style={{ marginTop: '12px' }}>
              <input
                type="text"
                name="qqNumber"
                className="form-input"
                placeholder="输入QQ号直接添加"
                value={searchParams.qqNumber || ''}
                onChange={handleInputChange}
                style={{ marginBottom: 0, flex: 1 }}
              />
              <button
                type="button"
                className="chat-button primary"
                onClick={handleQuickAdd}
                disabled={loading}
              >
                {loading ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="profile-section">
            <div className="profile-section-title">搜索用户</div>
            
            <div className="profile-row">
              <label className="profile-label">QQ号</label>
              <input
                type="text"
                name="qqNumber"
                className="form-input"
                placeholder="输入QQ号"
                value={searchParams.qqNumber || ''}
                onChange={handleInputChange}
                style={{ marginBottom: 0, flex: 1 }}
              />
            </div>
            
            <div className="profile-row">
              <label className="profile-label">昵称</label>
              <input
                type="text"
                name="nickname"
                className="form-input"
                placeholder="输入昵称"
                value={searchParams.nickname || ''}
                onChange={handleInputChange}
                style={{ marginBottom: 0, flex: 1 }}
              />
            </div>
            
            <div className="profile-row">
              <label className="profile-label">年龄</label>
              <input
                type="number"
                name="age"
                className="form-input"
                placeholder="选填"
                value={searchParams.age || ''}
                onChange={handleInputChange}
                min={1}
                max={150}
                style={{ marginBottom: 0, flex: 1 }}
              />
            </div>
            
            <div className="profile-row">
              <label className="profile-label">性别</label>
              <select
                name="gender"
                className="form-select"
                value={searchParams.gender || ''}
                onChange={handleInputChange}
                style={{ marginBottom: 0, flex: 1 }}
              >
                <option value="">全部</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
          </div>
          
          <div className="modal-footer" style={{ padding: '0 0 16px 0', borderTop: 'none' }}>
            <button
              type="button"
              className="chat-button primary"
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? '搜索中...' : '搜索'}
            </button>
          </div>
          
          {error && <div className="error-message" style={{ marginBottom: '12px' }}>{error}</div>}
          
          {hasSearched && (
            <div className="search-results" style={{ padding: 0 }}>
              {searchResults.length === 0 ? (
                <div className="no-results">
                  未找到符合条件的用户
                </div>
              ) : (
                searchResults.map(user => (
                  <div 
                    key={user.id} 
                    className="search-result-item"
                    style={{ padding: '12px 0' }}
                  >
                    <img 
                      className="avatar avatar-small" 
                      src={user.avatar} 
                      alt={user.nickname}
                    />
                    <div className="search-result-info">
                      <div className="search-result-name">{user.nickname}</div>
                      <div className="search-result-detail">
                        QQ: {user.qqNumber}
                        {user.gender !== 'unknown' && ` · ${user.gender === 'male' ? '男' : '女'}`}
                        {user.age > 0 && ` · ${user.age}岁`}
                      </div>
                    </div>
                    <button
                      className="chat-button primary"
                      onClick={() => handleAddFriend(user)}
                      disabled={addingFriend === user.id}
                    >
                      {addingFriend === user.id ? '添加中...' : '添加'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
