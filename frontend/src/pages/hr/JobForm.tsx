import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, message, Space, Tag, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../utils/axios';

const { TextArea } = Input;
const { Option } = Select;

export default function HRJobForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      const { data } = await axios.get(`/jobs/${id}`);
      form.setFieldsValue(data);
      if (data.skills) {
        setSkills(JSON.parse(data.skills));
      }
    } catch (error) {
      message.error('加载失败');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const jobData = {
        ...values,
        skills: JSON.stringify(skills)
      };
      
      if (isEdit) {
        await axios.put(`/jobs/${id}`, jobData);
        message.success('修改成功');
      } else {
        await axios.post('/jobs', jobData);
        message.success('发布成功，等待审核');
      }
      navigate('/hr/jobs');
    } catch (error: any) {
      message.error(error.response?.data?.error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput && !skills.includes(skillInput)) {
      setSkills([...skills, skillInput]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  return (
    <Card title={isEdit ? '编辑职位' : '发布新职位'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 800 }}
      >
        <Form.Item name="title" label="职位名称" rules={[{ required: true, message: '请输入职位名称' }]}>
          <Input placeholder="例如：Java开发工程师" />
        </Form.Item>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item name="industry" label="所属行业" rules={[{ required: true, message: '请选择行业' }]}>
              <Select placeholder="请选择">
                <Option value="internet">互联网/IT</Option>
                <Option value="manufacturing">生产制造</Option>
                <Option value="service">服务业</Option>
                <Option value="logistics">物流仓储</Option>
                <Option value="retail">零售百货</Option>
                <Option value="finance">金融保险</Option>
                <Option value="education">教育培训</Option>
                <Option value="medical">医疗健康</Option>
                <Option value="construction">建筑装修</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="work_type" label="工作类型">
              <Select placeholder="请选择">
                <Option value="fulltime">全职</Option>
                <Option value="parttime">兼职</Option>
                <Option value="intern">实习</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item name="salary_min" label="薪资下限(K)" rules={[{ required: true, message: '请输入薪资下限' }]}>
              <Input type="number" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="salary_max" label="薪资上限(K)" rules={[{ required: true, message: '请输入薪资上限' }]}>
              <Input type="number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}>
            <Form.Item name="province" label="省份">
              <Input placeholder="例如：广东省" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="city" label="城市">
              <Input placeholder="例如：深圳市" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="district" label="区">
              <Input placeholder="例如：南山区" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="address" label="详细地址">
          <Input placeholder="请输入详细地址" />
        </Form.Item>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item name="experience_required" label="经验要求">
              <Select placeholder="请选择">
                <Option value="不限">不限</Option>
                <Option value="应届生">应届生</Option>
                <Option value="1-3年">1-3年</Option>
                <Option value="3-5年">3-5年</Option>
                <Option value="5-10年">5-10年</Option>
                <Option value="10年以上">10年以上</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="education_required" label="学历要求">
              <Select placeholder="请选择">
                <Option value="不限">不限</Option>
                <Option value="大专">大专</Option>
                <Option value="本科">本科</Option>
                <Option value="硕士">硕士</Option>
                <Option value="博士">博士</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="技能标签">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space wrap>
              {skills.map(skill => (
                <Tag
                  key={skill}
                  closable
                  onClose={() => removeSkill(skill)}
                  color="blue"
                >
                  {skill}
                </Tag>
              ))}
            </Space>
            <Space>
              <Input
                style={{ width: 200 }}
                placeholder="输入技能名称"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onPressEnter={addSkill}
              />
              <Button icon={<PlusOutlined />} onClick={addSkill}>添加</Button>
            </Space>
          </Space>
        </Form.Item>

        <Form.Item name="description" label="职位描述">
          <TextArea rows={6} placeholder="请输入职位描述..." />
        </Form.Item>

        <Form.Item name="requirements" label="任职要求">
          <TextArea rows={6} placeholder="请输入任职要求..." />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              {isEdit ? '保存修改' : '发布职位'}
            </Button>
            <Button size="large" onClick={() => navigate('/hr/jobs')}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
