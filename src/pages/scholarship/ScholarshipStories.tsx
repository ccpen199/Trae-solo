import type { ScholarshipStory } from '../../types';
import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockScholarshipStories, mockScholarships } from '../../data/mockData';
import { Heart, MessageCircle, Filter, Search, User, Plus, X, Share2, Send, Building2, GraduationCap } from 'lucide-react';

interface Comment {
  id: string;
  alias: string;
  content: string;
  date: string;
}

const mockComments: Record<string, Comment[]> = {
  '1': [
    { id: 'c1', alias: '匿名用户A', content: '感同身受，我也是从大山里走出来的，加油！', date: '2024-05-21' },
    { id: 'c2', alias: '匿名用户B', content: '奖学金真的改变了很多人的命运，感谢捐赠方。', date: '2024-05-22' },
    { id: 'c3', alias: '匿名用户C', content: '努力的人运气不会差，祝你未来越来越好！', date: '2024-05-23' },
  ],
  '2': [
    { id: 'c1', alias: '归雁粉丝', content: '返乡创业需要勇气，为你点赞！', date: '2024-06-11' },
    { id: 'c2', alias: '农业人', content: '农业数字化是大趋势，期待你的成果。', date: '2024-06-12' },
    { id: 'c3', alias: '新农人', content: '我也在做类似的事情，可以交流一下吗？', date: '2024-06-13' },
  ],
  '3': [
    { id: 'c1', alias: '技术宅', content: '做项目真的很锻炼人，继续加油！', date: '2024-04-16' },
    { id: 'c2', alias: '参赛选手', content: '你们都参加了哪些比赛？求分享经验。', date: '2024-04-17' },
    { id: 'c3', alias: '实验室萌新', content: '泡实验室的日子虽然辛苦，但收获满满。', date: '2024-04-18' },
  ],
};

