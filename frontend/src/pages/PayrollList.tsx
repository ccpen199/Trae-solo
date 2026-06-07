import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, Descriptions, Row, Col, Statistic } from 'antd';
import { EyeOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Payroll } from '../types';
import type { ColumnsType } from 'antd/es/table';

const PayrollList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

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
    totalAmount: payrolls
      .filter(p => p.bankTransferStatus === 'completed')
      .reduce((sum, p) => sum + (p.netSalary || 0), 0)
  };

  const columns: ColumnsType<Payroll> = [
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
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200
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
      title: '发放时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/payrolls/${record.id}`)}
        >
          查看详情
        </Button>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={12} md={8}>
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
        <Col xs={12} md={8}>
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
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="累计实发"
              value={statistics.totalAmount}
              precision={2}
              suffix="元"
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="我的工资条" extra={<span style={{ color: '#8c8c8c' }}>共 {payrolls.length} 条记录</span>}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={payrolls}
            rowKey="id"
            scroll={{ x: 1600 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default PayrollList;
