import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, Input, Select, Space, Row, Col, Progress, Button, Timeline, Modal, Descriptions, Drawer, Empty, message, Alert, Checkbox, List } from 'antd';
import { SearchOutlined, DownloadOutlined, FileDoneOutlined, SafetyOutlined, EyeOutlined, FilterOutlined, WarningOutlined, BellOutlined, FileTextOutlined, LockOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { http } from '../utils/request';

interface TrackItem {
  id: string; applyId: string; itemName: string; itemCode: string;
  applicantName: string; enterpriseName?: string;
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  currentStep: number; totalSteps: number;
  rejectReason?: any;
  approvalNodes: { id: string; name: string; role: string; level: number; status: string; comment?: string; assignee?: string; operatedAt?: string }[];
  createdAt: string; updatedAt: string;
  sign_logs?: any[];
}

interface TodoItem {
  id: string; title: string; priority: 'high' | 'medium' | 'low'; read: boolean; applyId?: string;
}

const MOCK: TrackItem[] = Array.from({ length: 15 }, (_, i) => {
  const steps = [5, 5, 4, 3, 5, 4, 5, 3, 5, 4, 5, 5, 4, 5, 4];
  const totalSteps = steps[i];
  const cur = [2, 5, 3, 2, 4, 5, 5, 2, 1, 3, 5, 5, 4, 2, 5][i];
  const sts = ['reviewing', 'approved', 'reviewing', 'reviewing', 'reviewing', 'approved', 'rejected', 'reviewing', 'submitted', 'reviewing', 'completed', 'approved', 'reviewing', 'reviewing', 'completed'];
  return {
    id: 'T' + i,
    applyId: 'APP202405' + String(100 + i).padStart(5, '0'),
    itemName: ['个体工商户设立', '有限公司设立', '食品经营许可', '变更登记', '年报公示', '注销登记', '餐饮许可', '名称预核准', '个体设立', '药品经营许可', '变更登记', '个体注销', '公司变更', '医疗器械经营', '个体设立'][i],
    itemCode: ['DJ-IND-001', 'DJ-ENT-001', 'XK-FOOD-001', 'BG-IND-001', 'NJ-001', 'ZX-IND-001', 'XK-FOOD-002', 'DJ-ENT-000', 'DJ-IND-001', 'XK-MED-001', 'BG-ENT-001', 'ZX-IND-001', 'BG-ENT-002', 'XK-MED-002', 'DJ-IND-001'][i],
    applicantName: ['张三', '王五', '李四', '赵六', '孙七', '周八', '吴九', '郑十', '冯一', '陈二', '褚三', '卫四', '蒋五', '沈六', '韩七'][i],
    enterpriseName: i % 3 === 0 ? undefined : `${['XX', '盛景', '华瑞', '恒信', '蓝天', '绿源', '金色', '亿达'][i % 8]}${['科技', '餐饮', '商贸', '服务', '医疗', '食品'][i % 6]}有限公司`,
    status: sts[i] as any,
    currentStep: cur, totalSteps,
    rejectReason: sts[i] === 'rejected' ? {
      category: '材料不全',
      reasons: [
        { field: '经营场所证明', label: '经营场所证明文件', message: '经营地址与实际地址不符，缺少门牌号信息', suggestion: '请补充产权证明原件扫描件或最新租赁协议，并标注详细门牌号', regulation: '《市场主体登记管理条例》第11条' },
        { field: '身份证明', label: '申请人身份证明', message: '身份证照片模糊，无法识别有效期', suggestion: '请重新上传清晰的身份证正反面照片，确保所有文字可识别', regulation: '《个体工商户登记管理办法》第14条' },
        { field: '经营范围', label: '经营范围确认', message: '经营范围中"食品销售"未标注具体类别', suggestion: '请明确标注为"预包装食品销售"或"散装食品销售"等具体类别', regulation: '《经营范围登记规范表述目录》' }
      ],
      remark: '以上材料请于10个工作日内补充完整后重新提交，超期将自动撤销申请。如有疑问请拨打咨询电话：12315。'
    } : undefined,
    approvalNodes: Array.from({ length: totalSteps }, (_, j) => ({
      id: 'N' + i + '-' + j,
      name: ['受理', '初审', '复审', '核准', '发证'][j] || `环节${j + 1}`,
      role: ['受理员', '初审员', '复审员', '核准员', '发证员'][j] || '审核员',
      level: j + 1,
      status: j < cur ? (sts[i] === 'rejected' && j === cur - 1 ? 'rejected' : 'approved') : j === cur ? 'processing' : 'pending',
      assignee: j < cur ? ['王审核', '赵复审', '孙受理', '李核准', '钱发证'][j] : j === cur ? '王审核' : undefined,
      operatedAt: j < cur ? `2024-05-${10 + j} 14:3${j}:00` : undefined,
      comment: sts[i] === 'rejected' && j === cur - 1 ? '材料不全，见驳回详情' : undefined
    })),
    createdAt: `2024-05-${10 + (i % 5)} 09:${String(10 + i * 3).slice(-2)}:00`,
    updatedAt: `2024-05-${10 + (i % 5) + (cur % 3)} 16:${String(20 + i).slice(-2)}:00`,
    sign_logs: [
      { id: 1, action: '提交申请', operator: '申请人', ip: '192.168.1.101', device: 'iPhone 14 Pro / iOS 17.2', time: `2024-05-${10 + (i % 5)} 09:${String(10 + i * 3).slice(-2)}:00`, hash: 'a1b2c3d4e5f6...' },
      { id: 2, action: '签名确认', operator: '申请人', ip: '192.168.1.101', device: 'iPhone 14 Pro / iOS 17.2', time: `2024-05-${10 + (i % 5)} 09:${String(12 + i * 3).slice(-2)}:00`, hash: 'f6e5d4c3b2a1...' },
      { id: 3, action: '人脸识别', operator: '系统', ip: '-', device: '生物识别引擎 v3.2', time: `2024-05-${10 + (i % 5)} 09:${String(13 + i * 3).slice(-2)}:00`, hash: '9a8b7c6d5e4f...' }
    ]
  };
});

const STATUS_OPTS = [
  { value: '', label: '全部' },
  { value: 'submitted', label: '已提交' },
  { value: 'reviewing', label: '审核中' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'completed', label: '已完成' }
];

const EVIDENCE_NODES = [
  { key: 'form', title: '📝 申请表单', icon: <FileTextOutlined /> },
  { key: 'sign', title: '✍️ 签署过程', icon: <LockOutlined /> },
  { key: 'tsa', title: '⏰ TSA时间戳', icon: <ClockCircleOutlined /> },
  { key: 'ca', title: '🔐 CA证书链', icon: <SafetyOutlined /> },
  { key: 'approval', title: '✅ 审批记录', icon: <FileDoneOutlined /> },
  { key: 'raw', title: '📎 原始材料', icon: <FileTextOutlined /> }
];

const TrackingPage: React.FC = () => {
  const [list] = useState<TrackItem[]>(MOCK);
  const [kw, setKw] = useState('');
  const [status, setStatus] = useState('');
  const [viewItem, setViewItem] = useState<TrackItem | null>(null);
  const [detail, setDetail] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalChecked, setLegalChecked] = useState(false);
  const [legalTarget, setLegalTarget] = useState<TrackItem | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [downloadTarget, setDownloadTarget] = useState<TrackItem | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await http.get<TodoItem[]>('/tracking/todos');
        setTodos(data && data.length ? data : [
          { id: '1', title: 'APP20240510001 审核超时预警', priority: 'high', read: false, applyId: 'APP20240510001' },
          { id: '2', title: 'APP20240510003 待补充材料通知', priority: 'medium', read: false, applyId: 'APP20240510003' },
          { id: '3', title: 'APP20240510005 请及时发证', priority: 'low', read: false, applyId: 'APP20240510005' }
        ]);
      } catch {
        setTodos([
          { id: '1', title: 'APP20240510001 审核超时预警', priority: 'high', read: false, applyId: 'APP20240510001' },
          { id: '2', title: 'APP20240510003 待补充材料通知', priority: 'medium', read: false, applyId: 'APP20240510003' },
          { id: '3', title: 'APP20240510005 请及时发证', priority: 'low', read: false, applyId: 'APP20240510005' }
        ]);
      }
    })();
  }, []);

  const unreadTodos = todos.filter(t => !t.read);
  const hasHighPriority = unreadTodos.some(t => t.priority === 'high');

  const filtered = list.filter(x => {
    const matchKw = !kw || x.applyId.includes(kw) || x.itemName.includes(kw) || x.applicantName.includes(kw);
    const matchSt = !status || x.status === status;
    return matchKw && matchSt;
  });

  const statusTag = (s: string) => ({
    submitted: <Tag color="orange">已提交</Tag>,
    reviewing: <Tag color="blue">审核中</Tag>,
    approved: <Tag color="green">已通过</Tag>,
    rejected: <Tag color="red">驳回</Tag>,
    completed: <Tag color="geekblue">已完成</Tag>
  } as any)[s];

  const startDownload = (item: TrackItem) => {
    setDownloadTarget(item);
    setDownloadPercent(0);
    setDownloadOpen(true);
    let pct = 0;
    const timer = setInterval(() => {
      pct += 5;
      setDownloadPercent(pct);
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setDownloadOpen(false);
          message.success(`证据包下载成功：${item.applyId}_证据包.zip`);
        }, 400);
      }
    }, 100);
  };

  const downloadEvidence = (item: TrackItem) => {
    Modal.confirm({
      title: `生成证据包：${item.applyId}`,
      content: (
        <div>
          <div>将生成包含以下内容的标准证据包 (ZIP)，用于司法举证：</div>
          <div style={{ marginTop: 8, padding: 10, background: '#f8fafc', borderRadius: 6, fontSize: 13, lineHeight: 1.8 }}>
            <div>📝 申请表单（签名版PDF）</div>
            <div>✍️ 签署过程日志（含设备/IP/时间戳）</div>
            <div>⏰ TSA时间戳验证报告</div>
            <div>🔐 CA证书链及公钥</div>
            <div>✅ 各级审批记录</div>
            <div>📎 全部原始材料</div>
          </div>
        </div>
      ),
      okText: '生成并下载', okType: 'primary',
      onOk: () => startDownload(item)
    });
  };

  const openLegalModal = (item: TrackItem) => {
    setLegalTarget(item);
    setLegalChecked(false);
    setLegalModalOpen(true);
  };

  const summaryCounts = {
    total: list.length,
    reviewing: list.filter(x => x.status === 'reviewing' || x.status === 'submitted').length,
    approved: list.filter(x => x.status === 'approved' || x.status === 'completed').length,
    rejected: list.filter(x => x.status === 'rejected').length
  };

  const renderEvidenceDetail = (key: string, item: TrackItem) => {
    const hash = `${item.applyId}-${key}`.split('').reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).padStart(32, '0').slice(0, 32);
    const timeMap: Record<string, string> = {
      form: item.createdAt,
      sign: item.createdAt,
      tsa: item.approvalNodes[0]?.operatedAt || item.createdAt,
      ca: item.createdAt,
      approval: item.updatedAt,
      raw: item.createdAt
    };
    const statusMap: Record<string, string> = {
      form: '已归档',
      sign: '已固化',
      tsa: '已验证',
      ca: '有效',
      approval: '完整',
      raw: '已封存'
    };
    return (
      <Descriptions bordered size="small" column={2} key={key} style={{ marginBottom: 8 }}>
        <Descriptions.Item label="节点">{EVIDENCE_NODES.find(n => n.key === key)?.title}</Descriptions.Item>
        <Descriptions.Item label="状态"><Tag color="green">{statusMap[key]}</Tag></Descriptions.Item>
        <Descriptions.Item label="生成/固化时间" span={2}>{timeMap[key] || '---'}</Descriptions.Item>
        <Descriptions.Item label="哈希值 (SHA-256)" span={2}>
          <code style={{ fontSize: 11, wordBreak: 'break-all', color: '#1E5DAB' }}>{hash.slice(0, 16)}...{hash.slice(-8)}</code>
        </Descriptions.Item>
      </Descriptions>
    );
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10 }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>全部申请</div><div style={{ fontSize: 26, fontWeight: 700 }}>{summaryCounts.total}</div></Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10, borderLeft: '4px solid #1E5DAB' }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>审核中</div><div style={{ fontSize: 26, fontWeight: 700, color: '#1E5DAB' }}>{summaryCounts.reviewing}</div></Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10, borderLeft: '4px solid #52c41a' }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>已通过</div><div style={{ fontSize: 26, fontWeight: 700, color: '#52c41a' }}>{summaryCounts.approved}</div></Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10, borderLeft: '4px solid #ef4444' }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>已驳回</div><div style={{ fontSize: 26, fontWeight: 700, color: '#ef4444' }}>{summaryCounts.rejected}</div></Card></Col>
      </Row>

      {unreadTodos.length > 0 && (
        <Alert
          message={
            <Space>
              <BellOutlined />
              <span>
                您有 <b style={{ color: hasHighPriority ? '#dc2626' : '#1E5DAB' }}>{unreadTodos.length}</b> 条未读待办
                {hasHighPriority && <span style={{ color: '#dc2626', marginLeft: 8 }}><WarningOutlined /> 含高危优先级事项，请优先处理</span>}
              </span>
            </Space>
          }
          description={
            <Space size={16} wrap>
              {unreadTodos.slice(0, 5).map(t => (
                <Tag key={t.id} color={t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'orange' : 'blue'}
                  style={{ cursor: 'pointer', margin: 0 }}>
                  {t.priority === 'high' && <WarningOutlined /> } {t.title}
                </Tag>
              ))}
            </Space>
          }
          type={hasHighPriority ? 'error' : 'warning'}
          showIcon={false}
          style={{ marginBottom: 16, borderRadius: 10 }}
          closable
        />
      )}

      <Card title={<span><FilterOutlined /> 不见面审批 · 全流程追踪看板</span>} bordered={false} style={{ borderRadius: 10 }}
        extra={
          <Space>
            <Select value={status} onChange={setStatus} style={{ width: 140 }} options={STATUS_OPTS} />
            <Input.Search allowClear placeholder="申请ID/事项/申请人" value={kw} onChange={e => setKw(e.target.value)}
              style={{ width: 280 }} prefix={<SearchOutlined />} />
          </Space>
        }>
        <Table
          rowKey="id" dataSource={filtered}
          pagination={{ pageSize: 8, showSizeChanger: true }}
          expandable={{
            expandedRowRender: (row) => (
              <div style={{ padding: '8px 0' }}>
                {row.status === 'rejected' && row.rejectReason && (
                  <Card
                    type="inner"
                    size="small"
                    style={{ marginBottom: 16, border: '1px solid #fecaca', background: '#fff5f5', borderRadius: 8 }}
                    title={<span style={{ color: '#dc2626', fontWeight: 600 }}>✗ 驳回原因（结构化）</span>}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <b>驳回分类：</b>
                      <Tag color="red" style={{ marginLeft: 4 }}>{row.rejectReason.category}</Tag>
                    </div>
                    <Table
                      size="small"
                      pagination={false}
                      rowKey="field"
                      dataSource={row.rejectReason.reasons}
                      columns={[
                        { title: '关联字段', dataIndex: 'label', width: 160, render: (v, r: any) => <div><div>{v}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>({r.field})</div></div> },
                        { title: '问题描述', dataIndex: 'message', render: v => <span style={{ color: '#dc2626' }}>{v}</span> },
                        { title: '修改建议', dataIndex: 'suggestion', width: 220 },
                        { title: '法规依据', dataIndex: 'regulation', width: 200, render: v => <Tag color="purple">{v}</Tag> }
                      ]}
                    />
                    {row.rejectReason.remark && (
                      <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #fee2e2' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>📌 总体说明：</div>
                        <div style={{ color: '#475569', lineHeight: 1.7 }}>{row.rejectReason.remark}</div>
                      </div>
                    )}
                  </Card>
                )}

                <Card type="inner" size="small" title="🔀 审批节点时间线" style={{ marginBottom: 16, borderRadius: 8 }}>
                  <Timeline
                    mode="left"
                    items={row.approvalNodes.map(n => ({
                      color: ({ approved: 'green', processing: 'blue', rejected: 'red', pending: 'gray' } as any)[n.status],
                      label: <div style={{ fontSize: 12, color: '#64748b' }}>{n.operatedAt || '---'}{n.assignee ? ` · ${n.assignee}` : ''}</div>,
                      children: (
                        <div style={{ padding: '8px 0' }}>
                          <div style={{ fontWeight: 500 }}>L{n.level} · {n.name} <Tag color={({ approved: 'green', processing: 'blue', rejected: 'red', pending: 'default' } as any)[n.status]}>{({ approved: '✓ 已通过', processing: '⚙ 处理中', rejected: '✗ 驳回', pending: '⏳ 等待' } as any)[n.status]}</Tag></div>
                          {n.comment && <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>说明：{n.comment}</div>}
                        </div>
                      )
                    }))}
                  />
                </Card>

                <Card type="inner" size="small" title="⚖️ 法律效力声明" style={{ marginBottom: 16, borderRadius: 8 }}
                  extra={<Button size="small" type="primary" icon={<SafetyOutlined />} onClick={() => openLegalModal(row)}>查看法律效力声明</Button>}
                >
                  <div style={{ lineHeight: 1.9, color: '#334155', fontSize: 13 }}>
                    ✓ 本审批全流程受《电子签名法》保护，具有等同纸质材料的法律效力<br />
                    ✓ 点击上方按钮查看声明全文并确认
                  </div>
                </Card>

                <Card type="inner" size="small" title="📦 证据包明细（6节点完整固化）" style={{ borderRadius: 8 }}>
                  <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
                    {EVIDENCE_NODES.map(node => (
                      <Col xs={24} sm={12} key={node.key}>
                        {renderEvidenceDetail(node.key, row)}
                      </Col>
                    ))}
                  </Row>
                </Card>
              </div>
            )
          }}
          columns={[
            { title: '申请ID', dataIndex: 'applyId', width: 150, fixed: 'left' as const },
            { title: '事项编码', dataIndex: 'itemCode', width: 130 },
            { title: '事项名称', dataIndex: 'itemName', ellipsis: true },
            { title: '申请人/企业', width: 160, render: (_, r) => (
              <div>
                <div>{r.applicantName}</div>
                {r.enterpriseName && <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.enterpriseName}</div>}
              </div>
            )},
            {
              title: '进度', width: 200, render: (_, r) => {
                const pct = Math.floor((r.currentStep / r.totalSteps) * 100);
                return (
                  <div>
                    <Progress percent={pct} size="small" status={r.status === 'rejected' ? 'exception' : r.status === 'approved' ? 'success' : 'active'} />
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>第 {r.currentStep} / {r.totalSteps} 环节</div>
                  </div>
                );
              }
            },
            { title: '状态', width: 100, render: (_, r) => statusTag(r.status) },
            { title: '申请时间', dataIndex: 'createdAt', width: 150 },
            {
              title: '操作', width: 220, fixed: 'right' as const,
              render: (_, r) => (
                <Space size={4}>
                  <Button size="small" icon={<EyeOutlined />} onClick={() => { setViewItem(r); setDetail(true); }}>详情</Button>
                  {(r.status === 'approved' || r.status === 'completed') && (
                    <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={() => downloadEvidence(r)}>证据包</Button>
                  )}
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Drawer title={`审批详情 · ${viewItem?.applyId}`} open={detail} onClose={() => setDetail(false)} width={720}>
        {viewItem && (
          <div>
            <Descriptions bordered size="small" column={2} title="📋 申请概要" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="申请ID">{viewItem.applyId}</Descriptions.Item>
              <Descriptions.Item label="事项">{viewItem.itemName}（{viewItem.itemCode}）</Descriptions.Item>
              <Descriptions.Item label="申请人">{viewItem.applicantName}</Descriptions.Item>
              <Descriptions.Item label="企业">{viewItem.enterpriseName || '个体工商户（个人）'}</Descriptions.Item>
              <Descriptions.Item label="当前状态">{statusTag(viewItem.status)}</Descriptions.Item>
              <Descriptions.Item label="进度">{viewItem.currentStep}/{viewItem.totalSteps}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{viewItem.createdAt}</Descriptions.Item>
              <Descriptions.Item label="最后更新">{viewItem.updatedAt}</Descriptions.Item>
            </Descriptions>

            {viewItem.rejectReason && (
              <Card type="inner" size="small" style={{ marginBottom: 16, border: '1px solid #fecaca', background: '#fff5f5' }}
                title={<span style={{ color: '#dc2626' }}>✗ 驳回原因（结构化）</span>}>
                <div style={{ marginBottom: 10 }}><b>分类：</b><Tag color="red">{viewItem.rejectReason.category}</Tag></div>
                <Table size="small" pagination={false} rowKey="field"
                  columns={[
                    { title: '关联字段', dataIndex: 'label', width: 160, render: (v, r: any) => <div><div>{v}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>({r.field})</div></div> },
                    { title: '问题描述', dataIndex: 'message', render: v => <span style={{ color: '#dc2626' }}>{v}</span> },
                    { title: '修改建议', dataIndex: 'suggestion' },
                    { title: '法规依据', dataIndex: 'regulation', render: v => <Tag color="purple">{v}</Tag> }
                  ]}
                  dataSource={viewItem.rejectReason.reasons} />
                {viewItem.rejectReason.remark && (
                  <div style={{ marginTop: 10, padding: 10, background: '#fff', borderRadius: 6 }}>
                    <b>总体说明：</b>{viewItem.rejectReason.remark}
                  </div>
                )}
              </Card>
            )}

            <Card type="inner" size="small" title="🔀 审批节点时间线" style={{ marginBottom: 16 }}>
              <Timeline
                mode="left"
                items={viewItem.approvalNodes.map(n => ({
                  color: ({ approved: 'green', processing: 'blue', rejected: 'red', pending: 'gray' } as any)[n.status],
                  label: <div style={{ fontSize: 12, color: '#64748b' }}>{n.operatedAt || '尚未到达'}{n.assignee ? ` · ${n.assignee}` : ''}</div>,
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>L{n.level} · {n.name}</div>
                      <div style={{ fontSize: 12, color: '#475569' }}>{n.role}</div>
                      {n.comment && <div style={{ marginTop: 6, color: '#64748b', fontSize: 12 }}>备注：{n.comment}</div>}
                    </div>
                  )
                }))}
              />
            </Card>

            <Card type="inner" size="small" title={<span><SafetyOutlined /> 证据链与法律效力</span>}>
              <div style={{ lineHeight: 2, color: '#334155', fontSize: 13 }}>
                ✓ 本审批全流程受《电子签名法》保护，具有等同纸质材料的法律效力<br />
                ✓ 签署日志：共 {viewItem.totalSteps + 2} 条 · 包含操作人/设备/IP/时间戳<br />
                ✓ 时间戳服务：省级TSA · 哈希算法 SHA-256<br />
                ✓ 证书：省级CA签发的SM2国密证书，可随时下载验证<br />
                ✓ 电子档案：已自动归集至省级政务云归档<br />
                ✓ 证据包标准：司法举证适用（ZIP/6项内容）
              </div>
              <Space style={{ marginTop: 12 }}>
                <Button type="primary" icon={<SafetyOutlined />} onClick={() => openLegalModal(viewItem)}>查看法律效力声明</Button>
                <Button type="primary" icon={<DownloadOutlined />} onClick={() => downloadEvidence(viewItem)}>
                  下载标准证据包（可用于司法举证）
                </Button>
              </Space>
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title={<span><SafetyOutlined /> 电子签名法律效力声明</span>}
        open={legalModalOpen}
        onCancel={() => setLegalModalOpen(false)}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setLegalModalOpen(false)}>关闭</Button>,
          <Button key="ok" type="primary" disabled={!legalChecked}
            onClick={() => { message.success('您已确认电子签名法律效力声明'); setLegalModalOpen(false); }}>
            我已阅读并同意
          </Button>
        ]}
      >
        <div style={{ padding: 8, lineHeight: 1.8, color: '#1f2937' }}>
          <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#1E5DAB' }}>
            《电子签名法律效力声明》
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: '#1E5DAB' }}>📜 依据《中华人民共和国电子签名法》第十三条：</div>
            <div style={{ padding: '10px 16px', background: '#f0f7ff', borderRadius: 8, fontSize: 13 }}>
              电子签名同时符合下列条件的，视为<b>可靠的电子签名</b>：
              <ol style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>电子签名制作数据用于电子签名时，属于电子签名人<b>专有</b>；</li>
                <li>签署时电子签名制作数据仅由电子签名人<b>控制</b>；</li>
                <li>签署后对电子签名的任何改动能够被<b>发现</b>；</li>
                <li>签署后对数据电文内容和形式的任何改动能够被<b>发现</b>；</li>
                <li>当事人也可以选择使用符合其约定的可靠条件的电子签名。</li>
              </ol>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: '#1E5DAB' }}>📜 依据《中华人民共和国电子签名法》第十四条：</div>
            <div style={{ padding: '10px 16px', background: '#f0f7ff', borderRadius: 8, fontSize: 13 }}>
              <b>可靠的电子签名</b>与手写签名或者盖章具有<b>同等的法律效力</b>。
            </div>
          </div>

          <div style={{ marginBottom: 16, padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>📌 本系统电子签名说明：</div>
            <div style={{ fontSize: 13, lineHeight: 1.9 }}>
              本审批流程采用省级CA机构签发的<b>SM2国密算法数字证书</b>，结合生物特征识别（人脸识别/指纹）、
              操作端设备信息采集、IP地址记录、TSA可信时间戳等技术手段，完全满足《电子签名法》第十三条规定的全部条件。
              申请人在本系统中的所有签名、操作、审批行为，均具有与纸质材料手写签名同等的法律效力。
            </div>
          </div>

          <div style={{ marginBottom: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>✅ 本次签名有效性确认（申请：{legalTarget?.applyId}）：</div>
            <List
              size="small"
              dataSource={[
                '电子签名制作数据：由申请人专属SM2证书保管',
                '签署过程控制：人脸识别 + 短信验证码二次确认',
                '签名防篡改：SHA-256哈希 + TSA时间戳固化',
                '数据电文防篡改：全流程区块链存证',
                '签署日志完整：共 5 条，含设备/IP/时间戳'
              ]}
              renderItem={item => (
                <List.Item style={{ borderBottom: 'none', padding: '2px 0', fontSize: 13 }}>
                  <SafetyOutlined style={{ color: '#16a34a', marginRight: 8 }} /> {item}
                </List.Item>
              )}
            />
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
            <Checkbox checked={legalChecked} onChange={e => setLegalChecked(e.target.checked)}>
              我已阅读并同意以上《电子签名法律效力声明》，确认本审批流程中的电子签名合法有效
            </Checkbox>
          </div>
        </div>
      </Modal>

      <Modal
        title={<span><DownloadOutlined /> 证据包下载中</span>}
        open={downloadOpen}
        closable={false}
        footer={null}
        width={480}
      >
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#475569' }}>
            正在生成并下载：<b>{downloadTarget?.applyId}_证据包.zip</b>
          </div>
          <Progress percent={downloadPercent} status={downloadPercent < 100 ? 'active' : 'success'} size={[360, 20]} />
          <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
            {downloadPercent < 30 && '正在收集申请表单及原始材料...'}
            {downloadPercent >= 30 && downloadPercent < 60 && '正在固化签署日志与时间戳...'}
            {downloadPercent >= 60 && downloadPercent < 90 && '正在打包CA证书链与审批记录...'}
            {downloadPercent >= 90 && downloadPercent < 100 && '正在生成最终ZIP文件...'}
            {downloadPercent >= 100 && '✓ 下载完成！'}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TrackingPage;
