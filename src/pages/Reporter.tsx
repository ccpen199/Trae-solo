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
  Sparkles
} from 'lucide-react';
import { materials, topics, reporters, currentUser } from '../data/mockData';
import type { Topic } from '../types';

export default function Reporter() {
  const [activeTab, setActiveTab] = useState<'home' | 'materials' | 'topics' | 'voice' | 'profile'>('home');

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gradient-to-b from-primary-500 to-primary-600 rounded-t-3xl p-6 text-white">
        <div className="flex items-center gap-4 mb-6">
          <img src={currentUser.avatar} alt="" className="w-14 h-14 rounded-full border-2 border-white/30" />
          <div>
            <div className="text-lg font-bold">{currentUser.name}</div>
            <div className="text-sm text-white/70">{currentUser.department}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">23</div>
            <div className="text-xs text-white/70">今日素材</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs text-white/70">待办任务</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-white/70">在审稿件</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-3xl -mt-2 pt-4 px-4 pb-20 relative z-10 shadow-lg">
        {activeTab === 'home' && <ReporterHome />}
        {activeTab === 'materials' && <MaterialUpload />}
        {activeTab === 'topics' && <TopicDeclaration />}
        {activeTab === 'voice' && <VoiceTranscription />}
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

function ReporterHome() {
  return (
    <div className="space-y-4">
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
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-800 text-sm">重要任务</div>
          <div className="text-xs text-slate-500">经济工作会议专题报道</div>
        </div>
        <button className="text-xs text-primary-500 font-medium">前往</button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">最近素材</h3>
          <button className="text-xs text-primary-500">查看全部</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {materials.slice(0, 6).map((material, index) => (
            <div key={material.id} className="aspect-square rounded-lg overflow-hidden relative">
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
            <div key={topic.id} className="p-3 bg-slate-50 rounded-xl">
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
    </div>
  );
}

function MaterialUpload() {
  const [uploadMode, setUploadMode] = useState<'gallery' | 'camera' | 'video' | 'audio'>('gallery');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">素材回传</h3>
        <button className="text-primary-500 text-sm font-medium flex items-center gap-1">
          <Upload className="w-4 h-4" />
          上传
        </button>
      </div>

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
              src={`https://images.unsplash.com/photo-${1500000000000 + index * 1000}?w=200&h=200&fit=crop`}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/200/200?random=${index}`;
              }}
            />
            <div className="absolute top-2 right-2">
              <input 
                type="checkbox" 
                checked={selectedFiles.includes(String(index))}
                onChange={() => {
                  setSelectedFiles(prev => 
                    prev.includes(String(index))
                      ? prev.filter(i => i !== String(index))
                      : [...prev, String(index)]
                  );
                }}
                className="w-5 h-5 rounded-full"
              />
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

      <button className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2">
        <Upload className="w-5 h-5" />
        上传 {selectedFiles.length} 个素材
      </button>
    </div>
  );
}

function VoiceTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    setRecordDuration(0);
    const timer = setInterval(() => {
      setRecordDuration(d => d + 1);
    }, 1000);
    // @ts-ignore
    window.recordingTimer = timer;
  };

  const stopRecording = () => {
    setIsRecording(false);
    // @ts-ignore
    if (window.recordingTimer) clearInterval(window.recordingTimer);
    setIsTranscribing(true);
    setTimeout(() => {
      setIsTranscribing(false);
      setTranscription('各位听众朋友大家好，今天是2026年6月18日，欢迎收听昌平新闻。今天上午，昌平区召开2026年经济工作会议，部署全年重点任务。区委书记在会上强调，要坚持稳中求进工作总基调，推动经济高质量发展...');
    }, 2000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
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

      {transcription && (
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
              <button className="text-xs text-slate-500 flex items-center gap-1">
                <Download className="w-3 h-3" /> 导出
              </button>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-700 leading-relaxed">{transcription}</p>
          </div>
          <button className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            生成稿件
          </button>
        </div>
      )}

      <div>
        <h4 className="font-medium text-slate-800 text-sm mb-3">历史录音</h4>
        <div className="space-y-2">
          {[
            { title: '草莓节现场采访', duration: '05:32', date: '今天 10:30' },
            { title: '经济工作会议录音', duration: '45:18', date: '昨天 14:20' },
            { title: '社区居民采访', duration: '08:15', date: '前天 09:15' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">{item.title}</div>
                <div className="text-xs text-slate-500">{item.duration} · {item.date}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopicDeclaration() {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return <TopicForm onCancel={() => setShowForm(false)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">选题申报</h3>
        <button 
          onClick={() => setShowForm(true)}
          className="text-primary-500 text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          申报选题
        </button>
      </div>

      <div className="flex gap-2">
        {['全部', '待审核', '进行中', '已通过', '已拒绝'].map((tab, index) => (
          <button
            key={tab}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              index === 0 ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {topics.map(topic => (
          <div key={topic.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="font-medium text-slate-800 text-sm">{topic.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
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

function TopicForm({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-slate-600">
          ← 返回
        </button>
        <h3 className="font-semibold text-slate-800">申报新选题</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-600 block mb-1">选题标题 <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            placeholder="请输入选题标题"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 block mb-1">选题描述 <span className="text-red-500">*</span></label>
          <textarea 
            rows={4}
            placeholder="请详细描述选题内容、采访计划等..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 block mb-1">优先级</label>
          <div className="flex gap-2">
            {['普通', '一般', '紧急'].map((level, index) => (
              <button
                key={level}
                className={`flex-1 py-2 rounded-lg text-sm ${
                  index === 1 ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-600 block mb-1">预计完成时间</label>
          <input 
            type="date"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 block mb-1">相关标签</label>
          <div className="flex flex-wrap gap-2">
            {['社会', '经济', '科技', '文旅', '教育', '卫生'].map(tag => (
              <button key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs hover:bg-primary-50 hover:text-primary-600">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm">
          取消
        </button>
        <button className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
          <Send className="w-4 h-4" />
          提交申报
        </button>
      </div>
    </div>
  );
}

function ReporterProfile() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-primary-500 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <img src={currentUser.avatar} alt="" className="w-16 h-16 rounded-full border-2 border-white/30" />
          <div>
            <div className="text-lg font-bold">{currentUser.name}</div>
            <div className="text-sm text-white/70">{currentUser.department}</div>
            <div className="text-xs text-white/60 mt-1">工号：CP00123</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '累计发稿', value: '256' },
          { label: '本月发稿', value: '28' },
          { label: '优质稿件', value: '45' },
        ].map((item, index) => (
          <div key={index} className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-slate-800">{item.value}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {[
          { icon: FileText, label: '我的稿件', value: '查看全部' },
          { icon: Folder, label: '素材库', value: '156个素材' },
          { icon: MessageSquare, label: '消息通知', value: '3条未读' },
          { icon: Settings, label: '设置', value: '' },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <button key={index} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0">
              <Icon className="w-5 h-5 text-slate-400" />
              <span className="flex-1 text-left text-sm text-slate-700">{item.label}</span>
              <span className="text-xs text-slate-400">{item.value}</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
