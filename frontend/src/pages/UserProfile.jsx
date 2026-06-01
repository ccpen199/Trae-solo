import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Trophy, Coins, FileText, MessageSquare, Users, Loader2, Award } from 'lucide-react';
import { userAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    loadUser();
    loadPosts();
  }, [id]);

  const loadUser = async () => {
    try {
      const response = await userAPI.getProfile(id);
      setUser(response.data.user);
    } catch (error) {
      console.error('加载用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await userAPI.getUserPosts(id, { limit: 20 });
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('加载用户帖子失败:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    try {
      await userAPI.follow(id);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('关注失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-gray-400">
        用户不存在
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">
              {(user.nickname || user.username).charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.nickname || user.username}
              </h1>
              <span className="level-badge !w-7 !h-7 !text-sm">
                {user.level}
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                <span>{user.experience} 经验</span>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span>{user.coins} 虎币</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-orange-500" />
                <span>{user.reputation} 声望</span>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <div className="text-center">
                <div className="font-bold text-gray-900">{user.post_count || 0}</div>
                <div className="text-gray-500">帖子</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{user.comment_count || 0}</div>
                <div className="text-gray-500">评论</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{user.follower_count || 0}</div>
                <div className="text-gray-500">粉丝</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{user.following_count || 0}</div>
                <div className="text-gray-500">关注</div>
              </div>
            </div>
          </div>

          {currentUser && currentUser.id !== parseInt(id) && (
            <button
              onClick={handleFollow}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                isFollowing
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-primary text-white hover:bg-red-600'
              }`}
            >
              {isFollowing ? '已关注' : '+ 关注'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-4 font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              发布的帖子
            </div>
          </button>
        </div>

        <div className="p-4">
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              暂无发布的帖子
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
