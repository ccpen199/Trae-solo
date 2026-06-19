import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Tag,
  Select,
  DatePicker,
  Button,
  Space,
  Modal,
  Descriptions,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { orderApi, complaintApi } from '../api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

function Orders() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
  });
  const [detailModal, setDetailModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [page, pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters.status) params.status = filters.status;
      if (filters.platform) params.platform = filters.platform;

      const result: any = await orderApi.getList(params);
      setData(result.list || []);
      setTotal(result.total || 0);
    } catch (e) {
      message.error('加载订单数据失败');
    }
    setLoading(false);
  };

  const viewDetail = async (id: number) => {
    try {
      const order: any = await orderApi.getDetail(id);
      setCurrentOrder(order);
      setDetailModal(true);
    } catch (e) {
      message.error('加载订单详情失败');
    }
  };

  const dispatchOrder = async (id: number) => {
    Modal.confirm({
      title: '确认派单',
      content: '是否启动智能派单引擎，为该订单自动匹配最优骑士？',
      onOk: async () => {
        try {
          await orderApi.dispatch(id);
          message.success('派单成功');
          loadData();
        } catch (e) {
          message.error('派单失败');
        }
      },
    });
  };

  const triggerComplaint = (record: any) => {
    Modal.confirm({
      title: '发起申诉',
      content: '确定要为该订单发起质检申诉吗？系统将自动调阅配送录像。',
      okText: '确认发起',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await complaintApi.create({
            order_id: record.id,
            rider_id: record.assigned_rider_id,
            type: 'service',
            reason: '人工发起质检申诉',
            complainant_type: 'admin',
          });
          message.success('申诉已发起，系统将自动调阅录像');
        } catch (e) {
          message.error('发起失败');
        }
      },
    });
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待派单', color: 'orange' },
      assigned: { text: '已派单', color: 'blue' },
      picking: { text: '取货中', color: 'cyan' },
      delivering: { text: '配送中', color: 'geekblue' },
      delivered: { text: '已完成', color: 'green' },
      cancelled: { text: '已取消', color: 'red' },
    };
    const info = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getPlatformTag = (platform: string) => {
    const platformMap: Record<string, { text: string; color: string }> = {
      self: { text: '自营', color: 'blue' },
      meituan: { text: '美团', color: 'orange' },
      eleme: { text: '饿了么', color: 'geekblue' },
    };
    const info = platformMap[platform] || { text: platform, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getGoodsTypeText = (type: string) => {
    const map: Record<string, string> = {
      normal: '普通',
      fragile: '易碎',
      cold: '冷藏',
      perishable: '易腐',
      large: '大件',
    };
    return map[type] || type;
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 80,
      render: (p: string) => getPlatformTag(p),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => getStatusTag(s),
    },
    { title: '商家', dataIndex: 'merchant_name', key: 'merchant_name', width: 140 },
    { title: '收件人', dataIndex: 'recipient_name', key: 'recipient_name', width: 100 },
    { title: '物品', dataIndex: 'goods_name', key: 'goods_name', width: 120 },
    {
      title: '配送费',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '预计时长',
      dataIndex: 'estimated_duration',
      key: 'estimated_duration',
      width: 100,
      render: (v: number) => `${v}分钟`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (t: number) => dayjs.unix(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
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
              icon={<PlayCircleOutlined />}
              onClick={() => dispatchOrder(record.id)}
            >
              派单
            </Button>
          )}
          {['delivered', 'cancelled'].includes(record.status) && (
            <Button
              type="link"
              size="small"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => triggerComplaint(record)}
            >
              申诉
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              placeholder="订单状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(v) => {
                setFilters({ ...filters, status: v || '' });
                setPage(1);
              }}
            >
              <Option value="pending">待派单</Option>
              <Option value="assigned">已派单</Option>
              <Option value="picking">取货中</Option>
              <Option value="delivering">配送中</Option>
              <Option value="delivered">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="平台来源"
              allowClear
              style={{ width: '100%' }}
              value={filters.platform || undefined}
              onChange={(v) => {
                setFilters({ ...filters, platform: v || '' });
                setPage(1);
              }}
            >
              <Option value="self">自营平台</Option>
              <Option value="meituan">美团</Option>
              <Option value="eleme">饿了么</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker style={{ width: '100%' }} />
          </Col>
          <Col span={6}>
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
          scroll={{ x: 1200 }}
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
        title="订单详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={<Button onClick={() => setDetailModal(false)}>关闭</Button>}
        width={700}
      >
        {currentOrder && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="订单号" span={2}>
              {currentOrder.order_no}
            </Descriptions.Item>
            <Descriptions.Item label="平台">
              {getPlatformTag(currentOrder.platform)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {getStatusTag(currentOrder.status)}
            </Descriptions.Item>
            <Descriptions.Item label="商家" span={2}>
              {currentOrder.merchant_name}
            </Descriptions.Item>
            <Descriptions.Item label="商家地址" span={2}>
              {currentOrder.merchant_address}
            </Descriptions.Item>
            <Descriptions.Item label="收件人">
              {currentOrder.recipient_name}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {currentOrder.recipient_phone}
            </Descriptions.Item>
            <Descriptions.Item label="收件地址" span={2}>
              {currentOrder.recipient_address}
            </Descriptions.Item>
            <Descriptions.Item label="物品名称">
              {currentOrder.goods_name}
            </Descriptions.Item>
            <Descriptions.Item label="物品类型">
              <Tag>{getGoodsTypeText(currentOrder.goods_type)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="重量">
              {currentOrder.weight}kg
            </Descriptions.Item>
            <Descriptions.Item label="体积">
              {currentOrder.volume}m³
            </Descriptions.Item>
            <Descriptions.Item label="配送费">
              ¥{currentOrder.delivery_fee.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="小费">
              ¥{currentOrder.tip_amount.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="合计">
              <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                ¥{currentOrder.total_amount.toFixed(2)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="预计距离">
              {currentOrder.estimated_distance.toFixed(2)}km
            </Descriptions.Item>
            <Descriptions.Item label="预计时长">
              {currentOrder.estimated_duration}分钟
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs.unix(currentOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="送达时间">
              {currentOrder.delivered_at
                ? dayjs.unix(currentOrder.delivered_at).format('YYYY-MM-DD HH:mm:ss')
                : '-'}
            </Descriptions.Item>
            {currentOrder.is_special && (
              <Descriptions.Item label="特殊说明" span={2}>
                <Tag color="red">特殊物品</Tag> {currentOrder.special_note}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default Orders;
