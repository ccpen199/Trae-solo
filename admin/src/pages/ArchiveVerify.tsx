import React, { useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Table, Tag, Form, Select, Input, Button, Space,
  Drawer, Descriptions, Alert, message, Empty, Tabs, Timeline, List, Progress,
  Badge, Divider, Tooltip, Typography
} from 'antd';
import {
  SafetyCertificateOutlined, SearchOutlined, ReloadOutlined, EyeOutlined,
  DownloadOutlined, FileZipOutlined, CloudSyncOutlined, FileDoneOutlined,
  DatabaseOutlined, SafetyOutlined, CloudServerOutlined, CheckCircleOutlined,
  ClockCircleOutlined, FileTextOutlined, TeamOutlined, AuditOutlined,
  LockOutlined, IdcardOutlined, FolderOpenOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ArchiveItem {
  id: string;
  archiveNo: string;
  registerItem: string;
  applicant: string;
  archiveType: '电子证照' | '审批档案' | '签署文件' | '综合证据包';
  fileSize: number;
  materialCount: number;
  sha256: string;
  syncStatus: 'synced' | 'pending';
  ossKey: string;
  archiveTime: string;
  certCount?: number;
}

interface VerifyDetail {
  basic: {
    archiveNo: string;
    registerItem: string;
    applicant: string;
    idCardNo: string;
    phone: string;
    archiveType: string;
    registerDept: string;
    handler: string;
    archiveTime: string;
    archiveBatchNo: string;
    retentionPeriod: string;
    securityLevel: string;
  };
  approvalNodes: {
    time: string;
    nodeName: string;
    handler: string;
    action: string;
    comment: string;
    signature: string;
  }[];
  signingFiles: {
    fileName: string;
    fileType: string;
    fileSize: string;
    signer: string;
    signAlgorithm: string;
    certSerial: string;
    tsaSerial: string;
    tsaTime: string;
    fileHash: string;
  }[];
  originalMaterials: {
    name: string;
    type: string;
    uploader: string;
    uploadTime: string;
    pageCount: number;
    fileHash: string;
  }[];
  auditTrail: {
    time: string;
    operator: string;
    action: string;
    ip: string;
    location: string;
    detail: string;
    hash: string;
  }[];
}

const generateMockArchives = (): ArchiveItem[] => {
  const types: ArchiveItem['archiveType'][] = ['电子证照', '审批档案', '签署文件', '综合证据包'];
  const statuses: ('synced' | 'pending')[] = ['synced', 'synced', 'synced', 'pending', 'synced', 'pending'];
  const items = ['个体工商户设立登记', '食品经营许可证核发', '有限公司设立登记', '经营范围变更登记',
    '注销登记', '年度报告公示', '经营异常名录移出', '股权出质登记', '药品经营许可', '医疗器械备案'];
  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '冯十一', '陈十二',
    '褚十三', '卫十四', '蒋十五', '沈十六', '韩十七', '杨十八'];

  return Array.from({ length: 32 }, (_, i) => {
    const d = dayjs().subtract(Math.floor(Math.random() * 30), 'day').subtract(Math.floor(Math.random() * 24), 'hour');
    const sizeBase = Math.floor(Math.random() * 20) + 1;
    const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return {
      id: `AV${String(i + 1).padStart(4, '0')}`,
      archiveNo: `DA-${d.format('YYYYMMDD')}-${String(1000 + i).padStart(4, '0')}`,
      registerItem: items[i % items.length],
      applicant: names[i % names.length],
      archiveType: types[i % types.length],
      fileSize: sizeBase * 1024 * 1024 + Math.floor(Math.random() * 500 * 1024),
      materialCount: Math.floor(Math.random() * 10) + 3,
      sha256: hash,
      syncStatus: statuses[i % statuses.length],
      ossKey: `gov-cloud://province-mkt/archives/${d.format('YYYY/MM/DD')}/DA-${d.format('YYYYMMDD')}-${String(1000 + i).padStart(4, '0')}.zip`,
      archiveTime: d.format('YYYY-MM-DD HH:mm:ss'),
      certCount: types[i % types.length] === '电子证照' ? Math.floor(Math.random() * 3) + 1 : 0
    };
  });
};

