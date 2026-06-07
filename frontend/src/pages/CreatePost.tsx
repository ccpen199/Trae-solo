import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Typography, Row, Col, message, Upload, Image } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { postAPI, cityAPI } from '../api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CATEGORIES = [
  { value: 'news', label: '本地资讯' },
  { value: 'job', label: '招聘求职' },
  { value: 'rental', label: '房屋租售' },
  { value: 'secondhand', label: '二手交易' },
  { value: 'dating', label: '相亲交友' },
  { value: 'show', label: '秀场动态' },
];

interface CreatePostProps {
  currentCity: { id: number; name: string } | null;
}

const CreatePostPage: React.FC<CreatePostProps> = ({ currentCity }) => {
  const [form] = Form.useForm();
  const [category, setCategory] = useState<string>('');
  const [districts, setDistricts] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentCity) {
      loadDistricts();
    }
  }, [currentCity]);

  const loadDistricts = async () => {
    if (!currentCity) return;
    try {
      const res = await cityAPI.getDistricts(currentCity.id);
      setDistricts(res.data.districts);
    } catch (error) {
      console.error('加载区县失败', error);
    }
  };

  const loadStreets = async (districtId: number) => {
    if (!currentCity) return;
    try {
      const res = await cityAPI.getStreets(currentCity.id, districtId);
      setStreets(res.data.streets);
    } catch (error) {
      console.error('加载街道失败', error);
    }
  };

  const handleDistrictChange = (districtId: number) => {
    form.setFieldsValue({ street: undefined });
    setStreets([]);
    if (districtId) {
      loadStreets(districtId);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const data: any = {
        city_id: currentCity?.id,
        category: values.category,
        district: values.district,
        street: values.street,
        title: values.title,
        content: values.content,
        images,
      };

      if (values.category === 'rental') {
        data.rental = {
          orientation: values.orientation,
          floor: values.floor,
          subway_station: values.subway_station,
          price: values.price,
          area: values.area,
          rooms: values.rooms,
        };
      } else if (values.category === 'job') {
        data.job = {
          job_type: values.job_type,
          salary_min: values.salary_min,
          salary_max: values.salary_max,
          experience_required: values.experience_required,
          education_required: values.education_required,
          company_name: values.company_name,
        };
      } else if (values.category === 'dating') {
        data.dating = {
          gender: values.gender,
          age: values.age,
          height: values.height,
          education: values.education,
          occupation: values.occupation,
        };
      } else if (values.category === 'secondhand') {
        data.secondhand = {
          price: values.price_secondhand,
          condition: values.condition,
          category: values.category_secondhand,
        };
      }

      const res = await postAPI.createPost(data);
      if (!res.data.isApproved) {
        message.warning('内容包含敏感词，已提交审核');
      } else {
        message.success('发布成功');
      }
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.error || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  const renderExtraFields = () => {
    if (category === 'rental') {
      return (
        <>
          <Title level={5}>房屋信息</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="orientation" label="朝向" rules={[{ required: true }]}>
                <Select placeholder="选择朝向">
                  <Option value="东">东</Option>
                  <Option value="南">南</Option>
                  <Option value="西">西</Option>
                  <Option value="北">北</Option>
                  <Option value="南北">南北通透</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="floor" label="楼层" rules={[{ required: true }]}>
                <Input placeholder="如：中层/共18层" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="subway_station" label="地铁站">
                <Input placeholder="最近的地铁站" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="租金(元/月)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="area" label="面积(㎡)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="rooms" label="户型(室)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    }
    if (category === 'job') {
      return (
        <>
          <Title level={5}>职位信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="job_type" label="工种" rules={[{ required: true }]}>
                <Input placeholder="如：前端开发" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="company_name" label="公司名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salary_min" label="最低薪资(K)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salary_max" label="最高薪资(K)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="experience_required" label="经验要求" rules={[{ required: true }]}>
                <Select placeholder="选择经验要求">
                  <Option value="不限">不限</Option>
                  <Option value="应届">应届</Option>
                  <Option value="1-3年">1-3年</Option>
                  <Option value="3-5年">3-5年</Option>
                  <Option value="5-10年">5-10年</Option>
                  <Option value="10年以上">10年以上</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="education_required" label="学历要求" rules={[{ required: true }]}>
                <Select placeholder="选择学历要求">
                  <Option value="不限">不限</Option>
                  <Option value="高中">高中</Option>
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    }
    if (category === 'dating') {
      return (
        <>
          <Title level={5}>个人信息</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                <Select placeholder="选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="age" label="年龄" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="height" label="身高(cm)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="education" label="学历" rules={[{ required: true }]}>
                <Input placeholder="如：本科" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="occupation" label="职业" rules={[{ required: true }]}>
                <Input placeholder="如：工程师" />
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    }
    if (category === 'secondhand') {
      return (
        <>
          <Title level={5}>物品信息</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="price_secondhand" label="价格(元)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="condition" label="成色" rules={[{ required: true }]}>
                <Select placeholder="选择成色">
                  <Option value="全新">全新</Option>
                  <Option value="99新">99新</Option>
                  <Option value="95新">95新</Option>
                  <Option value="9成新">9成新</Option>
                  <Option value="8成新">8成新</Option>
                  <Option value="7成新及以下">7成新及以下</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category_secondhand" label="分类" rules={[{ required: true }]}>
                <Select placeholder="选择分类">
                  <Option value="数码">数码</Option>
                  <Option value="家电">家电</Option>
                  <Option value="家具">家具</Option>
                  <Option value="服饰">服饰</Option>
                  <Option value="图书">图书</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    }
    return null;
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages([...images, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
      return false;
    },
  };

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 24 }}>发布内容</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ category: 'news' }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="category"
              label="内容分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select onChange={(v) => setCategory(v)}>
                {CATEGORIES.map((c) => (
                  <Option key={c.value} value={c.value}>{c.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="district" label="区县">
              <Select placeholder="选择区县" onChange={handleDistrictChange} allowClear>
                {districts.map((d) => (
                  <Option key={d.id} value={d.name}>{d.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="street" label="街道">
              <Select placeholder="选择街道" allowClear>
                {streets.map((s) => (
                  <Option key={s.id} value={s.name}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="请输入标题" maxLength={100} showCount />
        </Form.Item>

        <Form.Item
          name="content"
          label="内容"
          rules={[{ required: true, message: '请输入内容' }]}
        >
          <TextArea rows={8} placeholder="请输入内容详情" maxLength={5000} showCount />
        </Form.Item>

        <Form.Item label="图片">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <Image width={120} height={120} src={img} />
                <Button
                  type="text"
                  danger
                  size="small"
                  style={{ position: 'absolute', top: -5, right: -5 }}
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                >
                  ×
                </Button>
              </div>
            ))}
            {images.length < 9 && (
              <Upload {...uploadProps} showUploadList={false}>
                <Button icon={<PlusOutlined />} style={{ width: 120, height: 120 }}>
                  添加图片
                </Button>
              </Upload>
            )}
          </div>
        </Form.Item>

        {renderExtraFields()}

        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={loading}>
            发布
          </Button>
          <Button style={{ marginLeft: 16 }} onClick={() => navigate('/')}>取消</Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CreatePostPage;
