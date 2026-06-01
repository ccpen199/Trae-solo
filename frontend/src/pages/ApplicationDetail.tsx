import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Info,
  Server,
  GitBranch,
  Key,
  Clock,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { applicationApi, environmentApi, secretApi } from '../api/client';
import type {
  Application,
  Environment,
  AppVersion,
  SecretKey,
  TimelineEvent,
  EnvType,
  SecretStatus,
} from '../types';

const tabs = [
  { id: 'info', label: '基础信息', icon: Info },
  { id: 'environments', label: '环境配置', icon: Server },
  { id: 'versions', label: '版本管理', icon: GitBranch },
  { id: 'secrets', label: '密钥管理', icon: Key },
  { id: 'timeline', label: '时间线', icon: Clock },
];

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('info');
  const [application, setApplication] = useState<Application | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [secrets, setSecrets] = useState<SecretKey[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'env' | 'secret' | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [envForm, setEnvForm] = useState({
    name: '',
    type: 'dev' as EnvType,
    config: '',
    status: 'active' as const,
  });

  const [versionForm, setVersionForm] = useState({
    version: '',
    branch: '',
    commitHash: '',
    dependencies: '',
  });

  const [secretForm, setSecretForm] = useState({
    name: '',
    type: '',
    value: '',
    expiresAt: '',
    status: 'active' as SecretStatus,
  });

  useEffect(() => {
    if (id) {
      loadData(parseInt(id));
    }
  }, [id]);

  const loadData = async (appId: number) => {
    setLoading(true);
    try {
      const [app, envs, vers, secs, tl] = await Promise.all([
        applicationApi.get(appId) as Promise<Application>,
        applicationApi.getEnvironments(appId) as Promise<Environment[]>,
        applicationApi.getVersions(appId) as Promise<AppVersion[]>,
        applicationApi.getSecrets(appId) as Promise<SecretKey[]>,
        applicationApi.getTimeline(appId) as Promise<TimelineEvent[]>,
      ]);
      setApplication(app);
      setEnvironments(envs);
      setVersions(vers);
      setSecrets(secs);
      setTimeline(tl);
    } catch {
      error('加载应用详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEnv = async () => {
    if (!id) return;
    try {
      await applicationApi.createEnvironment(parseInt(id), envForm);
      success('环境创建成功');
      setShowEnvModal(false);
      loadData(parseInt(id));
    } catch {
      error('创建环境失败');
    }
  };

  const handleSaveVersion = async () => {
    if (!id) return;
    try {
      await applicationApi.createVersion(parseInt(id), versionForm);
      success('版本创建成功');
      setShowVersionModal(false);
      loadData(parseInt(id));
    } catch {
      error('创建版本失败');
    }
  };

  const handleSaveSecret = async () => {
    if (!id) return;
    try {
      await applicationApi.createSecret(parseInt(id), secretForm);
      success('密钥创建成功');
      setShowSecretModal(false);
      loadData(parseInt(id));
    } catch {
      error('创建密钥失败');
    }
  };

  const handleDeleteClick = (type: 'env' | 'secret', itemId: number) => {
    setDeleteType(type);
    setDeleteId(itemId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteId || !id) return;
    try {
      if (deleteType === 'env') {
        await environmentApi.delete(deleteId);
      } else if (deleteType === 'secret') {
        await secretApi.delete(deleteId);
      }
      success('删除成功');
      setShowDeleteConfirm(false);
      loadData(parseInt(id));
    } catch {
      error('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-1/4" />
        <div className="card p-6">
          <div className="h-64 bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">应用不存在</p>
        <Link to="/applications" className="btn-primary mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const renderInfoTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">基础信息</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">应用名称</label>
            <p className="font-medium">{application.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">应用编码</label>
            <code className="font-mono text-sm bg-gray-100 px-2 py-0.5">
              {application.code}
            </code>
          </div>
          <div>
            <label className="text-sm text-gray-500">负责人</label>
            <p>{application.owner?.username || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">状态</label>
            <p>
              <StatusBadge status={application.status} />
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">创建时间</label>
            <p>{new Date(application.createdAt).toLocaleString('zh-CN')}</p>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">描述</h3>
        <p className="text-gray-700 whitespace-pre-wrap">
          {application.description || '暂无描述'}
        </p>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium mb-3">统计信息</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">环境数量</p>
              <p className="text-xl font-bold">{environments.length}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">版本数量</p>
              <p className="text-xl font-bold">{versions.length}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">密钥数量</p>
              <p className="text-xl font-bold">{secrets.length}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">更新时间</p>
              <p className="text-sm">
                {new Date(application.updatedAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnvironmentsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">环境配置</h3>
        <button
          onClick={() => setShowEnvModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增环境
        </button>
      </div>
      <div className="grid gap-4">
        {environments.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            暂无环境配置
          </div>
        ) : (
          environments.map((env) => (
            <div key={env.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{env.name}</h4>
                    <StatusBadge status={env.type} />
                    <StatusBadge status={env.status} />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    创建于 {new Date(env.createdAt).toLocaleString('zh-CN')}
                  </p>
                  {env.config && (
                    <pre className="mt-3 p-3 bg-gray-900 text-green-400 text-sm font-mono overflow-x-auto rounded">
                      {env.config}
                    </pre>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteClick('env', env.id)}
                  className="p-2 hover:bg-gray-100 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderVersionsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">版本管理</h3>
        <button
          onClick={() => setShowVersionModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增版本
        </button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">版本号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">分支</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Commit</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {versions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                  暂无版本记录
                </td>
              </tr>
            ) : (
              versions.map((v) => (
                <tr key={v.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <code className="font-mono bg-gray-100 px-2 py-0.5 text-sm">
                      {v.version}
                    </code>
                  </td>
                  <td className="px-4 py-3">{v.branch || '-'}</td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-sm text-gray-600">
                      {v.commitHash?.slice(0, 8) || '-'}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(v.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSecretsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">密钥管理</h3>
        <button
          onClick={() => setShowSecretModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增密钥
        </button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">类型</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">过期时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {secrets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  暂无密钥
                </td>
              </tr>
            ) : (
              secrets.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {s.expiresAt
                      ? new Date(s.expiresAt).toLocaleString('zh-CN')
                      : '永不过期'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-100 text-navy-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick('secret', s.id)}
                        className="p-1 hover:bg-gray-100 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTimelineTab = () => <Timeline events={timeline} />;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab();
      case 'environments':
        return renderEnvironmentsTab();
      case 'versions':
        return renderVersionsTab();
      case 'secrets':
        return renderSecretsTab();
      case 'timeline':
        return renderTimelineTab();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/applications"
          className="p-2 hover:bg-gray-100 rounded"
          title="返回列表"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{application.name}</h1>
          <p className="text-gray-500">
            应用编码: <code className="font-mono">{application.code}</code>
          </p>
        </div>
        <StatusBadge status={application.status} size="md" />
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-navy-900 text-navy-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">{renderTabContent()}</div>
      </div>

      <Modal
        isOpen={showEnvModal}
        onClose={() => setShowEnvModal(false)}
        title="新增环境"
        footer={
          <>
            <button onClick={() => setShowEnvModal(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSaveEnv} className="btn-primary">
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">环境名称 *</label>
            <input
              type="text"
              value={envForm.name}
              onChange={(e) => setEnvForm({ ...envForm, name: e.target.value })}
              className="input"
              placeholder="如: 生产环境"
            />
          </div>
          <div>
            <label className="label">环境类型 *</label>
            <select
              value={envForm.type}
              onChange={(e) => setEnvForm({ ...envForm, type: e.target.value as EnvType })}
              className="input"
            >
              <option value="dev">开发</option>
              <option value="test">测试</option>
              <option value="staging">预发布</option>
              <option value="prod">生产</option>
            </select>
          </div>
          <div>
            <label className="label">配置内容 (JSON)</label>
            <textarea
              value={envForm.config}
              onChange={(e) => setEnvForm({ ...envForm, config: e.target.value })}
              className="input min-h-[150px] font-mono text-sm"
              placeholder='{"key": "value"}'
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        title="新增版本"
        footer={
          <>
            <button onClick={() => setShowVersionModal(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSaveVersion} className="btn-primary">
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">版本号 *</label>
            <input
              type="text"
              value={versionForm.version}
              onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })}
              className="input"
              placeholder="如: v1.0.0"
            />
          </div>
          <div>
            <label className="label">分支</label>
            <input
              type="text"
              value={versionForm.branch}
              onChange={(e) => setVersionForm({ ...versionForm, branch: e.target.value })}
              className="input"
              placeholder="如: main"
            />
          </div>
          <div>
            <label className="label">Commit Hash</label>
            <input
              type="text"
              value={versionForm.commitHash}
              onChange={(e) =>
                setVersionForm({ ...versionForm, commitHash: e.target.value })
              }
              className="input font-mono"
              placeholder="完整的 commit hash"
            />
          </div>
          <div>
            <label className="label">依赖信息 (JSON)</label>
            <textarea
              value={versionForm.dependencies}
              onChange={(e) =>
                setVersionForm({ ...versionForm, dependencies: e.target.value })
              }
              className="input min-h-[100px] font-mono text-sm"
              placeholder='{"package": "version"}'
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSecretModal}
        onClose={() => setShowSecretModal(false)}
        title="新增密钥"
        footer={
          <>
            <button onClick={() => setShowSecretModal(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSaveSecret} className="btn-primary">
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">密钥名称 *</label>
            <input
              type="text"
              value={secretForm.name}
              onChange={(e) => setSecretForm({ ...secretForm, name: e.target.value })}
              className="input"
              placeholder="如: DB_PASSWORD"
            />
          </div>
          <div>
            <label className="label">类型 *</label>
            <select
              value={secretForm.type}
              onChange={(e) => setSecretForm({ ...secretForm, type: e.target.value })}
              className="input"
            >
              <option value="">请选择</option>
              <option value="password">密码</option>
              <option value="api_key">API Key</option>
              <option value="token">Token</option>
              <option value="certificate">证书</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div>
            <label className="label">密钥值 *</label>
            <input
              type="password"
              value={secretForm.value}
              onChange={(e) => setSecretForm({ ...secretForm, value: e.target.value })}
              className="input"
              placeholder="请输入密钥值"
            />
          </div>
          <div>
            <label className="label">过期时间</label>
            <input
              type="datetime-local"
              value={secretForm.expiresAt}
              onChange={(e) =>
                setSecretForm({ ...secretForm, expiresAt: e.target.value })
              }
              className="input"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="确认删除"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleDelete} className="btn-danger">
              确认删除
            </button>
          </>
        }
      >
        <p className="text-gray-700">确定要删除此项吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
}
