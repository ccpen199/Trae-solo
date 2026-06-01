import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, Space, message, Tag, Tabs, Row, Col } from 'antd';
import { PlusOutlined, PhoneOutlined, MessageOutlined, MailOutlined } from '@ant-design/icons';
import { touchApi, customersApi, productsApi, segmentsApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function Touch() {
  const [list, setList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadCustomers();
    loadProducts();
    loadSegments();
  }, [pagination.current, pagination.pageSize, filterStatus]);

  const loadData = async () => {
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize
      };
      if (filterStatus) {
        params.follow_up_status = filterStatus;
      }
      const res = await touchApi.getList(params);
      setList(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (error) {
      message.error('加载失败');
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await customersApi.getList({ pageSize: 100 });
      setCustomers(res.data.data);
    } catch (error) {
      message.error('加载客户失败');
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productsApi.getList({ active_only: true });
      setProducts(res.data.data);
    } catch (error) {
      message.error('加载产品失败');
    }
  };

  const loadSegments = async () => {
    try {
      const res = await segmentsApi.getRules();
      setSegments(res.data.data);
    } catch (error) {
      message.error('加载客群失败');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await touchApi.create(values);
      message.success('记录成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleUpdateFollowUp = async (id, status) => {
    try {
      await touchApi.updateFollowUp(id, { follow_up_status: status });
      message.success('更新成功');
      loadData();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const columns = [
    { title: '客户', dataIndex: 'name', key: 'name', width: 100 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '产品', dataIndex: 'product_name', key: 'product_name', width: 120 },
    { title: '渠道', dataIndex: 'channel', key: 'channel', width: 100,
      render: (v) => {
        const icons = { '电话': <PhoneOutlined />, '短信': <MessageOutlined />, '站内信': <MailOutlined /> };
        return <Tag>{icons[v]} {v}</Tag>;
      }
    },
    { title: '触达结果', dataIndex: 'result', key: 'result', width: 100,
      render: (v) => {
        const colors = { '已申请': 'green', '待跟进': 'blue', '未接通': 'orange', '客户拒绝': 'red' };
        return <Tag color={colors[v]}>{v}</Tag>;
      }
    },
    { title: '跟进状态', dataIndex: 'follow_up_status', key: 'follow_up_status', width: 100,
      render: (v) => {
        const colors = { '待处理': 'red', '处理中': 'orange', '已完成': 'green' };
        return <Tag color={colors[v]}>{v}</Tag>;
      }
    },
    { title: '坐席', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '时间', dataIndex: 'touch_time', key: 'touch_time', width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  ];

  const queueColumns = [
    ...columns.slice(0, 7),
    { title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space>
          {record.follow_up_status === '待处理' && (
            <Button size="small" type="primary" onClick={() => handleUpdateFollowUp(record.id, '处理中')}>开始处理</Button>
          )}
          {record.follow_up_status === '处理中' && (
            <Button size="small" type="primary" onClick={() => handleUpdateFollowUp(record.id, '已完成')}>完成</Button>
          )}
        </Space>
      )
    },
  ];

  const tabItems = [
    { key: 'all', label: '全部记录' },
    { key: 'pending', label: '待处理' },
    { key: 'processing', label: '处理中' },
    { key: 'done', label: '已完成' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>触达记录</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增触达</Button>
      </div>

      <Tabs activeKey={activeTab} items={tabItems} onChange={(key) => {
        setActiveTab(key);
        setFilterStatus(key === 'all' ? null : key === 'pending' ? '待处理' : key === 'processing' ? '处理中' : '已完成');
      }} />

      <Table columns={activeTab === 'all' ? columns : queueColumns} dataSource={list} rowKey="id"
        pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: total => `共 ${total} 条` }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal title="新增触达记录" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="customer_id" label="选择客户" rules={[{ required: true }]}>
            <Select showSearch placeholder="搜索客户">
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.name} - {c.card_no}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="product_id" label="推荐产品">
                <Select placeholder="选择产品">
                  {products.filter(p => p.is_active).map(p => (
                    <Option key={p.id} value={p.id}>{p.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="segment_rule_id" label="所属客群">
                <Select placeholder="选择客群规则">
                  {segments.map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="channel" label="触达渠道" rules={[{ required: true }]}>
                <Select>
                  <Option value="电话">电话</Option>
                  <Option value="短信">短信</Option>
                  <Option value="站内信">站内信</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="result" label="触达结果" rules={[{ required: true }]}>
                <Select>
                  <Option value="未接通">未接通</Option>
                  <Option value="客户拒绝">客户拒绝</Option>
                  <Option value="待跟进">待跟进</Option>
                  <Option value="已申请">已申请</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="follow_up_status" label="跟进状态" initialValue="待处理">
                <Select>
                  <Option value="待处理">待处理</Option>
                  <Option value="处理中">处理中</Option>
                  <Option value="已完成">已完成</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="operator" label="操作人" initialValue="坐席">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Touch;
