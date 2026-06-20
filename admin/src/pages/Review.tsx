import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, Card, Row, Col, Descriptions, Divider, Drawer, Space, message, Radio, List } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, FileTextOutlined, CommentOutlined, SafetyOutlined } from '@ant-design/icons';

interface ReviewItem {
  id: string; applyId: string; itemName: string; applicantName: string;
  nodeName: string; level: number; status: string; materials: string[];
  formData: any; signValid: boolean;
}

const REJECT_CATEGORIES = [
  { value: '材料不全', label: '材料不全', color: 'orange' },
  { value: '内容虚假', label: '内容虚假/不实', color: 'red' },
  { value: '格式错误', label: '格式/签章错误', color: 'purple' },
  { value: '资格不符', label: '主体资格不符', color: 'blue' },
  { value: '其他', label: '其他', color: 'default' }
];

const ReviewPage: React.FC = () => {
  const [list, setList] = useState<ReviewItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [current, setCurrent] = useState<ReviewItem | null>(null);
  const [form] = Form.useForm();
  const [reasons, setReasons] = useState<{ field: string; message: string; suggestion: string }[]>([
    { field: '', message: '', suggestion: '' }
  ]);

  useEffect(() => {
    setList([
      {
        id: 'R001', applyId: 'APP20240515001', itemName: '个体工商户设立登记',
        applicantName: '张三', nodeName: '初审', level: 2, status: 'processing',
        signValid: true, materials: ['身份证.pdf', '经营场所证明.pdf', '经营范围确认书.pdf'],
        formData: { 字号名称: 'XX小吃店', 经营类型: '餐饮服务', 经营地址: 'XX市XX区XX路88号', 经营范围: '餐饮服务；预包装食品零售' }
      },
      {
        id: 'R002', applyId: 'APP20240515003', itemName: '有限公司设立',
        applicantName: '王五', nodeName: '名称核准', level: 1, status: 'processing',
        signValid: true, materials: ['公司章程.pdf', '股东身份证明.pdf', '住所证明.pdf'],
        formData: { 公司名称: 'XX科技有限公司', 注册资本: '500万元', 经营范围: '软件开发；信息技术咨询' }
      }
    ]);
  }, []);

  const openDetail = (r: ReviewItem) => { setCurrent(r); setDetailOpen(true); };
  const openReject = (r: ReviewItem) => {
    setCurrent(r);
    form.resetFields();
    setReasons([{ field: '', message: '', suggestion: '' }]);
    setRejectOpen(true);
  };

  const approve = (r: ReviewItem) => {
    Modal.confirm({
      title: `确认通过审核？`,
      content: (
        <div>
          <div>申请：<b>{r.itemName}</b>（{r.applyId}）</div>
          <div>环节：<b>{r.nodeName}</b>（L{r.level}）</div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
            ✅ 电子签名验证有效 · 签署日志完备 · TSA时间戳可验证
          </div>
        </div>
      ),
      okText: '确认通过', okType: 'success', cancelText: '取消',
      onOk: () => {
        setList(prev => prev.map(x => x.id === r.id ? { ...x, status: 'approved' } : x));
        message.success('审核通过，已流转至下一环节');
      }
    });
  };

  const submitReject = async () => {
    const vals = await form.validateFields();
    const filled = reasons.filter(r => r.field && r.message);
    if (!filled.length) { message.warning('请至少添加一条驳回原因'); return; }
    setList(prev => prev.map(x => x.id === current?.id ? { ...x, status: 'rejected' } : x));
    message.success(`已驳回：${vals.category}，共 ${filled.length} 项`);
    setRejectOpen(false);
  };

  const addReason = () => setReasons(p => [...p, { field: '', message: '', suggestion: '' }]);
  const updReason = (i: number, k: keyof typeof reasons[0], v: string) =>
    setReasons(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  return (
    <div>
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
                  <Button size="small" icon={<CheckOutlined />} type="primary" onClick={() => approve(r)}>通过</Button>
                  <Button size="small" danger icon={<CloseOutlined />} onClick={() => openReject(r)}>驳回</Button>
                </Space>
              ) : <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
            }
          ]}
        />
      </Card>

      <Drawer title="申请详情与材料核验" open={detailOpen} onClose={() => setDetailOpen(false)} width={720}>
        {current && (
          <div>
            <Descriptions title="申请信息" bordered size="small" column={2}>
              <Descriptions.Item label="申请ID">{current.applyId}</Descriptions.Item>
              <Descriptions.Item label="事项名称">{current.itemName}</Descriptions.Item>
              <Descriptions.Item label="申请人">{current.applicantName}</Descriptions.Item>
              <Descriptions.Item label="当前环节">L{current.level} · {current.nodeName}</Descriptions.Item>
            </Descriptions>
            <Divider />
            <div style={{ marginBottom: 12, fontWeight: 600 }}>📋 表单字段</div>
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
            <Card size="small" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 8 }}>
                🔐 电子签名 & 证据链验证
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.9, color: '#334155' }}>
                ✓ 签名数据：SM2国密算法 · CA证书 <Tag color="blue">有效</Tag><br />
                ✓ 生物特征：人脸识别匹配度 98.5% · 指纹确认通过<br />
                ✓ 时间戳：TSA #TSA202405150001 · 哈希值可验证<br />
                ✓ 签署日志：共 5 条 · 设备信息/IP/操作时间完整
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title={<span><CommentOutlined /> 结构化驳回</span>}
        open={rejectOpen} onCancel={() => setRejectOpen(false)}
        onOk={submitReject} okText="确认驳回并推送" okType="danger" width={760}
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
            <Card size="small" style={{ marginBottom: 10 }} key={i}
              extra={<a style={{ color: '#ef4444' }} onClick={() => setReasons(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p)}>删除</a>}>
              <Row gutter={10}>
                <Col span={6}>
                  <Input placeholder="关联字段" value={r.field}
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
            </Card>
          ))}
          <Button type="dashed" block onClick={addReason} style={{ marginBottom: 16 }}>+ 添加驳回原因</Button>

          <Form.Item label="总体说明（给申请人）" name="remark">
            <Input.TextArea rows={3} placeholder="请简要说明驳回整体情况及下一步建议，申请人将第一时间收到通知" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewPage;
