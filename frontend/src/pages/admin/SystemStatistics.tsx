import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  DatePicker,
  Select,
  Space,
} from 'antd';
import {
  BarChartOutlined,
  BankOutlined,
  UserOutlined,
  SolutionOutlined,
  FileTextOutlined,
  MessageOutlined,
  RiseOutlined,
  PieChartOutlined,
  BarChartOutlined as BarChartIcon,
  TeamOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { admin } from '../../api/endpoints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const SystemStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    overview: {
      totalCompanies: number;
      approvedCompanies: number;
      pendingCompanies: number;
      totalJobseekers: number;
      totalJobs: number;
      activeJobs: number;
      totalResumes: number;
      totalPosts: number;
      totalMatches: number;
    };
    last30Days: {
      newCompanies: number;
      newJobseekers: number;
      newJobs: number;
      newMatches: number;
    };
    companyStatusDistribution: Array<{ name: string; value: number }>;
  } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await admin.statistics();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerTrendOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['企业注册', '求职者注册'],
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '企业注册',
        data: [12, 19, 25, 32, 28, 45, 38, 52, 48, 55, 62, stats?.last30Days?.newCompanies || 58],
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#1890ff',
          width: 3,
        },
        areaStyle: {
          color: 'rgba(24, 144, 255, 0.2)',
        },
      },
      {
        name: '求职者注册',
        data: [45, 52, 68, 75, 82, 95, 88, 102, 115, 120, 135, stats?.last30Days?.newJobseekers || 142],
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#52c41a',
          width: 3,
        },
        areaStyle: {
          color: 'rgba(82, 196, 26, 0.2)',
        },
      },
    ],
  };

  const jobTrendOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['岗位发布数', '简历投递数'],
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '岗位发布数',
        data: [85, 92, 108, 125, 118, stats?.overview?.activeJobs || 142],
        type: 'bar',
        itemStyle: {
          color: '#1890ff',
        },
      },
      {
        name: '简历投递数',
        data: [320, 385, 452, 528, 495, stats?.overview?.totalMatches || 612],
        type: 'bar',
        itemStyle: {
          color: '#52c41a',
        },
      },
    ],
  };

  const resumeParseTrendOption = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: [28, 35, 42, 38, 45, 25, 18],
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#722ed1',
          width: 3,
        },
        areaStyle: {
          color: 'rgba(114, 46, 209, 0.2)',
        },
        itemStyle: {
          color: '#722ed1',
        },
      },
    ],
  };

  const industryPieOption = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '行业分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: stats?.companyStatusDistribution?.length
          ? stats.companyStatusDistribution
          : [
              { value: 1048, name: '包装印刷' },
              { value: 735, name: '出版印刷' },
              { value: 580, name: '商业印刷' },
              { value: 484, name: '标签印刷' },
              { value: 300, name: '柔版印刷' },
            ],
      },
    ],
  };

  const positionBarOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: ['印刷机长', '印前制作', '模切机长', '装订工', '质检员', '设备维修', '调色师', '生产主管'],
      axisLabel: {
        interval: 0,
        rotate: 30,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: [256, 189, 168, 145, 132, 98, 85, 72],
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#096dd9' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  const overview = stats?.overview;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <BarChartOutlined /> 系统统计
          </Title>
        </Col>
        <Col>
          <Space wrap>
            <Select
              defaultValue="month"
              style={{ width: 120 }}
            >
              <Option value="day">今日</Option>
              <Option value="week">本周</Option>
              <Option value="month">本月</Option>
              <Option value="quarter">本季度</Option>
              <Option value="year">本年</Option>
            </Select>
            <RangePicker
              defaultValue={[dayjs().subtract(6, 'month'), dayjs()]}
            />
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic
              title="企业总数"
              value={overview?.totalCompanies ?? 0}
              prefix={<BankOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <RiseOutlined style={{ color: '#52c41a' }} /> 近30日 +{stats?.last30Days?.newCompanies ?? 0}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic
              title="求职者总数"
              value={overview?.totalJobseekers ?? 0}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <RiseOutlined style={{ color: '#52c41a' }} /> 近30日 +{stats?.last30Days?.newJobseekers ?? 0}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic
              title="岗位总数"
              value={overview?.totalJobs ?? 0}
              prefix={<SolutionOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <RiseOutlined style={{ color: '#52c41a' }} /> 在招 {overview?.activeJobs ?? 0}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic
              title="简历总数"
              value={overview?.totalResumes ?? 0}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <RiseOutlined style={{ color: '#52c41a' }} /> 近30日 +{stats?.last30Days?.newJobs ?? 0}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic
              title="帖子总数"
              value={overview?.totalPosts ?? 0}
              prefix={<MessageOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <RiseOutlined style={{ color: '#52c41a' }} /> 活跃社区
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic
              title="面试总数"
              value={overview?.totalMatches ?? 0}
              prefix={<TeamOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <RiseOutlined style={{ color: '#52c41a' }} /> 近30日 +{stats?.last30Days?.newMatches ?? 0}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={16}>
          <Card title={<><RiseOutlined /> 注册趋势</>}>
            <ReactECharts option={registerTrendOption} style={{ height: '350px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<><PieChartOutlined /> 企业状态分布</>}>
            <ReactECharts option={industryPieOption} style={{ height: '350px' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title={<><BarChartIcon /> 岗位发布趋势</>}>
            <ReactECharts option={jobTrendOption} style={{ height: '350px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><FileTextOutlined /> 简历解析趋势</>}>
            <ReactECharts option={resumeParseTrendOption} style={{ height: '350px' }} />
          </Card>
        </Col>
      </Row>

      <Card title={<><BarChartOutlined /> 职位类型分布</>}>
        <ReactECharts option={positionBarOption} style={{ height: '400px' }} />
      </Card>
    </div>
  );
};

export default SystemStatistics;
