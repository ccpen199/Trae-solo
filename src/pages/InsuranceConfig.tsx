import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Tabs,
  Table,
  Space,
  Modal,
  message,
  InputNumber,
  Tag,
  Divider,
  Alert,
} from 'antd';
import {
  Shield,
  Key,
  Link2,
  Plus,
  Trash2,
  Edit3,
  Save,
  Zap,
  FileCheck,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { PATIENT_TYPE_OPTIONS } from '@/utils/constants';
import type { PatientType } from '@/types';

const { TabPane } = Tabs;
const { Option } = Select;

interface InsurerConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  status: 'active' | 'inactive' | 'testing';
}

interface InsuranceRule {
  id: string;
  patientType: PatientType | 'all';
  serviceItems: string[];
  productName: string;
  insurerId: string;
  triggerCondition: 'order_created' | 'risk_assessed' | 'nurse_accepted';
  minRiskLevel: 'low' | 'medium' | 'high' | 'critical' | 'none';
  enabled: boolean;
}

interface ClaimConfig {
  notifyUrl: string;
  autoProcess: boolean;
  autoProcessThreshold: number;
  requireEvidence: boolean;
  reviewWorkflow: boolean;
  notifyEmails: string[];
}

const serviceItemOptions = [
  { code: 'SV001', name: '基础生命体征监测' },
  { code: 'SV002', name: '伤口换药护理' },
  { code: 'SV003', name: '压疮护理' },
  { code: 'SV004', name: '鼻饲管护理' },
  { code: 'SV005', name: '导尿管护理' },
  { code: 'SV006', name: '产后康复护理' },
  { code: 'SV007', name: '新生儿护理指导' },
  { code: 'SV008', name: '术后康复训练' },
  { code: 'SV009', name: '临终关怀护理' },
  { code: 'SV010', name: '血糖监测与指导' },
  { code: 'SV011', name: '用药指导与管理' },
  { code: 'SV012', name: '康复理疗' },
];

const triggerConditionOptions = [
  { value: 'order_created', label: '订单创建时' },
  { value: 'risk_assessed', label: '风险评估完成后' },
  { value: 'nurse_accepted', label: '护士接单后' },
];

const riskLevelOptions = [
  { value: 'none', label: '无限制' },
  { value: 'low', label: '低风险及以上' },
  { value: 'medium', label: '中风险及以上' },
  { value: 'high', label: '高风险及以上' },
  { value: 'critical', label: '仅极高风险' },
];

