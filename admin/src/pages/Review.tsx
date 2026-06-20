import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, Card, Row, Col, Descriptions, Divider, Drawer, Space, message, Radio, List, Alert, Timeline, Checkbox } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, FileTextOutlined, CommentOutlined, SafetyOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { http } from '../utils/request';

interface ReviewItem {
  id: string; applyId: string; itemName: string; applicantName: string;
  nodeName: string; level: number; status: string; materials: string[];
  formData: any; signValid: boolean;
  sign_logs?: { id: number; action: string; operator: string; ip: string; device: string; time: string; hash: string }[];
  approvalNodes?: { id: string; name: string; role: string; level: number; status: string; comment?: string; assignee?: string; operatedAt?: string }[];
}

const REJECT_CATEGORIES = [
  { value: '材料不全', label: '材料不全', color: 'orange' },
  { value: '内容虚假', label: '内容虚假/不实', color: 'red' },
  { value: '格式错误', label: '格式/签章错误', color: 'purple' },
  { value: '资格不符', label: '主体资格不符', color: 'blue' },
  { value: '其他', label: '其他', color: 'default' }
];

const REGULATION_OPTIONS = [
  { value: '《市场主体登记管理条例》第11条', label: '《市场主体登记管理条例》第11条' },
  { value: '《个体工商户登记管理办法》第14条', label: '《个体工商户登记管理办法》第14条' },
  { value: '《公司法》第23条', label: '《公司法》第23条' },
  { value: '《经营范围登记规范表述目录》', label: '《经营范围登记规范表述目录》' },
  { value: '《食品经营许可管理办法》第12条', label: '《食品经营许可管理办法》第12条' },
  { value: '其他法规/规范性文件', label: '其他法规/规范性文件' }
];

