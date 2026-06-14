import React, { useEffect, useState } from 'react';
import { Card, Select, Row, Col, Progress, Button, Tag, Typography, Space, Tooltip, Divider } from 'antd';
import { BarChartOutlined, PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getProjects, getProjectGantt } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ErpGantt = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [ganttData, setGanttData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadGantt();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    const res = await getProjects({ pageSize: 100 });
    if (res.code === 200) {
      setProjects(res.data.list);
      if (res.data.list.length > 0) {
        setSelectedProject(res.data.list[0].id);
      }
    }
  };

  const loadGantt = async () => {
    setLoading(true);
    const res = await getProjectGantt(selectedProject);
    if (res.code === 200) {
      setGanttData(res.data);
    }
    setLoading(false);
  };

  const statusMap = {
    pending: { color: '#d9d9d9', bg: '#f5f5f5', icon: <ClockCircleOutlined />, text: '待开始' },
    in_progress: { color: '#1890ff', bg: '#e6f7ff', icon: <PlayCircleOutlined />, text: '进行中' },
    completed: { color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleOutlined />, text: '已完成' }
  };

  if (projects.length === 0) {
    return <div style={{ textAlign: 'center', padding: 60 }}>暂无项目数据</div>;
  }

  const project = projects.find(p => p.id === selectedProject);
  const startDate = project ? dayjs(project.start_date) : dayjs();
  const endDate = project ? dayjs(project.end_date) : dayjs();
  const totalDays = endDate.diff(startDate, 'day') + 1;

  const renderGanttRow = (task) => {
    const taskStart = dayjs(task.start);
    const taskEnd = dayjs(task.end);
    const taskDuration = taskEnd.diff(taskStart, 'day') + 1;
    const startOffset = taskStart.diff(startDate, 'day');
    const widthPercent = (taskDuration / totalDays) * 100;
    const leftPercent = (startOffset / totalDays) * 100;
    const status = statusMap[task.status] || statusMap.pending;

    return (
      <div key={task.id} className="gantt-row" style={{ background: task.parent_id ? '#fafafa' : '#fff' }}>
        <div className="gantt-label" style={{ paddingLeft: task.parent_id ? 24 : 8 }}>
          <span style={{ marginRight: 8 }}>{status.icon}</span>
          {task.name}
        </div>
        <div style={{ flex: 1, position: 'relative', height: 48, background: `repeating-linear-gradient(90deg, #f0f0f0, #f0f0f0 1px, transparent 1px, transparent ${100 / Math.min(totalDays, 30)}%)` }}>
          <Tooltip title={`${task.start} ~ ${task.end} (${taskDuration}天) 进度: ${task.progress}%`}>
            <div
              className="gantt-bar"
              style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                top: '50%',
                transform: 'translateY(-50%)',
                minWidth: 40
              }}
            >
              <div
                className="gantt-bar-inner"
                style={{
                  background: `linear-gradient(90deg, ${status.color}, ${status.color}dd)`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.2)',
                    width: `${task.progress}%`
                  }}
                />
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {task.progress > 0 && `${task.progress}%`}
                </span>
              </div>
            </div>
          </Tooltip>
        </div>
        <div style={{ width: 80, textAlign: 'center' }}>
          <Tag color={status.color}>{task.progress}%</Tag>
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    const days = [];
    const step = Math.ceil(totalDays / 15);
    for (let i = 0; i < totalDays; i += step) {
      const date = startDate.add(i, 'day');
      days.push(
        <div key={i} style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 11,
          color: '#888',
          borderLeft: '1px solid #f0f0f0'
        }}>
          {date.format('MM/DD')}
        </div>
      );
    }
    return (
      <div className="gantt-row" style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
        <div className="gantt-label" style={{ fontWeight: 500 }}>时间轴</div>
        <div style={{ flex: 1, display: 'flex' }}>
          {days}
        </div>
        <div style={{ width: 80, textAlign: 'center', fontWeight: 500 }}>进度</div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          施工甘特图
        </Title>
        <Space>
          <Select
            style={{ width: 300 }}
            value={selectedProject}
            onChange={setSelectedProject}
            options={projects.map(p => ({ label: p.title, value: p.id }))}
          />
          <Button>导出</Button>
        </Space>
      </div>

      {project && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <div style={{ fontSize: 12, color: '#888' }}>项目名称</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{project.title}</div>
            </Col>
            <Col xs={24} sm={6}>
              <div style={{ fontSize: 12, color: '#888' }}>计划工期</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{project.start_date} ~ {project.end_date}</div>
            </Col>
            <Col xs={24} sm={6}>
              <div style={{ fontSize: 12, color: '#888' }}>总天数</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{totalDays} 天</div>
            </Col>
            <Col xs={24} sm={6}>
              <div style={{ fontSize: 12, color: '#888' }}>总体进度</div>
              <Progress percent={project.progress} size="small" />
            </Col>
          </Row>
        </Card>
      )}

      <Card loading={loading}>
        <div className="gantt-container">
          {renderTimeline()}
          {ganttData.map(renderGanttRow)}
        </div>

        <Divider />

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
          {Object.entries(statusMap).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 16, height: 16, background: val.color, borderRadius: 2 }} />
              <span>{val.text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ErpGantt;
