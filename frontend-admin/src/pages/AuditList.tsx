import React, { useEffect, useState } from 'react';
import { Table, Card, Select, Tag, Button, Modal, Form, Input, Radio, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { auditService } from '@/services/audit.service';
import type { AuditFlow, AuditType, AuditStatus } from '@shared/types';

const typeMap: Record<AuditType, string> = {
  real_name_auth: '实名认证',
  qualification_change: '资质变更',
  order_complaint: '订单投诉',
  credit_appeal: '信用申诉',
  frozen_appeal: '冻结申诉',
  vehicle_change: '车辆变更',
};

const statusMap: Record<AuditStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
};

const levelMap: Record<string, string> = {
  first: '初审',
  second: '复审',
  final: '终审',
};

const AuditList: React.FC = () => {
  const [flows, setFlows] = useState<AuditFlow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [type, setType] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<AuditStatus | undefined>(undefined);
  const [level, setLevel] = useState<string | undefined>(undefined);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<AuditFlow | null>(null);
  const [auditForm] = Form.useForm();

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const result = await auditService.getAuditFlows({
        page,
        pageSize,
        type,
        status,
        level,
      });
      setFlows(result.data);
      setTotal(result.total);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFlows();
  }, [page, pageSize, type, status, level]);

  const handleAudit = async (values: { decision: AuditStatus; remark: string }) => {
    if (!currentFlow) return;
    try {
      await auditService.makeDecision({
        flowId: currentFlow.id,
        decision: values.decision,
        remark: values.remark,
        level: currentFlow.currentLevel,
      });
      message.success('审核已处理');
      setAuditModalVisible(false);
      auditForm.resetFields();
      setCurrentFlow(null);
      fetchFlows();
    } catch {
      message.error('审核操作失败');
    }
  };

  const openAuditModal = (flow: AuditFlow) => {
    setCurrentFlow(flow);
    auditForm.setFieldsValue({ decision: undefined, remark: '' });
    setAuditModalVisible(true);
  };

  const columns: ColumnsType<AuditFlow> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (val: AuditType) => typeMap[val] || val,
    },
    {
      title: '当前级别',
      dataIndex: 'currentLevel',
      key: 'currentLevel',
      width: 80,
      render: (val: string) => levelMap[val] || val,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: AuditStatus) => {
        const item = statusMap[val] || { color: 'default', text: val };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        record.status === 'pending' ? (
          <Button type="link" onClick={() => openAuditModal(record)}>
            审核
          </Button>
        ) : (
          <Tag>已处理</Tag>
        )
      ),
    },
  ];

  return (
    <div>
      <Card className="page-card">
        <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Select
            placeholder="审核类型"
            allowClear
            value={type}
            onChange={(val) => setType(val)}
            style={{ width: 140 }}
            options={Object.entries(typeMap).map(([key, val]) => ({
              label: val,
              value: key,
            }))}
          />
          <Select
            placeholder="审核状态"
            allowClear
            value={status}
            onChange={(val) => setStatus(val)}
            style={{ width: 120 }}
            options={Object.entries(statusMap).map(([key, val]) => ({
              label: val.text,
              value: key,
            }))}
          />
          <Select
            placeholder="审核级别"
            allowClear
            value={level}
            onChange={(val) => setLevel(val)}
            style={{ width: 120 }}
            options={Object.entries(levelMap).map(([key, val]) => ({
              label: val,
              value: key,
            }))}
          />
          <Button icon={<SearchOutlined />} type="primary" onClick={fetchFlows}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setType(undefined); setStatus(undefined); setLevel(undefined); fetchFlows(); }}>
            重置
          </Button>
        </div>
        <Table<AuditFlow>
          columns={columns}
          dataSource={flows}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title={`审核 - ${currentFlow?.title || ''}`}
        open={auditModalVisible}
        onCancel={() => { setAuditModalVisible(false); setCurrentFlow(null); }}
        onOk={() => auditForm.submit()}
      >
        <Form form={auditForm} onFinish={handleAudit} layout="vertical">
          <Form.Item name="decision" label="审核决定" rules={[{ required: true, message: '请选择审核决定' }]}>
            <Radio.Group>
              <Radio value="approved">通过</Radio>
              <Radio value="rejected">拒绝</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AuditList;
