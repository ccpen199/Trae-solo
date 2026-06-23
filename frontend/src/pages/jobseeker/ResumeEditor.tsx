import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Select,
  InputNumber,
  DatePicker,
  Slider,
  Checkbox,
  Row,
  Col,
  Divider,
  message,
  Typography,
  Tag,
  List,
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  BookOutlined,
  SolutionOutlined,
  StarOutlined,
  TrophyOutlined,
  AimOutlined,
} from '@ant-design/icons';
import type { SkillCategory } from '../../types';
import { jobseeker } from '../../api/endpoints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const skillCategories: { value: SkillCategory; label: string }[] = [
  { value: 'prepress', label: '印前' },
  { value: 'printing', label: '印中' },
  { value: 'postpress', label: '印后' },
  { value: 'management', label: '管理' },
];

const printingEquipments = [
  '海德堡印刷机', '小森印刷机', '罗兰印刷机', '高宝印刷机',
  'CTP制版机', '数码打样机', '覆膜机', '模切机', '烫金机',
];

const printingProcesses = [
  '胶印', '凹印', '柔印', '丝印', '数码印刷',
  '烫金', 'UV上光', '覆膜', '模切', '压纹',
];

const skillOptions = [
  { label: 'PS版制作', value: 'ps_plate' },
  { label: 'CTP操作', value: 'ctp' },
  { label: '色彩管理', value: 'color_management' },
  { label: '印刷机操作', value: 'press_operation' },
  { label: '质量检测', value: 'quality_inspection' },
  { label: '设备维护', value: 'equipment_maintenance' },
  { label: '生产管理', value: 'production_management' },
  { label: '成本控制', value: 'cost_control' },
];

