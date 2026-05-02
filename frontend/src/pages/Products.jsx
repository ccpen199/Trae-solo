import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Tag, Typography, Modal, Form, Input, 
  Select, InputNumber, message, Descriptions, Space, Divider, Popconfirm,
  Steps, DatePicker, Row, Col
} from 'antd';
import { 
  PlusOutlined, EditOutlined, CheckCircleOutlined, 
  EyeOutlined, FileTextOutlined, PlusCircleOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { productApi, policyApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const statusColors = {
  draft: 'default',
  pending_approval: 'orange',
  approved: 'green',
  rejected: 'red'
};

const statusNames = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已上架',
  rejected: '已驳回'
};

const categoryNames = {
  life: '寿险',
  health: '健康险',
  accident: '意外险',
  property: '财产险'
};

const Products = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [purchaseForm] = Form.useForm();

  const [purchaseStep, setPurchaseStep] = useState(0);
  const [premiumResult, setPremiumResult] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productApi.getAll();
      setProducts(response.data.products || []);
    } catch (error) {
      message.error('获取产品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      await productApi.create(values);
      message.success('产品创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      message.error(error.response?.data?.error || '创建产品失败');
    }
  };

  const handleSubmitForApproval = async (productId) => {
    try {
      await productApi.submit(productId);
      message.success('产品已提交审批');
      fetchProducts();
    } catch (error) {
      message.error('提交审批失败');
    }
  };

  const handleApprove = async (productId) => {
    try {
      await productApi.approve(productId);
      message.success('产品已上架');
      fetchProducts();
    } catch (error) {
      message.error('上架失败');
    }
  };

  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const handleStartPurchase = (product) => {
    setSelectedProduct(product);
    setPurchaseStep(0);
    setPremiumResult(null);
    purchaseForm.resetFields();
    setPurchaseModalVisible(true);
  };

  const handleCalculatePremium = async () => {
    try {
      const values = await purchaseForm.validateFields(['sum_assured', 'term_months', 'age', 'health', 'occupation', 'lifestyle']);
      
      const response = await productApi.calculatePremium({
        productId: selectedProduct.id,
        sumAssured: values.sum_assured,
        riskFactors: {
          age: values.age,
          health: values.health,
          occupation: values.occupation,
          lifestyle: values.lifestyle
        },
        termMonths: values.term_months
      });
      
      setPremiumResult(response.data.premium);
      setPurchaseStep(1);
    } catch (error) {
      message.error('计算保费失败');
    }
  };

  const handleConfirmPurchase = async () => {
    try {
      const values = purchaseForm.getFieldsValue();
      
      const startDate = values.start_date || dayjs();
      const endDate = startDate.add(values.term_months, 'month');
      
      const healthDeclaration = {
        age: values.age,
        health: values.health,
        occupation: values.occupation,
        lifestyle: values.lifestyle,
        smoker: values.lifestyle === 'smoker_non_drinker' || values.lifestyle === 'smoker_drinker',
        height: values.height,
        weight: values.weight,
        pastDiseases: values.past_diseases?.split(',').map(d => d.trim()) || [],
        chronicDiseases: values.chronic_diseases?.split(',').map(d => d.trim()) || []
      };
      
      await policyApi.create({
        product_id: selectedProduct.id,
        premium_amount: premiumResult.totalPremium,
        sum_assured: values.sum_assured,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        health_declaration: healthDeclaration
      });
      
      message.success('投保申请已创建，请在保单列表中提交核保');
      setPurchaseModalVisible(false);
    } catch (error) {
      message.error('创建投保申请失败');
    }
  };

  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: '产品代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => categoryNames[category] || category
    },
    {
      title: '基础保费',
      dataIndex: 'base_premium',
      key: 'base_premium',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusNames[status] || status}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const actions = [];
        
        actions.push(
          <Button key="view" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
        );
        
        if (user.role === 'policyholder') {
          if (record.status === 'approved') {
            actions.push(
              <Button key="purchase" type="primary" icon={<PlusCircleOutlined />} onClick={() => handleStartPurchase(record)}>
                投保
              </Button>
            );
          }
        }
        
        if (user.role === 'agent' || user.role === 'admin') {
          if (record.status === 'draft') {
            actions.push(
              <Button key="edit" type="link" icon={<EditOutlined />}>
                编辑
              </Button>
            );
            actions.push(
              <Popconfirm
                key="submit"
                title="确认提交审批？"
                onConfirm={() => handleSubmitForApproval(record.id)}
              >
                <Button type="link" icon={<PlusOutlined />}>提交</Button>
              </Popconfirm>
            );
          }
        }
        
        if ((user.role === 'underwriter' || user.role === 'admin') && record.status === 'pending_approval') {
          actions.push(
            <Popconfirm
              key="approve"
              title="确认上架？"
              onConfirm={() => handleApprove(record.id)}
            >
              <Button type="primary" icon={<CheckCircleOutlined />}>上架</Button>
            </Popconfirm>
          );
        }
        
        return <Space>{actions}</Space>;
      }
    }
  ];

  return (
    <div>
      <Card 
        bordered={false}
        title={
          <Title level={4}>
            {user.role === 'policyholder' ? '选购险种' : user.role === 'underwriter' ? '险种审批' : '险种管理'}
          </Title>
        }
        extra={
          (user.role === 'agent' || user.role === 'admin') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              新建险种
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="新建险种"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label="产品名称"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input placeholder="请输入产品名称" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="产品代码"
                rules={[{ required: true, message: '请输入产品代码' }]}
              >
                <Input placeholder="例如：LIFE-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="产品分类"
                rules={[{ required: true, message: '请选择产品分类' }]}
              >
                <Select placeholder="请选择产品分类">
                  <Option value="life">寿险</Option>
                  <Option value="health">健康险</Option>
                  <Option value="accident">意外险</Option>
                  <Option value="property">财产险</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="产品描述"
          >
            <TextArea rows={3} placeholder="请输入产品描述" />
          </Form.Item>
          
          <Form.Item
            name="base_premium"
            label="基础保费"
            rules={[{ required: true, message: '请输入基础保费' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入基础保费" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="产品详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedProduct && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="产品名称" span={2}>
              {selectedProduct.name}
            </Descriptions.Item>
            <Descriptions.Item label="产品代码">
              {selectedProduct.code}
            </Descriptions.Item>
            <Descriptions.Item label="产品分类">
              {categoryNames[selectedProduct.category] || selectedProduct.category}
            </Descriptions.Item>
            <Descriptions.Item label="基础保费">
              ¥{selectedProduct.base_premium?.toLocaleString() || 0}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColors[selectedProduct.status] || 'default'}>
                {statusNames[selectedProduct.status] || selectedProduct.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="产品描述" span={2}>
              {selectedProduct.description || '暂无描述'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="投保流程"
        open={purchaseModalVisible}
        onCancel={() => setPurchaseModalVisible(false)}
        footer={null}
        width={700}
      >
        <Steps current={purchaseStep} style={{ marginBottom: 24 }}>
          <Step title="填写信息" />
          <Step title="确认保费" />
          <Step title="完成投保" />
        </Steps>

        {purchaseStep === 0 && (
          <Form
            form={purchaseForm}
            layout="vertical"
            initialValues={{
              term_months: 12,
              age: 30,
              health: 'good',
              occupation: 'office',
              lifestyle: 'non_smoker_non_drinker'
            }}
          >
            <Card size="small" title="产品信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="产品名称">{selectedProduct?.name}</Descriptions.Item>
                <Descriptions.Item label="产品代码">{selectedProduct?.code}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="sum_assured"
                  label="保额（元）"
                  rules={[{ required: true, message: '请输入保额' }]}
                >
                  <InputNumber min={10000} style={{ width: '100%' }} placeholder="请输入保额" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="term_months"
                  label="保障期限（月）"
                  rules={[{ required: true, message: '请选择保障期限' }]}
                >
                  <Select>
                    <Option value={12}>1年（12个月）</Option>
                    <Option value={60}>5年（60个月）</Option>
                    <Option value={120}>10年（120个月）</Option>
                    <Option value={240}>20年（240个月）</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider>健康告知</Divider>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="age"
                  label="年龄"
                  rules={[{ required: true, message: '请输入年龄' }]}
                >
                  <InputNumber min={18} max={70} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="health"
                  label="健康状况"
                  rules={[{ required: true, message: '请选择' }]}
                >
                  <Select>
                    <Option value="excellent">优秀</Option>
                    <Option value="good">良好</Option>
                    <Option value="fair">一般</Option>
                    <Option value="poor">较差</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="occupation"
                  label="职业类型"
                  rules={[{ required: true, message: '请选择' }]}
                >
                  <Select>
                    <Option value="office">办公室职员</Option>
                    <Option value="professional">专业人士</Option>
                    <Option value="service">服务业</Option>
                    <Option value="manual">体力劳动</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="lifestyle"
                  label="生活习惯"
                  rules={[{ required: true, message: '请选择' }]}
                >
                  <Select>
                    <Option value="non_smoker_non_drinker">不吸烟不饮酒</Option>
                    <Option value="non_smoker_occasional_drinker">不吸烟偶尔饮酒</Option>
                    <Option value="smoker_non_drinker">吸烟不饮酒</Option>
                    <Option value="smoker_drinker">吸烟饮酒</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="start_date"
                  label="生效日期"
                  rules={[{ required: true, message: '请选择' }]}
                >
                  <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().startOf('day')} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="height" label="身高(cm)">
                  <InputNumber min={100} max={250} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="weight" label="体重(kg)">
                  <InputNumber min={30} max={200} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" onClick={handleCalculatePremium}>
                计算保费并下一步
              </Button>
            </Form.Item>
          </Form>
        )}

        {purchaseStep === 1 && premiumResult && (
          <div>
            <Card title="保费计算结果" bordered={false}>
              <Descriptions column={2}>
                <Descriptions.Item label="风险评分">
                  <Tag color={premiumResult.riskLevel === 'low' ? 'green' : premiumResult.riskLevel === 'medium' ? 'orange' : 'red'}>
                    {premiumResult.riskScore} 分 ({premiumResult.riskLevel === 'low' ? '低风险' : premiumResult.riskLevel === 'medium' ? '中等风险' : '高风险'})
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="年交保费">
                  <Text strong style={{ fontSize: 24, color: '#1890ff' }}>
                    ¥{premiumResult.annualPremium?.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="月交保费">
                  ¥{premiumResult.monthlyPremium?.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="总保费">
                  ¥{premiumResult.totalPremium?.toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setPurchaseStep(0)}>上一步</Button>
                <Button type="primary" onClick={handleConfirmPurchase}>
                  确认投保
                </Button>
              </Space>
            </div>
          </div>
        )}

        {purchaseStep === 2 && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            <Title level={4} style={{ marginTop: 16 }}>投保申请已创建</Title>
            <Text type="secondary">请在"我的保单"中查看并提交核保</Text>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" onClick={() => setPurchaseModalVisible(false)}>
                完成
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;
