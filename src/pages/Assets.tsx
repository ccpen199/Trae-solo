import { useState } from 'react';
import {
  Image, Video, Mic, FileText, Palette, Search, Filter, Grid, List, Tag, Lock, Unlock, Eye, Download, Upload, Plus, Clock, User, Calendar, File, Settings, Shield, X, CheckCircle, AlertCircle, Copy, Trash2, Edit, ChevronRight
} from 'lucide-react';
import { assets } from '../data/mockData';
import type { Asset } from '../types';

const typeIcons: Record<string, any> = {
  image: Image,
  video: Video,
  audio: Mic,
  document: FileText,
  graphic: Palette
};

const copyrightColors: Record<string, { bg: string; text: string; label: string }> = {
  original: { bg: 'bg-green-100', text: 'text-green-700', label: '原创' },
  authorized: { bg: 'bg-blue-100', text: 'text-blue-700', label: '授权' },
  public: { bg: 'bg-slate-100', text: 'text-slate-700', label: '公有' }
};

export default function Assets() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCopyright, setFilterCopyright] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filteredAssets = assets.filter(asset => {
    const matchSearch = asset.title.includes(searchText) || asset.tags.some(tag => tag.includes(searchText));
    const matchType = filterType === 'all' || asset.type === filterType;
    const matchCopyright = filterCopyright === 'all' || asset.copyright === filterCopyright;
    return matchSearch && matchType && matchCopyright;
  });

  const copyrightStats = [
    { type: 'original', count: assets.filter(a => a.copyright === 'original').length, label: '原创内容' },
    { type: 'authorized', count: assets.filter(a => a.copyright === 'authorized').length, label: '授权内容' },
    { type: 'public', count: assets.filter(a => a.copyright === 'public').length, label: '公有内容' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="text-3xl font-bold text-slate-800">{assets.length}</div>
          <div className="text-sm text-slate-500 mt-1">素材总数</div>
        </div>
        {copyrightStats.map(stat => {
          const info = copyrightColors[stat.type];
          return (
            <div key={stat.type} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className={`text-3xl font-bold ${info.text}`}>{stat.count}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          );
        })}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="text-3xl font-bold text-purple-600">12.5GB</div>
          <div className="text-sm text-slate-500 mt-1">存储空间</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索素材标题、标签..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部类型</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
              <option value="document">文档</option>
              <option value="graphic">图形</option>
            </select>
            <select 
              value={filterCopyright}
              onChange={(e) => setFilterCopyright(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部版权</option>
              <option value="original">原创</option>
              <option value="authorized">授权</option>
              <option value="public">公有</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-slate-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-slate-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            上传素材
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map(asset => (
            <AssetCard key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">素材</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">类型</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">版权</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">格式</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">大小</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">上传者</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">下载量</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAssets.map(asset => {
                const TypeIcon = typeIcons[asset.type];
                const copyrightInfo = copyrightColors[asset.copyright];
                return (
                  <tr key={asset.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedAsset(asset)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {asset.thumbnail ? (
                          <img src={asset.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-700">{asset.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-600 flex items-center gap-1">
                        <TypeIcon className="w-4 h-4" />
                        {asset.type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${copyrightInfo.bg} ${copyrightInfo.text}`}>
                        {copyrightInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{asset.format}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{asset.fileSize}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{asset.uploader}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{asset.downloads}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-slate-400 hover:text-primary-500"><Eye className="w-4 h-4" /></button>
                        <button className="p-1 text-slate-400 hover:text-green-500"><Download className="w-4 h-4" /></button>
                        <button className="p-1 text-slate-400 hover:text-slate-600"><Edit className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedAsset && (
        <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
}

function AssetCard({ asset, onClick }: { asset: Asset; onClick: () => void }) {
  const TypeIcon = typeIcons[asset.type];
  const copyrightInfo = copyrightColors[asset.copyright];

  return (
    <div 
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-video bg-slate-100 relative overflow-hidden">
        {asset.thumbnail ? (
          <img src={asset.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${copyrightInfo.bg} ${copyrightInfo.text} backdrop-blur`}>
            {copyrightInfo.label}
          </span>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-8 h-8 bg-black/50 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-black/70">
            <Eye className="w-4 h-4" />
          </button>
        </div>
        {asset.status === 'restricted' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Lock className="w-8 h-8 mx-auto mb-2" />
              <span className="text-xs">需授权使用</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-slate-800 text-sm line-clamp-1 mb-2">{asset.title}</h3>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {asset.downloads}
          </span>
          <span>{asset.fileSize}</span>
        </div>
      </div>
    </div>
  );
}

function AssetDetailModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const TypeIcon = typeIcons[asset.type];
  const copyrightInfo = copyrightColors[asset.copyright];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">素材详情</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="bg-slate-900 aspect-video flex items-center justify-center">
              {asset.thumbnail ? (
                <img src={asset.thumbnail} alt="" className="max-w-full max-h-full object-contain" />
              ) : (
                <TypeIcon className="w-20 h-20 text-slate-600" />
              )}
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{asset.title}</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${copyrightInfo.bg} ${copyrightInfo.text}`}>
                    {copyrightInfo.label}
                  </span>
                  <span className="text-sm text-slate-500">{asset.format}</span>
                  <span className="text-sm text-slate-500">{asset.fileSize}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">版权持有者</div>
                  <div className="text-sm font-medium text-slate-700">{asset.copyrightHolder}</div>
                </div>
                {asset.licenseType && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">授权类型</div>
                    <div className="text-sm font-medium text-slate-700">{asset.licenseType}</div>
                  </div>
                )}
                {asset.expirationDate && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">有效期至</div>
                    <div className="text-sm font-medium text-slate-700">{asset.expirationDate}</div>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">上传时间</div>
                  <div className="text-sm font-medium text-slate-700">{asset.createdAt}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">标签</div>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">元数据</div>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  {Object.entries(asset.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-slate-500">{key}</span>
                      <span className="text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Eye className="w-4 h-4" />
                  <span>{asset.views} 浏览</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Download className="w-4 h-4" />
                  <span>{asset.downloads} 下载</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2">
              <Copy className="w-4 h-4" />
              复制链接
            </button>
            <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              编辑标签
            </button>
          </div>
          <button className="px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 flex items-center gap-2">
            <Download className="w-4 h-4" />
            下载使用
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">上传素材</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-primary-500 hover:bg-primary-50/50 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-1">点击或拖拽文件到此处上传</p>
            <p className="text-xs text-slate-400">支持 JPG、PNG、MP4、MP3、PDF 等格式</p>
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">素材标题</label>
            <input 
              type="text" 
              placeholder="请输入素材标题"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">版权类型</label>
            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="original">原创 - 本单位自有版权</option>
              <option value="authorized">授权 - 已获得使用授权</option>
              <option value="public">公有 - 公有领域内容</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">版权持有者</label>
            <input 
              type="text" 
              placeholder="请输入版权持有者名称"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">标签</label>
            <div className="flex flex-wrap gap-2">
              {['新闻', '宣传', '活动'].map(tag => (
                <span key={tag} className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs">
                  {tag}
                  <X className="w-3 h-3 inline ml-1 cursor-pointer" />
                </span>
              ))}
              <span className="px-2 py-1 border border-dashed border-slate-300 rounded text-xs text-slate-400 cursor-pointer hover:border-primary-500 hover:text-primary-500">
                + 添加标签
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm">
            取消
          </button>
          <button className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
            开始上传
          </button>
        </div>
      </div>
    </div>
  );
}
