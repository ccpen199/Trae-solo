import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  Share2,
  Flag,
  MapPin,
  Send,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState('');

  return (
    <div className="space-y-4">
      <Link
        to="/topics"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        返回话题列表
      </Link>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-100" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">邻居小明</span>
              <span className="badge-green">生活</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span>3小时前</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> 128
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-3">
          关于小区绿化带的讨论
        </h2>

        <div className="text-gray-700 leading-relaxed mb-4">
          最近发现小区绿化带的花开了，非常漂亮！大家有没有注意到？尤其是3号楼前面的那片樱花，
          开得特别灿烂。分享一下你们拍的照片吧，一起欣赏春天的美好。
          <br /><br />
          另外想问问物业，这些花卉的养护是谁负责的？如果需要志愿者帮忙浇水，我很乐意参与。
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-lg bg-gray-100" />
          ))}
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <MapPin className="w-4 h-4 text-community-orange" />
          <span>幸福花园 · 3号楼前</span>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1.5 text-sm ${
              liked ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span>{liked ? 24 : 23}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500">
            <Share2 className="w-5 h-5" />
            <span>分享</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500">
            <Flag className="w-5 h-5" />
            <span>举报</span>
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">评论 ({8})</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">邻居{i}</span>
                  <span className="text-xs text-gray-400">1小时前</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  评论区内容示例，我觉得这个想法很好，支持！
                </p>
                {i === 1 && (
                  <div className="mt-2 ml-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-900">邻居小明</span>
                          <span className="text-xs text-gray-400">30分钟前</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">回复内容示例</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 lg:-mx-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="写下你的评论..."
            className="input-field"
          />
          <button className="btn-primary px-3" disabled={!comment.trim()}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
