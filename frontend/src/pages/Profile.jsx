import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, message, Tabs, Tag, Avatar, Upload, Row, Col, Descriptions, List, Progress, Divider, Alert, Table, Space, Typography, Modal } from 'antd';
import { UserOutlined, SaveOutlined, UploadOutlined, CameraOutlined, SafetyCertificateOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { profileAPI } from '../utils/api';
import { useAuth } from '../App';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const SKILLS = [
  '旋挖钻机手', '木工', '电工', '架子工', '钢筋工', '混凝土工', '砌筑工', '抹灰工',
  '防水工', '油漆工', '水暖工', '焊工', '起重工', '信号工', '测量工', '试验工',
  '挖掘机司机', '装载机司机', '塔吊司机', '施工升降机司机', '叉车司机'
];

const CERT_TYPES = [
  '电工证', '焊工证', '架子工证', '塔吊司机证', '施工升降机证', '叉车司机证',
  '起重机械指挥证', '安全员证', '建造师证', '高级技工证', '特种作业操作证'
];

const demoCertificates = [
  { id: 1, type: '电工证', number: '京A123456', issue_date: '2023-01-15', expiry_date: '2026-01-15', status: 'verified', ocr_result: '已通过OCR识别，信息一致' },
  { id: 2, type: '焊工证', number: '京B654321', issue_date: '2022-06-20', expiry_date: '2025-06-20', status: 'verified', ocr_result: '已通过OCR识别，信息一致' },
  { id: 3, type: '高空作业证', number: '京C987654', issue_date: '2024-03-10', expiry_date: '2027-03-10', status: 'pending', ocr_result: '待人工审核' }
];

const demoGuarantor = {
  name: '张三',
  phone: '13900001111',
  relation: '直属亲戚',
  identity_verified: true,
  credit_score: 95,
  guarantee_amount: 10000,
  guarantee_scope: '履约担保、工资纠纷'
};

const demoGuaranteeHistory = [
  { id: 1, project_name: '地铁站木工班组补员', start_date: '2026-06-01', end_date: '2026-06-30', amount: 500, status: 'active' },
  { id: 2, project_name: '钢筋工短期支援', start_date: '2026-05-15', end_date: '2026-05-30', amount: 300, status: 'completed' }
];

function Profile() {
  const auth = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [certificates, setCertificates] = useState(demoCertificates);
  const [ocrModal, setOcrModal] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await profileAPI.getProfile();
      const data = res.data;
      form.setFieldsValue({
        ...data,
        ...data.profile
      });
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (auth?.user?.role === 'worker') {
        await profileAPI.updateWorker(values);
      } else if (auth?.user?.role === 'company') {
        await profileAPI.updateCompany(values);
      }
      message.success('更新成功');
      loadProfile();
    } catch (error) {
      message.error(error.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOCRUpload = async (file) => {
    setOcrLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockOcrResult = {
        success: true,
        certificate_type: '电工证',
        certificate_number: '京D' + Math.floor(Math.random() * 900000 + 100000),
        holder_name: auth?.user?.name || '工友',
        id_card: '110***********1234',
        issue_date: '2023-06-15',
        expiry_date: '2026-06-15',
        issuing_authority: '北京市应急管理局',
        confidence: 96.5,
        verification_status: 'passed'
      };
      
      setOcrResult(mockOcrResult);
      message.success('OCR识别完成');
    } catch (error) {
      message.error('OCR识别失败，请重试');
    } finally {
      setOcrLoading(false);
    }
    return false;
  };

  const handleSaveCertificate = () => {
    if (ocrResult) {
      const newCert = {
        id: certificates.length + 1,
        type: ocrResult.certificate_type,
        number: ocrResult.certificate_number,
        issue_date: ocrResult.issue_date,
        expiry_date: ocrResult.expiry_date,
        status: 'pending',
        ocr_result: 'OCR识别完成，置信度 ' + ocrResult.confidence + '%，待人工审核'
      };
      setCertificates([...certificates, newCert]);
      setOcrModal(false);
      setOcrResult(null);
      message.success('证书已提交，等待审核');
    }
  };

  const certColumns = [
    { title: '证书类型', dataIndex: 'type', key: 'type' },
    { title: '证书编号', dataIndex: 'number', key: 'number' },
    { title: '发证日期', dataIndex: 'issue_date', key: 'issue_date' },
    { title: '有效期至', dataIndex: 'expiry_date', key: 'expiry_date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: s => s === 'verified' ? <Tag color="green">已验证</Tag> : <Tag color="orange">待审核</Tag>
    },
    { title: 'OCR结果', dataIndex: 'ocr_result', key: 'ocr_result' }
  ];

  const guarantorColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date' },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date' },
    { title: '担保金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v}` },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: s => s === 'active' ? <Tag color="green">有效中</Tag> : <Tag color="gray">已完成</Tag>
    }
  ];

  const renderWorkerForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name="skills" label="技能工种">
            <Select mode="multiple" placeholder="请选择您的技能" showSearch>
              {SKILLS.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="experience_years" label="从业年限（年）">
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="experience_tags" label="经验标签">
        <Input placeholder="例如：高层建筑、桥梁、地铁、大型商业综合体" />
      </Form.Item>

      <Form.Item name="certificates" label="持有证书">
        <TextArea rows={2} placeholder="请列出您持有的证书，如：电工证、焊工证等" />
      </Form.Item>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name="location" label="所在地区">
            <Input placeholder="例如：北京市朝阳区" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="daily_salary_expected" label="期望日薪（元）">
            <InputNumber min={100} max={2000} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
          保存
        </Button>
      </Form.Item>
    </Form>
  );

  const renderCompanyForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name="company_name" label="企业名称">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="license_number" label="营业执照编号">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="address" label="企业地址">
        <Input />
      </Form.Item>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name="contact_person" label="联系人">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="contact_phone" label="联系电话">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="safety_certificates" label="安全资质证书">
        <TextArea rows={3} placeholder="请列出企业持有的安全资质证书，如：安全生产许可证、建筑企业资质证书等" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
          保存
        </Button>
      </Form.Item>
    </Form>
  );

  const renderCertificates = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>工种证书管理</Title>
        <Button type="primary" icon={<CameraOutlined />} onClick={() => setOcrModal(true)}>
          OCR识别证书
        </Button>
      </div>

      <Alert
        message="OCR智能识别"
        description="上传证书照片，系统将自动识别证书类型、编号、有效期等信息，无需手动填写。识别结果将提交平台人工审核。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card title="证书列表" size="small" style={{ marginBottom: 16 }}>
        <Table
          columns={certColumns}
          dataSource={certificates}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" title="信用评分">
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="dashboard"
                percent={88}
                format={percent => `${percent} 分`}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              />
              <p style={{ color: '#666', marginTop: 8 }}>良好，可申请高信用额度</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title="实名状态">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="实名认证">
                <Tag color="green">已认证</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="身份核验">
                <Tag color="green">已通过</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="人脸核验">
                <Tag color="green">已完成</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="信用等级">
                <Tag color="blue">A级</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderGuarantee = () => (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>实名担保机制</Title>

      <Alert
        message="双向实名担保"
        description="平台实行双向实名担保机制，工友需提供担保人担保，企业需缴纳履约保证金，确保双方权益。发生纠纷时平台可依据担保约定快速处置。"
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card size="small" title="担保人信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="担保人">
                {demoGuarantor.name}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {demoGuarantor.phone}
              </Descriptions.Item>
              <Descriptions.Item label="关系">
                {demoGuarantor.relation}
              </Descriptions.Item>
              <Descriptions.Item label="身份验证">
                {demoGuarantor.identity_verified ? <Tag color="green">已验证</Tag> : <Tag color="orange">待验证</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="担保人信用">
                {demoGuarantor.credit_score} 分
              </Descriptions.Item>
              <Descriptions.Item label="担保额度">
                ¥{demoGuarantor.guarantee_amount.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="担保范围">
                {demoGuarantor.guarantee_scope}
              </Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '12px 0' }} />
            <Button type="primary" size="small" block>变更担保人</Button>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title="担保说明">
            <List
              size="small"
              dataSource={[
                '担保人需为直系亲属或法定监护人',
                '担保人需完成实名认证且信用分≥80分',
                '担保额度根据担保人信用分确定',
                '工友违约时担保人承担相应责任',
                '无正当理由不得随意变更担保人'
              ]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    description={item}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" title="担保历史记录">
        <Table
          columns={guarantorColumns}
          dataSource={demoGuaranteeHistory}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );

  const renderWorkerTabs = () => (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={[
        {
          key: 'info',
          label: '基本信息',
          children: renderWorkerForm()
        },
        {
          key: 'certificates',
          label: '证书OCR',
          children: renderCertificates()
        },
        {
          key: 'guarantee',
          label: '实名担保',
          children: renderGuarantee()
        },
        {
          key: 'security',
          label: '账号安全',
          children: (
            <div>
              <Descriptions column={1}>
                <Descriptions.Item label="手机号">{auth?.user?.phone}</Descriptions.Item>
                <Descriptions.Item label="实名认证">
                  {auth?.user?.real_name_verified ? <Tag color="green">已认证</Tag> : <Tag color="orange">未认证</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="信用分">88分</Descriptions.Item>
              </Descriptions>
            </div>
          )
        }
      ]}
    />
  );

  return (
    <div className="page-container">
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
          <div>
            <h3 style={{ margin: '0 0 8px 0' }}>{auth?.user?.name || auth?.user?.phone}</h3>
            <Space>
              <Tag color="blue">
                {auth?.user?.role === 'worker' ? '工友' : auth?.user?.role === 'company' ? '企业' : auth?.user?.role === 'team' ? '班组' : '管理员'}
              </Tag>
              <Tag color="green">信用分 88</Tag>
              {auth?.user?.real_name_verified ? <Tag color="green">已实名</Tag> : <Tag color="orange">未实名</Tag>}
            </Space>
          </div>
        </div>

        {auth?.user?.role === 'worker' ? renderWorkerTabs() :
         auth?.user?.role === 'company' ? (
          <Tabs
            items={[
              {
                key: 'info',
                label: '企业信息',
                children: renderCompanyForm()
              },
              {
                key: 'safety',
                label: '安全材料',
                children: (
                  <div>
                    <Title level={5} style={{ marginBottom: 16 }}>安全资质材料上传</Title>
                    <Alert
                      message="安全材料审核"
                      description="请上传企业安全生产许可证、建筑企业资质证书等相关安全材料。平台审核通过后方可发布招工信息。"
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      <Card size="small" title="安全生产许可证">
                        <Upload
                          action="#"
                          listType="picture"
                          beforeUpload={() => false}
                          defaultFileList={[
                            { uid: '1', name: '安全生产许可证.jpg', status: 'done', url: '#' }
                          ]}
                        >
                          <Button icon={<UploadOutlined />}>上传</Button>
                        </Upload>
                        <Tag color="green" style={{ marginTop: 8 }}>已审核通过</Tag>
                      </Card>
                      <Card size="small" title="建筑企业资质证书">
                        <Upload
                          action="#"
                          listType="picture"
                          beforeUpload={() => false}
                          defaultFileList={[
                            { uid: '2', name: '建筑企业资质证书.jpg', status: 'done', url: '#' }
                          ]}
                        >
                          <Button icon={<UploadOutlined />}>上传</Button>
                        </Upload>
                        <Tag color="green" style={{ marginTop: 8 }}>已审核通过</Tag>
                      </Card>
                      <Card size="small" title="三类人员安全考核证">
                        <Upload
                          action="#"
                          listType="picture"
                          beforeUpload={() => false}
                        >
                          <Button icon={<UploadOutlined />}>上传</Button>
                        </Upload>
                        <Tag color="orange" style={{ marginTop: 8 }}>待上传</Tag>
                      </Card>
                    </Space>
                  </div>
                )
              },
              {
                key: 'security',
                label: '账号安全',
                children: (
                  <div>
                    <Descriptions column={1}>
                      <Descriptions.Item label="手机号">{auth?.user?.phone}</Descriptions.Item>
                      <Descriptions.Item label="营业执照验证"><Tag color="green">已验证</Tag></Descriptions.Item>
                    </Descriptions>
                  </div>
                )
              }
            ]}
          />
        ) : (
          <Tabs
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <div>
                    <Descriptions column={1}>
                      <Descriptions.Item label="账号">{auth?.user?.phone}</Descriptions.Item>
                      <Descriptions.Item label="角色">管理员</Descriptions.Item>
                    </Descriptions>
                  </div>
                )
              }
            ]}
          />
        )}
      </Card>

      <Modal
        title="工种证书OCR识别"
        open={ocrModal}
        onCancel={() => setOcrModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CameraOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <p>请将证书对准拍照框，确保证书信息清晰可见</p>
          <p style={{ color: '#999', fontSize: 12 }}>支持：电工证、焊工证、架子工证、塔吊司机证等21种工种证书</p>
          
          <Upload
            action="#"
            listType="picture-card"
            showUploadList={false}
            beforeUpload={handleOCRUpload}
            accept="image/*"
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>{ocrLoading ? '识别中...' : '上传照片'}</div>
            </div>
          </Upload>
        </div>

        {ocrResult && (
          <div>
            <Divider orientation="left">OCR识别结果</Divider>
            <Alert
              message={ocrResult.verification_status === 'passed' ? '识别通过' : '识别异常'}
              description={`置信度：${ocrResult.confidence}%`}
              type={ocrResult.verification_status === 'passed' ? 'success' : 'warning'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="证书类型">{ocrResult.certificate_type}</Descriptions.Item>
              <Descriptions.Item label="证书编号">{ocrResult.certificate_number}</Descriptions.Item>
              <Descriptions.Item label="持证人">{ocrResult.holder_name}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{ocrResult.id_card}</Descriptions.Item>
              <Descriptions.Item label="发证日期">{ocrResult.issue_date}</Descriptions.Item>
              <Descriptions.Item label="有效期至">{ocrResult.expiry_date}</Descriptions.Item>
              <Descriptions.Item label="发证机关" span={2}>{ocrResult.issuing_authority}</Descriptions.Item>
            </Descriptions>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Space>
                <Button onClick={() => setOcrModal(false)}>重新识别</Button>
                <Button type="primary" onClick={handleSaveCertificate}>
                  确认提交
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Profile;
