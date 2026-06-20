import React, { useState } from 'react';
import { Table, Tag, Card, Input, Select, Space, Row, Col, Progress, Button, Timeline, Modal, Descriptions, Drawer, Empty, message } from 'antd';
import { SearchOutlined, DownloadOutlined, FileDoneOutlined, SafetyOutlined, EyeOutlined, FilterOutlined } from '@ant-design/icons';

interface TrackItem {
  id: string; applyId: string; itemName: string; itemCode: string;
  applicantName: string; enterpriseName?: string;
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  currentStep: number; totalSteps: number;
  rejectReason?: any;
  approvalNodes: { id: string; name: string; role: string; level: number; status: string; comment?: string; assignee?: string; operatedAt?: string }[];
  createdAt: string; updatedAt: string;
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
    rejectReason: sts[i] === 'rejected' ? { category: '材料不全', reasons: [{ field: '经营场所证明', message: '经营地址与实际不符', suggestion: '请补充产权证明或租赁协议' }], remark: '请补充材料后重新提交' } : undefined,
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
    updatedAt: `2024-05-${10 + (i % 5) + (cur % 3)} 16:${String(20 + i).slice(-2)}:00`
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

const TrackingPage: React.FC = () => {
  const [list] = useState<TrackItem[]>(MOCK);
  const [kw, setKw] = useState('');
  const [status, setStatus] = useState('');
  const [viewItem, setViewItem] = useState<TrackItem | null>(null);
  const [detail, setDetail] = useState(false);

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

  const downloadEvidence = (item: TrackItem) => {
    Modal.confirm({
      title: `生成证据包：${item.applyId}`,
      content: '将生成包含申请表、签署日志、时间戳验证报告、CA证书、审批记录的标准证据包 (ZIP)，用于司法举证。',
      okText: '生成并下载', okType: 'primary',
      onOk: () => message.success(`证据包生成中，稍后推送：${item.applyId}_证据包.zip`)
    });
  };

  const summaryCounts = {
    total: list.length,
    reviewing: list.filter(x => x.status === 'reviewing' || x.status === 'submitted').length,
    approved: list.filter(x => x.status === 'approved' || x.status === 'completed').length,
    rejected: list.filter(x => x.status === 'rejected').length
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10 }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>全部申请</div><div style={{ fontSize: 26, fontWeight: 700 }}>{summaryCounts.total}</div></Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10, borderLeft: '4px solid #1890ff' }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>审核中</div><div style={{ fontSize: 26, fontWeight: 700, color: '#1890ff' }}>{summaryCounts.reviewing}</div></Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10, borderLeft: '4px solid #52c41a' }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>已通过</div><div style={{ fontSize: 26, fontWeight: 700, color: '#52c41a' }}>{summaryCounts.approved}</div></Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10, borderLeft: '4px solid #ef4444' }}><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>已驳回</div><div style={{ fontSize: 26, fontWeight: 700, color: '#ef4444' }}>{summaryCounts.rejected}</div></Card></Col>
      </Row>

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
                    { title: '关联字段', dataIndex: 'field', width: 160 },
                    { title: '问题描述', dataIndex: 'message' },
                    { title: '修改建议', dataIndex: 'suggestion' }
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
              <Button type="primary" block icon={<DownloadOutlined />} style={{ marginTop: 12 }} onClick={() => downloadEvidence(viewItem)}>
                下载标准证据包（可用于司法举证）
              </Button>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TrackingPage;
