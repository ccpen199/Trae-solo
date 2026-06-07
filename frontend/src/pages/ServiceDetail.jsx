import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Tag, Spin, message, Tabs, List, Checkbox, Row, Col, Statistic, Modal, Steps, Alert, Timeline } from 'antd';
import { 
  useParams, useNavigate 
} from 'react-router-dom';
import {
  IdcardOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import { useUserStore } from '../store/user';

const { Step } = Steps;
const { TabPane } = Tabs;

function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCerts, setUserCerts] = useState([]);
  const [materialCheckResult, setMaterialCheckResult] = useState(null);
  const [certVerifyVisible, setCertVerifyVisible] = useState(false);
  const [policyCalcVisible, setPolicyCalcVisible] = useState(false);
  const [calcResult, setCalcResult] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);

  const requiredMaterials = [
    { id: 1, name: '居民身份证', required: true, hasCert: false },
    { id: 2, name: '户口簿', required: true, hasCert: false },
    { id: 3, name: '申请表', required: true, hasCert: false },
    { id: 4, name: '相关证明材料', required: false, hasCert: false }
  ];

  useEffect(() => {
    loadService();
    loadUserCerts();
    loadRecentApplications();
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
      setUserCerts(data);
    } catch (err) {
      console.log('未登录或无证照');
    }
  };

  const loadRecentApplications = async () => {
    try {
      const data = await api.get('/applications');
      setRecentApplications(data.slice(0, 3));
    } catch (err) {
      console.log('无办件记录');
    }
  };

  const handleMaterialCheck = () => {
    const requiredCount = requiredMaterials.filter(m => m.required).length;
    const hasCertCount = requiredMaterials.filter(m => m.required && m.hasCert).length;
    
    setMaterialCheckResult({
      status: hasCertCount >= requiredCount ? 'pass' : 'warning',
      message: hasCertCount >= requiredCount 
        ? '材料预检通过，可以开始办理'
        : `缺少 ${requiredCount - hasCertCount} 项必备材料，请先补充`,
      readyCount: hasCertCount,
      totalCount: requiredCount
    });
  };

  const handleCertVerify = async (values) => {
    try {
      await api.post('/certificates/verify', values);
      message.success('证照核验通过');
      setCertVerifyVisible(false);
    } catch (err) {
      message.error('证照核验失败');
    }
  };

  const handlePolicyCalc = async (values) => {
    try {
      const result = await api.post('/policy/calculator/social-subsidy', values);
      setCalcResult(result);
    } catch (err) {
      message.error('计算失败');
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
            <span>{service?.name}</span>
            {service?.is_hot ? <Tag color="red">热门</Tag> : null}
          </div>
        }
        extra={
          <div style={{ display: 'flex', gap: 12 }}>
            <Button onClick={() => navigate('/certificates')} icon={<IdcardOutlined />}>
              我的证照
            </Button>
            <Button type="primary" onClick={() => navigate(`/apply/${id}`)}>
              立即办理
            </Button>
          </div>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="服务编码">{service?.code}</Descriptions.Item>
          <Descriptions.Item label="所属部门">{service?.department}</Descriptions.Item>
          <Descriptions.Item label="服务分类">{service?.category_name}</Descriptions.Item>
          <Descriptions.Item label="办理时限">
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {service?.handling_time}
          </Descriptions.Item>
          <Descriptions.Item label="服务说明" span={2}>
            {service?.description || `本服务由${service?.department}提供，用于办理${service?.name}相关业务。办理过程中需要提供相关证明材料，请确保材料真实有效。`}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="已有证照"
                  value={userCerts.length}
                  prefix={<IdcardOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="我的办件"
                  value={recentApplications.length}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="办理环节"
                  value={4}
                  prefix={<Steps />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="满意度"
                  value={4.8}
                  suffix="/ 5.0"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="process">
          <TabPane tab="办理流程" key="process">
            <Steps current={-1} style={{ marginTop: 24 }}>
              <Step 
                title="在线提交申请" 
                description="填写基本信息，上传所需材料" 
                icon={<FileTextOutlined />}
                status="process"
              />
              <Step 
                title="电子证照核验" 
                description="系统自动核验电子证照有效性" 
                icon={<SafetyCertificateOutlined />}
              />
              <Step 
                title="材料智能预检" 
                description="AI检查材料完整性和规范性" 
                icon={<CheckCircleOutlined />}
              />
              <Step 
                title="部门审核办理" 
                description="工作人员审核并办理业务" 
                icon={<ClockCircleOutlined />}
              />
              <Step 
                title="结果反馈送达" 
                description="在线查看结果，电子证照自动入库" 
                icon={<CheckCircleOutlined />}
              />
            </Steps>

            <Timeline style={{ marginTop: 40 }}>
              <Timeline.Item color="blue">
                <p><strong>提交申请</strong></p>
                <p style={{ color: '#666' }}>在线填写申请表格，上传相关材料扫描件</p>
              </Timeline.Item>
              <Timeline.Item color="green">
                <p><strong>证照核验</strong></p>
                <p style={{ color: '#666' }}>系统自动调用电子证照库进行真实性核验</p>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <p><strong>材料预检</strong></p>
                <p style={{ color: '#666' }}>智能检查材料是否齐全、格式是否正确</p>
              </Timeline.Item>
              <Timeline.Item>
                <p><strong>部门办理</strong></p>
                <p style={{ color: '#666' }}>工作人员进行实质性审核和业务办理</p>
              </Timeline.Item>
              <Timeline.Item color="gray">
                <p><strong>结果反馈</strong></p>
                <p style={{ color: '#666' }}>通过短信、APP推送办理结果，电子证照自动生成</p>
              </Timeline.Item>
            </Timeline>
          </TabPane>

          <TabPane tab="材料清单" key="materials">
            <Alert
              message="材料预检提示"
              description="请确保您已准备好以下材料，带*为必填项。系统将自动核验您的电子证照。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <List
              header={<div style={{ fontWeight: 'bold' }}>所需材料清单</div>}
              bordered
              dataSource={requiredMaterials}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    userCerts.some(c => c.cert_name.includes(item.name) || c.cert_type.includes(item.name))
                      ? <Tag color="success">已有证照</Tag>
                      : <Tag color="warning">需准备</Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={item.required ? <ExclamationCircleOutlined style={{ color: '#faad14' }} /> : <FileTextOutlined />}
                    title={
                      <span>
                        {item.name}
                        {item.required && <span style={{ color: '#f5222d', marginLeft: 4 }}>*</span>}
                      </span>
                    }
                    description={item.required ? '必备材料，必须提供' : '可选材料，根据情况提供'}
                  />
                </List.Item>
              )}
            />

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleMaterialCheck}>
                一键材料预检
              </Button>
            </div>

            {materialCheckResult && (
              <Alert
                style={{ marginTop: 16 }}
                message={materialCheckResult.status === 'pass' ? '材料预检通过' : '材料预检提醒'}
                description={
                  <div>
                    <p>{materialCheckResult.message}</p>
                    <p>必备材料完成度：{materialCheckResult.readyCount}/{materialCheckResult.totalCount}</p>
                    {materialCheckResult.status === 'pass' && (
                      <Button type="primary" size="small" onClick={() => navigate(`/apply/${id}`)}>
                        开始办理
                      </Button>
                    )}
                  </div>
                }
                type={materialCheckResult.status === 'pass' ? 'success' : 'warning'}
                showIcon
              />
            )}
          </TabPane>

          <TabPane tab="证照核验" key="certVerify">
            <div style={{ marginBottom: 16 }}>
              <Alert
                message="电子证照核验服务"
                description="本服务支持调用国家电子证照库进行在线核验，确保证照真实有效。核验结果具有法律效力。"
                type="info"
                showIcon
              />
            </div>

            <List
              header={<div style={{ fontWeight: 'bold' }}>我的电子证照</div>}
              bordered
              dataSource={userCerts}
              locale={{ emptyText: '暂无电子证照，可前往证照中心申领' }}
              renderItem={(cert) => (
                <List.Item
                  actions={[
                    <Button 
                      size="small" 
                      type={cert.status === 'active' ? 'primary' : 'default'}
                      disabled={cert.status !== 'active'}
                      onClick={() => {
                        message.success(`${cert.cert_name}核验通过，证照有效`);
                      }}
                    >
                      {cert.status === 'active' ? '核验' : '已失效'}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<IdcardOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={cert.cert_name}
                    description={
                      <div>
                        <Tag color={cert.status === 'active' ? 'success' : 'default'}>
                          {cert.status === 'active' ? '有效' : '已失效'}
                        </Tag>
                        <span style={{ marginLeft: 8 }}>签发机关：{cert.issuer}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button onClick={() => navigate('/certificates')} icon={<IdcardOutlined />}>
                前往证照中心
              </Button>
            </div>
          </TabPane>

          <TabPane tab="政策补贴试算" key="policy">
            <Alert
              message="政策计算器说明"
              description="本计算器仅供参考，实际补贴金额以相关部门最终审核结果为准。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="社保补贴试算" size="small">
                  <p style={{ color: '#666', marginBottom: 16 }}>
                    根据您的收入、家庭情况等条件，估算可享受的社保补贴金额。
                  </p>
                  <Button 
                    type="primary" 
                    block 
                    icon={<CalculatorOutlined />}
                    onClick={() => navigate('/policy')}
                  >
                    前往试算
                  </Button>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="个税计算器" size="small">
                  <p style={{ color: '#666', marginBottom: 16 }}>
                    根据您的收入情况，计算个人所得税应纳税额。
                  </p>
                  <Button 
                    type="primary" 
                    block 
                    icon={<CalculatorOutlined />}
                    onClick={() => navigate('/policy')}
                  >
                    前往计算
                  </Button>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 16 }}>
              <h4>相关政策</h4>
              <List
                size="small"
                dataSource={[
                  { title: '关于进一步做好稳就业保就业工作的通知', date: '2024-01-15' },
                  { title: '社会保险补贴政策实施细则', date: '2024-01-10' },
                  { title: '个人所得税专项附加扣除政策解读', date: '2024-01-05' }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<a style={{ cursor: 'pointer' }} onClick={() => navigate('/policy')}>{item.title}</a>}
                      description={item.date}
                    />
                  </List.Item>
                )}
              />
            </div>
          </TabPane>

          <TabPane tab="进度追踪" key="progress">
            {recentApplications.length > 0 ? (
              <List
                dataSource={recentApplications}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="link" onClick={() => navigate(`/applications/${item.id}`)}>
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.service_name}
                          <Tag color={
                            item.status === 'completed' ? 'success' :
                            item.status === 'rejected' ? 'error' : 'processing'
                          }>
                            {item.status === 'submitted' ? '审核中' : 
                             item.status === 'processing' ? '办理中' :
                             item.status === 'completed' ? '已完成' :
                             item.status === 'rejected' ? '已驳回' : item.status}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div>申请编号：{item.application_no}</div>
                          <div>提交时间：{item.created_at}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>暂无办件记录</p>
              </div>
            )}

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button onClick={() => navigate('/applications')} icon={<SearchOutlined />}>
                查看全部办件
              </Button>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <div style={{ position: 'fixed', right: 24, bottom: 40, zIndex: 1000 }}>
        <Button 
          type="primary" 
          size="large"
          onClick={() => navigate(`/apply/${id}`)}
          style={{ 
            height: 56, 
            paddingLeft: 32, 
            paddingRight: 32,
            fontSize: 16,
            borderRadius: 28,
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)'
          }}
        >
          立即办理
        </Button>
      </div>
    </div>
  );
}

export default ServiceDetail;
