import { useEffect, useRef, useState, useMemo } from 'react';
import { Card, Table, Tag, Select, DatePicker, Button, Space, Statistic, Row, Col, Progress } from 'antd';
import { BarChart3, TrendingUp, Clock, XCircle, Filter, RefreshCw, ArrowUp, ArrowDown, Trophy } from 'lucide-react';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { mockPerformanceData, mockDepartments } from '../../mock/data';
import type { PerformanceData, Department } from '../../shared/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const statusColorMap: Record<string, string> = {
  normal: 'success',
  warning: 'warning',
  error: 'error',
};

const generateDepartmentRanking = (): Array<{
  id: string;
  name: string;
  completionRate: number;
  avgHandlingTime: number;
  totalApplications: number;
  rejectionRate: number;
  rank: number;
}> => {
  return mockDepartments.map((dept: Department, index: number) => {
    const baseRate = 85 + Math.random() * 14;
    const baseTime = 20 + Math.random() * 40;
    const totalApps = Math.floor(Math.random() * 2000) + 500;
    const rejectionRate = Math.random() * 5 + 1;

    return {
      id: dept.id,
      name: dept.name,
      completionRate: Math.round(baseRate * 10) / 10,
      avgHandlingTime: Math.round(baseTime * 10) / 10,
      totalApplications: totalApps,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
      rank: index + 1,
    };
  }).sort((a, b) => b.completionRate - a.completionRate).map((item, index) => ({ ...item, rank: index + 1 }));
};

