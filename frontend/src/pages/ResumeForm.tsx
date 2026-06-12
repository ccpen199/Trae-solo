import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, Select, Space, Typography, App, Row, Col, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export default function ResumeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [skillOptions, setSkillOptions] = useState<any[]>([]);
  const { message } = App.useApp();
  const isEdit = !!id;

  useEffect(() => {
    api.get('/matching/skills').then((d: any) => setSkillOptions(d.skills || []));
    if (id) {
      api.get(`/resumes/${id}`).then((d: any) => {
        form.setFieldsValue({
          ...d.resume,
          workHistory: d.resume.workHistory,
          projects: d.resume.projects,
          certifications: d.resume.certifications
        });
      });
    }
  }, [id, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/resumes/${id}`, values);
        message.success('简历已更新');
      } else {
        await api.post('/resumes', values);
        message.success('简历已创建');
      }
      navigate('/resumes');
    } catch (e: any) {
      message.error(e.error || '保存失败');
    } finally { setLoading(false); }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? '编辑简历' : '创建简历'}</Title>
      </Space>

      <Card>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="title" label="简历标题" rules={[{ required: true }]}>
                <Input placeholder="如：高级前端工程师求职简历" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="experience" label="工作年限" initialValue={0}>
                <InputNumber min={0} max={50} style={{ width: '100%' }} addonAfter="年" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="education" label="学历">
            <Select placeholder="选择学历">
              <Option value="大专">大专</Option>
              <Option value="本科">本科</Option>
              <Option value="硕士">硕士</Option>
              <Option value="博士">博士</Option>
            </Select>
          </Form.Item>

          <Form.Item name="summary" label="个人简介">
            <Input.TextArea rows={4} placeholder="简要介绍自己的背景、优势..." />
          </Form.Item>

          <Form.Item name="skills" label="技能标签" tooltip="支持选择已有标签或输入自定义标签">
            <Select mode="tags" style={{ width: '100%' }} placeholder="输入或选择技能，回车确认">
              {skillOptions.map((s: any) => <Option key={s.id} value={s.name}>{s.name} <span style={{ color: '#999' }}>({s.category})</span></Option>)}
            </Select>
          </Form.Item>

          <Divider orientation="left">工作经历</Divider>
          <Form.List name="workHistory">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" style={{ marginBottom: 12 }} title={`经历 ${name + 1}`} extra={<MinusCircleOutlined onClick={() => remove(name)} />}>
                    <Row gutter={12}>
                      <Col xs={24} md={12}><Form.Item {...rest} name={[name, 'company']} label="公司名称"><Input /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item {...rest} name={[name, 'position']} label="职位"><Input /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item {...rest} name={[name, 'startDate']} label="开始时间"><Input placeholder="如：2020-01" /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item {...rest} name={[name, 'endDate']} label="结束时间"><Input placeholder="留空表示至今" /></Form.Item></Col>
                    </Row>
                    <Form.Item {...rest} name={[name, 'description']} label="工作描述"><Input.TextArea rows={2} /></Form.Item>
                  </Card>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} block onClick={() => add({})}>添加工作经历</Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left">项目经历</Divider>
          <Form.List name="projects">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" style={{ marginBottom: 12 }} title={`项目 ${name + 1}`} extra={<MinusCircleOutlined onClick={() => remove(name)} />}>
                    <Row gutter={12}>
                      <Col xs={24} md={12}><Form.Item {...rest} name={[name, 'name']} label="项目名称"><Input /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item {...rest} name={[name, 'role']} label="担任角色"><Input /></Form.Item></Col>
                    </Row>
                    <Form.Item {...rest} name={[name, 'description']} label="项目描述"><Input.TextArea rows={3} /></Form.Item>
                  </Card>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} block onClick={() => add({})}>添加项目经历</Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left">证书资质</Divider>
          <Form.List name="certifications">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...rest} name={name} noStyle rules={[{ required: true, message: '必填' }]}>
                      <Input placeholder="证书名称" style={{ width: 300 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} block onClick={() => add('')}>添加证书</Button>
              </>
            )}
          </Form.List>

          <Form.Item name="isPublic" label="简历可见性" valuePropName="checked" initialValue={true}>
            <Select>
              <Option value={1}>公开 - HR可搜索到</Option>
              <Option value={0}>私密 - 仅自己可见</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>保存简历</Button>
              <Button onClick={() => navigate(-1)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}
