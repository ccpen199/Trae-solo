import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, message, Space, Tabs, Card, Row, Col, DatePicker, Tag } from 'antd';
import { PlusOutlined, ThunderboltOutlined, FileSearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

function PrepPlan({ storeId }) {
  const [plans, setPlans] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [inventoryChecks, setInventoryChecks] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkModalVisible, setCheckModalVisible] = useState(false);
  const [predictModalVisible, setPredictModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [form] = Form.useForm();
  const [checkForm] = Form.useForm();
  const [predictForm] = Form.useForm();

  useEffect(() => {
    loadPlans();
    loadMaterials();
    loadInventoryChecks();
  }, [storeId, dateRange]);

  const loadPlans = async () => {
    let url = `/prep?store_id=${storeId}`;
    if (dateRange && dateRange[0] && dateRange[1]) {
      url += `&start_date=${dateRange[0].format('YYYY-MM-DD')}&end_date=${dateRange[1].format('YYYY-MM-DD')}`;
    }
    const res = await api.get(url);
    if (res.success) {
      setPlans(res.data);
    }
  };

  const loadMaterials = async () => {
    const res = await api.get('/materials');
    if (res.success) {
      setMaterials(res.data);
    }
  };

  const loadInventoryChecks = async () => {
    const res = await api.get(`/prep/inventory-checks?store_id=${storeId}`);
    if (res.success) {
      setInventoryChecks(res.data);
    }
  };

  const handleGenerate = async () => {
    try {
      const values = await predictForm.validateFields();
      message.loading({ content: '正在生成预测...', key: 'generate' });
      const res = await api.post('/prep/generate', {
        store_id: storeId,
        plan_date: values.plan_date,
        weather: values.weather,
        activity: values.activity
      });
      if (res.success) {
        setPredictions(res.data);
        if (res.data.length === 0) {
          message.warning({ content: '没有足够的销售数据生成预测', key: 'generate' });
        } else {
          message.success({ content: `成功生成 ${res.data.length} 条预测`, key: 'generate' });
        }
      } else {
        message.error({ content: res.message || '生成预测失败', key: 'generate' });
      }
    } catch (error) {
      console.error('Generate error:', error);
      message.error({ content: '生成预测失败: ' + error.message, key: 'generate' });
    }
  };

  const handleSavePredictions = async () => {
    const values = predictForm.getFieldsValue();
    for (const pred of predictions) {
      await api.post('/prep', {
        store_id: storeId,
        plan_date: values.plan_date,
        material_id: pred.material_id,
        predicted_qty: pred.predicted_qty,
        actual_prep_qty: pred.predicted_qty,
        weather: values.weather,
        activity: values.activity
      });
    }
    message.success('备料计划已生成');
    setPredictModalVisible(false);
    loadPlans();
  };

  const handleAddPlan = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handlePlanOk = async () => {
    try {
      const values = await form.validateFields();
      const res = await api.post('/prep', {
        ...values,
        store_id: storeId
      });
      if (res.success) {
        message.success('备料计划已添加');
        setModalVisible(false);
        loadPlans();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddCheck = () => {
    checkForm.resetFields();
    setCheckModalVisible(true);
  };

  const handleCheckOk = async () => {
    try {
      const values = await checkForm.validateFields();
      const res = await api.post('/prep/inventory-checks', {
        ...values,
        store_id: storeId
      });
      if (res.success) {
        if (res.data.difference !== 0) {
          message.warning(`盘点差异已记录: ${res.data.difference}，已自动生成损耗记录`);
        } else {
          message.success('盘点记录已保存');
        }
        setCheckModalVisible(false);
        loadInventoryChecks();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const planColumns = [
    { title: '计划日期', dataIndex: 'plan_date', key: 'plan_date', width: 120,
      render: (v) => <Tag color="blue">{v}</Tag>
    },
    { title: '原料', dataIndex: 'material_name', key: 'material_name', width: 100 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    { title: '预测用量', dataIndex: 'predicted_qty', key: 'predicted_qty', width: 100,
      render: (v, r) => `${v} ${r.unit}`
    },
    { title: '实际备料', dataIndex: 'actual_prep_qty', key: 'actual_prep_qty', width: 100,
      render: (v, r) => `${v} ${r.unit}`
    },
    { title: '天气', dataIndex: 'weather', key: 'weather', width: 100,
      render: (v) => {
        const map = { normal: '正常', hot: '炎热', cold: '寒冷', rainy: '雨天' };
        return map[v] || v;
      }
    },
    { title: '活动', dataIndex: 'activity', key: 'activity', width: 120,
      render: (v) => {
        const map = { normal: '无', promotion: '促销活动', holiday: '节假日', weekend: '周末' };
        return map[v] || v;
      }
    },
    { title: '调整原因', dataIndex: 'adjust_reason', key: 'adjust_reason' }
  ];

  const checkColumns = [
    { title: '盘点日期', dataIndex: 'check_date', key: 'check_date', width: 120 },
    { title: '原料', dataIndex: 'material_name', key: 'material_name', width: 100 },
    { title: '系统库存', dataIndex: 'system_qty', key: 'system_qty', width: 100,
      render: (v, r) => `${v} ${r.unit}`
    },
    { title: '实际库存', dataIndex: 'actual_qty', key: 'actual_qty', width: 100,
      render: (v, r) => `${v} ${r.unit}`
    },
    { title: '差异', dataIndex: 'difference', key: 'difference', width: 100,
      render: (v, r) => {
        const color = v > 0 ? 'green' : v < 0 ? 'red' : 'default';
        return <span style={{ color }}>{v > 0 ? '+' : ''}{v} {r.unit}</span>;
      }
    },
    { title: '原因', dataIndex: 'reason', key: 'reason' }
  ];

  const uniqueDates = [...new Set(plans.map(p => p.plan_date))].sort().reverse();

  return (
    <div>
      <Tabs defaultActiveKey="plans">
        <TabPane tab="备料计划" key="plans">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>备料计划</h2>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder={['开始日期', '结束日期']}
              />
              <Button icon={<ReloadOutlined />} onClick={loadPlans}>刷新</Button>
              <Button icon={<ThunderboltOutlined />} onClick={() => {
                predictForm.setFieldsValue({ 
                  plan_date: dayjs().format('YYYY-MM-DD'),
                  weather: 'hot',
                  activity: 'promotion'
                });
                setPredictions([]);
                setPredictModalVisible(true);
              }}>智能生成</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlan}>手动添加</Button>
            </Space>
          </div>

          {uniqueDates.length > 0 ? (
            uniqueDates.map(date => {
              const datePlans = plans.filter(p => p.plan_date === date);
              const weather = datePlans[0]?.weather;
              const activity = datePlans[0]?.activity;
              const weatherMap = { normal: '正常', hot: '炎热', cold: '寒冷', rainy: '雨天' };
              const activityMap = { normal: '无', promotion: '促销活动', holiday: '节假日', weekend: '周末' };
              
              return (
                <Card key={date} style={{ marginBottom: 16 }} size="small"
                  title={
                    <Space>
                      <Tag color="blue" style={{ fontSize: 14 }}>📅 {date}</Tag>
                      <span>🌤️ {weatherMap[weather] || weather}</span>
                      <span>🎉 {activityMap[activity] || activity}</span>
                      <span style={{ color: '#999' }}>共 {datePlans.length} 项原料</span>
                    </Space>
                  }
                >
                  <Table
                    dataSource={datePlans}
                    columns={planColumns.filter(c => c.key !== 'plan_date' && c.key !== 'weather' && c.key !== 'activity')}
                    rowKey="id"
                    size="small"
                    pagination={false}
                  />
                </Card>
              );
            })
          ) : (
            <Card style={{ textAlign: 'center', color: '#999' }}>
              <p>暂无备料计划数据</p>
              <p>点击「智能生成」或「手动添加」创建备料计划</p>
            </Card>
          )}
        </TabPane>

        <TabPane tab="盘点记录" key="checks">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>库存盘点</h2>
            <Button type="primary" icon={<FileSearchOutlined />} onClick={handleAddCheck}>新增盘点</Button>
          </div>
          <Table dataSource={inventoryChecks} columns={checkColumns} rowKey="id" />
        </TabPane>
      </Tabs>

      <Modal
        title="智能生成备料计划"
        open={predictModalVisible}
        onOk={handleSavePredictions}
        onCancel={() => setPredictModalVisible(false)}
        okText="保存计划"
        cancelText="取消"
        width={700}
      >
        <Form form={predictForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="plan_date" label="计划日期" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="weather" label="天气">
                <Select>
                  <Option value="normal">正常</Option>
                  <Option value="hot">炎热</Option>
                  <Option value="cold">寒冷</Option>
                  <Option value="rainy">雨天</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="activity" label="活动">
                <Select>
                  <Option value="normal">无</Option>
                  <Option value="promotion">促销活动</Option>
                  <Option value="holiday">节假日</Option>
                  <Option value="weekend">周末</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Button type="primary" onClick={handleGenerate} block style={{ marginBottom: 16 }}>
          生成预测
        </Button>
        {predictions.length > 0 && (
          <Card title="预测结果" size="small">
            <Table
              dataSource={predictions}
              columns={[
                { title: '原料', dataIndex: 'material_name', key: 'material_name' },
                { title: '预测用量', dataIndex: 'predicted_qty', key: 'predicted_qty',
                  render: (v, r) => `${v} ${r.unit}`
                }
              ]}
              rowKey="material_id"
              size="small"
              pagination={false}
            />
          </Card>
        )}
      </Modal>

      <Modal
        title="添加备料计划"
        open={modalVisible}
        onOk={handlePlanOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="plan_date" label="计划日期" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="material_id" label="原料" rules={[{ required: true }]}>
            <Select>
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="predicted_qty" label="预测用量" rules={[{ required: true }]}>
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="actual_prep_qty" label="实际备料">
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="weather" label="天气">
            <Select>
              <Option value="normal">正常</Option>
              <Option value="hot">炎热</Option>
              <Option value="cold">寒冷</Option>
              <Option value="rainy">雨天</Option>
            </Select>
          </Form.Item>
          <Form.Item name="activity" label="活动">
            <Select>
              <Option value="normal">无</Option>
              <Option value="promotion">促销活动</Option>
              <Option value="holiday">节假日</Option>
            </Select>
          </Form.Item>
          <Form.Item name="adjust_reason" label="调整原因">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="库存盘点"
        open={checkModalVisible}
        onOk={handleCheckOk}
        onCancel={() => setCheckModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={checkForm} layout="vertical">
          <Form.Item name="check_date" label="盘点日期" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="material_id" label="原料" rules={[{ required: true }]}>
            <Select>
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="system_qty" label="系统库存" rules={[{ required: true }]}>
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="actual_qty" label="实际库存" rules={[{ required: true }]}>
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="reason" label="差异原因">
            <TextArea rows={3} placeholder="如果有差异，请说明原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PrepPlan;
