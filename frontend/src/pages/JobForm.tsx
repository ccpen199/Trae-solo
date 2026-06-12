import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, Select, Space, Typography, App, Row, Col, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const { Title } = Typography;
const { Option } = Select;

export default function JobForm() {
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
      api.get(`/jobs/${id}`).then((d: any) => form.setFieldsValue(d.job));
    }
  }, [id, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/jobs/${id}`, values);
        message.success('岗位已更新');
      } else {
        await api.post('/jobs', values);
        message.success('岗位已发布');
      }
      navigate('/jobs');
    } catch (e: any) {
      message.error(e.error || '保存失败');
    } finally { setLoading(false); }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? '编辑岗位' : '发布新岗位'}</Title>
      </Space>

      <Card>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="title" label="岗位名称" rules={[{ required: true }]}>
                <Input placeholder="如：高级前端工程师" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="department" label="所属部门">
                <Input placeholder="如：技术部" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="location" label="工作地点">
                <Input placeholder="如：北京、上海、远程" />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item name="salary_min" label="最低薪资">
                <InputNumber min={0} style={{ width: '100%' }} addonAfter="K" />
              </Form.Item>
            </Col>
            <Col xs={12} md={4}>
              <Form.Item name="salary_max" label="最高薪资">
                <InputNumber min={0} style={{ width: '100%' }} addonAfter="K" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="industry" label="所属行业">
                <Select>
                  <Option value="科技">科技</Option>
                  <Option value="金融">金融</Option>
                  <Option value="教育">教育</Option>
                  <Option value="医疗">医疗</Option>
                  <Option value="制造">制造</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="experience_level" label="经验要求">
                <Select>
                  <Option value="不限">不限</Option>
                  <Option value="应届">应届毕业生</Option>
                  <Option value="1-3年">1-3年</Option>
                  <Option value="3-5年">3-5年</Option>
                  <Option value="5-10年">5-10年</Option>
                  <Option value="10年以上">10年以上</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="education_level" label="学历要求">
                <Select>
                  <Option value="不限">不限</Option>
                  <Option value="大专">大专及以上</Option>
                  <Option value="本科">本科及以上</Option>
                  <Option value="硕士">硕士及以上</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="岗位职责描述" rules={[{ required: true }]}>
            <Input.TextArea rows={6} placeholder="请详细描述岗位职责..." />
          </Form.Item>

          <Divider orientation="left">任职要求（逐条添加）</Divider>
          <Form.List name="requirements">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...rest} name={name} noStyle rules={[{ required: true, message: '必填' }]}>
                      <Input placeholder="要求内容" style={{ width: 'calc(100% - 60px)' }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} block onClick={() => add('')}>添加任职要求</Button>
              </>
            )}
          </Form.List>

          <Divider />

          <Form.Item name="skills" label="技能标签" rules={[{ required: true }]}>
            <Select mode="tags" style={{ width: '100%' }} placeholder="输入或选择技能标签">
              {skillOptions.map((s: any) => <Option key={s.id} value={s.name}>{s.name} ({s.category})</Option>)}
            </Select>
          </Form.Item>

          {isEdit && (
            <Form.Item name="status" label="岗位状态">
              <Select>
                <Option value="open">招聘中</Option>
                <Option value="closed">已关闭</Option>
                <Option value="draft">草稿</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>{isEdit ? '保存修改' : '发布岗位'}</Button>
              <Button onClick={() => navigate(-1)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}
