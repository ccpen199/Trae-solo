import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { scenesApi, devicesApi } from '../api';

const TRIGGER_TYPES = [
  { value: 'manual', label: '手动触发', icon: '👆' },
  { value: 'time', label: '定时触发', icon: '⏰' },
  { value: 'sensor', label: '传感器触发', icon: '🌡️' },
  { value: 'location', label: '地理位置触发', icon: '📍' },
];

const COMMAND_OPTIONS = [
  { value: 'turn_on', label: '开启' },
  { value: 'turn_off', label: '关闭' },
  { value: 'set_brightness', label: '设置亮度' },
  { value: 'set_temperature', label: '设置温度' },
];

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DAY_VALUES = [0, 1, 2, 3, 4, 5, 6];

interface ActionRow {
  device_id: string;
  command: string;
  value: string;
}

interface SceneFormState {
  name: string;
  description: string;
  trigger_type: string;
  time: string;
  days: number[];
  sensor_device_id: string;
  sensor_condition: string;
  sensor_threshold: string;
  location_name: string;
  location_radius: string;
  actions: ActionRow[];
}

const EMPTY_FORM: SceneFormState = {
  name: '',
  description: '',
  trigger_type: 'manual',
  time: '08:00',
  days: [1, 2, 3, 4, 5],
  sensor_device_id: '',
  sensor_condition: 'above',
  sensor_threshold: '',
  location_name: '',
  location_radius: '500',
  actions: [{ device_id: '', command: 'turn_on', value: '' }],
};

function buildTriggerConfig(form: SceneFormState): Record<string, any> {
  switch (form.trigger_type) {
    case 'time':
      return { time: form.time, days: form.days };
    case 'sensor':
      return { device_id: form.sensor_device_id, condition: form.sensor_condition, threshold: Number(form.sensor_threshold) };
    case 'location':
      return { name: form.location_name, radius: Number(form.location_radius) };
    default:
      return {};
  }
}

function parseTriggerConfig(triggerType: string, config: Record<string, any>): Partial<SceneFormState> {
  switch (triggerType) {
    case 'time':
      return {
        time: config.time || '08:00',
        days: Array.isArray(config.days) ? config.days : [1, 2, 3, 4, 5],
      };
    case 'sensor':
      return {
        sensor_device_id: config.device_id || '',
        sensor_condition: config.condition || 'above',
        sensor_threshold: config.threshold != null ? String(config.threshold) : '',
      };
    case 'location':
      return {
        location_name: config.name || '',
        location_radius: config.radius != null ? String(config.radius) : '500',
      };
    default:
      return {};
  }
}

function getTriggerDescription(scene: any): string {
  switch (scene.trigger_type) {
    case 'manual':
      return '手动触发';
    case 'time': {
      const config = scene.trigger_config || {};
      const time = config.time || '--:--';
      const dayLabels = (config.days || []).map((d: number) => `周${DAY_LABELS[d]}`).join('、');
      return dayLabels ? `每周${dayLabels} ${time}` : `每天 ${time}`;
    }
    case 'sensor': {
      const config = scene.trigger_config || {};
      const condMap: Record<string, string> = { above: '高于', below: '低于', equal: '等于' };
      const cond = condMap[config.condition] || config.condition;
      return `传感器${cond} ${config.threshold ?? '-'}`;
    }
    case 'location': {
      const config = scene.trigger_config || {};
      return `${config.name || '未知位置'} 半径${config.radius ?? '-'}米`;
    }
    default:
      return scene.trigger_type;
  }
}

function getTriggerIcon(type: string): string {
  return TRIGGER_TYPES.find(t => t.value === type)?.icon || '🎯';
}

