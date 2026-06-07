import React, { useState, useEffect } from 'react';
import { Zap, Plus, Play, Settings, Clock, Brain, Lightbulb, Thermometer, Monitor, AlertCircle, Check } from 'lucide-react';
import * as api from '../api.js';

export default function Scenes() {
  const [scenes, setScenes] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [detected, setDetected] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [scenesRes, execRes, detectedRes, patternsRes] = await Promise.all([
        api.getScenes(),
        api.getSceneExecutions(),
        api.getDetectedScenes(),
        api.analyzeKnowledgeGraph()
      ]);
      setScenes(scenesRes.data);
      setExecutions(execRes.data);
      setDetected(detectedRes.data);
      setPatterns(patternsRes.data);
    } catch (e) {
      console.error('Failed to load scenes:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleExecute(sceneId) {
    setExecuting(sceneId);
    try {
      await api.executeScene(sceneId);
      await loadData();
    } catch (e) {
      alert('执行场景失败');
    } finally {
      setExecuting(null);
    }
  }

  const sceneIcons = {
    '观影模式': Monitor,
    '睡眠模式': Lightbulb,
    '回家模式': Zap,
    '离家模式': Settings
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">场景联动</h1>
          <p className="text-slate-400 mt-1">管理和执行智能场景</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={18} />
          创建场景
        </button>
      </div>

      {patterns.length > 0 && (
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-5 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="text-purple-400" size={22} />
            <h3 className="text-lg font-semibold text-white">知识图谱分析</h3>
          </div>
          <p className="text-purple-200 text-sm mb-4">基于家庭设备组合，AI自动识别潜在场景模式</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((pattern, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium">{pattern.patternName}</p>
                    <p className="text-slate-400 text-sm mt-1">{pattern.suggestion}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-purple-300">置信度</span>
                      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${pattern.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-purple-300">{Math.round(pattern.confidence * 100)}%</span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors">
                    创建
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map((scene) => {
          const Icon = sceneIcons[scene.name] || Zap;
          return (
            <div key={scene.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-blue-500/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Icon className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{scene.name}</h3>
                    <p className="text-slate-400 text-sm">{scene.description}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${scene.is_active ? 'bg-green-500' : 'bg-slate-500'}`} />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs text-slate-500">触发条件</p>
                <code className="text-xs bg-slate-900 p-2 rounded text-blue-300 block">
                  {scene.trigger_expression}
                </code>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs text-slate-500">执行动作 ({scene.action_queue?.length || 0})</p>
                <div className="flex flex-wrap gap-2">
                  {scene.action_queue?.map((action, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
                      {action.deviceId}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExecute(scene.id)}
                  disabled={executing === scene.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <Play size={16} className={executing === scene.id ? 'animate-pulse' : ''} />
                  {executing === scene.id ? '执行中...' : '执行'}
                </button>
                <button className="p-2.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                  <Settings size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={20} />
            最近执行记录
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {executions.slice(0, 10).map((exec) => (
              <div key={exec.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <div className={`p-1.5 rounded ${
                  exec.status === 'completed' ? 'bg-green-500/20' : 
                  exec.status === 'executing' ? 'bg-blue-500/20' : 'bg-red-500/20'
                }`}>
                  {exec.status === 'completed' ? (
                    <Check className="text-green-400" size={14} />
                  ) : exec.status === 'executing' ? (
                    <Play className="text-blue-400" size={14} />
                  ) : (
                    <AlertCircle className="text-red-400" size={14} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{exec.scene_name}</p>
                  <p className="text-xs text-slate-500">
                    触发: {exec.triggered_by} · {new Date(exec.started_at).toLocaleString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  exec.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  exec.status === 'executing' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {exec.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain size={20} />
            自动识别的场景
          </h3>
          <div className="space-y-3">
            {detected.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div>
                  <p className="text-white font-medium">{d.scene_name}</p>
                  <p className="text-slate-400 text-sm">基于 {d.device_combination?.length} 个设备组合</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">置信度 {Math.round(d.confidence * 100)}%</span>
                    {d.confirmed ? (
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">已确认</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">待确认</span>
                    )}
                  </div>
                </div>
                {!d.confirmed && (
                  <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
                    确认
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
