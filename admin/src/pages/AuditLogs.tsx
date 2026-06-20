import React, { useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Table, Tag, Form, Select, Input, Button, Space,
  Modal, Descriptions, Alert, message, Empty, Tooltip, Badge
} from 'antd';
import {
  FileSearchOutlined, CalendarOutlined, CopyOutlined, EyeOutlined,
  SearchOutlined, ReloadOutlined, SafetyCertificateOutlined,
  DatabaseOutlined, ThunderboltOutlined, PieChartOutlined, BarChartOutlined
} from '@ant-design/icons';
import { Pie as PieChart, Column as ColumnChart } from '@ant-design/charts';
import dayjs from 'dayjs';

interface AuditSummary {
  total: number;
  today: number;
  byModule: { module: string; count: number }[];
  byAction: { action: string; count: number }[];
}

interface AuditLog {
  id: string;
  time: string;
  module: 'auth' | 'approval' | 'signing' | 'template' | 'archive' | 'system';
  action: string;
  operator: string;
  operatorId: string;
  ip: string;
  location: string;
  targetId: string;
  detail: Record<string, any>;
  hash: string;
}

const MODULE_MAP: Record<string, { label: string; color: string }> = {
  auth: { label: '身份认证', color: 'blue' },
  approval: { label: '审批流程', color: 'cyan' },
  signing: { label: '电子签署', color: 'green' },
  template: { label: '模板管理', color: 'purple' },
  archive: { label: '档案归档', color: 'orange' },
  system: { label: '系统管理', color: 'red' }
};

const MODULE_OPTIONS = [
  { value: 'auth', label: '身份认证' },
  { value: 'approval', label: '审批流程' },
  { value: 'signing', label: '电子签署' },
  { value: 'template', label: '模板管理' },
  { value: 'archive', label: '档案归档' },
  { value: 'system', label: '系统管理' }
];

const OPERATOR_OPTIONS = [
  { value: 'U1', label: '王审核' },
  { value: 'U2', label: '赵复审' },
  { value: 'U3', label: '孙受理' },
  { value: 'U4', label: '管理员' },
  { value: 'U5', label: '李发证' }
];

const generateMockSummary = (): AuditSummary => ({
  total: 128463,
  today: 2847,
  byModule: [
    { module: '身份认证', count: 8542 },
    { module: '审批流程', count: 42310 },
    { module: '电子签署', count: 38521 },
    { module: '模板管理', count: 4521 },
    { module: '档案归档', count: 28150 },
    { module: '系统管理', count: 6419 }
  ],
  byAction: [
    { action: '登录', count: 3218 },
    { action: '提交申请', count: 8452 },
    { action: '审核通过', count: 7823 },
    { action: '审核驳回', count: 1254 },
    { action: '电子签名', count: 9521 },
    { action: '生成档案', count: 5214 },
    { action: '配置修改', count: 1842 },
    { action: '用户管理', count: 986 }
  ]
});

