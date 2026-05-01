import React, { useEffect, useState } from 'react';
import { Table, Card, Tabs, Button, Space, message, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { frequencyApi, complianceApi, routingApi } from '../../services/api';

const RuleList: React.FC = () => {
  const [activeTab, setActiveTab] = useState('frequency');
  const [frequencyRules, setFrequencyRules] = useState<any[]>([]);
  const [complianceRules, setComplianceRules] = useState<any[]>([]);
  const [routingRules, setRoutingRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFrequencyRules = async () => {
    setLoading(true);
    try {
      const result = await frequencyApi.getRules();
      setFrequencyRules(result.data.list);
    } catch (error) {
      console.error('获取频控规则失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceRules = async () => {
    setLoading(true);
    try {
      const result = await complianceApi.getRules();
      setComplianceRules(result.data.list);
    } catch (error) {
      console.error('获取合规规则失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutingRules = async () => {
    setLoading(true);
    try {
      const result = await routingApi.getRules();
      setRoutingRules(result.data.list);
    } catch (error) {
      console.error('获取路由规则失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'frequency') {
      fetchFrequencyRules();
    } else if (activeTab === 'compliance') {
      fetchComplianceRules();
    } else if (activeTab === 'routing') {
      fetchRoutingRules();
    }
  }, [activeTab]);

  const frequencyColumns = [
    {
      title: '规则编号',
      dataIndex: 'ruleCode',
      key: 'ruleCode',
    },
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      key: 'targetType',
      render: (type: string) => {
        const map: { [key: string]: string } = {
          phone: '手机号',
          user: '用户',
          ip: 'IP地址',
        };
        return map[type] || type;
      },
    },
    {
      title: '时间窗口',
      dataIndex: 'timeWindow',
      key: 'timeWindow',
      render: (seconds: number) => {
        if (seconds < 60) return `${seconds}秒`;
        if (seconds < 3600) return `${seconds / 60}分钟`;
        if (seconds < 86400) return `${seconds / 3600}小时`;
        return `${seconds / 86400}天`;
      },
    },
    {
      title: '最大次数',
      dataIndex: 'maxCount',
      key: 'maxCount',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'default'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  const complianceColumns = [
    {
      title: '规则编号',
      dataIndex: 'ruleCode',
      key: 'ruleCode',
    },
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
    },
    {
      title: '规则类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: (type: string) => {
        const map: { [key: string]: string } = {
          sensitive_word: '敏感词',
          regex: '正则表达式',
          length: '长度限制',
          blacklist: '黑名单',
        };
        return map[type] || type;
      },
    },
    {
      title: '处理方式',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const map: { [key: string]: string } = {
          block: '拦截',
          warn: '警告',
          replace: '替换',
        };
        return <Tag color={action === 'block' ? 'error' : action === 'warn' ? 'warning' : 'processing'}>
          {map[action] || action}
        </Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'default'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  const routingColumns = [
    {
      title: '规则编号',
      dataIndex: 'ruleCode',
      key: 'ruleCode',
    },
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
    },
    {
      title: '模板类型',
      dataIndex: 'templateType',
      key: 'templateType',
      render: (type: string) => type ? <Tag color="blue">{type}</Tag> : '全部',
    },
    {
      title: '手机号前缀',
      dataIndex: 'phonePrefix',
      key: 'phonePrefix',
      render: (prefix: string) => prefix || '全部',
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'default'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'frequency',
      label: '频控规则',
      children: (
        <Table
          columns={frequencyColumns}
          dataSource={frequencyRules}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      ),
    },
    {
      key: 'compliance',
      label: '合规规则',
      children: (
        <Table
          columns={complianceColumns}
          dataSource={complianceRules}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      ),
    },
    {
      key: 'routing',
      label: '路由规则',
      children: (
        <Table
          columns={routingColumns}
          dataSource={routingRules}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <Card
        title="规则配置"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => {
            if (activeTab === 'frequency') fetchFrequencyRules();
            else if (activeTab === 'compliance') fetchComplianceRules();
            else if (activeTab === 'routing') fetchRoutingRules();
          }}>
            刷新
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
};

export default RuleList;
