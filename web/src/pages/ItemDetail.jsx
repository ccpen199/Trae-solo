import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Steps,
  Table,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Spin,
  message,
  Tag,
  Divider,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/auth';
import { items as itemsApi, departments as deptApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const statusMap = {
  active: { text: '已发布', color: 'green' },
  inactive: { text: '已停用', color: 'red' },
  draft: { text: '草稿', color: 'default' },
};

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreate = location.pathname === '/items/create';
  const [loading, setLoading] = useState(!isCreate);
  const [item, setItem] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [form] = Form.useForm();
  const [materials, setMaterials] = useState([]);
  const [steps, setSteps] = useState([
    { name: '受理', description: '受理申请材料' },
    { name: '审核', description: '审核申请内容' },
    { name: '审批', description: '审批决定' },
    { name: '办结', description: '办结归档' },
  ]);
  const [saving, setSaving] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchDepartments();
    if (!isCreate && id) {
      fetchItem();
    }
  }, [id, isCreate]);

  const fetchDepartments = async () => {
    try {
      const res = await deptApi.getDepartments();
      const d = res.data?.data || res.data || [];
      setDepartments(Array.isArray(d) ? d : []);
    } catch {}
  };

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await itemsApi.getItem(id);
      const d = res.data?.data || res.data || {};
      setItem(d);
      setMaterials(d.required_materials || d.materials || []);
      if (d.process_steps) setSteps(d.process_steps);
      form.setFieldsValue(d);
    } catch {
      message.error('获取事项详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = { ...values, required_materials: materials, process_steps: steps };
      if (isCreate) {
        await itemsApi.createItem(payload);
        message.success('创建成功');
      } else {
        await itemsApi.updateItem(id, payload);
        message.success('更新成功');
      }
      navigate('/items');
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || '操作失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const addMaterial = () => {
    setMaterials([...materials, { name: '', category: '', is_required: true }]);
  };

  const removeMaterial = (index) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index, field, value) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const addStep = () => {
    setSteps([...steps, { name: '', description: '' }]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isCreate) {
    return (
      <div>
        <Card title="新增服务事项">
          <Form form={form} layout="vertical" style={{ maxWidth: 900 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="name" label="事项名称" rules={[{ required: true, message: '请输入事项名称' }]}>
                  <Input placeholder="请输入事项名称" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="code" label="事项编码" rules={[{ required: true, message: '请输入事项编码' }]}>
                  <Input placeholder="请输入事项编码" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="department_id" label="所属部门" rules={[{ required: true, message: '请选择所属部门' }]}>
                  <Select placeholder="请选择所属部门">
                    {departments.map((d) => (
                      <Option key={d.id} value={d.id}>{d.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="category" label="事项类别" rules={[{ required: true, message: '请选择事项类别' }]}>
                  <Select placeholder="请选择事项类别">
                    <Option value="administrative">行政许可</Option>
                    <Option value="public_service">公共服务</Option>
                    <Option value="administrative_confirmation">行政确认</Option>
                    <Option value="administrative_penalty">行政处罚</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="item_type" label="事项类型">
                  <Select placeholder="请选择事项类型">
                    <Option value="promise">承诺件</Option>
                    <Option value="immediate">即办件</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="time_limit" label="法定时限（工作日）">
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入法定时限" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="事项描述">
              <TextArea rows={3} placeholder="请输入事项描述" />
            </Form.Item>
            <Form.Item name="legal_basis" label="法律依据">
              <TextArea rows={2} placeholder="请输入法律依据" />
            </Form.Item>
            <Form.Item name="conditions" label="申请条件">
              <TextArea rows={2} placeholder="请输入申请条件" />
            </Form.Item>
            <Form.Item name="charge_standard" label="收费标准">
              <Input placeholder="请输入收费标准" />
            </Form.Item>

            <Divider orientation="left">所需材料</Divider>
            {materials.map((mat, index) => (
              <Row gutter={16} key={index} style={{ marginBottom: 12 }}>
                <Col xs={24} md={8}>
                  <Input
                    placeholder="材料名称"
                    value={mat.name}
                    onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                  />
                </Col>
                <Col xs={24} md={6}>
                  <Select
                    placeholder="材料类别"
                    value={mat.category || undefined}
                    onChange={(v) => updateMaterial(index, 'category', v)}
                    style={{ width: '100%' }}
                  >
                    <Option value="form">表格</Option>
                    <Option value="certificate">证照</Option>
                    <Option value="report">报告</Option>
                    <Option value="other">其他</Option>
                  </Select>
                </Col>
                <Col xs={24} md={4}>
                  <Select
                    value={mat.is_required ? 'required' : 'optional'}
                    onChange={(v) => updateMaterial(index, 'is_required', v === 'required')}
                    style={{ width: '100%' }}
                  >
                    <Option value="required">必须</Option>
                    <Option value="optional">可选</Option>
                  </Select>
                </Col>
                <Col xs={24} md={2}>
                  <Button danger icon={<DeleteOutlined />} onClick={() => removeMaterial(index)} />
                </Col>
              </Row>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={addMaterial} style={{ width: '100%', marginBottom: 24 }}>
              添加材料
            </Button>

            <Divider orientation="left">办理流程</Divider>
            {steps.map((step, index) => (
              <Row gutter={16} key={index} style={{ marginBottom: 12 }}>
                <Col xs={24} md={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                  步骤{index + 1}
                </Col>
                <Col xs={24} md={8}>
                  <Input
                    placeholder="步骤名称"
                    value={step.name}
                    onChange={(e) => updateStep(index, 'name', e.target.value)}
                  />
                </Col>
                <Col xs={24} md={10}>
                  <Input
                    placeholder="步骤描述"
                    value={step.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                  />
                </Col>
                <Col xs={24} md={2}>
                  <Button danger icon={<DeleteOutlined />} onClick={() => removeStep(index)} />
                </Col>
              </Row>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={addStep} style={{ width: '100%', marginBottom: 24 }}>
              添加步骤
            </Button>

            <Form.Item>
              <Space>
                <Button type="primary" onClick={handleSave} loading={saving}>
                  提交
                </Button>
                <Button onClick={() => navigate('/items')}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ textAlign: 'center', padding: 100, color: '#999' }}>
        未找到该事项
      </div>
    );
  }

  const currentStep = item.process_steps
    ? item.process_steps.findIndex((s) => s.status === 'current')
    : -1;

  const materialColumns = [
    { title: '材料名称', dataIndex: 'name', key: 'name' },
    {
      title: '材料类别',
      dataIndex: 'category',
      key: 'category',
      render: (v) => {
        const map = { form: '表格', certificate: '证照', report: '报告', other: '其他' };
        return map[v] || v || '-';
      },
    },
    {
      title: '是否必须',
      dataIndex: 'is_required',
      key: 'is_required',
      render: (v) => (v ? <Tag color="red">必须</Tag> : <Tag>可选</Tag>),
    },
  ];

  return (
    <div>
      <Card
        title="事项详情"
        extra={
          <Space>
            {isAdmin && (
              <Button type="primary" onClick={() => navigate(`/items/${id}`)}>
                编辑
              </Button>
            )}
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/items')}>
              返回
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="事项编码">{item.code}</Descriptions.Item>
          <Descriptions.Item label="事项名称">{item.name}</Descriptions.Item>
          <Descriptions.Item label="所属部门">{item.department_name}</Descriptions.Item>
          <Descriptions.Item label="事项类别">{item.category}</Descriptions.Item>
          <Descriptions.Item label="事项类型">{item.item_type}</Descriptions.Item>
          <Descriptions.Item label="法定时限">{item.time_limit ? `${item.time_limit}个工作日` : '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={(statusMap[item.status] || {}).color || 'default'}>
              {(statusMap[item.status] || {}).text || item.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="收费标准">{item.charge_standard || '-'}</Descriptions.Item>
          <Descriptions.Item label="关联办件数">{item.case_count ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="事项描述" span={3}>{item.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="法律依据" span={3}>{item.legal_basis || '-'}</Descriptions.Item>
          <Descriptions.Item label="申请条件" span={3}>{item.conditions || '-'}</Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">办理流程</Divider>
        <Steps
          current={currentStep >= 0 ? currentStep : 0}
          items={(item.process_steps || steps).map((s) => ({
            title: s.name,
            description: s.description,
          }))}
          style={{ marginBottom: 24 }}
        />

        <Divider orientation="left">所需材料</Divider>
        <Table
          columns={materialColumns}
          dataSource={item.required_materials || item.materials || []}
          rowKey={(r, i) => i}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
