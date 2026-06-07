import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Typography, Tag, Space, Button, Modal, message } from 'antd';
import { CheckOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';
import { adminAPI } from '../../utils/api';

const { Title } = Typography;

function AdminAudits() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAudits();
      if (res.data.success) {
        setAudits(res.data.audits);
      }
    } catch (err) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = (id, status) => {
    Modal.confirm({
      title: '确认处理',
      content: status === 'passed' ? '确认该会话合规吗？' : '确认该会话违规吗？',
      onOk: async () => {
        try {
          await adminAPI.processAudit(id, status);
          message.success('处理完成');
          loadAudits();
        } catch (err) {
          message.error('处理失败');
        }
      },
    });
  };

  const parseFlaggedWords = (words) => {
    if (!words) return [];
    try {
      return typeof words === 'string' ? JSON.parse(words) : words;
    } catch {
      return [];
    }
  };

  const wordStats = useMemo(() => {
    const countMap = {};
    audits.forEach((audit) => {
      const words = parseFlaggedWords(audit.flagged_words);
      words.forEach((w) => {
        countMap[w] = (countMap[w] || 0) + 1;
      });
    });
    return Object.entries(countMap)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }, [audits]);

  const riskColorMap = { high: 'red', medium: 'orange', low: 'green' };

  const columns = [
    {
      title: '咨询标题',
      dataIndex: 'consultation_title',
      key: 'consultation_title',
    },
    {
      title: '敏感词',
      dataIndex: 'flagged_words',
      key: 'flagged_words',
      render: (words) => {
        const parsed = parseFlaggedWords(words);
        return parsed.length > 0
          ? parsed.map((w) => <Tag color="red" key={w}>{w}</Tag>)
          : '-';
      },
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level) => <Tag color={riskColorMap[level] || 'default'}>{level}</Tag>,
    },
    {
      title: '审核状态',
      dataIndex: 'audit_status',
      key: 'audit_status',
      render: (status) => {
        const map = { pending: '待处理', passed: '合规', rejected: '违规' };
        const colorMap = { pending: 'processing', passed: 'success', rejected: 'error' };
        return <Tag color={colorMap[status] || 'default'}>{map[status] || status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) =>
        record.audit_status === 'pending' && (
          <Space>
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleProcess(record.id, 'passed')}>
              通过
            </Button>
            <Button danger size="small" icon={<CloseOutlined />} onClick={() => handleProcess(record.id, 'rejected')}>
              拒绝
            </Button>
          </Space>
        ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>会话质检</Title>

      <Card style={{ marginTop: 24 }}>
        <Table dataSource={audits} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Card
        title={<span><WarningOutlined style={{ marginRight: 8 }} />敏感词拦截统计</span>}
        style={{ marginTop: 24 }}
      >
        {wordStats.length === 0 ? (
          <span style={{ color: '#999' }}>暂无敏感词数据</span>
        ) : (
          <Space wrap size={[12, 8]}>
            {wordStats.map((item) => (
              <Tag key={item.word} color="volcano">
                {item.word} <span style={{ fontWeight: 'bold' }}>×{item.count}</span>
              </Tag>
            ))}
          </Space>
        )}
      </Card>
    </div>
  );
}

export default AdminAudits;
