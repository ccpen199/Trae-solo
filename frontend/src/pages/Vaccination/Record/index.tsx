import { useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Row, Col, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

interface VaccinationRecord {
  id: string;
  earTagId: string;
  livestockType: string;
  vaccine: string;
  vaccineBatch: string;
  vaccinationDate: string;
  nextVaccinationDate: string;
  operator: string;
  dosage: string;
  notes?: string;
  status: 'completed' | 'pending' | 'overdue';
}

const vaccines = [
  { value: 'fmd', label: '口蹄疫' },
  { value: 'swine_fever', label: '猪瘟' },
  { value: 'prrs', label: '蓝耳病' },
  { value: 'pseudorabies', label: '伪狂犬病' },
  { value: 'circovirus', label: '圆环病毒' },
  { value: 'parvovirus', label: '细小病毒' },
  { value: 'infectious_bursal', label: '法氏囊' },
];

const VaccinationRecordPage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VaccinationRecord | null>(null);
  const [form] = Form.useForm();

  const [recordList, setRecordList] = useState<VaccinationRecord[]>([
    { id: '1', earTagId: 'E12345', livestockType: 'pig', vaccine: '口蹄疫', vaccineBatch: '20260401', vaccinationDate: '2026-04-20', nextVaccinationDate: '2026-10-20', operator: '王兽医', dosage: '2ml', status: 'completed' },
    { id: '2', earTagId: 'E12346', livestockType: 'pig', vaccine: '猪瘟', vaccineBatch: '20260402', vaccinationDate: '2026-04-15', nextVaccinationDate: '2026-07-15', operator: '王兽医', dosage: '1ml', status: 'completed' },
    { id: '3', earTagId: 'E12347', livestockType: 'pig', vaccine: '蓝耳病', vaccineBatch: '20260301', vaccinationDate: '2026-03-10', nextVaccinationDate: '2026-04-27', operator: '王兽医', dosage: '1.5ml', status: 'overdue' },
    { id: '4', earTagId: 'E20001', livestockType: 'cattle', vaccine: '口蹄疫', vaccineBatch: '20260403', vaccinationDate: '2026-03-15', nextVaccinationDate: '2026-09-15', operator: '李兽医', dosage: '5ml', status: 'completed' },
    { id: '5', earTagId: 'E12345', livestockType: 'pig', vaccine: '猪瘟', vaccineBatch: '20260201', vaccinationDate: '2026-02-10', nextVaccinationDate: '2026-08-10', operator: '王兽医', dosage: '1ml', status: 'pending' },
  ]);

  const getStatusTag = (status: string) => {
    const statusMap = {
      completed: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
      pending: { color: 'blue', text: '待接种', icon: <WarningOutlined /> },
      overdue: { color: 'red', text: '已逾期', icon: <CloseCircleOutlined /> }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getTypeText = (type: string) => {
    return type === 'pig' ? '猪' : type === 'cattle' ? '牛' : type === 'sheep' ? '羊' : '鸡';
  };

  const getVaccineText = (value: string) => {
    return vaccines.find(v => v.value === value)?.label || value;
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: VaccinationRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      earTagId: record.earTagId,
      livestockType: record.livestockType,
      vaccine: record.vaccine,
      vaccineBatch: record.vaccineBatch,
      vaccinationDate: dayjs(record.vaccinationDate),
      nextVaccinationDate: dayjs(record.nextVaccinationDate),
      operator: record.operator,
      dosage: record.dosage,
      notes: record.notes,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const newRecord: VaccinationRecord = {
        id: editingRecord ? editingRecord.id : Date.now().toString(),
        earTagId: values.earTagId,
        livestockType: values.livestockType || 'pig',
        vaccine: values.vaccine,
        vaccineBatch: values.vaccineBatch,
        vaccinationDate: values.vaccinationDate.format('YYYY-MM-DD'),
        nextVaccinationDate: values.nextVaccinationDate.format('YYYY-MM-DD'),
        operator: values.operator,
        dosage: values.dosage,
        notes: values.notes,
        status: values.status || 'pending',
      };

      if (editingRecord) {
        setRecordList(prev => prev.map(r => r.id === editingRecord.id ? newRecord : r));
        message.success('修改成功');
      } else {
        setRecordList(prev => [newRecord, ...prev]);
        message.success('添加成功');
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

  const statusStats = {
    total: recordList.length,
    completed: recordList.filter(r => r.status === 'completed').length,
    pending: recordList.filter(r => r.status === 'pending').length,
    overdue: recordList.filter(r => r.status === 'overdue').length,
  };

  const columns: ColumnsType<VaccinationRecord> = [
    { title: '耳标编号', dataIndex: 'earTagId', key: 'earTagId', fixed: 'left', width: 120 },
    { title: '类型', dataIndex: 'livestockType', key: 'livestockType', width: 80, render: getTypeText },
    { title: '疫苗名称', dataIndex: 'vaccine', key: 'vaccine', width: 120, render: getVaccineText },
    { title: '批次号', dataIndex: 'vaccineBatch', key: 'vaccineBatch', width: 120 },
    { title: '接种日期', dataIndex: 'vaccinationDate', key: 'vaccinationDate', width: 120 },
    { title: '下次接种', dataIndex: 'nextVaccinationDate', key: 'nextVaccinationDate', width: 120 },
    { title: '剂量', dataIndex: 'dosage', key: 'dosage', width: 100 },
    { title: '兽医', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: getStatusTag },
    { title: '备注', dataIndex: 'notes', key: 'notes' },
    { title: '操作', key: 'action', fixed: 'right', width: 120, render: (_, record) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确定删除该记录？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加防疫记录</Button>
          </Space>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, color: '#1890ff', fontWeight: 'bold' }}>{statusStats.total}</div>
                <div>总记录数</div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                <div style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold' }}>{statusStats.completed}</div>
                <div>已完成</div>
                <Progress percent={Math.round((statusStats.completed / statusStats.total) * 100)} size="small" />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
                <div style={{ fontSize: 24, color: '#1890ff', fontWeight: 'bold' }}>{statusStats.pending}</div>
                <div>待接种</div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center', background: '#fff2f0' }}>
                <div style={{ fontSize: 24, color: '#ff4d4f', fontWeight: 'bold' }}>{statusStats.overdue}</div>
                <div>已逾期</div>
              </Card>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={recordList}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条记录` }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑防疫记录' : '添加防疫记录'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="earTagId" label="耳标编号" rules={[{ required: true, message: '请输入耳标编号' }]}>
            <Input placeholder="请输入耳标编号" />
          </Form.Item>

          <Form.Item name="livestockType" label="牲畜类型">
            <Select placeholder="请选择类型">
              <Select.Option value="pig">猪</Select.Option>
              <Select.Option value="cattle">牛</Select.Option>
              <Select.Option value="sheep">羊</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="vaccine" label="疫苗名称" rules={[{ required: true, message: '请选择疫苗' }]}>
            <Select placeholder="请选择疫苗">
              {vaccines.map(v => <Select.Option key={v.value} value={v.value}>{v.label}</Select.Option>)}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="vaccineBatch" label="批次号" rules={[{ required: true, message: '请输入批次号' }]}>
                <Input placeholder="请输入批次号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dosage" label="剂量">
                <Input placeholder="请输入剂量，如2ml" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="vaccinationDate" label="接种日期" rules={[{ required: true, message: '请选择接种日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nextVaccinationDate" label="下次接种日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="operator" label="兽医" rules={[{ required: true, message: '请输入兽医姓名' }]}>
            <Input placeholder="请输入兽医姓名" />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="pending">待接种</Select.Option>
              <Select.Option value="overdue">已逾期</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VaccinationRecordPage;
