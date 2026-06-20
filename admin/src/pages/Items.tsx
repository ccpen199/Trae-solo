import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Switch, Space, Card, Drawer, List, message, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, SettingOutlined, EyeOutlined } from '@ant-design/icons';
import { http } from '../utils/request';

export interface FormField {
  key: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'license' | 'upload' | 'number';
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  description?: string;
}

export interface ItemTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  estimatedDays: number;
  requiredMaterials: string[];
  formFields: FormField[];
  approvalProcess: { name: string; role: string; level: number }[];
  isHot: boolean;
  icon?: string;
}

const CATEGORIES = ['市场主体登记', '行政许可', '变更登记', '注销登记', '年度报告', '其他服务'];

const ItemsPage: React.FC = () => {
  const [list, setList] = useState<ItemTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [current, setCurrent] = useState<ItemTemplate | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      try {
        const d = await http.get<any[]>('/apply/items');
        if (d.length) { setList(d); return; }
      } catch {}
      setList([
        { id: 'RI001', code: 'DJ-IND-001', name: '个体工商户设立登记', category: '市场主体登记', description: '个体工商户设立注册登记', estimatedDays: 3, isHot: true, requiredMaterials: ['身份证', '经营场所证明', '经营范围确认书'], formFields: [{ key: 'name', label: '字号名称', type: 'input', required: true }], approvalProcess: [{ name: '受理', role: '受理员', level: 1 }, { name: '初审', role: '初审员', level: 2 }, { name: '复审', role: '复审员', level: 3 }, { name: '核准', role: '核准员', level: 4 }, { name: '发证', role: '发证员', level: 5 }] },
        { id: 'RI002', code: 'DJ-ENT-001', name: '有限责任公司设立登记', category: '市场主体登记', description: '有限公司设立注册', estimatedDays: 5, isHot: true, requiredMaterials: ['公司章程', '股东身份证明', '住所证明'], formFields: [{ key: 'companyName', label: '公司名称', type: 'input', required: true }], approvalProcess: [{ name: '名称核准', role: '核准员', level: 1 }, { name: '受理', role: '受理员', level: 2 }, { name: '初审', role: '初审员', level: 3 }, { name: '复审', role: '复审员', level: 4 }] },
        { id: 'RI003', code: 'XK-FOOD-001', name: '食品经营许可证核发', category: '行政许可', description: '食品销售餐饮许可', estimatedDays: 10, isHot: false, requiredMaterials: ['营业执照', '场所布局图', '安全管理制度'], formFields: [], approvalProcess: [{ name: '受理', role: '受理员', level: 1 }, { name: '现场核查', role: '核查员', level: 2 }] },
        { id: 'RI004', code: 'BG-IND-001', name: '个体工商户变更登记', category: '变更登记', description: '名称/地址/经营范围变更', estimatedDays: 3, isHot: false, requiredMaterials: ['变更申请书', '营业执照'], formFields: [], approvalProcess: [{ name: '受理', role: '受理员', level: 1 }, { name: '审核', role: '审核员', level: 2 }] },
        { id: 'RI005', code: 'NJ-001', name: '企业年度报告公示', category: '年度报告', description: '年报填报公示', estimatedDays: 1, isHot: false, requiredMaterials: ['基本信息', '经营数据'], formFields: [], approvalProcess: [{ name: '公示', role: '公示系统', level: 1 }] }
      ]);
    })();
  }, []);

  const submit = async () => {
    const vals = await form.validateFields();
    const item: ItemTemplate = {
      id: current?.id || 'RI' + Date.now(),
      code: vals.code, name: vals.name, category: vals.category,
      description: vals.description, estimatedDays: vals.estimatedDays,
      isHot: !!vals.isHot,
      requiredMaterials: current?.requiredMaterials || [],
      formFields: current?.formFields || [],
      approvalProcess: current?.approvalProcess || []
    };
    if (current) setList(prev => prev.map(x => x.id === current.id ? item : x));
    else setList(prev => [item, ...prev]);
    message.success(current ? '修改成功' : '新增成功');
    setOpen(false); setCurrent(null);
  };

  return (
    <div>
      <Card
        title={<span><SettingOutlined /> 登记事项配置（共 {list.length} 项）</span>}
        bordered={false} style={{ borderRadius: 10 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setCurrent(null); setOpen(true); }}>新增登记事项</Button>}
      >
        <Table
          rowKey="id" dataSource={list} pagination={{ pageSize: 10 }}
          columns={[
            { title: '事项编码', dataIndex: 'code', width: 130 },
            { title: '事项名称', dataIndex: 'name', ellipsis: true },
            { title: '分类', dataIndex: 'category', width: 120, render: v => <Tag color="blue">{v}</Tag> },
            { title: '承诺时限', dataIndex: 'estimatedDays', width: 100, render: v => `${v} 个工作日` },
            { title: '环节数', width: 90, render: (_, r) => r.approvalProcess.length },
            { title: '热门', width: 70, dataIndex: 'isHot', render: v => v ? <Tag color="red">🔥</Tag> : <Tag>否</Tag> },
            {
              title: '操作', width: 220, fixed: 'right' as const,
              render: (_, r) => (
                <Space size={4}>
                  <Button size="small" icon={<EyeOutlined />} onClick={() => { setCurrent(r); setViewOpen(true); }}>预览</Button>
                  <Button size="small" icon={<EditOutlined />} onClick={() => { setCurrent(r); form.setFieldsValue(r); setOpen(true); }}>配置</Button>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal title={current ? `修改登记事项：${current.code}` : '新增登记事项'}
        open={open} onCancel={() => setOpen(false)} onOk={submit} width={680} okText="保存"
        destroyOnClose>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="事项编码" name="code" rules={[{ required: true }]}><Input placeholder="DJ-XXX-001" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="事项名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="分类" name="category" rules={[{ required: true }]}>
                <Select options={CATEGORIES.map(c => ({ value: c, label: c }))} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="承诺时限（天）" name="estimatedDays" initialValue={3} rules={[{ required: true }]}>
                <InputNumber min={1} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="热门标识" name="isHot" valuePropName="checked"><Switch /></Form.Item>
            </Col>
          </Row>
          <Form.Item label="事项描述" name="description"><Input.TextArea rows={3} /></Form.Item>
          <div style={{ fontSize: 12, color: '#64748b', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
            ℹ️ 请在「表单动态配置」页中编辑具体字段、材料清单和审批流程。
          </div>
        </Form>
      </Modal>

      <Drawer title={`事项详情预览：${current?.name}`} open={viewOpen} onClose={() => setViewOpen(false)} width={640}>
        {current && (
          <div>
            <Card size="small" style={{ marginBottom: 12 }} title="📝 所需材料">
              <List dataSource={current.requiredMaterials} renderItem={(m, i) => <List.Item>{i + 1}. {m}</List.Item>} size="small" />
            </Card>
            <Card size="small" style={{ marginBottom: 12 }} title="🔀 审批流程分级">
              <Steps process={current.approvalProcess} />
            </Card>
            <Card size="small" title="📋 表单字段（{current.formFields.length} 项）">
              <List dataSource={current.formFields}
                renderItem={(f: FormField) => (
                  <List.Item>
                    <Space>
                      <Tag>{f.type}</Tag>
                      <b>{f.label}</b>（{f.key}）
                      {f.required && <Tag color="red">必填</Tag>}
                    </Space>
                  </List.Item>
                )}
                locale={{ emptyText: '暂未配置字段，请到表单动态配置页配置' }}
                size="small"
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

const Steps: React.FC<{ process: any[] }> = ({ process }) => (
  <div style={{ padding: '12px 0' }}>
    {process.map((p, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: ['#52c41a', '#1890ff', '#faad14', '#722ed1', '#13c2c2'][i % 5],
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 600, flexShrink: 0
        }}>L{p.level}</div>
        <div style={{ marginLeft: 12, flex: 1 }}>
          <div style={{ fontWeight: 500 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.role}</div>
        </div>
      </div>
    ))}
  </div>
);

export default ItemsPage;
