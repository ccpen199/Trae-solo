import { useState } from 'react';
import {
  Play,
  Users,
  Search,
  Filter,
  Radio,
  Clock,
  Eye,
  Grid,
  List,
} from 'lucide-react';
import { liveStreams } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusMap = {
  live: { label: '直播中', color: 'bg-neon-red text-white', dot: 'bg-neon-red animate-pulse' },
  offline: { label: '回放', color: 'bg-dark-600 text-dark-300', dot: 'bg-dark-500' },
  scheduled: { label: '预告', color: 'bg-cyber-500 text-white', dot: 'bg-cyber-500' },
};

const categories = ['全部分类', '英雄联盟', 'DOTA2', 'CS2', '王者荣耀', '绝地求生', '其他'];

export default function LiveStreams() {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部分类');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredStreams = liveStreams.filter((stream) => {
    const matchCategory = selectedCategory === '全部分类' || stream.game === selectedCategory;
    const matchSearch = !searchText ||
      stream.title.toLowerCase().includes(searchText.toLowerCase()) ||
      stream.streamer.toLowerCase().includes(searchText.toLowerCase());

    return matchCategory && matchSearch;
  });

  const stats = {
    live: liveStreams.filter((s) => s.status === 'live').length,
    totalViewers: liveStreams.reduce((sum, s) => sum + s.viewers, 0),
  };

  const formatViewers = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">观赛直播</h1>
          <p className="text-dark-400 mt-1">精彩赛事直播与回放</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-red/20">
              <Radio className="w-5 h-5 text-neon-red" />
            </div>
            <p className="text-dark-400 text-sm">正在直播</p>
          </div>
          <p className="text-2xl font-bold text-neon-red font-orbitron">{stats.live}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-green/20">
              <Eye className="w-5 h-5 text-neon-green" />
            </div>
            <p className="text-dark-400 text-sm">当前观看</p>
          </div>
          <p className="text-2xl font-bold text-neon-green font-orbitron">
            {formatViewers(stats.totalViewers)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-500/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-500/20">
              <Play className="w-5 h-5 text-cyber-400" />
            </div>
            <p className="text-dark-400 text-sm">直播总数</p>
          </div>
          <p className="text-2xl font-bold text-white font-orbitron">{liveStreams.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-purple/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-purple/20">
              <Users className="w-5 h-5 text-neon-purple" />
            </div>
            <p className="text-dark-400 text-sm">主播数量</p>
          </div>
          <p className="text-2xl font-bold text-neon-purple font-orbitron">
            {new Set(liveStreams.map((s) => s.streamer)).size}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索直播间..."
              className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'h-9 px-4 text-sm whitespace-nowrap rounded-lg transition-colors',
                  selectedCategory === cat
                    ? 'bg-cyber-600 text-white'
                    : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex rounded-lg border border-dark-700 overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'px-3 py-1.5 text-sm transition-colors',
              viewMode === 'grid'
                ? 'bg-cyber-600 text-white'
                : 'bg-dark-900 text-dark-400 hover:text-white'
            )}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'px-3 py-1.5 text-sm transition-colors',
              viewMode === 'list'
                ? 'bg-cyber-600 text-white'
                : 'bg-dark-900 text-dark-400 hover:text-white'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStreams.map((stream) => {
            const statusInfo = statusMap[stream.status];

            return (
              <div
                key={stream.id}
                className="group rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden cursor-pointer transition-all duration-300 hover:border-cyber-500/50 hover:-translate-y-1"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={stream.thumbnail}
                    alt={stream.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-neon-red/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>

                  <div className="absolute top-2 left-2">
                    <span className={cn(
                      'flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded',
                      statusInfo.color
                    )}>
                      <span className={cn('w-2 h-2 rounded-full', statusInfo.dot)}></span>
                      {statusInfo.label}
                    </span>
                  </div>

                  {stream.status === 'live' && (
                    <div className="absolute bottom-2 left-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-black/70 text-white rounded">
                        <Eye className="w-3 h-3" />
                        {formatViewers(stream.viewers)}
                      </span>
                    </div>
                  )}

                  {stream.status === 'scheduled' && (
                    <div className="absolute bottom-2 left-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-black/70 text-white rounded">
                        <Clock className="w-3 h-3" />
                        即将开始
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <h3 className="text-white font-medium text-sm line-clamp-2 h-10">
                    {stream.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">{stream.streamer}</span>
                    <span className="px-2 py-0.5 bg-cyber-500/20 text-cyber-400 rounded">
                      {stream.game}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredStreams.map((stream) => {
            const statusInfo = statusMap[stream.status];

            return (
              <div
                key={stream.id}
                className="flex gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50 hover:border-cyber-500/50 transition-colors cursor-pointer"
              >
                <div className="relative w-48 h-28 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={stream.thumbnail}
                    alt={stream.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={cn(
                      'flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded',
                      statusInfo.color
                    )}>
                      <span className={cn('w-2 h-2 rounded-full', statusInfo.dot)}></span>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium mb-2 line-clamp-1">{stream.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-dark-400">
                    <span>{stream.streamer}</span>
                    <span className="px-2 py-0.5 bg-cyber-500/20 text-cyber-400 rounded text-xs">
                      {stream.game}
                    </span>
                  </div>
                  {stream.status === 'live' && (
                    <div className="flex items-center gap-1 mt-2 text-neon-red text-sm">
                      <Eye className="w-4 h-4" />
                      <span>{formatViewers(stream.viewers)} 人观看</span>
                    </div>
                  )}
                </div>

                <button className="self-center px-5 h-9 bg-neon-red hover:bg-neon-red/80 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5">
                  <Play className="w-4 h-4" />
                  观看
                </button>
              </div>
            );
          })}
        </div>
      )}

      {filteredStreams.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的直播</p>
        </div>
      )}
    </div>
  );
}
