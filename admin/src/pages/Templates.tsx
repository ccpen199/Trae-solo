import React, { useState } from 'react';
import { Card, Select, Form, Input, Button, Space, Divider, Table, Tag, message, Switch, Modal, List, Drawer, InputNumber, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, SettingFilled, AppstoreOutlined } from '@ant-design/icons';
import type { FormField, ItemTemplate } from './Items';

const FIELD_TYPES: { value: FormField['type']; label: string; color: string }[] = [
  { value: 'input', label: '单行文本', color: 'blue' },
  { value: 'textarea', label: '多行文本', color: 'cyan' },
  { value: 'number', label: '数字', color: 'purple' },
  { value: 'select', label: '下拉选择', color: 'green' },
  { value: 'radio', label: '单选', color: 'magenta' },
  { value: 'checkbox', label: '多选', color: 'orange' },
  { value: 'license', label: '电子证照调用', color: 'geekblue' },
  { value: 'upload', label: '附件上传', color: 'volcano' },
];

const ROLES = ['受理员', '初审员', '复审员', '现场核查员', '核准员', '发证员', '公示系统', '登记员'];

interface Props {}

const TemplatesPage: React.FC<Props> = () => {
  const items: ItemTemplate[] = JSON.parse(localStorage.getItem('admin_items_cache') || 'null') || [
    { id: 'RI001', code: 'DJ-IND-001', name: '个体工商户设立登记', category: '市场主体登记', description: '', estimatedDays: 3, requiredMaterials: ['身份证', '经营场所证明', '经营范围确认书'], approvalProcess: [{ name: '材料受理', role: '受理员', level: 1 }, { name: '初审', role: '初审员', level: 2 }, { name: '复审', role: '复审员', level: 3 }, { name: '核准', role: '核准员', level: 4 }, { name: '证照发放', role: '发证员', level: 5 }], formFields: [{ key: 'name', label: '字号名称', type: 'input', required: true }, { key: 'businessType', label: '经营类型', type: 'select', required: true, options: [{ label: '批发零售', value: 'retail' }, { label: '餐饮服务', value: 'catering' }, { label: '居民服务', value: 'service' }] }, { key: 'address', label: '经营地址', type: 'input', required: true }, { key: 'businessScope', label: '经营范围', type: 'textarea', required: true, description: '请按《国民经济行业分类》标准填写' }], isHot: true },
  ];

  const [itemId, setItemId] = useState(items[0]?.id || '');
  const current = items.find(i => i.id === itemId) || items[0];
  const [fields, setFields] = useState<FormField[]>(current?.formFields || []);
  const [materials, setMaterials] = useState<string[]>(current?.requiredMaterials || []);
  const [matInput, setMatInput] = useState('');
  const [process, setProcess] = useState<any[]>(current?.approvalProcess || []);
  const [fieldModal, setFieldModal] = useState(false);
  const [fieldForm] = Form.useForm();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [procModal, setProcModal] = useState(false);
  const [procForm] = Form.useForm();
  const [editingProcIdx, setEditingProcIdx] = useState<number | null>(null);

  React.useEffect(() => {
    const it = items.find(i => i.id === itemId) || items[0];
    setFields(it.formFields || []);
    setMaterials(it.requiredMaterials || []);
    setProcess(it.approvalProcess || []);
  }, [itemId]);

  const openNewField = () => {
    fieldForm.resetFields();
    setEditingIdx(null);
    setFieldModal(true);
  };
  const openEditField = (i: number) => {
    const f = fields[i];
    fieldForm.setFieldsValue({ ...f, options: (f.options || []).map(o => `${o.label}|${o.value}`).join('\n') });
    setEditingIdx(i);
    setFieldModal(true);
  };
  const saveField = () => {
    const vals = fieldForm.getFieldsValue();
    let options: FormField['options'] = undefined;
    if (vals.options) {
      options = String(vals.options).split('\n').map(l => {
        const parts = l.trim().split('|');
        return { label: parts[0], value: parts[1] || parts[0] };
      }).filter(o => o.label);
    }
    const newField: FormField = { key: vals.key, label: vals.label, type: vals.type, required: vals.required, placeholder: vals.placeholder, description: vals.description, options };
    if (editingIdx === null) setFields(p => [...p, newField]);
    else setFields(p => p.map((x, i) => i === editingIdx ? newField : x));
    setFieldModal(false);
  };

  const openNewProc = () => { procForm.resetFields(); setEditingProcIdx(null); setProcModal(true); };
  const openEditProc = (i: number) => { const p = process[i]; procForm.setFieldsValue(p); setEditingProcIdx(i); setProcModal(true); };
  const saveProc = () => {
    const vals = procForm.getFieldsValue();
    if (editingProcIdx === null) setProcess(p => [...p, { ...vals, level: p.length + 1 }]);
    else setProcess(p => p.map((x, i) => i === editingProcIdx ? vals : x));
    setProcModal(false);
  };

  const saveAll = () => {
    message.success(`✅ ${current.name} 动态配置已保存：${fields.length} 字段 / ${materials.length} 材料 / ${process.length} 环节`);
  };

  return (
    <div>
      <Card title={<span><AppstoreOutlined /> 表单动态配置</span>} bordered={false} style={{ borderRadius: 10, marginBottom: 16 }}
        extra={<Space><Select style={{ width: 280 }} value={itemId} onChange={setItemId}
          options={items.map(i => ({ label: `${i.code} · ${i.name}`, value: i.id }))} />
        <Button type="primary" icon={<SaveOutlined />} onClick={saveAll}>保存全部配置</Button></Space>}>

        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="📋 表单字段配置"
              extra={<Button size="small" icon={<PlusOutlined />} type="primary" onClick={openNewField}>新增字段</Button>}
              style={{ height: '100%' }}>
              <Table
                size="small" rowKey="key" dataSource={fields} pagination={false}
                columns={[
                  { title: '标签', dataIndex: 'label', width: 120 },
                  { title: 'key', dataIndex: 'key', width: 120 },
                  { title: '类型', dataIndex: 'type', width: 100, render: v => {
                    const f = FIELD_TYPES.find(t => t.value === v);
                    return <Tag color={f?.color}>{f?.label || v}</Tag>;
                  }},
                  { title: '必填', dataIndex: 'required', width: 60, render: v => v ? <Tag color="red">是</Tag> : '否' },
                  { title: '操作', width: 120, render: (_, r, i) => (
                    <Space size={4}>
                      <Button size="small" onClick={() => openEditField(i)}>编辑</Button>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setFields(p => p.filter((_, idx) => idx !== i))} />
                    </Space>
                  )}
                ]}
                locale={{ emptyText: '暂无字段，请点击「新增字段」' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="📎 所需材料清单" style={{ marginBottom: 16 }}>
              <Space.Compact style={{ width: '100%', marginBottom: 10 }}>
                <Input placeholder="输入材料名称后回车" value={matInput}
                  onChange={e => setMatInput(e.target.value)}
                  onPressEnter={() => {
                    if (matInput.trim() && !materials.includes(matInput.trim())) {
                      setMaterials(p => [...p, matInput.trim()]);
                      setMatInput('');
                    }
                  }} />
                <Button icon={<PlusOutlined />} type="primary" onClick={() => {
                  if (matInput.trim() && !materials.includes(matInput.trim())) {
                    setMaterials(p => [...p, matInput.trim()]); setMatInput('');
                  }
                }}>添加</Button>
              </Space.Compact>
              <List size="small" bordered dataSource={materials}
                renderItem={(m, i) => (
                  <List.Item extra={<Button type="text" size="small" danger icon={<DeleteOutlined />}
                    onClick={() => setMaterials(p => p.filter((_, idx) => idx !== i))} />}>
                    {i + 1}. {m}
                  </List.Item>
                )}
              />
            </Card>
            <Card size="small" title="🔀 审批环节分级指派"
              extra={<Button size="small" icon={<PlusOutlined />} type="primary" onClick={openNewProc}>新增环节</Button>}>
              <div style={{ minHeight: 180 }}>
                {process.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: ['#52c41a', '#1890ff', '#faad14', '#722ed1', '#13c2c2', '#eb2f96', '#51258f'][i % 7],
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                    }}>L{i + 1}</div>
                    <div style={{ marginLeft: 12, flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{p.role}</div>
                    </div>
                    <Space>
                      <Button size="small" onClick={() => openEditProc(i)}>编辑</Button>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setProcess(p2 => p2.filter((_, idx) => idx !== i))} />
                    </Space>
                  </div>
                ))}
                {process.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>暂无审批环节</div>}
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title={<span>👁️ 实时表单预览（{current?.name}）</span>} bordered={false} style={{ borderRadius: 10 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <h2 style={{ margin: '0 0 20px', textAlign: 'center', color: '#0f172a' }}>{current?.name} - 申请表</h2>
          <Form layout="vertical">
            {fields.map(f => (
              <Form.Item key={f.key} label={<Space>{f.required && <span style={{ color: '#ef4444' }}>*</span>}{f.label}</Space>}
                help={f.description}>
                {f.type === 'input' && <Input placeholder={f.placeholder || `请输入${f.label}`} disabled />}
                {f.type === 'textarea' && <Input.TextArea rows={3} placeholder={f.placeholder || `请输入${f.label}`} disabled />}
                {f.type === 'number' && <InputNumber style={{ width: '100%' }} placeholder={f.placeholder} disabled />}
                {f.type === 'select' && <Select placeholder={`请选择${f.label}`} disabled options={f.options} />}
                {f.type === 'radio' && <Space>{f.options?.map(o => <Tag key={o.value} color="blue">{o.label}</Tag>)}</Space>}
                {f.type === 'checkbox' && <Space>{f.options?.map(o => <Tag key={o.value} color="geekblue">{o.label}</Tag>)}</Space>}
                {f.type === 'license' && <Tag color="purple" icon={<SettingFilled />}>从电子证照库自动获取</Tag>}
                {f.type === 'upload' && <Button disabled icon={<AppstoreOutlined />}>点击上传附件</Button>}
              </Form.Item>
            ))}
          </Form>
        </div>
      </Card>

      <Modal title={editingIdx === null ? '新增字段' : '编辑字段'} open={fieldModal}
        onCancel={() => setFieldModal(false)} onOk={saveField} width={600} destroyOnClose>
        <Form form={fieldForm} layout="vertical">
          <Row gutter={14}>
            <Col span={12}>
              <Form.Item label="字段标识key" name="key" rules={[{ required: true }]}><Input placeholder="英文字母_下划线，如 businessScope" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="显示标签" name="label" rules={[{ required: true }]}><Input placeholder="如 经营范围" /></Form.Item>
            </Col>
          </Row>
          <Row gutter={14}>
            <Col span={14}>
              <Form.Item label="字段类型" name="type" rules={[{ required: true }]}>
                <Select options={FIELD_TYPES.map(f => ({ value: f.value, label: f.label }))} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="必填" name="required" valuePropName="checked" initialValue={true}><Switch /></Form.Item>
            </Col>
          </Row>
          <Form.Item label="提示 placeholder" name="placeholder"><Input /></Form.Item>
          <Form.Item label="帮助说明" name="description"><Input /></Form.Item>
          <Form.Item label="选项（每行一个，格式：标签|值，如 餐饮服务|catering）" name="options">
            <Input.TextArea rows={4} placeholder="仅 select/radio/checkbox 需要" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={editingProcIdx === null ? '新增审批环节' : '编辑审批环节'} open={procModal}
        onCancel={() => setProcModal(false)} onOk={saveProc} width={520} destroyOnClose>
        <Form form={procForm} layout="vertical">
          <Form.Item label="环节名称" name="name" rules={[{ required: true }]}><Input placeholder="如 材料受理 / 初审" /></Form.Item>
          <Form.Item label="办理角色" name="role" rules={[{ required: true }]}>
            <Select options={ROLES.map(r => ({ label: r, value: r }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplatesPage;
