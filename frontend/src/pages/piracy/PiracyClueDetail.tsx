import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Table, Row, Col, Statistic, Divider, Empty, List, Timeline } from 'antd';
import { ArrowLeftOutlined, FileProtectOutlined, UserOutlined, ClockCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { piracyApi } from '../../services/api';
import dayjs from 'dayjs';

const PiracyClueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [clue, setClue] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await piracyApi.detail(Number(id));
      setClue(res.data);
    } catch (error) {
      console.error('加载线索详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const priorityMap: Record<string, { color: string; text: string }> = {
    low: { color: 'green', text: '低' },
    medium: { color: 'blue', text: '中' },
    high: { color: 'orange', text: '高' },
    urgent: { color: 'red', text: '紧急' },
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'default', text: '待处理' },
    investigating: { color: 'processing', text: '调查中' },
    confirmed: { color: 'warning', text: '已确认' },
    processing: { color: 'processing', text: '处理中' },
    resolved: { color: 'success', text: '已解决' },
    closed: { color: 'default', text: '已关闭' },
  };

  const sourceMap: Record<string, string> = {
    manual: '手动录入',
    crawl: '爬虫发现',
    report: '用户举报',
    monitoring: '监控发现',
    other: '其他',
  };

  const caseColumns = [
    {
      title: '案件编号',
      dataIndex: 'case_no',
      key: 'case_no',
      width: 130,
      render: (text: string, record: any) => (
        <Button type="link" onClick={() => navigate(`/enforcement/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '案件类型',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          takedown: '下架维权',
          compensation: '赔偿诉讼',
          administrative: '行政投诉',
          criminal: '刑事报案',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const caseStatusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '待处理' },
          investigating: { color: 'processing', text: '调查中' },
          negotiating: { color: 'processing', text: '协商中' },
          litigating: { color: 'processing', text: '诉讼中' },
          settled: { color: 'success', text: '已和解' },
          won: { color: 'success', text: '胜诉' },
          lost: { color: 'error', text: '败诉' },
          closed: { color: 'default', text: '已结案' },
        };
        const cfg = caseStatusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const evidenceColumns = [
    {
      title: '证据类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          screenshot: '截图',
          video: '录屏',
          document: '文档',
          other: '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '证据描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '采集时间',
      dataIndex: 'collected_at',
      key: 'collected_at',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
  ];

  if (!clue && !loading) {
    return <Empty description="线索不存在" />;
  }

  const priorityCfg = priorityMap[clue?.priority] || { color: 'default', text: clue?.priority };
  const statusCfg = statusMap[clue?.status] || { color: 'default', text: clue?.status };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/piracy')} style={{ padding: 0 }}>
            返回列表
          </Button>
          <h1 className="page-title" style={{ marginTop: 8 }}>线索详情</h1>
          <p className="page-description">线索编号: {clue?.clue_no}</p>
        </div>
        <Space>
          <Tag color={priorityCfg.color} style={{ fontSize: 14, padding: '4px 12px' }}>
            优先级: {priorityCfg.text}
          </Tag>
          <Tag color={statusCfg.color} style={{ fontSize: 14, padding: '4px 12px' }}>
            {statusCfg.text}
          </Tag>
          <Button type="primary" onClick={() => navigate(`/piracy/${id}/edit`)}>编辑线索</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="线索信息" size="small" loading={loading}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="线索编号">{clue?.clue_no}</Descriptions.Item>
              <Descriptions.Item label="来源">{sourceMap[clue?.source] || clue?.source}</Descriptions.Item>
              <Descriptions.Item label="相关课程">
                {clue?.course ? (
                  <Button type="link" onClick={() => navigate(`/courses/${clue.course.id}`)}>
                    {clue.course.name}
                  </Button>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="侵权平台">{clue?.infringing_platform || '-'}</Descriptions.Item>
              <Descriptions.Item label="发现时间">
                {clue?.discovered_at ? dayjs(clue.discovered_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                {clue?.assignee?.username || '未分配'}
              </Descriptions.Item>
              <Descriptions.Item label="侵权链接" span={2}>
                {clue?.infringing_url ? (
                  <Space>
                    <LinkOutlined />
                    <Button type="link" href={clue.infringing_url} target="_blank">
                      {clue.infringing_url}
                    </Button>
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="线索描述" span={2}>
                {clue?.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="关联维权案件" size="small" style={{ marginTop: 16 }} loading={loading}>
            <Table
              dataSource={clue?.enforcement_cases || []}
              columns={caseColumns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无关联案件' }}
            />
            {clue?.enforcement_cases?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Button type="primary" icon={<FileProtectOutlined />}>
                  发起维权
                </Button>
              </div>
            )}
          </Card>

          <Card title="证据材料" size="small" style={{ marginTop: 16 }} loading={loading}>
            <Table
              dataSource={clue?.evidences || []}
              columns={evidenceColumns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无证据材料' }}
            />
          </Card>

          <Card title="处理进度" size="small" style={{ marginTop: 16 }} loading={loading}>
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>线索创建</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {clue?.created_at ? dayjs(clue.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: clue?.status !== 'pending' ? 'blue' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>开始调查</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {clue?.investigated_at ? dayjs(clue.investigated_at).format('YYYY-MM-DD HH:mm') : '待处理'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: ['confirmed', 'processing', 'resolved', 'closed'].includes(clue?.status) ? 'orange' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>侵权确认</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {clue?.confirmed_at ? dayjs(clue.confirmed_at).format('YYYY-MM-DD HH:mm') : '待确认'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: ['processing', 'resolved', 'closed'].includes(clue?.status) ? 'purple' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>维权处理</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {clue?.enforced_at ? dayjs(clue.enforced_at).format('YYYY-MM-DD HH:mm') : '待处理'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: ['resolved', 'closed'].includes(clue?.status) ? 'green' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>处理完成</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {clue?.resolved_at ? dayjs(clue.resolved_at).format('YYYY-MM-DD HH:mm') : '待完成'}
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="调查时长"
                  value={clue?.investigation_days || 0}
                  suffix="天"
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="关联案件"
                  value={clue?.enforcement_cases?.length || 0}
                  prefix={<FileProtectOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {clue?.reporter && (
            <Card title="举报人信息" size="small" style={{ marginTop: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="姓名">{clue.reporter.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系方式">{clue.reporter.contact || '-'}</Descriptions.Item>
                <Descriptions.Item label="举报时间">
                  {clue.reporter.reported_at ? dayjs(clue.reporter.reported_at).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Card title="相关操作" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block>
                更新状态
              </Button>
              <Button block>
                分配处理人
              </Button>
              <Button block type="primary" icon={<FileProtectOutlined />}>
                发起维权
              </Button>
              <Button block>
                上传证据
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PiracyClueDetail;