const ScholarshipStories: FC = () => {
  const navigate = useNavigate();
  const [selectedScholarship, setSelectedScholarship] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<ScholarshipStory | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    scholarshipId: '',
    studentAlias: '',
    content: '',
    isAnonymous: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredStories = mockScholarshipStories.filter((story) => {
    const matchesScholarship =
      selectedScholarship === 'all' || story.scholarshipId === selectedScholarship;
    const matchesSearch =
      story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.studentAlias.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesScholarship && matchesSearch;
  });

  const totalLikes = mockScholarshipStories.reduce(
    (sum, s) => sum + s.likes,
    0
  );

  const stats = [
    {
      label: '励志故事',
      value: mockScholarshipStories.length,
      icon: MessageCircle,
      color: 'pink',
    },
    {
      label: '累计点赞',
      value: totalLikes,
      icon: Heart,
      color: 'red',
    },
    {
      label: '匿名分享者',
      value: mockScholarshipStories.length,
      icon: User,
      color: 'blue',
    },
  ];

  const colorClasses: Record<string, string> = {
    pink: 'bg-pink-100 text-pink-600',
    red: 'bg-red-100 text-red-500',
    blue: 'bg-blue-100 text-blue-600',
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.scholarshipId) newErrors.scholarshipId = '请选择关联奖学金';
    if (!formData.studentAlias.trim()) newErrors.studentAlias = '请输入匿名昵称';
    if (!formData.content.trim()) {
      newErrors.content = '请输入故事内容';
    } else if (formData.content.length < 200) {
      newErrors.content = '故事内容至少需要200字';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowShareModal(false);
      setShowSuccess(true);
      setFormData({
        scholarshipId: '',
        studentAlias: '',
        content: '',
        isAnonymous: true,
      });
      setErrors({});
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const openDetailModal = (story: ScholarshipStory) => {
    setSelectedStory(story);
    setShowDetailModal(true);
    setNewComment('');
  };

  const handleLike = (storyId: string) => {
    if (hasLiked[storyId]) return;
    const story = mockScholarshipStories.find(s => s.id === storyId);
    const currentLikes = likes[storyId] ?? story?.likes ?? 0;
    setLikes({ ...likes, [storyId]: currentLikes + 1 });
    setHasLiked({ ...hasLiked, [storyId]: true });
  };

  const getCurrentLikes = (storyId: string) => {
    if (likes[storyId] !== undefined) return likes[storyId];
    const story = mockScholarshipStories.find(s => s.id === storyId);
    return story?.likes ?? 0;
  };

  const getComments = (storyId: string) => {
    return mockComments[storyId] || [];
  };

  const getRelatedStories = (currentStoryId: string, scholarshipId: string) => {
    return mockScholarshipStories
      .filter(s => s.scholarshipId === scholarshipId && s.id !== currentStoryId)
      .slice(0, 2);
  };

  const handleShare = () => {
    alert('分享功能已触发，可集成到微信、微博等平台');
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    alert('评论已提交，审核通过后将展示');
    setNewComment('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-yellow-900">受助学生匿名故事</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">捐赠方入驻</span>
                <span className="text-yellow-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">发布资助项目</span>
                <span className="text-yellow-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">学生申请</span>
                <span className="text-yellow-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full ring-2 ring-yellow-400">4. 故事沉淀</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/scholarship/donors')} className="flex items-center gap-1.5 px-4 py-2.5 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors shadow-sm">
              <Building2 className="w-4 h-4" />
              捐赠方入驻
            </button>
            <button onClick={() => navigate('/scholarship/projects')} className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
              <GraduationCap className="w-4 h-4" />
              资助项目
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索故事内容、昵称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-72 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedScholarship}
                onChange={(e) => setSelectedScholarship(e.target.value)}
                className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部奖学金</option>
                {mockScholarships.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => navigate('/scholarship/donors')}
              className="px-4 py-2.5 bg-pink-50 text-pink-700 border border-pink-200 text-sm font-medium rounded-lg hover:bg-pink-100 transition-colors"
            >
              捐赠方入驻
            </button>
            <button
              onClick={() => navigate('/scholarship/projects')}
              className="px-4 py-2.5 bg-purple-50 text-purple-700 border border-purple-200 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors"
            >
              资助项目
            </button>
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            分享我的故事
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[stat.color]}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredStories.map((story) => (
          <div
            key={story.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {story.studentAlias}
                </p>
                <p className="text-xs text-gray-400">{story.date}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                {story.scholarshipName}
              </span>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
              {story.content}
            </p>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleLike(story.id)}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  hasLiked[story.id]
                    ? 'text-red-500'
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${hasLiked[story.id] ? 'fill-current' : ''}`} />
                <span>{getCurrentLikes(story.id)}</span>
              </button>
              <button
                onClick={() => openDetailModal(story)}
                className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                阅读全文
              </button>
            </div>
          </div>
        ))}
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">分享我的故事</h2>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setErrors({});
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  关联奖学金 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.scholarshipId}
                  onChange={(e) => setFormData({ ...formData, scholarshipId: e.target.value })}
                  className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.scholarshipId ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">请选择奖学金</option>
                  {mockScholarships.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.scholarshipId && <p className="text-xs text-red-500 mt-1">{errors.scholarshipId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  匿名昵称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.studentAlias}
                  onChange={(e) => setFormData({ ...formData, studentAlias: e.target.value })}
                  placeholder="如小草/归雁"
                  className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.studentAlias ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.studentAlias && <p className="text-xs text-red-500 mt-1">{errors.studentAlias}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  故事内容 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="请分享您与奖学金的故事，至少200字..."
                    rows={6}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.content ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <div className={`absolute right-3 bottom-3 text-xs ${
                    formData.content.length >= 200 ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    {formData.content.length}/200
                  </div>
                </div>
                {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="isAnonymous" className="text-sm font-medium text-gray-700 cursor-pointer">
                    匿名模式
                  </label>
                  <p className="text-xs text-gray-500">匿名模式将隐藏您的真实身份</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    setErrors({});
                  }}
                  className="flex-1 h-10 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  提交分享
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedStory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{selectedStory.studentAlias}</p>
                  <p className="text-xs text-gray-500">
                    {selectedStory.date} · {selectedStory.scholarshipName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedStory(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedStory.content}
                </p>
              </div>

              <div className="flex items-center justify-between py-4 border-t border-b border-gray-100">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handleLike(selectedStory.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      hasLiked[selectedStory.id]
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${hasLiked[selectedStory.id] ? 'fill-current' : ''}`} />
                    <span className="font-medium">{getCurrentLikes(selectedStory.id)}</span>
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-gray-600">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{getComments(selectedStory.id).length}</span>
                  </div>
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">分享</span>
                </button>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">评论区</h4>
                <div className="space-y-3">
                  {getComments(selectedStory.id).map((comment) => (
                    <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-800">{comment.alias}</span>
                        <span className="text-xs text-gray-400">{comment.date}</span>
                      </div>
                      <p className="text-sm text-gray-600">{comment.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="写下你的评论..."
                    className="flex-1 h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendComment}
                    className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">相关推荐</h4>
                <div className="grid grid-cols-2 gap-4">
                  {getRelatedStories(selectedStory.id, selectedStory.scholarshipId).map((story) => (
                    <div
                      key={story.id}
                      className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        setSelectedStory(story);
                        setNewComment('');
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-800">{story.studentAlias}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{story.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">感谢您的分享！故事已匿名发布，审核通过后将展示</span>
        </div>
      )}
    </div>
  );
};

export default ScholarshipStories;
