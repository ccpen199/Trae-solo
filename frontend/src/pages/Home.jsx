import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { channelAPI, postAPI } from '../utils/api';
import PostCard from '../components/PostCard';

const Home = () => {
  const [channels, setChannels] = useState([]);
  const [posts, setPosts] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [currentChannel, page]);

  const loadChannels = async () => {
    try {
      const response = await channelAPI.getAll();
      setChannels(response.data.channels);
      if (response.data.channels.length > 0) {
        setCurrentChannel(response.data.channels[0].id);
      }
    } catch (error) {
      console.error('加载频道失败:', error);
    }
  };

  const loadPosts = async () => {
    if (!currentChannel) return;
    
    setLoading(true);
    try {
      const response = await postAPI.getList({
        channel: currentChannel,
        page,
        limit: 20,
      });
      
      if (page === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts((prev) => [...prev, ...response.data.posts]);
      }
      setTotal(response.data.total);
    } catch (error) {
      console.error('加载帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelChange = (channelId) => {
    setCurrentChannel(channelId);
    setPage(1);
    setPosts([]);
  };

  const scrollChannels = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="relative">
          <button
            onClick={() => scrollChannels('left')}
            className="absolute left-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-r from-white to-transparent"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>

          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelChange(channel.id)}
                className={`channel-tab px-5 py-4 font-medium ${
                  currentChannel === channel.id ? 'active text-primary' : 'text-gray-600'
                }`}
              >
                {channel.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollChannels('right')}
            className="absolute right-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-l from-white to-transparent"
          >
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && posts.length < total && (
        <div className="flex justify-center py-8">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-white text-primary border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
          >
            加载更多
          </button>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          暂无内容
        </div>
      )}
    </div>
  );
};

export default Home;
