import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Space, message, Tag, Card, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined } from '@ant-design/icons';
import { productsApi, customersApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;

function Products() {
  const [list, setList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [calcVisible, setCalcVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [form] = Form.useForm();
  const [calcForm] = Form.useForm();

  useEffect(() => {
    loadList();
    loadCustomers();
  }, []);

  const loadList = async () => {
    try {
      const res = await productsApi.getList();
      setList(res.data.data);
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

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
      applicable_card_levels: record.applicable_card_levels ? JSON.parse(record.applicable_card_levels) : [],
      applicable_risk_levels: record.applicable_risk_levels ? JSON.parse(record.applicable_risk_levels) : []
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.start_date = values.start_date.toISOString();
      values.end_date = values.end_date.toISOString();
      
      if (editingId) {
        await productsApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await productsApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadList();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleCalculate = async () => {
    try {
      const values = await calcForm.validateFields();
      const res = await productsApi.calculate(values);
      setCalculation(res.data.data);
    } catch (error) {
      message.error(error.response?.data?.message || '计算失败');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await productsApi.toggleStatus(id, !currentStatus);
      message.success('状态更新成功');
      loadList();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const columns = [
    { title: '产品名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '期数', dataIndex: 'periods', key: 'periods', width: 80 },
    { title: '基础费率', dataIndex: 'base_rate', key: 'base_rate', width: 100, render: (v) => `${(v * 100).toFixed(2)}%` },
    { title: '优惠费率', dataIndex: 'preferential_rate', key: 'preferential_rate', width: 100, render: (v) => v ? `${(v * 100).toFixed(2)}%` : '无' },
    { title: '金额范围', key: 'amount', width: 180, render: (_, r) => `¥${(r.min_amount || 0).toLocaleString()} - ¥${(r.max_amount || 0).toLocaleString()}` },
    { title: '有效期', key: 'validity', width: 200, render: (_, r) => `${dayjs(r.start_date).format('YYYY-MM-DD')} 至 ${dayjs(r.end_date).format('YYYY-MM-DD')}` },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '停用'}</Tag> },
    { title: '操作', key: 'action', width: 220,
      render: (_, record) => (
        <Space>
          <Button icon={<CalculatorOutlined />} size="small" onClick={() => {
            calcForm.setFieldsValue({ product_id: record.id });
            setCalculation(null);
            setCalcVisible(true);
          }}>试算</Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" type={record.is_active ? 'default' : 'primary'}
            onClick={() => handleToggleStatus(record.id, record.is_active)}>
            {record.is_active ? '停用' : '启用'}
          </Button>
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>分期产品</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增产品</Button>
      </div>

      <Table columns={columns} dataSource={list} rowKey="id" />

      <Modal title={editingId ? '编辑产品' : '新增产品'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={700}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="产品名称" rules={[{ required: true }]}>
            <Input placeholder="请输入产品名称" />
          </Form.Item>
          <Form.Item name="periods" label="分期期数" rules={[{ required: true }]}>
            <Select>
              <Option value={3}>3期</Option>
              <Option value={6}>6期</Option>
              <Option value={9}>9期</Option>
              <Option value={12}>12期</Option>
              <Option value={18}>18期</Option>
              <Option value={24}>24期</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="base_rate" label="基础费率(%)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="preferential_rate" label="优惠费率(%)" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="留空则无优惠" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="min_amount" label="最小金额" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="max_amount" label="最大金额" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="start_date" label="开始日期" rules={[{ required: true }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="end_date" label="结束日期" rules={[{ required: true }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="applicable_card_levels" label="适用卡等级">
            <Select mode="multiple" placeholder="留空则全部适用">
              <Option value="普通">普通</Option>
              <Option value="金卡">金卡</Option>
              <Option value="白金">白金</Option>
              <Option value="钻石">钻石</Option>
            </Select>
          </Form.Item>
          <Form.Item name="applicable_risk_levels" label="适用风险等级">
            <Select mode="multiple" placeholder="留空则全部适用">
              <Option value="低">低</Option>
              <Option value="中">中</Option>
              <Option value="高">高</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="分期试算" open={calcVisible} onCancel={() => setCalcVisible(false)} footer={[
        <Button key="back" onClick={() => setCalcVisible(false)}>关闭</Button>,
        <Button key="submit" type="primary" onClick={handleCalculate}>计算</Button>
      ]}>
        <Form form={calcForm} layout="vertical">
          <Form.Item name="product_id" label="选择产品" rules={[{ required: true }]}>
            <Select>
              {list.filter(p => p.is_active).map(p => (
                <Option key={p.id} value={p.id}>{p.name} ({p.periods}期)</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="customer_id" label="选择客户（用于验证适用性）">
            <Select showSearch placeholder="可选择客户验证是否适用">
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.name} - {c.card_level}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="分期金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>

        {calculation && (
          <Card title="试算结果" style={{ marginTop: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="分期金额">{`¥${(calculation.amount || 0).toLocaleString()}`}</Descriptions.Item>
              <Descriptions.Item label="分期期数">{calculation.periods || 0}期</Descriptions.Item>
              <Descriptions.Item label="执行费率">{((calculation.rate || 0) * 100).toFixed(2)}%</Descriptions.Item>
              <Descriptions.Item label="每月还款">{`¥${(calculation.monthly_payment || 0).toLocaleString()}`}</Descriptions.Item>
              <Descriptions.Item label="每月手续费">{`¥${(calculation.monthly_fee || 0).toLocaleString()}`}</Descriptions.Item>
              <Descriptions.Item label="总手续费">{`¥${(calculation.total_fee || 0).toLocaleString()}`}</Descriptions.Item>
              <Descriptions.Item label="还款总额" span={2}>{`¥${(calculation.total_repayment || 0).toLocaleString()}`}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Modal>
    </div>
  );
}

export default Products;
