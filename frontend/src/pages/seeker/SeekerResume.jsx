import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Row, Col, Select, message, Spin,
  Space, Tag, Divider, List, Modal, InputNumber, Upload, Tabs
} from 'antd';
import {
  SaveOutlined, PlusOutlined, DeleteOutlined,
  VideoCameraOutlined, LinkOutlined, FileTextOutlined,
  GlobalOutlined, EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import MatchRadarChart from '../../components/Charts/MatchRadarChart.jsx';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const TECH_SKILLS = [
  'UG NX', 'Mastercam', 'AutoCAD', 'SolidWorks', 'Pro/E', 'CATIA',
  'CNC编程', 'G代码', '宏程序', 'FANUC', 'SIEMENS', '三菱',
  'PLC', '西门子S7', 'WinCC', '组态王', '工业机器人', 'FANUC机器人',
  '精益生产', '六西格玛', 'SPC', 'FMEA', 'MSA', '8D报告',
  '线切割', '电火花', '模具设计', '注塑模', '冲压模',
  '液压气动', '电气控制', '伺服系统', '变频器', 'CAD/CAM'
];

const SeekerResume = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [workExperience, setWorkExperience] = useState([]);
  const [educationExperience, setEducationExperience] = useState([]);
  const [projectExperience, setProjectExperience] = useState([]);
  const [expModalVisible, setExpModalVisible] = useState(false);
  const [expForm] = Form.useForm();
  const [expType, setExpType] = useState('work');
  const [editingExp, setEditingExp] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);

  useEffect(() => {
    fetchResume();
    fetchMatchHistory();
  }, []);

  const fetchResume = async () => {
    setLoading(true);
    try {
      const res = await api.get('/job-seekers/profile');
      const data = res.data.resume;
      setResumeData(data);

      if (data) {
        form.setFieldsValue({
          resume_title: data.resume_title,
          project_videos: data.project_videos,
          portfolio_url: data.portfolio_url,
        });
        setSelectedSkills(data.skills || []);
        setWorkExperience(data.work_experience || []);
        setEducationExperience(data.education_experience || []);
        setProjectExperience(data.project_experience || []);
      }
    } catch (e) {
      message.error('加载简历失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchHistory = async () => {
    try {
      const res = await api.get('/job-seekers/match-scores');
      setMatchHistory(res.data.matches || []);
    } catch (e) {
      // ignore
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        skills: selectedSkills,
        work_experience: workExperience,
        education_experience: educationExperience,
        project_experience: projectExperience,
        three_d_data: {
          layout: 'timeline',
          theme: 'blue',
          show_skills: true,
          show_projects: true,
        },
      };

      await api.put('/job-seekers/resume', data);
      message.success('简历保存成功');
      fetchResume();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const openExpModal = (type, item = null) => {
    setExpType(type);
    setEditingExp(item);
    expForm.resetFields();
    if (item) {
      expForm.setFieldsValue(item);
    }
    setExpModalVisible(true);
  };

  const saveExp = async () => {
    try {
      const values = await expForm.validateFields();
      const key = expType === 'work' ? 'workExperience' : expType === 'education' ? 'educationExperience' : 'projectExperience';
      const currentList = key === 'workExperience' ? workExperience : key === 'educationExperience' ? educationExperience : projectExperience;
      const setList = key === 'workExperience' ? setWorkExperience : key === 'educationExperience' ? setEducationExperience : setProjectExperience;

      if (editingExp) {
        setList(currentList.map(item => item.id === editingExp.id ? { ...values, id: editingExp.id } : item));
      } else {
        setList([...currentList, { ...values, id: Date.now() }]);
      }
      setExpModalVisible(false);
      message.success('保存成功');
    } catch (e) {
      // validation error
    }
  };

  const deleteExp = (type, id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: () => {
        if (type === 'work') setWorkExperience(workExperience.filter(i => i.id !== id));
        else if (type === 'education') setEducationExperience(educationExperience.filter(i => i.id !== id));
        else setProjectExperience(projectExperience.filter(i => i.id !== id));
      },
    });
  };

  const renderExpForm = () => {
    if (expType === 'work') {
      return (
        <Form form={expForm} layout="vertical">
          <Form.Item name="company" label="公司名称" rules={[{ required: true }]}>
            <Input placeholder="请输入公司名称" />
          </Form.Item>
          <Form.Item name="position" label="职位" rules={[{ required: true }]}>
            <Input placeholder="请输入职位" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="开始时间" rules={[{ required: true }]}>
                <Input placeholder="例如：2021-03" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="结束时间">
                <Input placeholder="至今或2023-06" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="工作描述" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请描述您的工作内容和成就" />
          </Form.Item>
        </Form>
      );
    } else if (expType === 'education') {
      return (
        <Form form={expForm} layout="vertical">
          <Form.Item name="school" label="学校名称" rules={[{ required: true }]}>
            <Input placeholder="请输入学校名称" />
          </Form.Item>
          <Form.Item name="major" label="专业" rules={[{ required: true }]}>
            <Input placeholder="请输入专业" />
          </Form.Item>
          <Form.Item name="degree" label="学历" rules={[{ required: true }]}>
            <Select>
              <Option value="大专">大专</Option>
              <Option value="本科">本科</Option>
              <Option value="硕士">硕士</Option>
              <Option value="博士">博士</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="入学时间" rules={[{ required: true }]}>
                <Input placeholder="例如：2015-09" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="毕业时间" rules={[{ required: true }]}>
                <Input placeholder="例如：2019-06" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="在校经历">
            <TextArea rows={3} placeholder="主修课程、获奖情况、社团活动等" />
          </Form.Item>
        </Form>
      );
    } else {
      return (
        <Form form={expForm} layout="vertical">
          <Form.Item name="project_name" label="项目名称" rules={[{ required: true }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="role" label="项目角色" rules={[{ required: true }]}>
            <Input placeholder="例如：项目负责人/核心开发" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="开始时间" rules={[{ required: true }]}>
                <Input placeholder="例如：2022-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="结束时间">
                <Input placeholder="至今或2023-06" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="项目描述" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请描述项目背景、您的职责和项目成果" />
          </Form.Item>
          <Form.Item name="tech_stack" label="技术栈">
            <Select mode="tags" placeholder="请输入或选择使用的技术">
              {TECH_SKILLS.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="video_url" label="项目视频链接">
            <Input placeholder="优酷、B站等视频链接" />
          </Form.Item>
        </Form>
      );
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header">
        <h2>三维简历</h2>
        <Space>
          {resumeData && (
            <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(true)}>
              预览简历
            </Button>
          )}
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            保存简历
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Card className="card-shadow">
                <Form form={form} layout="vertical" size="large">
                  <Form.Item
                    name="resume_title"
                    label="简历标题"
                    help="一句话介绍您的专业优势"
                  >
                    <Input placeholder="例如：5年CNC编程经验，精通UG和Mastercam" />
                  </Form.Item>

                  <div className="section-title">专业技能</div>
                  <Form.Item label="技能标签">
                    <Select
                      mode="tags"
                      style={{ width: '100%' }}
                      placeholder="输入或选择您的专业技能"
                      value={selectedSkills}
                      onChange={setSelectedSkills}
                      tokenSeparators={[',']}
                      dropdownRender={menu => (
                        <div>
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <div style={{ padding: '0 8px 8px' }}>
                            <span style={{ color: '#8c8c8c', fontSize: 12 }}>常用技能：</span>
                            {TECH_SKILLS.slice(0, 10).map(s => (
                              <Tag
                                key={s}
                                color="blue"
                                style={{ margin: 2, cursor: 'pointer' }}
                                onClick={() => {
                                  if (!selectedSkills.includes(s)) {
                                    setSelectedSkills([...selectedSkills, s]);
                                  }
                                }}
                              >
                                {s}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    >
                      {TECH_SKILLS.map(s => <Option key={s} value={s}>{s}</Option>)}
                    </Select>
                  </Form.Item>

                  {selectedSkills.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Space wrap>
                        {selectedSkills.map((skill, idx) => (
                          <Tag
                            key={idx}
                            color="#1677ff"
                            closable
                            onClose={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}
                          >
                            {skill}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  )}

                  <div className="section-title">多媒体展示</div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="project_videos"
                        label={<span><VideoCameraOutlined /> 项目视频链接</span>}
                      >
                        <Input placeholder="多个链接用逗号分隔" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="portfolio_url"
                        label={<span><LinkOutlined /> 作品集链接</span>}
                      >
                        <Input placeholder="个人主页或作品集地址" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="section-title">作品上传</div>
                  <Upload multiple fileList={[]}>
                    <div className="upload-area">
                      <div className="upload-icon"><FileTextOutlined /></div>
                      <div className="upload-text">点击或拖拽上传项目作品/设计图纸</div>
                      <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 8 }}>
                        支持 PDF、DWG、图片等格式，单个文件最大 10MB
                      </div>
                    </div>
                  </Upload>
                </Form>
              </Card>
            </TabPane>

            <TabPane tab="工作经历" key="work">
              <Card
                className="card-shadow"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openExpModal('work')}>
                    添加工作经历
                  </Button>
                }
              >
                {workExperience.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
                    <GlobalOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <p>暂无工作经历，点击右上角添加</p>
                  </div>
                ) : (
                  <List
                    dataSource={workExperience}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Button type="link" onClick={() => openExpModal('work', item)}>编辑</Button>,
                          <Button type="link" danger onClick={() => deleteExp('work', item.id)}>删除</Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <strong>{item.position}</strong>
                              <span style={{ color: '#8c8c8c' }}>@ {item.company}</span>
                            </Space>
                          }
                          description={
                            <>
                              <div style={{ color: '#8c8c8c', marginBottom: 8 }}>
                                {item.start_date} - {item.end_date || '至今'}
                              </div>
                              <p style={{ whiteSpace: 'pre-wrap', color: '#262626' }}>{item.description}</p>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </TabPane>

            <TabPane tab="教育经历" key="edu">
              <Card
                className="card-shadow"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openExpModal('education')}>
                    添加教育经历
                  </Button>
                }
              >
                {educationExperience.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
                    <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <p>暂无教育经历，点击右上角添加</p>
                  </div>
                ) : (
                  <List
                    dataSource={educationExperience}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Button type="link" onClick={() => openExpModal('education', item)}>编辑</Button>,
                          <Button type="link" danger onClick={() => deleteExp('education', item.id)}>删除</Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <strong>{item.school}</strong>
                              <Tag color="blue">{item.degree}</Tag>
                            </Space>
                          }
                          description={
                            <>
                              <div style={{ color: '#595959', marginBottom: 4 }}>{item.major}</div>
                              <div style={{ color: '#8c8c8c', marginBottom: 8 }}>
                                {item.start_date} - {item.end_date}
                              </div>
                              {item.description && <p style={{ color: '#262626' }}>{item.description}</p>}
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </TabPane>

            <TabPane tab="项目经验" key="project">
              <Card
                className="card-shadow"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openExpModal('project')}>
                    添加项目经验
                  </Button>
                }
              >
                {projectExperience.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
                    <VideoCameraOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <p>暂无项目经验，点击右上角添加</p>
                    <p style={{ fontSize: 12 }}>项目经验是展示您能力的重要窗口</p>
                  </div>
                ) : (
                  <List
                    dataSource={projectExperience}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Button type="link" onClick={() => openExpModal('project', item)}>编辑</Button>,
                          <Button type="link" danger onClick={() => deleteExp('project', item.id)}>删除</Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <strong>{item.project_name}</strong>
                              <Tag color="orange">{item.role}</Tag>
                              {item.video_url && <Tag icon={<VideoCameraOutlined />} color="red">含视频</Tag>}
                            </Space>
                          }
                          description={
                            <>
                              <div style={{ color: '#8c8c8c', marginBottom: 8 }}>
                                {item.start_date} - {item.end_date || '至今'}
                              </div>
                              {item.tech_stack?.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  {item.tech_stack.map((t, i) => (
                                    <Tag key={i} color="blue" style={{ margin: 2 }}>{t}</Tag>
                                  ))}
                                </div>
                              )}
                              <p style={{ whiteSpace: 'pre-wrap', color: '#262626' }}>{item.description}</p>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </TabPane>
          </Tabs>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="card-shadow" style={{ marginBottom: 16 }}>
            <div className="section-title">简历完整度</div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: '#1677ff' }}>
                {Math.round(
                  ((resumeData?.resume_title ? 10 : 0) +
                   (selectedSkills.length * 3) +
                   (workExperience.length * 20) +
                   (educationExperience.length * 15) +
                   (projectExperience.length * 25) +
                   (resumeData?.project_videos ? 10 : 0))
                )}%
              </div>
              <div style={{ color: '#8c8c8c' }}>越完整的简历越容易获得面试机会</div>
            </div>
          </Card>

          <Card className="card-shadow" style={{ marginBottom: 16 }}>
            <div className="section-title">岗位匹配记录</div>
            {matchHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#8c8c8c', fontSize: 12 }}>
                暂无匹配记录，进入职位详情可查看匹配度
              </div>
            ) : (
              <List
                size="small"
                dataSource={matchHistory.slice(0, 5)}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.job_title}
                      description={item.enterprise_name}
                    />
                    <Tag color={item.overall_score >= 70 ? 'green' : item.overall_score >= 50 ? 'orange' : 'red'}>
                      {item.overall_score}分
                    </Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={expType === 'work' ? '工作经历' : expType === 'education' ? '教育经历' : '项目经验'}
        open={expModalVisible}
        onOk={saveExp}
        onCancel={() => setExpModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        {renderExpForm()}
      </Modal>

      <Modal
        title="简历预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={900}
      >
        {resumeData && (
          <div className="three-d-resume">
            <div className="resume-card" style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, marginBottom: 8 }}>{resumeData.resume_title || '未命名简历'}</h2>
                {selectedSkills.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    {selectedSkills.map((s, i) => (
                      <Tag key={i} color="blue" style={{ margin: 2 }}>{s}</Tag>
                    ))}
                  </div>
                )}
              </div>

              {projectExperience.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div className="section-title">项目经验</div>
                  {projectExperience.map((p, i) => (
                    <Card size="small" key={i} style={{ marginBottom: 8 }}>
                      <strong>{p.project_name}</strong>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>{p.start_date} - {p.end_date || '至今'}</div>
                      <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{p.description}</p>
                    </Card>
                  ))}
                </div>
              )}

              {workExperience.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div className="section-title">工作经历</div>
                  {workExperience.map((w, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <strong>{w.position}</strong> @ {w.company}
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>{w.start_date} - {w.end_date || '至今'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SeekerResume;
