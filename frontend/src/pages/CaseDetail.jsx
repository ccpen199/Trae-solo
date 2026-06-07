import React, { useState, useEffect } from 'react';
import { Card, Typography, Steps, Descriptions, message } from 'antd';
import { useParams } from 'react-router-dom';
import { caseAPI } from '../utils/api';

const { Title } = Typography;
const { Step } = Steps;

function CaseDetail({ user, role }) {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
    loadProgress();
  }, [id]);

  const loadDetail = async () => {
    try {
      const res = await caseAPI.list();
      if (res.data.success) {
        setCaseData(res.data.cases.find(c => c.id == id));
      }
    } catch (err) {
      message.error('加载案件详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const res = await caseAPI.getProgress(id);
      if (res.data.success) {
        setProgress(res.data.progress);
      }
    } catch (err) {
      console.error('加载进度失败');
    }
  };

  const stages = [
    { key: 'filing', title: '立案' },
    { key: 'fee_paid', title: '缴费' },
    { key: 'hearing', title: '开庭' },
    { key: 'judgment', title: '判决' },
    { key: 'execution', title: '执行' },
  ];

  const getCurrentStep = () => {
    const statusOrder = ['filing', 'fee_paid', 'hearing', 'judgment', 'execution', 'closed'];
    return statusOrder.indexOf(caseData?.status || 'filing');
  };

  if (loading) {
    return <Card loading style={{ maxWidth: 1000, margin: '40px auto' }} />;
  }

  if (!caseData) {
    return <Card style={{ maxWidth: 1000, margin: '40px auto' }}>案件不存在</Card>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto' }}>
      <Card title="案件详情">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="案件名称">{caseData.title}</Descriptions.Item>
          <Descriptions.Item label="案号">{caseData.case_number}</Descriptions.Item>
          <Descriptions.Item label="案件类型">{caseData.case_type}</Descriptions.Item>
          <Descriptions.Item label="受理法院">{caseData.court || '-'}</Descriptions.Item>
          <Descriptions.Item label="涉案金额">{caseData.fee_amount ? `¥${caseData.fee_amount}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="当前状态">{caseData.status}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="案件进度" style={{ marginTop: 24 }}>
        <Steps current={getCurrentStep()} direction="vertical">
          {stages.map(stage => (
            <Step key={stage.key} title={stage.title} />
          ))}
        </Steps>

        <div style={{ marginTop: 32 }}>
          <Title level={4}>进度详情</Title>
          {progress.map((item, idx) => (
            <Card key={idx} size="small" style={{ marginTop: 8 }}>
              <div><strong>{item.stage}</strong> - {item.description}</div>
              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>{item.created_at}</div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default CaseDetail;
