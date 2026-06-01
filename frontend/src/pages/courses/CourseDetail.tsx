import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Table, List, Avatar, Row, Col, Statistic, Divider, Empty } from 'antd';
import { ArrowLeftOutlined, BookOutlined, FileTextOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi } from '../../services/api';
import dayjs from 'dayjs';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await courseApi.detail(Number(id));
      setCourse(res.data);
    } catch (error) {
      console.error('加载课程详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    pending_review: { color: 'processing', text: '待审核' },
    approved: { color: 'success', text: '审核通过' },
    rejected: { color: 'error', text: '审核拒绝' },
    published: { color: 'green', text: '已发布' },
    offline: { color: 'default', text: '已下架' },
  };

  const materialColumns = [
    {
      title: '素材名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Button type="link" onClick={() => navigate(`/materials/${record.id}`)}>{text}</Button>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          video: '视频',
          audio: '音频',
          image: '图片',
          document: '文档',
          other: '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '授权状态',
      dataIndex: 'authorization_status',
      key: 'authorization_status',
      width: 120,
      render: (status: string) => {
        const authMap: Record<string, { color: string; text: string }> = {
          authorized: { color: 'success', text: '已授权' },
          pending: { color: 'processing', text: '待授权' },
          unauthorized: { color: 'error', text: '未授权' },
          expired: { color: 'warning', text: '已过期' },
        };
        const cfg = authMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size: number) => size ? `${(size / 1024 / 1024).toFixed(2)} MB` : '-',
    },
  ];

  const auditLogColumns = [
    {
      title: '审核时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '审核人',
      dataIndex: ['auditor', 'username'],
      key: 'auditor',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result: string) => {
        const resultMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          approved: { color: 'success', text: '通过', icon: <CheckCircleOutlined /> },
          rejected: { color: 'error', text: '拒绝', icon: <CloseCircleOutlined /> },
        };
        const cfg = resultMap[result] || { color: 'default', text: result, icon: null };
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>;
      },
    },
    {
      title: '审核意见',
      dataIndex: 'comment',
      key: 'comment',
      render: (text: string) => text || '-',
    },
  ];

  if (!course && !loading) {
    return <Empty description="课程不存在" />;
  }

  const cfg = statusMap[course?.status] || { color: 'default', text: course?.status };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/courses')} style={{ padding: 0 }}>
            返回列表
          </Button>
          <h1 className="page-title" style={{ marginTop: 8 }}>{course?.name}</h1>
          <p className="page-description">课程编码: {course?.course_code}</p>
        </div>
        <Space>
          <Tag color={cfg.color} style={{ fontSize: 14, padding: '4px 12px' }}>{cfg.text}</Tag>
          <Button type="primary" onClick={() => navigate(`/courses/${id}/edit`)}>编辑课程</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="课程信息" size="small" loading={loading}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="课程编码">{course?.course_code}</Descriptions.Item>
              <Descriptions.Item label="课程分类">{course?.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="价格">
                {course?.is_free ? <Tag color="green">免费</Tag> : `¥${course?.price}`}
              </Descriptions.Item>
              <Descriptions.Item label="课时">{course?.duration || '-'} 分钟</Descriptions.Item>
              <Descriptions.Item label="讲师">
                {course?.lecturer ? (
                  <Space>
                    <Avatar icon={<UserOutlined />} size="small" />
                    <span>{course.lecturer.name}</span>
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {course?.created_at ? dayjs(course.created_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {course?.updated_at ? dayjs(course.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {course?.published_at ? dayjs(course.published_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="课程简介" span={2}>
                {course?.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="关联素材" size="small" style={{ marginTop: 16 }} loading={loading}>
            <Table
              dataSource={course?.materials || []}
              columns={materialColumns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无关联素材' }}
            />
          </Card>

          <Card title="审核记录" size="small" style={{ marginTop: 16 }} loading={loading}>
            <Table
              dataSource={course?.audit_logs || []}
              columns={auditLogColumns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无审核记录' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="素材数量"
                  value={course?.materials?.length || 0}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="已授权素材"
                  value={course?.materials?.filter((m: any) => m.authorization_status === 'authorized').length || 0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="学习人数"
                  value={course?.student_count || 0}
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="盗版线索"
                  value={course?.piracy_count || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>
          </Card>

          {course?.piracy_count > 0 && (
            <Card title="最近盗版线索" size="small" style={{ marginTop: 16 }}>
              <List
                dataSource={course?.recent_piracy || []}
                renderItem={(item: any) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      title={
                        <Button type="link" size="small" onClick={() => navigate(`/piracy/${item.id}`)}>
                          {item.clue_no}
                        </Button>
                      }
                      description={
                        <Space>
                          <span>{item.infringing_platform}</span>
                          <Tag color="red">{dayjs(item.created_at).format('MM-DD')}</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: '暂无盗版线索' }}
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default CourseDetail;
