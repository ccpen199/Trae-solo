import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Drawer,
  Descriptions
} from 'antd';
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { explanationReports } from '../api';

const { Title, Text } = Typography;

function Reports() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await explanationReports.list({});
      setList(res.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const res = await explanationReports.get(id);
      setCurrentReport(res.data);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const handleExport = async (id) => {
    try {
      const res = await explanationReports.export(id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const columns = [
    { title: '报告标题', dataIndex: 'title', key: 'title' },
    { title: '关联任务', dataIndex: 'task_name', key: 'task_name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => s === 'reviewed' ? <Tag color="green">已审核</Tag> : <Tag>草稿</Tag> },
    { title: '创建人', dataIndex: 'created_by', key: 'created_by' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleExport(record.id)}>
            导出
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={3}>解释报告</Title></Col>
      </Row>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title="报告详情"
        placement="right"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={700}
      >
        {currentReport && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="报告标题">{currentReport.title}</Descriptions.Item>
              <Descriptions.Item label="关联任务">{currentReport.task_name}</Descriptions.Item>
              <Descriptions.Item label="状态">{currentReport.status === 'reviewed' ? <Tag color="green">已审核</Tag> : <Tag>草稿</Tag>}</Descriptions.Item>
              <Descriptions.Item label="摘要">{currentReport.summary || '-'}</Descriptions.Item>
              <Descriptions.Item label="根本原因">{currentReport.root_cause || '-'}</Descriptions.Item>
              <Descriptions.Item label="影响分析">{currentReport.impact_analysis || '-'}</Descriptions.Item>
              <Descriptions.Item label="建议措施">{currentReport.recommendations || '-'}</Descriptions.Item>
              <Descriptions.Item label="审核意见">{currentReport.review_comments || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{currentReport.created_by}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentReport.created_at}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default Reports;
