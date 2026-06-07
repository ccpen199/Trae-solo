import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Spin, message, Button, Tag, Space, Divider, Row, Col } from 'antd';
import { ArrowLeftOutlined, DollarOutlined, BankOutlined, FileTextOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Payroll } from '../types';

const PayrollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState<Payroll | null>(null);

  const fetchPayrollDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.payrolls.getDetail(parseInt(id));
      setPayroll(res.data);
      if (res.data && !res.data.workerViewed) {
        await api.payrolls.markViewed(parseInt(id));
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取工资条详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollDetail();
  }, [id]);

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

  if (!payroll) return null;

  const totalAdditions = (payroll.baseSalary || 0) + (payroll.overtimePay || 0) + (payroll.bonus || 0);
  const totalDeductions = (payroll.deductions || 0) + (payroll.socialSecurity || 0);

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/payrolls')}
        style={{ marginBottom: '16px' }}
      >
        返回工资条列表
      </Button>

      <Spin spinning={loading}>
        <Card
          title={
            <Space>
              <DollarOutlined />
              工资条 - {payroll.periodYear}年{payroll.periodMonth}月
              <Tag color={getTransferStatusColor(payroll.bankTransferStatus)}>
                {getTransferStatusText(payroll.bankTransferStatus)}
              </Tag>
              {payroll.workerViewed && <Tag color="green">已查看</Tag>}
            </Space>
          }
        >
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Card title="基本信息" type="inner" style={{ marginBottom: '16px' }}>
                <Descriptions column={1} size="middle">
                  <Descriptions.Item label="员工姓名">
                    {payroll.workerName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="企业名称">
                    {payroll.companyName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="所属项目">
                    {payroll.projectName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="合同编号">
                    {payroll.contractNo || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="合同期限">
                    {payroll.contractStart || '-'} 至 {payroll.contractEnd || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="工资账期">
                    {payroll.periodYear}年{payroll.periodMonth}月
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="收入明细" type="inner" style={{ marginBottom: '16px' }}>
                <Descriptions column={1} size="middle">
                  <Descriptions.Item label="基本工资">
                    <span style={{ color: '#52c41a' }}>+ ¥{payroll.baseSalary?.toFixed(2) || '0.00'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="加班费">
                    <span style={{ color: '#52c41a' }}>+ ¥{payroll.overtimePay?.toFixed(2) || '0.00'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="奖金">
                    <span style={{ color: '#52c41a' }}>+ ¥{payroll.bonus?.toFixed(2) || '0.00'}</span>
                  </Descriptions.Item>
                  <Divider style={{ margin: '8px 0' }} />
                  <Descriptions.Item label="收入合计">
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      ¥{totalAdditions.toFixed(2)}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="扣款明细" type="inner">
                <Descriptions column={1} size="middle">
                  <Descriptions.Item label="扣款">
                    <span style={{ color: '#f5222d' }}>- ¥{payroll.deductions?.toFixed(2) || '0.00'}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="社保">
                    <span style={{ color: '#f5222d' }}>- ¥{payroll.socialSecurity?.toFixed(2) || '0.00'}</span>
                  </Descriptions.Item>
                  <Divider style={{ margin: '8px 0' }} />
                  <Descriptions.Item label="扣款合计">
                    <span style={{ fontWeight: 'bold', color: '#f5222d' }}>
                      - ¥{totalDeductions.toFixed(2)}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <BankOutlined />
                    实发工资
                  </Space>
                }
                type="inner"
                style={{
                  marginBottom: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}
                headStyle={{ color: 'white', borderBottomColor: 'rgba(255,255,255,0.2)' }}
                bodyStyle={{ background: 'transparent' }}
              >
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                    实发工资
                  </div>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
                    ¥{payroll.netSalary?.toFixed(2) || '0.00'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {payroll.bankTransferStatus === 'completed'
                      ? '工资已发放至您的银行卡'
                      : '工资正在处理中，请耐心等待'}
                  </div>
                </div>
              </Card>

              <Card
                title={
                  <Space>
                    <FileTextOutlined />
                    发放信息
                  </Space>
                }
                type="inner"
                style={{ marginBottom: '16px' }}
              >
                <Descriptions column={1} size="middle">
                  <Descriptions.Item label="发放状态">
                    <Tag color={getTransferStatusColor(payroll.bankTransferStatus)}>
                      {getTransferStatusText(payroll.bankTransferStatus)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="银行流水号">
                    {payroll.bankTransferId || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {new Date(payroll.createdAt).toLocaleString('zh-CN')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card
                title="工资计算说明"
                type="inner"
                style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
              >
                <div style={{ lineHeight: '1.8', color: '#389e0d' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>计算公式：</p>
                  <p style={{ margin: 0 }}>
                    实发工资 = 基本工资 + 加班费 + 奖金 - 扣款 - 社保
                  </p>
                  <p style={{ margin: '8px 0 0 0' }}>
                    ¥{payroll.netSalary?.toFixed(2) || '0.00'} = ¥{payroll.baseSalary?.toFixed(2) || '0.00'} + ¥{payroll.overtimePay?.toFixed(2) || '0.00'} + ¥{payroll.bonus?.toFixed(2) || '0.00'} - ¥{payroll.deductions?.toFixed(2) || '0.00'} - ¥{payroll.socialSecurity?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </Card>

              {payroll.payslipFile && (
                <Card style={{ marginTop: '16px' }}>
                  <Button
                    type="primary"
                    block
                    icon={<FileTextOutlined />}
                    onClick={() => window.open(payroll.payslipFile, '_blank')}
                  >
                    下载工资条PDF
                  </Button>
                </Card>
              )}
            </Col>
          </Row>
        </Card>
      </Spin>
    </div>
  );
};

export default PayrollDetail;
