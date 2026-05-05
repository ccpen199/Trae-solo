import React, { useState } from 'react';
import { useFriendStore } from '@/store';
import { friendApi } from '@/services/api';
import { FriendRequest } from '@/types';

interface RequestsModalProps {
  onClose: () => void;
}

const RequestsModal: React.FC<RequestsModalProps> = ({ onClose }) => {
  const { pendingRequests, setPendingRequests, setFriends } = useFriendStore();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

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

  const handleRespond = async (request: FriendRequest, accept: boolean) => {
    setProcessingId(request.id);
    setError('');
    
    try {
      const result = await friendApi.respondRequest({
        requestId: request.id,
        accept
      });
      
      if (result.success) {
        setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
        
        if (accept) {
          await refreshFriends();
          alert('已成功添加为好友！');
        } else {
          alert('已拒绝好友请求');
        }
      } else {
        setError(result.message || '操作失败');
      }
    } catch (err) {
      setError('操作失败，请稍后重试');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">好友请求</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message" style={{ marginBottom: '12px' }}>{error}</div>}
          
          {pendingRequests.length === 0 ? (
            <div className="no-results">
              暂无好友请求
            </div>
          ) : (
            pendingRequests.map(request => (
              <div 
                key={request.id} 
                className="request-item"
                style={{ padding: '12px 0' }}
              >
                <img 
                  className="avatar avatar-small" 
                  src={request.fromUser?.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20avatar%20icon%20simple%20cartoon&image_size=square'} 
                  alt={request.fromUser?.nickname}
                />
                <div className="request-info">
                  <div className="request-nickname">
                    {request.fromUser?.nickname || '用户'}
                    {request.fromUser?.qqNumber && ` (${request.fromUser.qqNumber})`}
                  </div>
                  {request.message && (
                    <div className="request-message">
                      验证消息：{request.message}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#999', 
                    marginTop: '4px' 
                  }}>
                    {new Date(request.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="request-actions">
                  <button
                    className="action-button accept"
                    onClick={() => handleRespond(request, true)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? '处理中...' : '接受'}
                  </button>
                  <button
                    className="action-button reject"
                    onClick={() => handleRespond(request, false)}
                    disabled={processingId === request.id}
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsModal;
