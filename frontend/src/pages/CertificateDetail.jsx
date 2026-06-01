import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Descriptions, Tag, Table, Spin, App, Space, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { certificatesAPI } from '../services/api.js';

export default function CertificateDetail() {
  const { message } = App.useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [certResult, historyResult] = await Promise.all([
        certificatesAPI.getDetail(id),
        certificatesAPI.getHistory(id),
      ]);
      
      if (certResult.success) setCertificate(certResult.data);
      if (historyResult.success) setHistory(historyResult.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!certificate) {
    return <div>证照不存在</div>;
  }

  const statusColors = {
    active: 'green',
    expired: 'orange',
    revoked: 'red',
  };
  const statusLabels = {
    active: '有效',
    expired: '已过期',
    revoked: '已吊销',
  };

  const historyColumns = [
    { title: '操作类型', dataIndex: 'operation_type', key: 'operation_type',
      render: (type) => {
        const labels = { extend: '延期', revoke: '吊销', change: '变更' };
        return labels[type] || type;
      }
    },
    { title: '变更原因', dataIndex: 'change_reason', key: 'change_reason' },
    { title: '法律依据', dataIndex: 'legal_basis', key: 'legal_basis' },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '生效时间', dataIndex: 'effective_time', key: 'effective_time', width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/certificates')}>
          返回列表
        </Button>
      </div>

      <Card title="证照详情">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="证照编号">{certificate.certificate_number}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColors[certificate.status]}>
              {statusLabels[certificate.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="模板名称">{certificate.template_name}</Descriptions.Item>
          <Descriptions.Item label="模板版本">v{certificate.template_version}</Descriptions.Item>
          <Descriptions.Item label="持证人">{certificate.applicant_name}</Descriptions.Item>
          <Descriptions.Item label="证件号码">{certificate.id_number}</Descriptions.Item>
          <Descriptions.Item label="签发机关">{certificate.issuing_authority}</Descriptions.Item>
          <Descriptions.Item label="签发人">{certificate.issuer}</Descriptions.Item>
          <Descriptions.Item label="签发日期">
            {dayjs(certificate.issue_date).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="有效期至">
            {dayjs(certificate.expiry_date).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">证照数据</Divider>
        <Card size="small" style={{ background: '#f5f5f5' }}>
          <pre style={{ margin: 0 }}>{JSON.stringify(certificate.certificate_data, null, 2)}</pre>
        </Card>

        <Divider orientation="left">电子签章</Divider>
        <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
          {certificate.signature}
        </p>
      </Card>

      <Card title="变更历史" style={{ marginTop: 16 }}>
        <Table
          dataSource={history}
          columns={historyColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
