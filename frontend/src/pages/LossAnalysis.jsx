import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, message, Space, Tabs, Card, Row, Col, Tag, Alert } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

function LossAnalysis({ storeId }) {
  const [losses, setLosses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [abnormalLoss, setAbnormalLoss] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [batches, setBatches] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadLosses();
    loadSummary();
    loadAbnormalLoss();
    loadMaterials();
    loadBatches();
  }, [storeId]);

  const loadLosses = async () => {
    const res = await api.get(`/loss?store_id=${storeId}`);
    if (res.success) {
      setLosses(res.data);
    }
  };

  const loadSummary = async () => {
    const res = await api.get(`/loss/summary?store_id=${storeId}`);
    if (res.success) {
      setSummary(res.data);
    }
  };

  const loadAbnormalLoss = async () => {
    const res = await api.get(`/loss/abnormal?store_id=${storeId}`);
    if (res.success) {
      setAbnormalLoss(res.data);
    }
  };

  const loadMaterials = async () => {
    const res = await api.get('/materials');
    if (res.success) {
      setMaterials(res.data);
    }
  };

  const loadBatches = async () => {
    const res = await api.get(`/materials/batches?store_id=${storeId}`);
    if (res.success) {
      setBatches(res.data);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const res = await api.post('/loss', {
        ...values,
        store_id: storeId,
        is_abnormal: values.is_abnormal ? 1 : 0
      });
      if (res.success) {
        message.success('损耗记录已添加');
        setModalVisible(false);
        loadLosses();
        loadSummary();
        loadAbnormalLoss();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFollowUp = async (id, status) => {
    const res = await api.put(`/loss/${id}/followup`, { follow_up_status: status });
    if (res.success) {
      message.success('跟进状态已更新');
      loadAbnormalLoss();
    }
  };

  const lossTypeMap = {
    expired: { label: '过期', color: 'red' },
    production_fail: { label: '制作失败', color: 'orange' },
    inventory_diff: { label: '盘点差异', color: 'blue' },
    activity: { label: '活动消耗', color: 'green' },
    other: { label: '其他', color: 'default' }
  };

  const columns = [
    { title: '日期', dataIndex: 'loss_date', key: 'loss_date' },
    { title: '原料', dataIndex: 'material_name', key: 'material_name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '损耗数量', dataIndex: 'quantity', key: 'quantity',
      render: (v, r) => `${v} ${r.unit}`
    },
    { title: '损耗类型', dataIndex: 'loss_type', key: 'loss_type',
      render: (v) => {
        const info = lossTypeMap[v] || { label: v, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    { title: '异常', dataIndex: 'is_abnormal', key: 'is_abnormal',
      render: (v) => v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>
    }
  ];

  const abnormalColumns = [
    { title: '门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '日期', dataIndex: 'loss_date', key: 'loss_date' },
    { title: '原料', dataIndex: 'material_name', key: 'material_name' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity',
      render: (v, r) => `${v} ${r.unit}`
    },
    { title: '类型', dataIndex: 'loss_type', key: 'loss_type',
      render: (v) => (lossTypeMap[v]?.label || v)
    },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    { title: '跟进状态', dataIndex: 'follow_up_status', key: 'follow_up_status',
      render: (v) => {
        const map = { pending: '待跟进', processing: '处理中', completed: '已完成' };
        const colorMap = { pending: 'orange', processing: 'blue', completed: 'green' };
        return <Tag color={colorMap[v]}>{map[v] || v}</Tag>;
      }
    },
    { title: '操作', key: 'action',
      render: (_, record) => record.follow_up_status !== 'completed' && (
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleFollowUp(record.id, 'completed')}
        >
          完成跟进
        </Button>
      )
    }
  ];

  return (
    <div>
      {abnormalLoss.length > 0 && (
        <Alert
          message="异常损耗待跟进"
          description={`有 ${abnormalLoss.length} 条异常损耗记录需要营运跟进处理`}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {Object.entries(lossTypeMap).map(([key, info]) => {
          const item = summary.find(s => s.loss_type === key);
          return (
            <Col span={4} key={key}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <Tag color={info.color} style={{ fontSize: 14, marginBottom: 8 }}>
                    {info.label}
                  </Tag>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                    {item?.total_quantity || 0}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>
                    {item?.count || 0} 次
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Tabs defaultActiveKey="all">
        <TabPane tab="全部损耗" key="all">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>损耗记录</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>报损登记</Button>
          </div>
          <Table dataSource={losses} columns={columns} rowKey="id" />
        </TabPane>

        <TabPane tab={`异常损耗 (${abnormalLoss.length})`} key="abnormal">
          <h2 style={{ marginBottom: 16 }}>异常损耗营运跟进</h2>
          <Table dataSource={abnormalLoss} columns={abnormalColumns} rowKey="id" />
        </TabPane>
      </Tabs>

      <Modal
        title="损耗登记"
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="loss_date" label="损耗日期" rules={[{ required: true }]}>
            <Input type="date" defaultValue={dayjs().format('YYYY-MM-DD')} />
          </Form.Item>
          <Form.Item name="material_id" label="原料" rules={[{ required: true }]}>
            <Select>
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="batch_id" label="批次">
            <Select>
              {batches.map(b => (
                <Option key={b.id} value={b.id}>{b.batch_no} - {b.material_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="损耗数量" rules={[{ required: true }]}>
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="loss_type" label="损耗类型" rules={[{ required: true }]}>
            <Select>
              <Option value="expired">过期</Option>
              <Option value="production_fail">制作失败</Option>
              <Option value="inventory_diff">盘点差异</Option>
              <Option value="activity">活动消耗</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="损耗原因">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="is_abnormal" valuePropName="checked">
            <Select>
              <Option value={false}>正常损耗</Option>
              <Option value={true}>异常损耗（需营运跟进）</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LossAnalysis;
