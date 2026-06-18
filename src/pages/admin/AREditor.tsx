import { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Save, Eye, ArrowLeft, Upload, ImageIcon, Volume2 } from 'lucide-react';
import { useAREditorStore } from '@/store/useAREditorStore';
import ModelPreview from '@/components/three/ModelPreview';
import TimelineEditor from '@/components/three/TimelineEditor';
import type { TimelineSegment, InteractionNode } from '@/types';

const LANG_LABELS: Record<string, string> = {
  'zh-CN': '中文',
  'en-US': '英文',
  'ja-JP': '日文',
};

function SelectedSegmentPanel({ segment }: { segment: TimelineSegment }) {
  const config: Record<string, string> = {
    audio: '音频片段',
    'model-animation': '动画片段',
    interaction: '互动节点',
    image: '图片片段',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">片段类型</span>
        <span className="text-xs text-amber-400">{config[segment.type] ?? segment.type}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">开始时间</span>
        <span className="text-xs text-[var(--text-primary)] font-mono">{segment.startTime}s</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">结束时间</span>
        <span className="text-xs text-[var(--text-primary)] font-mono">{segment.endTime}s</span>
      </div>
      {segment.label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">标签</span>
          <span className="text-xs text-[var(--text-primary)]">{segment.label}</span>
        </div>
      )}
    </div>
  );
}

function InteractionPanel({ interaction }: { interaction: InteractionNode }) {
  return (
    <div className="space-y-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-amber-400">
          {interaction.type === 'quiz' ? '问答互动' : interaction.type === 'hotspot' ? '热点标注' : '分享互动'}
        </span>
        <span className="text-xs text-[var(--text-muted)] font-mono">{interaction.triggerTime}s</span>
      </div>
      {interaction.question && (
        <div>
          <span className="text-[10px] text-[var(--text-muted)]">问题</span>
          <p className="text-xs text-[var(--text-primary)] mt-0.5">{interaction.question}</p>
        </div>
      )}
      {interaction.options && (
        <div className="space-y-1">
          <span className="text-[10px] text-[var(--text-muted)]">选项</span>
          {interaction.options.map((opt, i) => (
            <div
              key={i}
              className={`text-xs px-2 py-1 rounded ${
                opt.correct ? 'bg-green-900/30 text-green-400' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              {opt.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentPropertiesPanel() {
  const { currentContent } = useAREditorStore();
  if (!currentContent) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">内容ID</span>
        <span className="text-xs text-[var(--text-secondary)] font-mono">{currentContent.id}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">模型缩放</span>
        <span className="text-xs text-[var(--text-primary)]">{currentContent.modelScale ?? 1}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">时间轴片段</span>
        <span className="text-xs text-[var(--text-primary)]">{currentContent.timeline.length}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">互动节点</span>
        <span className="text-xs text-[var(--text-primary)]">{currentContent.interactions?.length ?? 0}</span>
      </div>
    </div>
  );
}

function PropertyPanel() {
  const { currentContent, selectedTimelineSegment, selectSegment } = useAREditorStore();

  const selectedSegment = useMemo(() => {
    if (!selectedTimelineSegment || !currentContent) return null;
    return currentContent.timeline.find((s) => s.id === selectedTimelineSegment) ?? null;
  }, [selectedTimelineSegment, currentContent]);

  const selectedInteraction = useMemo(() => {
    if (!selectedSegment || !currentContent) return null;
    const interactionId = selectedSegment.payload?.interactionId as string | undefined;
    if (!interactionId) return null;
    return currentContent.interactions?.find((i) => i.id === interactionId) ?? null;
  }, [selectedSegment, currentContent]);

  if (!currentContent) return null;

  return (
    <div className="space-y-4">
      {selectedSegment ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">片段属性</h3>
            <button
              onClick={() => selectSegment(null)}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              取消选择
            </button>
          </div>
          <SelectedSegmentPanel segment={selectedSegment} />
          {selectedInteraction && <InteractionPanel interaction={selectedInteraction} />}
        </>
      ) : (
        <>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">内容属性</h3>
          <ContentPropertiesPanel />
        </>
      )}

      <div className="border-t border-[var(--border)] pt-3">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">互动节点</h3>
        {currentContent.interactions && currentContent.interactions.length > 0 ? (
          <div className="space-y-2">
            {currentContent.interactions.map((interaction) => (
              <InteractionPanel key={interaction.id} interaction={interaction} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">暂无互动节点</p>
        )}
      </div>

      <div className="border-t border-[var(--border)] pt-3">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">音频轨道</h3>
        {currentContent.audioTracks && currentContent.audioTracks.length > 0 ? (
          <div className="space-y-2">
            {currentContent.audioTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                <Volume2 size={12} className="text-green-400" />
                <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{track.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400">
                  {LANG_LABELS[track.language] ?? track.language}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">{track.duration}s</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">暂无音频轨道</p>
        )}
        <button className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-amber-400 border border-amber-600/30 rounded py-1.5 hover:bg-amber-900/20 transition-colors">
          <Upload size={12} />
          上传配音
        </button>
      </div>

      <div className="border-t border-[var(--border)] pt-3">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">历史影像</h3>
        {currentContent.historyImages && currentContent.historyImages.length > 0 ? (
          <div className="space-y-2">
            {currentContent.historyImages.map((img) => (
              <div
                key={img.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                <ImageIcon size={12} className="text-purple-400" />
                <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{img.caption}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{img.year}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">暂无历史影像</p>
        )}
      </div>
    </div>
  );
}

export default function AREditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentContent, loadARContent } = useAREditorStore();

  const poiId = searchParams.get('poiId');

  useEffect(() => {
    if (poiId) {
      loadARContent(poiId);
    }
  }, [poiId, loadARContent]);

  if (!poiId || !currentContent) {
    return (
      <div className="w-full h-screen flex flex-col bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">AR内容编辑器</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--text-muted)] text-sm">请选择一个POI点位来编辑AR内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-[var(--bg-primary)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">AR内容编辑器</h1>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
          <Eye size={14} />
          预览
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-xs text-white hover:bg-amber-500 transition-colors">
          <Save size={14} />
          保存
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-[40%] p-3">
          <ModelPreview modelUrl={currentContent.modelUrl} />
        </div>
        <div className="w-[40%] p-3">
          <TimelineEditor />
        </div>
        <div className="w-[20%] p-3 overflow-y-auto border-l border-[var(--border)]">
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
}
