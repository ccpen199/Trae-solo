import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Button, Spin, message } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ToolOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportApi } from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [dormitoryData, setDormitoryData] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [majorData, setMajorData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, dormitoryRes, genderRes, majorRes] = await Promise.all([
        reportApi.getOverview(),
        reportApi.getDormitoryOccupancy(),
        reportApi.getGenderDistribution(),
        reportApi.getMajorDistribution(),
      ]);

      setOverview(overviewRes.data.data);
      setDormitoryData(dormitoryRes.data.data);
      setGenderData(genderRes.data.data.map((item: any) => ({
        name: item.gender === 'male' ? '男' : item.gender === 'female' ? '女' : '其他',
        value: item.count,
      })));
      setMajorData(majorRes.data.data);
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportDormitory = async () => {
    try {
      const response = await reportApi.exportDormitory();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dormitory-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>统计报表</h2>
        <Button icon={<DownloadOutlined />} onClick={handleExportDormitory}>
          导出楼栋报表
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="宿舍楼数量"
              value={overview?.dormitories?.total_dormitories || 0}
              prefix={<HomeOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="床位总数"
              value={overview?.beds?.total_beds || 0}
              prefix={<AppstoreOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="学生总数"
              value={overview?.students?.total_students || 0}
              prefix={<TeamOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理维修"
              value={(overview?.maintenance?.pending_tickets || 0) + (overview?.maintenance?.processing_tickets || 0)}
              prefix={<ToolOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="房间统计">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="可用房间"
                  value={overview?.rooms?.available_rooms || 0}
                  suffix={`/ ${overview?.rooms?.total_rooms || 0}`}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="已占用房间"
                  value={overview?.rooms?.occupied_rooms || 0}
                  suffix={`/ ${overview?.rooms?.total_rooms || 0}`}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="床位统计">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="可用床位"
                  value={overview?.beds?.available_beds || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="已入住床位"
                  value={overview?.beds?.occupied_beds || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="维修中床位"
                  value={overview?.beds?.maintenance_beds || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="各楼栋入住情况">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dormitoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="building_code" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupied_beds" name="已入住" fill="#1677ff" />
                <Bar dataKey="available_beds" name="空床位" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="学生性别分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="学生入住统计">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="已入住学生"
                  value={overview?.students?.checked_in_students || 0}
                  suffix={`/ ${overview?.students?.total_students || 0}`}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="未入住学生"
                  value={overview?.students?.not_checked_in_students || 0}
                  suffix={`/ ${overview?.students?.total_students || 0}`}
                  valueStyle={{ color: '#999' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="维修统计">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="待处理维修"
                  value={(overview?.maintenance?.pending_tickets || 0) + (overview?.maintenance?.processing_tickets || 0)}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="已完成维修"
                  value={overview?.maintenance?.completed_tickets || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportPage;