import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Table, Row, Col, Statistic, Divider, Empty, Timeline } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, SafetyCertificateOutlined, DownloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { materialApi } from '../../services/api';
import dayjs from 'dayjs';

const MaterialDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await materialApi.detail(Number(id));
      setMaterial(res.data);
    } catch (error) {
      console.error('加载素材详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const typeMap: Record<string, string> = {
    video: '视频',
    audio: '音频',
    image: '图片',
    document: '文档',
    other: '其他',
  };

  const authStatusMap: Record<string, { color: string; text: string }> = {
    authorized: { color: 'success', text: '已授权' },
    pending: { color: 'processing', text: '待授权' },
    unauthorized: { color: 'error', text: '未授权' },
    expired: { color: 'warning', text: '已过期' },
  };

  const authTypeMap: Record<string, string> = {
    exclusive: '独家授权',
    non_exclusive: '非独家授权',
    buyout: '买断',
  };

  const authRecordColumns = [
    {
      title: '授权类型',
      dataIndex: 'authorization_type',
      key: 'authorization_type',
      width: 120,
      render: (type: string) => authTypeMap[type] || type,
    },
    {
      title: '被授权方',
      dataIndex: 'authorized_party',
      key: 'authorized_party',
    },
    {
      title: '开始日期',
      dataIndex: 'authorization_start_date',
      key: 'authorization_start_date',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '结束日期',
      dataIndex: 'authorization_end_date',
      key: 'authorization_end_date',
      width: 120,
      render: (date: string) => {
        if (!date) return '-';
        const endDate = dayjs(date);
        const daysRemaining = endDate.diff(dayjs(), 'day');
        return (
          <Space>
            <span>{endDate.format('YYYY-MM-DD')}</span>
            {daysRemaining <= 30 && daysRemaining > 0 && (
              <Tag color="orange">剩余 {daysRemaining} 天</Tag>
            )}
            {daysRemaining <= 0 && (
              <Tag color="red">已过期</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'success', text: '有效' },
          expired: { color: 'warning', text: '已过期' },
          revoked: { color: 'error', text: '已撤销' },
        };
        const cfg = statusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '授权时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  if (!material && !loading) {
    return <Empty description="素材不存在" />;
  }

  const authCfg = authStatusMap[material?.authorization_status] || { color: 'default', text: material?.authorization_status };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/materials')} style={{ padding: 0 }}>
            返回列表
          </Button>
          <h1 className="page-title" style={{ marginTop: 8 }}>{material?.name}</h1>
          <p className="page-description">素材编号: {material?.material_code}</p>
        </div>
        <Space>
          <Tag color={authCfg.color} style={{ fontSize: 14, padding: '4px 12px' }}>{authCfg.text}</Tag>
          {material?.file_url && (
            <Button icon={<DownloadOutlined />} onClick={() => window.open(material.file_url)}>
              下载文件
            </Button>
          )}
          <Button type="primary" onClick={() => navigate(`/materials/${id}/edit`)}>编辑素材</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="素材信息" size="small" loading={loading}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="素材编号">{material?.material_code}</Descriptions.Item>
              <Descriptions.Item label="素材类型">{typeMap[material?.type] || material?.type}</Descriptions.Item>
              <Descriptions.Item label="所属课程">
                {material?.course ? (
                  <Button type="link" onClick={() => navigate(`/courses/${material.course.id}`)}>
                    {material.course.name}
                  </Button>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="文件大小">
                {material?.file_size ? `${(material.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {material?.created_at ? dayjs(material.created_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {material?.updated_at ? dayjs(material.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="文件格式">{material?.file_format || '-'}</Descriptions.Item>
              <Descriptions.Item label="时长">
                {material?.duration ? `${Math.floor(material.duration / 60)}分${material.duration % 60}秒` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="文件地址" span={2}>
                {material?.file_url ? (
                  <Button type="link" onClick={() => window.open(material.file_url)}>
                    {material.file_url}
                  </Button>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="素材描述" span={2}>
                {material?.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {material?.authorization_status === 'authorized' && (
            <Card title="当前授权信息" size="small" style={{ marginTop: 16 }} loading={loading}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="授权类型">
                  {material?.current_authorization?.authorization_type ? authTypeMap[material.current_authorization.authorization_type] : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="被授权方">
                  {material?.current_authorization?.authorized_party || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="开始日期">
                  {material?.current_authorization?.authorization_start_date ? dayjs(material.current_authorization.authorization_start_date).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="结束日期">
                  {material?.current_authorization?.authorization_end_date ? dayjs(material.current_authorization.authorization_end_date).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="授权备注" span={2}>
                  {material?.current_authorization?.remark || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Card title="授权历史记录" size="small" style={{ marginTop: 16 }} loading={loading}>
            <Table
              dataSource={material?.authorization_history || []}
              columns={authRecordColumns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无授权记录' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="授权次数"
                  value={material?.authorization_history?.length || 0}
                  prefix={<SafetyCertificateOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="使用次数"
                  value={material?.usage_count || 0}
                  prefix={<FileTextOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {material?.authorization_status === 'authorized' && material?.current_authorization && (
            <Card
              title={<span><ClockCircleOutlined style={{ marginRight: 8 }} />授权有效期</span>}
              size="small"
              style={{ marginTop: 16 }}
            >
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>授权开始</p>
                        <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                          {dayjs(material.current_authorization.authorization_start_date).format('YYYY-MM-DD')}
                        </p>
                      </div>
                    ),
                  },
                  {
                    color: 'blue',
                    children: (
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>当前进度</p>
                        <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                          {dayjs().format('YYYY-MM-DD')}
                        </p>
                      </div>
                    ),
                  },
                  {
                    color: dayjs(material.current_authorization.authorization_end_date).diff(dayjs(), 'day') <= 30 ? 'red' : 'orange',
                    children: (
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>授权到期</p>
                        <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                          {dayjs(material.current_authorization.authorization_end_date).format('YYYY-MM-DD')}
                        </p>
                        <Tag color={dayjs(material.current_authorization.authorization_end_date).diff(dayjs(), 'day') <= 30 ? 'red' : 'orange'} style={{ marginTop: 4 }}>
                          剩余 {Math.max(0, dayjs(material.current_authorization.authorization_end_date).diff(dayjs(), 'day'))} 天
                        </Tag>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          <Card title="相关操作" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block onClick={() => navigate(`/materials/${id}/authorize`)}>
                更新授权
              </Button>
              <Button block>
                关联课程
              </Button>
              <Button block>
                生成版权证明
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MaterialDetail;
