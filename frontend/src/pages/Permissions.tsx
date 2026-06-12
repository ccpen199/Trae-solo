import { useState, useEffect } from 'react';
import { Card, Table, Typography, Tag, Space, Descriptions, Alert, Row, Col, Statistic } from 'antd';
import { 
  SafetyCertificateOutlined, UserOutlined, TeamOutlined, 
  AuditOutlined, LockOutlined, DatabaseOutlined,
  CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import api from '../api';
import { useAppStore } from '../store';

const { Title, Text } = Typography;

const ROLE_PERMISSIONS = [
  { module: '简历管理', icon: '📄', jobseeker: true, hr: true, trainer: false, admin: true },
  { module: '岗位管理', icon: '💼', jobseeker: '查看', hr: true, trainer: false, admin: true },
  { module: '智能匹配', icon: '🎯', jobseeker: true, hr: true, trainer: false, admin: true },
  { module: '社区浏览', icon: '👥', jobseeker: true, hr: true, trainer: true, admin: true },
  { module: '内容审核', icon: '🔍', jobseeker: false, hr: true, trainer: true, admin: true },
  { module: '直聊系统', icon: '💬', jobseeker: true, hr: true, trainer: false, admin: true },
  { module: '客户线索池', icon: '📇', jobseeker: false, hr: true, trainer: false, admin: true },
  { module: '电子名片', icon: '🪪', jobseeker: false, hr: true, trainer: false, admin: true },
  { module: '精准推送', icon: '🚀', jobseeker: false, hr: true, trainer: false, admin: true },
  { module: '课程浏览', icon: '📚', jobseeker: true, hr: true, trainer: true, admin: true },
  { module: '课程发布', icon: '✏️', jobseeker: false, hr: false, trainer: true, admin: true },
  { module: '学习进度', icon: '📈', jobseeker: true, hr: false, trainer: true, admin: true },
  { module: '证书管理', icon: '🏆', jobseeker: true, hr: false, trainer: true, admin: true },
  { module: '用户管理', icon: '👤', jobseeker: false, hr: false, trainer: false, admin: true },
  { module: '审计日志', icon: '📋', jobseeker: false, hr: false, trainer: false, admin: true },
  { module: '权限配置', icon: '🔐', jobseeker: false, hr: false, trainer: false, admin: true },
];

const TENANT_ISOLATION_FEATURES = [
  { feature: '用户数据隔离', desc: '不同租户的用户数据完全隔离，SQL 查询自动带 tenant_id 过滤', status: '已实现' },
  { feature: '简历数据隔离', desc: '简历按 tenant_id 归属，仅本租户 HR 可见', status: '已实现' },
  { feature: '岗位数据隔离', desc: '岗位按 tenant_id 归属，求职者跨租户可见但管理权限隔离', status: '已实现' },
  { feature: '线索池隔离', desc: '客户线索按租户隔离，不可跨租户访问', status: '已实现' },
  { feature: '课程数据隔离', desc: '网校课程按租户隔离，支持租户内部分享', status: '已实现' },
  { feature: '社区内容归属', desc: '社区话题按作者 tenant_id 标记，支持租户域内容聚合', status: '已实现' },
  { feature: '聊天会话隔离', desc: '会话记录按双方 tenant_id 可溯源，跨租户聊天需审计', status: '已实现' },
  { feature: '审计日志分租户', desc: '审计日志记录 tenant_id，管理员可按租户维度筛选', status: '已实现' },
];

const MIDDLEWARE_SECURITY = [
  { layer: 'JWT 认证中间件', desc: '所有 /api/* 请求（除 /auth/login /auth/register）必须携带 Bearer Token，自动解析 userId 和 role', status: 'authMiddleware' },
  { layer: 'RBAC 权限中间件', desc: '基于角色的细粒度权限控制，路由级别配置所需角色，不匹配返回 403', status: 'rbacMiddleware' },
  { layer: '操作审计中间件', desc: '所有写入操作自动记录：操作人、IP、资源类型、资源ID、详情 JSON、时间戳', status: 'auditMiddleware' },
  { layer: '多租户数据过滤', desc: '数据库查询自动注入 tenant_id 条件，从 JWT 中提取，应用层透明', status: 'SQL 层注入' },
  { layer: '敏感词过滤', desc: '社区内容、聊天消息自动过滤敏感词，可配置替换规则', status: 'filterSensitiveWords' },
  { layer: '消息质检评分', desc: '聊天消息自动进行质量评分（0-100），检测广告、辱骂、敏感内容', status: 'checkMessageQuality' },
  { layer: '密码安全', desc: 'bcryptjs 哈希存储，盐值 10 轮，不可解密', status: 'bcryptjs' },
  { layer: '文件上传安全', desc: 'Multer 限制文件类型和大小，存储路径隔离，禁止可执行文件', status: 'Multer 配置' },
];

export default function Permissions() {
  const { user } = useAppStore();
  const [tenantStats, setTenantStats] = useState<any>(null);
  const [permissionStats, setPermissionStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [usersRes, auditRes, permsRes] = await Promise.all([
          api.get('/users'),
          api.get('/users/audit/logs', { params: { page: 1, size: 1 } }),
          api.get('/permissions') as any
        ]);
        setTenantStats({
          totalUsers: (usersRes as any).total || 0,
          totalAuditLogs: (auditRes as any).total || 0,
        });
        setPermissionStats(permsRes);
      } catch (e) {
        console.warn('Failed to fetch permission stats:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const renderPermissionCell = (value: boolean | string) => {
    if (value === true) return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
    if (value === false) return <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />;
    return <Tag color="blue">{value}</Tag>;
  };

  const columns = [
    { 
      title: '功能模块', 
      dataIndex: 'module', 
      key: 'module',
      render: (text: string, record: any) => (
        <Space>
          <span style={{ fontSize: 18 }}>{record.icon}</span>
          <Text strong>{text}</Text>
        </Space>
      )
    },
    { 
      title: (
        <Space><UserOutlined /> 个人求职者</Space>
      ), 
      dataIndex: 'jobseeker', 
      key: 'jobseeker',
      align: 'center' as const,
      render: renderPermissionCell
    },
    { 
      title: (
        <Space><TeamOutlined /> HR招聘专员</Space>
      ), 
      dataIndex: 'hr', 
      key: 'hr',
      align: 'center' as const,
      render: renderPermissionCell
    },
    { 
      title: (
        <Space><SafetyCertificateOutlined /> 培训管理员</Space>
      ), 
      dataIndex: 'trainer', 
      key: 'trainer',
      align: 'center' as const,
      render: renderPermissionCell
    },
    { 
      title: (
        <Space><AuditOutlined /> 系统管理员</Space>
      ), 
      dataIndex: 'admin', 
      key: 'admin',
      align: 'center' as const,
      render: renderPermissionCell
    },
  ];

  return (
    <div>
      <Alert
        message="RBAC 权限边界总览"
        description={
          <div>
            <div>当前登录账号：<Text code>{user?.username}</Text>，角色：<Tag color="red">{user?.role}</Tag></div>
            <div>当前租户 ID：<Text code>{user?.tenantId}</Text></div>
          </div>
        }
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="系统用户总数" 
              value={tenantStats?.totalUsers || '-'} 
              prefix={<UserOutlined />} 
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="审计日志总数" 
              value={tenantStats?.totalAuditLogs || '-'} 
              prefix={<AuditOutlined />} 
              suffix="条"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="角色数" 
              value={4} 
              prefix={<TeamOutlined />} 
              suffix="种"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="权限控制项" 
              value={ROLE_PERMISSIONS.length} 
              prefix={<LockOutlined />} 
              suffix="项"
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title={<Title level={5} style={{ margin: 0 }}><SafetyCertificateOutlined /> RBAC 角色权限矩阵</Title>}
        style={{ marginBottom: 16 }}
      >
        <Table
          rowKey="module"
          columns={columns}
          dataSource={ROLE_PERMISSIONS}
          pagination={false}
          size="middle"
        />
      </Card>

      <Card 
        title={<Title level={5} style={{ margin: 0 }}><DatabaseOutlined /> 多租户数据隔离机制</Title>}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          {TENANT_ISOLATION_FEATURES.map((item, idx) => (
            <Col xs={24} md={12} key={idx}>
              <Card size="small" style={{ height: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>{item.feature}</Text>
                    <Tag color="green">{item.status}</Tag>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card 
        title={<Title level={5} style={{ margin: 0 }}><LockOutlined /> 安全中间件层</Title>}
      >
        <Descriptions 
          bordered 
          column={1} 
          size="small"
          items={MIDDLEWARE_SECURITY.map((item, idx) => ({
            key: idx,
            label: <Space><Tag color="blue">{item.status}</Tag> {item.layer}</Space>,
            children: item.desc
          }))}
        />
      </Card>
    </div>
  );
}
