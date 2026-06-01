import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tag, Space, Button, Descriptions, Table, Image, message, Spin } from 'antd';
import { ArrowLeftOutlined, FileSearchOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getReport, getSurveys, getClaims } from '../../utils/api.js';

const disasterLabels = { DROUGHT: '旱灾', FLOOD: '洪涝', HAIL: '冰雹', TYPHOON: '台风', FREEZE: '冻害', PEST: '病虫害', FIRE: '火灾', OTHER: '其他' };
const cropLabels = { RICE: '水稻', WHEAT: '小麦', CORN: '玉米', SOYBEAN: '大豆', COTTON: '棉花', VEGETABLE: '蔬菜', FRUIT: '果树', OTHER: '其他' };
const paymentStatusLabels = { unpaid: '未支付', paid: '已支付', refunded: '已退款' };
const policyStatusLabels = { active: '有效', expired: '已过期', cancelled: '已注销' };
const statusColors = { pending: 'orange', surveying: 'blue', surveyed: 'cyan', approved: 'green', rejected: 'red', paid: 'purple' };
const statusLabels = { pending: '待查勘', surveying: '查勘中', surveyed: '已查勘', approved: '已通过', rejected: '已拒赔', paid: '已赔付' };

function ReportDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const [reportRes, surveysRes, claimsRes] = await Promise.all([
        getReport(id),
        getSurveys({ report_id: id, limit: 100 }),
        getClaims({ report_id: id, limit: 100 })
      ]);
      setReport(reportRes.data);
      setSurveys(surveysRes.data.data || []);
      setClaims(claimsRes.data.data || []);
    } catch (e) {
      console.error('Load report failed:', e);
      message.error('加载报案详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSurvey = () => {
    navigate(`/surveys/create?report_id=${id}`);
  };

  const surveyColumns = [
    { title: '查勘号', dataIndex: 'survey_no', key: 'survey_no', render: (t, r) => <a onClick={() => navigate(`/surveys/${r.id}`)}>{t}</a> },
    { title: '查勘员', dataIndex: 'surveyor_name', key: 'surveyor_name' },
    { title: '查勘时间', dataIndex: 'survey_time', key: 'survey_time', render: t => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '损失比例', dataIndex: 'loss_ratio', key: 'loss_ratio', render: v => v ? `${(v * 100).toFixed(1)}%` : '-' },
    { title: '预估损失', dataIndex: 'estimated_loss', key: 'estimated_loss', render: v => v ? `¥${v.toLocaleString()}` : '-' }
  ];

  const claimColumns = [
    { title: '理赔号', dataIndex: 'claim_no', key: 'claim_no', render: (t, r) => <a onClick={() => navigate(`/claims/${r.id}`)}>{t}</a> },
    { title: '赔付金额(元)', dataIndex: 'compensation_amount', key: 'compensation_amount', render: v => `¥${v?.toLocaleString() || 0}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', render: t => dayjs(t).format('YYYY-MM-DD HH:mm') }
  ];

  const renderPhotos = () => {
    if (!report?.photos) return '-';
    let photos = [];
    try {
      photos = typeof report.photos === 'string' ? JSON.parse(report.photos) : report.photos;
    } catch (e) {
      return <span>{report.photos}</span>;
    }
    if (!Array.isArray(photos) || photos.length === 0) return '-';
    return (
      <Image.PreviewGroup>
        <Space wrap>
          {photos.map((photo, index) => (
            <Image key={index} width={100} height={100} src={typeof photo === 'string' ? photo : photo.url} style={{ objectFit: 'cover' }} />
          ))}
        </Space>
      </Image.PreviewGroup>
    );
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  if (!report) return <div style={{ padding: 40, textAlign: 'center' }}>未找到报案信息</div>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reports')}>返回列表</Button>
          <span style={{ fontSize: 20, fontWeight: 600 }}>报案详情</span>
          {report.status === 'pending' && (
            <Button type="primary" icon={<FileSearchOutlined />} onClick={handleSurvey}>查勘登记</Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="报案基本信息">
            <Descriptions column={3}>
              <Descriptions.Item label="报案号">{report.report_no}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColors[report.status]}>{statusLabels[report.status]}</Tag></Descriptions.Item>
              <Descriptions.Item label="报案时间">{dayjs(report.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="农户">{report.farmer_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{report.farmer_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="报案人">{report.reporter_name || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="灾害信息">
            <Descriptions column={3}>
              <Descriptions.Item label="灾害类型">{disasterLabels[report.disaster_type] || report.disaster_type}</Descriptions.Item>
              <Descriptions.Item label="发生时间">{report.disaster_time ? dayjs(report.disaster_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              <Descriptions.Item label="受损面积(亩)">{report.damaged_area}</Descriptions.Item>
              <Descriptions.Item label="灾害描述" span={3}>{report.description || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="位置与照片">
            <Descriptions column={3}>
              <Descriptions.Item label="地址" span={2}>{report.location || '-'}</Descriptions.Item>
              <Descriptions.Item label="经纬度">{report.latitude && report.longitude ? `${report.latitude}, ${report.longitude}` : '-'}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>现场照片</div>
              {renderPhotos()}
            </div>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="紧急联系人">
            <Descriptions column={3}>
              <Descriptions.Item label="姓名">{report.emergency_contact || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{report.emergency_phone || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="关联保单信息">
            <Descriptions column={3}>
              <Descriptions.Item label="保单号">
                <a onClick={() => navigate(`/policies/${report.policy_id}`)}>{report.policy_no}</a>
              </Descriptions.Item>
              <Descriptions.Item label="作物类型">{cropLabels[report.crop_type] || report.crop_type}</Descriptions.Item>
              <Descriptions.Item label="投保面积(亩)">{report.policy_area}</Descriptions.Item>
              <Descriptions.Item label="保险金额(元)">¥{report.insurance_amount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="保费状态">
                <Tag color={report.payment_status === 'paid' ? 'green' : 'red'}>{paymentStatusLabels[report.payment_status] || report.payment_status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="保单状态">
                <Tag>{policyStatusLabels[report.status] || report.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="保险起期">{report.start_date}</Descriptions.Item>
              <Descriptions.Item label="保险止期">{report.end_date}</Descriptions.Item>
              <Descriptions.Item label="免赔率">{(report.deductible_ratio * 100).toFixed(0)}%</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={24}>
          <Card title={`关联查勘记录 (${surveys.length})`}>
            <Table columns={surveyColumns} dataSource={surveys} rowKey="id" pagination={false} size="small" locale={{ emptyText: '暂无查勘记录' }} />
          </Card>
        </Col>

        <Col span={24}>
          <Card title={`关联理赔记录 (${claims.length})`}>
            <Table columns={claimColumns} dataSource={claims} rowKey="id" pagination={false} size="small" locale={{ emptyText: '暂无理赔记录' }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ReportDetail;
