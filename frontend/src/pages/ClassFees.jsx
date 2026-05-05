import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Spin,
  Empty,
  Row,
  Col,
  Card,
  Statistic,
  message,
  Modal,
  Form,
  Input,
  Space
} from 'antd';
import { PlusOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { classFeeApi } from '../services/api';
import { useUserStore } from '../store/userStore';
import dayjs from 'dayjs';

const ClassFees = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [incomeForm] = Form.useForm();
  const [expenseForm] = Form.useForm();
  const { isMonitor } = useUserStore();
  const canManage = isMonitor();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listResult, summaryResult] = await Promise.all([
        classFeeApi.getList({}),
        classFeeApi.getSummary({})
      ]);
      setData(listResult.data.list);
      setSummary(summaryResult.data);
    } catch (error) {
      console.error('Failed to fetch class fees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddIncome = async (values) => {
    try {
      await classFeeApi.addIncome(values);
      message.success('收入记录已添加');
      setIncomeModalVisible(false);
      incomeForm.resetFields();
      fetchData();
    } catch (error) {
      console.error('Failed to add income:', error);
    }
  };

  const handleAddExpense = async (values) => {
    try {
      await classFeeApi.addExpense(values);
      message.success('支出记录已添加');
      setExpenseModalVisible(false);
      expenseForm.resetFields();
      fetchData();
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const columns = [
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span className={amount > 0 ? 'income-amount' : 'expense-amount'}>
          {amount > 0 ? '+' : ''}{amount} 元
        </span>
      )
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => <span>¥ {balance}</span>
    },
    {
      title: '操作人',
      dataIndex: ['operator', 'name'],
      key: 'operator',
      render: (text) => text || '-'
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>班费管理</h2>
        {canManage && (
          <Space>
            <Button
              type="primary"
              icon={<ArrowUpOutlined />}
              onClick={() => setIncomeModalVisible(true)}
            >
              收入
            </Button>
            <Button
              danger
              icon={<ArrowDownOutlined />}
              onClick={() => setExpenseModalVisible(true)}
            >
              支出
            </Button>
          </Space>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="当前余额"
              value={summary?.currentBalance || 0}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
              icon={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总收入"
              value={summary?.totalIncome || 0}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总支出"
              value={summary?.totalExpense || 0}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : data.length > 0 ? (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="暂无班费记录" />
        )}
      </div>

      <Modal
        title="添加收入"
        open={incomeModalVisible}
        onCancel={() => setIncomeModalVisible(false)}
        footer={null}
      >
        <Form
          form={incomeForm}
          layout="vertical"
          onFinish={handleAddIncome}
          className="form-modal"
        >
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <Input.Number style={{ width: '100%' }} placeholder="请输入收入金额" min={0} />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入收入描述" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIncomeModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加支出"
        open={expenseModalVisible}
        onCancel={() => setExpenseModalVisible(false)}
        footer={null}
      >
        <Form
          form={expenseForm}
          layout="vertical"
          onFinish={handleAddExpense}
          className="form-modal"
        >
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <Input.Number style={{ width: '100%' }} placeholder="请输入支出金额" min={0} />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入支出描述" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setExpenseModalVisible(false)}>取消</Button>
              <Button type="primary" danger htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassFees;
