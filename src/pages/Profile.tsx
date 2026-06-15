import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Lock, ShieldCheck, Upload, ScanLine, Brain, FileDown } from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import { formatTime } from '../lib/utils';

export default function Profile() {
  const { resumes, settings, loadAllResumes, loadSettings } = useResumeStore();

  useEffect(() => {
    loadAllResumes();
    loadSettings();
  }, [loadAllResumes, loadSettings]);

  const latestResume = resumes[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-navy-700 mb-2">个人中心</h1>
        <p className="text-navy-400">查看本地账号状态、简历缓存、导入来源和导出前复查链路。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="card p-5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-navy-600" />
          </div>
          <p className="text-sm text-navy-400">我的简历</p>
          <p className="text-3xl font-semibold text-navy-700">{resumes.length}</p>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-navy-400">隐私模式状态</p>
          <p className="text-lg font-semibold text-navy-700">{settings.privacyMode ? 'AES 本地加密已开启' : '本地明文存储'}</p>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5 text-gold-600" />
          </div>
          <p className="text-sm text-navy-400">缓存记录</p>
          <p className="text-lg font-semibold text-navy-700">IndexedDB + SQLite 健康同步</p>
        </div>
      </div>

      <section className="card p-6 mb-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="section-title text-xl">最近简历工作流</h2>
            <p className="text-sm text-navy-400">保存来源、导入状态、诊断与导出前校验集中展示。</p>
          </div>
          <Link to="/templates" className="btn-primary inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            新建 / 导入
          </Link>
        </div>

        {latestResume ? (
          <div className="border border-navy-100 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-navy-700">{latestResume.title || '未命名简历'}</h3>
                <p className="text-sm text-navy-400">保存来源：{latestResume.templateId} · 最近更新：{formatTime(latestResume.updatedAt)}</p>
              </div>
              <Link to={`/editor/${latestResume.id}`} className="btn-secondary inline-flex items-center justify-center">
                继续编辑
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-navy-50 p-3">
                <Brain className="w-4 h-4 text-navy-600 mb-2" />
                <p className="font-medium text-navy-700">AI 诊断</p>
                <p className="text-navy-400">空洞表述、时序矛盾、技能关键词已接入</p>
              </div>
              <div className="rounded-lg bg-navy-50 p-3">
                <ScanLine className="w-4 h-4 text-navy-600 mb-2" />
                <p className="font-medium text-navy-700">ATS 检测</p>
                <p className="text-navy-400">字体嵌入、表格结构、超链接有效性可复查</p>
              </div>
              <div className="rounded-lg bg-navy-50 p-3">
                <FileDown className="w-4 h-4 text-navy-600 mb-2" />
                <p className="font-medium text-navy-700">Word 原生导出</p>
                <p className="text-navy-400">.docx 生成与模块顺序预览已同步</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-navy-400">暂无简历缓存，请先从模板库创建。</div>
        )}
      </section>
    </div>
  );
}

