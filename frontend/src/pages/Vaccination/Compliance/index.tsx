import { useState } from 'react';
import { Card, Row, Col, Table, Button, Tag, Progress, Alert, Space, Statistic, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface ComplianceItem {
  id: string;
  earTagId: string;
  livestockType: string;
  fmd: 'compliant' | 'missing' | 'overdue';
  swineFever: 'compliant' | 'missing' | 'overdue';
  prrs: 'compliant' | 'missing' | 'overdue';
  healthCheck: 'compliant' | 'missing' | 'overdue';
  overall: 'compliant' | 'pending' | 'non_compliant';
}

const ComplianceCheck = () => {
  const [checkData, setCheckData] = useState<ComplianceItem[]>([
    { id: '1', earTagId: 'E12345', livestockType: 'pig', fmd: 'compliant', swineFever: 'compliant', prrs: 'compliant', healthCheck: 'compliant', overall: 'compliant' },
    { id: '2', earTagId: 'E12346', livestockType: 'pig', fmd: 'compliant', swineFever: 'compliant', prrs: 'missing', healthCheck: 'compliant', overall: 'pending' },
    { id: '3', earTagId: 'E12347', livestockType: 'pig', fmd: 'compliant', swineFever: 'overdue', prrs: 'compliant', healthCheck: 'overdue', overall: 'non_compliant' },
    { id: '4', earTagId: 'E20001', livestockType: 'cattle', fmd: 'compliant', swineFever: 'compliant', prrs: 'compliant', healthCheck: 'compliant', overall: 'compliant' },
    { id: '5', earTagId: 'E12348', livestockType: 'pig', fmd: 'overdue', swineFever: 'compliant', prrs: 'compliant', healthCheck: 'compliant', overall: 'non_compliant' },
    { id: '6', earTagId: 'E12349', livestockType: 'pig', fmd: 'compliant', swineFever: 'compliant', prrs: 'compliant', healthCheck: 'missing', overall: 'pending' },
  ]);

  const stats = {
    total: checkData.length,
    compliant: checkData.filter(d => d.overall === 'compliant').length,
    pending: checkData.filter(d => d.overall === 'pending').length,
    nonCompliant: checkData.filter(d => d.overall === 'non_compliant').length,
    complianceRate: checkData.length > 0 ? Math.round((checkData.filter(d => d.overall === 'compliant').length / checkData.length) * 100) : 0,
  };

  const getTypeText = (type: string) => {
    return type === 'pig' ? '猪' : type === 'cattle' ? '牛' : type === 'sheep' ? '羊' : '鸡';
  };

  const getStatusTag = (status: string, label?: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      compliant: { color: 'green', text: label || '已接种', icon: <CheckCircleOutlined /> },
      missing: { color: 'orange', text: label || '未接种', icon: <WarningOutlined /> },
      overdue: { color: 'red', text: label || '已逾期', icon: <CloseCircleOutlined /> },
    };
    const config = statusMap[status] || statusMap.missing;
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getOverallTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      compliant: { color: 'green', text: '完全合规' },
      pending: { color: 'orange', text: '部分合规' },
      non_compliant: { color: 'red', text: '不合规' },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const canSlaughter = (item: ComplianceItem) => {
    return item.overall === 'compliant';
  };

  const columns: ColumnsType<ComplianceItem> = [
    { title: '耳标编号', dataIndex: 'earTagId', key: 'earTagId', fixed: 'left', width: 120 },
    { title: '类型', dataIndex: 'livestockType', key: 'livestockType', width: 80, render: getTypeText },
    { title: '口蹄疫', dataIndex: 'fmd', key: 'fmd', width: 100, render: getStatusTag },
    { title: '猪瘟', dataIndex: 'swineFever', key: 'swineFever', width: 100, render: (status: string, record: ComplianceItem) => record.livestockType === 'pig' ? getStatusTag(status) : <Tag color="default">不适用</Tag> },
    { title: '蓝耳病', dataIndex: 'prrs', key: 'prrs', width: 100, render: (status: string, record: ComplianceItem) => record.livestockType === 'pig' ? getStatusTag(status) : <Tag color="default">不适用</Tag> },
    { title: '健康检查', dataIndex: 'healthCheck', key: 'healthCheck', width: 100, render: getStatusTag },
    { title: '整体状态', dataIndex: 'overall', key: 'overall', width: 100, render: getOverallTag },
    { title: '出栏资格', key: 'slaughter', width: 100, render: (_, record) => canSlaughter(record) ? <Tag color="green" icon={<CheckCircleOutlined />}>允许出栏</Tag> : <Tag color="red" icon={<CloseCircleOutlined />}>禁止出栏</Tag> },
    { title: '备注', key: 'notes', render: (_, record) => {
      const issues: string[] = [];
      if (record.fmd === 'overdue') issues.push('口蹄疫逾期');
      if (record.swineFever === 'overdue') issues.push('猪瘟逾期');
      if (record.prrs === 'overdue') issues.push('蓝耳病逾期');
      if (record.healthCheck === 'overdue') issues.push('健康检查逾期');
      if (record.fmd === 'missing') issues.push('口蹄疫未种');
      if (record.swineFever === 'missing') issues.push('猪瘟未种');
      if (record.prrs === 'missing') issues.push('蓝耳病未种');
      if (record.healthCheck === 'missing') issues.push('健康检查缺失');
      return issues.length > 0 ? issues.join(', ') : '-';
    } },
  ];

  return (
    <div>
      {stats.nonCompliant > 0 && (
        <Alert
          message={`⚠️ 有 ${stats.nonCompliant} 头牲畜不合规，禁止出栏！`}
          description="请尽快完成疫苗接种和健康检查"
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {stats.pending > 0 && (
        <Alert
          message={`⚠️ 有 ${stats.pending} 头牲畜部分合规`}
          description="请尽快补全缺失的防疫项目"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总牲畜数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: '#f6ffed' }}>
            <Statistic title="完全合规" value={stats.compliant} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: '#fff7e6' }}>
            <Statistic title="部分合规" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: '#fff2f0' }}>
            <Statistic title="不合规" value={stats.nonCompliant} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="合规率">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Progress percent={stats.complianceRate} size="large" strokeColor={stats.complianceRate >= 80 ? '#52c41a' : stats.complianceRate >= 50 ? '#faad14' : '#ff4d4f'} />
              <div style={{ textAlign: 'center' }}>
                {stats.complianceRate >= 80 ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>优秀水平</Tag>
                ) : stats.complianceRate >= 50 ? (
                  <Tag color="orange" icon={<WarningOutlined />}>需要改进</Tag>
                ) : (
                  <Tag color="red" icon={<CloseCircleOutlined />}>严重问题</Tag>
                )}
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="防疫合规检查清单">
        <Table
          columns={columns}
          dataSource={checkData}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条记录` }}
        />
      </Card>
    </div>
  );
};

export default ComplianceCheck;