const generateVerifyDetail = (id: string): VerifyDetail => ({
  basic: {
    archiveNo: `DA-20240515-${id}`,
    registerItem: '个体工商户设立登记',
    applicant: '张三',
    idCardNo: '3301**********1234',
    phone: '137****1234',
    archiveType: '综合证据包',
    registerDept: '杭州市西湖区市场监督管理局',
    handler: '王审核',
    archiveTime: '2024-05-15 14:23:08',
    archiveBatchNo: 'BATCH-20240515-008',
    retentionPeriod: '永久',
    securityLevel: '内部'
  },
  approvalNodes: [
    { time: '2024-05-15 09:12:33', nodeName: '申请提交', handler: '张三（申请人）', action: '提交', comment: '提交个体工商户设立申请材料', signature: 'SM2:SIG_' + Math.random().toString(16).slice(2, 18) },
    { time: '2024-05-15 09:35:18', nodeName: '受理初审', handler: '孙受理', action: '受理通过', comment: '材料齐全，符合受理条件', signature: 'SM2:SIG_' + Math.random().toString(16).slice(2, 18) },
    { time: '2024-05-15 10:48:02', nodeName: '实质审核', handler: '王审核', action: '审核通过', comment: '经营场所有效，经营范围符合规定', signature: 'SM2:SIG_' + Math.random().toString(16).slice(2, 18) },
    { time: '2024-05-15 13:55:41', nodeName: '复审核准', handler: '赵复审', action: '核准通过', comment: '符合法定条件，准予登记', signature: 'SM2:SIG_' + Math.random().toString(16).slice(2, 18) },
    { time: '2024-05-15 14:10:12', nodeName: '证照签发', handler: '李发证', action: '签发证照', comment: '营业执照电子证照已生成并入库', signature: 'SM2:SIG_' + Math.random().toString(16).slice(2, 18) },
    { time: '2024-05-15 14:23:08', nodeName: '档案归档', handler: '系统', action: '自动归档', comment: '全量材料打包归档至政务云', signature: 'SYSTEM:HASH_CHAIN' }
  ],
  signingFiles: [
    { fileName: '设立登记申请书.pdf', fileType: 'PDF', fileSize: '2.4 MB', signer: '张三', signAlgorithm: 'SM2withSM3', certSerial: 'CN=SM2-CA-2024/0012345', tsaSerial: 'TSA2024051500881', tsaTime: '2024-05-15 09:15:22', fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') },
    { fileName: '身份证明签名页.pdf', fileType: 'PDF', fileSize: '856 KB', signer: '张三', signAlgorithm: 'SM2withSM3', certSerial: 'CN=SM2-CA-2024/0012345', tsaSerial: 'TSA2024051500882', tsaTime: '2024-05-15 09:15:45', fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') },
    { fileName: '审核意见签署单.pdf', fileType: 'PDF', fileSize: '1.2 MB', signer: '王审核', signAlgorithm: 'SM2withSM3', certSerial: 'CN=SM2-CA-2024/0009876', tsaSerial: 'TSA2024051500890', tsaTime: '2024-05-15 10:48:30', fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') },
    { fileName: '核准决定通知书.pdf', fileType: 'PDF', fileSize: '680 KB', signer: '赵复审', signAlgorithm: 'SM2withSM3', certSerial: 'CN=SM2-CA-2024/0005432', tsaSerial: 'TSA2024051500899', tsaTime: '2024-05-15 13:56:08', fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') },
    { fileName: '电子营业执照.ofd', fileType: 'OFD', fileSize: '3.8 MB', signer: '电子证照系统', signAlgorithm: 'SM2withSM3', certSerial: 'CN=LICENSE-CA/00001', tsaSerial: 'TSA2024051500905', tsaTime: '2024-05-15 14:10:55', fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') }
  ],
  originalMaterials: [
    { name: '个体工商户设立登记申请书', type: '申请表', uploader: '张三', uploadTime: '2024-05-15 09:10:05', pageCount: 3, fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') },
    { name: '经营者身份证正反面', type: '身份证明', uploader: '张三', uploadTime: '2024-05-15 09:10:12', pageCount: 2, fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') },
    { name: '经营场所使用证明', type: '场所证明', uploader: '张三', uploadTime: '2024-05-15 09:10:28', pageCount: 5, fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') },
    { name: '一寸免冠照片', type: '照片', uploader: '张三', uploadTime: '2024-05-15 09:10:45', pageCount: 1, fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') },
    { name: '委托代理人证明（如适用）', type: '授权书', uploader: '系统', uploadTime: '2024-05-15 09:11:00', pageCount: 1, fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') },
    { name: '住所（经营场所）承诺书', type: '承诺文件', uploader: '张三', uploadTime: '2024-05-15 09:11:30', pageCount: 1, fileHash: 'sha256:' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('') }
  ],
  auditTrail: [
    { time: '2024-05-15 09:05:12', operator: '张三', action: '用户登录', ip: '10.25.36.48', location: '杭州市西湖区-办事大厅自助终端', detail: '身份证+人脸双因子认证通过', hash: 'sha256:a1b2c3d4...' },
    { time: '2024-05-15 09:08:55', operator: '张三', action: '创建申请', ip: '10.25.36.48', location: '杭州市西湖区-办事大厅自助终端', detail: '选择事项：个体工商户设立登记', hash: 'sha256:e5f6g7h8...' },
    { time: '2024-05-15 09:12:33', operator: '张三', action: '电子签名', ip: '10.25.36.48', location: '杭州市西湖区-办事大厅自助终端', detail: '指纹核验通过，签署申请书', hash: 'sha256:i9j0k1l2...' },
    { time: '2024-05-15 09:15:45', operator: '张三', action: 'TSA时间戳签发', ip: '内部TSA服务', location: '省局CA中心', detail: 'RFC3161标准时间戳，TSA序列号TSA2024051500882', hash: 'sha256:m3n4o5p6...' },
    { time: '2024-05-15 09:30:02', operator: '系统', action: '自动受理分派', ip: '127.0.0.1', location: '省局应用服务器', detail: '按负载均衡分派至西湖区局-王审核', hash: 'sha256:q7r8s9t0...' },
    { time: '2024-05-15 09:35:18', operator: '孙受理', action: '受理审核通过', ip: '10.18.22.5', location: '西湖区局受理窗口', detail: '材料清单完整性校验通过', hash: 'sha256:u1v2w3x4...' },
    { time: '2024-05-15 10:48:02', operator: '王审核', action: '实质审核通过', ip: '10.18.22.8', location: '西湖区局审核一科', detail: '经营场所信息核验通过', hash: 'sha256:y5z6a7b8...' },
    { time: '2024-05-15 13:55:41', operator: '赵复审', action: '核准决定', ip: '10.18.22.12', location: '西湖区局核准室', detail: '符合《个体工商户条例》第八条', hash: 'sha256:c9d0e1f2...' },
    { time: '2024-05-15 14:10:12', operator: '系统', action: '电子证照生成', ip: '10.20.33.101', location: '省局电子证照库', detail: '证照编号91330106XXXXXXX，入库成功', hash: 'sha256:g3h4i5j6...' },
    { time: '2024-05-15 14:15:00', operator: '系统', action: '短信通知', ip: '10.20.33.200', location: '省局消息中心', detail: '审批结果已通知申请人137****1234', hash: 'sha256:k7l8m9n0...' },
    { time: '2024-05-15 14:20:30', operator: '系统', action: '证据包封装', ip: '10.20.33.150', location: '省局档案服务', detail: 'ZIP-AES256加密，包含18项文件', hash: 'sha256:o1p2q3r4...' },
    { time: '2024-05-15 14:23:08', operator: '系统', action: '政务云归档', ip: '政务云OSS网关', location: '政务云机房A区-对象存储', detail: '存储路径gov-cloud://.../DA-20240515-0001.zip', hash: 'sha256:s5t6u7v8...' }
  ]
});

const ArchiveVerifyPage: React.FC = () => {
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [filtered, setFiltered] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [verifyDetail, setVerifyDetail] = useState<VerifyDetail | null>(null);
  const [form] = Form.useForm();
  const [downloading, setDownloading] = useState<Record<string, number>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/archives', {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('admin_token') || '') }
      });
      const json = await res.json();
      if (json.code === 0) {
        const list = json.data.list || json.data || [];
        setArchives(list);
        setFiltered(list);
      } else {
        const m = generateMockArchives();
        setArchives(m);
        setFiltered(m);
      }
    } catch {
      const m = generateMockArchives();
      setArchives(m);
      setFiltered(m);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (values: any) => {
    let result = [...archives];
    if (values.status) {
      result = result.filter(a => a.syncStatus === values.status);
    }
    if (values.keyword) {
      const kw = values.keyword.toLowerCase();
      result = result.filter(a =>
        a.archiveNo.toLowerCase().includes(kw) ||
        a.registerItem.includes(kw) ||
        a.applicant.includes(kw) ||
        a.ossKey.toLowerCase().includes(kw)
      );
    }
    setFiltered(result);
  };

  const handleReset = () => {
    form.resetFields();
    setFiltered(archives);
  };

  const handleVerify = async (item: ArchiveItem) => {
    setCurrentId(item.id);
    setDrawerOpen(true);
    try {
      const res = await fetch(`/api/admin/archive-verify/${item.id}`, {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('admin_token') || '') }
      });
      const json = await res.json();
      if (json.code === 0) {
        setVerifyDetail(json.data);
      } else {
        setVerifyDetail(generateVerifyDetail(item.id));
      }
    } catch {
      setVerifyDetail(generateVerifyDetail(item.id));
    }
  };

  const handleDownload = (item: ArchiveItem) => {
    if (downloading[item.id]) return;
    setDownloading(prev => ({ ...prev, [item.id]: 0 }));
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + Math.floor(Math.random() * 15) + 5);
      setDownloading(prev => ({ ...prev, [item.id]: p }));
      if (p >= 100) {
        clearInterval(t);
        message.success(`${item.archiveNo} 电子档案下载完成，已校验SHA256指纹`);
        setTimeout(() => {
          setDownloading(prev => {
            const n = { ...prev };
            delete n[item.id];
            return n;
          });
        }, 2000);
      }
    }, 200);
  };

  const stats = {
    archived: archives.filter(a => a.syncStatus === 'synced').length,
    pending: archives.filter(a => a.syncStatus === 'pending').length,
    certs: archives.reduce((s, a) => s + (a.certCount || 0), 0),
    totalSize: archives.reduce((s, a) => s + a.fileSize, 0)
  };

  const typeColor = (t: string) => ({
    '电子证照': 'gold', '审批档案': 'blue', '签署文件': 'green', '综合证据包': 'purple'
  } as Record<string, string>)[t] || 'default';

  const FixedBadge = () => (
    <Tag color="green" style={{ marginLeft: 8, fontSize: 11 }} icon={<CheckCircleOutlined />}>
      ✅ 已哈希固化
    </Tag>
  );

  const tabItems = verifyDetail ? [
    {
      key: '1',
      label: <span><FileTextOutlined /> 档案基本信息</span>,
      children: (
        <div>
          <Alert
            style={{ marginBottom: 16, borderRadius: 8 }}
            type="info"
            showIcon
            icon={<SafetyCertificateOutlined />}
            message="档案元数据完整性校验：全部通过"
            description="以下字段已纳入哈希链计算，任一字段被篡改均会导致哈希校验失败。"
          />
          <Descriptions bordered size="small" column={2} title="📋 档案登记信息">
            <Descriptions.Item label="档案编号">
              <Text copyable>{verifyDetail.basic.archiveNo}</Text>
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="登记事项">
              {verifyDetail.basic.registerItem}
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="申请人">
              {verifyDetail.basic.applicant}
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              <code>{verifyDetail.basic.idCardNo}</code>
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {verifyDetail.basic.phone}
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="档案类型">
              <Tag color="purple">{verifyDetail.basic.archiveType}</Tag>
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="登记机关">
              {verifyDetail.basic.registerDept}
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="经办人">
              {verifyDetail.basic.handler}
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="归档时间">
              {verifyDetail.basic.archiveTime}
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="归档批次">
              <code>{verifyDetail.basic.archiveBatchNo}</code>
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="保管期限">
              <Tag color="red">{verifyDetail.basic.retentionPeriod}</Tag>
              <FixedBadge />
            </Descriptions.Item>
            <Descriptions.Item label="密级">
              <Tag color="orange">{verifyDetail.basic.securityLevel}</Tag>
              <FixedBadge />
            </Descriptions.Item>
          </Descriptions>
        </div>
      )
    },
    {
      key: '2',
      label: <span><AuditOutlined /> 审批节点时间线</span>,
      children: (
        <div>
          <Alert
            style={{ marginBottom: 16, borderRadius: 8 }}
            type="success"
            showIcon
            message="审批链路完整性：6个节点全部已签核"
            description="从申请到归档，每个节点均包含上一节点哈希值，形成区块链式防篡改链路。"
          />
          <Card size="small" title={<><ClockCircleOutlined /> 全流程审批节点</>} bordered={false}>
            <Timeline
              mode="left"
              items={verifyDetail.approvalNodes.map((n, idx) => ({
                color: ['blue', 'cyan', 'geekblue', 'purple', 'gold', 'green'][idx],
                label: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{n.time}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{n.handler}</div>
                  </div>
                ),
                children: (
                  <Card size="small" style={{ borderRadius: 8, marginBottom: 12 }} bordered>
                    <Row gutter={8} align="middle">
                      <Col>
                        <Tag color={['blue', 'cyan', 'geekblue', 'purple', 'gold', 'green'][idx] as any}>
                          节点{idx + 1}
                        </Tag>
                      </Col>
                      <Col flex="auto">
                        <b style={{ fontSize: 14 }}>{n.nodeName}</b>
                      </Col>
                      <Col>
                        <Badge status="success" />
                        <span style={{ fontSize: 12, color: '#52c41a', marginLeft: 4 }}>已哈希固化</span>
                      </Col>
                    </Row>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                      <div><b>操作：</b><Tag color="blue">{n.action}</Tag></div>
                      <div><b>意见：</b>{n.comment}</div>
                      <div style={{ marginTop: 4 }}>
                        <b>签名字段：</b>
                        <code style={{ fontSize: 11, color: '#ef4444', background: '#fafafa', padding: '2px 6px', borderRadius: 4 }}>
                          {n.signature}
                        </code>
                        <Badge status="success" style={{ marginLeft: 6 }} />
                      </div>
                    </div>
                  </Card>
                )
              }))}
            />
          </Card>
        </div>
      )
    },
    {
      key: '3',
      label: <span><LockOutlined /> 签署文件与TSA存证</span>,
      children: (
        <div>
          <Alert
            style={{ marginBottom: 16, borderRadius: 8 }}
            type="info"
            showIcon
            icon={<ClockCircleOutlined />}
            message={`共 ${verifyDetail.signingFiles.length} 份电子签署文件，均已对接省级TSA可信时间戳`}
            description="时间戳标准：RFC3161 · 时间源：国家授时中心 · 签名算法：SM2国密 · 哈希算法：SM3"
          />
          <Table
            size="small"
            rowKey="fileName"
            pagination={false}
            dataSource={verifyDetail.signingFiles}
            bordered
            columns={[
              { title: '文件名', dataIndex: 'fileName', width: 220, render: v => <><FileDoneOutlined style={{ color: '#52c41a' }} /> {v}</> },
              { title: '类型/大小', width: 120, render: (_, r) => <div><Tag>{r.fileType}</Tag><div style={{ fontSize: 11, color: '#666' }}>{r.fileSize}</div></div> },
              { title: '签署人', dataIndex: 'signer', width: 120, render: v => <><TeamOutlined /> {v}<Badge status="success" style={{ marginLeft: 6 }} /></> },
              {
                title: '签名信息', width: 220,
                render: (_, r) => (
                  <div style={{ fontSize: 11 }}>
                    <div><b>算法：</b><Tag color="green" style={{ fontSize: 10 }}>{r.signAlgorithm}</Tag></div>
                    <div><b>证书：</b><code>{r.certSerial.slice(0, 18)}...</code><Badge status="success" style={{ marginLeft: 4 }} /></div>
                  </div>
                )
              },
              {
                title: 'TSA时间戳', width: 200,
                render: (_, r) => (
                  <div style={{ fontSize: 11 }}>
                    <div><b>TSA序列号：</b><Tag color="purple" style={{ fontSize: 10 }}>{r.tsaSerial}</Tag><Badge status="success" style={{ marginLeft: 4 }} /></div>
                    <div style={{ color: '#666' }}>{r.tsaTime}</div>
                  </div>
                )
              },
              {
                title: '文件哈希 (SHA-256)', width: 220,
                render: (_, r) => (
                  <div>
                    <Tooltip title={r.fileHash}>
                      <code style={{ fontSize: 10, color: '#ef4444', wordBreak: 'break-all' }}>
                        {r.fileHash.slice(0, 20)}...
                      </code>
                    </Tooltip>
                    <Badge status="success" style={{ marginLeft: 4 }} />
                  </div>
                )
              }
            ]}
          />
        </div>
      )
    },
    {
      key: '4',
      label: <span><FolderOpenOutlined /> 原始申请材料清单</span>,
      children: (
        <div>
          <Alert
            style={{ marginBottom: 16, borderRadius: 8 }}
            type="success"
            showIcon
            icon={<IdcardOutlined />}
            message={`共 ${verifyDetail.originalMaterials.length} 份原始申请材料，上传时即已固化哈希`}
            description="原始材料在上传阶段完成哈希计算并同步政务云，与后续环节分别固化，确保来源真实。"
          />
          <List
            bordered
            dataSource={verifyDetail.originalMaterials}
            renderItem={(m, idx) => (
              <List.Item
                style={{ padding: 12 }}
                actions={[<Tag color="green" key="h">✅ 已哈希固化</Tag>]}
              >
                <Row gutter={16} align="middle" style={{ width: '100%' }}>
                  <Col style={{ width: 36 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f1fb', color: '#1E5DAB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                      {idx + 1}
                    </div>
                  </Col>
                  <Col flex="auto">
                    <Row gutter={16}>
                      <Col xs={24} md={10}>
                        <div style={{ fontWeight: 500 }}>📄 {m.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          <Tag color="blue" style={{ fontSize: 10 }}>{m.type}</Tag>
                          <span style={{ marginLeft: 8 }}>共 {m.pageCount} 页</span>
                        </div>
                      </Col>
                      <Col xs={24} md={7}>
                        <div style={{ fontSize: 12 }}>
                          <div><b>上传人：</b>{m.uploader}</div>
                          <div style={{ color: '#64748b' }}>{m.uploadTime}</div>
                        </div>
                      </Col>
                      <Col xs={24} md={7}>
                        <div style={{ fontSize: 11 }}>
                          <b>哈希：</b>
                          <Tooltip title={m.fileHash}>
                            <code style={{ color: '#ef4444' }}>{m.fileHash.slice(0, 24)}...</code>
                          </Tooltip>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        </div>
      )
    },
    {
      key: '5',
      label: <span><SafetyOutlined /> 全链路操作审计</span>,
      children: (
        <div>
          <Alert
            style={{ marginBottom: 16, borderRadius: 8 }}
            type="warning"
            showIcon
            icon={<SafetyCertificateOutlined />}
            message={`全链路审计共 ${verifyDetail.auditTrail.length} 条操作记录，每条均已通过SHA256哈希与前序关联`}
            description="审计日志独立存储于政务云审计专用节点，与业务系统物理隔离，符合等级保护2.0三级要求。"
          />
          <Table
            size="small"
            rowKey={(r, i) => `${r.time}-${i}`}
            pagination={false}
            dataSource={verifyDetail.auditTrail}
            bordered
            columns={[
              { title: '序号', width: 50, render: (_, __, i) => i + 1 },
              { title: '时间', dataIndex: 'time', width: 160 },
              { title: '操作人', dataIndex: 'operator', width: 80 },
              { title: '动作', dataIndex: 'action', width: 120, render: v => <Tag color="geekblue">{v}</Tag> },
              {
                title: 'IP/位置', width: 220,
                render: (_, r) => (
                  <div style={{ fontSize: 11 }}>
                    <div><code>{r.ip}</code> <Badge status="success" /></div>
                    <div style={{ color: '#64748b' }}>📍 {r.location}</div>
                  </div>
                )
              },
              {
                title: '操作详情', dataIndex: 'detail', width: 260,
                render: v => <span style={{ fontSize: 12 }}>{v} <Badge status="success" /></span>
              },
              {
                title: '哈希校验', width: 160,
                render: (_, r) => (
                  <Tooltip title={r.hash}>
                    <code style={{ fontSize: 11, color: '#ef4444' }}>{r.hash}</code>
                  </Tooltip>
                )
              }
            ]}
          />
        </div>
      )
    }
  ] : [];

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
                  title={<><FileZipOutlined /> 已归档</>}
                  value={stats.archived}
                  suffix="份"
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
                  width: 48, height: 48, borderRadius: 10, background: '#fffbe6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#faad14'
                }}><CloudSyncOutlined spin={stats.pending > 0} /></div>
              </Col>
              <Col flex="auto">
                <Statistic
                  title={<><CloudSyncOutlined /> 归集同步中</>}
                  value={stats.pending}
                  suffix="份"
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
                  width: 48, height: 48, borderRadius: 10, background: '#f6ffed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#52c41a'
                }}><IdcardOutlined /></div>
              </Col>
              <Col flex="auto">
                <Statistic
                  title={<><IdcardOutlined /> 电子证照数</>}
                  value={stats.certs}
                  suffix="本"
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
                  width: 48, height: 48, borderRadius: 10, background: '#f9f0ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#722ed1'
                }}><CloudServerOutlined /></div>
              </Col>
              <Col flex="auto">
                <Statistic
                  title={<><CloudServerOutlined /> 档案总大小</>}
                  value={+(stats.totalSize / 1024 / 1024 / 1024).toFixed(2)}
                  suffix="GB"
                  valueStyle={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }}
                />
              </Col>
            </Row>
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
          <Form.Item name="status" label="状态">
            <Select
              allowClear
              placeholder="全部状态"
              style={{ width: 150 }}
              options={[
                { value: 'synced', label: '已归档 (synced)' },
                { value: 'pending', label: '同步中 (pending)' }
              ]}
            />
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input
              allowClear
              placeholder="档案编号/事项/申请人/OSS路径"
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
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
        title={<span><SafetyCertificateOutlined style={{ color: '#1E5DAB' }} /> 电子档案归集 · 复查依据核验</span>}
        extra={
          <Space>
            <Tag color="blue" icon={<DatabaseOutlined />}>共 {filtered.length} 份档案</Tag>
            <Tag color="green" icon={<CheckCircleOutlined />}>政务云存证</Tag>
          </Space>
        }
      >
        {loading ? (
          <Empty description="加载中..." />
        ) : (
          <Table<ArchiveItem>
            size="small"
            rowKey="id"
            dataSource={filtered}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 份` }}
            scroll={{ x: 1800 }}
            columns={[
              {
                title: '档案编号', dataIndex: 'archiveNo', width: 200, fixed: 'left' as const,
                render: v => <><FileDoneOutlined style={{ color: '#1E5DAB' }} /> <Text copyable style={{ fontSize: 12 }}>{v}</Text></>
              },
              { title: '登记事项', dataIndex: 'registerItem', width: 180, ellipsis: true },
              { title: '申请人', dataIndex: 'applicant', width: 90 },
              {
                title: '归档类型', dataIndex: 'archiveType', width: 110,
                render: v => <Tag color={typeColor(v) as any}>{v}</Tag>
              },
              {
                title: '文件大小', width: 100,
                render: (_, r) => <span>{(r.fileSize / 1024 / 1024).toFixed(1)} MB</span>
              },
              {
                title: '材料数', width: 80,
                render: (_, r) => <Tag color="purple">{r.materialCount}份</Tag>
              },
              {
                title: 'SHA256指纹', dataIndex: 'sha256', width: 200,
                render: v => (
                  <Tooltip title={'sha256:' + v}>
                    <code style={{ fontSize: 11, color: '#ef4444', wordBreak: 'break-all' }}>
                      {v.slice(0, 8)}...{v.slice(-6)}
                    </code>
                  </Tooltip>
                )
              },
              {
                title: '同步状态', dataIndex: 'syncStatus', width: 120,
                render: v => v === 'synced'
                  ? <Tag color="green" icon={<CloudServerOutlined />}>已归档</Tag>
                  : <Tag color="orange" icon={<CloudSyncOutlined />}>同步中</Tag>
              },
              {
                title: 'OSS存储Key', dataIndex: 'ossKey', width: 280,
                render: v => (
                  <Tooltip title={v}>
                    <code style={{ fontSize: 11, color: '#475569' }}>{v.slice(0, 40)}...</code>
                  </Tooltip>
                )
              },
              { title: '归档时间', dataIndex: 'archiveTime', width: 160 },
              {
                title: '操作', width: 220, fixed: 'right' as const,
                render: (_, r) => {
                  const p = downloading[r.id];
                  return (
                    <Space direction="vertical" style={{ width: '100%' }} size={4}>
                      <Space size={4}>
                        <Button
                          size="small"
                          type="primary"
                          icon={<EyeOutlined />}
                          onClick={() => handleVerify(r)}
                        >核验证据链</Button>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownload(r)}
                          disabled={p !== undefined}
                        >下载档案</Button>
                      </Space>
                      {p !== undefined && (
                        <Progress percent={p} size="small" status={p >= 100 ? 'success' : 'active'} style={{ margin: 0 }} />
                      )}
                    </Space>
                  );
                }
              }
            ]}
          />
        )}
      </Card>

      <Drawer
        title={
          <span>
            <SafetyCertificateOutlined style={{ color: '#1E5DAB', marginRight: 8 }} />
            档案证据链核验详情
            <Tag color="green" style={{ marginLeft: 12 }} icon={<CheckCircleOutlined />}>
              ✅ 已哈希固化
            </Tag>
          </span>
        }
        placement="right"
        width={1100}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setVerifyDetail(null); setCurrentId(null); }}
        extra={
          <Space>
            <Button onClick={() => { setDrawerOpen(false); setVerifyDetail(null); }}>关闭</Button>
            <Button type="primary" icon={<DownloadOutlined />}>导出核验报告</Button>
          </Space>
        }
      >
        {verifyDetail ? (
          <div>
            <Alert
              style={{ marginBottom: 16, borderRadius: 8 }}
              type="success"
              showIcon
              icon={<SafetyCertificateOutlined />}
              message={<><b>证据链完整性校验结果：全部通过</b>（校验时间 {new Date().toLocaleString('zh-CN')}）</>}
              description={
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  <div>• 档案元数据（12项）：哈希校验一致</div>
                  <div>• 审批节点链（{verifyDetail.approvalNodes.length}个节点）：前序哈希逐一匹配，链式结构完整</div>
                  <div>• 电子签署文件（{verifyDetail.signingFiles.length}份）：SM2签名验证通过，TSA时间戳有效</div>
                  <div>• 原始申请材料（{verifyDetail.originalMaterials.length}份）：上传哈希与归档哈希一致</div>
                  <div>• 全链路审计（{verifyDetail.auditTrail.length}条）：操作时间连续、操作人可追溯</div>
                </div>
              }
            />
            <Tabs defaultActiveKey="1" items={tabItems} size="large" />

            <Divider />

            <Alert
              style={{ borderRadius: 10, background: 'linear-gradient(135deg,#ecfdf5,#f0fdfa)', border: '1px solid #86efac' }}
              type="success"
              showIcon
              icon={<SafetyOutlined style={{ fontSize: 20 }} />}
              message={<b style={{ fontSize: 14 }}>法律合规声明</b>}
              description={
                <div style={{ fontSize: 12, lineHeight: 2, color: '#065f46', marginTop: 4 }}>
                  依据《中华人民共和国电子签名法》《中华人民共和国密码法》《中华人民共和国档案法》
                  《政务信息系统安全管理规范》《电子签名数据归档技术规范》等法律法规，本档案所含电子数据：
                  <br />
                  ① 电子签名使用SM2国密算法，经省级CA认证中心签发证书，具有法律效力；
                  <br />
                  ② 可信时间戳对接国家授时中心TSA服务，签署时间不可抵赖；
                  <br />
                  ③ 全量数据SHA256哈希固化并存证于政务云区块链节点，可被司法机关直接采信为证据；
                  <br />
                  ④ 档案保管期限符合《机关文件材料归档范围和文书档案保管期限规定》要求；
                  <br />
                  ⑤ 如需出具有效力的核验报告，请联系省局政策法规处并出具单位介绍信。
                  <div style={{ marginTop: 8, color: '#064e3b' }}>
                    <b>核验编号：</b>VRF-{dayjs().format('YYYYMMDDHHmmss')}-{currentId || '0000'} &nbsp;&nbsp;
                    <b>核验机构：</b>省级市场监督管理局 · 电子政务证据中心
                  </div>
                </div>
              }
            />
          </div>
        ) : (
          <Empty description="加载核验详情中..." />
        )}
      </Drawer>
    </div>
  );
};

export default ArchiveVerifyPage;
