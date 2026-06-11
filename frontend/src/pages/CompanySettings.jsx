import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Upload,
  Select,
  Spin,
  message,
  Tag,
  Progress,
  Descriptions,
  Timeline,
  Space,
  Divider,
} from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { company } from '../api';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

function CompanySettings() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  const [companyInfo, setCompanyInfo] = useState(null);
  const [creditData, setCreditData] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const industryOptions = [
    '互联网/信息技术',
    '金融/投资',
    '教育/培训',
    '医疗/健康',
    '制造业',
    '零售/消费',
    '房地产/建筑',
    '物流/运输',
    '能源/化工',
    '其他',
  ];

  const scaleOptions = [
    { value: '1-50人', label: '1-50人' },
    { value: '51-100人', label: '51-100人' },
    { value: '101-500人', label: '101-500人' },
    { value: '501-1000人', label: '501-1000人' },
    { value: '1000人以上', label: '1000人以上' },
  ];

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [infoRes, creditRes, verificationRes] = await Promise.all([
        company.getInfo(),
        company.getCredit(),
        company.getVerification(),
      ]);

      if (infoRes.code === 0) {
        const info = infoRes.data.info || infoRes.data;
        setCompanyInfo(info);
        form.setFieldsValue(info);
      }
      if (creditRes.code === 0) {
        setCreditData(creditRes.data.credit || creditRes.data);
      }
      if (verificationRes.code === 0) {
        setVerificationData(verificationRes.data.verification || verificationRes.data);
      }
    } catch (err) {
      message.error('加载企业信息失败');
      console.error('加载企业信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    form.setFieldsValue(companyInfo);
    setLogoFile(null);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const submitData = { ...values };
      if (logoFile) {
        submitData.logo = logoFile;
      }

      const res = await company.updateInfo(submitData);
      if (res.code === 0) {
        message.success('保存成功');
        setCompanyInfo(res.data.info || res.data);
        setEditing(false);
        setLogoFile(null);
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (err) {
      if (err.errorFields) {
        message.warning('请完善表单信息');
      } else {
        message.error('保存失败');
        console.error('保存企业信息失败:', err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await company.getVerification();
      if (res.code === 0) {
        message.success('核验已提交，请等待结果');
        setVerificationData(res.data.verification || res.data);
      } else {
        message.error(res.message || '核验失败');
      }
    } catch (err) {
      message.error('核验失败');
      console.error('企业核验失败:', err);
    } finally {
      setVerifying(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只支持上传图片文件');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB');
        return false;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoFile(e.target.result);
      };
      reader.readAsDataURL(file);
      return false;
    },
    fileList: logoFile
      ? [
          {
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: logoFile,
          },
        ]
      : [],
  };

  const getGaugeOption = (value, title, color) => ({
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: {
          color: color,
        },
        progress: {
          show: true,
          width: 20,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 20,
            color: [[1, '#f0f0f0']],
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        anchor: {
          show: false,
        },
        title: {
          show: true,
          offsetCenter: [0, '70%'],
          fontSize: 14,
          color: '#666',
        },
        detail: {
          valueAnimation: true,
          fontSize: 36,
          fontWeight: 'bold',
          offsetCenter: [0, '0%'],
          formatter: '{value}',
        },
        data: [
          {
            value: value || 0,
            name: title,
          },
        ],
      },
    ],
  });

  const getVerificationStatus = (status) => {
    const statusMap = {
      verified: { color: 'success', text: '已核验', icon: <CheckCircleOutlined /> },
      pending: { color: 'warning', text: '待核验', icon: <ClockCircleOutlined /> },
      failed: { color: 'error', text: '核验失败', icon: <CloseCircleOutlined /> },
    };
    return statusMap[status] || { color: 'default', text: status, icon: <InfoCircleOutlined /> };
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#faad14';
    if (score >= 60) return '#fa8c16';
    return '#f5222d';
  };

  const complianceMetrics = [
    { name: '劳动合同签订率', value: 98, key: 'contract_rate' },
    { name: '社保缴纳率', value: 95, key: 'social_insurance_rate' },
    { name: '薪资发放准时率', value: 100, key: 'salary_payment_rate' },
    { name: '员工离职率', value: 85, key: 'employee_turnover_rate' },
    { name: '劳动争议率', value: 92, key: 'labor_dispute_rate' },
  ];

  const complianceSuggestions = [
    {
      type: 'success',
      title: '用工规范',
      content: '劳动合同签订率达到 98%，符合劳动法要求。',
    },
    {
      type: 'warning',
      title: '优化建议',
      content: '建议完善员工离职面谈机制，降低核心员工流失率。',
    },
    {
      type: 'info',
      title: '风险提示',
      content: '定期开展劳动法律法规培训，增强员工法律意识。',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基本信息" key="basic">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={6}>
                <Card title="企业 Logo" style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        width: '120px',
                        height: '120px',
                        margin: '0 auto',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {(logoFile || companyInfo?.logo) ? (
                        <img
                          src={logoFile || companyInfo?.logo}
                          alt="Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>暂无Logo</span>
                      )}
                    </div>
                  </div>
                  {editing && (
                    <Upload {...uploadProps} maxCount={1}>
                      <Button icon={<UploadOutlined />}>上传 Logo</Button>
                    </Upload>
                  )}
                </Card>
              </Col>

              <Col xs={24} md={18}>
                <Card
                  title="企业基本信息"
                  extra={
                    editing ? (
                      <Space>
                        <Button onClick={handleCancel}>取消</Button>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={handleSave}
                          loading={saving}
                        >
                          保存
                        </Button>
                      </Space>
                    ) : (
                      <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                        编辑
                      </Button>
                    )
                  }
                >
                  <Form
                    form={form}
                    layout="vertical"
                    disabled={!editing}
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="name"
                          label="企业名称"
                          rules={[{ required: true, message: '请输入企业名称' }]}
                        >
                          <Input placeholder="请输入企业名称" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="credit_code"
                          label="统一社会信用代码"
                          rules={[{ required: true, message: '请输入统一社会信用代码' }]}
                        >
                          <Input placeholder="请输入统一社会信用代码" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="legal_representative"
                          label="法人代表"
                          rules={[{ required: true, message: '请输入法人代表' }]}
                        >
                          <Input placeholder="请输入法人代表" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="establish_date"
                          label="成立日期"
                          rules={[{ required: true, message: '请选择成立日期' }]}
                        >
                          <Input
                            placeholder="YYYY-MM-DD"
                            prefix={<InfoCircleOutlined />}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="registered_capital"
                          label="注册资本"
                          rules={[{ required: true, message: '请输入注册资本' }]}
                        >
                          <Input placeholder="请输入注册资本" suffix="万元" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="industry"
                          label="所属行业"
                          rules={[{ required: true, message: '请选择所属行业' }]}
                        >
                          <Select placeholder="请选择所属行业">
                            {industryOptions.map((opt) => (
                              <Option key={opt} value={opt}>
                                {opt}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="scale"
                          label="企业规模"
                          rules={[{ required: true, message: '请选择企业规模' }]}
                        >
                          <Select placeholder="请选择企业规模">
                            {scaleOptions.map((opt) => (
                              <Option key={opt.value} value={opt.value}>
                                {opt.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">联系信息</Divider>

                    <Row gutter={16}>
                      <Col xs={24}>
                        <Form.Item
                          name="address"
                          label="企业地址"
                          rules={[{ required: true, message: '请输入企业地址' }]}
                        >
                          <Input placeholder="请输入详细地址" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          name="phone"
                          label="联系电话"
                          rules={[{ required: true, message: '请输入联系电话' }]}
                        >
                          <Input placeholder="请输入联系电话" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          name="email"
                          label="企业邮箱"
                          rules={[
                            { required: true, message: '请输入企业邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' },
                          ]}
                        >
                          <Input placeholder="请输入企业邮箱" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          name="website"
                          label="官方网站"
                        >
                          <Input placeholder="https://" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="信用档案" key="credit">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card title="企业信用评分" style={{ textAlign: 'center' }}>
                  <ReactECharts
                    option={getGaugeOption(creditData?.credit_score || 85, '信用评分', '#52c41a')}
                    style={{ height: '200px' }}
                  />
                  <div style={{ marginTop: 16 }}>
                    <Tag color="success">信用等级: {creditData?.credit_level || 'A'}</Tag>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={16}>
                <Card
                  title="工商核验状态"
                  extra={
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleVerify}
                      loading={verifying}
                    >
                      重新核验
                    </Button>
                  }
                >
                  <div style={{ marginBottom: 16 }}>
                    <Space size="middle">
                      <span>核验状态:</span>
                      {(() => {
                        const status = getVerificationStatus(verificationData?.status || 'verified');
                        return (
                          <Tag color={status.color} icon={status.icon}>
                            {status.text}
                          </Tag>
                        );
                      })()}
                    </Space>
                  </div>

                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="注册状态">
                      {verificationData?.registration_status || '存续（在营、开业、在册）'}
                    </Descriptions.Item>
                    <Descriptions.Item label="成立日期">
                      {verificationData?.establish_date
                        ? dayjs(verificationData.establish_date).format('YYYY-MM-DD')
                        : companyInfo?.establish_date || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="营业期限">
                      {verificationData?.business_term || '长期'}
                    </Descriptions.Item>
                    <Descriptions.Item label="登记机关">
                      {verificationData?.registration_authority || '市场监督管理局'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Card title="核验历史记录" style={{ marginTop: 16 }}>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>核验通过</p>
                        <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                          {dayjs().subtract(30, 'day').format('YYYY-MM-DD HH:mm')}
                        </p>
                        <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>工商信息核验通过，信用评分更新为 85 分</p>
                      </div>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>初次核验</p>
                        <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                          {dayjs().subtract(180, 'day').format('YYYY-MM-DD HH:mm')}
                        </p>
                        <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>完成企业工商信息初次核验</p>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </TabPane>

          <TabPane tab="用工合规" key="compliance">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card title="用工合规评分" style={{ textAlign: 'center' }}>
                  <ReactECharts
                    option={getGaugeOption(
                      creditData?.compliance_score || 94,
                      '合规评分',
                      getComplianceColor(creditData?.compliance_score || 94)
                    )}
                    style={{ height: '200px' }}
                  />
                  <div style={{ marginTop: 16 }}>
                    <Tag color={creditData?.compliance_score >= 90 ? 'success' : 'warning'}>
                      {creditData?.compliance_score >= 90 ? '合规良好' : '需改进'}
                    </Tag>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={16}>
                <Card title="合规指标">
                  {complianceMetrics.map((metric, index) => {
                    const value = creditData?.[metric.key] || metric.value;
                    return (
                      <div key={metric.key} style={{ marginBottom: index === complianceMetrics.length - 1 ? 0 : 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>{metric.name}</span>
                          <span style={{ color: getComplianceColor(value), fontWeight: 500 }}>
                            {value}%
                          </span>
                        </div>
                        <Progress
                          percent={value}
                          showInfo={false}
                          strokeColor={getComplianceColor(value)}
                          size="small"
                        />
                      </div>
                    );
                  })}
                </Card>
              </Col>
            </Row>

            <Card title="合规建议" style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                {complianceSuggestions.map((suggestion, index) => (
                  <Col xs={24} md={8} key={index}>
                    <Card size="small" type="inner">
                      <Space align="start" style={{ width: '100%' }}>
                        <Tag color={suggestion.type} style={{ marginTop: 2 }}>
                          {suggestion.title}
                        </Tag>
                        <span style={{ flex: 1, color: '#666', fontSize: '13px' }}>
                          {suggestion.content}
                        </span>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default CompanySettings;
