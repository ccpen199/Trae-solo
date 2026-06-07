import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Row, Col, Statistic, Progress, Timeline, Empty, Tooltip, Select, Input, Tabs } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { declarationAPI } from '../../services/api';

const { TabPane } = Tabs;
const { Search } = Input;

function DeclarationList() {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [statusStats, setStatusStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    loadDeclarations();
  }, [activeTab]);

  const loadDeclarations = async () => {
    setLoading(true);
    try {
      const statusMap = {
        all: undefined,
        pending: 'pending',
        reviewing: 'reviewing',
        approved: 'approved',
        rejected: 'rejected'
      };
      const [listRes, statsRes] = await Promise.all([
        declarationAPI.getList({
          pageSize: 10,
          status: statusMap[activeTab]
        }),
        declarationAPI.getStatusStats()
      ]);
      setDeclarations(listRes.data.list);
      setStatusStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const configs = {
      pending: { color: 'orange', text: '待审核', icon: <ClockCircleOutlined /> },
      reviewing: { color: 'blue', text: '审核中', icon: <ClockCircleOutlined /> },
      approved: { color: 'green', text: '已通过', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: '已驳回', icon: <CloseCircleOutlined /> }
    };
    const cfg = configs[status] || { color: 'default', text: status };
    return <Tag icon={cfg.icon} color={cfg.color}>{cfg.text}</Tag>;
  };

  const columns = [
    {
      title: '申报编号',
      dataIndex: 'declarationNo',
      key: 'declarationNo',
      width: 160,
      render: (text) => <code style={{ color: '#1890ff' }}>{text}</code>
    },
    {
      title: '政策名称',
      dataIndex: 'policyTitle',
      key: 'policyTitle',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            {record.policyCode}
          </div>
        </div>
      )
    },
    {
      title: '申报企业',
      dataIndex: 'enterpriseName',
      key: 'enterpriseName',
      width: 180
    },
    {
      title: '申报状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: '申报进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 200,
      render: (progress, record) => (
        <Tooltip title={`当前阶段：${record.currentStage || '材料审核'}`}>
          <Progress 
            percent={progress || 0} 
            size="small"
            status={record.status === 'rejected' ? 'exception' : 'active'}
          />
        </Tooltip>
      )
    },
    {
      title: '申报时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}>
            查看
          </Button>
          {(record.status === 'pending' || record.status === 'reviewing') && (
            <Button type="link" size="small" danger>
              撤回
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card title="我的申报" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="总申报数"
                value={statusStats.total}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="待审核"
                value={statusStats.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="审核中"
                value={statusStats.reviewing}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="已通过"
                value={statusStats.approved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="已驳回"
                value={statusStats.rejected}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="通过率"
                value={statusStats.total ? Math.round(statusStats.approved / statusStats.total * 100) : 0}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card>
        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
          <Col flex={1}>
            <Search
              placeholder="搜索申报编号、政策名称"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ maxWidth: 400 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="申报年份"
              allowClear
              style={{ width: 120 }}
            >
              <Select.Option value="2024">2024年</Select.Option>
              <Select.Option value="2023">2023年</Select.Option>
              <Select.Option value="2022">2022年</Select.Option>
            </Select>
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="全部申报" key="all" />
          <TabPane tab="待审核" key="pending" />
          <TabPane tab="审核中" key="reviewing" />
          <TabPane tab="已通过" key="approved" />
          <TabPane tab="已驳回" key="rejected" />
        </Tabs>

        {declarations.length === 0 ? (
          <Empty description="暂无申报数据" />
        ) : (
          <Table
            columns={columns}
            dataSource={declarations}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '0 24px' }}>
                  <Row gutter={24}>
                    <Col span={16}>
                      <h4 style={{ marginBottom: 16 }}>审核进度追踪</h4>
                      <Timeline>
                        {(record.timeline || [
                          { time: record.submitTime, title: '提交申报', color: 'green' },
                          { time: '2024-01-15 10:30', title: '材料初审', color: record.progress >= 30 ? 'blue' : 'gray' },
                          { time: record.status === 'rejected' ? '2024-01-16 14:00' : '-', title: record.status === 'rejected' ? '审核驳回' : '部门复核', color: record.status === 'rejected' ? 'red' : (record.progress >= 60 ? 'blue' : 'gray') },
                          { time: record.status === 'approved' ? '2024-01-20 09:00' : '-', title: '审核通过', color: record.status === 'approved' ? 'green' : 'gray' }
                        ]).map((item, idx) => (
                          <Timeline.Item key={idx} color={item.color}>
                            <p style={{ margin: 0 }}>{item.title}</p>
                            <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{item.time}</p>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </Col>
                    <Col span={8}>
                      <h4 style={{ marginBottom: 16 }}>申报详情</h4>
                      <div style={{ fontSize: 13, lineHeight: 2 }}>
                        <p><strong>联系人：</strong>{record.contactPerson || '张三'}</p>
                        <p><strong>联系电话：</strong>{record.contactPhone || '138****8888'}</p>
                        <p><strong>申报金额：</strong>{record.applyAmount ? `${record.applyAmount.toLocaleString()} 元` : '50 万元'}</p>
                        {record.rejectReason && (
                          <div style={{ background: '#fff1f0', padding: 12, borderRadius: 4, marginTop: 12 }}>
                            <p style={{ margin: 0, color: '#ff4d4f' }}>
                              <strong>驳回原因：</strong>
                            </p>
                            <p style={{ margin: '4px 0 0 0' }}>{record.rejectReason}</p>
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>
              )
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default DeclarationList;
