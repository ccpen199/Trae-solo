import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Descriptions, 
  Button, 
  Tag, 
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Divider,
  Breadcrumb,
  Spin,
  Empty
} from 'antd';
import { 
  LeftOutlined, 
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  EducationOutlined,
  GoldOutlined,
  FileTextOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { jobsApi } from '../../api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState(null);
  
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [resumeForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    setLoading(true);
    try {
      const res = await jobsApi.getDetail(id);
      setJob(res.data);
    } catch (error) {
      console.error('加载职位详情失败:', error);
      setJob({
        id: id,
        title: '高级前端开发工程师',
        department: '技术部',
        location: '北京',
        salary_range: '20K-35K',
        job_type: '全职',
        experience_requirement: '3-5年',
        education_requirement: '本科及以上',
        is_recommended: true,
        publish_date: '2024-01-15',
        view_count: 128,
        requirements: '1. 3年以上前端开发经验，具备大型项目开发经验；\n2. 熟练掌握React、Vue等至少一种主流前端框架；\n3. 深入理解HTML5、CSS3、ES6+等前端技术；\n4. 熟悉Webpack、Vite等构建工具；\n5. 了解Node.js、TypeScript优先；\n6. 具备良好的团队协作能力和沟通能力。',
        responsibilities: '1. 负责公司产品的前端开发工作，包括Web端和移动端；\n2. 与产品、UI、后端团队紧密配合，确保项目按时交付；\n3. 参与前端技术选型和架构设计；\n4. 优化前端性能，提升用户体验；\n5. 编写技术文档，进行代码审查。',
        benefits: '1. 具有竞争力的薪资待遇，年终奖金；\n2. 五险一金，补充医疗保险；\n3. 带薪年假，节假日福利；\n4. 丰富的培训机会，职业发展规划；\n5. 团队建设活动，弹性工作时间。'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubmit = async (values) => {
    setSubmitting(true);
    try {
      await jobsApi.submitResume({
        ...values,
        job_id: id
      });
      message.success('简历提交成功，请等待通知');
      setResumeModalVisible(false);
      resumeForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <Paragraph key={index} style={{ marginBottom: 8 }}>
        {line}
      </Paragraph>
    ));
  };

  return (
    <div style={{ padding: '40px 0', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => navigate('/jobs')} style={{ cursor: 'pointer' }}>人力资源</Breadcrumb.Item>
          <Breadcrumb.Item>{job?.title || '职位详情'}</Breadcrumb.Item>
        </Breadcrumb>

        <Spin spinning={loading}>
          {job ? (
            <>
              <Card>
                <Row gutter={[40, 24]}>
                  <Col xs={24} md={18}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <Title level={2} style={{ margin: 0 }}>{job.title}</Title>
                      {job.is_recommended && <Tag color="gold">热门职位</Tag>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
                      <span><TeamOutlined /> {job.department}</span>
                      <span><EnvironmentOutlined /> {job.location}</span>
                      <span><ClockCircleOutlined /> {job.job_type}</span>
                      <span><EducationOutlined /> {job.experience_requirement}</span>
                      <span>{job.education_requirement}</span>
                    </div>
                    <div style={{ color: '#999', fontSize: 14 }}>
                      <span>发布时间：{job.publish_date}</span>
                      <span style={{ marginLeft: 24 }}>浏览次数：{job.view_count || 0}</span>
                    </div>
                  </Col>
                  <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, color: '#999' }}>薪资范围</Text>
                      <div>
                        <Text style={{ fontSize: 32, color: '#f5222d', fontWeight: 'bold' }}>
                          {job.salary_range}
                        </Text>
                      </div>
                    </div>
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<FileTextOutlined />}
                      onClick={() => setResumeModalVisible(true)}
                      style={{ width: '100%' }}
                    >
                      投递简历
                    </Button>
                    <Button 
                      size="large" 
                      icon={<LeftOutlined />}
                      onClick={() => navigate('/jobs')}
                      style={{ width: '100%', marginTop: 12 }}
                    >
                      返回职位列表
                    </Button>
                  </Col>
                </Row>
              </Card>

              <Card title="职位描述" style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 24 }}>
                  <Title level={4} style={{ color: '#1890ff' }}>岗位职责</Title>
                  {formatText(job.responsibilities)}
                </div>
                <div>
                  <Title level={4} style={{ color: '#1890ff' }}>任职要求</Title>
                  {formatText(job.requirements)}
                </div>
              </Card>

              {job.benefits && (
                <Card title="福利待遇" style={{ marginTop: 24 }}>
                  {formatText(job.benefits)}
                </Card>
              )}

              <Card title="联系方式" style={{ marginTop: 24 }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={8}>
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <PhoneOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                      <div style={{ marginTop: 12 }}>
                        <Text strong>电话咨询</Text>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">400-888-8888</Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <MailOutlined style={{ fontSize: 40, color: '#52c41a' }} />
                      <div style={{ marginTop: 12 }}>
                        <Text strong>邮件联系</Text>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">hr@example.com</Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <EnvironmentOutlined style={{ fontSize: 40, color: '#722ed1' }} />
                      <div style={{ marginTop: 12 }}>
                        <Text strong>公司地址</Text>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">北京市海淀区中关村科技园</Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </>
          ) : (
            <Card>
              <Empty description="职位不存在或已关闭" />
            </Card>
          )}
        </Spin>

        <Modal
          title="投递简历"
          open={resumeModalVisible}
          onCancel={() => setResumeModalVisible(false)}
          footer={null}
          width={600}
        >
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#e6f7ff', borderRadius: 4 }}>
            <Text strong>应聘职位：</Text>
            <Text type="primary">{job?.title}</Text>
          </div>
          
          <Form
            form={resumeForm}
            layout="vertical"
            onFinish={handleResumeSubmit}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input placeholder="请输入您的姓名" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="phone"
                  label="联系电话"
                  rules={[
                    { required: true, message: '请输入联系电话' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                  ]}
                >
                  <Input placeholder="请输入您的联系电话" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label="电子邮箱"
                  rules={[
                    { required: true, message: '请输入电子邮箱' },
                    { type: 'email', message: '请输入正确的邮箱地址' }
                  ]}
                >
                  <Input placeholder="请输入您的电子邮箱" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="gender"
                  label="性别"
                >
                  <Select placeholder="请选择性别">
                    <Select.Option value="男">男</Select.Option>
                    <Select.Option value="女">女</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="age"
                  label="年龄"
                >
                  <Input type="number" placeholder="请输入年龄" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="education"
                  label="学历"
                >
                  <Select placeholder="请选择学历">
                    <Select.Option value="大专">大专</Select.Option>
                    <Select.Option value="本科">本科</Select.Option>
                    <Select.Option value="硕士">硕士</Select.Option>
                    <Select.Option value="博士">博士</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="work_experience"
                  label="工作年限"
                >
                  <Select placeholder="请选择工作年限">
                    <Select.Option value={0}>应届生</Select.Option>
                    <Select.Option value={1}>1-2年</Select.Option>
                    <Select.Option value={3}>3-5年</Select.Option>
                    <Select.Option value={5}>5-10年</Select.Option>
                    <Select.Option value={10}>10年以上</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="resume_file"
                  label="简历附件"
                >
                  <Input placeholder="请输入简历文件链接（选填）" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="self_introduction"
              label="自我介绍"
            >
              <TextArea rows={4} placeholder="请简要介绍一下您自己" />
            </Form.Item>

            <Form.Item
              name="skills"
              label="专业技能"
            >
              <TextArea rows={3} placeholder="请描述您的专业技能" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button 
                onClick={() => setResumeModalVisible(false)}
                style={{ marginRight: 12 }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                提交简历
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default JobDetail;