export default function ScenesPage() {
  const [scenes, setScenes] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [sceneLogs, setSceneLogs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SceneFormState>({ ...EMPTY_FORM });
  const [successMsg, setSuccessMsg] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadData();
    if (searchParams.get('action') === 'create') {
      openCreateModal();
    }
  }, []);

  const loadData = async () => {
    try {
      const [scenesRes, devicesRes] = await Promise.all([
        scenesApi.getScenes(),
        devicesApi.getDevices(),
      ]);
      setScenes(scenesRes.data);
      setDevices(devicesRes.data);
      scenesRes.data.forEach((scene: any) => {
        loadSceneLog(scene.id);
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSceneLog = async (sceneId: string) => {
    try {
      const res = await scenesApi.getLogs(sceneId);
      const logs = res.data;
      if (Array.isArray(logs) && logs.length > 0) {
        setSceneLogs(prev => ({ ...prev, [sceneId]: logs[0] }));
      }
    } catch {
      // ignore
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEditModal = (scene: any) => {
    setEditingId(scene.id);
    const parsed = parseTriggerConfig(scene.trigger_type, scene.trigger_config || {});
    const actions: ActionRow[] = Array.isArray(scene.actions) && scene.actions.length > 0
      ? scene.actions.map((a: any) => ({
          device_id: a.device_id || '',
          command: a.command || 'turn_on',
          value: a.value != null ? String(a.value) : '',
        }))
      : [{ device_id: '', command: 'turn_on', value: '' }];
    setForm({
      name: scene.name || '',
      description: scene.description || '',
      trigger_type: scene.trigger_type || 'manual',
      time: '08:00',
      days: [1, 2, 3, 4, 5],
      sensor_device_id: '',
      sensor_condition: 'above',
      sensor_threshold: '',
      location_name: '',
      location_radius: '500',
      ...parsed,
      actions,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const updateForm = (partial: Partial<SceneFormState>) => {
    setForm(prev => ({ ...prev, ...partial }));
  };

  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  const addActionRow = () => {
    setForm(prev => ({
      ...prev,
      actions: [...prev.actions, { device_id: '', command: 'turn_on', value: '' }],
    }));
  };

  const removeActionRow = (index: number) => {
    setForm(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateActionRow = (index: number, field: keyof ActionRow, value: string) => {
    setForm(prev => {
      const actions = [...prev.actions];
      actions[index] = { ...actions[index], [field]: value };
      return { ...prev, actions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const triggerConfig = buildTriggerConfig(form);
    const actions = form.actions
      .filter(a => a.device_id)
      .map(a => ({
        device_id: a.device_id,
        command: a.command,
        ...(a.value ? { value: Number(a.value) } : {}),
      }));

    const payload = {
      name: form.name,
      description: form.description,
      trigger_type: form.trigger_type,
      trigger_config: triggerConfig,
      actions,
    };

    try {
      if (editingId) {
        await scenesApi.updateScene(editingId, payload);
        setSuccessMsg('场景更新成功');
      } else {
        await scenesApi.createScene(payload);
        setSuccessMsg('场景创建成功');
      }
      closeModal();
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Failed to save scene:', error);
    }
  };

  const handleExecute = async (id: string) => {
    try {
      await scenesApi.executeScene(id);
      setSuccessMsg('场景执行成功');
      loadSceneLog(id);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Failed to execute scene:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此场景？')) return;
    try {
      await scenesApi.deleteScene(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete scene:', error);
    }
  };

  const handleToggleEnabled = async (scene: any) => {
    try {
      await scenesApi.updateScene(scene.id, { enabled: !scene.enabled });
      loadData();
    } catch (error) {
      console.error('Failed to toggle scene:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const renderTriggerConfig = () => {
    switch (form.trigger_type) {
      case 'time':
        return (
          <>
            <div className="form-group">
              <label className="form-label">触发时间</label>
              <input
                type="time"
                className="form-input"
                value={form.time}
                onChange={e => updateForm({ time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">重复日期</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DAY_VALUES.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    style={{
                      width: '40px',
                      height: '36px',
                      borderRadius: '6px',
                      border: `1px solid ${form.days.includes(d) ? 'var(--primary)' : 'var(--gray-300)'}`,
                      background: form.days.includes(d) ? 'var(--primary)' : 'var(--white)',
                      color: form.days.includes(d) ? 'var(--white)' : 'var(--gray-600)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {DAY_LABELS[i]}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      case 'sensor':
        return (
          <>
            <div className="form-group">
              <label className="form-label">传感器设备</label>
              <select
                className="form-input"
                value={form.sensor_device_id}
                onChange={e => updateForm({ sensor_device_id: e.target.value })}
              >
                <option value="">请选择传感器</option>
                {devices
                  .filter(d => d.type === 'sensor')
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                {devices.filter(d => d.type === 'sensor').length === 0 && (
                  devices.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))
                )}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">条件</label>
                <select
                  className="form-input"
                  value={form.sensor_condition}
                  onChange={e => updateForm({ sensor_condition: e.target.value })}
                >
                  <option value="above">高于</option>
                  <option value="below">低于</option>
                  <option value="equal">等于</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">阈值</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.sensor_threshold}
                  onChange={e => updateForm({ sensor_threshold: e.target.value })}
                  placeholder="请输入阈值"
                />
              </div>
            </div>
          </>
        );
      case 'location':
        return (
          <>
            <div className="form-group">
              <label className="form-label">位置名称</label>
              <input
                type="text"
                className="form-input"
                value={form.location_name}
                onChange={e => updateForm({ location_name: e.target.value })}
                placeholder="例如：家、公司"
              />
            </div>
            <div className="form-group">
              <label className="form-label">触发半径（米）</label>
              <input
                type="number"
                className="form-input"
                value={form.location_radius}
                onChange={e => updateForm({ location_radius: e.target.value })}
                placeholder="500"
              />
            </div>
          </>
        );
      default:
        return (
          <div style={{ padding: '12px 0', fontSize: '14px', color: 'var(--gray-500)' }}>
            手动触发无需额外配置
          </div>
        );
    }
  };

  const renderActionBuilder = () => (
    <div className="form-group">
      <label className="form-label">执行动作</label>
      {form.actions.map((action, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <select
            className="form-input"
            style={{ flex: 2 }}
            value={action.device_id}
            onChange={e => updateActionRow(index, 'device_id', e.target.value)}
          >
            <option value="">选择设备</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            className="form-input"
            style={{ flex: 1.5 }}
            value={action.command}
            onChange={e => updateActionRow(index, 'command', e.target.value)}
          >
            {COMMAND_OPTIONS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {(action.command === 'set_brightness' || action.command === 'set_temperature') && (
            <input
              type="number"
              className="form-input"
              style={{ flex: 1 }}
              value={action.value}
              onChange={e => updateActionRow(index, 'value', e.target.value)}
              placeholder={action.command === 'set_brightness' ? '亮度' : '温度'}
            />
          )}
          {form.actions.length > 1 && (
            <button
              type="button"
              onClick={() => removeActionRow(index)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid var(--danger)',
                background: 'var(--white)',
                color: 'var(--danger)',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addActionRow}
        style={{
          background: 'none',
          border: `1px dashed var(--gray-300)`,
          borderRadius: '6px',
          padding: '8px',
          width: '100%',
          color: 'var(--primary)',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        + 添加动作
      </button>
    </div>
  );

  const renderSceneCards = () => {
    if (scenes.length === 0) {
      return (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">🎬</div>
              <div className="empty-title">暂无场景</div>
              <div className="empty-description">创建自动化场景，让设备按您的意愿自动运行</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-3">
        {scenes.map(scene => {
          const log = sceneLogs[scene.id];
          return (
            <div key={scene.id} className="scene-card">
              <div className="scene-header">
                <div className="scene-name">{scene.name}</div>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: scene.enabled ? 'var(--primary)' : 'var(--gray-400)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!scene.enabled}
                    onChange={() => handleToggleEnabled(scene)}
                    style={{ display: 'none' }}
                  />
                  <span
                    style={{
                      width: '36px',
                      height: '20px',
                      borderRadius: '10px',
                      background: scene.enabled ? 'var(--primary)' : 'var(--gray-300)',
                      position: 'relative',
                      transition: 'background 0.2s',
                      display: 'inline-block',
                    }}
                  >
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'var(--white)',
                        position: 'absolute',
                        top: '2px',
                        left: scene.enabled ? '18px' : '2px',
                        transition: 'left 0.2s',
                      }}
                    />
                  </span>
                  {scene.enabled ? '已启用' : '已禁用'}
                </label>
              </div>

              <div className="scene-description">{scene.description || '无描述'}</div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--gray-600)',
                  marginBottom: '8px',
                  padding: '8px 10px',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '16px' }}>{getTriggerIcon(scene.trigger_type)}</span>
                <span>{getTriggerDescription(scene)}</span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '12px' }}>
                包含 {Array.isArray(scene.actions) ? scene.actions.length : 0} 个动作
              </div>

              {log && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--gray-500)',
                    marginBottom: '12px',
                    padding: '6px 10px',
                    background: log.status === 'success' ? '#ecfdf5' : log.status === 'failed' ? '#fef2f2' : 'var(--gray-50)',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${log.status === 'success' ? 'var(--primary)' : log.status === 'failed' ? 'var(--danger)' : 'var(--gray-300)'}`,
                  }}
                >
                  上次执行：{log.status === 'success' ? '成功' : log.status === 'failed' ? '失败' : log.status || '未知'}
                  {log.executed_at && ` · ${new Date(log.executed_at).toLocaleString('zh-CN')}`}
                </div>
              )}

              <div className="scene-actions">
                <button className="btn btn-primary btn-sm" onClick={() => handleExecute(scene.id)}>
                  执行
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(scene)}>
                  编辑
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(scene.id)}>
                  删除
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      {successMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--primary)',
            color: 'var(--white)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: 'var(--shadow-md)',
            zIndex: 200,
          }}
        >
          {successMsg}
        </div>
      )}

      <div className="page-header">
        <h2 className="page-title">场景自动化</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          ➕ 创建场景
        </button>
      </div>

      {renderSceneCards()}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '560px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? '编辑场景' : '创建场景'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">场景名称</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={e => updateForm({ name: e.target.value })}
                    placeholder="例如：离家模式"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">描述</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.description}
                    onChange={e => updateForm({ description: e.target.value })}
                    placeholder="场景描述"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">触发方式</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {TRIGGER_TYPES.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => updateForm({ trigger_type: t.value })}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${form.trigger_type === t.value ? 'var(--primary)' : 'var(--gray-300)'}`,
                          background: form.trigger_type === t.value ? '#ecfdf5' : 'var(--white)',
                          color: form.trigger_type === t.value ? 'var(--primary)' : 'var(--gray-600)',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {renderTriggerConfig()}
                {renderActionBuilder()}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>取消</button>
                <button type="submit" className="btn btn-primary">{editingId ? '保存' : '创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
