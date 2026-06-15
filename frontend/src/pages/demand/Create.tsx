import React, { useState } from 'react';
import { Form, Input, Select, InputNumber, Button, Card, Typography, Row, Col, App, Space, Alert } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface FormValues {
  city: string;
  district: string;
  address: string;
  house_type: string;
  area: number;
  budget_min: number;
  budget_max: number;
  decoration_style: string;
  requirement_desc: string;
  contact_name: string;
  contact_phone: string;
}

const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆', '苏州', '天津'];
const districts: Record<string, string[]> = {
  北京: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区', '通州区', '顺义区', '昌平区', '大兴区'],
  上海: ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '浦东新区', '闵行区', '宝山区'],
  广州: ['越秀区', '荔湾区', '海珠区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '增城区'],
  深圳: ['福田区', '罗湖区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区', '坪山区', '光明区'],
  杭州: ['上城区', '下城区', '江干区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '临安区', '富阳区'],
  南京: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区', '六合区', '溧水区'],
  成都: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '青白江区', '新都区', '温江区', '双流区'],
  武汉: ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '青山区', '洪山区', '东西湖区', '蔡甸区', '江夏区'],
  西安: ['新城区', '碑林区', '莲湖区', '灞桥区', '未央区', '雁塔区', '阎良区', '临潼区', '长安区', '鄠邑区'],
  重庆: ['渝中区', '大渡口区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '渝北区', '巴南区', '万州区'],
  苏州: ['虎丘区', '吴中区', '相城区', '姑苏区', '吴江区', '昆山市', '常熟市', '张家港市', '太仓市'],
  天津: ['和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', '东丽区', '西青区', '津南区', '北辰区'],
};

const houseTypes = [
  '一室一厅', '两室一厅', '两室两厅', '三室一厅', '三室两厅',
  '四室一厅', '四室两厅', '五室及以上', '复式', '别墅', '其他'
];

const decorationStyles = [
  '现代简约', '北欧风格', '新中式', '轻奢', '美式乡村',
  '日式禅意', '欧式古典', '地中海', '工业风', '混搭风格', '其他'
];

const budgetRanges = [
  { min: 5, max: 10, label: '5-10万' },
  { min: 10, max: 20, label: '10-20万' },
  { min: 20, max: 30, label: '20-30万' },
  { min: 30, max: 50, label: '30-50万' },
  { min: 50, max: 80, label: '50-80万' },
  { min: 80, max: 100, label: '80-100万' },
  { min: 100, max: 200, label: '100万以上' },
];

const DemandCreate: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        budget_min: values.budget_min * 10000,
        budget_max: values.budget_max * 10000,
      };
      const response = await apiClient.post('/demands', payload);
      message.success('需求发布成功！');
      navigate(`/demands/${response.data.id}`);
    } catch (error: any) {
      message.error(error.response?.data?.error || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    form.setFieldValue('district', undefined);
  };

  const handleBudgetRangeSelect = (min: number, max: number) => {
    form.setFieldsValue({ budget_min: min, budget_max: max });
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/demands')}
            >
              返回
            </Button>
            <Title level={4} style={{ margin: 0 }}>发布装修需求</Title>
          </Space>
        }
      >
        <Alert
          message="填写须知"
          description="请您如实填写以下信息，我们将根据《住宅装饰装修工程施工规范》(GB 50327-2001) 为您匹配合适的设计师和施工团队。所有信息将严格保密。"
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            area: 90,
            budget_min: 10,
            budget_max: 20,
          }}
        >
          <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
            房屋基本信息
          </Title>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="city"
                label="城市"
                rules={[{ required: true, message: '请选择城市' }]}
              >
                <Select
                  placeholder="请选择城市"
                  onChange={handleCityChange}
                  showSearch
                  optionFilterProp="children"
                >
                  {cities.map((city) => (
                    <Option key={city} value={city}>{city}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="district"
                label="区域"
                rules={[{ required: true, message: '请选择区域' }]}
              >
                <Select
                  placeholder="请先选择城市"
                  disabled={!selectedCity}
                  showSearch
                  optionFilterProp="children"
                >
                  {(districts[selectedCity] || []).map((district) => (
                    <Option key={district} value={district}>{district}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Form.Item
                name="address"
                label="详细地址"
                rules={[
                  { required: true, message: '请输入详细地址' },
                  { min: 5, message: '地址至少5个字符' },
                ]}
              >
                <Input placeholder="例如：朝阳区建国路88号SOHO现代城A座1201" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="house_type"
                label="户型"
                rules={[{ required: true, message: '请选择户型' }]}
              >
                <Select placeholder="请选择户型">
                  {houseTypes.map((type) => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="area"
                label="建筑面积(㎡)"
                rules={[
                  { required: true, message: '请输入建筑面积' },
                  { type: 'number', min: 1, message: '面积必须大于0' },
                ]}
              >
                <InputNumber
                  min={1}
                  max={1000}
                  style={{ width: '100%' }}
                  placeholder="请输入建筑面积"
                  addonAfter="㎡"
                />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 16, marginBottom: 16 }}>
            预算与风格
          </Title>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="budget_min"
                label="最低预算(万元)"
                rules={[
                  { required: true, message: '请输入最低预算' },
                  { type: 'number', min: 0, message: '预算不能为负' },
                ]}
              >
                <InputNumber
                  min={0}
                  max={1000}
                  step={1}
                  style={{ width: '100%' }}
                  placeholder="请输入最低预算"
                  addonAfter="万元"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="budget_max"
                label="最高预算(万元)"
                rules={[
                  { required: true, message: '请输入最高预算' },
                  { type: 'number', min: 0, message: '预算不能为负' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('budget_min') <= value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('最高预算不能低于最低预算'));
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  max={1000}
                  step={1}
                  style={{ width: '100%' }}
                  placeholder="请输入最高预算"
                  addonAfter="万元"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">快捷选择：</Text>
              </div>
              <Space wrap>
                {budgetRanges.map((range) => (
                  <Button
                    key={range.label}
                    size="small"
                    onClick={() => handleBudgetRangeSelect(range.min, range.max)}
                  >
                    {range.label}
                  </Button>
                ))}
              </Space>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="decoration_style"
                label="装修风格"
                rules={[{ required: true, message: '请选择装修风格' }]}
              >
                <Select placeholder="请选择装修风格">
                  {decorationStyles.map((style) => (
                    <Option key={style} value={style}>{style}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="requirement_desc"
                label="需求描述"
                rules={[
                  { max: 2000, message: '描述不能超过2000字' },
                ]}
              >
                <TextArea
                  rows={6}
                  placeholder="请详细描述您的装修需求，包括功能需求、特殊要求、喜好的颜色、材料偏好等。例如：需要两个儿童房，主卧希望有独立衣帽间，偏好环保材料等。"
                  showCount
                  maxLength={2000}
                />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 16, marginBottom: 16 }}>
            联系方式
          </Title>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="contact_name"
                label="联系人"
                rules={[
                  { required: true, message: '请输入联系人姓名' },
                  { min: 2, message: '姓名至少2个字符' },
                ]}
              >
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="contact_phone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
                ]}
              >
                <Input placeholder="请输入11位手机号码" maxLength={11} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 32 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
              >
                发布需求
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/demands')}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DemandCreate;
