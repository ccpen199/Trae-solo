import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play, Heart, Bookmark, Music, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getContents } from '../api/content';
import { interactContent } from '../api/content';

const Home = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [likedContents, setLikedContents] = useState(new Set());
  const [favoritedContents, setFavoritedContents] = useState(new Set());

  const fetchContents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await getContents(params);
      if (response.success) {
        setContents(response.data.contents || []);
      }
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [selectedType, searchTerm]);

  const handleLike = async (contentId) => {
    if (likedContents.has(contentId)) {
      toast.error('您已经点赞过了');
      return;
    }

    try {
      await interactContent(contentId, { interaction_type: 'like' });
      setLikedContents(prev => new Set(prev).add(contentId));
      setContents(prev => prev.map(c => 
        c.id === contentId ? { ...c, like_count: (c.like_count || 0) + 1 } : c
      ));
      toast.success('Added to favorites!');
    } catch (error) {
      console.error('Error liking content:', error);
      if (error.response?.status === 401) {
        toast.error('请先登录后再进行此操作');
      }
    }
  };

  const handleFavorite = async (contentId) => {
    if (favoritedContents.has(contentId)) {
      toast.error('您已经收藏过了');
      return;
    }

    try {
      await interactContent(contentId, { interaction_type: 'favorite' });
      setFavoritedContents(prev => new Set(prev).add(contentId));
      setContents(prev => prev.map(c => 
        c.id === contentId ? { ...c, favorite_count: (c.favorite_count || 0) + 1 } : c
      ));
      toast.success('Added to bookmarks!');
    } catch (error) {
      console.error('Error favoriting content:', error);
      if (error.response?.status === 401) {
        toast.error('请先登录后再进行此操作');
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Discover Chinese Culture & Language
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              {['all', 'video', 'audio', 'text'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="loader" />
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No content found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((content) => (
              <div
                key={content.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link to={`/content/${content.id}`}>
                  <div className="relative">
                    <img
                      src={content.cover_url || 'https://picsum.photos/400/200'}
                      alt={content.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      {getTypeIcon(content.type)}
                      {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                    </div>
                    {content.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-50 rounded-full p-3">
                          <Play className="h-8 w-8 text-white" fill="white" />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/content/${content.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-500 transition-colors">
                      {content.title}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {content.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(content.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          likedContents.has(content.id) 
                            ? 'text-red-500 cursor-not-allowed' 
                            : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className="h-4 w-4" fill={likedContents.has(content.id) ? 'currentColor' : 'none'} />
                        <span className="text-sm">{content.like_count || 0}</span>
                      </button>
                      <button
                        onClick={() => handleFavorite(content.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          favoritedContents.has(content.id) 
                            ? 'text-primary-500 cursor-not-allowed' 
                            : 'text-gray-500 hover:text-primary-500'
                        }`}
                      >
                        <Bookmark className="h-4 w-4" fill={favoritedContents.has(content.id) ? 'currentColor' : 'none'} />
                        <span className="text-sm">{content.favorite_count || 0}</span>
                      </button>
                    </div>

                    {content.category && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        {content.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
