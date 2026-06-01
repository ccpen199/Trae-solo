import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Button, Space, Tag, Modal } from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  BarChartOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { statisticsApi } from '../api';

const { RangePicker } = DatePicker;

const Statistics = () => {
  const [overview, setOverview] = useState({
    cases: { total: 0, scheduled: 0, pending: 0, postponed: 0 },
    schedules: { total: 0, completed: 0 },
    notifications: { pending: 0, failed: 0 },
  });
  const [byCourt, setByCourt] = useState([]);
  const [byJudge, setByJudge] = useState([]);
  const [byCaseType, setByCaseType] = useState([]);
  const [drilldownData, setDrilldownData] = useState([]);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);

  useEffect(() => {
    loadStatistics();
  }, [dateRange]);

  const loadStatistics = async () => {
    try {
      const [overviewRes, byCourtRes, byJudgeRes, byCaseTypeRes] = await Promise.all([
        statisticsApi.getOverview(),
        statisticsApi.getByCourt({
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        }),
        statisticsApi.getByJudge({
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        }),
        statisticsApi.getByCaseType(),
      ]);

      setOverview(overviewRes.data);
      setByCourt(byCourtRes.data);
      setByJudge(byJudgeRes.data);
      setByCaseType(byCaseTypeRes.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const handleDrilldown = async (type, id, title) => {
    try {
      setDrilldownTitle(title);
      const res = await statisticsApi.getDrilldown({
        type,
        id,
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      });
      setDrilldownData(res.data);
      setIsDrilldownOpen(true);
    } catch (error) {
      console.error('加载明细失败:', error);
    }
  };

  const courtColumns = [
    { title: '法庭名称', dataIndex: 'court_name', key: 'court_name' },
    {
      title: '排期数量',
      dataIndex: 'schedule_count',
      key: 'schedule_count',
      render: (val, record) => (
        <Button
          type="link"
          onClick={() => handleDrilldown('court', record.id, `${record.court_name} 排期明细`)}
        >
          {val}
        </Button>
      ),
    },
  ];

  const judgeColumns = [
    { title: '法官姓名', dataIndex: 'judge_name', key: 'judge_name' },
    { title: '职称', dataIndex: 'title', key: 'title' },
    {
      title: '排期数量',
      dataIndex: 'schedule_count',
      key: 'schedule_count',
      render: (val, record) => (
        <Button
          type="link"
          onClick={() => handleDrilldown('judge', record.id, `${record.judge_name} 排期明细`)}
        >
          {val}
        </Button>
      ),
    },
  ];

  const drilldownColumns = [
    { title: '案号', dataIndex: 'case_number', key: 'case_number' },
    { title: '案由', dataIndex: 'case_reason', key: 'case_reason' },
    { title: '法庭', dataIndex: 'court_name', key: 'court_name' },
    { title: '法官', dataIndex: 'judge_name', key: 'judge_name' },
    { title: '开庭时间', dataIndex: 'start_time', key: 'start_time' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          scheduled: { color: 'green', text: '已排期' },
          ongoing: { color: 'blue', text: '审理中' },
          completed: { color: 'gray', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
          postponed: { color: 'orange', text: '已改期' },
        };
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
  ];

  const caseTypeData = byCaseType.map(item => {
    const typeMap = {
      civil: '民事',
      criminal: '刑事',
      administrative: '行政',
      commercial: '商事',
      family: '家事',
    };
    return { ...item, case_type: typeMap[item.case_type] || item.case_type };
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>统计分析</h2>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
          />
          <Button icon={<SearchOutlined />} onClick={loadStatistics}>查询</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="案件总数"
              value={overview.cases.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已排期"
              value={overview.cases.scheduled}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待排期"
              value={overview.cases.pending}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已改期"
              value={overview.cases.postponed}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="按法庭统计" extra={<span style={{ color: '#999' }}>点击数量查看明细</span>}>
            <Table
              columns={courtColumns}
              dataSource={byCourt.map((item, index) => ({ ...item, key: index }))}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="按法官统计" extra={<span style={{ color: '#999' }}>点击数量查看明细</span>}>
            <Table
              columns={judgeColumns}
              dataSource={byJudge.map((item, index) => ({ ...item, key: index }))}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="按案件类型统计">
            <Table
              columns={[
                { title: '案件类型', dataIndex: 'case_type', key: 'case_type' },
                { title: '数量', dataIndex: 'count', key: 'count' },
              ]}
              dataSource={caseTypeData.map((item, index) => ({ ...item, key: index }))}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={drilldownTitle}
        open={isDrilldownOpen}
        onCancel={() => setIsDrilldownOpen(false)}
        footer={null}
        width={900}
      >
        <Table
          columns={drilldownColumns}
          dataSource={drilldownData.map((item, index) => ({ ...item, key: index }))}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default Statistics;
