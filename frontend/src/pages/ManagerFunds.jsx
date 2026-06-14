import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Modal, Descriptions, Progress, message, Card, Row, Col, Statistic } from 'antd';
import { TagOutlined, CheckCircleOutlined, ClockCircleOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { getFunds, releaseFund, getProjects } from '../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const ManagerFunds = () => {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentFund, setCurrentFund] = useState(null);

  const statusMap = {
    frozen: { color: 'default', text: '已冻结', icon: <LockOutlined /> },
    pending_release: { color: 'orange', text: '待释放', icon: <ClockCircleOutlined /> },
    released: { color: 'green', text: '已释放', icon: <UnlockOutlined /> }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadData();
  }, [projectFilter]);

  const loadProjects = async () => {
    const res = await getProjects({ pageSize: 100 });
    if (res.code === 200) {
      setProjects(res.data.list);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const res = await getFunds({
      project_id: projectFilter
    });
    if (res.code === 200) {
      setData(res.data);
    }
    setLoading(false);
  };

  const handleRelease = (record) => {
    Modal.confirm({
      title: '确认释放款项',
      content: `确定释放「${record.stage_name}」款项 ¥${record.amount?.toLocaleString()}？此操作不可撤销。`,
      okText: '确认释放',
      cancelText: '取消',
      onOk: async () => {
        const res = await releaseFund(record.id);
        if (res.code === 200) {
          message.success('款项已释放');
          loadData();
        }
      }
    });
  };

  const columns = [
    { title: '项目', dataIndex: 'project_title', key: 'project_title', ellipsis: true },
    { title: '阶段', dataIndex: 'stage_name', key: 'stage_name', width: 120 },
    { title: '金额(元)', dataIndex: 'amount', key: 'amount', width: 130, render: v => <span style={{ color: '#f5222d', fontWeight: 500 }}>¥{v?.toLocaleString()}</span> },
    { title: '付款比例', key: 'ratio', width: 100, render: (_, r) => `${r.payment_ratio}%` },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.icon} {statusMap[v]?.text}</Tag>
    },
    { title: '释放条件', dataIndex: 'release_condition', key: 'condition', ellipsis: true },
    { title: '释放时间', dataIndex: 'released_at', key: 'released_at', width: 160, render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => { setCurrentFund(record); setDetailVisible(true); }}>
            详情
          </Button>
          {record.status === 'pending_release' && (
            <Button type="primary" size="small" icon={<UnlockOutlined />} onClick={() => handleRelease(record)}>
              释放
            </Button>
          )}
        </Space>
      )
    }
  ];

  const projectGroups = {};
  data.forEach(item => {
    if (!projectGroups[item.project_title]) {
      projectGroups[item.project_title] = [];
    }
    projectGroups[item.project_title].push(item);
  });

  const totalFrozen = data.filter(i => i.status === 'frozen').reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = data.filter(i => i.status === 'pending_release').reduce((s, i) => s + (i.amount || 0), 0);
  const totalReleased = data.filter(i => i.status === 'released').reduce((s, i) => s + (i.amount || 0), 0);
  const totalAmount = data.reduce((s, i) => s + (i.amount || 0), 0);
  const releaseProgress = totalAmount > 0 ? Math.round((totalReleased / totalAmount) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <TagOutlined style={{ marginRight: 8 }} />
          资金监管
        </Title>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff', fontSize: 12 }}>合同总额</span>}
              value={totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff', fontSize: 12 }}>已冻结</span>}
              value={totalFrozen}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff', fontSize: 12 }}>待释放</span>}
              value={totalPending}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff', fontSize: 12 }}>已释放</span>}
              value={totalReleased}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ flexShrink: 0 }}>整体释放进度:</span>
          <Progress percent={releaseProgress} style={{ flex: 1 }} />
          <span style={{ flexShrink: 0, fontWeight: 500 }}>{releaseProgress}%</span>
        </div>
      </Card>

      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择项目"
          allowClear
          style={{ width: 300 }}
          value={projectFilter || undefined}
          onChange={v => setProjectFilter(v || '')}
          options={projects.map(p => ({ label: p.title, value: p.id }))}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="资金监管详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentFund && (
          <div>
            <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#888' }}>阶段</div>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>{currentFund.stage_name}</div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#888' }}>金额</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#f5222d' }}>¥{currentFund.amount?.toLocaleString()}</div>
                </Col>
              </Row>
            </div>

            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="所属项目">{currentFund.project_title}</Descriptions.Item>
              <Descriptions.Item label="付款比例">{currentFund.payment_ratio}%</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                <Tag color={statusMap[currentFund.status]?.color}>
                  {statusMap[currentFund.status]?.icon} {statusMap[currentFund.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="释放条件" span={2}>{currentFund.release_condition}</Descriptions.Item>
              {currentFund.paid_at && (
                <Descriptions.Item label="付款时间">{dayjs(currentFund.paid_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              )}
              {currentFund.released_at && (
                <Descriptions.Item label="释放时间">{dayjs(currentFund.released_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              )}
              {currentFund.remark && (
                <Descriptions.Item label="备注" span={2}>{currentFund.remark}</Descriptions.Item>
              )}
            </Descriptions>

            {currentFund.status === 'pending_release' && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Button type="primary" size="large" icon={<UnlockOutlined />} onClick={() => { setDetailVisible(false); handleRelease(currentFund); }}>
                  释放款项
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerFunds;
