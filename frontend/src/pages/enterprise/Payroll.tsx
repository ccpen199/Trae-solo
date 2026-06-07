import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, DatePicker, Statistic, Row, Col, Select, Modal, Form, Input } from 'antd';
import { PlusOutlined, EyeOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import type { Payroll as PayrollType } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { MonthPicker } = DatePicker;
const { Option } = Select;

const Payroll: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [payrolls, setPayrolls] = useState<PayrollType[]>([]);
  const [generateMonth, setGenerateMonth] = useState<Dayjs>(dayjs());
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollType | null>(null);
  const [transferForm] = Form.useForm();

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await api.payrolls.getMy();
      setPayrolls(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取工资条列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.payrolls.generate({
        year: generateMonth.year(),
        month: generateMonth.month() + 1
      });
      message.success('工资条生成成功');
      fetchPayrolls();
    } catch (error: any) {
      message.error(error.response?.data?.error || '工资条生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateTransfer = async (values: any) => {
    if (!selectedPayroll) return;
    try {
      await api.payrolls.updateTransfer(selectedPayroll.id, values);
      message.success('银行代发状态更新成功');
      setTransferModalVisible(false);
      transferForm.resetFields();
      fetchPayrolls();
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  const openTransferModal = (record: PayrollType) => {
    setSelectedPayroll(record);
    transferForm.setFieldsValue({
      bankTransferStatus: record.bankTransferStatus,
      bankTransferId: record.bankTransferId || ''
    });
    setTransferModalVisible(true);
  };

  const getTransferStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待发放',
      processing: '发放中',
      completed: '已发放',
      failed: '发放失败'
    };
    return map[status] || status;
  };

  const getTransferStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'orange',
      processing: 'blue',
      completed: 'green',
      failed: 'red'
    };
    return map[status] || 'default';
  };

  const statistics = {
    total: payrolls.length,
    completed: payrolls.filter(p => p.bankTransferStatus === 'completed').length,
    pending: payrolls.filter(p => p.bankTransferStatus === 'pending').length,
    totalAmount: payrolls
      .filter(p => p.bankTransferStatus === 'completed')
      .reduce((sum, p) => sum + (p.netSalary || 0), 0)
  };

  const columns: ColumnsType<PayrollType> = [
    {
      title: '账期',
      key: 'period',
      width: 120,
      render: (_, record) => (
        <div style={{ fontWeight: 'bold' }}>
          {record.periodYear}年{record.periodMonth}月
        </div>
      )
    },
    {
      title: '工人信息',
      key: 'worker',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.workerName || record.workerUsername || '-'}</div>
          <div style={{ color: '#8c8c8c', fontSize: '12px' }}>{record.workerPhone || ''}</div>
        </div>
      )
    },
    {
      title: '所属项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      key: 'contractNo',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: '基本工资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 120,
      render: (amount) => `¥${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: '加班费',
      dataIndex: 'overtimePay',
      key: 'overtimePay',
      width: 120,
      render: (amount) => `¥${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: '奖金',
      dataIndex: 'bonus',
      key: 'bonus',
      width: 120,
      render: (amount) => `¥${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: '扣款',
      dataIndex: 'deductions',
      key: 'deductions',
      width: 120,
      render: (amount) => amount ? `-¥${amount.toFixed(2)}` : '¥0.00'
    },
    {
      title: '社保',
      dataIndex: 'socialSecurity',
      key: 'socialSecurity',
      width: 120,
      render: (amount) => amount ? `-¥${amount.toFixed(2)}` : '¥0.00'
    },
    {
      title: '实发工资',
      dataIndex: 'netSalary',
      key: 'netSalary',
      width: 150,
      render: (amount) => (
        <span style={{ fontWeight: 'bold', color: '#f5222d', fontSize: '16px' }}>
          ¥{amount?.toFixed(2) || '0.00'}
        </span>
      )
    },
    {
      title: '发放状态',
      dataIndex: 'bankTransferStatus',
      key: 'bankTransferStatus',
      width: 120,
      render: (status) => (
        <Tag color={getTransferStatusColor(status)}>
          {getTransferStatusText(status)}
        </Tag>
      )
    },
    {
      title: '银行流水号',
      dataIndex: 'bankTransferId',
      key: 'bankTransferId',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '已查看',
      dataIndex: 'workerViewed',
      key: 'workerViewed',
      width: 100,
      render: (viewed) => (
        <Tag color={viewed ? 'green' : 'orange'}>
          {viewed ? '已查看' : '未查看'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/payrolls/${record.id}`)}
          >
            查看
          </Button>
          {record.bankTransferStatus !== 'completed' && (
            <Button
              type="link"
              icon={<SendOutlined />}
              onClick={() => openTransferModal(record)}
            >
              更新状态
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="工资条总数"
              value={statistics.total}
              suffix="条"
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="已发放"
              value={statistics.completed}
              suffix="条"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="待发放"
              value={statistics.pending}
              suffix="条"
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="累计实发"
              value={statistics.totalAmount}
              precision={2}
              suffix="元"
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="工资管理"
        extra={
          <Space>
            <span style={{ color: '#666' }}>生成月份：</span>
            <MonthPicker
              value={generateMonth}
              onChange={(value) => value && setGenerateMonth(value)}
              format="YYYY年MM月"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleGenerate}
              loading={generating}
            >
              生成工资条
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={payrolls}
            rowKey="id"
            scroll={{ x: 1800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="更新银行代发状态"
        open={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        footer={null}
      >
        <Form
          form={transferForm}
          layout="vertical"
          onFinish={handleUpdateTransfer}
        >
          <Form.Item
            name="bankTransferStatus"
            label="发放状态"
            rules={[{ required: true, message: '请选择发放状态' }]}
          >
            <Select placeholder="请选择发放状态">
              <Option value="pending">待发放</Option>
              <Option value="processing">发放中</Option>
              <Option value="completed">已发放</Option>
              <Option value="failed">发放失败</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="bankTransferId"
            label="银行流水号"
          >
            <Input placeholder="请输入银行流水号（可选）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认更新
              </Button>
              <Button onClick={() => setTransferModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Payroll;
