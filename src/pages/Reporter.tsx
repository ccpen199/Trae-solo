import { useState } from 'react';
import { 
  Camera, 
  Video, 
  Mic, 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Send,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  Home,
  Folder,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Trash2,
  Zap,
  FileAudio,
  Languages,
  Copy,
  Download,
  Sparkles,
  ArrowLeft,
  Eye,
  ThumbsUp,
  Share2,
  X,
  Check,
  XCircle,
  History,
  Award,
  BookOpen,
  Bell,
  LogOut,
  Image,
  Edit3,
  Tag
} from 'lucide-react';
import { materials, topics, reporters, currentUser } from '../data/mockData';
import type { Topic, Material } from '../types';

const reporterUser = reporters[0];

export default function Reporter() {
  const [activeTab, setActiveTab] = useState<'home' | 'materials' | 'topics' | 'voice' | 'profile'>('home');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [voiceDetailId, setVoiceDetailId] = useState<string | null>(null);

  if (selectedMaterial) {
    return <MaterialDetail material={selectedMaterial} onBack={() => setSelectedMaterial(null)} />;
  }

  if (selectedTopic) {
    return <TopicDetail topic={selectedTopic} onBack={() => setSelectedTopic(null)} />;
  }

  if (showTopicForm) {
    return <TopicForm onCancel={() => setShowTopicForm(false)} onSubmit={() => { setShowTopicForm(false); }} />;
  }

  if (voiceDetailId) {
    return <VoiceDetailPage id={voiceDetailId} onBack={() => setVoiceDetailId(null)} />;
  }

  if (showUploadSuccess) {
    return <UploadSuccessPage onBack={() => { setShowUploadSuccess(false); setActiveTab('materials'); }} />;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gradient-to-b from-primary-500 to-primary-600 rounded-t-3xl p-6 text-white">
        <div className="flex items-center gap-4 mb-6">
          <img src={reporterUser.avatar} alt="" className="w-14 h-14 rounded-full border-2 border-white/30" />
          <div>
            <div className="text-lg font-bold">{reporterUser.name}</div>
            <div className="text-sm text-white/70">{reporterUser.department} · 记者</div>
          </div>
          <div className="ml-auto">
            <button className="relative p-2">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{reporterUser.materialCount}</div>
            <div className="text-xs text-white/70">今日素材</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{reporterUser.taskCount}</div>
            <div className="text-xs text-white/70">待办任务</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-white/70">在审稿件</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-3xl -mt-2 pt-4 px-4 pb-20 relative z-10 shadow-lg min-h-96">
        {activeTab === 'home' && <ReporterHome onOpenMaterial={(m) => setSelectedMaterial(m)} onOpenTopic={(t) => setSelectedTopic(t)} />}
        {activeTab === 'materials' && <MaterialPage onUploadSuccess={() => setShowUploadSuccess(true)} onOpenDetail={(m) => setSelectedMaterial(m)} />}
        {activeTab === 'topics' && <TopicPage onCreate={() => setShowTopicForm(true)} onOpenDetail={(t) => setSelectedTopic(t)} />}
        {activeTab === 'voice' && <VoiceTranscription onOpenDetail={(id) => setVoiceDetailId(id)} />}
        {activeTab === 'profile' && <ReporterProfile />}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 px-4 py-2">
        <div className="flex justify-around">
          {[
            { id: 'home', icon: Home, label: '首页' },
            { id: 'materials', icon: Camera, label: '素材' },
            { id: 'voice', icon: Mic, label: '语音' },
            { id: 'topics', icon: FileText, label: '选题' },
            { id: 'profile', icon: User, label: '我的' },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center py-1 px-3 ${isActive ? 'text-primary-500' : 'text-slate-400'}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReporterHome({ onOpenMaterial, onOpenTopic }: { onOpenMaterial: (m: Material) => void; onOpenTopic: (t: Topic) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Camera, label: '拍照上传', color: 'bg-blue-50 text-blue-500' },
          { icon: Video, label: '视频录制', color: 'bg-red-50 text-red-500' },
          { icon: Mic, label: '语音录制', color: 'bg-green-50 text-green-500' },
          { icon: FileText, label: '文字稿件', color: 'bg-purple-50 text-purple-500' },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <button key={index} className="flex flex-col items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-2`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs text-slate-600">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-800 text-sm">紧急任务</div>
          <div className="text-xs text-slate-500 truncate">经济工作会议专题报道</div>
        </div>
        <button className="text-xs text-primary-500 font-medium flex-shrink-0">前往</button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">最近素材</h3>
          <button className="text-xs text-primary-500">查看全部</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {materials.slice(0, 6).map((material) => (
            <div 
              key={material.id} 
              onClick={() => onOpenMaterial(material)}
              className="aspect-square rounded-lg overflow-hidden relative cursor-pointer"
            >
              {material.thumbnail ? (
                <img src={material.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  {material.type === 'audio' && <FileAudio className="w-8 h-8 text-slate-400" />}
                  {material.type === 'document' && <FileText className="w-8 h-8 text-slate-400" />}
                </div>
              )}
              {material.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                {material.size}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">我的选题</h3>
          <button className="text-xs text-primary-500">查看全部</button>
        </div>
        <div className="space-y-2">
          {topics.slice(0, 3).map(topic => (
            <div 
              key={topic.id} 
              onClick={() => onOpenTopic(topic)}
              className="p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium text-slate-800 text-sm flex-1 line-clamp-1">{topic.title}</span>
                <span className={`px-2 py-0.5 rounded text-xs ml-2 flex-shrink-0 ${
                  topic.status === 'approved' ? 'bg-green-100 text-green-600' :
                  topic.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  topic.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {topic.status === 'approved' ? '已通过' :
                   topic.status === 'rejected' ? '已拒绝' :
                   topic.status === 'in_progress' ? '进行中' : '待审核'}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{topic.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-3">今日数据</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600">23</div>
            <div className="text-xs text-blue-500 mt-1">上传素材</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-xs text-green-500 mt-1">提交稿件</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-600">3</div>
            <div className="text-xs text-purple-500 mt-1">通过审核</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-orange-600">1.2万</div>
            <div className="text-xs text-orange-500 mt-1">总传播量</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaterialPage({ onUploadSuccess, onOpenDetail }: { onUploadSuccess: () => void; onOpenDetail: (m: Material) => void }) {
  const [uploadMode, setUploadMode] = useState<'gallery' | 'camera' | 'video' | 'audio'>('gallery');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('upload');

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUploadSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">素材回传</h3>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1 text-xs rounded-md ${activeTab === 'upload' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}
          >
            上传
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1 text-xs rounded-md ${activeTab === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}
          >
            素材库
          </button>
        </div>
      </div>

      {activeTab === 'upload' && (
        <>
          <div className="flex gap-2">
            {[
              { id: 'gallery', label: '相册', icon: Folder },
              { id: 'camera', label: '拍照', icon: Camera },
              { id: 'video', label: '录像', icon: Video },
              { id: 'audio', label: '录音', icon: Mic },
            ].map(item => {
              const Icon = item.icon;
              const isActive = uploadMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setUploadMode(item.id as any)}
                  className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1 ${
                    isActive ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden relative">
                <img 
                  src={`https://picsum.photos/200/200?random=${index + 10}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div 
                  className="absolute top-2 right-2 cursor-pointer"
                  onClick={() => {
                    setSelectedFiles(prev => 
                      prev.includes(String(index))
                        ? prev.filter(i => i !== String(index))
                        : [...prev, String(index)]
                    );
                  }}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedFiles.includes(String(index))
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-white/80 border-white'
                  }`}>
                    {selectedFiles.includes(String(index)) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-600 block mb-1">素材标题</label>
              <input 
                type="text" 
                placeholder="请输入素材标题"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">拍摄地点</label>
              <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <MapPin className="w-4 h-4 text-primary-500" />
                <span className="text-slate-700 flex-1">昌平区政府</span>
                <button className="text-primary-500 text-xs">重新定位</button>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">标签</label>
              <div className="flex flex-wrap gap-2">
                {['会议', '经济', '现场'].map(tag => (
                  <span key={tag} className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs">
                    {tag}
                  </span>
                ))}
                <button className="px-2 py-1 border border-dashed border-slate-300 rounded text-xs text-slate-400">
                  + 添加标签
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">关联选题</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>请选择关联的选题</option>
                <option>2026年中经济发展专题报道</option>
                <option>回天行动计划实施五周年系列报道</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
              selectedFiles.length > 0 
                ? 'bg-primary-500 text-white hover:bg-primary-600' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Upload className="w-5 h-5" />
            上传 {selectedFiles.length > 0 ? `${selectedFiles.length} 个素材` : '素材'}
          </button>
        </>
      )}

      {activeTab === 'list' && (
        <div className="space-y-3">
          {materials.map(material => (
            <div 
              key={material.id}
              onClick={() => onOpenDetail(material)}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                {material.thumbnail ? (
                  <img src={material.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {material.type === 'audio' && <FileAudio className="w-6 h-6 text-slate-400" />}
                    {material.type === 'document' && <FileText className="w-6 h-6 text-slate-400" />}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{material.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{material.size} · {material.uploadTime}</div>
                <div className="flex gap-1 mt-1">
                  {material.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadSuccessPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6 py-8 text-center">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800">上传成功</h3>
        <p className="text-sm text-slate-500 mt-1">3个素材已成功上传至素材库</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">上传数量</span>
          <span className="font-medium text-slate-800">3 个</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">总大小</span>
          <span className="font-medium text-slate-800">8.6 MB</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">上传时间</span>
          <span className="font-medium text-slate-800">2026-06-19 14:30</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">存储位置</span>
          <span className="font-medium text-slate-800">个人素材库</span>
        </div>
      </div>

      <div className="space-y-3">
        <button className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium">
          查看素材详情
        </button>
        <button 
          onClick={onBack}
          className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl font-medium"
        >
          继续上传
        </button>
      </div>

      <div className="pt-4">
        <p className="text-xs text-slate-400 mb-3">接下来您可以</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: FileText, label: '创建稿件' },
            { icon: Share2, label: '分享素材' },
            { icon: Tag, label: '编辑标签' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={i} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col items-center gap-1">
                <Icon className="w-5 h-5 text-primary-500" />
                <span className="text-xs text-slate-600">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MaterialDetail({ material, onBack }: { material: Material; onBack: () => void }) {
  const [usageRecords] = useState([
    { time: '2026-06-18 15:30', action: '用于稿件《昌平区经济工作会议召开》', type: 'use' },
    { time: '2026-06-18 10:20', action: '编辑标签和元数据', type: 'edit' },
    { time: '2026-06-18 09:15', action: '上传至素材库', type: 'upload' },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg -ml-2">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h3 className="font-semibold text-slate-800">素材详情</h3>
      </div>

      <div className="bg-slate-100 rounded-xl overflow-hidden aspect-video relative">
        {material.thumbnail ? (
          <img src={material.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {material.type === 'audio' && (
              <div className="text-center">
                <FileAudio className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">音频文件</p>
              </div>
            )}
          </div>
        )}
        {material.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-primary-600 ml-1" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="font-medium text-slate-800 mb-3">{material.title}</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">类型</span>
            <span className="text-slate-700">
              {material.type === 'image' ? '图片' : 
               material.type === 'video' ? '视频' : 
               material.type === 'audio' ? '音频' : '文档'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">大小</span>
            <span className="text-slate-700">{material.size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">上传时间</span>
            <span className="text-slate-700">{material.uploadTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">上传者</span>
            <span className="text-slate-700">{material.uploader}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">版权</span>
            <span className="text-slate-700">{material.copyright}</span>
          </div>
          {material.location && (
            <div className="flex justify-between">
              <span className="text-slate-500">拍摄地点</span>
              <span className="text-slate-700">{material.location}</span>
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-sm text-slate-500">标签</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {material.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 bg-primary-50 text-primary-600 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-primary-500" />
          使用记录
        </h4>
        <div className="space-y-3">
          {usageRecords.map((record, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">{record.action}</p>
                <p className="text-xs text-slate-400 mt-0.5">{record.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          下载
        </button>
        <button className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm flex items-center justify-center gap-2">
          <Share2 className="w-4 h-4" />
          分享
        </button>
        <button className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm flex items-center justify-center gap-2">
          <Edit3 className="w-4 h-4" />
          编辑
        </button>
      </div>
    </div>
  );
}

function VoiceTranscription({ onOpenDetail }: { onOpenDetail: (id: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    setRecordDuration(0);
    setShowResult(false);
    const timer = setInterval(() => {
      setRecordDuration(d => d + 1);
    }, 1000);
    // @ts-ignore
    window.reporterRecordingTimer = timer;
  };

  const stopRecording = () => {
    setIsRecording(false);
    // @ts-ignore
    if (window.reporterRecordingTimer) clearInterval(window.reporterRecordingTimer);
    setIsTranscribing(true);
    setTimeout(() => {
      setIsTranscribing(false);
      setShowResult(true);
      setTranscription('各位听众朋友大家好，今天是2026年6月19日，欢迎收听昌平新闻。今天上午，昌平区召开2026年经济工作会议，部署全年重点任务。区委书记在会上强调，要坚持稳中求进工作总基调，推动经济高质量发展。会议指出，上半年全区经济运行总体平稳，主要经济指标实现时间任务双过半。下一步，要重点抓好以下几方面工作：一是加快推进未来科学城建设，二是深化回天地区综合治理，三是持续优化营商环境，四是着力保障和改善民生。');
    }, 2000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const historyRecords = [
    { id: '1', title: '草莓节现场采访', duration: '05:32', date: '今天 10:30', hasTranscription: true },
    { id: '2', title: '经济工作会议录音', duration: '45:18', date: '昨天 14:20', hasTranscription: true },
    { id: '3', title: '社区居民采访', duration: '08:15', date: '前天 09:15', hasTranscription: false },
    { id: '4', title: '学校走访记录', duration: '23:45', date: '3天前', hasTranscription: true },
  ];

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-slate-800">AI语音转写</h3>

      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl p-6 text-center border border-slate-100">
        <div className="mb-4">
          <div className="text-4xl font-mono text-slate-800">{formatDuration(recordDuration)}</div>
          <div className="text-xs text-slate-500 mt-1">录音时长</div>
        </div>

        {isRecording && (
          <div className="flex justify-center items-end gap-1 h-16 mb-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i}
                className="w-1 bg-primary-500 rounded-full animate-pulse"
                style={{ 
                  height: `${20 + Math.random() * 40}px`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
            isRecording ? 'bg-red-500' : 'bg-primary-500'
          } text-white shadow-lg hover:shadow-xl transition-all`}
        >
          {isRecording ? <Pause className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
        <p className="text-sm text-slate-500 mt-3">
          {isRecording ? '点击结束录音' : '点击开始录音'}
        </p>
      </div>

      {isTranscribing && (
        <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-blue-700">AI正在转写中...</div>
            <div className="text-xs text-blue-500">请稍候，语音内容正在智能识别</div>
          </div>
        </div>
      )}

      {showResult && transcription && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-800 text-sm flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary-500" />
              转写结果
            </h4>
            <div className="flex gap-2">
              <button className="text-xs text-slate-500 flex items-center gap-1">
                <Copy className="w-3 h-3" /> 复制
              </button>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 max-h-40 overflow-y-auto">
            <p className="text-sm text-slate-700 leading-relaxed">{transcription}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" />
              编辑转写
            </button>
            <button className="py-2.5 bg-primary-500 text-white rounded-xl text-sm flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              生成稿件
            </button>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium text-slate-800 text-sm mb-3 flex items-center justify-between">
          <span>历史录音</span>
          <span className="text-xs text-slate-400">共 12 条</span>
        </h4>
        <div className="space-y-2">
          {historyRecords.map((item) => (
            <div 
              key={item.id}
              onClick={() => onOpenDetail(item.id)}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">{item.title}</div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>{item.duration}</span>
                  <span>·</span>
                  <span>{item.date}</span>
                  {item.hasTranscription && (
                    <>
                      <span>·</span>
                      <span className="text-green-600">已转写</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VoiceDetailPage({ id, onBack }: { id: string; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'play' | 'transcript'>('transcript');
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg -ml-2">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h3 className="font-semibold text-slate-800">转写详情</h3>
      </div>

      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-md mb-4">
          <Play className="w-7 h-7 text-primary-500 ml-1" />
        </div>
        <h4 className="font-medium text-slate-800">经济工作会议录音</h4>
        <p className="text-sm text-slate-500 mt-1">45:18 · 2026-06-18 14:20</p>
        <div className="mt-4">
          <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 w-1/3 rounded-full"></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>15:06</span>
            <span>45:18</span>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-100 rounded-lg p-0.5">
        <button 
          onClick={() => setActiveTab('play')}
          className={`flex-1 py-2 text-sm rounded-md ${activeTab === 'play' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}
        >
          播放
        </button>
        <button 
          onClick={() => setActiveTab('transcript')}
          className={`flex-1 py-2 text-sm rounded-md ${activeTab === 'transcript' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}
        >
          转写文稿
        </button>
      </div>

      {activeTab === 'transcript' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button className="text-xs text-slate-500 flex items-center gap-1">
              <Copy className="w-3 h-3" /> 复制
            </button>
            <button className="text-xs text-slate-500 flex items-center gap-1">
              <Download className="w-3 h-3" /> 导出
            </button>
            <button className="text-xs text-slate-500 flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> 编辑
            </button>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 max-h-80 overflow-y-auto">
            <div className="space-y-4">
              {[
                { time: '00:00', text: '各位听众朋友大家好，今天是2026年6月18日，欢迎收听昌平新闻。' },
                { time: '00:15', text: '今天上午，昌平区召开2026年经济工作会议，部署全年重点任务。' },
                { time: '00:32', text: '区委书记在会上强调，要坚持稳中求进工作总基调，推动经济高质量发展。' },
                { time: '01:05', text: '会议指出，上半年全区经济运行总体平稳，主要经济指标实现时间任务双过半。' },
                { time: '01:45', text: '下一步，要重点抓好以下几方面工作：' },
                { time: '02:00', text: '一是加快推进未来科学城建设，打造高水平创新平台。' },
                { time: '02:30', text: '二是深化回天地区综合治理，提升居民获得感幸福感。' },
                { time: '03:00', text: '三是持续优化营商环境，激发市场主体活力。' },
                { time: '03:30', text: '四是着力保障和改善民生，增进人民群众福祉。' },
                { time: '04:00', text: '会议还对安全生产、生态环保等工作进行了部署。' },
              ].map((item, index) => (
                <div key={index} className="flex gap-3">
                  <span className="text-xs text-primary-500 font-mono flex-shrink-0 mt-0.5">{item.time}</span>
                  <p className="text-sm text-slate-700 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <FileText className="w-5 h-5" />
            生成新闻稿件
          </button>
        </div>
      )}

      {activeTab === 'play' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-500">正在播放...</p>
        </div>
      )}
    </div>
  );
}

function TopicPage({ onCreate, onOpenDetail }: { onCreate: () => void; onOpenDetail: (t: Topic) => void }) {
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTopics = topics.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">选题申报</h3>
        <button 
          onClick={onCreate}
          className="text-primary-500 text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          申报选题
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: '全部' },
          { id: 'pending', label: '待审核' },
          { id: 'in_progress', label: '进行中' },
          { id: 'approved', label: '已通过' },
          { id: 'rejected', label: '已拒绝' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              filterStatus === tab.id ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredTopics.map(topic => (
          <div 
            key={topic.id}
            onClick={() => onOpenDetail(topic)}
            className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-medium text-slate-800 text-sm flex-1">{topic.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ml-2 flex-shrink-0 ${
                topic.status === 'approved' ? 'bg-green-100 text-green-600' :
                topic.status === 'rejected' ? 'bg-red-100 text-red-600' :
                topic.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                {topic.status === 'approved' ? '已通过' :
                 topic.status === 'rejected' ? '已拒绝' :
                 topic.status === 'in_progress' ? '进行中' : '待审核'}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{topic.description}</p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {topic.proposer}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {topic.createdAt}
                </span>
              </div>
              <span className={`flex items-center gap-1 ${
                topic.priority === 'high' ? 'text-red-500' :
                topic.priority === 'medium' ? 'text-yellow-500' : 'text-slate-400'
              }`}>
                {topic.priority === 'high' ? '紧急' : topic.priority === 'medium' ? '一般' : '普通'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicDetail({ topic, onBack }: { topic: Topic; onBack: () => void }) {
  const reviewSteps = [
    { step: '申报提交', status: 'done', time: topic.createdAt, user: topic.proposer },
    { step: '部门初审', status: topic.status !== 'pending' ? 'done' : 'current', time: '2026-06-16 10:30', user: '王主任' },
    { step: '编辑中心审核', status: topic.status === 'approved' || topic.status === 'rejected' || topic.status === 'in_progress' ? 'done' : 'pending', time: topic.status !== 'pending' ? '2026-06-17 14:20' : '', user: topic.status !== 'pending' ? '李总编' : '' },
    { step: '终审通过', status: topic.status === 'approved' ? 'done' : 'pending', time: topic.status === 'approved' ? '2026-06-18 09:00' : '', user: topic.status === 'approved' ? '张副总' : '' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg -ml-2">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h3 className="font-semibold text-slate-800">选题详情</h3>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-slate-800 flex-1">{topic.title}</h4>
          <span className={`px-2.5 py-1 rounded-full text-xs ml-2 flex-shrink-0 ${
            topic.status === 'approved' ? 'bg-green-100 text-green-600' :
            topic.status === 'rejected' ? 'bg-red-100 text-red-600' :
            topic.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
            'bg-yellow-100 text-yellow-600'
          }`}>
            {topic.status === 'approved' ? '已通过' :
             topic.status === 'rejected' ? '已拒绝' :
             topic.status === 'in_progress' ? '进行中' : '待审核'}
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{topic.description}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">申报人</span>
            <span className="text-slate-700">{topic.proposer}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">部门</span>
            <span className="text-slate-700">{topic.department}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">申报时间</span>
            <span className="text-slate-700">{topic.createdAt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">截止时间</span>
            <span className="text-slate-700">{topic.deadline}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">优先级</span>
            <span className={`${
              topic.priority === 'high' ? 'text-red-600' :
              topic.priority === 'medium' ? 'text-yellow-600' : 'text-slate-700'
            }`}>
              {topic.priority === 'high' ? '紧急' : topic.priority === 'medium' ? '一般' : '普通'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">参与记者</span>
            <span className="text-slate-700">{topic.assignees?.length || 0}人</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="font-medium text-slate-800 mb-4">审核进度</h4>
        <div className="space-y-4">
          {reviewSteps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'done' ? 'bg-green-500' :
                  step.status === 'current' ? 'bg-primary-500 animate-pulse' :
                  'bg-slate-200'
                }`}>
                  {step.status === 'done' ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs text-white font-medium">{index + 1}</span>
                  )}
                </div>
                {index < reviewSteps.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-1 ${
                    step.status === 'done' ? 'bg-green-500' : 'bg-slate-200'
                  }`}></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    step.status === 'pending' ? 'text-slate-400' : 'text-slate-800'
                  }`}>{step.step}</span>
                  {step.time && <span className="text-xs text-slate-400">{step.time}</span>}
                </div>
                {step.user && (
                  <p className="text-xs text-slate-500 mt-0.5">{step.user}</p>
                )}
                {step.status === 'current' && (
                  <p className="text-xs text-primary-500 mt-1">审核中，请稍候...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {topic.status === 'rejected' && (
        <div className="bg-red-50 rounded-xl p-4">
          <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            退回原因
          </h4>
          <p className="text-sm text-red-700">
            选题方向与近期报道计划重合，建议调整角度或与相关选题合并。请补充更多采访细节后重新申报。
          </p>
        </div>
      )}

      {topic.status === 'approved' && (
        <div className="bg-green-50 rounded-xl p-4">
          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            审核意见
          </h4>
          <p className="text-sm text-green-700">
            选题方向好，符合当前宣传重点。请尽快组织采访，确保按时完成。注意挖掘典型案例，增强报道深度。
          </p>
        </div>
      )}

      {topic.status !== 'rejected' && topic.status !== 'approved' && (
        <button className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl text-sm">
          查看更多审核详情
        </button>
      )}
    </div>
  );
}

function TopicForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg -ml-2">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h3 className="font-semibold text-slate-800">申报新选题</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-600 block mb-1.5">选题标题 <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入选题标题"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 block mb-1.5">选题描述 <span className="text-red-500">*</span></label>
          <textarea 
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述选题内容、采访计划、预期效果等..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 block mb-2">优先级</label>
          <div className="flex gap-2">
            {[
              { id: 'low', label: '普通' },
              { id: 'medium', label: '一般' },
              { id: 'high', label: '紧急' },
            ].map(level => (
              <button
                key={level.id}
                onClick={() => setPriority(level.id)}
                className={`flex-1 py-2 rounded-lg text-sm ${
                  priority === level.id 
                    ? level.id === 'high' ? 'bg-red-500 text-white' :
                      level.id === 'medium' ? 'bg-primary-500 text-white' :
                      'bg-slate-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-600 block mb-1.5">预计完成时间</label>
          <input 
            type="date"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 block mb-2">相关标签</label>
          <div className="flex flex-wrap gap-2">
            {['社会', '经济', '科技', '文旅', '教育', '卫生'].map(tag => (
              <button key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs hover:bg-primary-50 hover:text-primary-600">
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-600 block mb-1.5">附件素材</label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">点击上传相关素材或文档</p>
            <p className="text-xs text-slate-400 mt-1">支持图片、视频、文档等格式</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm">
          取消
        </button>
        <button 
          onClick={onSubmit}
          className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          提交申报
        </button>
      </div>
    </div>
  );
}

function ReporterProfile() {
  const menuItems = [
    { icon: FileText, label: '我的稿件', value: '128篇', color: 'text-blue-500' },
    { icon: Image, label: '素材库', value: '256个', color: 'text-green-500' },
    { icon: FileAudio, label: '语音转写', value: '45条', color: 'text-purple-500' },
    { icon: FileText, label: '选题申报', value: '32个', color: 'text-orange-500' },
    { icon: Award, label: '我的证书', value: '5个', color: 'text-yellow-500' },
    { icon: BookOpen, label: '培训学习', value: '学习中', color: 'text-indigo-500' },
  ];

  const settingsItems = [
    { icon: Bell, label: '消息通知' },
    { icon: Settings, label: '设置' },
    { icon: LogOut, label: '退出登录' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-primary-500 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <img src={reporterUser.avatar} alt="" className="w-16 h-16 rounded-full border-2 border-white/30" />
          <div>
            <div className="text-lg font-bold">{reporterUser.name}</div>
            <div className="text-sm text-white/70">{reporterUser.department}</div>
            <div className="text-xs text-white/60 mt-1">工号：CP00123 · 记者</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/20">
          <div className="text-center">
            <div className="text-xl font-bold">256</div>
            <div className="text-xs text-white/70">累计发稿</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">28</div>
            <div className="text-xs text-white/70">本月发稿</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">45</div>
            <div className="text-xs text-white/70">优质稿件</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button key={index} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 border-b border-slate-100 last:border-0">
              <div className={`w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left text-sm text-slate-700">{item.label}</span>
              <span className="text-xs text-slate-400">{item.value}</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {settingsItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button key={index} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 border-b border-slate-100 last:border-0">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <Icon className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left text-sm text-slate-700">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}