import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Crown, Settings, LogOut, PlusCircle, X, Loader2, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { communitiesApi } from '../lib/api';
import { Avatar } from '../components/Avatar';
import type { Community, CommunityMember, AvatarConfig } from '../types';
import dayjs from 'dayjs';

const defaultAvatar: AvatarConfig = {
  skinColor: '#FFDBB4',
  hairStyle: 'style1',
  hairColor: '#4A4A4A',
  eyeStyle: 'style1',
  outfit: 'casual',
};

export const Communities: React.FC = () => {
  const { user, communities, setCommunities, showToast } = useStore();
  
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  
  const loadCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await communitiesApi.getList(20, 0);
      if (response.success && response.data) {
        const data = response.data as { communities: Community[] };
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error('Load communities error:', error);
    } finally {
      setLoading(false);
    }
  }, [setCommunities]);
  
  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);
  
  const loadCommunityDetail = useCallback(async (community: Community) => {
    setSelectedCommunity(community);
    setLoadingMembers(true);
    try {
      const response = await communitiesApi.get(community.id);
      if (response.success && response.data) {
        const data = response.data as { community: Community; members: CommunityMember[] };
        setCommunityMembers(data.members || []);
        setSelectedCommunity(data.community);
      }
    } catch (error) {
      console.error('Load community detail error:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, []);
  
  const handleCreateCommunity = useCallback(async () => {
    if (!newCommunityName.trim() || creating) return;
    
    setCreating(true);
    try {
      const response = await communitiesApi.create(
        newCommunityName.trim(),
        newCommunityDesc.trim() || undefined
      );
      if (response.success && response.data) {
        showToast('社团创建成功！', 'success');
        setShowCreateModal(false);
        setNewCommunityName('');
        setNewCommunityDesc('');
        loadCommunities();
      } else {
        showToast(response.message || '创建失败', 'error');
      }
    } catch (error) {
      showToast('创建失败，请稍后重试', 'error');
      console.error('Create community error:', error);
    } finally {
      setCreating(false);
    }
  }, [newCommunityName, newCommunityDesc, creating, showToast, loadCommunities]);
  
  const handleJoinCommunity = useCallback(async (community: Community) => {
    setJoiningId(community.id);
    try {
      const response = await communitiesApi.join(community.id);
      if (response.success && response.data) {
        showToast(community.isJoined ? '已加入社团' : '加入成功！', 'success');
        loadCommunities();
        if (selectedCommunity?.id === community.id) {
          loadCommunityDetail({ ...community, isJoined: (response.data as { isJoined: boolean }).isJoined });
        }
      } else {
        showToast(response.message || '操作失败', 'error');
      }
    } catch (error) {
      showToast('操作失败，请稍后重试', 'error');
      console.error('Join community error:', error);
    } finally {
      setJoiningId(null);
    }
  }, [selectedCommunity, showToast, loadCommunities, loadCommunityDetail]);
  
  const handleLeaveCommunity = useCallback(async (community: Community) => {
    setJoiningId(community.id);
    try {
      const response = await communitiesApi.leave(community.id);
      if (response.success && response.data) {
        showToast('已退出社团', 'success');
        loadCommunities();
        if (selectedCommunity?.id === community.id) {
          setSelectedCommunity(null);
        }
      } else {
        showToast(response.message || '操作失败', 'error');
      }
    } catch (error) {
      showToast('操作失败，请稍后重试', 'error');
      console.error('Leave community error:', error);
    } finally {
      setJoiningId(null);
    }
  }, [selectedCommunity, showToast, loadCommunities]);
  
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">创建者</span>;
      case 'admin':
        return <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">管理员</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">虚拟社团空间</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            创建社团
          </button>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-white font-semibold mb-3">社团列表</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            ) : communities.length === 0 ? (
              <div className="card p-6 text-center">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-sm">暂无社团</p>
              </div>
            ) : (
              <div className="space-y-2">
                {communities.map((community) => (
                  <button
                    key={community.id}
                    onClick={() => loadCommunityDetail(community)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      selectedCommunity?.id === community.id
                        ? 'bg-primary-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{community.name}</p>
                        <p className="text-white/50 text-sm">
                          {community.memberCount} 成员
                        </p>
                      </div>
                      {community.isJoined && (
                        <span className="text-green-400 text-xs">已加入</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2">
            {selectedCommunity ? (
              <div className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{selectedCommunity.name}</h2>
                      {getRoleBadge(selectedCommunity.role)}
                    </div>
                    <p className="text-white/50 mt-1">
                      {selectedCommunity.memberCount} 成员 · 创建于 {dayjs(selectedCommunity.createdAt).format('YYYY-MM-DD')}
                    </p>
                    {selectedCommunity.description && (
                      <p className="text-white/70 mt-3">{selectedCommunity.description}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedCommunity.isJoined ? (
                      selectedCommunity.role !== 'owner' ? (
                        <button
                          onClick={() => handleLeaveCommunity(selectedCommunity)}
                          disabled={joiningId === selectedCommunity.id}
                          className="btn-secondary flex items-center gap-2 text-sm"
                        >
                          {joiningId === selectedCommunity.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                          退出社团
                        </button>
                      ) : null
                    ) : (
                      <button
                        onClick={() => handleJoinCommunity(selectedCommunity)}
                        disabled={joiningId === selectedCommunity.id}
                        className="btn-primary flex items-center gap-2 text-sm"
                      >
                        {joiningId === selectedCommunity.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PlusCircle className="w-4 h-4" />
                        )}
                        加入社团
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    成员列表
                  </h3>
                  
                  {loadingMembers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  ) : communityMembers.length === 0 ? (
                    <p className="text-white/50 text-center py-8">暂无成员</p>
                  ) : (
                    <div className="space-y-2">
                      {communityMembers.map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                        >
                          <Avatar config={member.avatarConfig || defaultAvatar} size={40} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{member.nickname}</span>
                              {getRoleBadge(member.role)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 mb-2">选择一个社团</p>
                <p className="text-white/30 text-sm">从左侧列表选择社团查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">创建新社团</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-white/50 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">社团名称</label>
                <input
                  type="text"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  className="input-field"
                  placeholder="2-50个字符"
                  disabled={creating}
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">社团描述 (可选)</label>
                <textarea
                  value={newCommunityDesc}
                  onChange={(e) => setNewCommunityDesc(e.target.value)}
                  className="input-field resize-none"
                  placeholder="描述你的社团..."
                  rows={3}
                  disabled={creating}
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  disabled={creating}
                >
                  取消
                </button>
                <button
                  onClick={handleCreateCommunity}
                  disabled={!newCommunityName.trim() || creating}
                  className="btn-primary flex items-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      创建
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communities;
