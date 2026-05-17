import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Heart, Bookmark, Share2, ThumbsDown, Music, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getContent, interactContent } from '../api/content';

const ContentDetail = () => {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await getContent(id);
      if (response.success) {
        setContent(response.data.content);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [id]);

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('链接已复制到剪贴板！');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('复制链接失败，请手动复制');
    }
  };

  const handleInteraction = async (type) => {
    if (type === 'like' && isLiked) {
      toast.error('您已经点赞过了');
      return;
    }
    if (type === 'favorite' && isFavorited) {
      toast.error('您已经收藏过了');
      return;
    }

    try {
      await interactContent(id, { interaction_type: type });
      toast.success(`Content ${type}d!`);
      
      if (type === 'like') {
        setIsLiked(true);
        setContent(prev => ({ ...prev, like_count: (prev.like_count || 0) + 1 }));
      } else if (type === 'favorite') {
        setIsFavorited(true);
        setContent(prev => ({ ...prev, favorite_count: (prev.favorite_count || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error recording interaction:', error);
      if (error.response?.status === 401) {
        toast.error('请先登录后再进行此操作');
      } else {
        toast.error('操作失败，请重试');
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      case 'text':
        return <FileText className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loader" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Content not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative">
            {content.type === 'video' && content.content_url && isPlaying ? (
              videoError ? (
                <div className="w-full h-64 sm:h-80 bg-gray-800 flex flex-col items-center justify-center text-white">
                  <p className="text-lg mb-4">视频加载失败</p>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setVideoError(false);
                    }}
                    className="px-4 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    返回封面
                  </button>
                </div>
              ) : (
                <video
                  src={content.content_url}
                  controls
                  autoPlay
                  onError={() => setVideoError(true)}
                  className="w-full h-64 sm:h-80 object-contain bg-black"
                  poster={content.cover_url}
                />
              )
            ) : (
              <img
                src={content.cover_url || 'https://picsum.photos/800/400'}
                alt={content.title}
                className="w-full h-64 sm:h-80 object-cover"
              />
            )}
            
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2 z-10">
              {getTypeIcon(content.type)}
              {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
            </div>
            
            {content.type === 'video' && content.content_url && !isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="bg-black bg-opacity-60 rounded-full p-5 hover:bg-opacity-70 transition-colors cursor-pointer"
                >
                  <Play className="h-12 w-12 text-white" fill="white" />
                </button>
              </div>
            )}

            {content.type === 'audio' && content.content_url && (
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <audio
                  controls
                  src={content.content_url}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {content.title}
                </h1>
                {content.category && (
                  <span className="inline-block bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full">
                    {content.category}
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {content.description}
            </p>

            {content.type === 'text' && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Content</h3>
                <p className="text-gray-700 leading-relaxed">
                  This is a text-based content about Chinese culture. 
                  The full article content would be displayed here for users to read and learn from.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <button
                onClick={() => handleInteraction('like')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked 
                    ? 'bg-red-100 text-red-700 cursor-not-allowed' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <Heart className="h-5 w-5" fill={isLiked ? 'currentColor' : 'none'} />
                <span>Like ({content.like_count || 0})</span>
              </button>

              <button
                onClick={() => handleInteraction('favorite')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isFavorited 
                    ? 'bg-primary-100 text-primary-700 cursor-not-allowed' 
                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                }`}
              >
                <Bookmark className="h-5 w-5" fill={isFavorited ? 'currentColor' : 'none'} />
                <span>Save ({content.favorite_count || 0})</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </button>

              <button
                onClick={() => handleInteraction('dislike')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ThumbsDown className="h-5 w-5" />
                <span>Not interested</span>
              </button>
            </div>

            {content.tags && content.tags.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;
