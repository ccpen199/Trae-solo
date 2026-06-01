import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Drawer,
  Descriptions,
  Typography,
  Row,
  Col,
  Timeline
} from 'antd';
import { PlusOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons';
import { fieldCalibers, dataSources as dsApi } from '../api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function FieldCalibers() {
  const [list, setList] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [calRes, dsRes] = await Promise.all([
        fieldCalibers.list({}),
        dsApi.list({})
      ]);
      setList(calRes.data);
      setDataSources(dsRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await fieldCalibers.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await fieldCalibers.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      setEditingItem(null);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleViewHistory = async (id) => {
    try {
      const res = await fieldCalibers.getHistory(id);
      setHistoryData(res.data);
      setHistoryVisible(true);
    } catch (error) {
      message.error('加载历史失败');
    }
  };

  const columns = [
    { title: '字段名', dataIndex: 'field_name', key: 'field_name' },
    { title: '数据源', dataIndex: 'data_source_name', key: 'data_source_name' },
    { title: '口径定义', dataIndex: 'caliber_definition', key: 'caliber_definition', ellipsis: true },
    { title: '数据类型', dataIndex: 'data_type', key: 'data_type' },
    { title: '版本', dataIndex: 'version', key: 'version', render: (v) => <Tag color="blue">v{v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => s === 'active' ? <Tag color="green">启用</Tag> : <Tag color="red">停用</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(record.id)}>
            历史
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={3}>字段口径</Title></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }}>
            新增口径
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? '编辑口径' : '新增口径'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="data_source_id" label="数据源" rules={[{ required: true }]}>
            <Select>
              {dataSources.map(ds => (
                <Option key={ds.id} value={ds.id}>{ds.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="field_name" label="字段名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="caliber_definition" label="口径定义" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="data_type" label="数据类型">
            <Select>
              <Option value="integer">整数</Option>
              <Option value="decimal">小数</Option>
              <Option value="string">字符串</Option>
              <Option value="date">日期</Option>
              <Option value="boolean">布尔</Option>
            </Select>
          </Form.Item>
          <Form.Item name="business_meaning" label="业务含义">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="calculation_formula" label="计算公式">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="change_reason" label="变更原因">
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="版本历史"
        placement="right"
        open={historyVisible}
        onClose={() => setHistoryVisible(false)}
        width={500}
      >
        <Timeline>
          {historyData.map(h => (
            <Timeline.Item key={h.id}>
              <Space>
                <Tag color="blue">v{h.version}</Tag>
                <Text strong>{h.field_name}</Text>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">口径定义:</Text>
                <div>{h.caliber_definition}</div>
              </div>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">变更人:</Text> {h.changed_by}
              </div>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">变更原因:</Text> {h.change_reason}
              </div>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">{h.created_at}</Text>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Drawer>
    </div>
  );
}

export default FieldCalibers;
