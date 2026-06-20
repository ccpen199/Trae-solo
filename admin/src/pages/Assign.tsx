import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Select, Space, Card, message } from 'antd';
import { UserOutlined, AuditOutlined, SendOutlined } from '@ant-design/icons';
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
}
interface Reviewer { id: string; name: string; role: string; }

const AssignPage: React.FC = () => {
  const [list, setList] = useState<Assignment[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Assignment | null>(null);
  const [pickId, setPickId] = useState('');

  const mockList = (): Assignment[] => [
    { id: 'N1', applyId: 'APP20240515001', itemName: '个体工商户设立', applicantName: '张三', nodeName: '初审', role: '初审员', level: 2, status: 'processing', assigneeName: '王审核' },
    { id: 'N2', applyId: 'APP20240515002', itemName: '食品经营许可', applicantName: '李四', nodeName: '材料受理', role: '受理员', level: 1, status: 'pending' },
    { id: 'N3', applyId: 'APP20240515003', itemName: '有限公司设立', applicantName: '王五', nodeName: '名称核准', role: '核准员', level: 1, status: 'processing', assigneeName: '赵复审' },
    { id: 'N4', applyId: 'APP20240515005', itemName: '变更登记', applicantName: '赵六', nodeName: '复审', role: '复审员', level: 3, status: 'pending' },
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
          { id: 'R4', name: '管理员', role: 'admin' }
        ]);
      } catch {
        setList(mockList());
        setReviewers([
          { id: 'R1', name: '王审核', role: 'reviewer' },
          { id: 'R2', name: '赵复审', role: 'reviewer' },
          { id: 'R3', name: '孙受理', role: 'reviewer' },
          { id: 'R4', name: '管理员', role: 'admin' }
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

  const statusTag = (s: string) => ({
    pending: <Tag color="default">待指派</Tag>,
    processing: <Tag color="blue">处理中</Tag>,
    approved: <Tag color="green">已通过</Tag>,
    rejected: <Tag color="red">驳回</Tag>
  } as any)[s] || s;

  return (
    <div>
      <Card title={<span><AuditOutlined /> 审核事项分级指派</span>} bordered={false}
        style={{ borderRadius: 10 }}
        extra={<Tag color="blue">按《审核分级规范》指派 L1~L5</Tag>}>
        <Table
          rowKey="id"
          dataSource={list}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '申请ID', dataIndex: 'applyId', width: 150 },
            { title: '事项', dataIndex: 'itemName', ellipsis: true },
            { title: '申请人', dataIndex: 'applicantName', width: 90 },
            { title: '环节', dataIndex: 'nodeName', width: 110 },
            { title: '分级', dataIndex: 'level', width: 70, render: v => <Tag color={['', 'green', 'blue', 'orange', 'purple', 'red'][v]}>L{v}</Tag> },
            { title: '当前处理人', dataIndex: 'assigneeName', width: 100, render: v => v || <Tag color="default">暂未指派</Tag> },
            { title: '状态', width: 100, render: (_, r) => statusTag(r.status) },
            {
              title: '操作', width: 150, render: (_, r) => (
                <Space>
                  <Button size="small" icon={<SendOutlined />} type="primary"
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
          <div style={{ marginBottom: 8, color: '#475569' }}>
            申请：<b>{current?.itemName}</b>（{current?.applyId}）<br />
            环节：<b>{current?.nodeName}</b>（L{current?.level} - {current?.role}）
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
    </div>
  );
};

export default AssignPage;
