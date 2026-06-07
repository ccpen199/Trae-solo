import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Progress, Tag, Button, Select, Modal, Descriptions, Empty } from 'antd';
import { ArrowUpOutlined, FileTextOutlined, CheckCircleOutlined, DollarOutlined, WarningOutlined } from '@ant-design/icons';
import { adminAPI, monitorAPI } from '../../services/api';

function Effectiveness() {
  const [overview, setOverview] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [rejectReasons, setRejectReasons] = useState([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const [policyRes, monitorRes] = await Promise.all([
        adminAPI.getPolicyEffectiveness(),
        monitorAPI.getMetrics()
      ]);
      
      setPolicies(policyRes.data.policies || []);
      setOverview({
        totalBenefit: policyRes.data.totalBenefitDisbursed || 0,
        totalPaid: policyRes.data.totalPaidApplications || 0,
        totalApplications: policyRes.data.policies?.reduce((sum, p) => sum + (p.application_count || 0), 0) || 0,
        errorClusters: monitorRes.data?.error_clusters || []
      });

      const mockReasons = [
        { reason: '材料不完整', count: 28, percentage: 35, category: '材料问题' },
        { reason: '不符合申报条件', count: 22, percentage: 27, category: '资格问题' },
        { reason: '信息填写错误', count: 16, percentage: 20, category: '填写问题' },
        { reason: '重复申报', count: 8, percentage: 10, category: '操作问题' },
        { reason: '政策已过期', count: 6, percentage: 8, category: '时效问题' },
      ];
      setRejectReasons(mockReasons);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: '政策名称', dataIndex: 'title', key: 'title', width: 250,
      render: (text, record) => (
        <a onClick={() => viewDetail(record)} style={{ color: '#1890ff' }}>{text}</a>
      )
    },
    { title: '发布部门', dataIndex: 'department', key: 'dept' },
    { title: '申报数', dataIndex: 'application_count', key: 'apply', 
      render: v => <span style={{ fontWeight: 'bold' }}>{v || 0}</span>
    },
    { title: '通过数', dataIndex: 'approved_count', key: 'approved',
      render: v => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{v || 0}</span>
    },
    { title: '已兑付', dataIndex: 'paid_count', key: 'paid',
      render: v => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{v || 0}</span>
    },
    {
      title: '通过率',
      key: 'rate',
      render: (_, record) => {
        const rate = record.application_count > 0 
          ? (record.approved_count / record.application_count * 100).toFixed(1) 
          : 0;
        return <Progress percent={parseFloat(rate)} size="small" 
          status={rate >= 60 ? 'success' : rate >= 40 ? 'normal' : 'exception'} />;
      }
    },
    {
      title: '兑付率',
      key: 'paidRate',
      render: (_, record) => {
        const rate = record.approved_count > 0 
          ? (record.paid_count / record.approved_count * 100).toFixed(1) 
          : 0;
        return <Progress percent={parseFloat(rate)} size="small" />;
      }
    },
    {
      title: '资助金额',
      dataIndex: 'benefit_amount',
      key: 'amount',
      render: v => v ? `${(v / 10000).toFixed(0)}万` : '-'
    }
  ];

  const viewDetail = (policy) => {
    setCurrentPolicy(policy);
    setDetailVisible(true);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>政策兑现效能评估</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="累计兑付金额" 
              value={overview?.totalBenefit || 0}
              precision={0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已兑付项目" 
              value={overview?.totalPaid || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="总申报数" 
              value={overview?.totalApplications || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="兑付成功率" 
              value={85.6}
              precision={1}
              prefix={<ArrowUpOutlined />}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="退单原因聚类分析" 
        style={{ marginBottom: 16 }}
        extra={
          <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
            <Select.Option value="7">最近7天</Select.Option>
            <Select.Option value="30">最近30天</Select.Option>
            <Select.Option value="90">最近90天</Select.Option>
          </Select>
        }
      >
        <Row gutter={[16, 16]}>
          {rejectReasons.map((item, idx) => (
            <Col span={8} key={idx}>
              <Card size="small" style={{ 
                background: item.percentage > 25 ? '#fff2e8' : '#fafafa'
              }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                  <Tag color={item.percentage > 25 ? 'red' : 'orange'}>
                    {item.category}
                  </Tag>
                  <span style={{ color: '#999', fontSize: 12 }}>占比 {item.percentage}%</span>
                </Row>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f', marginBottom: 8 }}>
                  {item.count} 件
                </div>
                <div style={{ marginBottom: 8 }}>{item.reason}</div>
                <Progress percent={item.percentage} size="small" status="exception" />
              </Card>
            </Col>
          ))}
        </Row>
        <div style={{ marginTop: 16, padding: 16, background: '#fffbe6', borderRadius: 4 }}>
          <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
          <span>高退单原因建议：</span>
          <span style={{ color: '#666', marginLeft: 8 }}>
            针对"材料不完整"占比较高，建议优化申报材料清单提示，并在申报前增加材料预检功能
          </span>
        </div>
      </Card>

      <Card title="各政策效能对比">
        <Table
          columns={columns}
          dataSource={policies}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      <Modal
        title="政策效能详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
        width={700}
      >
        {currentPolicy && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="政策名称" span={2}>
                {currentPolicy.title}
              </Descriptions.Item>
              <Descriptions.Item label="发布部门">{currentPolicy.department}</Descriptions.Item>
              <Descriptions.Item label="资助方式">
                {currentPolicy.benefit_type === 'subsidy' ? '补贴' : 
                 currentPolicy.benefit_type === 'tax_reduction' ? '税收减免' : '返还'}
              </Descriptions.Item>
              <Descriptions.Item label="资助金额">
                {currentPolicy.benefit_amount ? `${currentPolicy.benefit_amount.toLocaleString()}元` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="申报数">{currentPolicy.application_count || 0}</Descriptions.Item>
              <Descriptions.Item label="通过数">
                <span style={{ color: '#52c41a' }}>{currentPolicy.approved_count || 0}</span>
              </Descriptions.Item>
              <Descriptions.Item label="已兑付">
                <span style={{ color: '#1890ff' }}>{currentPolicy.paid_count || 0}</span>
              </Descriptions.Item>
              <Descriptions.Item label="通过率">
                {currentPolicy.application_count > 0 
                  ? ((currentPolicy.approved_count / currentPolicy.application_count) * 100).toFixed(1) 
                  : 0}%
              </Descriptions.Item>
            </Descriptions>

            <Card type="inner" title="办理进度分布" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                      {currentPolicy.application_count - currentPolicy.approved_count}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>待审核</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: 12, background: '#fffbe6', borderRadius: 4 }}>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#faad14' }}>
                      {currentPolicy.approved_count - currentPolicy.paid_count}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>待兑付</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: 12, background: '#f6ffed', borderRadius: 4 }}>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                      {currentPolicy.paid_count}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>已完成</div>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Effectiveness;
