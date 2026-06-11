import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  List,
  Empty,
  Spin,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Progress,
  Divider,
  Popconfirm,
  Statistic
} from 'antd';
import {
  DollarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PieChartOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  ListOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { coupleAPI } from '../../api/index.js';

const { Title, Text } = Typography;
const { Option } = Select;

const CATEGORY_COLORS = {
  venue: { name: '婚宴酒店', color: '#ff4d6d' },
  photography: { name: '婚纱摄影', color: '#722ed1' },
  dress: { name: '婚纱礼服', color: '#eb2f96' },
  jewelry: { name: '珠宝首饰', color: '#faad14' },
  wedding: { name: '婚庆策划', color: '#1890ff' },
  other: { name: '其他费用', color: '#13c2c2' }
};

const BudgetPlanner = () => {
  const [loading, setLoading] = useState(false);
  const [budgetData, setBudgetData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('list');

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const response = await coupleAPI.getBudget();
      setBudgetData(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        message.warning('请先设置婚礼预算信息');
      } else {
        message.error('获取预算信息失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, []);

  const handleSubmit = async (values) => {
    try {
      const itemData = {
        category: values.category,
        name: values.name,
        planned_amount: values.planned_amount,
        actual_amount: values.actual_amount || 0
      };

      if (editingItem) {
        await coupleAPI.updateBudgetItem(editingItem.id, itemData);
        message.success('更新成功');
      } else {
        await coupleAPI.createBudgetItem(itemData);
        message.success('创建成功');
      }

      setModalVisible(false);
      setEditingItem(null);
      form.resetFields();
      fetchBudget();
    } catch (error) {
      message.error(editingItem ? '更新失败' : '创建失败');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      category: item.category,
      name: item.name,
      planned_amount: item.planned_amount,
      actual_amount: item.actual_amount
    });
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleDelete = async (itemId) => {
    try {
      await coupleAPI.deleteBudgetItem(itemId);
      message.success('删除成功');
      fetchBudget();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleUpdateActual = async (item, actualAmount) => {
    try {
      await coupleAPI.updateBudgetItem(item.id, {
        actual_amount: actualAmount
      });
      message.success('更新成功');
      fetchBudget();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const getPieChartOption = () => {
    if (!budgetData?.items) return {};
    
    const data = budgetData.items.map(item => ({
      value: item.planned_amount,
      name: CATEGORY_COLORS[item.category]?.name || item.name,
      itemStyle: {
        color: CATEGORY_COLORS[item.category]?.color || '#13c2c2'
      }
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: {
          fontSize: 13
        }
      },
      series: [
        {
          name: '预算分布',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data
        }
      ]
    };
  };

  const getBarChartOption = () => {
    if (!budgetData?.items) return {};
    
    const categories = budgetData.items.map(item => 
      CATEGORY_COLORS[item.category]?.name || item.name
    );
    const plannedData = budgetData.items.map(item => item.planned_amount);
    const actualData = budgetData.items.map(item => item.actual_amount);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          let result = params[0].name + '<br/>';
          params.forEach(param => {
            result += `${param.marker}${param.seriesName}: ¥${param.value.toLocaleString()}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['计划预算', '实际支出'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          rotate: 30,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value) => `¥${(value / 10000).toFixed(0)}万`
        }
      },
      series: [
        {
          name: '计划预算',
          type: 'bar',
          barWidth: '35%',
          itemStyle: {
            color: '#ff9a9e',
            borderRadius: [4, 4, 0, 0]
          },
          data: plannedData
        },
        {
          name: '实际支出',
          type: 'bar',
          barWidth: '35%',
          itemStyle: {
            color: '#ff4d6d',
            borderRadius: [4, 4, 0, 0]
          },
          data: actualData
        }
      ]
    };
  };

  const getBudgetStatus = (item) => {
    const diff = item.planned_amount - item.actual_amount;
    const percentage = item.planned_amount > 0 
      ? Math.round((item.actual_amount / item.planned_amount) * 100)
      : 0;
    
    if (percentage >= 100) {
      return { status: 'over', color: '#ff4d4f', icon: <FallOutlined />, text: '已超支' };
    } else if (percentage >= 80) {
      return { status: 'warning', color: '#faad14', icon: <RiseOutlined />, text: '接近预算' };
    } else {
      return { status: 'normal', color: '#52c41a', icon: <CheckCircleOutlined />, text: '正常' };
    }
  };

  const getTotalPercentage = () => {
    if (!budgetData || budgetData.total_planned === 0) return 0;
    return Math.round((budgetData.total_actual / budgetData.total_planned) * 100);
  };

  const totalPercentage = getTotalPercentage();

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#ff4d6d' }}>
              预算智能管家
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              智能拆解预算，让每一分钱都花在刀刃上
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{
              height: 44,
              padding: '0 24px',
              fontSize: 15,
              background: '#ff4d6d',
              border: 'none',
              borderRadius: 22
            }}
          >
            添加预算项
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {budgetData ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  style={{ borderRadius: 16, height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  <Statistic
                    title={
                      <Space>
                        <DollarOutlined style={{ color: '#1890ff' }} />
                        <span>总预算</span>
                      </Space>
                    }
                    value={budgetData.total_budget || 0}
                    precision={0}
                    valueStyle={{ color: '#1890ff', fontSize: 28 }}
                    formatter={(value) => `¥${Number(value).toLocaleString()}`}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  style={{ borderRadius: 16, height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  <Statistic
                    title={
                      <Space>
                        <PieChartOutlined style={{ color: '#722ed1' }} />
                        <span>计划支出</span>
                      </Space>
                    }
                    value={budgetData.total_planned || 0}
                    precision={0}
                    valueStyle={{ color: '#722ed1', fontSize: 28 }}
                    formatter={(value) => `¥${Number(value).toLocaleString()}`}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  style={{ borderRadius: 16, height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  <Statistic
                    title={
                      <Space>
                        <RiseOutlined style={{ color: '#faad14' }} />
                        <span>已支出</span>
                      </Space>
                    }
                    value={budgetData.total_actual || 0}
                    precision={0}
                    valueStyle={{ color: '#faad14', fontSize: 28 }}
                    formatter={(value) => `¥${Number(value).toLocaleString()}`}
                    suffix={<span style={{ fontSize: 14, color: '#999' }}>({totalPercentage}%)</span>}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  style={{ borderRadius: 16, height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  <Statistic
                    title={
                      <Space>
                        {budgetData.remaining >= 0 ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <FallOutlined style={{ color: '#ff4d4f' }} />
                        )}
                        <span>剩余预算</span>
                      </Space>
                    }
                    value={Math.abs(budgetData.remaining || 0)}
                    precision={0}
                    valueStyle={{ 
                      color: budgetData.remaining >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 28 }}
                    formatter={(value) => `${budgetData.remaining >= 0 ? '¥' : '-¥'}${Number(value).toLocaleString()}`}
                  />
                </Card>
              </Col>
            </Row>

            <Card
              style={{ borderRadius: 16, marginBottom: 24 }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ marginBottom: 16 }}>
                <Space size={16} style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 16 }}>总体支出进度</Text>
                  <Tag color={totalPercentage >= 100 ? 'red' : totalPercentage >= 80 ? 'orange' : 'green'}>
                    {totalPercentage >= 100 ? '已超支' : totalPercentage >= 80 ? '接近预算' : '正常'}
                  </Tag>
                </Space>
              </div>
              <Progress
                percent={Math.min(totalPercentage, 100)}
                size="large"
                strokeColor={{
                  '0%': totalPercentage >= 100 ? '#ff7875' : totalPercentage >= 80 ? '#ffbb96' : '#95de64',
                  '100%': totalPercentage >= 100 ? '#ff4d4f' : totalPercentage >= 80 ? '#fa8c16' : '#52c41a'
                }}
                format={(percent) => (
                  <span style={{ fontSize: 18, fontWeight: 'bold' }}>
                    ¥{budgetData.total_actual?.toLocaleString()} / ¥{budgetData.total_planned?.toLocaleString()}
                  </span>
                )}
              />
              {totalPercentage > 100 && (
                <div style={{ marginTop: 12, padding: 12, background: '#fff1f0', borderRadius: 8 }}>
                  <Text type="danger">
                    <FallOutlined /> 已超支 ¥{Math.abs(budgetData.remaining)?.toLocaleString()}，请注意控制支出
                  </Text>
                </div>
              )}
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={10}>
                <Card
                  title={
                    <Space>
                      <PieChartOutlined style={{ color: '#ff4d6d' }} />
                      <span>预算分布</span>
                    </Space>
                  }
                  style={{ borderRadius: 16, height: '100%' }}
                >
                  <ReactECharts
                    option={getPieChartOption()}
                    style={{ height: 320 }}
                    notMerge={true}
                    lazyUpdate={true}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={14}>
                <Card
                  title={
                    <Space>
                      <BarChartOutlined style={{ color: '#ff4d6d' }} />
                      <span>支出对比</span>
                    </Space>
                  }
                  style={{ borderRadius: 16, height: '100%' }}
                >
                  <ReactECharts
                    option={getBarChartOption()}
                    style={{ height: 320 }}
                    notMerge={true}
                    lazyUpdate={true}
                  />
                </Card>
              </Col>
            </Row>

            <Card
              title={
                <Space>
                  <ListOutlined style={{ color: '#ff4d6d' }} />
                  <span>预算明细</span>
                </Space>
              }
              style={{ borderRadius: 16 }}
              bodyStyle={{ padding: 0 }}
            >
              {budgetData.items && budgetData.items.length > 0 ? (
                <List
                  dataSource={budgetData.items}
                  renderItem={(item) => {
                    const category = CATEGORY_COLORS[item.category] || { name: item.name, color: '#13c2c2' };
                    const budgetStatus = getBudgetStatus(item);
                    const percentage = item.planned_amount > 0
                      ? Math.round((item.actual_amount / item.planned_amount) * 100)
                      : 0;

                    return (
                      <List.Item
                        style={{
                          padding: '20px 24px',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                      >
                        <Space size={20} style={{ width: '100%', alignItems: 'flex-start' }}>
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 12,
                              background: `${category.color}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <DollarOutlined style={{ fontSize: 24, color: category.color }} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                              <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
                              <Tag color={category.color} style={{ margin: 0 }}>
                                {category.name}
                              </Tag>
                              <Tag
                                icon={budgetStatus.icon}
                                color={budgetStatus.color}
                                style={{ margin: 0 }}
                              >
                                {budgetStatus.text}
                              </Tag>
                            </div>

                            <Row gutter={[16, 8]} style={{ marginBottom: 12 }}>
                              <Col xs={12}>
                                <Text type="secondary" style={{ fontSize: 12 }}>计划预算</Text>
                                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
                                  ¥{item.planned_amount?.toLocaleString()}
                                </div>
                              </Col>
                              <Col xs={12}>
                                <Text type="secondary" style={{ fontSize: 12 }}>实际支出</Text>
                                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d6d' }}>
                                  ¥{item.actual_amount?.toLocaleString()}
                                </div>
                              </Col>
                            </Row>

                            <div style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  <Space>
                                    <ClockCircleOutlined />
                                    支出进度
                                  </Space>
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {percentage}%
                                </Text>
                              </div>
                              <Progress
                                percent={Math.min(percentage, 100)}
                                size="small"
                                showInfo={false}
                                strokeColor={budgetStatus.color}
                              />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text
                                type={item.planned_amount - item.actual_amount >= 0 ? 'success' : 'danger'}
                                style={{ fontSize: 13 }}
                              >
                                {item.planned_amount - item.actual_amount >= 0 ? '剩余' : '超支'}：
                                ¥{Math.abs(item.planned_amount - item.actual_amount)?.toLocaleString()}
                              </Text>
                              <Space size={8}>
                                <InputNumber
                                  size="small"
                                  min={0}
                                  value={item.actual_amount}
                                  placeholder="实际支出"
                                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                  onChange={(value) => handleUpdateActual(item, value || 0)}
                                  onPressEnter={(e) => handleUpdateActual(item, Number(e.target.value.replace(/[^\d]/g, '')))}
                                />
                              </Space>
                            </div>
                          </div>

                          <Space direction="vertical">
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(item)}
                              style={{ color: '#1890ff' }}
                            />
                            <Popconfirm
                              title="确定要删除这个预算项吗？"
                              onConfirm={() => handleDelete(item.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                danger
                              />
                            </Popconfirm>
                          </Space>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Empty description="暂无预算项" style={{ padding: '40px 0' }} />
              )}
            </Card>
          </>
        ) : (
          <Card style={{ borderRadius: 16 }}>
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Title level={4} style={{ color: '#999', marginBottom: 16 }}>
                请先设置您的婚礼预算
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                设置预算后系统会自动按类别智能拆解预算分配
              </Text>
            </div>
          </Card>
        )}
      </Spin>

      <Modal
        title={editingItem ? '编辑预算项' : '添加预算项'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="category"
            label="预算分类"
            rules={[{ required: true, message: '请选择预算分类' }]}
          >
            <Select placeholder="请选择分类">
              {Object.entries(CATEGORY_COLORS).map(([key, value]) => (
                <Option key={key} value={key}>{value.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Form.Item
            name="planned_amount"
            label="计划预算（元）"
            rules={[{ required: true, message: '请输入计划预算' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入计划预算"
              min={0}
              step={1000}
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="actual_amount"
            label="实际支出（元）"
            initialValue={0}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入实际支出（选填）"
              min={0}
              step={1000}
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: '#ff4d6d',
                  border: 'none'
                }}
              >
                {editingItem ? '保存修改' : '添加预算项'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BudgetPlanner;