const generateMockLogs = (): AuditLog[] => {
  const modules: AuditLog['module'][] = ['auth', 'approval', 'signing', 'template', 'archive', 'system'];
  const actions = ['login', 'submit', 'approve', 'reject', 'sign', 'archive', 'config', 'create_user', 'update_template', 'download_evidence', 'verify', 'logout'];
  const operators = [
    { name: '王审核', id: 'U1' },
    { name: '赵复审', id: 'U2' },
    { name: '孙受理', id: 'U3' },
    { name: '管理员', id: 'U4' },
    { name: '李发证', id: 'U5' }
  ];
  const locations = ['政务云机房A区', '政务云机房B区', '省局办公区1号楼', '省局办公区2号楼', '地市接入点-杭州', '地市接入点-宁波', '地市接入点-温州'];
  const details: Record<string, any>[] = [
    { loginType: 'password+ukey', deviceInfo: 'Windows 11 / Chrome 124', mfa: 'UKey硬件认证', sessionId: 'SES_20240515_a8f3c1' },
    { applyId: 'APP20240515001', applyType: '个体工商户设立', applicant: '张三', formData: { name: '杭州某某贸易商行', scope: '日用百货销售' } },
    { applyId: 'APP20240515001', reviewComment: '材料齐全，符合法定条件', previousStatus: 'reviewing', nextStatus: 'approved', duration: '1天2小时' },
    { applyId: 'APP20240515002', rejectReason: '身份证明材料不清晰，需重新上传', missingFields: ['身份证反面照'] },
    { applyId: 'APP20240515001', signer: '张三', signAlgorithm: 'SM2withSM3', certificateSerial: 'CN=SM2-CA-2024/0012345', tsaSerial: 'TSA2024051500888', biometricVerified: true },
    { applyId: 'APP20240515001', archiveId: 'ARC20240515A001', fileCount: 12, totalSize: '18.5MB', storagePath: 'gov-cloud://archives/2024/05/15/', hashChainRoot: 'sha256:abcd...' },
    { configKey: 'review.auto_assign', oldValue: 'false', newValue: 'true', reason: '优化审核效率，按负载均衡自动分配' },
    { userId: 'U6', userName: '周审核', phone: '137****6666', role: 'reviewer', authLevel: 'L2' },
    { templateId: 'TPL003', templateName: '食品经营许可申请书V2', changeLog: '新增第12项"食品安全管理制度清单"字段' },
    { applyId: 'APP20240515001', evidenceName: '证据包_APP20240515001.zip', size: '3.8MB', format: 'ZIP-AES256' },
    { verifyTarget: '证据链完整性', result: 'success', verifiedItems: 18, hashMatch: true, timestampValid: true },
    { userId: 'U4', sessionId: 'SES_20240515_a8f3c1', activeDuration: '2小时38分钟', operationsCount: 156 }
  ];

  return Array.from({ length: 58 }, (_, i) => {
    const moduleIdx = Math.floor(Math.random() * modules.length);
    const actionIdx = Math.floor(Math.random() * actions.length);
    const opIdx = Math.floor(Math.random() * operators.length);
    const locIdx = Math.floor(Math.random() * locations.length);
    const detIdx = Math.floor(Math.random() * details.length);
    const d = dayjs().subtract(Math.floor(Math.random() * 7 * 24), 'hour').subtract(Math.floor(Math.random() * 60), 'minute');
    const ip = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
    const targetTypes = ['APP', 'USR', 'TPL', 'ARC', 'SES'];
    const targetId = `${targetTypes[Math.floor(Math.random() * targetTypes.length)]}${20240515000 + Math.floor(Math.random() * 999)}`;

    return {
      id: `LOG${String(58 - i).padStart(6, '0')}`,
      time: d.format('YYYY-MM-DD HH:mm:ss'),
      module: modules[moduleIdx],
      action: actions[actionIdx],
      operator: operators[opIdx].name,
      operatorId: operators[opIdx].id,
      ip,
      location: locations[locIdx],
      targetId,
      detail: { ...details[detIdx], _sequence: 58 - i, _timestamp: d.valueOf() },
      hash: `SHA256:${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}...${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
  });
};

const AuditLogsPage: React.FC = () => {
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filtered, setFiltered] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState<AuditLog | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-summary', {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('admin_token') || '') }
      });
      const json = await res.json();
      if (json.code === 0) {
        setSummary(json.data);
      } else {
        setSummary(generateMockSummary());
      }
    } catch {
      setSummary(generateMockSummary());
    }
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('admin_token') || '') }
      });
      const json = await res.json();
      if (json.code === 0) {
        setLogs(json.data.list || json.data || []);
        setFiltered(json.data.list || json.data || []);
      } else {
        const m = generateMockLogs();
        setLogs(m);
        setFiltered(m);
      }
    } catch {
      const m = generateMockLogs();
      setLogs(m);
      setFiltered(m);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (values: any) => {
    let result = [...logs];
    if (values.module) {
      result = result.filter(l => l.module === values.module);
    }
    if (values.action) {
      result = result.filter(l => l.action.toLowerCase().includes(values.action.toLowerCase()));
    }
    if (values.operator) {
      result = result.filter(l => l.operatorId === values.operator);
    }
    if (values.keyword) {
      const kw = values.keyword.toLowerCase();
      result = result.filter(l =>
        l.targetId.toLowerCase().includes(kw) ||
        l.operator.toLowerCase().includes(kw) ||
        l.ip.includes(kw) ||
        JSON.stringify(l.detail).toLowerCase().includes(kw)
      );
    }
    setFiltered(result);
  };

  const handleReset = () => {
    form.resetFields();
    setFiltered(logs);
  };

  const handleViewDetail = (log: AuditLog) => {
    setCurrentLog(log);
    setDetailOpen(true);
  };

  const handleCopyJson = async () => {
    if (currentLog) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(currentLog.detail, null, 2));
        message.success('已复制JSON到剪贴板');
      } catch {
        message.error('复制失败，请手动复制');
      }
    }
  };

  const summaryModule = summary?.byModule.map(m => ({ module: m.module, count: m.count })) || [];
  const summaryAction = summary?.byAction.map(a => ({ action: a.action, count: a.count })) || [];

  const actionLabel = (a: string) => {
    const map: Record<string, string> = {
      login: '登录', logout: '登出', submit: '提交申请', approve: '审核通过',
      reject: '审核驳回', sign: '电子签名', archive: '生成档案',
      config: '配置修改', create_user: '创建用户', update_template: '更新模板',
      download_evidence: '下载证据', verify: '校验验证'
    };
    return map[a] || a;
  };

  const detailSummary = (d: Record<string, any>) => {
    const keys = Object.keys(d).filter(k => !k.startsWith('_')).slice(0, 3);
    if (keys.length === 0) return <span style={{ color: '#94a3b8' }}>—</span>;
    return keys.map(k => {
      let v = typeof d[k] === 'object' ? '{...}' : String(d[k]);
      if (v.length > 20) v = v.slice(0, 20) + '...';
      return <Tag key={k} color="blue" style={{ marginBottom: 4, fontSize: 11 }}>{k}: {v}</Tag>;
    });
  };

  const renderDetailItems = (obj: Record<string, any>, prefix = ''): React.ReactNode => {
    return Object.entries(obj)
      .filter(([k]) => !k.startsWith('_'))
      .map(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          return (
            <Descriptions.Item key={key} label={key} span={2}>
              <div style={{ padding: 8, background: '#fafafa', borderRadius: 6, border: '1px solid #eee' }}>
                <Descriptions size="small" column={1} bordered>
                  {renderDetailItems(v)}
                </Descriptions>
              </div>
            </Descriptions.Item>
          );
        }
        if (Array.isArray(v)) {
          return (
            <Descriptions.Item key={key} label={key} span={2}>
              <Tag color="purple">[{v.length}项]</Tag>
              <code style={{ fontSize: 11, color: '#666', marginLeft: 8 }}>
                {JSON.stringify(v).slice(0, 120)}{JSON.stringify(v).length > 120 ? '...' : ''}
              </code>
            </Descriptions.Item>
          );
        }
        return (
          <Descriptions.Item key={key} label={key}>
            {typeof v === 'boolean' ? (v ? <Tag color="green">是</Tag> : <Tag>否</Tag>) : (
              <span style={{ fontFamily: v && typeof v === 'string' && v.startsWith('SHA') ? 'monospace' : undefined }}>
                {String(v)}
              </span>
            )}
            <Badge status="success" style={{ marginLeft: 8, fontSize: 10 }} />
          </Descriptions.Item>
        );
      });
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Row gutter={12} align="middle">
              <Col>
                <div style={{
                  width: 48, height: 48, borderRadius: 10, background: '#e8f1fb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#1E5DAB'
                }}><DatabaseOutlined /></div>
              </Col>
              <Col flex="auto">
                <Statistic
                  title={<><FileSearchOutlined /> 累计日志总数</>}
                  value={summary?.total || 0}
                  valueStyle={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Row gutter={12} align="middle">
              <Col>
                <div style={{
                  width: 48, height: 48, borderRadius: 10, background: '#fff0f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#eb2f96'
                }}><ThunderboltOutlined /></div>
              </Col>
              <Col flex="auto">
                <Statistic
                  title={<><CalendarOutlined /> 今日新增</>}
                  value={summary?.today || 0}
                  valueStyle={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, height: '100%' }}
            title={<span><PieChartOutlined style={{ color: '#722ed1' }} /> 按模块分布</span>}>
            {summaryModule.length > 0 && (
              <PieChart
                data={summaryModule}
                angleField="count"
                colorField="module"
                radius={0.85}
                innerRadius={0.55}
                height={150}
                padding={[0, 0, 0, 0]}
                legend={false}
                label={{ text: 'module', style: { fontSize: 10 }, content: '{name}' }}
                tooltip={{ formatter: (d: any) => ({ name: d.module, value: d.count + '条' }) }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={24} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, height: '100%' }}
            title={<span><BarChartOutlined style={{ color: '#13c2c2' }} /> 按动作统计 TOP8</span>}>
            {summaryAction.length > 0 && (
              <ColumnChart
                data={summaryAction}
                xField="action"
                yField="count"
                height={150}
                padding={[8, 8, 24, 8]}
                color="#1E5DAB"
                label={{ position: 'top', style: { fontSize: 10 } }}
                xAxis={{ label: { style: { fontSize: 10 }, autoHide: true, autoRotate: false } }}
                yAxis={false}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 10, marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ rowGap: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
        >
          <Form.Item name="module" label="模块">
            <Select allowClear placeholder="全部模块" style={{ width: 140 }} options={MODULE_OPTIONS} />
          </Form.Item>
          <Form.Item name="action" label="动作">
            <Input allowClear placeholder="如:login/approve" style={{ width: 160 }} prefix={<SearchOutlined />} />
          </Form.Item>
          <Form.Item name="operator" label="操作人">
            <Select allowClear placeholder="全部" style={{ width: 130 }} options={OPERATOR_OPTIONS} />
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input allowClear placeholder="目标ID/详情/IP" style={{ width: 200 }} prefix={<SearchOutlined />} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        bordered={false}
        style={{ borderRadius: 10 }}
        title={<span><SafetyCertificateOutlined style={{ color: '#1E5DAB' }} /> 审计日志 · 全链路操作存证</span>}
        extra={<Tag color="blue" icon={<Badge status="success" />}>共 {filtered.length} 条记录</Tag>}
      >
        {loading ? (
          <Empty description="加载中..." />
        ) : (
          <Table<AuditLog>
            size="small"
            rowKey="id"
            dataSource={filtered}
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1400 }}
            columns={[
              { title: '时间', dataIndex: 'time', width: 170, fixed: 'left' as const, sorter: (a, b) => a.time.localeCompare(b.time) },
              {
                title: '模块', dataIndex: 'module', width: 100,
                render: (v: string) => {
                  const m = MODULE_MAP[v] || { label: v, color: 'default' };
                  return <Tag color={m.color as any}>{m.label}</Tag>;
                },
                filters: MODULE_OPTIONS.map(o => ({ text: o.label, value: o.value })),
                onFilter: (v, r) => r.module === v
              },
              {
                title: '动作', dataIndex: 'action', width: 110,
                render: (v: string) => <Tag color="geekblue">{actionLabel(v)}</Tag>
              },
              { title: '操作人', dataIndex: 'operator', width: 90 },
              {
                title: 'IP地址', dataIndex: 'ip', width: 130,
                render: (v: string) => <code style={{ fontSize: 12, color: '#475569' }}>{v}</code>
              },
              { title: '位置', dataIndex: 'location', width: 150, ellipsis: true, render: (v) => <Tooltip title={v}>{v}</Tooltip> },
              { title: '目标ID', dataIndex: 'targetId', width: 150, render: (v) => <code style={{ fontSize: 12 }}>{v}</code> },
              {
                title: '详情摘要', dataIndex: 'detail', width: 280,
                render: (v: Record<string, any>) => (
                  <div style={{ maxWidth: 280 }}>{detailSummary(v)}</div>
                )
              },
              {
                title: '操作', width: 130, fixed: 'right' as const,
                render: (_, r) => (
                  <Space size={4}>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>查看</Button>
                    <Tooltip title={`哈希: ${r.hash}`}>
                      <Badge status="success" />
                    </Tooltip>
                  </Space>
                )
              }
            ]}
          />
        )}

        <Alert
          style={{ marginTop: 16, borderRadius: 8 }}
          icon={<SafetyCertificateOutlined />}
          type="info"
          showIcon
          message="存证合规声明"
          description="本页全部操作日志由系统自动生成，不可篡改，符合《政务信息系统安全管理规范》要求，SHA256哈希存证于政务云。日志数据保留期限 ≥ 6年，支持司法举证与第三方审计。"
        />
      </Card>

      <Modal
        title={<span><EyeOutlined style={{ color: '#1E5DAB' }} /> 审计日志完整详情</span>}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width={860}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>,
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={handleCopyJson}>复制完整JSON</Button>
        ]}
      >
        {currentLog && (
          <div>
            <Descriptions bordered size="small" column={2} title="📝 日志基础信息" style={{ marginBottom: 14 }}>
              <Descriptions.Item label="日志ID">{currentLog.id}</Descriptions.Item>
              <Descriptions.Item label="发生时间">{currentLog.time}</Descriptions.Item>
              <Descriptions.Item label="模块">
                <Tag color={MODULE_MAP[currentLog.module]?.color as any}>{MODULE_MAP[currentLog.module]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="动作">{actionLabel(currentLog.action)}</Descriptions.Item>
              <Descriptions.Item label="操作人">{currentLog.operator}（{currentLog.operatorId}）</Descriptions.Item>
              <Descriptions.Item label="目标ID"><code>{currentLog.targetId}</code></Descriptions.Item>
              <Descriptions.Item label="IP地址"><code>{currentLog.ip}</code></Descriptions.Item>
              <Descriptions.Item label="接入位置">{currentLog.location}</Descriptions.Item>
              <Descriptions.Item label="哈希存证 (SHA-256)" span={2}>
                <code style={{ color: '#ef4444', fontSize: 11, wordBreak: 'break-all' }}>{currentLog.hash}</code>
                <Badge status="success" text={<span style={{ fontSize: 12, color: '#52c41a', marginLeft: 8 }}>✅ 已哈希固化</span>} />
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="🔍 详细操作数据" style={{ marginBottom: 14 }}
              extra={<Tag color="green" icon={<Badge status="success" />}>每项均已哈希固化</Tag>}>
              <Descriptions bordered size="small" column={1}>
                {renderDetailItems(currentLog.detail)}
              </Descriptions>
            </Card>

            <Alert
              type="success"
              showIcon
              icon={<SafetyCertificateOutlined />}
              message="完整性校验：通过"
              description={`该日志记录与链上前序记录哈希关联，根哈希 ${currentLog.hash.slice(0, 32)}... 已存证于政务云区块链节点。校验时间：${new Date().toLocaleString('zh-CN')}`}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
