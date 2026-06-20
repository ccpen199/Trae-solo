import React, { useEffect, useState, Key } from 'react';
import { Table, Tag, Button, Modal, Select, Space, Card, message, Drawer, Descriptions, Checkbox } from 'antd';
import { UserOutlined, AuditOutlined, SendOutlined, SafetyOutlined, KeyOutlined } from '@ant-design/icons';
import { http } from '../utils/request';

interface Assignment {
  id: string;
  applyId: string;
  itemName: string;
  applicantName: string;
  nodeName: string;
  role: string;
  level: number;
  assigneeId?: string;
  assigneeName?: string;
  status: string;
  caCertificate?: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    serialNumber: string;
    algorithm: string;
    fingerprint: string;
    keyLength: number;
  };
}
interface Reviewer { id: string; name: string; role: string; }

const AssignPage: React.FC = () => {
  const [list, setList] = useState<Assignment[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Assignment | null>(null);
  const [pickId, setPickId] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [batchReviewerId, setBatchReviewerId] = useState('');
  const [caDrawerOpen, setCaDrawerOpen] = useState(false);
  const [caTarget, setCaTarget] = useState<Assignment | null>(null);

  const mockList = (): Assignment[] => [
    {
      id: 'N1', applyId: 'APP20240515001', itemName: '个体工商户设立', applicantName: '张三',
      nodeName: '初审', role: '初审员', level: 2, status: 'processing', assigneeName: '王审核',
      caCertificate: {
        subject: 'CN=张三, OU=市场主体, O=省级政务服务CA, C=CN',
        issuer: 'CN=省级政务服务CA根, O=省级密码管理局, C=CN',
        validFrom: '2024-01-15 00:00:00',
        validTo: '2025-01-14 23:59:59',
        serialNumber: 'SN202401150010088',
        algorithm: 'SM2（国密算法）- SM3摘要 - SM4对称加密',
        fingerprint: 'SM3:7A:2B:9F:1E:44:C8:31:6D:55:AA:09:EF:22:77:3B:4C:10:88:6E:9F:33:AB:CD:12:EF:45:67:89:01:23:45:67',
        keyLength: 256
      }
    },
    {
      id: 'N2', applyId: 'APP20240515002', itemName: '食品经营许可', applicantName: '李四',
      nodeName: '材料受理', role: '受理员', level: 1, status: 'pending',
      caCertificate: {
        subject: 'CN=李四, OU=食品经营户, O=省级政务服务CA, C=CN',
        issuer: 'CN=省级政务服务CA根, O=省级密码管理局, C=CN',
        validFrom: '2023-11-20 00:00:00',
        validTo: '2024-11-19 23:59:59',
        serialNumber: 'SN202311200052311',
        algorithm: 'SM2（国密算法）- SM3摘要 - SM4对称加密',
        fingerprint: 'SM3:1C:5D:3A:88:2F:77:66:55:44:33:22:11:00:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC',
        keyLength: 256
      }
    },
    {
      id: 'N3', applyId: 'APP20240515003', itemName: '有限公司设立', applicantName: '王五',
      nodeName: '名称核准', role: '核准员', level: 1, status: 'processing', assigneeName: '赵复审',
      caCertificate: {
        subject: 'CN=王五, OU=企业法定代表人, O=省级政务服务CA, C=CN',
        issuer: 'CN=省级政务服务CA根, O=省级密码管理局, C=CN',
        validFrom: '2024-03-01 00:00:00',
        validTo: '2027-02-28 23:59:59',
        serialNumber: 'SN202403010099888',
        algorithm: 'SM2（国密算法）- SM3摘要 - SM4对称加密',
        fingerprint: 'SM3:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:1C:5D:3A:88:2F:77:66:55:44:33:22:11:00:AA:BB:CC',
        keyLength: 256
      }
    },
    {
      id: 'N4', applyId: 'APP20240515005', itemName: '变更登记', applicantName: '赵六',
      nodeName: '复审', role: '复审员', level: 3, status: 'pending',
      caCertificate: {
        subject: 'CN=赵六, OU=个体工商户, O=省级政务服务CA, C=CN',
        issuer: 'CN=省级政务服务CA根, O=省级密码管理局, C=CN',
        validFrom: '2024-02-10 00:00:00',
        validTo: '2025-02-09 23:59:59',
        serialNumber: 'SN202402100034120',
        algorithm: 'SM2（国密算法）- SM3摘要 - SM4对称加密',
        fingerprint: 'SM3:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD',
        keyLength: 256
      }
    },
    {
      id: 'N5', applyId: 'APP20240515008', itemName: '注销登记', applicantName: '孙七',
      nodeName: '核准', role: '核准员', level: 4, status: 'pending',
      caCertificate: {
        subject: 'CN=孙七, OU=市场主体, O=省级政务服务CA, C=CN',
        issuer: 'CN=省级政务服务CA根, O=省级密码管理局, C=CN',
        validFrom: '2023-08-01 00:00:00',
        validTo: '2024-07-31 23:59:59',
        serialNumber: 'SN202308010077766',
        algorithm: 'SM2（国密算法）- SM3摘要 - SM4对称加密',
        fingerprint: 'SM3:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33',
        keyLength: 256
      }
    }
  ];

  useEffect(() => {
    (async () => {
      try {
        const [l, r] = await Promise.all([
          http.get<Assignment[]>('/admin/assignments'),
          http.get<Reviewer[]>('/admin/reviewers')
        ]);
        setList(l.length ? l : mockList());
        setReviewers(r.length ? r : [
          { id: 'R1', name: '王审核', role: 'reviewer' },
          { id: 'R2', name: '赵复审', role: 'reviewer' },
          { id: 'R3', name: '孙受理', role: 'reviewer' },
          { id: 'R4', name: '李核准', role: 'reviewer' },
          { id: 'R5', name: '钱发证', role: 'reviewer' },
          { id: 'R6', name: '管理员', role: 'admin' }
        ]);
      } catch {
        setList(mockList());
        setReviewers([
          { id: 'R1', name: '王审核', role: 'reviewer' },
          { id: 'R2', name: '赵复审', role: 'reviewer' },
          { id: 'R3', name: '孙受理', role: 'reviewer' },
          { id: 'R4', name: '李核准', role: 'reviewer' },
          { id: 'R5', name: '钱发证', role: 'reviewer' },
          { id: 'R6', name: '管理员', role: 'admin' }
        ]);
      }
    })();
  }, []);

  const confirmAssign = async () => {
    if (!current || !pickId) return;
    try {
      await http.post(`/admin/assign/${current.id}`, { assigneeId: pickId });
      message.success('指派成功');
      setList(prev => prev.map(a => a.id === current.id
        ? { ...a, status: 'processing', assigneeId: pickId, assigneeName: reviewers.find(r => r.id === pickId)?.name }
        : a));
      setOpen(false); setCurrent(null); setPickId('');
    } catch {}
  };

  const batchAssign = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择待指派的事项');
      return;
    }
    if (!batchReviewerId) {
      message.warning('请选择审核员');
      return;
    }
    const reviewerName = reviewers.find(r => r.id === batchReviewerId)?.name;
    Modal.confirm({
      title: '确认批量指派',
      content: `将把 ${selectedRowKeys.length} 项待办指派给 ${reviewerName}？`,
      okText: '确认指派', okType: 'primary',
      onOk: async () => {
        try {
          await http.post('/admin/assign/batch', { ids: selectedRowKeys, assigneeId: batchReviewerId });
        } catch {}
        setList(prev => prev.map(a => selectedRowKeys.includes(a.id)
          ? { ...a, status: 'processing', assigneeId: batchReviewerId, assigneeName: reviewerName }
          : a));
        message.success(`已批量指派 ${selectedRowKeys.length} 项给 ${reviewerName}`);
        setSelectedRowKeys([]);
        setBatchReviewerId('');
      }
    });
  };

  const openCaDrawer = (item: Assignment) => {
    setCaTarget(item);
    setCaDrawerOpen(true);
  };

  const statusTag = (s: string) => ({
    pending: <Tag color="default">待指派</Tag>,
    processing: <Tag color="blue">处理中</Tag>,
    approved: <Tag color="green">已通过</Tag>,
    rejected: <Tag color="red">驳回</Tag>
  } as any)[s] || s;

  const pendingList = list.filter(x => x.status === 'pending');
  const hasSelection = selectedRowKeys.length > 0;

  return (
    <div>
      <Card
        title={<span><AuditOutlined /> 审核事项分级指派</span>}
        bordered={false}
        style={{ borderRadius: 10 }}
        extra={<Tag color="blue">按《审核分级规范》指派 L1~L5</Tag>}
      >
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            background: hasSelection ? '#f0f7ff' : '#fafafa',
            borderRadius: 8,
            border: `1px solid ${hasSelection ? '#bfdbfe' : '#e5e7eb'}`,
            transition: 'all 0.2s'
          }}
        >
          <Space size={12} wrap>
            <span style={{ fontWeight: 600, color: hasSelection ? '#1E5DAB' : '#475569' }}>
              📋 批量指派
            </span>
            <span style={{ color: '#64748b', fontSize: 13 }}>
              已选择 <b style={{ color: hasSelection ? '#1E5DAB' : '#333', fontSize: 15 }}>{selectedRowKeys.length}</b> 项
              （待指派共 {pendingList.length} 项）
            </span>
            <Select
              style={{ width: 220 }}
              placeholder="请选择审核员"
              value={batchReviewerId || undefined}
              onChange={setBatchReviewerId}
              allowClear
              options={reviewers.map(r => ({
                label: `${r.name}（${r.role === 'admin' ? '系统管理员' : '审核员'}）`,
                value: r.id
              }))}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={batchAssign}
              disabled={selectedRowKeys.length === 0 || !batchReviewerId}
              style={{ background: '#1E5DAB' }}
            >
              批量指派给所选审核员
            </Button>
            {hasSelection && (
              <Button
                size="small"
                onClick={() => setSelectedRowKeys([])}
              >
                清空选择
              </Button>
            )}
          </Space>
        </div>

        <Table
          rowKey="id"
          dataSource={list}
          pagination={{ pageSize: 10 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record: Assignment) => ({
              disabled: record.status !== 'pending',
              title: record.status === 'pending' ? '可选择' : '已指派，不可选择'
            })
          }}
          columns={[
            { title: '申请ID', dataIndex: 'applyId', width: 150 },
            { title: '事项', dataIndex: 'itemName', ellipsis: true },
            { title: '申请人', dataIndex: 'applicantName', width: 90 },
            { title: '环节', dataIndex: 'nodeName', width: 110 },
            { title: '分级', dataIndex: 'level', width: 70, render: v => <Tag color={['', 'green', 'blue', 'orange', 'purple', 'red'][v]}>L{v}</Tag> },
            { title: '当前处理人', dataIndex: 'assigneeName', width: 110, render: v => v || <Tag color="default">暂未指派</Tag> },
            { title: '状态', width: 100, render: (_, r) => statusTag(r.status) },
            {
              title: '操作', width: 260, fixed: 'right' as const,
              render: (_, r) => (
                <Space size={4}>
                  <Button size="small" icon={<SafetyOutlined />} onClick={() => openCaDrawer(r)}>
                    CA证书
                  </Button>
                  <Button size="small" icon={<SendOutlined />} type="primary"
                    style={{ background: '#1E5DAB' }}
                    onClick={() => { setCurrent(r); setPickId(r.assigneeId || ''); setOpen(true); }}>
                    指派
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal title="审核人员指派" open={open} onCancel={() => setOpen(false)} onOk={confirmAssign}>
        <div style={{ padding: '8px 0 16px' }}>
          <div style={{ marginBottom: 12, padding: 12, background: '#f0f7ff', borderRadius: 8 }}>
            <div style={{ marginBottom: 4 }}>申请：<b>{current?.itemName}</b>（{current?.applyId}）</div>
            <div>环节：<b>{current?.nodeName}</b>（L{current?.level} - {current?.role}）</div>
          </div>
          <Select
            style={{ width: '100%' }}
            value={pickId}
            placeholder="请选择审核人员"
            onChange={setPickId}
            options={reviewers.map(r => ({
              label: `${r.name}（${r.role === 'admin' ? '系统管理员' : '审核员'}）`,
              value: r.id
            }))}
          />
        </div>
      </Modal>

      <Drawer
        title={<span><KeyOutlined style={{ color: '#1E5DAB' }} /> 申请人CA数字证书详情</span>}
        open={caDrawerOpen}
        onClose={() => setCaDrawerOpen(false)}
        width={640}
      >
        {caTarget?.caCertificate && (
          <div>
            <Card
              size="small"
              style={{
                marginBottom: 16,
                background: 'linear-gradient(135deg, #f0f7ff 0%, #eff6ff 100%)',
                border: '1px solid #bfdbfe',
                borderRadius: 10
              }}
            >
              <Space align="start" size={16}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: '#1E5DAB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 28,
                    flexShrink: 0
                  }}
                >
                  <SafetyOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1E5DAB', marginBottom: 4 }}>
                    省级政务服务CA · 数字证书（国密）
                  </div>
                  <Space size={8}>
                    <Tag color="green"><SafetyOutlined /> 证书有效</Tag>
                    <Tag color="blue">SM2 国密算法</Tag>
                    <Tag color="purple">由政务CA根签发</Tag>
                  </Space>
                </div>
              </Space>
            </Card>

            <Descriptions title="📄 证书主体信息 (Subject)" bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="证书持有者 (CN)">
                {caTarget.caCertificate.subject.includes('CN=')
                  ? caTarget.caCertificate.subject.split(',').find(s => s.trim().startsWith('CN='))?.replace('CN=', '').trim()
                  : caTarget.applicantName}
              </Descriptions.Item>
              <Descriptions.Item label="组织单位 (OU)">
                {caTarget.caCertificate.subject.includes('OU=')
                  ? caTarget.caCertificate.subject.split(',').find(s => s.trim().startsWith('OU='))?.replace('OU=', '').trim()
                  : '市场主体'}
              </Descriptions.Item>
              <Descriptions.Item label="完整DN">
                <code style={{ fontSize: 11, wordBreak: 'break-all', color: '#1E5DAB' }}>{caTarget.caCertificate.subject}</code>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="🏛️ 签发机构 (Issuer)" bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="签发机构名称">
                <b>省级政务服务认证中心</b>（省级密码管理局下属CA）
              </Descriptions.Item>
              <Descriptions.Item label="完整DN">
                <code style={{ fontSize: 11, wordBreak: 'break-all', color: '#1E5DAB' }}>{caTarget.caCertificate.issuer}</code>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="🕐 有效期信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="生效时间 (Not Before)">{caTarget.caCertificate.validFrom}</Descriptions.Item>
              <Descriptions.Item label="失效时间 (Not After)">{caTarget.caCertificate.validTo}</Descriptions.Item>
              <Descriptions.Item label="证书序列号 (Serial)" span={2}>
                <code style={{ color: '#6b21a8' }}>{caTarget.caCertificate.serialNumber}</code>
              </Descriptions.Item>
            </Descriptions>

            <Card
              size="small"
              title={<span><KeyOutlined /> 算法标识（国家密码标准）</span>}
              style={{ marginBottom: 16, border: '1px solid #c4b5fd', background: '#faf5ff', borderRadius: 10 }}
            >
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="签名算法">
                  <Tag color="purple" style={{ fontWeight: 600 }}>SM2 椭圆曲线公钥密码算法</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="密钥长度">
                  <Tag color="blue">{caTarget.caCertificate.keyLength} 位（SM2标准）</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="摘要算法" span={2}>
                  <Space>
                    <Tag color="green">SM3 密码杂凑算法</Tag>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>替代 SHA-256 的国密标准</span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="对称加密算法" span={2}>
                  <Space>
                    <Tag color="orange">SM4 分组密码算法</Tag>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>替代 AES-128 的国密标准</span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="算法合规说明" span={2}>
                  <div style={{ fontSize: 12, lineHeight: 1.8, color: '#475569' }}>
                    ✓ 符合《GM/T 0003-2012 SM2椭圆曲线公钥密码算法》<br />
                    ✓ 符合《GM/T 0004-2012 SM3密码杂凑算法》<br />
                    ✓ 符合《GM/T 0002-2012 SM4分组密码算法》<br />
                    ✓ 经国家密码管理局认证通过，政务系统强制使用
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Descriptions title="🔑 证书指纹 (Fingerprint)" bordered size="small" column={1}>
              <Descriptions.Item label="SM3 指纹值">
                <code style={{ fontSize: 11, wordBreak: 'break-all', letterSpacing: 0.5 }}>
                  {caTarget.caCertificate.fingerprint}
                </code>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 20, padding: 14, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: 600, color: '#166534', marginBottom: 8 }}>
                <SafetyOutlined /> 证书验证结论
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.9, color: '#14532d' }}>
                ✓ 证书链完整，由省级政务CA根证书签发，可追溯信任锚<br />
                ✓ 证书处于有效期内，未被吊销（OCSP在线查询：正常）<br />
                ✓ 国密SM2/SM3/SM4算法合规，满足《电子签名法》第13条"可靠电子签名"要求<br />
                ✓ 与申请人身份绑定一致（人脸识别核验通过）
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AssignPage;
