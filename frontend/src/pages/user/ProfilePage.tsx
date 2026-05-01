import React from 'react';
import { Form, Input, Select, Button, Card, message, Row, Col, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Category } from '../../types';

const { TextArea } = Input;

const CreatePostPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/posts/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const handleSubmit = async (values: { title: string; content: string; categoryId: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/posts', values);
      
      if (response.data.success) {
        message.success('帖子发布成功');
        navigate(`/posts/${response.data.data.id}`);
      } else {
        message.error(response.data.error || '发布失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '发布失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page">
      <Row justify="center">
        <Col xs={24} md={20} lg={16} xl={12}>
          <Card title="发布新帖子" className="create-post-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="categoryId"
                label="选择分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类" size="large">
                  {categories.map(cat => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="title"
                label="标题"
                rules={[
                  { required: true, message: '请输入标题' },
                  { min: 1, max: 200, message: '标题长度应在 1-200 个字符之间' }
                ]}
              >
                <Input placeholder="请输入帖子标题" size="large" />
              </Form.Item>

              <Form.Item
                name="content"
                label="内容"
                rules={[
                  { required: true, message: '请输入内容' },
                  { min: 1, max: 50000, message: '内容长度应在 1-50000 个字符之间' }
                ]}
              >
                <TextArea
                  placeholder="请输入帖子内容..."
                  rows={15}
                  showCount
                  maxLength={50000}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading} size="large">
                    发布帖子
                  </Button>
                  <Button size="large" onClick={() => navigate(-1)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreatePostPage;
