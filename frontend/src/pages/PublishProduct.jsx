import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form, Input, InputNumber, Select, Button, Card, Upload, message, Row, Col, Space
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AppLayout from '../components/Layout';
import { productApi, categoryApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

const PublishProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [fileList, setFileList] = useState([]);
  const isEdit = !!id;

  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id, isAuthenticated]);

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getList();
      setCategories(data);
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await productApi.getById(id);
      form.setFieldsValue({
        category_id: data.category_id,
        title: data.title,
        description: data.description,
        price: data.price,
        original_price: data.original_price,
        condition: data.condition,
        contact_info: data.contact_info,
        location: data.location
      });
      
      if (data.images && data.images.length > 0) {
        const initialFileList = data.images.map((url, index) => ({
          uid: `-${index}`,
          name: `image-${index}.jpg`,
          status: 'done',
          url: url
        }));
        setFileList(initialFileList);
      }
    } catch (error) {
      console.error('获取商品详情失败:', error);
      message.error('商品不存在');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          formData.append(key, values[key]);
        }
      });

      const newImages = fileList.filter(file => file.originFileObj);
      newImages.forEach(file => {
        formData.append('images', file.originFileObj);
      });

      const existingImages = fileList
        .filter(file => !file.originFileObj && file.url)
        .map(file => file.url);
      
      if (existingImages.length > 0) {
        formData.append('images', JSON.stringify(existingImages));
      }

      if (isEdit) {
        await productApi.update(id, formData);
        message.success('商品更新成功');
      } else {
        await productApi.create(formData);
        message.success('商品发布成功');
      }
      
      navigate('/my-products');
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片大小不能超过 5MB');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    multiple: true,
    listType: 'picture-card',
    maxCount: 9
  };

  return (
    <AppLayout showSidebar>
      <Card 
        title={
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
            />
            {isEdit ? '编辑商品' : '发布商品'}
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            condition: 'good'
          }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item
                name="category_id"
                label="商品分类"
                rules={[{ required: true, message: '请选择商品分类' }]}
              >
                <Select placeholder="请选择分类" size="large">
                  {categories.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="title"
                label="商品标题"
                rules={[
                  { required: true, message: '请输入商品标题' },
                  { min: 5, message: '标题至少5个字符' },
                  { max: 100, message: '标题最多100个字符' }
                ]}
              >
                <Input placeholder="请输入商品标题（5-100个字）" size="large" />
              </Form.Item>

              <Form.Item
                name="description"
                label="商品描述"
                rules={[
                  { required: true, message: '请输入商品描述' },
                  { min: 10, message: '描述至少10个字符' }
                ]}
              >
                <TextArea 
                  rows={6} 
                  placeholder="详细描述商品的情况，如使用时间、是否有瑕疵等..."
                  showCount
                  maxLength={2000}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="商品图片"
                required
                help="最多上传9张图片，支持拖拽排序"
              >
                <Upload {...uploadProps}>
                  {fileList.length >= 9 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传图片</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item
                name="price"
                label="售价 (元)"
                rules={[
                  { required: true, message: '请输入售价' },
                  { type: 'number', min: 0, message: '售价必须大于等于0' }
                ]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="请输入售价"
                  style={{ width: '100%' }}
                  size="large"
                  prefix="¥"
                />
              </Form.Item>

              <Form.Item
                name="original_price"
                label="原价 (元)（可选）"
                rules={[
                  { type: 'number', min: 0, message: '原价必须大于等于0' }
                ]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="购买时的原价"
                  style={{ width: '100%' }}
                  size="large"
                  prefix="¥"
                />
              </Form.Item>

              <Form.Item
                name="condition"
                label="新旧程度"
                rules={[{ required: true, message: '请选择新旧程度' }]}
              >
                <Select placeholder="请选择" size="large">
                  <Option value="new">全新</Option>
                  <Option value="like_new">几乎全新</Option>
                  <Option value="good">良好</Option>
                  <Option value="fair">一般</Option>
                  <Option value="poor">较旧</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="contact_info"
                label="联系方式"
              >
                <Input placeholder="手机号/微信号等" size="large" />
              </Form.Item>

              <Form.Item
                name="location"
                label="交易地点"
              >
                <Input placeholder="如：宿舍楼下、图书馆等" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, textAlign: 'center' }}>
            <Space size="large">
              <Button size="large" onClick={() => navigate('/my-products')}>
                取消
              </Button>
              <Button type="primary" size="large" htmlType="submit" loading={loading}>
                {isEdit ? '保存修改' : '立即发布'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </AppLayout>
  );
};

export default PublishProduct;
