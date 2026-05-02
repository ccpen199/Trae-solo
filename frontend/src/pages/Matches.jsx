import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Empty, Select, Space, Modal, Descriptions, Divider } from 'antd';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { matchApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Matches = () => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadMatches();
  }, [user]);

  const loadMatches = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };

      const response = await matchApi.getList(params);
      if (response.data.success) {
        setMatches(response.data.data.matches || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total: response.data.data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('加载比赛记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    setDetailModalVisible(true);
    try {
      const response = await matchApi.getById(id);
      if (response.data.success) {
        setSelectedMatch(response.data.data);
      }
    } catch (error) {
      console.error('加载比赛详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'default', text: '等待开始' },
      in_progress: { color: 'processing', text: '进行中' },
      completed: { color: 'success', text: '已完成' },
      report_pending: { color: 'warning', text: '等待上报' },
      report_received: { color: 'warning', text: '报告已收到' },
      verified: { color: 'processing', text: '已验证' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '比赛ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '比赛类型',
      dataIndex: 'match_type',
      key: 'match_type',
      width: 120,
      render: (type) => (
        <Tag color={type === 'ranked' ? 'blue' : 'green'}>
          {type === 'ranked' ? '排位赛' : '普通赛'}
        </Tag>
      ),
    },
    {
      title: '游戏模式',
      dataIndex: 'game_mode',
      key: 'game_mode',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: '玩家数',
      dataIndex: 'player_count',
      key: 'player_count',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.id)}
        >
          详情
        </Button>
      ),
    },
  ];

  const handleTableChange = (pagination) => {
    loadMatches(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">比赛记录</h1>
        <Button onClick={() => loadMatches(pagination.current, pagination.pageSize)} icon={<ReloadOutlined />}>
          刷新
        </Button>
      </div>

      <Card>
        <Table
          dataSource={matches}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty 
                description="暂无比赛记录" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <p>去战绩上报页面提交一场比赛吧！</p>
              </Empty>
            ),
          }}
        />
      </Card>

      <Modal
        title="比赛详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        loading={detailLoading}
      >
        {selectedMatch && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="比赛ID">{selectedMatch.match?.id}</Descriptions.Item>
              <Descriptions.Item label="比赛类型">
                <Tag color={selectedMatch.match?.match_type === 'ranked' ? 'blue' : 'green'}>
                  {selectedMatch.match?.match_type === 'ranked' ? '排位赛' : '普通赛'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedMatch.match?.status)}
              </Descriptions.Item>
              <Descriptions.Item label="游戏模式">
                {selectedMatch.match?.game_mode}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedMatch.match?.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {selectedMatch.match?.start_time || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>玩家数据</Divider>

            <Table
              dataSource={selectedMatch.playerStats || []}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: '玩家',
                  dataIndex: 'nickname',
                  key: 'nickname',
                  render: (nickname, record) => (
                    <span>
                      <strong>{nickname || record.username}</strong>
                      <br />
                      <span style={{ fontSize: 12, color: '#999' }}>@{record.username}</span>
                    </span>
                  ),
                },
                {
                  title: '队伍',
                  dataIndex: 'team_id',
                  key: 'team_id',
                  render: (team) => (
                    <Tag color={team === 'red' ? 'red' : 'blue'}>
                      {team === 'red' ? '红队' : '蓝队'}
                    </Tag>
                  ),
                },
                {
                  title: '位置',
                  dataIndex: 'position',
                  key: 'position',
                },
                {
                  title: 'K/D/A',
                  key: 'kda',
                  render: (_, record) => (
                    <span style={{ fontWeight: 600 }}>
                      {record.kills}/{record.deaths}/{record.assists}
                    </span>
                  ),
                },
                {
                  title: '结果',
                  dataIndex: 'win',
                  key: 'win',
                  render: (win) => (
                    <Tag color={win ? 'green' : 'red'}>
                      {win ? '胜利' : '失败'}
                    </Tag>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Matches;
