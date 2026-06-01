import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Space, Button, Table, message, Modal, Row, Col } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getPolicy, payPolicy, getReports } from '../../utils/api.js';

const policyStatusColors = { active: 'green', expired: 'default', cancelled: 'red' };
const policyStatusLabels = { active: '有效', expired: '已过期', cancelled: '已注销' };
const paymentStatusColors = { unpaid: 'red', paid: 'green', refunded: 'orange' };
const paymentStatusLabels = { unpaid: '未支付', paid: '已支付', refunded: '已退款' };
const reportStatusColors = { pending: 'orange', surveying: 'blue', surveyed: 'cyan', approved: 'green', rejected: 'red', paid: 'purple' };
const reportStatusLabels = { pending: '待查勘', surveying: '查勘中', surveyed: '已查勘', approved: '已通过', rejected: '已拒赔', paid: '已赔付' };

const cropLabels = { RICE: '水稻', WHEAT: '小麦', CORN: '玉米', SOYBEAN: '大豆', COTTON: '棉花', VEGETABLE: '蔬菜', FRUIT: '果树', OTHER: '其他' };

function PolicyDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [policy, setPolicy] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [policyRes, reportsRes] = await Promise.all([
        getPolicy(id),
        getReports({ policy_id: id, limit: 100 })
      ]);
      setPolicy(policyRes.data);
      setReports(reportsRes.data.data || []);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    Modal.confirm({
      title: '确认支付',
      content: `确认支付保费 ¥${policy.premium}？`,
      onOk: async () => {
        try {
          await payPolicy(id);
          message.success('支付成功');
          loadData();
        } catch (e) {
          message.error('支付失败');
        }
      }
    });
  };

  const reportColumns = [
    { title: '报案号', dataIndex: 'report_no', key: 'report_no', render: (t, r) => <a onClick={() => navigate(`/reports/${r.id}`)}>{t}</a> },
    { title: '灾害类型', dataIndex: 'disaster_type', key: 'disaster_type', render: v => cropLabels[v] || v },
    { title: '受损面积(亩)', dataIndex: 'damaged_area', key: 'damaged_area' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color={reportStatusColors[s]}>{reportStatusLabels[s]}</Tag> },
    { title: '报案时间', dataIndex: 'created_at', key: 'created_at', render: t => dayjs(t).format('YYYY-MM-DD HH:mm') }
  ];

  if (!policy) return null;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/policies')}>返回列表</Button>
      </Space>

      <Card
        title="保单详情"
        loading={loading}
        extra={
          <Space>
            {policy.payment_status === 'unpaid' && (
              <Button type="primary" icon={<DollarOutlined />} onClick={handlePay}>支付保费</Button>
            )}
            {policy.payment_status === 'paid' && policy.status === 'active' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/reports/create?policy_id=${policy.id}`)}>新增报案</Button>
            )}
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="保单基本信息" size="small">
              <Descriptions column={3} bordered size="small">
                <Descriptions.Item label="保单号">{policy.policy_no}</Descriptions.Item>
                <Descriptions.Item label="保单状态"><Tag color={policyStatusColors[policy.status]}>{policyStatusLabels[policy.status]}</Tag></Descriptions.Item>
                <Descriptions.Item label="保费状态"><Tag color={paymentStatusColors[policy.payment_status]}>{paymentStatusLabels[policy.payment_status]}</Tag></Descriptions.Item>
                <Descriptions.Item label="保险起期">{dayjs(policy.start_date).format('YYYY-MM-DD')}</Descriptions.Item>
                <Descriptions.Item label="保险止期">{dayjs(policy.end_date).format('YYYY-MM-DD')}</Descriptions.Item>
                <Descriptions.Item label="承保日期">{dayjs(policy.created_at).format('YYYY-MM-DD')}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="农户信息" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="姓名">{policy.farmer_name}</Descriptions.Item>
                <Descriptions.Item label="身份证号">{policy.farmer_id_card}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{policy.farmer_phone}</Descriptions.Item>
                <Descriptions.Item label="地址">{policy.farmer_address}</Descriptions.Item>
                {policy.township && <Descriptions.Item label="乡镇">{policy.township}</Descriptions.Item>}
                {policy.village && <Descriptions.Item label="村">{policy.village}</Descriptions.Item>}
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="地块信息" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="位置">{policy.plot_location}</Descriptions.Item>
                <Descriptions.Item label="面积">{policy.area} 亩</Descriptions.Item>
                <Descriptions.Item label="经度">{policy.plot_longitude}</Descriptions.Item>
                <Descriptions.Item label="纬度">{policy.plot_latitude}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="保险信息" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="作物类型">{cropLabels[policy.crop_type] || policy.crop_type}</Descriptions.Item>
                <Descriptions.Item label="作物品种">{policy.crop_variety}</Descriptions.Item>
                <Descriptions.Item label="保险金额">¥{policy.insurance_amount?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="保费">¥{policy.premium?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="免赔率">{(policy.deductible_ratio * 100).toFixed(0)}%</Descriptions.Item>
                <Descriptions.Item label="免赔条款">{policy.deductible_clause || '-'}</Descriptions.Item>
                {policy.insurer_name && <Descriptions.Item label="承保人">{policy.insurer_name}</Descriptions.Item>}
              </Descriptions>
            </Card>
          </Col>

          <Col span={24}>
            <Card title={`关联报案记录 (${reports.length})`} size="small">
              <Table
                columns={reportColumns}
                dataSource={reports}
                rowKey="id"
                pagination={false}
                size="small"
                locale={{ emptyText: '暂无报案记录' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default PolicyDetail;
