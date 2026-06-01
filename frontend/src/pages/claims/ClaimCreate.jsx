import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Select, Button, Space, message, Divider, Descriptions } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { createClaim, getReports } from '../../utils/api.js';

const statusColors = {
  pending: 'orange',
  surveying: 'blue',
  surveyed: 'cyan',
  approved: 'green',
  rejected: 'red',
  paid: 'purple',
  reviewing: 'orange'
};

const statusLabels = {
  pending: '待查勘',
  surveying: '查勘中',
  surveyed: '已查勘',
  approved: '已通过',
  rejected: '已拒赔',
  paid: '已赔付',
  reviewing: '审核中'
};

const roleLabels = {
  insurer: '保险公司',
  township: '乡镇',
  regulator: '监管方'
};

function ClaimCreate({ currentUser }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadSurveyedReports();
  }, []);

  const loadSurveyedReports = async () => {
    try {
      const res = await getReports({ status: 'surveyed', limit: 100 });
      setReports(res.data.data || []);
    } catch (e) {
      console.error('Load surveyed reports failed:', e);
    }
  };

  const handleReportChange = (value) => {
    const report = reports.find(r => r.id === value);
    setSelectedReport(report);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await createClaim(values);
      message.success('理赔申请创建成功');
      navigate('/claims');
    } catch (e) {
      console.error('Create claim failed:', e);
      message.error('创建理赔申请失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/claims')}>
          返回列表
        </Button>
      </Space>

      <div className="page-title">新增理赔</div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="report_id"
            label="选择报案"
            rules={[{ required: true, message: '请选择报案' }]}
          >
            <Select
              placeholder="请选择已查勘未理赔的报案"
              showSearch
              optionFilterProp="children"
              onChange={handleReportChange}
              options={reports.map(r => ({
                value: r.id,
                label: `${r.report_no} - ${r.farmer_name} - ${r.disaster_type} - ${r.damaged_area}亩`
              }))}
            />
          </Form.Item>

          {selectedReport && (
            <>
              <Divider />

              <Descriptions
                title="报案信息"
                bordered
                column={2}
                size="small"
                style={{ marginBottom: 24 }}
              >
                <Descriptions.Item label="报案号">{selectedReport.report_no}</Descriptions.Item>
                <Descriptions.Item label="农户">{selectedReport.farmer_name}</Descriptions.Item>
                <Descriptions.Item label="灾害类型">{selectedReport.disaster_type}</Descriptions.Item>
                <Descriptions.Item label="受损面积">{selectedReport.damaged_area} 亩</Descriptions.Item>
                <Descriptions.Item label="报案时间">
                  {selectedReport.created_at ? dayjs(selectedReport.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <span style={{ color: statusColors[selectedReport.status] }}>
                    {statusLabels[selectedReport.status]}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              {selectedReport.survey && (
                <Descriptions
                  title="查勘信息"
                  bordered
                  column={2}
                  size="small"
                >
                  <Descriptions.Item label="查勘号">{selectedReport.survey.survey_no}</Descriptions.Item>
                  <Descriptions.Item label="查勘员">{selectedReport.survey.surveyor_name}</Descriptions.Item>
                  <Descriptions.Item label="损失比例">
                    {selectedReport.survey.loss_ratio ? `${(selectedReport.survey.loss_ratio * 100).toFixed(1)}%` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="预估损失">
                    ¥{selectedReport.survey.estimated_loss?.toLocaleString() || 0}
                  </Descriptions.Item>
                </Descriptions>
              )}
            </>
          )}

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                disabled={!selectedReport}
              >
                提交理赔申请
              </Button>
              <Button onClick={() => navigate('/claims')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default ClaimCreate;
