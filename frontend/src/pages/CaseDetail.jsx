import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Tabs, Table, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { caseApi } from '../api';

const DISPUTE_TYPES = [
  { value: 'salary', label: '工资争议' },
  { value: 'compensation', label: '经济补偿' },
  { value: 'dismissal', label: '违法解除' },
  { value: 'social_insurance', label: '社会保险' },
  { value: 'overtime', label: '加班费' },
  { value: 'other', label: '其他' }
];

const STATUS_MAP = {
  pending: { label: '待处理', color: 'orange' },
  hearing: { label: '审理中', color: 'blue' },
  closed: { label: '已结案', color: 'green' }
};

function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseItem, setCaseItem] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCaseDetail();
    loadLogs();
  }, [id]);

  const loadCaseDetail = async () => {
    setLoading(true);
    try {
      const res = await caseApi.get(id);
      setCaseItem(res.data);
    } catch (error) {
      message.error('加载案件详情失败');
    }
    setLoading(false);
  };

  const loadLogs = async () => {
    try {
      const res = await caseApi.logs(id);
      setLogs(res.data);
    } catch (error) {
      console.error('加载操作日志失败:', error);
    }
  };

  const logColumns = [
    { title: '操作时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    { title: '操作类型', dataIndex: 'action', key: 'action', width: 120 },
    { title: '操作描述', dataIndex: 'description', key: 'description' },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 }
  ];

  if (!caseItem) return <div>加载中...</div>;

  const getDisputeType = () => {
    const type = DISPUTE_TYPES.find(t => t.value === caseItem.dispute_type);
    return type ? type.label : '';
  };

  const getStatus = () => {
    const status = STATUS_MAP[caseItem.status];
    return status ? <Tag color={status.color}>{status.label}</Tag> : null;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cases')}>返回列表</Button>
      </div>

      <Card title={`案件详情 - ${caseItem.case_number}`} loading={loading}>
        <Tabs
          items={[
            {
              key: 'base',
              label: '基本信息',
              children: (
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="案件编号">{caseItem.case_number}</Descriptions.Item>
                  <Descriptions.Item label="状态">{getStatus()}</Descriptions.Item>
                  <Descriptions.Item label="当事人">{caseItem.client_name}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{caseItem.client_phone || '-'}</Descriptions.Item>
                  <Descriptions.Item label="被申请人">{caseItem.respondent || '-'}</Descriptions.Item>
                  <Descriptions.Item label="争议类型">{getDisputeType()}</Descriptions.Item>
                  <Descriptions.Item label="请求金额">{caseItem.claim_amount ? caseItem.claim_amount.toLocaleString() : 0} 元</Descriptions.Item>
                  <Descriptions.Item label="用工关系">{caseItem.employment_relation || '-'}</Descriptions.Item>
                  <Descriptions.Item label="入职日期">{caseItem.start_date || '-'}</Descriptions.Item>
                  <Descriptions.Item label="离职日期">{caseItem.end_date || '-'}</Descriptions.Item>
                  <Descriptions.Item label="争议发生日期">{caseItem.dispute_date || '-'}</Descriptions.Item>
                  <Descriptions.Item label="仲裁时效截止">{caseItem.arbitration_deadline || '-'}</Descriptions.Item>
                  <Descriptions.Item label="负责律师">{caseItem.lawyer_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{caseItem.created_at}</Descriptions.Item>
                  <Descriptions.Item label="案件描述" span={2}>{caseItem.description || '-'}</Descriptions.Item>
                </Descriptions>
              )
            },
            {
              key: 'logs',
              label: '操作日志',
              children: (
                <Table
                  columns={logColumns}
                  dataSource={logs}
                  rowKey="id"
                  pagination={false}
                />
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}

export default CaseDetail;