const ReviewPage: React.FC = () => {
  const [list, setList] = useState<ReviewItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [current, setCurrent] = useState<ReviewItem | null>(null);
  const [form] = Form.useForm();
  const [approveForm] = Form.useForm();
  const [reasons, setReasons] = useState<{ field: string; message: string; suggestion: string; regulation: string }[]>([
    { field: '经营场所证明', message: '经营地址与实际地址不符，缺少门牌号信息', suggestion: '请补充产权证明原件扫描件或最新租赁协议，并标注详细门牌号', regulation: '《市场主体登记管理条例》第11条' },
    { field: '身份证明', message: '身份证照片模糊，无法识别有效期', suggestion: '请重新上传清晰的身份证正反面照片，确保所有文字可识别', regulation: '《个体工商户登记管理办法》第14条' },
    { field: '经营范围', message: '经营范围中"食品销售"未标注具体类别', suggestion: '请明确标注为"预包装食品销售"或"散装食品销售"等具体类别', regulation: '《经营范围登记规范表述目录》' }
  ]);
  const [generateReceipt, setGenerateReceipt] = useState(true);
  const [pageAlertShown, setPageAlertShown] = useState(true);

  useEffect(() => {
    setList([
      {
        id: 'R001', applyId: 'APP20240515001', itemName: '个体工商户设立登记',
        applicantName: '张三', nodeName: '初审', level: 2, status: 'processing',
        signValid: true, materials: ['身份证.pdf', '经营场所证明.pdf', '经营范围确认书.pdf'],
        formData: { 字号名称: 'XX小吃店', 经营类型: '餐饮服务', 经营地址: 'XX市XX区XX路88号', 经营范围: '餐饮服务；预包装食品零售' },
        sign_logs: [
          { id: 1, action: '提交申请', operator: '张三（申请人）', ip: '192.168.1.101', device: 'iPhone 14 Pro / iOS 17.2', time: '2024-05-15 09:12:33', hash: 'a1b2c3d4e5f67890...' },
          { id: 2, action: '表单电子签名', operator: '张三（申请人）', ip: '192.168.1.101', device: 'iPhone 14 Pro / iOS 17.2', time: '2024-05-15 09:13:45', hash: 'f6e5d4c3b2a19876...' },
          { id: 3, action: '人脸识别核验', operator: '系统自动', ip: '-', device: '生物识别引擎 v3.2', time: '2024-05-15 09:14:02', hash: '9a8b7c6d5e4f3210...' },
          { id: 4, action: '材料上传确认', operator: '张三（申请人）', ip: '192.168.1.101', device: 'iPhone 14 Pro / iOS 17.2', time: '2024-05-15 09:15:18', hash: '1234567890abcdef...' },
          { id: 5, action: '最终确认提交', operator: '张三（申请人）', ip: '192.168.1.101', device: 'iPhone 14 Pro / iOS 17.2', time: '2024-05-15 09:16:00', hash: 'fedcba0987654321...' }
        ],
        approvalNodes: [
          { id: 'N1', name: '受理', role: '受理员', level: 1, status: 'approved', assignee: '孙受理', operatedAt: '2024-05-15 10:30:00', comment: '材料齐全，受理通过' },
          { id: 'N2', name: '初审', role: '初审员', level: 2, status: 'processing', assignee: '王审核' }
        ]
      },
      {
        id: 'R002', applyId: 'APP20240515003', itemName: '有限公司设立',
        applicantName: '王五', nodeName: '名称核准', level: 1, status: 'processing',
        signValid: true, materials: ['公司章程.pdf', '股东身份证明.pdf', '住所证明.pdf'],
        formData: { 公司名称: 'XX科技有限公司', 注册资本: '500万元', 经营范围: '软件开发；信息技术咨询' },
        sign_logs: [
          { id: 1, action: '名称自主申报', operator: '王五（申请人）', ip: '10.0.0.55', device: 'ThinkPad X1 / Windows 11', time: '2024-05-15 11:02:15', hash: 'abc123def456...' },
          { id: 2, action: '电子签名确认', operator: '王五（申请人）', ip: '10.0.0.55', device: 'ThinkPad X1 / Windows 11', time: '2024-05-15 11:03:28', hash: '789xyz012abc...' },
          { id: 3, action: '短信验证通过', operator: '系统自动', ip: '-', device: '短信网关', time: '2024-05-15 11:03:40', hash: 'def456ghi789...' }
        ],
        approvalNodes: [
          { id: 'N1', name: '名称核准', role: '核准员', level: 1, status: 'processing', assignee: '赵复审' }
        ]
      },
      {
        id: 'R003', applyId: 'APP20240515007', itemName: '食品经营许可（新办）',
        applicantName: '李四', nodeName: '材料审核', level: 3, status: 'processing',
        signValid: true, materials: ['经营场所布局图.pdf', '健康证.pdf', '食品安全管理制度.pdf'],
        formData: { 主体类型: '个体工商户', 经营场所: 'XX市XX区XX路66号', 经营项目: '预包装食品销售；热食类食品制售' },
        sign_logs: [
          { id: 1, action: '提交申请', operator: '李四（申请人）', ip: '172.16.0.33', device: 'HUAWEI Mate 60 / HarmonyOS 4.0', time: '2024-05-15 14:20:00', hash: 'aabbcc112233...' },
          { id: 2, action: '健康证上传确认', operator: '李四（申请人）', ip: '172.16.0.33', device: 'HUAWEI Mate 60 / HarmonyOS 4.0', time: '2024-05-15 14:21:30', hash: 'ddeeff445566...' },
          { id: 3, action: '人脸识别通过', operator: '系统自动', ip: '-', device: '人脸识别引擎', time: '2024-05-15 14:22:05', hash: '77889900aabb...' },
          { id: 4, action: '最终提交', operator: '李四（申请人）', ip: '172.16.0.33', device: 'HUAWEI Mate 60 / HarmonyOS 4.0', time: '2024-05-15 14:23:11', hash: 'ccddee112233...' }
        ],
        approvalNodes: [
          { id: 'N1', name: '受理', role: '受理员', level: 1, status: 'approved', assignee: '孙受理', operatedAt: '2024-05-15 15:00:00' },
          { id: 'N2', name: '初审', role: '初审员', level: 2, status: 'approved', assignee: '王审核', operatedAt: '2024-05-15 15:30:00' },
          { id: 'N3', name: '材料审核', role: '复审员', level: 3, status: 'processing', assignee: '赵复审' }
        ]
      }
    ]);
  }, []);

  const pendingCount = list.filter(x => x.status === 'processing').length;

  const openDetail = (r: ReviewItem) => { setCurrent(r); setDetailOpen(true); };
  const openReject = (r: ReviewItem) => {
    setCurrent(r);
    form.resetFields();
    setReasons([
      { field: '经营场所证明', message: '经营地址与实际地址不符，缺少门牌号信息', suggestion: '请补充产权证明原件扫描件或最新租赁协议，并标注详细门牌号', regulation: '《市场主体登记管理条例》第11条' },
      { field: '身份证明', message: '身份证照片模糊，无法识别有效期', suggestion: '请重新上传清晰的身份证正反面照片，确保所有文字可识别', regulation: '《个体工商户登记管理办法》第14条' },
      { field: '经营范围', message: '经营范围中"食品销售"未标注具体类别', suggestion: '请明确标注为"预包装食品销售"或"散装食品销售"等具体类别', regulation: '《经营范围登记规范表述目录》' }
    ]);
    setRejectOpen(true);
  };

  const openApprove = (r: ReviewItem) => {
    setCurrent(r);
    setGenerateReceipt(true);
    approveForm.resetFields();
    setApproveOpen(true);
  };

  const submitApprove = async () => {
    const vals = await approveForm.validateFields();
    setList(prev => prev.map(x => x.id === current?.id ? { ...x, status: 'approved' } : x));
    const msg = generateReceipt
      ? `审核通过，已流转至下一环节。法律效力声明电子回执${vals?.receiptEmail ? `将发送至 ${vals.receiptEmail}` : '已生成'}`
      : '审核通过，已流转至下一环节';
    message.success(msg);
    setApproveOpen(false);
  };

  const submitReject = async () => {
    const vals = await form.validateFields();
    const filled = reasons.filter(r => r.field && r.message);
    if (!filled.length) { message.warning('请至少添加一条驳回原因'); return; }
    setList(prev => prev.map(x => x.id === current?.id ? { ...x, status: 'rejected' } : x));
    message.success(`已驳回：${vals.category}，共 ${filled.length} 项`);
    setRejectOpen(false);
  };

  const addReason = () => setReasons(p => [...p, { field: '', message: '', suggestion: '', regulation: '' }]);
  const updReason = (i: number, k: keyof typeof reasons[0], v: string) =>
    setReasons(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  return (
    <div>
      {pageAlertShown && pendingCount > 0 && (
        <Alert
          message={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#1E5DAB' }} />
              <span>
                您有 <b style={{ color: '#1E5DAB', fontSize: 15 }}>{pendingCount}</b> 件待审核，请尽快完成
                <span style={{ color: '#64748b', fontSize: 13, marginLeft: 12 }}>（L1受理 → L2初审 → L3复审 → L4核准 → L5发证 共5级流程）</span>
              </span>
            </Space>
          }
          type="info"
          showIcon={false}
          style={{ marginBottom: 16, borderRadius: 10, borderLeft: '4px solid #1E5DAB', background: '#f0f7ff' }}
          closable
          onClose={() => setPageAlertShown(false)}
        />
      )}

      <Card title={<span><FileTextOutlined /> 分级审核工作台</span>} bordered={false} style={{ borderRadius: 10 }}>
        <Table
          rowKey="id" dataSource={list} pagination={{ pageSize: 10 }}
          columns={[
            { title: '申请ID', dataIndex: 'applyId', width: 150 },
            { title: '事项名称', dataIndex: 'itemName', ellipsis: true },
            { title: '申请人', dataIndex: 'applicantName', width: 90 },
            { title: '当前环节', dataIndex: 'nodeName', width: 110 },
            { title: '分级', width: 70, render: (_, r) => <Tag color={['', 'green', 'blue', 'orange', 'purple', 'red'][r.level]}>L{r.level}</Tag> },
            {
              title: '签名核验', width: 110,
              render: (_, r) => r.signValid
                ? <Tag color="green" icon={<SafetyOutlined />}>有效</Tag>
                : <Tag color="red">无效</Tag>
            },
            {
              title: '状态', width: 100,
              render: (_, r) => ({
                processing: <Tag color="blue">处理中</Tag>,
                approved: <Tag color="green">已通过</Tag>,
                rejected: <Tag color="red">已驳回</Tag>
              } as any)[r.status]
            },
            {
              title: '操作', width: 280, fixed: 'right' as const,
              render: (_, r) => r.status === 'processing' ? (
                <Space size={4}>
                  <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>查看</Button>
                  <Button size="small" icon={<CheckOutlined />} type="primary" onClick={() => openApprove(r)}>通过</Button>
                  <Button size="small" danger icon={<CloseOutlined />} onClick={() => openReject(r)}>驳回</Button>
                </Space>
              ) : <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
            }
          ]}
        />
      </Card>

      <Drawer title="申请详情与材料核验" open={detailOpen} onClose={() => setDetailOpen(false)} width={780}>
        {current && (
          <div>
            <Descriptions title="📋 申请信息" bordered size="small" column={2}>
              <Descriptions.Item label="申请ID">{current.applyId}</Descriptions.Item>
              <Descriptions.Item label="事项名称">{current.itemName}</Descriptions.Item>
              <Descriptions.Item label="申请人">{current.applicantName}</Descriptions.Item>
              <Descriptions.Item label="当前环节">L{current.level} · {current.nodeName}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 12, fontWeight: 600 }}>📝 表单字段</div>
            <Descriptions bordered size="small" column={1}>
              {Object.entries(current.formData || {}).map(([k, v]) => (
                <Descriptions.Item key={k} label={k}>{v as React.ReactNode}</Descriptions.Item>
              ))}
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 12, fontWeight: 600 }}>📎 提交材料清单</div>
            <List
              size="small"
              dataSource={current.materials}
              renderItem={(m, i) => (
                <List.Item>
                  <Space><span style={{ color: '#94a3b8' }}>{i + 1}.</span><FileTextOutlined />{m}<Tag color="green">已签名</Tag></Space>
                </List.Item>
              )}
            />

            <Divider />

            <div style={{ marginBottom: 12, fontWeight: 600 }}>🔀 审批节点时间线</div>
            <Card size="small" style={{ background: '#fafafa', marginBottom: 16 }}>
              <Timeline
                mode="left"
                items={(current.approvalNodes || []).map(n => ({
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

            <div style={{ marginBottom: 12, fontWeight: 600 }}>📜 申请人签署日志</div>
            <Card size="small" style={{ marginBottom: 16, border: '1px solid #bae6fd', background: '#f0f9ff' }}>
              <Table
                size="small"
                pagination={false}
                rowKey="id"
                dataSource={current.sign_logs || []}
                columns={[
                  { title: '序号', dataIndex: 'id', width: 50, render: v => `#${v}` },
                  { title: '操作行为', dataIndex: 'action', width: 140, render: v => <Tag color="blue">{v}</Tag> },
                  { title: '操作人', dataIndex: 'operator', width: 130 },
                  { title: '设备信息', dataIndex: 'device', ellipsis: true, render: v => <span style={{ fontSize: 12, color: '#475569' }}>{v}</span> },
                  { title: 'IP地址', dataIndex: 'ip', width: 110 },
                  { title: '操作时间', dataIndex: 'time', width: 150 },
                  { title: '哈希值', dataIndex: 'hash', render: v => <code style={{ fontSize: 11, color: '#1E5DAB' }}>{v}</code> }
                ]}
              />
            </Card>

            <Divider />

            <Card size="small" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 8 }}>
                <SafetyOutlined /> 电子签名 & 证据链验证
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.9, color: '#334155' }}>
                ✓ 签名数据：SM2国密算法 · CA证书 <Tag color="blue">有效</Tag><br />
                ✓ 生物特征：人脸识别匹配度 98.5% · 指纹确认通过<br />
                ✓ 时间戳：TSA #TSA202405150001 · 哈希值可验证<br />
                ✓ 签署日志：共 {(current.sign_logs || []).length} 条 · 设备信息/IP/操作时间完整
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title={<span><CommentOutlined /> 结构化驳回</span>}
        open={rejectOpen} onCancel={() => setRejectOpen(false)}
        onOk={submitReject} okText="确认驳回并推送" okType="danger" width={820}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="驳回分类" name="category" rules={[{ required: true, message: '请选择' }]}>
            <Radio.Group>
              {REJECT_CATEGORIES.map(c => (
                <Radio.Button key={c.value} value={c.value}>{c.label}</Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          <Divider orientation="left" style={{ marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>字段级驳回原因（可添加多条）</span>
          </Divider>

          {reasons.map((r, i) => (
            <Card size="small" style={{ marginBottom: 10, borderRadius: 8 }} key={i}
              extra={reasons.length > 1 ? <a style={{ color: '#ef4444' }} onClick={() => setReasons(p => p.filter((_, idx) => idx !== i))}>删除</a> : null}>
              <Row gutter={10}>
                <Col span={6}>
                  <Input placeholder="关联字段（如：经营场所证明）" value={r.field}
                    onChange={e => updReason(i, 'field', e.target.value)} />
                </Col>
                <Col span={9}>
                  <Input placeholder="问题描述（必填）" value={r.message}
                    onChange={e => updReason(i, 'message', e.target.value)} />
                </Col>
                <Col span={9}>
                  <Input placeholder="修改建议" value={r.suggestion}
                    onChange={e => updReason(i, 'suggestion', e.target.value)} />
                </Col>
              </Row>
              <div style={{ marginTop: 10 }}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="选择法规依据（可选）"
                  value={r.regulation || undefined}
                  onChange={v => updReason(i, 'regulation', v)}
                  allowClear
                  options={REGULATION_OPTIONS}
                />
              </div>
            </Card>
          ))}
          <Button type="dashed" block onClick={addReason} style={{ marginBottom: 16 }}>+ 添加驳回原因</Button>

          <Form.Item label="总体说明（给申请人）" name="remark">
            <Input.TextArea rows={3} placeholder="请简要说明驳回整体情况及下一步建议，申请人将第一时间收到通知" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span><CheckOutlined style={{ color: '#52c41a' }} /> 确认通过审核</span>}
        open={approveOpen}
        onCancel={() => setApproveOpen(false)}
        onOk={submitApprove}
        okText="确认通过" okType="primary"
        width={560}
        destroyOnClose
      >
        <Form form={approveForm} layout="vertical">
          <div style={{ marginBottom: 16, padding: 16, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <div style={{ marginBottom: 4 }}>申请：<b>{current?.itemName}</b>（{current?.applyId}）</div>
            <div style={{ marginBottom: 4 }}>环节：<b>{current?.nodeName}</b>（L{current?.level}）</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#16a34a', lineHeight: 1.8 }}>
              ✅ 电子签名验证有效 · 签署日志完备 · TSA时间戳可验证<br />
              ✅ 材料齐全，符合法定形式 · 生物特征核验通过
            </div>
          </div>

          <Form.Item label="审核意见" name="comment" rules={[{ required: true, message: '请填写审核意见' }]}>
            <Input.TextArea rows={3} placeholder="请填写审核意见，如：材料齐全，符合法定形式，同意通过" />
          </Form.Item>

          <Divider style={{ margin: '8px 0 16px' }} />

          <div style={{ padding: 12, background: '#f0f7ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 600, color: '#1E5DAB', marginBottom: 8 }}>
              ⚖️ 法律效力声明电子回执
            </div>
            <Checkbox checked={generateReceipt} onChange={e => setGenerateReceipt(e.target.checked)}>
              <span style={{ fontWeight: 500 }}>生成法律效力声明电子回执</span>（推荐）
            </Checkbox>
            <div style={{ marginTop: 8, paddingLeft: 24, fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
              回执包含：审批流水号、电子签名验证报告、TSA时间戳证明、CA证书指纹、审批结论等内容，
              依据《电子签名法》第13、14条具备完整司法效力。
            </div>
            {generateReceipt && (
              <Form.Item label="回执通知邮箱（可选）" name="receiptEmail" style={{ marginTop: 12, marginBottom: 0, paddingLeft: 24 }}>
                <Input placeholder="如填写，电子回执将自动发送至该邮箱" />
              </Form.Item>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewPage;
