import { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Tag, Button, Row, Col, Descriptions, message, Table } from 'antd';
import { useParams, Link } from 'react-router-dom';
import {
  ScanOutlined,
  SafetyCertificateOutlined,
  CreditCardOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { lawyerAPI } from '../utils/api';

const { Title, Text } = Typography;

function LawyerDetail() {
  const { id } = useParams();
  const [lawyer, setLawyer] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [barLoading, setBarLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);

  const loadVerification = useCallback(async () => {
    try {
      const res = await lawyerAPI.getVerification(id);
      if (res.data.success) {
        setVerification(res.data.verification || res.data);
      }
    } catch {
      console.error('刷新验证数据失败');
    }
  }, [id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [detailRes, verifyRes] = await Promise.all([
        lawyerAPI.getLawyerDetail(id),
        lawyerAPI.getVerification(id),
      ]);
      if (detailRes.data.success) {
        setLawyer(detailRes.data.lawyer);
      }
      if (verifyRes.data.success) {
        setVerification(verifyRes.data.verification || verifyRes.data);
      }
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleOCR = async () => {
    setOcrLoading(true);
    try {
      const res = await lawyerAPI.submitOCR(id);
      if (res.data.success) {
        message.success('OCR识别已执行');
        loadVerification();
      }
    } catch {
      message.error('OCR识别失败');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleBarVerify = async () => {
    setBarLoading(true);
    try {
      const res = await lawyerAPI.barVerify(id);
      if (res.data.success) {
        message.success('律协验证已发起');
        loadVerification();
      }
    } catch {
      message.error('律协验证失败');
    } finally {
      setBarLoading(false);
    }
  };

  const handleCreditReport = async () => {
    setCreditLoading(true);
    try {
      const res = await lawyerAPI.generateCreditReport(id);
      if (res.data.success) {
        message.success('信用报告已生成');
        loadVerification();
      }
    } catch {
      message.error('生成信用报告失败');
    } finally {
      setCreditLoading(false);
    }
  };

  if (loading) {
    return <Card loading style={{ maxWidth: 1000, margin: '40px auto' }} />;
  }

  if (!lawyer) {
    return <Card style={{ maxWidth: 1000, margin: '40px auto', textAlign: 'center' }}>律师不存在</Card>;
  }

  const ocr = verification?.ocr || {};
  const bar = verification?.bar_verification || {};
  const credit = verification?.credit_report || {};
  const reviews = verification?.review_history || [];

  const ocrStatusMap = { pending: '待识别', completed: '已完成', failed: '识别失败' };
  const ocrStatusColor = { pending: 'orange', completed: 'green', failed: 'red' };

  const reviewColumns = [
    { title: '复查期间', dataIndex: 'period', key: 'period' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'passed' ? 'green' : 'orange'}>{s === 'passed' ? '通过' : s}</Tag> },
    { title: '时间', dataIndex: 'reviewed_at', key: 'reviewed_at' },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto' }}>
      <Card>
        <Row gutter={24}>
          <Col span={6}>
            <div style={{ width: 150, height: 150, borderRadius: '50%', background: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 60, margin: '0 auto' }}>
              {lawyer.name[0]}
            </div>
          </Col>
          <Col span={18}>
            <Title level={2}>{lawyer.name}</Title>
            <div style={{ marginBottom: 16 }}>
              <Tag color="blue">{lawyer.practice_area}</Tag>
              <Tag>{lawyer.years_experience}年经验</Tag>
              <Tag color="green">评分 {lawyer.rating}</Tag>
              <Tag>{lawyer.consultation_count}次咨询</Tag>
            </div>
            <p style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>{lawyer.bio}</p>
            <Link to="/consultation">
              <Button type="primary" size="large">立即咨询</Button>
            </Link>
          </Col>
        </Row>

        <Descriptions title="律师信息" bordered style={{ marginTop: 32 }}>
          <Descriptions.Item label="邮箱">{lawyer.email}</Descriptions.Item>
          <Descriptions.Item label="执业领域">{lawyer.practice_area}</Descriptions.Item>
          <Descriptions.Item label="执业年限">{lawyer.years_experience}年</Descriptions.Item>
          <Descriptions.Item label="认证状态">
            <Tag color={lawyer.verification_status === 'approved' ? 'green' : 'orange'}>
              {lawyer.verification_status === 'approved' ? '已认证' : '审核中'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card
            title={<span><ScanOutlined style={{ marginRight: 8 }} />执业证OCR识别</span>}
            extra={
              <Button type="primary" size="small" loading={ocrLoading} onClick={handleOCR}>
                执行OCR识别
              </Button>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="OCR状态">
                <Tag color={ocrStatusColor[ocr.status] || 'default'}>
                  {ocrStatusMap[ocr.status] || ocr.status || '未执行'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="证号">{ocr.license_number || '-'}</Descriptions.Item>
              <Descriptions.Item label="OCR置信度">{ocr.confidence ? `${(ocr.confidence * 100).toFixed(1)}%` : '-'}</Descriptions.Item>
              <Descriptions.Item label="发证机关">{ocr.issuing_authority || '-'}</Descriptions.Item>
              <Descriptions.Item label="有效期">{ocr.valid_until || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={<span><SafetyCertificateOutlined style={{ marginRight: 8 }} />律协接口验证</span>}
            extra={
              <Button type="primary" size="small" loading={barLoading} onClick={handleBarVerify}>
                发起律协验证
              </Button>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="验证状态">
                <Tag color={bar.status === 'verified' ? 'green' : bar.status === 'pending' ? 'orange' : 'default'}>
                  {bar.status === 'verified' ? '已验证' : bar.status === 'pending' ? '验证中' : bar.status || '未验证'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="验证来源">{bar.source || '中华全国律师协会'}</Descriptions.Item>
              <Descriptions.Item label="验证时间">{bar.verified_at || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card
            title={<span><CreditCardOutlined style={{ marginRight: 8 }} />信用报告</span>}
            extra={
              <Button type="primary" size="small" loading={creditLoading} onClick={handleCreditReport}>
                生成信用报告
              </Button>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="整体评级">
                {credit.rating ? <Tag color="blue">{credit.rating}</Tag> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="投诉数">{credit.complaints ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="处分数">{credit.disciplines ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="客户满意度">{credit.satisfaction ? `${credit.satisfaction}%` : '-'}</Descriptions.Item>
              <Descriptions.Item label="案件数">{credit.case_count ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="成功率">{credit.success_rate ? `${credit.success_rate}%` : '-'}</Descriptions.Item>
              <Descriptions.Item label="信用分">
                {credit.credit_score != null ? <Text strong style={{ color: credit.credit_score >= 80 ? '#52c41a' : '#fa8c16', fontSize: 18 }}>{credit.credit_score}</Text> : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span><AuditOutlined style={{ marginRight: 8 }} />复查记录</span>}>
            <Table
              columns={reviewColumns}
              dataSource={reviews}
              rowKey={(r, i) => i}
              size="small"
              pagination={false}
              locale={{ emptyText: '暂无复查记录' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default LawyerDetail;
