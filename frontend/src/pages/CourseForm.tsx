import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, Select, Space, Typography, App, Row, Col, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const { Title } = Typography;
const { Option } = Select;

export default function CourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      api.get(`/lms/courses/${id}`).then((d: any) => form.setFieldsValue({ ...d.course, lessons: d.lessons }));
    }
  }, [id, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/lms/courses/${id}`, values);
        message.success('课程已更新');
      } else {
        await api.post('/lms/courses', values);
        message.success('课程已创建');
      }
      navigate('/courses');
    } catch (e: any) {
      message.error(e.error || '保存失败');
    } finally { setLoading(false); }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? '编辑课程' : '发布新课程'}</Title>
      </Space>

      <Card>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item name="title" label="课程标题" rules={[{ required: true }]}>
                <Input placeholder="如：React 高级开发实战" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="category" label="课程分类">
                <Select>
                  <Option value="技术">技术开发</Option><Option value="管理">管理技能</Option>
                  <Option value="职场">职场通用</Option><Option value="行业">行业知识</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="duration" label="预计总时长(分钟)" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="cover" label="课程封面图URL">
                <Input placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="课程介绍" rules={[{ required: true }]}>
            <Input.TextArea rows={6} placeholder="详细介绍课程内容、学习目标等" />
          </Form.Item>

          <Divider orientation="left">课时列表</Divider>
          <Form.List name="lessons">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" style={{ marginBottom: 12 }} title={`课时 ${name + 1}`} extra={<MinusCircleOutlined onClick={() => remove(name)} />}>
                    <Row gutter={12}>
                      <Col xs={24} md={16}>
                        <Form.Item {...rest} name={[name, 'title']} label="课时标题" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item {...rest} name={[name, 'duration']} label="时长(分钟)" initialValue={0}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item {...rest} name={[name, 'content']} label="课时内容">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'video_url']} label="视频链接">
                      <Input placeholder="可选" />
                    </Form.Item>
                  </Card>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} block onClick={() => add({})}>添加课时</Button>
              </>
            )}
          </Form.List>

          {isEdit && (
            <Form.Item name="status" label="课程状态" style={{ marginTop: 24 }}>
              <Select>
                <Option value="draft">草稿</Option>
                <Option value="published">发布</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>{isEdit ? '保存修改' : '发布课程'}</Button>
              <Button onClick={() => navigate(-1)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}