export default function InsuranceConfig() {
  const [insurerForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [claimForm] = Form.useForm<ClaimConfig>();

  const [insurers, setInsurers] = useState<InsurerConfig[]>([
    {
      id: 'ins001',
      name: '中国平安保险',
      apiUrl: 'https://api.pingan.com/insurance/v1',
      apiKey: 'PAK-2024-001234',
      apiSecret: '••••••••••••••••',
      status: 'active',
    },
    {
      id: 'ins002',
      name: '中国人寿保险',
      apiUrl: 'https://api.chinalife.com.cn/api/v2',
      apiKey: 'CLI-2024-005678',
      apiSecret: '••••••••••••••••',
      status: 'testing',
    },
  ]);

  const [rules, setRules] = useState<InsuranceRule[]>([
    {
      id: 'rule001',
      patientType: 'elderly',
      serviceItems: ['SV001', 'SV002', 'SV003'],
      productName: '老年护理意外险A款',
      insurerId: 'ins001',
      triggerCondition: 'order_created',
      minRiskLevel: 'medium',
      enabled: true,
    },
    {
      id: 'rule002',
      patientType: 'post-hospital',
      serviceItems: ['SV008', 'SV004'],
      productName: '术后康复责任险B款',
      insurerId: 'ins001',
      triggerCondition: 'risk_assessed',
      minRiskLevel: 'none',
      enabled: true,
    },
    {
      id: 'rule003',
      patientType: 'maternal',
      serviceItems: ['SV006', 'SV007'],
      productName: '母婴护理综合保障',
      insurerId: 'ins002',
      triggerCondition: 'nurse_accepted',
      minRiskLevel: 'low',
      enabled: false,
    },
  ]);

  const [editingInsurer, setEditingInsurer] = useState<InsurerConfig | null>(null);
  const [editingRule, setEditingRule] = useState<InsuranceRule | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [claimConfig, setClaimConfig] = useState<ClaimConfig>({
    notifyUrl: 'https://api.yourdomain.com/webhooks/claims',
    autoProcess: true,
    autoProcessThreshold: 5000,
    requireEvidence: true,
    reviewWorkflow: true,
    notifyEmails: ['claims@nursing-center.com', 'finance@nursing-center.com'],
  });

  const handleTestConnection = async (insurerId: string) => {
    setTestingConnection(insurerId);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTestingConnection(null);
    message.success('连接测试成功！API接口响应正常。');
  };

  const handleSaveInsurer = () => {
    insurerForm.validateFields().then((values) => {
      if (editingInsurer) {
        setInsurers((prev) =>
          prev.map((i) =>
            i.id === editingInsurer.id ? { ...i, ...values } : i
          )
        );
        message.success('保险公司配置已更新');
      } else {
        const newInsurer: InsurerConfig = {
          ...values,
          id: `ins${Date.now().toString().slice(-6)}`,
          status: 'testing',
        };
        setInsurers((prev) => [...prev, newInsurer]);
        message.success('保险公司配置已添加');
      }
      setEditingInsurer(null);
      insurerForm.resetFields();
    });
  };

  const handleDeleteInsurer = (id: string) => {
    Modal.confirm({
      title: '删除确认',
      content: '确定要删除该保险公司配置吗？删除后相关的投保规则也会受影响。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setInsurers((prev) => prev.filter((i) => i.id !== id));
        message.success('配置已删除');
      },
    });
  };

  const handleSaveRule = () => {
    ruleForm.validateFields().then((values) => {
      if (editingRule) {
        setRules((prev) =>
          prev.map((r) =>
            r.id === editingRule.id ? { ...r, ...values } : r
          )
        );
        message.success('投保规则已更新');
      } else {
        const newRule: InsuranceRule = {
          ...values,
          id: `rule${Date.now().toString().slice(-6)}`,
          enabled: true,
        };
        setRules((prev) => [...prev, newRule]);
        message.success('投保规则已添加');
      }
      setEditingRule(null);
      ruleForm.resetFields();
    });
  };

  const handleDeleteRule = (id: string) => {
    Modal.confirm({
      title: '删除确认',
      content: '确定要删除该投保规则吗？',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setRules((prev) => prev.filter((r) => r.id !== id));
        message.success('规则已删除');
      },
    });
  };

  const handleToggleRule = (id: string, enabled: boolean) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled } : r))
    );
    message.success(enabled ? '规则已启用' : '规则已禁用');
  };

  const handleSaveClaimConfig = () => {
    claimForm.validateFields().then((values) => {
      setClaimConfig(values);
      message.success('理赔对接设置已保存');
    });
  };

  const insurerColumns = [
    {
      title: '保险公司',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: 'API地址',
      dataIndex: 'apiUrl',
      key: 'apiUrl',
      width: 260,
      render: (text: string) => (
        <span className="font-mono text-xs text-slate-600">{text}</span>
      ),
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      width: 180,
      render: (text: string) => (
        <span className="font-mono text-xs text-slate-600">{text}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'success', text: '已启用' },
          inactive: { color: 'default', text: '已禁用' },
          testing: { color: 'processing', text: '测试中' },
        };
        return <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record: InsurerConfig) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<TestTube className="h-3.5 w-3.5" />}
            loading={testingConnection === record.id}
            onClick={() => handleTestConnection(record.id)}
          >
            测试连接
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Edit3 className="h-3.5 w-3.5" />}
            onClick={() => {
              setEditingInsurer(record);
              insurerForm.setFieldsValue(record);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => handleDeleteInsurer(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const ruleColumns = [
    {
      title: '适用患者类型',
      dataIndex: 'patientType',
      key: 'patientType',
      width: 120,
      render: (type: string) => {
        const map: Record<string, string> = {
          all: '全部类型',
          elderly: '老年护理',
          maternal: '母婴护理',
          'post-hospital': '术后康复',
          hospice: '安宁疗护',
        };
        return <Tag color="blue">{map[type] || type}</Tag>;
      },
    },
    {
      title: '服务项目',
      dataIndex: 'serviceItems',
      key: 'serviceItems',
      width: 240,
      render: (items: string[]) => (
        <div className="flex flex-wrap gap-1">
          {items.slice(0, 3).map((code) => {
            const item = serviceItemOptions.find((s) => s.code === code);
            return (
              <Tag key={code} color="geekblue" className="mb-0">
                {item?.name || code}
              </Tag>
            );
          })}
          {items.length > 3 && (
            <Tag color="default">+{items.length - 3}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '险种名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
    },
    {
      title: '触发条件',
      dataIndex: 'triggerCondition',
      key: 'triggerCondition',
      width: 140,
      render: (cond: string) => {
        const map: Record<string, string> = {
          order_created: '订单创建时',
          risk_assessed: '风险评估后',
          nurse_accepted: '护士接单后',
        };
        return map[cond] || cond;
      },
    },
    {
      title: '最低风险等级',
      dataIndex: 'minRiskLevel',
      key: 'minRiskLevel',
      width: 120,
      render: (level: string) => {
        const map: Record<string, string> = {
          none: '无限制',
          low: '低风险+',
          medium: '中风险+',
          high: '高风险+',
          critical: '仅极高',
        };
        return map[level] || level;
      },
    },
    {
      title: '状态',
      key: 'enabled',
      width: 80,
      render: (_: unknown, record: InsuranceRule) => (
        <Switch
          checked={record.enabled}
          onChange={(checked) => handleToggleRule(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record: InsuranceRule) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Edit3 className="h-3.5 w-3.5" />}
            onClick={() => {
              setEditingRule(record);
              ruleForm.setFieldsValue(record);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => handleDeleteRule(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="保险配置中心"
        description="配置保险公司API接口、自动投保规则及理赔对接设置"
        icon={<Settings className="h-6 w-6" />}
      />

      <Tabs defaultActiveKey="api" type="card" className="mt-4">
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              保险公司API配置
            </span>
          }
          key="api"
        >
          <Card className="mb-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                已配置的保险公司
              </h3>
              <Button
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setEditingInsurer(null);
                  insurerForm.resetFields();
                }}
              >
                添加保险公司
              </Button>
            </div>

            <Table
              columns={insurerColumns}
              dataSource={insurers}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                {editingInsurer ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingInsurer ? '编辑保险公司' : '添加保险公司'}
              </div>
            }
            className="border-dashed"
          >
            <Form
              form={insurerForm}
              layout="vertical"
              onFinish={handleSaveInsurer}
              initialValues={editingInsurer || { status: 'testing' }}
            >
              <div className="grid grid-cols-2 gap-6">
                <Form.Item
                  name="name"
                  label="保险公司名称"
                  rules={[{ required: true, message: '请输入保险公司名称' }]}
                >
                  <Input placeholder="如：中国平安保险" />
                </Form.Item>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="active">已启用</Option>
                    <Option value="inactive">已禁用</Option>
                    <Option value="testing">测试中</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="apiUrl"
                  label="API接口地址"
                  rules={[
                    { required: true, message: '请输入API接口地址' },
                    { type: 'url', message: '请输入有效的URL地址' },
                  ]}
                  className="col-span-2"
                >
                  <Input
                    placeholder="https://api.xxx.com/insurance/v1"
                    prefix={<Link2 className="h-4 w-4 text-slate-400" />}
                  />
                </Form.Item>
                <Form.Item
                  name="apiKey"
                  label="API Key"
                  rules={[{ required: true, message: '请输入API Key' }]}
                >
                  <Input placeholder="请输入API Key" />
                </Form.Item>
                <Form.Item
                  name="apiSecret"
                  label="API Secret"
                  rules={[{ required: true, message: '请输入API Secret' }]}
                >
                  <Input.Password placeholder="请输入API Secret" />
                </Form.Item>
              </div>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<Save className="h-4 w-4" />}>
                    保存配置
                  </Button>
                  {editingInsurer && (
                    <Button
                      onClick={() => handleTestConnection(editingInsurer.id)}
                      icon={<Zap className="h-4 w-4" />}
                      loading={testingConnection === editingInsurer.id}
                    >
                      测试连接
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setEditingInsurer(null);
                      insurerForm.resetFields();
                    }}
                  >
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              投保规则配置
            </span>
          }
          key="rules"
        >
          <Alert
            message="自动投保规则说明"
            description="系统将根据以下规则自动匹配险种并为符合条件的订单投保。规则按优先级执行，启用状态的规则才会生效。"
            type="info"
            showIcon
            className="mb-4"
          />

          <Card className="mb-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                投保规则列表
              </h3>
              <Button
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setEditingRule(null);
                  ruleForm.resetFields();
                }}
              >
                添加规则
              </Button>
            </div>

            <Table
              columns={ruleColumns}
              dataSource={rules}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                {editingRule ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingRule ? '编辑投保规则' : '添加投保规则'}
              </div>
            }
            className="border-dashed"
          >
            <Form
              form={ruleForm}
              layout="vertical"
              onFinish={handleSaveRule}
              initialValues={editingRule || { minRiskLevel: 'none', triggerCondition: 'order_created' }}
            >
              <div className="grid grid-cols-2 gap-6">
                <Form.Item
                  name="patientType"
                  label="适用患者类型"
                  rules={[{ required: true, message: '请选择患者类型' }]}
                >
                  <Select>
                    <Option value="all">全部类型</Option>
                    {PATIENT_TYPE_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="insurerId"
                  label="承保公司"
                  rules={[{ required: true, message: '请选择承保公司' }]}
                >
                  <Select>
                    {insurers.map((ins) => (
                      <Option key={ins.id} value={ins.id}>
                        {ins.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="productName"
                  label="险种名称"
                  rules={[{ required: true, message: '请输入险种名称' }]}
                  className="col-span-2"
                >
                  <Input placeholder="如：老年护理意外险A款" />
                </Form.Item>
                <Form.Item
                  name="serviceItems"
                  label="适用服务项目"
                  rules={[{ required: true, message: '请选择服务项目' }]}
                  className="col-span-2"
                >
                  <Select
                    mode="multiple"
                    placeholder="选择适用的服务项目"
                    optionFilterProp="label"
                    options={serviceItemOptions.map((item) => ({
                      value: item.code,
                      label: `${item.code} - ${item.name}`,
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  name="triggerCondition"
                  label="自动投保触发时机"
                  rules={[{ required: true }]}
                >
                  <Select options={triggerConditionOptions} />
                </Form.Item>
                <Form.Item
                  name="minRiskLevel"
                  label="最低风险等级"
                  rules={[{ required: true }]}
                  extra="仅为达到该风险等级的订单投保"
                >
                  <Select options={riskLevelOptions} />
                </Form.Item>
              </div>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<Save className="h-4 w-4" />}>
                    保存规则
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingRule(null);
                      ruleForm.resetFields();
                    }}
                  >
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              理赔对接设置
            </span>
          }
          key="claims"
        >
          <Card>
            <Form
              form={claimForm}
              layout="vertical"
              initialValues={claimConfig}
              onFinish={handleSaveClaimConfig}
            >
              <div className="space-y-6">
                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                    <Link2 className="h-4 w-4" />
                    接口对接
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <Form.Item
                      name="notifyUrl"
                      label="理赔状态回调地址"
                      rules={[
                        { required: true, message: '请输入回调地址' },
                        { type: 'url', message: '请输入有效的URL地址' },
                      ]}
                      className="col-span-2"
                    >
                      <Input
                        placeholder="https://yourdomain.com/webhooks/claims"
                        prefix={<Link2 className="h-4 w-4 text-slate-400" />}
                      />
                    </Form.Item>
                  </div>
                </div>

                <Divider />

                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                    <Zap className="h-4 w-4" />
                    自动处理设置
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <Form.Item
                      name="autoProcess"
                      label="启用自动理赔"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    <Form.Item
                      name="autoProcessThreshold"
                      label="自动处理金额阈值（元）"
                      extra="低于此金额的理赔申请将自动处理"
                      rules={[{ required: true, message: '请输入金额阈值' }]}
                    >
                      <InputNumber
                        min={0}
                        step={1000}
                        style={{ width: '100%' }}
                        prefix="¥"
                      />
                    </Form.Item>
                    <Form.Item
                      name="requireEvidence"
                      label="理赔必须上传证据材料"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    <Form.Item
                      name="reviewWorkflow"
                      label="启用人工复核流程"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </div>
                </div>

                <Divider />

                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                    <XCircle className="h-4 w-4" />
                    通知设置
                  </h4>
                  <Form.Item
                    name="notifyEmails"
                    label="理赔通知邮箱"
                    extra="重要理赔事件将发送通知到以下邮箱，多个邮箱用逗号分隔"
                    rules={[{ required: true, message: '请输入通知邮箱' }]}
                  >
                    <Select
                      mode="tags"
                      placeholder="输入邮箱地址后按回车"
                      tokenSeparators={[',', ';']}
                      options={[
                        { value: 'claims@nursing-center.com', label: 'claims@nursing-center.com' },
                        { value: 'finance@nursing-center.com', label: 'finance@nursing-center.com' },
                        { value: 'admin@nursing-center.com', label: 'admin@nursing-center.com' },
                      ]}
                    />
                  </Form.Item>
                </div>

                <Divider />

                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                    <FileCheck className="h-4 w-4" />
                    理赔材料要求
                  </h4>
                  <Form.Item
                    name="claimRequirements"
                    label="必备理赔材料"
                    initialValue={[
                      '服务记录证明',
                      '费用发票',
                      '身份验证材料',
                    ]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="选择必备的理赔材料"
                      options={[
                        { value: '服务记录证明', label: '服务记录证明' },
                        { value: '费用发票', label: '费用发票' },
                        { value: '身份验证材料', label: '身份验证材料' },
                        { value: '诊断证明', label: '诊断证明' },
                        { value: '护理记录', label: '护理记录' },
                        { value: '事故报告', label: '事故报告' },
                      ]}
                    />
                  </Form.Item>
                </div>
              </div>

              <Divider />

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<Save className="h-4 w-4" />}>
                    保存设置
                  </Button>
                  <Button
                    onClick={() => {
                      claimForm.resetFields();
                      claimForm.setFieldsValue(claimConfig);
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}
