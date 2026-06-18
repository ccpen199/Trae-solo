import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, ChevronDown, ChevronUp, Quote } from 'lucide-react';
import { mockStories, mockScholarships } from '@/mock/scholarships';
import { formatRelativeTime } from '@/utils/date';

const accentColors = [
  'border-l-primary-500',
  'border-l-accent-500',
  'border-l-success-500',
  'border-l-purple-500',
  'border-l-rose-500',
  'border-l-cyan-500',
];

export default function Stories() {
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  const [filterProject, setFilterProject] = useState('');

  const toggleLike = (id: string) => {
    setLikedStories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedStories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredStories = filterProject
    ? mockStories.filter((s) => s.projectId === filterProject)
    : mockStories;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">受助故事</h1>
        <p className="text-surface-500 mt-1">每一份资助，都有一段温暖的成长故事</p>
      </div>

      <select
        value={filterProject}
        onChange={(e) => setFilterProject(e.target.value)}
        className="px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">全部项目</option>
        {mockScholarships.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {filteredStories.map((story, index) => {
          const isExpanded = expandedStories.has(story.id);
          const isLiked = likedStories.has(story.id);
          const colorClass = accentColors[index % accentColors.length];
          const isLong = story.content.length > 120;

          return (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="break-inside-avoid card card-hover p-5 border-l-4 space-y-3"
            >
              <div className={`border-l-4 ${colorClass} -ml-5 pl-5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">
                      {story.anonymousName.replace('同学', '')}
                    </div>
                    <span className="text-sm font-medium text-primary-600">{story.anonymousName}</span>
                  </div>
                  <span className="text-[10px] text-surface-400">{formatRelativeTime(story.createdAt)}</span>
                </div>
              </div>

              <div className="relative">
                <Quote className="w-5 h-5 text-surface-200 absolute -top-1 -left-1" />
                <p className={`text-sm text-surface-600 leading-relaxed pl-4 ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>
                  {story.content}
                </p>
              </div>

              {isLong && (
                <button
                  onClick={() => toggleExpand(story.id)}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
                >
                  {isExpanded ? (
                    <>收起 <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>展开全文 <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-surface-100">
                <button
                  onClick={() => toggleLike(story.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    isLiked ? 'text-rose-500' : 'text-surface-400 hover:text-rose-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="font-mono">{story.likes + (isLiked ? 1 : 0)}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-primary-500 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredStories.length === 0 && (
        <div className="text-center py-16 text-surface-400">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无受助故事</p>
        </div>
      )}
    </div>
  );
}
