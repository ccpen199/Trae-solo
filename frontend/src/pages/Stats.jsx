import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Button, Space, Select, message, Progress } from 'antd';
import {
  FileTextOutlined,
  AlertOutlined,
  AuditOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getStatsOverview,
  getDisasterDistribution,
  getCompensationProgress,
  getRejectionReasons,
  getCropDistribution,
  getProcessingTime,
  getRegulatoryReport
} from '../utils/api.js';

const { RangePicker } = DatePicker;
const { Option } = Select;

const compensationStatusLabels = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒赔',
  paid: '已赔付'
};

const compensationStatusColors = {
  pending: '#fa8c16',
  approved: '#52c41a',
  rejected: '#f5222d',
  paid: '#722ed1'
};

function Stats() {
  const [dateRange, setDateRange] = useState(null);
  const [overview, setOverview] = useState(null);
  const [disasterData, setDisasterData] = useState([]);
  const [compensationProgress, setCompensationProgress] = useState([]);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [cropData, setCropData] = useState([]);
  const [processingTime, setProcessingTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const buildParams = () => {
    const params = {};
    if (dateRange && dateRange.length === 2) {
      params.start_date = dateRange[0].format('YYYY-MM-DD');
      params.end_date = dateRange[1].format('YYYY-MM-DD');
    }
    return params;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params = buildParams();
      const [
        overviewRes,
        disasterRes,
        progressRes,
        reasonsRes,
        cropRes,
        timeRes
      ] = await Promise.all([
        getStatsOverview(params),
        getDisasterDistribution(params),
        getCompensationProgress(),
        getRejectionReasons(),
        getCropDistribution(),
        getProcessingTime(params)
      ]);
      setOverview(overviewRes.data);
      setDisasterData(disasterRes.data.data || disasterRes.data || []);
      setCompensationProgress(progressRes.data.data || progressRes.data || []);
      setRejectionReasons(reasonsRes.data.data || reasonsRes.data || []);
      setCropData(cropRes.data.data || cropRes.data || []);
      setProcessingTime(timeRes.data);
    } catch (e) {
      console.error('Load stats data failed:', e);
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = buildParams();
      const res = await getRegulatoryReport(params);
      const data = res.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `regulatory-report-${dayjs().format('YYYYMMDDHHmmss')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (e) {
      console.error('Export failed:', e);
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const disasterColumns = [
    { title: '灾害类型', dataIndex: 'disaster_name', key: 'disaster_name' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '报案数', dataIndex: 'report_count', key: 'report_count' },
    { title: '受损面积(亩)', dataIndex: 'total_damaged_area', key: 'total_damaged_area' },
    { title: '赔付金额(元)', dataIndex: 'total_compensation', key: 'total_compensation', render: (v) => `¥${(v || 0).toLocaleString()}` }
  ];

  const rejectionColumns = [
    { title: '拒赔原因', dataIndex: 'reason', key: 'reason' },
    { title: '案件数', dataIndex: 'count', key: 'count' }
  ];

  const cropColumns = [
    { title: '作物类型', dataIndex: 'crop_name', key: 'crop_name' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '保单数', dataIndex: 'policy_count', key: 'policy_count' },
    { title: '投保面积(亩)', dataIndex: 'total_area', key: 'total_area' },
    { title: '保额(元)', dataIndex: 'total_amount', key: 'total_amount', render: (v) => `¥${(v || 0).toLocaleString()}` },
    { title: '报案数', dataIndex: 'report_count', key: 'report_count' },
    { title: '赔付金额(元)', dataIndex: 'total_compensation', key: 'total_compensation', render: (v) => `¥${(v || 0).toLocaleString()}` }
  ];

  const processingTimeColumns = [
    { title: '环节', dataIndex: 'stage', key: 'stage' },
    { title: '平均时长(小时)', dataIndex: 'avg_hours', key: 'avg_hours', render: (v) => (v || 0).toFixed(1) }
  ];

  const processingTimeData = processingTime ? [
    { stage: '报案到查勘', avg_hours: processingTime.avg_report_to_survey_hours },
    { stage: '查勘到理赔', avg_hours: processingTime.avg_survey_to_claim_hours },
    { stage: '理赔到审批', avg_hours: processingTime.avg_claim_to_approval_hours },
    { stage: '审批到支付', avg_hours: processingTime.avg_approval_to_payment_hours },
    { stage: '总时长', avg_hours: processingTime.avg_total_hours }
  ] : [];

  const totalCompensation = compensationProgress.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div>
      <div className="page-title">报表统计</div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
          />
          <Button type="primary" onClick={loadData} loading={loading}>
            查询
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            监管报送数据导出
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<Space><FileTextOutlined /> 保单数</Space>}
              value={overview?.policies?.count || 0}
              suffix="份"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<Space><DollarOutlined /> 保额</Space>}
              value={overview?.policies?.total_amount || 0}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<Space><AlertOutlined /> 报案数</Space>}
              value={overview?.reports?.count || 0}
              suffix="件"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<Space><AlertOutlined /> 受损面积</Space>}
              value={overview?.reports?.total_damaged_area || 0}
              suffix="亩"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<Space><AuditOutlined /> 理赔数</Space>}
              value={overview?.claims?.count || 0}
              suffix="件"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<Space><DollarOutlined /> 赔付金额</Space>}
              value={overview?.claims?.total_compensation || 0}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<Space><ClockCircleOutlined /> 平均处理时长</Space>}
              value={overview?.avg_process_hours?.toFixed(1) || 0}
              suffix="小时"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="灾害分布统计" loading={loading}>
            <Table
              columns={disasterColumns}
              dataSource={disasterData}
              rowKey="disaster_type"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="理赔进度统计" loading={loading}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {compensationProgress.map((item) => {
                const status = item.status;
                const percent = totalCompensation > 0 ? Math.round((item.count || 0) / totalCompensation * 100) : 0;
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{compensationStatusLabels[status] || status}</span>
                      <span style={{ color: compensationStatusColors[status] }}>
                        {item.count || 0}件 ({percent}%)
                      </span>
                    </div>
                    <Progress
                      percent={percent}
                      showInfo={false}
                      strokeColor={compensationStatusColors[status]}
                      size="small"
                    />
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="拒赔原因统计" loading={loading}>
            <Table
              columns={rejectionColumns}
              dataSource={rejectionReasons}
              rowKey="reason"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="处理时长统计" loading={loading}>
            <Table
              columns={processingTimeColumns}
              dataSource={processingTimeData}
              rowKey="stage"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="作物分布统计" loading={loading}>
            <Table
              columns={cropColumns}
              dataSource={cropData}
              rowKey="crop_type"
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Stats;
