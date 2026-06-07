import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tabs, Empty, Table, Tag } from 'antd';
import {
  PlayCircleOutlined,
  VideoCameraOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { contentAPI } from '../utils/api';

const { Title } = Typography;

function ContentCenter() {
  const [streams, setStreams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [revenueShares, setRevenueShares] = useState([]);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const [streamRes, videoRes, revenueRes] = await Promise.all([
        contentAPI.getLiveStreams(),
        contentAPI.getShortVideos(),
        contentAPI.getRevenueShares(),
      ]);
      if (streamRes.data.success) setStreams(streamRes.data.streams || []);
      if (videoRes.data.success) setVideos(videoRes.data.videos || []);
      if (revenueRes.data.success) setRevenueShares(revenueRes.data.revenue_shares || []);
    } catch (err) {
      console.error('加载内容失败', err);
    }
  };

  const revenueColumns = [
    {
      title: '内容类型',
      dataIndex: 'content_type',
      key: 'content_type',
      render: (type) => {
        const map = { live_stream: '直播课程', short_video: '短视频' };
        return map[type] || type;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => val != null ? `¥${Number(val).toFixed(2)}` : '-',
    },
    {
      title: '平台服务费',
      dataIndex: 'platform_fee',
      key: 'platform_fee',
      render: (val) => val != null ? `¥${Number(val).toFixed(2)}` : '-',
    },
    {
      title: '律师收入',
      dataIndex: 'lawyer_income',
      key: 'lawyer_income',
      render: (val) => val != null ? `¥${Number(val).toFixed(2)}` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const map = { pending: '待结算', settled: '已结算' };
        const colorMap = { pending: 'processing', settled: 'success' };
        return <Tag color={colorMap[status] || 'default'}>{map[status] || status}</Tag>;
      },
    },
  ];

  const tabItems = [
    {
      key: 'streams',
      label: (<span><VideoCameraOutlined /> 直播课程</span>),
      children: streams.length === 0 ? (
        <Empty description="暂无直播内容" />
      ) : (
        <Row gutter={[24, 24]}>
          {streams.map((stream) => (
            <Col span={8} key={stream.id}>
              <Card
                hoverable
                cover={
                  <div style={{ height: 180, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayCircleOutlined style={{ fontSize: 48, color: '#fff' }} />
                  </div>
                }
              >
                <Card.Meta
                  title={stream.title}
                  description={
                    <div>
                      <div>{stream.lawyer_name || '未知律师'}</div>
                      <div style={{ color: '#999' }}>{stream.viewer_count || 0}人观看</div>
                      {stream.price != null && <div style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{Number(stream.price).toFixed(2)}</div>}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: 'videos',
      label: (<span><PlayCircleOutlined /> 短视频</span>),
      children: videos.length === 0 ? (
        <Empty description="暂无短视频内容" />
      ) : (
        <Row gutter={[24, 24]}>
          {videos.map((video) => (
            <Col span={8} key={video.id}>
              <Card
                hoverable
                cover={
                  <div style={{ height: 180, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayCircleOutlined style={{ fontSize: 48, color: '#fff' }} />
                  </div>
                }
              >
                <Card.Meta
                  title={video.title}
                  description={
                    <div>
                      <div>{video.lawyer_name || '未知律师'}</div>
                      <div style={{ color: '#999' }}>{video.view_count || 0}次播放</div>
                      {video.price != null && <div style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{Number(video.price).toFixed(2)}</div>}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: 'revenue',
      label: (<span><DollarOutlined /> 收入分账</span>),
      children: (
        <Table
          dataSource={revenueShares}
          columns={revenueColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>法律知识中心</Title>
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default ContentCenter;
