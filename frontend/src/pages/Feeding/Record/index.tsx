import { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Input, InputNumber, Select, DatePicker, Modal, Tag, Space, message, Popconfirm, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

interface FeedingRecord {
  id: string;
  earTagId: string;
  livestockType: string;
  breed: string;
  barnId: string;
  penId: string;
  feedingDate: string;
  feedType: string;
  feedAmount: number;
  dailyGain: number;
  baselineGain: number;
  deviation: number;
  deviationDays: number;
  operator: string;
  notes?: string;
}

const feedTypes = [
  { value: 'corn', label: '玉米' },
  { value: 'soybean', label: '豆粕' },
  { value: 'wheat', label: '小麦' },
  { value: 'bran', label: '麸皮' },
  { value: 'premix', label: '预混料' },
  { value: 'forage', label: '青贮饲料' },
];

const livestockTypes = {
  'pig': { type: '猪', barnId: 'A-01', penId: 'A-01-01' },
  'cattle': { type: '牛', barnId: 'B-01', penId: 'B-01-01' },
  'sheep': { type: '羊', barnId: 'C-01', penId: 'C-01-01' }
};

const FeedingRecord = () => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeedingRecord | null>(null);
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [recordList, setRecordList] = useState<FeedingRecord[]>([]);

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    const mockData: FeedingRecord[] = [
      { 
        id: '1', 
        earTagId: 'E12345', 
        livestockType: 'pig', 
        breed: '杜洛克', 
        barnId: 'A-01', 
        penId: 'A-01-03', 
        feedingDate: dayjs().format('YYYY-MM-DD'), 
        feedType: 'corn', 
        feedAmount: 2.5, 
        dailyGain: 0.65, 
        baselineGain: 0.8, 
        deviation: -18.75, 
        deviationDays: 0, 
        operator: '张三' 
      },
      { 
        id: '2', 
        earTagId: 'E12346', 
        livestockType: 'pig', 
        breed: '长白', 
        barnId: 'A-01', 
        penId: 'A-01-03', 
        feedingDate: dayjs().format('YYYY-MM-DD'), 
        feedType: 'corn', 
        feedAmount: 2.3, 
        dailyGain: 0.72, 
        baselineGain: 0.8, 
        deviation: -10, 
        deviationDays: 2, 
        operator: '张三' 
      },
      { 
        id: '3', 
        earTagId: 'E20001', 
        livestockType: 'cattle', 
        breed: '西门塔尔', 
        barnId: 'B-01', 
        penId: 'B-01-02', 
        feedingDate: dayjs().format('YYYY-MM-DD'), 
        feedType: 'forage', 
        feedAmount: 15, 
        dailyGain: 1.2, 
        baselineGain: 1.5, 
        deviation: -20, 
        deviationDays: 3, 
        operator: '李四', 
        notes: '连续3天异常，已触发健康排查' 
      },
      { 
        id: '4', 
        earTagId: 'E12347', 
        livestockType: 'pig', 
        breed: '大白', 
        barnId: 'A-02', 
        penId: 'A-02-01', 
        feedingDate: dayjs().format('YYYY-MM-DD'), 
        feedType: 'soybean', 
        feedAmount: 2.8, 
        dailyGain: 0.82, 
        baselineGain: 0.8, 
        deviation: 2.5, 
        deviationDays: 0, 
        operator: '王五' 
      },
    ];
    setRecordList(mockData);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: FeedingRecord) => {
    setEditingRecord(record);
    const previousWeight = record.baselineGain * record.deviationDays + record.dailyGain;
    const actualWeight = previousWeight + record.dailyGain;
    
    form.setFieldsValue({
      earTagId: record.earTagId,
      livestockType: record.livestockType,
      feedType: record.feedType,
      feedAmount: record.feedAmount,
      previousWeight: previousWeight,
      actualWeight: actualWeight,
      baselineGain: record.baselineGain,
      operator: record.operator,
      notes: record.notes,
      feedingDate: dayjs(record.feedingDate),
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dailyGain = values.actualWeight - values.previousWeight;
      const deviation = ((dailyGain - values.baselineGain) / values.baselineGain * 100);
      
      const livestockType = values.earTagId.startsWith('E20') ? 'cattle' : 
                            values.earTagId.startsWith('E30') ? 'sheep' : 'pig';
      const typeInfo = livestockTypes[livestockType as keyof typeof livestockTypes];
      
      let deviationDays = 0;
      if (editingRecord) {
        deviationDays = Math.abs(deviation) > 10 ? editingRecord.deviationDays + 1 : 0;
      } else {
        const recentRecords = recordList.filter(r => r.earTagId === values.earTagId);
        deviationDays = recentRecords.length > 0 && Math.abs(deviation) > 10 ? recentRecords[recentRecords.length - 1].deviationDays + 1 : 0;
      }

      const newRecord: FeedingRecord = {
        id: editingRecord ? editingRecord.id : Date.now().toString(),
        earTagId: values.earTagId,
        livestockType: livestockType,
        breed: livestockType === 'cattle' ? '西门塔尔' : 
               livestockType === 'sheep' ? '小尾寒羊' : '杜洛克',
        barnId: typeInfo?.barnId || 'A-01',
        penId: typeInfo?.penId || 'A-01-01',
        feedingDate: values.feedingDate ? values.feedingDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        feedType: values.feedType,
        feedAmount: values.feedAmount,
        dailyGain: dailyGain,
        baselineGain: values.baselineGain,
        deviation: deviation,
        deviationDays: deviationDays,
        operator: values.operator || '饲养员',
        notes: values.notes,
      };

      if (editingRecord) {
        setRecordList(prev => prev.map(r => r.id === editingRecord.id ? newRecord : r));
        message.success('修改成功');
      } else {
        setRecordList(prev => [newRecord, ...prev]);
        message.success('录入成功');
        
        if (deviationDays >= 3) {
          message.warning('⚠️ 警告：连续3天异常，已触发健康排查！');
        }
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Submit failed:', error);
      message.error('操作失败，请检查表单');
    }
  };

  const handleDelete = (id: string) => {
    setRecordList(prev => prev.filter(r => r.id !== id));
    message.success('删除成功');
  };

  const getDeviationStatus = (deviation: number, deviationDays: number) => {
    if (deviationDays >= 3) {
      return { color: 'red', text: '已触发健康排查', icon: <WarningOutlined /> };
    } else if (deviation < -10 || deviation > 10) {
      return { color: 'orange', text: '偏离正常', icon: <ExclamationCircleOutlined /> };
    } else if (deviation >= -10 && deviation <= 10) {
      return { color: 'green', text: '正常', icon: <CheckCircleOutlined /> };
    }
    return { color: 'default', text: '未知', icon: null };
  };

  const columns: ColumnsType<FeedingRecord> = [
    { title: '耳标编号', dataIndex: 'earTagId', key: 'earTagId', fixed: 'left', width: 120 },
    { title: '类型', dataIndex: 'livestockType', key: 'livestockType', width: 80, 
      render: (type: string) => type === 'pig' ? '猪' : type === 'cattle' ? '牛' : type === 'sheep' ? '羊' : '鸡' 
    },
    { title: '品种', dataIndex: 'breed', key: 'breed', width: 100 },
    { title: '栏舍', dataIndex: 'barnId', key: 'barnId', width: 100, 
      render: (_, record) => `${record.barnId} / ${record.penId}` 
    },
    { title: '饲喂日期', dataIndex: 'feedingDate', key: 'feedingDate', width: 120 },
    { title: '饲料类型', dataIndex: 'feedType', key: 'feedType', width: 100, 
      render: (type: string) => feedTypes.find(f => f.value === type)?.label || type 
    },
    { title: '领料量(kg)', dataIndex: 'feedAmount', key: 'feedAmount', width: 100 },
    { title: '日增重(kg)', dataIndex: 'dailyGain', key: 'dailyGain', width: 100, 
      render: (gain: number) => gain.toFixed(2) 
    },
    { title: '基准增重(kg)', dataIndex: 'baselineGain', key: 'baselineGain', width: 110, 
      render: (gain: number) => gain.toFixed(2) 
    },
    { title: '偏差率', dataIndex: 'deviation', key: 'deviation', width: 100, 
      render: (dev: number) => {
        const status = getDeviationStatus(dev, 0);
        return <Tag color={status.color} icon={status.icon}>{dev > 0 ? '+' : ''}{dev.toFixed(1)}%</Tag>;
      } 
    },
    { title: '连续异常天数', dataIndex: 'deviationDays', key: 'deviationDays', width: 120, 
      render: (days: number) => {
        if (days === 0) return <Tag color="green">正常</Tag>;
        if (days >= 3) return <Badge status="error" text={<span style={{ color: '#ff4d4f' }}>{days}天</span>} />;
        return <Badge status="warning" text={<span>{days}天</span>} />;
      } 
    },
    { title: '操作员', dataIndex: 'operator', key: 'operator', width: 80 },
    { title: '操作', key: 'action', fixed: 'right', width: 120, 
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该记录？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ) 
    },
  ];

  const summaryData = {
    total: recordList.length,
    normal: recordList.filter(r => Math.abs(r.deviation) <= 10 && r.deviationDays < 3).length,
    warning: recordList.filter(r => (Math.abs(r.deviation) > 10 || r.deviationDays >= 1) && r.deviationDays < 3).length,
    critical: recordList.filter(r => r.deviationDays >= 3).length,
  };

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 16 }}>
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>录入饲喂记录</Button>
          </Space>

          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 24, color: '#1890ff', fontWeight: 'bold' }}>{summaryData.total}</div>
              <div>今日记录数</div>
            </Card>
            <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#f6ffed' }}>
              <div style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold' }}>{summaryData.normal}</div>
              <div>正常</div>
            </Card>
            <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fff7e6' }}>
              <div style={{ fontSize: 24, color: '#fa8c16', fontWeight: 'bold' }}>{summaryData.warning}</div>
              <div>偏离预警</div>
            </Card>
            <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fff2f0' }}>
              <div style={{ fontSize: 24, color: '#ff4d4f', fontWeight: 'bold' }}>{summaryData.critical}</div>
              <div>需健康排查</div>
            </Card>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={recordList}
          rowKey="id"
          scroll={{ x: 1500 }}
          loading={loading}
          pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条记录` }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑饲喂记录' : '录入饲喂记录'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="earTagId" label="耳标编号" rules={[{ required: true, message: '请输入耳标编号' }]}>
            <Input placeholder="请扫描或输入耳标编号" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="feedType" label="饲料类型" rules={[{ required: true, message: '请选择饲料类型' }]} style={{ flex: 1 }}>
              <Select placeholder="请选择饲料类型">
                {feedTypes.map(type => <Select.Option key={type.value} value={type.value}>{type.label}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="feedAmount" label="领料量(kg)" rules={[{ required: true, message: '请输入领料量' }]} style={{ flex: 1 }}>
              <InputNumber min={0} precision={1} style={{ width: '100%' }} placeholder="请输入领料量" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="previousWeight" label="昨日体重(kg)" rules={[{ required: true, message: '请输入昨日体重' }]} style={{ flex: 1 }}>
              <InputNumber min={0} precision={1} style={{ width: '100%' }} placeholder="请输入昨日体重" />
            </Form.Item>
            <Form.Item name="actualWeight" label="今日体重(kg)" rules={[{ required: true, message: '请输入今日体重' }]} style={{ flex: 1 }}>
              <InputNumber min={0} precision={1} style={{ width: '100%' }} placeholder="请输入今日体重" />
            </Form.Item>
          </div>

          <Form.Item name="baselineGain" label="基准日增重(kg)" rules={[{ required: true, message: '请输入基准日增重' }]} extra="系统将根据品种自动获取基准生长曲线">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入基准日增重" />
          </Form.Item>

          <Form.Item name="operator" label="操作员">
            <Input placeholder="请输入操作员姓名" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedingRecord;
