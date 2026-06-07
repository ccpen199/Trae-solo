import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  message,
  Breadcrumb,
  Radio,
  Tag,
  Row,
  Col,
  Alert,
} from 'antd';
import { HomeOutlined, ArrowLeftOutlined, EnvironmentOutlined, ClockCircleOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons';
import { demandAPI, gridAPI } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { Group: RadioGroup } = Radio;

const DemandPublish = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [grids, setGrids] = useState<any[]>([]);

  useEffect(() => {
    loadGrids();
  }, []);

  const loadGrids = async () => {
    try {
      const res = await gridAPI.getList();
      setGrids(res.data || []);
    } catch (error) {
      console.error('加载网格失败:', error);
    }
  };

  const demandTypes = ['代取快递', '照看老人', '家政清洁', '家电维修', '拼车出行', '二手转让', '其他'];
  
  const scenes = [
    { value: 'neighbor', label: '邻里互助', desc: '同小区邻居互帮互助' },
    { value: 'recommend', label: '熟人推荐', desc: '朋友、同事推荐的服务商' },
    { value: 'notice', label: '社区公告', desc: '响应社区官方公告需求' },
    { value: 'urgent', label: '紧急求助', desc: '紧急情况需要立即帮助' },
  ];

  const recommendChains = [
    { value: 'same_community', label: '同小区', icon: '🏘️' },
    { value: 'same_work', label: '同单位', icon: '🏢' },
    { value: 'same_school', label: '同学校', icon: '🏫' },
    { value: 'friend', label: '朋友介绍', icon: '🤝' },
    { value: 'none', label: '无推荐链', icon: '📋' },
  ];

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await demandAPI.create({
        ...values,
        serviceTime: values.serviceTime,
        publisherId: 1,
      });
      message.success('需求发布成功！已绑定您的社区网格，附近邻居可接单');
      navigate('/demands');
    } catch (error) {
      message.error('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeInUp">
      <Breadcrumb className="mb-6">
        <Breadcrumb.Item onClick={() => navigate('/')} className="cursor-pointer">
          <HomeOutlined /> 首页
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/demands')} className="cursor-pointer">
          邻里互助
        </Breadcrumb.Item>
        <Breadcrumb.Item>发布需求</Breadcrumb.Item>
      </Breadcrumb>

      <Alert
        message="LBS强绑定已启用"
        description="发布需求将自动绑定您的注册社区网格，仅网格内服务商可见，保障服务精准对接"
        type="success"
        showIcon
        className="mb-6"
        icon={<EnvironmentOutlined />}
      />

      <Card 
        title="发布互助需求" 
        className="shadow-lg"
        extra={
          <Button type="link" onClick={() => navigate('/demands')}>
            <ArrowLeftOutlined /> 返回列表
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ 
            reward: 20,
            scene: 'neighbor',
            recommendChain: 'same_community'
          }}
        >
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="type"
                label="需求类型"
                rules={[{ required: true, message: '请选择需求类型' }]}
              >
                <Select placeholder="请选择需求类型">
                  {demandTypes.map((type) => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                name="gridCode"
                label={
                  <span>
                    <EnvironmentOutlined className="mr-1 text-green-500" />
                    服务网格（必填）
                  </span>
                }
                rules={[{ required: true, message: '请选择服务网格，仅该网格内服务商可见' }]}
              >
                <Select placeholder="请选择您所在的社区网格" showSearch>
                  {grids.map((grid) => (
                    <Option key={grid.code} value={grid.code}>
                      <Tag color="blue" className="mr-2">LBS绑定</Tag>
                      {grid.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="title"
            label="需求标题"
            rules={[{ required: true, message: '请输入需求标题' }]}
          >
            <Input placeholder="简要描述您的需求，例如：代取快递到3号楼" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述您的需求，包括具体要求、注意事项等"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="address"
                label={
                  <span>
                    <HomeOutlined className="mr-1 text-orange-500" />
                    上门地址
                  </span>
                }
                rules={[{ required: true, message: '请输入上门地址' }]}
              >
                <Input placeholder="请输入详细地址，如：XX小区X号楼X单元XXX室" />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                name="serviceTime"
                label={
                  <span>
                    <ClockCircleOutlined className="mr-1 text-blue-500" />
                    服务时段
                  </span>
                }
                rules={[{ required: true, message: '请选择服务时段' }]}
              >
                <Select placeholder="请选择期望的服务时间">
                  <Option value="今天上午">今天上午（08:00-12:00）</Option>
                  <Option value="今天下午">今天下午（12:00-18:00）</Option>
                  <Option value="今天晚上">今天晚上（18:00-22:00）</Option>
                  <Option value="明天上午">明天上午</Option>
                  <Option value="明天下午">明天下午</Option>
                  <Option value="周末全天">周末全天</Option>
                  <Option value="下班后">下班后（18:00后）</Option>
                  <Option value="时间不限">时间不限</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="reward"
                label="酬金（元）"
                rules={[{ required: true, message: '请输入酬金' }]}
              >
                <InputNumber
                  min={0}
                  max={10000}
                  style={{ width: '100%' }}
                  placeholder="请输入酬金金额"
                  prefix="¥"
                  addonAfter="元"
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                name="scene"
                label={
                  <span>
                    <TeamOutlined className="mr-1 text-purple-500" />
                    互助场景
                  </span>
                }
                rules={[{ required: true, message: '请选择互助场景' }]}
              >
                <RadioGroup>
                  {scenes.map((scene) => (
                    <Radio key={scene.value} value={scene.value}>
                      <span className="font-medium">{scene.label}</span>
                      <span className="text-gray-400 text-xs ml-1">({scene.desc})</span>
                    </Radio>
                  ))}
                </RadioGroup>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="recommendChain"
            label={
              <span>
                <SafetyOutlined className="mr-1 text-green-500" />
                熟人推荐关系链（提升信任度）
              </span>
            }
            rules={[{ required: true, message: '请选择推荐关系链' }]}
          >
            <Select placeholder="选择您的推荐关系链">
              {recommendChains.map((chain) => (
                <Option key={chain.value} value={chain.value}>
                  <span className="mr-2">{chain.icon}</span>
                  {chain.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-blue-700">
              <strong>💡 发布提示：</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-blue-600">
                <li>选择正确的服务网格可确保附近的服务商快速接单</li>
                <li>填写详细地址和服务时段有助于精准匹配</li>
                <li>熟人推荐关系链可提高接单成功率和服务可信度</li>
              </ul>
            </div>
          </div>

          <Form.Item>
            <div className="flex gap-4 justify-end">
              <Button onClick={() => navigate('/demands')} size="large">
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                发布需求
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DemandPublish;
