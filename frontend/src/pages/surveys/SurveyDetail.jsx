import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Descriptions, Tag, Space, Button, Image, Divider, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getSurvey } from '../../utils/api.js';

const disasterLabels = { DROUGHT: '旱灾', FLOOD: '洪涝', HAIL: '冰雹', TYPHOON: '台风', FREEZE: '冻害', PEST: '病虫害', FIRE: '火灾', OTHER: '其他' };
const cropLabels = { RICE: '水稻', WHEAT: '小麦', CORN: '玉米', SOYBEAN: '大豆', COTTON: '棉花', VEGETABLE: '蔬菜', FRUIT: '果树', OTHER: '其他' };
const statusColors = { pending: 'orange', surveying: 'blue', surveyed: 'cyan', approved: 'green', rejected: 'red', paid: 'purple', reviewing: 'orange' };
const statusLabels = { pending: '待查勘', surveying: '查勘中', surveyed: '已查勘', approved: '已通过', rejected: '已拒赔', paid: '已赔付', reviewing: '审核中' };

function SurveyDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurvey();
  }, [id]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      const res = await getSurvey(id);
      setSurvey(res.data);
    } catch (e) {
      console.error('Load survey detail failed:', e);
      message.error('加载查勘详情失败');
    } finally {
      setLoading(false);
    }
  };

  const renderPhotos = () => {
    if (!survey?.photos) return '-';
    let photos = [];
    try {
      photos = typeof survey.photos === 'string' ? JSON.parse(survey.photos) : survey.photos;
    } catch (e) {
      return <span>{survey.photos}</span>;
    }
    if (!Array.isArray(photos) || photos.length === 0) return '-';
    return (
      <Image.PreviewGroup>
        <Row gutter={[12, 12]}>
          {photos.map((photo, index) => (
            <Col key={index} xs={12} sm={8} md={6} lg={4}>
              <Image width="100%" height={120} src={typeof photo === 'string' ? photo : photo.url} style={{ objectFit: 'cover', borderRadius: 4 }} />
            </Col>
          ))}
        </Row>
      </Image.PreviewGroup>
    );
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/surveys')}>返回列表</Button>
        <span style={{ fontSize: 20, fontWeight: 600 }}>查勘详情</span>
      </Space>

      <Card loading={loading}>
        {survey && (
          <>
            <Descriptions title="查勘基本信息" bordered column={2} style={{ marginBottom: 24 }}
              extra={<Tag color={statusColors[survey.status]}>{statusLabels[survey.status]}</Tag>}>
              <Descriptions.Item label="查勘号">{survey.survey_no}</Descriptions.Item>
              <Descriptions.Item label="报案号"><a onClick={() => navigate(`/reports/${survey.report_id}`)}>{survey.report_no}</a></Descriptions.Item>
              <Descriptions.Item label="灾害类型">{disasterLabels[survey.disaster_type] || survey.disaster_type}</Descriptions.Item>
              <Descriptions.Item label="查勘员">{survey.surveyor_name}</Descriptions.Item>
              <Descriptions.Item label="查勘时间">{survey.survey_time ? dayjs(survey.survey_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{survey.created_at ? dayjs(survey.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="现场记录" bordered column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="现场情况">{survey.field_records || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="抽样信息" bordered column={3} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="抽样方法">{survey.sampling_method || '-'}</Descriptions.Item>
              <Descriptions.Item label="抽样数量">{survey.sampling_count || '-'} 个</Descriptions.Item>
              <Descriptions.Item label="样本损失率">{survey.sample_loss_ratio ? `${(survey.sample_loss_ratio * 100).toFixed(1)}%` : '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} md={12}>
                <Card title="卫星参考" size="small">{survey.satellite_reference || '-'}</Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="气象参考" size="small">{survey.weather_reference || '-'}</Card>
              </Col>
            </Row>

            <Divider />

            <Descriptions title="损失评估" bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="损失比例">{survey.loss_ratio ? `${(survey.loss_ratio * 100).toFixed(1)}%` : '-'}</Descriptions.Item>
              <Descriptions.Item label="预估损失">¥{survey.estimated_loss?.toLocaleString() || 0}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="查勘意见" bordered column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="意见内容">{survey.survey_opinion || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>查勘照片</div>
              {renderPhotos()}
            </div>

            <Divider />

            <Descriptions title="关联报案信息" bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="报案号"><a onClick={() => navigate(`/reports/${survey.report_id}`)}>{survey.report_no}</a></Descriptions.Item>
              <Descriptions.Item label="灾害类型">{disasterLabels[survey.disaster_type] || survey.disaster_type}</Descriptions.Item>
              <Descriptions.Item label="受损面积">{survey.damaged_area} 亩</Descriptions.Item>
              <Descriptions.Item label="农户">{survey.farmer_name}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="关联保单信息" bordered column={2}>
              <Descriptions.Item label="保单号"><a onClick={() => navigate(`/policies/${survey.policy_id}`)}>{survey.policy_no}</a></Descriptions.Item>
              <Descriptions.Item label="作物类型">{cropLabels[survey.crop_type] || survey.crop_type}</Descriptions.Item>
              <Descriptions.Item label="投保面积">{survey.policy_area} 亩</Descriptions.Item>
              <Descriptions.Item label="保险金额">¥{survey.insurance_amount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="免赔率">{(survey.deductible_ratio * 100).toFixed(0)}%</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>
    </div>
  );
}

export default SurveyDetail;
