import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Tag,
  Select,
  Button,
  Space,
  Modal,
  Descriptions,
  message,
  Form,
  Input,
  InputNumber,
  Radio,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { complaintApi, orderApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function Complaints() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [detailModal, setDetailModal] = useState(false);
  const [handleModal, setHandleModal] = useState(false);
  const [currentComplaint, setCurrentComplaint] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      const result: any = await complaintApi.getList(params);
      setData(result.list || []);
      setTotal(result.total || 0);
    } catch (e) {
      message.error('加载申诉数据失败');
    }
    setLoading(false);
  };

  const viewDetail = async (id: number) => {
    try {
      const complaint: any = await complaintApi.getDetail(id);
      setCurrentComplaint(complaint);
      setDetailModal(true);
    } catch (e) {
      message.error('加载申诉详情失败');
    }
  };

  const openHandleModal = (record: any) => {
    setCurrentComplaint(record);
    form.setFieldsValue({
      result: '',
      penalty_amount: 0,
      handler_note: '',
    });
    setHandleModal(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await complaintApi.handle(currentComplaint.id, {
        handler_id: 1,
        result: values.result,
        penalty_amount: values.penalty_amount,
        handler_note: values.handler_note,
      });
      message.success('申诉处理完成');
      setHandleModal(false);
      loadData();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('处理失败');
    }
  };

  const getTypeTag = (type: string) => {
    const map: Record<string, { text: string; color: string; icon: string }> = {
      timeout: { text: '超时', color: 'orange', icon: '⏱️' },
      lost: { text: '丢件', color: 'red', icon: '📦' },
      bad_review: { text: '差评', color: 'volcano', icon: '👎' },
      service: { text: '服务', color: 'purple', icon: '💬' },
      other: { text: '其他', color: 'default', icon: '📝' },
    };
    const info = map[type] || { text: type, color: 'default', icon: '📝' };
    return (
      <Tag color={info.color}>
        {info.icon} {info.text}
      </Tag>
    );
  };

  const getStatusTag = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      pending: { text: '待处理', color: 'red' },
      reviewing: { text: '处理中', color: 'processing' },
      resolved: { text: '已解决', color: 'green' },
      closed: { text: '已关闭', color: 'default' },
    };
    const info = map[status] || { text: status, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '申诉ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string) => getTypeTag(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => getStatusTag(v),
    },
    {
      title: '关联订单',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 100,
    },
    {
      title: '涉及骑士',
      dataIndex: 'rider_id',
      key: 'rider_id',
      width: 100,
      render: (v: number) => (v ? `骑士#${v}` : '-'),
    },
    {
      title: '申诉原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      ellipsis: true,
    },
    {
      title: '视频证据',
      dataIndex: 'has_video_evidence',
      key: 'has_video_evidence',
      width: 100,
      render: (v: number) =>
        v ? (
          <Tag color="green">
            <PlayCircleOutlined /> 有录像
          </Tag>
        ) : (
          <Tag>无录像</Tag>
        ),
    },
    {
      title: '处罚金额',
      dataIndex: 'penalty_amount',
      key: 'penalty_amount',
      width: 100,
      render: (v: number) => (v > 0 ? <span style={{ color: 'red' }}>¥{v}</span> : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (t: number) => dayjs.unix(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewDetail(record.id)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openHandleModal(record)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const stats = [
    { label: '待处理', value: data.filter((d) => d.status === 'pending').length, color: 'red' },
    { label: '处理中', value: data.filter((d) => d.status === 'reviewing').length, color: 'blue' },
    { label: '已解决', value: data.filter((d) => d.status === 'resolved').length, color: 'green' },
  ];

  return (
    <div>
      <Row gutter={16}>
        {stats.map((s, i) => (
          <Col span={6} key={i}>
            <Card>
              <Space>
                <WarningOutlined style={{ fontSize: 24, color: s.color }} />
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: s.color }}>{s.value}</div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              placeholder="申诉状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(v) => {
                setFilters({ ...filters, status: v || '' });
                setPage(1);
              }}
            >
              <Option value="pending">待处理</Option>
              <Option value="reviewing">处理中</Option>
              <Option value="resolved">已解决</Option>
              <Option value="closed">已关闭</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="申诉类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.type || undefined}
              onChange={(v) => {
                setFilters({ ...filters, type: v || '' });
                setPage(1);
              }}
            >
              <Option value="timeout">超时</Option>
              <Option value="lost">丢件</Option>
              <Option value="bad_review">差评</Option>
              <Option value="service">服务</Option>
              <Option value="other">其他</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>
              搜索
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条申诉`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title="申诉详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={<Button onClick={() => setDetailModal(false)}>关闭</Button>}
        width={600}
      >
        {currentComplaint && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="申诉ID">
                #{currentComplaint.id}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                {getTypeTag(currentComplaint.type)}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(currentComplaint.status)}
              </Descriptions.Item>
              <Descriptions.Item label="关联订单">
                #{currentComplaint.order_id}
              </Descriptions.Item>
              <Descriptions.Item label="涉及骑士">
                {currentComplaint.rider_id ? `骑士#${currentComplaint.rider_id}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="申诉人">
                {currentComplaint.complainant_type === 'system'
                  ? '系统自动'
                  : currentComplaint.complainant_type || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="申诉原因" span={2}>
                {currentComplaint.reason || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="视频证据">
                {currentComplaint.has_video_evidence ? (
                  <Tag color="green">
                    <PlayCircleOutlined /> 有录像
                  </Tag>
                ) : (
                  '无'
                )}
              </Descriptions.Item>
              {currentComplaint.video_url && (
                <Descriptions.Item label="视频地址">
                  {currentComplaint.video_url}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="处罚金额">
                {currentComplaint.penalty_amount > 0
                  ? `¥${currentComplaint.penalty_amount}`
                  : '无'}
              </Descriptions.Item>
              <Descriptions.Item label="处理结果">
                {currentComplaint.result || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs.unix(currentComplaint.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="处理时间">
                {currentComplaint.handled_at
                  ? dayjs.unix(currentComplaint.handled_at).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            {currentComplaint.handler_note && (
              <Card size="small" title="处理备注" style={{ marginTop: 16 }}>
                {currentComplaint.handler_note}
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="处理申诉"
        open={handleModal}
        onCancel={() => setHandleModal(false)}
        onOk={handleSubmit}
        okText="确认处理"
        okButtonProps={{ danger: true }}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="result"
            label="处理结果"
            rules={[{ required: true, message: '请选择处理结果' }]}
          >
            <Radio.Group>
              <Radio value="成立">申诉成立</Radio>
              <Radio value="不成立">申诉不成立</Radio>
              <Radio value="协商解决">协商解决</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="penalty_amount" label="处罚金额 (元)">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="handler_note" label="处理说明">
            <TextArea rows={4} placeholder="请输入处理说明..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Complaints;
