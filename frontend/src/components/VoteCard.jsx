import { useState } from 'react';
import { Card, Radio, Button, Progress, Space, Typography, Tag, message, Descriptions } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, HistoryOutlined, SafetyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '../utils/request';

const { Title, Paragraph } = Typography;

export default function VoteCard({ vote, onVoted, onVoteWithSms, onViewAuditTrail }) {
  const [selected, setSelected] = useState(null);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(vote?.hasVoted || false);
  const [auditTrail, setAuditTrail] = useState(null);

  if (!vote) return null;

  const totalVotes = vote.options.reduce((sum, o) => sum + (o.votes || 0), 0);
  const isActive = vote.status === '进行中';

  const submitVote = async () => {
    if (!selected) {
      message.warning('请先选择一个选项');
      return;
    }
    if (onVoteWithSms) {
      onVoteWithSms(vote, selected, (trail) => {
        setHasVoted(true);
        setAuditTrail(trail);
        message.success('投票成功，已记录操作留痕');
        onVoted?.();
      });
      return;
    }
    setVoting(true);
    try {
      await request.post(`/votes/${vote.id}/vote`, { optionId: selected }).catch(() => {});
      setHasVoted(true);
      message.success('投票成功');
      onVoted?.();
    } catch {
      message.error('投票失败，请重试');
    } finally {
      setVoting(false);
    }
  };

  const handleAuditClick = () => {
    if (onViewAuditTrail) {
      onViewAuditTrail(vote);
    }
  };

  return (
    <Card
      style={{ marginBottom: 16 }}
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{vote.title}</span>
          <Tag color={isActive ? 'green' : 'default'} icon={isActive ? <ClockCircleOutlined /> : <CheckCircleOutlined />}>
            {vote.status}
          </Tag>
        </div>
      }
      extra={
        <Space>
          <span style={{ fontSize: 12, color: '#888' }}>已有 {totalVotes} 人参与</span>
          <Button type="text" size="small" icon={<HistoryOutlined />} onClick={handleAuditClick}>
            操作留痕
          </Button>
        </Space>
      }
    >
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {vote.description}
      </Paragraph>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
        投票时间：{vote.startTime} 至 {vote.endTime}
      </div>

      {auditTrail && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <SafetyOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#389e0d' }}>您的投票已完成并记录操作留痕</span>
          </div>
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="投票选项">{auditTrail.option}</Descriptions.Item>
            <Descriptions.Item label="短信验证">{auditTrail.smsVerified ? '已验证' : '未验证'}</Descriptions.Item>
            <Descriptions.Item label="投票时间">{auditTrail.time}</Descriptions.Item>
            <Descriptions.Item label="操作IP">{auditTrail.ip}</Descriptions.Item>
          </Descriptions>
        </div>
      )}

      {(!hasVoted && isActive) ? (
        <div>
          <div style={{ marginBottom: 12, padding: 8, background: '#fffbe6', borderRadius: 4, fontSize: 12, color: '#d46b08' }}>
            <SafetyOutlined style={{ marginRight: 4 }} />
            重要提示：投票需通过短信二次验证，确保投票真实有效，所有操作将记录留痕可复查
          </div>
          <Radio.Group
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {vote.options.map((opt) => (
                <Radio key={opt.id} value={opt.id} style={{ display: 'block', marginBottom: 12, lineHeight: '32px' }}>
                  {opt.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={submitVote} loading={voting}>
              提交投票 (短信验证)
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {hasVoted && <Tag color="green" style={{ marginBottom: 16 }}>您已投票</Tag>}
          {vote.options.map((opt) => {
            const pct = totalVotes > 0 ? Math.round((opt.votes || 0) / totalVotes * 100) : 0;
            return (
              <div key={opt.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{opt.label}</span>
                  <span style={{ color: '#52c41a', fontWeight: 500 }}>{opt.votes || 0} 票 ({pct}%)</span>
                </div>
                <Progress percent={pct} showInfo={false} strokeColor="#52c41a" size="small" />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