const ResumeEditor = () => {
  const [form] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    setLoading(true);
    try {
      const response = await jobseeker.resume();
      const data = response.data?.data || response.data;
      if (data) {
        form.setFieldsValue({
          name: data.name,
          gender: data.gender,
          age: data.age,
          phone: data.phone,
          email: data.email,
          education: data.education,
          workExperience: data.workExperience || [],
          skills: data.skills || [],
          certifications: data.certifications || [],
          expectedSalary: data.expectedSalary,
          expectedPosition: data.expectedPosition,
        });
      }
    } catch (error) {
      console.error('Failed to fetch resume:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValuesChange = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 3000);
    setAutoSaveTimer(timer);
  };

  const handleAutoSave = async () => {
    try {
      const values = await form.validateFields();
      await jobseeker.updateResume(values);
      message.info('已自动保存');
    } catch (error) {
      // 忽略验证错误
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      await jobseeker.updateResume(values);
      message.success('简历保存成功');
    } catch (error) {
      message.error('请检查表单填写是否正确');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarOutlined
        key={i}
        style={{ color: i < count ? '#faad14' : '#d9d9d9' }}
      />
    ));
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            简历编辑器
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(!previewVisible)}>
              {previewVisible ? '隐藏预览' : '实时预览'}
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
              保存简历
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={previewVisible ? 14 : 24}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleValuesChange}
            initialValues={{
              workExperience: [{}],
              skills: [{}],
              certifications: [{}],
            }}
          >
            <Card
              title={<><UserOutlined /> 基本信息</>}
              style={{ marginBottom: '16px' }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="gender" label="性别">
                    <Select placeholder="请选择性别">
                      <Option value="male">男</Option>
                      <Option value="female">女</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="age" label="年龄">
                    <InputNumber min={16} max={70} style={{ width: '100%' }} placeholder="请输入年龄" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="手机号码"
                    rules={[{ required: true, message: '请输入手机号码' }]}
                  >
                    <Input placeholder="请输入手机号码" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="电子邮箱"
                    rules={[
                      { required: true, message: '请输入电子邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input placeholder="请输入电子邮箱" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="education" label="最高学历">
                    <Select placeholder="请选择最高学历">
                      <Option value="high_school">高中</Option>
                      <Option value="college">大专</Option>
                      <Option value="bachelor">本科</Option>
                      <Option value="master">硕士</Option>
                      <Option value="doctor">博士</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              title={<><BookOutlined /> 教育背景</>}
              style={{ marginBottom: '16px' }}
            >
              <Form.List name="educationBackground">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={key}
                        size="small"
                        style={{ marginBottom: '12px' }}
                        extra={
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          />
                        }
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'school']}
                              label="学校名称"
                              rules={[{ required: true, message: '请输入学校名称' }]}
                            >
                              <Input placeholder="请输入学校名称" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'major']}
                              label="专业"
                              rules={[{ required: true, message: '请输入专业' }]}
                            >
                              <Input placeholder="请输入专业" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'degree']}
                              label="学历"
                              rules={[{ required: true, message: '请选择学历' }]}
                            >
                              <Select placeholder="请选择学历">
                                <Option value="high_school">高中</Option>
                                <Option value="college">大专</Option>
                                <Option value="bachelor">本科</Option>
                                <Option value="master">硕士</Option>
                                <Option value="doctor">博士</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'period']}
                              label="就读时间"
                              rules={[{ required: true, message: '请选择就读时间' }]}
                            >
                              <RangePicker style={{ width: '100%' }} picker="month" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加教育背景
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>

            <Card
              title={<><SolutionOutlined /> 工作经验</>}
              style={{ marginBottom: '16px' }}
            >
              <Form.List name="workExperience">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={key}
                        size="small"
                        style={{ marginBottom: '12px' }}
                        extra={
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          />
                        }
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'company']}
                              label="公司名称"
                              rules={[{ required: true, message: '请输入公司名称' }]}
                            >
                              <Input placeholder="请输入公司名称" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'position']}
                              label="职位"
                              rules={[{ required: true, message: '请输入职位' }]}
                            >
                              <Input placeholder="请输入职位" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'period']}
                              label="在职时间"
                              rules={[{ required: true, message: '请选择在职时间' }]}
                            >
                              <RangePicker style={{ width: '100%' }} picker="month" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, 'description']}
                              label="工作描述"
                            >
                              <TextArea rows={3} placeholder="请描述您的工作职责和成就" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Divider orientation="left" style={{ margin: '8px 0' }}>
                              <Text type="secondary">印刷设备操作经验</Text>
                            </Divider>
                            <Form.Item
                              {...restField}
                              name={[name, 'equipmentExperience']}
                              label=""
                            >
                              <Checkbox.Group options={printingEquipments} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'offsetExperienceYears']}
                              label="胶印经验（年）"
                            >
                              <InputNumber min={0} max={50} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'gravureExperienceYears']}
                              label="凹印经验（年）"
                            >
                              <InputNumber min={0} max={50} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'flexoExperienceYears']}
                              label="柔印经验（年）"
                            >
                              <InputNumber min={0} max={50} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Divider orientation="left" style={{ margin: '8px 0' }}>
                              <Text type="secondary">印刷工艺经验</Text>
                            </Divider>
                            <Form.Item
                              {...restField}
                              name={[name, 'processExperience']}
                              label=""
                            >
                              <Checkbox.Group options={printingProcesses} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加工作经验
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>

            <Card
              title={<><StarOutlined /> 技能特长</>}
              style={{ marginBottom: '16px' }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="技能分类">
                    <Form.Item name="skillCategories" noStyle>
                      <Checkbox.Group options={skillCategories} />
                    </Form.Item>
                  </Form.Item>
                </Col>
              </Row>
              <Form.List name="skills">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card key={key} size="small" style={{ marginBottom: '12px' }}>
                        <Row gutter={16} align="middle">
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'name']}
                              label="技能名称"
                              rules={[{ required: true, message: '请选择技能' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Select placeholder="请选择技能">
                                {skillOptions.map(opt => (
                                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={14}>
                            <Form.Item
                              {...restField}
                              name={[name, 'proficiency']}
                              label="熟练度"
                              rules={[{ required: true, message: '请设置熟练度' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Slider
                                min={1}
                                max={5}
                                marks={{
                                  1: '入门',
                                  2: '熟悉',
                                  3: '熟练',
                                  4: '精通',
                                  5: '专家',
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={2}>
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                            />
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加技能
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>

            <Card
              title={<><TrophyOutlined /> 证书资质</>}
              style={{ marginBottom: '16px' }}
            >
              <Form.List name="certifications">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={key}
                        size="small"
                        style={{ marginBottom: '12px' }}
                        extra={
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          />
                        }
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'name']}
                              label="证书名称"
                              rules={[{ required: true, message: '请输入证书名称' }]}
                            >
                              <Select placeholder="请选择或输入证书名称" allowClear showSearch>
                                <Option value="iso9001">ISO 9001 质量管理体系认证</Option>
                                <Option value="iso14001">ISO 14001 环境管理体系认证</Option>
                                <Option value="special_equipment">特种设备操作证</Option>
                                <Option value="color_management">色彩管理师认证</Option>
                                <Option value="printing_engineer">印刷工程师职称</Option>
                                <Option value="other">其他证书</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'issuer']}
                              label="发证机构"
                            >
                              <Input placeholder="请输入发证机构" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'date']}
                              label="发证日期"
                            >
                              <DatePicker style={{ width: '100%' }} picker="month" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'isoCertificationExperience']}
                              label="ISO认证相关经验"
                            >
                              <Input placeholder="请描述相关经验" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加证书
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>

            <Card
              title={<><AimOutlined /> 求职意向</>}
              style={{ marginBottom: '16px' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="expectedPosition" label="期望职位">
                    <Input placeholder="请输入期望职位" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="expectedSalary" label="期望薪资（K/月）">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入期望薪资" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="expectedLocation" label="期望工作地点">
                    <Input placeholder="请输入期望工作地点" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="expectedIndustry" label="期望行业">
                    <Select placeholder="请选择期望行业" allowClear>
                      <Option value="packaging">包装印刷</Option>
                      <Option value="publishing">出版印刷</Option>
                      <Option value="commercial">商业印刷</Option>
                      <Option value="label">标签印刷</Option>
                      <Option value="flexo">柔版印刷</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Form>
        </Col>

        {previewVisible && (
          <Col span={10}>
            <Card
              title="实时预览"
              style={{ position: 'sticky', top: '24px' }}
              size="small"
            >
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const values = form.getFieldsValue();
                  return (
                    <div style={{ fontSize: '12px' }}>
                      <Title level={4} style={{ marginBottom: '8px' }}>{values.name || '您的姓名'}</Title>
                      <Space size={[8, 4]} wrap style={{ marginBottom: '12px' }}>
                        {values.phone && <Tag color="blue">{values.phone}</Tag>}
                        {values.email && <Tag color="green">{values.email}</Tag>}
                        {values.gender && <Tag>{values.gender === 'male' ? '男' : '女'}</Tag>}
                        {values.age && <Tag>{values.age}岁</Tag>}
                      </Space>

                      {values.education && (
                        <div style={{ marginBottom: '12px' }}>
                          <Text strong>最高学历：</Text>
                          <Text>{values.education}</Text>
                        </div>
                      )}

                      {values.workExperience?.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <Divider orientation="left" style={{ margin: '8px 0', fontSize: '12px' }}>工作经验</Divider>
                          <List
                            size="small"
                            dataSource={values.workExperience}
                            renderItem={(item: any) => (
                              <List.Item>
                                <List.Item.Meta
                                  title={item.company || '某公司'}
                                  description={
                                    <>
                                      <div>{item.position || '某职位'}</div>
                                      {item.period && (
                                        <div style={{ color: '#999' }}>
                                          {dayjs(item.period[0]).format('YYYY.MM')} - {dayjs(item.period[1]).format('YYYY.MM')}
                                        </div>
                                      )}
                                    </>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        </div>
                      )}

                      {values.skills?.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <Divider orientation="left" style={{ margin: '8px 0', fontSize: '12px' }}>技能特长</Divider>
                          <Space size={[4, 4]} wrap>
                            {values.skills.map((skill: any, idx: number) => (
                              <Tag key={idx}>
                                {skillOptions.find(o => o.value === skill.name)?.label || skill.name}
                                {skill.proficiency ? <span style={{ marginLeft: 4 }}>{renderStars(skill.proficiency)}</span> : null}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      )}

                      {values.certifications?.length > 0 && (
                        <div>
                          <Divider orientation="left" style={{ margin: '8px 0', fontSize: '12px' }}>证书资质</Divider>
                          <List
                            size="small"
                            dataSource={values.certifications}
                            renderItem={(cert: any) => (
                              <List.Item>
                                <List.Item.Meta
                                  title={cert.name || '某证书'}
                                  description={cert.issuer || ''}
                                />
                              </List.Item>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  );
                }}
              </Form.Item>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ResumeEditor;
