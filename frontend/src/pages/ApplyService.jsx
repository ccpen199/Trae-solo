import React, { useState, useEffect } from 'react';
import { 
  Card, Steps, Form, Input, Button, message, Spin, Divider, 
  Radio, Select, Upload, Alert, List, Tag, Checkbox, Row, Col,
  Modal, Table, Space, Avatar
} from 'antd';
import { 
  useParams, useNavigate 
} from 'react-router-dom';
import {
  UserOutlined,
  TeamOutlined,
  IdcardOutlined,
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import { useUserStore } from '../store/user';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;

function ApplyService() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [service, setService] = useState(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userType, setUserType] = useState(user?.type === 'legal' ? 'legal' : 'personal');
  const [userCerts, setUserCerts] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [selectedAuthorizer, setSelectedAuthorizer] = useState(null);
  const [authorizationVisible, setAuthorizationVisible] = useState(false);
  const [form] = Form.useForm();
  const [certVerifyResult, setCertVerifyResult] = useState(null);

  const steps = [
    { title: '选择办理方式', description: '个人/法人' },
    { title: '证照调用', description: '电子证照核验' },
    { title: '材料上传', description: '材料清单确认' },
    { title: '填写信息', description: '表单填写' },
    { title: '提交成功', description: '申请完成' }
  ];

  const authorizers = [
    { id: 1, name: '张三', position: '法定代表人', phone: '138****0001' },
    { id: 2, name: '李四', position: '总经理', phone: '138****0002' },
    { id: 3, name: '王五', position: '财务总监', phone: '138****0003' }
  ];

  const requiredMaterials = [
    { id: 1, name: '居民身份证', required: true, type: 'cert', certType: '身份证' },
    { id: 2, name: '户口簿', required: true, type: 'upload' },
    { id: 3, name: '申请表', required: true, type: 'form' },
    { id: 4, name: '相关证明材料', required: false, type: 'upload' }
  ];

  useEffect(() => {
    loadService();
    loadUserCerts();
  }, [id]);

  const loadService = async () => {
    try {
      const data = await api.get(`/services/items/${id}`);
      setService(data);
    } catch (err) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUserCerts = async () => {
    try {
      const data = await api.get('/certificates');
      setUserCerts(data.filter(c => c.status === 'active'));
    } catch (err) {
      console.log('未登录或无证照');
    }
  };

  const handleCertVerify = async (cert) => {
    try {
      await api.post('/certificates/verify', {
        verifyCode: cert.verify_code,
        certNumber: cert.cert_number
      });
      setCertVerifyResult({ certName: cert.cert_name, valid: true });
      message.success(`${cert.cert_name} 核验通过`);
      if (!selectedCerts.includes(cert.id)) {
        setSelectedCerts([...selectedCerts, cert.id]);
      }
    } catch (err) {
      setCertVerifyResult({ certName: cert.cert_name, valid: false });
      message.error(`${cert.cert_name} 核验失败`);
    }
  };

  const canProceed = () => {
    switch (current) {
      case 0:
        if (userType === 'legal' && !selectedAuthorizer) return false;
        return true;
      case 1:
        return selectedCerts.length > 0;
      case 2:
        return true;
      case 3:
        return form.getFieldsError().every(e => e.errors.length === 0);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (current === 3) {
      try {
        await form.validateFields();
        setSubmitting(true);
        
        const values = await form.getFieldsValue();
        await api.post('/applications', {
          serviceId: id,
          formData: values,
          materials: selectedCerts,
          userType,
          authorizerId: selectedAuthorizer
        });
        
        setCurrent(4);
        message.success('申请提交成功');
        setTimeout(() => navigate('/applications'), 2000);
      } catch (err) {
        if (err.errorFields) {
          message.warning('请完善表单信息');
        } else {
          message.error('提交失败');
        }
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrent(current + 1);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
    }
  };

  if (loading) {
    return <Spin />;
  }

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
            />
            <span>办理：{service?.name || ''}</span>
            <Tag color="blue">{service?.department}</Tag>
          </div>
        }
      >
        <Steps current={current} style={{ marginBottom: 32 }}>
          {steps.map((step, idx) => (
            <Step 
              key={idx}
              title={step.title}
              description={step.description}
              status={current === idx ? 'process' : current > idx ? 'finish' : 'wait'}
            />
          ))}
        </Steps>

        {current === 0 && (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h3 style={{ marginBottom: 24, textAlign: 'center' }}>请选择办理方式</h3>
            
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card
                  hoverable
                  bordered={userType === 'personal'}
                  style={{ 
                    borderColor: userType === 'personal' ? '#1890ff' : undefined,
                    borderWidth: userType === 'personal' ? 2 : 1
                  }}
                  onClick={() => setUserType('personal')}
                >
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <UserOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    <h3 style={{ marginTop: 16 }}>个人办理</h3>
                    <p style={{ color: '#666' }}>以个人身份办理业务</p>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card
                  hoverable
                  bordered={userType === 'legal'}
                  style={{ 
                    borderColor: userType === 'legal' ? '#1890ff' : undefined,
                    borderWidth: userType === 'legal' ? 2 : 1
                  }}
                  onClick={() => setUserType('legal')}
                >
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <TeamOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                    <h3 style={{ marginTop: 16 }}>法人办理</h3>
                    <p style={{ color: '#666' }}>以企业/机构身份办理业务</p>
                  </div>
                </Card>
              </Col>
            </Row>

            {userType === 'legal' && (
              <div style={{ marginTop: 24 }}>
                <Alert
                  message="法人授权链"
                  description="请选择授权经办人，系统将验证授权关系"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Card size="small" title="选择授权人">
                  <Radio.Group
                    value={selectedAuthorizer}
                    onChange={(e) => setSelectedAuthorizer(e.target.value)}
                  >
                    <Space direction="vertical">
                      {authorizers.map(auth => (
                        <Radio key={auth.id} value={auth.id}>
                          <Space>
                            <Avatar icon={<UserOutlined />} />
                            <span>{auth.name}</span>
                            <Tag color="blue">{auth.position}</Tag>
                            <span style={{ color: '#999' }}>{auth.phone}</span>
                          </Space>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                  <div style={{ marginTop: 16 }}>
                    <Button 
                      type="link" 
                      onClick={() => setAuthorizationVisible(true)}
                    >
                      查看完整授权链
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {current === 1 && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Alert
              message={`电子证照调用（已选用 ${selectedCerts.length} 个）`}
              description={selectedCerts.length > 0 ? "已选择的证照将自动用于材料核验，提交后系统将记录核验留痕" : "请至少选择并核验1个电子证照"}
              type={selectedCerts.length > 0 ? 'success' : 'info'}
              showIcon
              style={{ marginBottom: 24 }}
            />

            <h4 style={{ marginBottom: 16 }}>
              <IdcardOutlined style={{ marginRight: 8 }} />
              我的电子证照（共 {userCerts.length} 张）
            </h4>
            
            {userCerts.length > 0 ? (
              <List
                bordered
                dataSource={userCerts}
                renderItem={(cert) => (
                  <List.Item
                    actions={[
                      selectedCerts.includes(cert.id) ? (
                        <Tag color="success">已选用</Tag>
                      ) : (
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={() => handleCertVerify(cert)}
                          icon={<SafetyOutlined />}
                        >
                          核验并选用
                        </Button>
                      )
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Checkbox 
                          checked={selectedCerts.includes(cert.id)}
                          disabled={!selectedCerts.includes(cert.id)}
                        />
                      }
                      title={
                        <Space>
                          <IdcardOutlined style={{ color: '#1890ff' }} />
                          {cert.cert_name}
                          <Tag color="success">有效</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <span>证照编号：{cert.cert_number}</span>
                          <span style={{ marginLeft: 16 }}>签发机关：{cert.issuer}</span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: 8 }}>
                <IdcardOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <p style={{ marginTop: 16, color: '#999' }}>暂无可用电子证照</p>
                <Space>
                  <Button type="primary" onClick={() => {
                    Modal.info({
                      title: '快速申领证照',
                      content: '系统正在为您申领电子证照...',
                      onOk: async () => {
                        try {
                          await api.post('/certificates/apply', {
                            certType: '身份证',
                            certName: '居民身份证',
                            issuer: '公安局'
                          });
                          message.success('证照申领成功');
                          loadUserCerts();
                        } catch (e) { message.error('申领失败'); }
                      }
                    });
                  }}>一键申领</Button>
                  <Button onClick={() => navigate('/certificates')}>前往证照中心</Button>
                </Space>
              </div>
            )}

            {certVerifyResult && (
              <Alert
                style={{ marginTop: 16 }}
                message={certVerifyResult.valid ? '证照核验通过' : '证照核验失败'}
                description={`${certVerifyResult.certName} ${certVerifyResult.valid ? '已通过国家电子证照库核验' : '核验失败，请检查证照状态'}`}
                type={certVerifyResult.valid ? 'success' : 'error'}
                showIcon
              />
            )}

            <div style={{ marginTop: 16, color: '#666' }}>
              已选用证照：{selectedCerts.length} 个
            </div>
          </div>
        )}

        {current === 2 && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Alert
              message="材料清单确认"
              description="请确认所需材料是否齐全，带*为必填项。系统将自动复用您的电子证照。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <List
              header={<div style={{ fontWeight: 'bold' }}>所需材料清单</div>}
              bordered
              dataSource={requiredMaterials}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    item.type === 'cert' ? (
                      selectedCerts.length > 0 ? (
                        <Tag color="success">已通过证照复用</Tag>
                      ) : (
                        <Tag color="warning">需提供</Tag>
                      )
                    ) : item.type === 'upload' ? (
                      <Upload
                        fileList={[]}
                        maxCount={1}
                        beforeUpload={() => false}
                      >
                        <Button icon={<UploadOutlined />} size="small">上传</Button>
                      </Upload>
                    ) : (
                      <Tag color="success">自动生成</Tag>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      item.required ? 
                        <ExclamationCircleOutlined style={{ color: '#faad14' }} /> : 
                        <FileTextOutlined />
                    }
                    title={
                      <span>
                        {item.name}
                        {item.required && <span style={{ color: '#f5222d', marginLeft: 4 }}>*</span>}
                      </span>
                    }
                    description={
                      <div>
                        <Tag color={
                          item.type === 'cert' ? 'blue' : 
                          item.type === 'upload' ? 'orange' : 'green'
                        }>
                          {item.type === 'cert' ? '电子证照' : 
                           item.type === 'upload' ? '需上传' : '系统生成'}
                        </Tag>
                        {item.type === 'cert' && (
                          <span style={{ marginLeft: 8 }}>
                            需要{item.certType}
                          </span>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            <div style={{ marginTop: 24, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <span style={{ color: '#52c41a' }}>
                材料预检完成，共 {requiredMaterials.filter(m => m.required).length} 项必填材料，已满足 {Math.min(selectedCerts.length, requiredMaterials.filter(m => m.required).length)} 项
              </span>
            </div>
          </div>
        )}

        {current === 3 && (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <Alert
              message="请如实填写申请信息"
              description="所填信息将用于业务办理，请确保真实有效"
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                userType
              }}
            >
              <Divider>
                <Space>
                  {userType === 'personal' ? <UserOutlined /> : <TeamOutlined />}
                  {userType === 'personal' ? '申请人信息' : '企业信息'}
                </Space>
              </Divider>

              {userType === 'personal' ? (
                <>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="name"
                        label="申请人姓名"
                        rules={[{ required: true, message: '请输入姓名' }]}
                      >
                        <Input placeholder="请输入姓名" prefix={<UserOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="idCard"
                        label="身份证号"
                        rules={[
                          { required: true, message: '请输入身份证号' },
                          { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确' }
                        ]}
                      >
                        <Input placeholder="请输入身份证号" prefix={<IdcardOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ) : (
                <>
                  <Form.Item
                    name="companyName"
                    label="企业名称"
                    rules={[{ required: true, message: '请输入企业名称' }]}
                  >
                    <Input placeholder="请输入企业全称" />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="creditCode"
                        label="统一社会信用代码"
                        rules={[{ required: true, message: '请输入统一社会信用代码' }]}
                      >
                        <Input placeholder="91开头的18位代码" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="legalPerson"
                        label="法定代表人"
                        rules={[{ required: true, message: '请输入法定代表人' }]}
                      >
                        <Input placeholder="请输入法定代表人姓名" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name="contactPerson"
                    label="经办人"
                    rules={[{ required: true, message: '请输入经办人' }]}
                  >
                    <Input placeholder="请输入经办人姓名" />
                  </Form.Item>
                </>
              )}

              <Divider>联系方式</Divider>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="联系电话"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                    ]}
                  >
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="电子邮箱"
                    rules={[
                      { type: 'email', message: '邮箱格式不正确' }
                    ]}
                  >
                    <Input placeholder="请输入邮箱（选填）" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="address"
                label="联系地址"
                rules={[{ required: true, message: '请输入联系地址' }]}
              >
                <Input placeholder="请输入详细联系地址" />
              </Form.Item>

              <Divider>申请说明</Divider>

              <Form.Item
                name="description"
                label="申请事由"
              >
                <TextArea 
                  rows={4} 
                  placeholder="请简要描述申请事由（选填）" 
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                  { validator: (_, value) => 
                    value ? Promise.resolve() : Promise.reject(new Error('请阅读并同意'))
                  }
                ]}
              >
                <Checkbox>
                  我已阅读并同意《政务服务办理协议》和《个人信息保护声明》
                </Checkbox>
              </Form.Item>
            </Form>
          </div>
        )}

        {current === 4 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ 
              fontSize: 64, 
              color: '#52c41a', 
              marginBottom: 16 
            }}>
              <CheckCircleOutlined />
            </div>
            <h2>申请提交成功！</h2>
            <p style={{ color: '#666', marginTop: 16 }}>
              您的{service?.name}申请已提交，工作人员将尽快审核
            </p>
            <p style={{ color: '#999', marginBottom: 24 }}>
              正在跳转至我的办件...
            </p>
            <Space>
              <Button type="primary" onClick={() => navigate('/applications')}>
                查看办件进度
              </Button>
              <Button onClick={() => navigate('/')}>
                返回首页
              </Button>
            </Space>
          </div>
        )}

        {current < 4 && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Space>
              {current > 0 && (
                <Button onClick={handlePrev}>
                  上一步
                </Button>
              )}
              <Button 
                type="primary" 
                onClick={handleNext}
                loading={submitting}
                disabled={!canProceed()}
              >
                {current === 3 ? '提交申请' : '下一步'}
              </Button>
            </Space>
          </div>
        )}
      </Card>

      <Modal
        title="法人授权链"
        open={authorizationVisible}
        onCancel={() => setAuthorizationVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAuthorizationVisible(false)}>关闭</Button>
        ]}
        width={600}
      >
        <Steps direction="vertical" current={1}>
          <Step 
            title="法定代表人授权" 
            description="张三（法定代表人）→ 李四（总经理），授权范围：全部业务" 
            status="finish"
          />
          <Step 
            title="转授权" 
            description="李四（总经理）→ 王五（部门经理），授权范围：社保业务" 
            status="process"
          />
          <Step 
            title="经办人" 
            description="王五（部门经理）→ 当前操作人" 
            status="wait"
          />
        </Steps>
        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <p style={{ margin: 0 }}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            授权链验证通过，该授权有效期至 2024-12-31
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default ApplyService;