export default function Performance() {
  const trendChartRef = useRef<HTMLDivElement>(null);
  const timeChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const trendChartInstance = useRef<echarts.ECharts | null>(null);
  const timeChartInstance = useRef<echarts.ECharts | null>(null);
  const pieChartInstance = useRef<echarts.ECharts | null>(null);
  const barChartInstance = useRef<echarts.ECharts | null>(null);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departmentRanking] = useState(generateDepartmentRanking);

  const filteredData = useMemo(() => {
    let result = [...mockPerformanceData];
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      result = result.filter(d => d.date >= startDate && d.date <= endDate);
    }

    return result;
  }, [dateRange]);

  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        avgCompletionRate: 0,
        avgHandlingTime: 0,
        totalRejections: 0,
        totalApplications: 0,
      };
    }

    const avgCompletionRate = filteredData.reduce((sum, d) => sum + d.completionRate, 0) / filteredData.length;
    const avgHandlingTime = filteredData.reduce((sum, d) => sum + d.averageHandlingTime, 0) / filteredData.length;
    const totalRejections = filteredData.reduce((sum, d) => sum + d.rejectionCount, 0);
    const totalApplications = filteredData.reduce((sum, d) => sum + d.totalApplications, 0);

    return {
      avgCompletionRate: Math.round(avgCompletionRate * 10) / 10,
      avgHandlingTime: Math.round(avgHandlingTime * 10) / 10,
      totalRejections,
      totalApplications,
    };
  }, [filteredData]);

  const rejectionReasonsAggregated = useMemo(() => {
    const reasonMap: Record<string, number> = {};
    filteredData.forEach(d => {
      d.rejectionReasons.forEach(r => {
        reasonMap[r.reason] = (reasonMap[r.reason] || 0) + r.count;
      });
    });
    return Object.entries(reasonMap).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  useEffect(() => {
    if (!trendChartRef.current) return;
    trendChartInstance.current = echarts.init(trendChartRef.current);

    const dates = filteredData.map(d => d.date.slice(5));
    const completionRates = filteredData.map(d => d.completionRate);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: (params: any) => {
          const date = params[0].axisValue;
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${date}</div>`;
          params.forEach((param: any) => {
            result += `<div style="display: flex; align-items: center; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></span>
              <span style="margin-right: 8px;">${param.seriesName}:</span>
              <span style="font-weight: 600;">${param.value}%</span>
            </div>`;
          });
          return result;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 70,
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 11, formatter: '{value}%' },
      },
      series: [
        {
          name: '办结率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3, color: '#165DFF' },
          itemStyle: { color: '#165DFF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22, 93, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 93, 255, 0.02)' },
            ]),
          },
          data: completionRates,
          markLine: {
            silent: true,
            lineStyle: { color: '#F53F3F', type: 'dashed' },
            data: [{ yAxis: 80, label: { formatter: '达标线 80%', color: '#F53F3F' } }],
          },
        },
      ],
    };

    trendChartInstance.current.setOption(option);

    const handleResize = () => {
      trendChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      trendChartInstance.current?.dispose();
    };
  }, [filteredData]);

  useEffect(() => {
    if (!timeChartRef.current) return;
    timeChartInstance.current = echarts.init(timeChartRef.current);

    const dates = filteredData.map(d => d.date.slice(5));
    const avgTimes = filteredData.map(d => d.averageHandlingTime);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: (params: any) => {
          const date = params[0].axisValue;
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${date}</div>`;
          params.forEach((param: any) => {
            result += `<div style="display: flex; align-items: center; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></span>
              <span style="margin-right: 8px;">${param.seriesName}:</span>
              <span style="font-weight: 600;">${param.value}分钟</span>
            </div>`;
          });
          return result;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 11, formatter: '{value}分钟' },
      },
      series: [
        {
          name: '平均耗时',
          type: 'bar',
          barWidth: '60%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#722ED1' },
              { offset: 1, color: '#722ED166' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          data: avgTimes,
        },
      ],
    };

    timeChartInstance.current.setOption(option);

    const handleResize = () => {
      timeChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      timeChartInstance.current?.dispose();
    };
  }, [filteredData]);

  useEffect(() => {
    if (!pieChartRef.current) return;
    pieChartInstance.current = echarts.init(pieChartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: '{b}: {c}件 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#4E5969', fontSize: 12 },
      },
      color: ['#165DFF', '#722ED1', '#FF7D00', '#00B42A', '#F53F3F'],
      series: [
        {
          name: '退件原因',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
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
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: rejectionReasonsAggregated,
        },
      ],
    };

    pieChartInstance.current.setOption(option);

    const handleResize = () => {
      pieChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      pieChartInstance.current?.dispose();
    };
  }, [rejectionReasonsAggregated]);

  useEffect(() => {
    if (!barChartRef.current) return;
    barChartInstance.current = echarts.init(barChartRef.current);

    const sortedData = [...rejectionReasonsAggregated].sort((a, b) => b.value - a.value);
    const reasons = sortedData.map(item => item.name);
    const counts = sortedData.map(item => item.value);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}: ${param.value}件`;
        },
      },
      grid: {
        left: '3%',
        right: '10%',
        bottom: '3%',
        top: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: reasons,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#4E5969', fontSize: 12 },
        axisTick: { show: false },
      },
      series: [
        {
          name: '退件数',
          type: 'bar',
          barWidth: '50%',
          itemStyle: {
            color: (params: any) => {
              const colors = ['#165DFF', '#722ED1', '#FF7D00', '#00B42A', '#F53F3F'];
              return colors[params.dataIndex % colors.length];
            },
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            color: '#4E5969',
            fontSize: 12,
            formatter: '{c}件',
          },
          data: counts,
        },
      ],
    };

    barChartInstance.current.setOption(option);

    const handleResize = () => {
      barChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      barChartInstance.current?.dispose();
    };
  }, [rejectionReasonsAggregated]);

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => {
        let rankClass = 'bg-gov-gray-100 text-gov-gray-600';
        if (rank === 1) rankClass = 'bg-yellow-100 text-yellow-700';
        else if (rank === 2) rankClass = 'bg-gray-200 text-gray-700';
        else if (rank === 3) rankClass = 'bg-orange-100 text-orange-700';
        
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankClass}`}>
            {rank <= 3 ? <Trophy className="w-4 h-4" /> : rank}
          </div>
        );
      },
    },
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span className="font-medium text-gov-gray-700">{name}</span>
      ),
    },
    {
      title: '办结率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate: number) => (
        <div className="flex items-center gap-3">
          <Progress 
            percent={rate} 
            size="small" 
            strokeColor={rate >= 90 ? '#00B42A' : rate >= 80 ? '#FF7D00' : '#F53F3F'}
            showInfo={false}
            style={{ width: 100 }}
          />
          <span className={`font-semibold ${rate >= 90 ? 'text-green-600' : rate >= 80 ? 'text-orange-600' : 'text-red-600'}`}>
            {rate}%
          </span>
        </div>
      ),
    },
    {
      title: '平均耗时',
      dataIndex: 'avgHandlingTime',
      key: 'avgHandlingTime',
      render: (time: number) => (
        <span className="font-medium text-gov-gray-700">{time}分钟</span>
      ),
    },
    {
      title: '总办件量',
      dataIndex: 'totalApplications',
      key: 'totalApplications',
      render: (count: number) => (
        <span className="font-medium text-gov-gray-700">{count.toLocaleString()}</span>
      ),
    },
    {
      title: '退件率',
      dataIndex: 'rejectionRate',
      key: 'rejectionRate',
      render: (rate: number) => (
        <Tag color={rate > 3 ? 'red' : rate > 2 ? 'orange' : 'green'}>
          {rate}%
        </Tag>
      ),
    },
    {
      title: '趋势',
      key: 'trend',
      render: () => {
        const isUp = Math.random() > 0.5;
        return (
          <div className={`flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            {isUp ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span className="text-sm font-medium">{(Math.random() * 5).toFixed(1)}%</span>
          </div>
        );
      },
    },
  ];

  const handleReset = () => {
    setDateRange([dayjs().subtract(29, 'day'), dayjs()]);
    setSelectedDepartment('all');
  };

  return (
    <div className="min-h-screen bg-gov-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gov-gray-700">效能监测中心</h1>
            <Button 
              type="primary" 
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={handleReset}
            >
              重置筛选
            </Button>
          </div>
          <p className="text-gov-gray-500">实时监测各部门政务服务效能，优化办理流程</p>
        </div>

        <Card className="shadow-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-gov-gray-700">筛选条件</span>
          </div>
          <Space wrap size="middle">
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-sm">时间范围:</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                allowClear={false}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-sm">部门:</span>
              <Select
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                style={{ width: 200 }}
                allowClear
              >
                <Option value="all">全部部门</Option>
                {mockDepartments.map(dept => (
                  <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                ))}
              </Select>
            </div>
          </Space>
        </Card>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-blue-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <BarChart3 className="w-4 h-4" />
                    平均办结率
                  </div>
                }
                value={summaryStats.avgCompletionRate}
                suffix="%"
                valueStyle={{ color: '#165DFF' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-purple-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <Clock className="w-4 h-4" />
                    平均办理时长
                  </div>
                }
                value={summaryStats.avgHandlingTime}
                suffix="分钟"
                valueStyle={{ color: '#722ED1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-green-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <TrendingUp className="w-4 h-4" />
                    总办件量
                  </div>
                }
                value={summaryStats.totalApplications}
                valueStyle={{ color: '#00B42A' }}
                formatter={(value) => String(value).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-red-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <XCircle className="w-4 h-4" />
                    累计退件
                  </div>
                }
                value={summaryStats.totalRejections}
                valueStyle={{ color: '#F53F3F' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-primary-600 mr-2" />
                  <span className="font-semibold">办结率趋势</span>
                </div>
              }
              className="shadow-card h-full"
            >
              <div ref={trendChartRef} style={{ height: '320px', width: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-semibold">平均办理耗时</span>
                </div>
              }
              className="shadow-card h-full"
            >
              <div ref={timeChartRef} style={{ height: '320px', width: '100%' }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="font-semibold">退件原因分布</span>
                </div>
              }
              className="shadow-card h-full"
            >
              <div ref={pieChartRef} style={{ height: '320px', width: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="font-semibold">退件原因排行</span>
                </div>
              }
              className="shadow-card h-full"
            >
              <div ref={barChartRef} style={{ height: '320px', width: '100%' }} />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <div className="flex items-center">
              <Trophy className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-semibold">部门效能排名</span>
            </div>
          }
          className="shadow-card"
        >
          <Table
            dataSource={departmentRanking}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个部门`,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
