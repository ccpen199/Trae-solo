import React, { useState } from 'react';
import { Table, Tag, Card, Row, Col, Statistic, Button, Space, Modal, message, Input, Progress, Descriptions, Timeline, List } from 'antd';
import { SafetyOutlined, DownloadOutlined, EyeOutlined, SearchOutlined, DatabaseOutlined, FileZipOutlined, CheckCircleOutlined, FileDoneOutlined, CloudServerOutlined } from '@ant-design/icons';

interface Archive {
  id: string;
  applyId: string;
  applyName: string;
  archiveName: string;
  fileHash: string;
  fileSize: number;
  items: string[];
  archivedAt: string;
  status: 'archived' | 'cloud_synced' | 'generating';
  cloudKey?: string;
}

const MOCK_ARCHIVES: Archive[] = [
  { id: 'A1', applyId: 'APP20240515001', applyName: '个体工商户设立-张三', archiveName: '证据包_APP20240515001.zip', fileHash: 'SHA256:abcd1234...ff00', fileSize: 3850000, items: ['申请书.pdf', '签署日志.json', 'TSA验证报告.pdf', 'CA证书.pem', '审批记录.pdf', '原始材料/'], archivedAt: '2024-05-15 14:23:08', status: 'cloud_synced', cloudKey: 'gov-cloud://province-mkt/archives/2024/05/APP20240515001.zip' },
  { id: 'A2', applyId: 'APP20240515002', applyName: '食品经营许可-李四', archiveName: '证据包_APP20240515002.zip', fileHash: 'SHA256:cdef5678...aa11', fileSize: 5120000, items: ['申请书.pdf', '签署日志.json', 'TSA验证报告.pdf', '现场核查照片/'], archivedAt: '2024-05-15 11:02:35', status: 'archived' },
  { id: 'A3', applyId: 'APP20240515003', applyName: '有限公司设立-王五', archiveName: '证据包_APP20240515003.zip', fileHash: 'SHA256:9876fedc...3344', fileSize: 4560000, items: ['申请书.pdf', '签署日志.json', 'TSA验证报告.pdf', '公司章程.pdf'], archivedAt: '2024-05-14 17:45:12', status: 'cloud_synced', cloudKey: 'gov-cloud://province-mkt/archives/2024/05/APP20240515003.zip' },
  { id: 'A4', applyId: 'APP20240515004', applyName: '变更登记-赵六', archiveName: '证据包_APP20240515004.zip', fileHash: 'SHA256:abcd5678...2233', fileSize: 2430000, items: ['变更申请书.pdf', '签署日志.json'], archivedAt: '2024-05-14 10:12:50', status: 'archived' },
  { id: 'A5', applyId: 'APP20240515005', applyName: '年报公示-孙七', archiveName: '证据包_APP20240515005.zip', fileHash: 'SHA256:5555aaaa...99bb', fileSize: 980000, items: ['年报报告.pdf', '签署日志.json'], archivedAt: '2024-05-14 09:33:10', status: 'archived' },
];

const EvidencePage: React.FC = () => {
  const [list, setList] = useState<Archive[]>(MOCK_ARCHIVES);
  const [kw, setKw] = useState('');
  const [viewItem, setViewItem] = useState<Archive | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const filtered = list.filter(a => !kw || a.applyId.includes(kw) || a.applyName.includes(kw));

  const counts = {
    total: list.length,
    cloud: list.filter(x => x.status === 'cloud_synced').length,
    local: list.filter(x => x.status === 'archived').length,
    size: list.reduce((s, x) => s + x.fileSize, 0)
  };

  const download = (a: Archive) => {
    Modal.confirm({
      title: '下载标准证据包',
      icon: <SafetyOutlined />,
      content: (
        <div>
          <div>申请：<b>{a.applyName}</b>（{a.applyId}）</div>
          <div>文件：{a.archiveName}（{(a.fileSize / 1024 / 1024).toFixed(2)} MB）</div>
          <div style={{ marginTop: 10, padding: 10, background: '#f0f9ff', borderRadius: 6, fontSize: 12, lineHeight: 1.8 }}>
            🔐 本证据包按司法举证标准封装：<br />
            • 电子签名原文及哈希校验<br />
            • 时间戳 TSA 验证报告（RFC3161）<br />
            • CA 证书链（SM2 国密）<br />
            • 签署全链路操作日志（设备/IP/生物特征）<br />
            • 审批分级节点记录与审核人签名<br />
            • 档案归集证明（政务云存管哈希）
          </div>
        </div>
      ),
      okText: '下载 ZIP', okType: 'primary',
      onOk: () => {
        const gen = (i: Archive, p: number) => new Promise<void>(res => {
          setTimeout(() => { setList(x => x.map(v => v.id === i.id ? v : v)); }, 80);
          if (p >= 100) { message.success(`${i.archiveName} 下载完成，已校验文件哈希`); res(); return; }
          res(gen(i, p + 12));
        });
        Modal.info({ title: '正在生成并下载', content: <Progress percent={0} status="active" />, okText: null, width: 520 });
        let p = 0;
        const t = setInterval(() => {
          p = Math.min(100, p + 12);
          Modal.info({ title: '正在生成并下载证据包', content: <Progress percent={p} status={p >= 100 ? 'success' : 'active'} />, okText: p >= 100 ? '完成' : null, width: 520 });
          if (p >= 100) { clearInterval(t); message.success('证据包下载完成'); }
        }, 180);
      }
    });
  };

  const viewEvidence = (a: Archive) => { setViewItem(a); setViewOpen(true); };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10 }}>
          <Statistic title={<><FileZipOutlined /> 证据包总数</>} value={counts.total} valueStyle={{ color: '#1E5DAB' }} />
        </Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10 }}>
          <Statistic title={<><CloudServerOutlined /> 政务云归档</>} value={counts.cloud} suffix="个" valueStyle={{ color: '#13c2c2' }} />
        </Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10 }}>
          <Statistic title={<><DatabaseOutlined /> 本地存储</>} value={counts.local} valueStyle={{ color: '#52c41a' }} />
        </Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10 }}>
          <Statistic title="总存储量" value={+(counts.size / 1024 / 1024 / 1024).toFixed(2)} suffix="GB" valueStyle={{ color: '#722ed1' }} />
        </Card></Col>
      </Row>

      <Card
        title={<span><SafetyOutlined /> 证据包 · 电子档案管理</span>}
        bordered={false} style={{ borderRadius: 10 }}
        extra={
          <Space>
            <Input.Search allowClear prefix={<SearchOutlined />} placeholder="申请ID/事项" value={kw}
              onChange={e => setKw(e.target.value)} style={{ width: 280 }} />
            <Button type="primary" icon={<FileDoneOutlined />}>批量归档至政务云</Button>
          </Space>
        }>
        <Table
          rowKey="id" dataSource={filtered} pagination={{ pageSize: 10 }}
          columns={[
            { title: '归档ID', dataIndex: 'id', width: 90 },
            { title: '申请ID', dataIndex: 'applyId', width: 150 },
            { title: '事项', dataIndex: 'applyName', ellipsis: true },
            { title: '档案名称', dataIndex: 'archiveName', width: 220 },
            { title: '大小', width: 100, render: (_, r) => <span>{(r.fileSize / 1024 / 1024).toFixed(2)} MB</span> },
            { title: '内容项', width: 100, render: (_, r) => <Tag color="blue">{r.items.length}项</Tag> },
            {
              title: '归档状态', width: 130,
              render: (_, r) => ({
                archived: <Tag color="green" icon={<CheckCircleOutlined />}>本地归档</Tag>,
                cloud_synced: <Tag color="cyan" icon={<CloudServerOutlined />}>政务云</Tag>,
                generating: <Tag color="orange" icon={<DatabaseOutlined />}>生成中</Tag>
              } as any)[r.status]
            },
            { title: '归档时间', dataIndex: 'archivedAt', width: 170 },
            {
              title: '操作', width: 180, fixed: 'right' as const,
              render: (_, r) => (
                <Space size={4}>
                  <Button size="small" icon={<EyeOutlined />} onClick={() => viewEvidence(r)}>校验</Button>
                  <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={() => download(r)}>下载</Button>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal title={<span><SafetyOutlined /> 证据链完整性校验</span>} open={viewOpen} onCancel={() => setViewOpen(false)}
        width={780} footer={[<Button key="c" onClick={() => setViewOpen(false)}>关闭</Button>, <Button key="d" type="primary" icon={<DownloadOutlined />} onClick={() => viewItem && download(viewItem)}>下载证据包</Button>]}>
        {viewItem && (
          <div>
            <Descriptions bordered size="small" column={2} title="📦 档案概要" style={{ marginBottom: 14 }}>
              <Descriptions.Item label="档案">{viewItem.archiveName}</Descriptions.Item>
              <Descriptions.Item label="申请">{viewItem.applyName}</Descriptions.Item>
              <Descriptions.Item label="文件哈希 (SHA-256)">
                <code style={{ color: '#ef4444', fontSize: 11, wordBreak: 'break-all' }}>{viewItem.fileHash}</code>
              </Descriptions.Item>
              <Descriptions.Item label="大小">{(viewItem.fileSize / 1024 / 1024).toFixed(2)} MB</Descriptions.Item>
              <Descriptions.Item label="归档时间">{viewItem.archivedAt}</Descriptions.Item>
              <Descriptions.Item label="存管">{viewItem.cloudKey ? <Tag color="cyan">政务云</Tag> : <Tag>本地</Tag>}</Descriptions.Item>
            </Descriptions>
            <Card size="small" style={{ marginBottom: 12 }} title="📋 证据清单">
              <List size="small" dataSource={viewItem.items} renderItem={(it, i) => (
                <List.Item actions={[<Tag color="green" key="v">✓ 哈希验证</Tag>]}>
                  <Space>{i + 1}. <FileDoneOutlined /> {it}</Space>
                </List.Item>
              )} />
            </Card>
            <Card size="small" title="🔗 证据链时间线">
              <Timeline
                items={[
                  { color: 'green', children: <div>📄 <b>申请提交</b><div style={{ fontSize: 12, color: '#64748b' }}>{viewItem.archivedAt.slice(0, 10)} 09:10 · 申请人提交</div></div> },
                  { color: 'blue', children: <div>✍️ <b>电子签名完成</b><div style={{ fontSize: 12, color: '#64748b' }}>SM2国密 · 生物特征核验 · 操作日志：5 条</div></div> },
                  { color: 'cyan', children: <div>🕒 <b>TSA 可信时间戳签发</b><div style={{ fontSize: 12, color: '#64748b' }}>省级TSA · RFC3161标准 · 序列号 TSA{viewItem.id}0001</div></div> },
                  { color: 'purple', children: <div>✅ <b>分级审批通过</b><div style={{ fontSize: 12, color: '#64748b' }}>共 {viewItem.items.length} 环节，全部节点已签核</div></div> },
                  { color: '#722ed1', children: <div>☁️ <b>政务云归档</b><div style={{ fontSize: 12, color: '#64748b' }}>{viewItem.cloudKey || '本地备份，待同步政务云'}</div></div> }
                ]}
              />
            </Card>
            <div style={{ marginTop: 12, padding: 12, background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', fontSize: 13, color: '#065f46' }}>
              ✅ <b>校验结果：证据链完整，未被篡改</b>（{new Date().toLocaleString('zh-CN')}）
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EvidencePage;
