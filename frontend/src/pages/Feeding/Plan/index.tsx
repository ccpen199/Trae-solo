import { useState } from 'react';
import { Card, Table, Tag, Button, Space, Select, DatePicker, Row, Col, Progress, Descriptions, Badge, Modal, Tabs, List, Typography, Form, InputNumber, message } from 'antd';
import { CalendarOutlined, EditOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

interface FeedingPlan {
  id: string;
  earTagId: string;
  livestockType: string;
  breed: string;
  barnId: string;
  penId: string;
  currentWeight: number;
  targetWeight: number;
  daysInFarm: number;
  age: number;
  dailyFeedTotal: number;
  dailyFeedFormula: {
    corn: number;
    soybean: number;
    wheat: number;
    premix: number;
    forage: number;
  };
  baselineDailyGain: number;
  targetDailyGain: number;
  actualDailyGain: number;
  planStatus: 'normal' | 'ahead' | 'behind';
  lastFeedingDate: string;
  nextFeedingTime: string;
}

const FeedingPlan = () => {
  const [selectedLivestock, setSelectedLivestock] = useState<FeedingPlan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [form] = Form.useForm();
  const [planList, setPlanList] = useState<FeedingPlan[]>([
    {
      id: '1',
      earTagId: 'E12345',
      livestockType: 'pig',
      breed: '杜洛克',
      barnId: 'A-01',
      penId: 'A-01-03',
      currentWeight: 85.3,
      targetWeight: 110,
      daysInFarm: 100,
      age: 150,
      dailyFeedTotal: 2.5,
      dailyFeedFormula: { corn: 1.5, soybean: 0.5, wheat: 0.3, premix: 0.1, forage: 0.1 },
      baselineDailyGain: 0.8,
      targetDailyGain: 0.85,
      actualDailyGain: 0.82,
      planStatus: 'ahead',
      lastFeedingDate: dayjs().format('YYYY-MM-DD'),
      nextFeedingTime: '08:00',
    },
    {
      id: '2',
      earTagId: 'E12346',
      livestockType: 'pig',
      breed: '长白',
      barnId: 'A-01',
      penId: 'A-01-03',
      currentWeight: 78.5,
      targetWeight: 110,
      daysInFarm: 95,
      age: 145,
      dailyFeedTotal: 2.3,
      dailyFeedFormula: { corn: 1.4, soybean: 0.45, wheat: 0.3, premix: 0.1, forage: 0.05 },
      baselineDailyGain: 0.8,
      targetDailyGain: 0.85,
      actualDailyGain: 0.78,
      planStatus: 'behind',
      lastFeedingDate: dayjs().format('YYYY-MM-DD'),
      nextFeedingTime: '08:00',
    },
    {
      id: '3',
      earTagId: 'E20001',
      livestockType: 'cattle',
      breed: '西门塔尔',
      barnId: 'B-01',
      penId: 'B-01-02',
      currentWeight: 580,
      targetWeight: 650,
      daysInFarm: 180,
      age: 365,
      dailyFeedTotal: 15,
      dailyFeedFormula: { corn: 5, soybean: 2, wheat: 3, premix: 0.5, forage: 4.5 },
      baselineDailyGain: 1.5,
      targetDailyGain: 1.6,
      actualDailyGain: 1.45,
      planStatus: 'behind',
      lastFeedingDate: dayjs().format('YYYY-MM-DD'),
      nextFeedingTime: '06:00',
    },
    {
      id: '4',
      earTagId: 'E30001',
      livestockType: 'sheep',
      breed: '小尾寒羊',
      barnId: 'C-01',
      penId: 'C-01-01',
      currentWeight: 45.2,
      targetWeight: 55,
      daysInFarm: 120,
      age: 200,
      dailyFeedTotal: 1.8,
      dailyFeedFormula: { corn: 0.8, soybean: 0.3, wheat: 0.4, premix: 0.1, forage: 0.2 },
      baselineDailyGain: 0.25,
      targetDailyGain: 0.28,
      actualDailyGain: 0.27,
      planStatus: 'normal',
      lastFeedingDate: dayjs().format('YYYY-MM-DD'),
      nextFeedingTime: '07:00',
    },
  ]);

  const getStatusTag = (status: string) => {
    const config = {
      normal: { color: 'green', text: '正常' },
      ahead: { color: 'blue', text: '超前' },
      behind: { color: 'orange', text: '滞后' },
    };
    const { color, text } = config[status as keyof typeof config] || config.normal;
    return <Tag color={color}>{text}</Tag>;
  };

  const getProgressPercent = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  const handleViewDetail = (record: FeedingPlan) => {
    setSelectedLivestock(record);
    setEditMode(false);
    form.resetFields();
    setModalVisible(true);
  };

  const handleAdjustPlan = () => {
    setEditMode(true);
    if (selectedLivestock) {
      form.setFieldsValue({
        targetWeight: selectedLivestock.targetWeight,
        dailyFeedTotal: selectedLivestock.dailyFeedTotal,
        ...selectedLivestock.dailyFeedFormula,
      });
    }
  };

  const handleSavePlan = async () => {
    try {
      const values = await form.validateFields();
      const total = values.corn + values.soybean + values.wheat + values.premix + values.forage;
      if (Math.abs(total - values.dailyFeedTotal) > 0.01) {
        message.error('配方总和必须等于日饲喂总量');
        return;
      }

      setPlanList(prev => prev.map(p => 
        p.id === selectedLivestock?.id 
          ? {
              ...p,
              targetWeight: values.targetWeight,
              dailyFeedTotal: values.dailyFeedTotal,
              dailyFeedFormula: {
                corn: values.corn,
                soybean: values.soybean,
                wheat: values.wheat,
                premix: values.premix,
                forage: values.forage,
              },
              planStatus: p.actualDailyGain >= values.dailyFeedTotal * 0.3 ? 'normal' : 'behind',
            }
          : p
      ));

      const updatedPlan = planList.find(p => p.id === selectedLivestock?.id);
      if (updatedPlan) {
        setSelectedLivestock({
          ...updatedPlan,
          targetWeight: values.targetWeight,
          dailyFeedTotal: values.dailyFeedTotal,
          dailyFeedFormula: {
            corn: values.corn,
            soybean: values.soybean,
            wheat: values.wheat,
            premix: values.premix,
            forage: values.forage,
          },
        });
      }

      message.success('喂养计划调整成功');
      setEditMode(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getFeedChartOption = (plan: FeedingPlan) => {
    const formula = plan.dailyFeedFormula;
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}kg ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}: {c}kg' },
        data: [
          { value: formula.corn, name: '玉米' },
          { value: formula.soybean, name: '豆粕' },
          { value: formula.wheat, name: '小麦' },
          { value: formula.premix, name: '预混料' },
          { value: formula.forage, name: '青贮饲料' },
        ],
      }],
    };
  };

  const getGrowthChartOption = (plan: FeedingPlan) => {
    const days = Array.from({ length: 10 }, (_, i) => `第${i * 10 + 1}天`);
    const baselineData = days.map((_, i) => plan.baselineDailyGain * (i * 10 + 1));
    const targetData = days.map((_, i) => plan.targetDailyGain * (i * 10 + 1));
    const actualData = days.map((_, i) => plan.actualDailyGain * (i * 10 + 1));

    return {
      tooltip: { trigger: 'axis', formatter: '{c}kg' },
      legend: { data: ['基准增重', '目标增重', '实际增重'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: days },
      yAxis: { type: 'value', name: '累计增重(kg)' },
      series: [
        { name: '基准增重', type: 'line', data: baselineData, lineStyle: { type: 'dashed' } },
        { name: '目标增重', type: 'line', data: targetData },
        { name: '实际增重', type: 'line', data: actualData, itemStyle: { color: '#52c41a' } },
      ],
    };
  };

  const columns: ColumnsType<FeedingPlan> = [
    { title: '耳标编号', dataIndex: 'earTagId', key: 'earTagId', fixed: 'left', width: 120, render: (text, record) => <a onClick={() => handleViewDetail(record)}>{text}</a> },
    { title: '类型', dataIndex: 'livestockType', key: 'livestockType', width: 80, render: (type: string) => type === 'pig' ? '猪' : type === 'cattle' ? '牛' : type === 'sheep' ? '羊' : '鸡' },
    { title: '品种', dataIndex: 'breed', key: 'breed', width: 100 },
    { title: '栏舍', dataIndex: 'barnId', key: 'barnId', width: 120, render: (_, record) => `${record.barnId} / ${record.penId}` },
    { title: '当前体重', dataIndex: 'currentWeight', key: 'currentWeight', width: 100, render: (w: number) => `${w}kg` },
    { title: '目标体重', dataIndex: 'targetWeight', key: 'targetWeight', width: 100, render: (w: number) => `${w}kg` },
    {
      title: '生长进度', key: 'progress', width: 150, render: (_, record) => (
        <Progress percent={getProgressPercent(record.currentWeight, record.targetWeight)} size="small" status={record.planStatus === 'behind' ? 'exception' : 'active'} format={(p) => `${p}%`} />
      ),
    },
    { title: '日饲喂量', dataIndex: 'dailyFeedTotal', key: 'dailyFeedTotal', width: 100, render: (amount: number) => `${amount}kg` },
    {
      title: '目标日增重', key: 'dailyGain', width: 120, render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>目标: {record.targetDailyGain}kg</span>
          <span style={{ color: record.actualDailyGain >= record.targetDailyGain ? '#52c41a' : '#fa8c16' }}>实际: {record.actualDailyGain}kg</span>
        </Space>
      ),
    },
    { title: '状态', dataIndex: 'planStatus', key: 'planStatus', width: 80, render: (status: string) => getStatusTag(status) },
    { title: '下次饲喂', dataIndex: 'nextFeedingTime', key: 'nextFeedingTime', width: 100, render: (time: string) => <Tag icon={<CalendarOutlined />}>{time}</Tag> },
    {
      title: '操作', key: 'action', width: 100, render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: `全部 (${planList.length})` },
    { key: 'normal', label: <span><Badge status="success" /> 正常 ({planList.filter(d => d.planStatus === 'normal').length})</span> },
    { key: 'ahead', label: <span><Badge status="processing" /> 超前 ({planList.filter(d => d.planStatus === 'ahead').length})</span> },
    { key: 'behind', label: <span><Badge status="error" /> 滞后 ({planList.filter(d => d.planStatus === 'behind').length})</span> },
  ];

  const filteredData = filterType === 'all' ? planList : planList.filter(d => d.planStatus === filterType);

  return (
    <div>
      <Card>
        <Tabs items={tabItems} onChange={setFilterType} style={{ marginBottom: 16 }} />
        <Table columns={columns} dataSource={filteredData} rowKey="id" scroll={{ x: 1400 }} pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条计划` }} />
      </Card>

      <Modal
        title={`${editMode ? '调整喂养计划' : '喂养计划详情'} - ${selectedLivestock?.earTagId}`}
        open={modalVisible}
        footer={editMode ? [
          <Button key="cancel" onClick={() => setEditMode(false)}>取消</Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSavePlan}>保存</Button>,
        ] : [
          <Button key="close" onClick={() => setModalVisible(false)}>关闭</Button>,
          <Button key="adjust" type="primary" icon={<EditOutlined />} onClick={handleAdjustPlan}>调整计划</Button>,
        ]}
        width={900}
      >
        {selectedLivestock && (editMode ? (
          <Form form={form} layout="vertical">
            <Form.Item name="targetWeight" label="目标体重(kg)" rules={[{ required: true, message: '请输入目标体重' }]}>
              <InputNumber min={selectedLivestock.currentWeight} precision={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="dailyFeedTotal" label="日饲喂总量(kg)" rules={[{ required: true, message: '请输入日饲喂总量' }]}>
              <InputNumber min={0} precision={1} style={{ width: '100%' }} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="corn" label="玉米(kg)" rules={[{ required: true, message: '请输入玉米用量' }]}>
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="soybean" label="豆粕(kg)" rules={[{ required: true, message: '请输入豆粕用量' }]}>
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="wheat" label="小麦(kg)" rules={[{ required: true, message: '请输入小麦用量' }]}>
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="premix" label="预混料(kg)" rules={[{ required: true, message: '请输入预混料用量' }]}>
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="forage" label="青贮饲料(kg)" rules={[{ required: true, message: '请输入青贮饲料用量' }]}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <p style={{ color: '#fa8c16', marginTop: 16 }}>提示：配方各项总和需等于日饲喂总量</p>
          </Form>
        ) : (
          <Tabs items={[
            {
              key: 'info', label: '基本信息', children: (
                <div>
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="耳标编号">{selectedLivestock.earTagId}</Descriptions.Item>
                    <Descriptions.Item label="牲畜类型">{selectedLivestock.livestockType === 'pig' ? '猪' : selectedLivestock.livestockType === 'cattle' ? '牛' : selectedLivestock.livestockType === 'sheep' ? '羊' : '鸡'}</Descriptions.Item>
                    <Descriptions.Item label="品种">{selectedLivestock.breed}</Descriptions.Item>
                    <Descriptions.Item label="栏舍">{selectedLivestock.barnId} / {selectedLivestock.penId}</Descriptions.Item>
                    <Descriptions.Item label="当前体重">{selectedLivestock.currentWeight}kg</Descriptions.Item>
                    <Descriptions.Item label="目标体重">{selectedLivestock.targetWeight}kg</Descriptions.Item>
                    <Descriptions.Item label="饲养天数">{selectedLivestock.daysInFarm}天</Descriptions.Item>
                    <Descriptions.Item label="日龄">{selectedLivestock.age}天</Descriptions.Item>
                    <Descriptions.Item label="状态" span={2}>{getStatusTag(selectedLivestock.planStatus)}</Descriptions.Item>
                  </Descriptions>
                  <Row gutter={16} style={{ marginTop: 24 }}>
                    <Col span={12}><Card size="small" title="日增重对比"><ReactECharts option={getGrowthChartOption(selectedLivestock)} style={{ height: 250 }} /></Card></Col>
                    <Col span={12}><Card size="small" title="日粮配方"><ReactECharts option={getFeedChartOption(selectedLivestock)} style={{ height: 250 }} /></Card></Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'formula', label: '配方详情', children: (
                <List
                  header={<div>每日饲料配方</div>}
                  bordered
                  dataSource={[
                    { name: '玉米', amount: selectedLivestock.dailyFeedFormula.corn, percent: ((selectedLivestock.dailyFeedFormula.corn / selectedLivestock.dailyFeedTotal) * 100).toFixed(1) },
                    { name: '豆粕', amount: selectedLivestock.dailyFeedFormula.soybean, percent: ((selectedLivestock.dailyFeedFormula.soybean / selectedLivestock.dailyFeedTotal) * 100).toFixed(1) },
                    { name: '小麦', amount: selectedLivestock.dailyFeedFormula.wheat, percent: ((selectedLivestock.dailyFeedFormula.wheat / selectedLivestock.dailyFeedTotal) * 100).toFixed(1) },
                    { name: '预混料', amount: selectedLivestock.dailyFeedFormula.premix, percent: ((selectedLivestock.dailyFeedFormula.premix / selectedLivestock.dailyFeedTotal) * 100).toFixed(1) },
                    { name: '青贮饲料', amount: selectedLivestock.dailyFeedFormula.forage, percent: ((selectedLivestock.dailyFeedFormula.forage / selectedLivestock.dailyFeedTotal) * 100).toFixed(1) },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <Typography.Text style={{ width: 100 }}>{item.name}</Typography.Text>
                      <Progress percent={parseFloat(item.percent)} size="small" style={{ width: 200, margin: '0 16px' }} format={(p) => `${p}%`} />
                      <Typography.Text strong>{item.amount}kg</Typography.Text>
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: 'timeline', label: '执行记录', children: (
                <List
                  dataSource={[
                    { date: dayjs().format('YYYY-MM-DD'), time: '08:00', feed: `${selectedLivestock.dailyFeedTotal}kg`, status: 'completed' },
                    { date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), time: '08:00', feed: `${selectedLivestock.dailyFeedTotal}kg`, status: 'completed' },
                    { date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), time: '08:00', feed: `${selectedLivestock.dailyFeedTotal}kg`, status: 'completed' },
                    { date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), time: '08:00', feed: '2.3kg', status: 'partial' },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={<Space><span>{item.date} {item.time}</span>{item.status === 'completed' ? <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag> : <Tag color="orange" icon={<ExclamationCircleOutlined />}>部分执行</Tag>}</Space>}
                        description={`饲喂量: ${item.feed}`}
                      />
                    </List.Item>
                  )}
                />
              ),
            },
          ]} />
        ))}
      </Modal>
    </div>
  );
};

export default FeedingPlan;
