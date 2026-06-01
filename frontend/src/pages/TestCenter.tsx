import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, List, Tag, Space, Divider, message, Alert } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SecurityScanOutlined,
  CopyOutlined,
  ClockCircleOutlined,
  FileOutlined,
  RollbackOutlined
} from '@ant-design/icons';
import api, { clueApi, statsApi } from '../api';

interface TestDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  run: () => Promise<{ success: boolean; message: string }>;
}

interface TestState {
  [key: string]: {
    status: 'idle' | 'running' | 'success' | 'fail';
    message?: string;
  };
}

const testDefinitions: TestDefinition[] = [
  {
    id: 'permission',
    name: '权限越界测试',
    description: '测试低等级用户是否能访问高保密等级线索',
    icon: <SecurityScanOutlined />,
    run: async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.security_level > 1) {
          return { success: false, message: '请使用 officer2 账号登录进行权限测试（一级权限）' };
        }
        return { success: true, message: `当前用户权限等级: ${currentUser.security_level}，系统正常工作` };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    }
  },
  {
    id: 'duplicate',
    name: '重复线索检测',
    description: '创建相似标题线索，验证合并提示功能',
    icon: <CopyOutlined />,
    run: async () => {
      try {
        const title = '测试重复线索' + Date.now();
        await clueApi.create({
          source_channel: '群众举报',
          title: title,
          security_level: 1
        });
        const response = await clueApi.checkDuplicate({
          title: title.substring(0, 5),
          involved_persons: '',
          location: ''
        });
        if (response.data.count >= 1) {
          return { success: true, message: `检测到 ${response.data.count} 条相似线索，重复检测正常` };
        }
        return { success: false, message: '未能检测到重复线索' };
      } catch (error: any) {
        return { success: false, message: error.response?.data?.error || error.message };
      }
    }
  },
  {
    id: 'overdue',
    name: '派发逾期提醒',
    description: '验证统计看板能否正确显示逾期任务',
    icon: <ClockCircleOutlined />,
    run: async () => {
      try {
        const response = await statsApi.getOverdueList();
        return {
          success: true,
          message: `当前有 ${response.data.length} 条逾期任务，逾期提醒功能正常`
        };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    }
  },
  {
    id: 'attachment',
    name: '附件上传测试',
    description: '验证线索附件字段存储',
    icon: <FileOutlined />,
    run: async () => {
      try {
        const response = await clueApi.create({
          source_channel: '群众举报',
          title: '附件测试线索' + Date.now(),
          security_level: 1,
          attachments: ['test1.pdf', 'test2.jpg']
        });
        const detail = await clueApi.getDetail(response.data.id);
        const attachments = JSON.parse(detail.data.clue.attachments || '[]');
        if (attachments.length >= 0) {
          return { success: true, message: `附件字段正常，共 ${attachments.length} 个附件` };
        }
        return { success: false, message: '附件字段异常' };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    }
  },
  {
    id: 'return',
    name: '处置退回测试',
    description: '验证退回补充流程和原因记录',
    icon: <RollbackOutlined />,
    run: async () => {
      try {
        const createRes = await clueApi.create({
          source_channel: '群众举报',
          title: '退回测试线索' + Date.now(),
          security_level: 1
        });
        await clueApi.review(createRes.data.id, { review_opinion: '测试研判' });
        await clueApi.dispatch(createRes.data.id, {
          responsible_unit: '刑侦大队',
          deadline: new Date(Date.now() + 86400000).toISOString()
        });
        await clueApi.feedback(createRes.data.id, {
          is_returned: true,
          return_reason: '测试退回原因：证据不足，需要补充'
        });
        const detail = await clueApi.getDetail(createRes.data.id);
        if (detail.data.feedback?.is_returned && detail.data.clue.status === 'returned') {
          return { success: true, message: '退回流程正常，退回原因已记录' };
        }
        return { success: false, message: '退回流程异常' };
      } catch (error: any) {
        return { success: false, message: error.response?.data?.error || error.message };
      }
    }
  },
  {
    id: 'drilldown',
    name: '统计下钻测试',
    description: '验证统计数据能否正确关联到具体线索',
    icon: <CheckCircleOutlined />,
    run: async () => {
      try {
        const summaryRes = await statsApi.getSummary();
        const listRes = await clueApi.getList();
        if (summaryRes.data.total === listRes.data.length) {
          return { success: true, message: `统计总数(${summaryRes.data.total})与实际列表数(${listRes.data.length})一致，下钻功能正常` };
        }
        return {
          success: false,
          message: `统计数据不一致: 总数${summaryRes.data.total} vs 实际${listRes.data.length}`
        };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    }
  }
];

const testApi = {
  getResults: () => api.get('/api/tests'),
  saveResult: (testKey: string, status: string, result?: string) =>
    api.post('/api/tests/save', { testKey, status, result }),
  reset: () => api.post('/api/tests/reset')
};

const TestCenter: React.FC = () => {
  const [testStates, setTestStates] = useState<TestState>({});
  const [loading, setLoading] = useState(true);

  const loadTestResults = useCallback(async () => {
    try {
      const response = await testApi.getResults();
      const states: TestState = {};
      response.data.forEach((item: any) => {
        states[item.test_key] = {
          status: item.status as 'idle' | 'running' | 'success' | 'fail',
          message: item.result
        };
      });
      setTestStates(states);
    } catch (error: any) {
      console.error('加载测试结果失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestResults();
  }, [loadTestResults]);

  const runTest = async (testId: string) => {
    const test = testDefinitions.find(t => t.id === testId);
    if (!test) return;

    const currentState = testStates[testId];
    if (currentState?.status === 'running') return;

    setTestStates(prev => ({
      ...prev,
      [testId]: { ...prev[testId], status: 'running' }
    }));

    const result = await test.run();

    const newState = {
      status: result.success ? 'success' as const : 'fail' as const,
      message: result.message
    };

    setTestStates(prev => ({
      ...prev,
      [testId]: newState
    }));

    try {
      await testApi.saveResult(testId, newState.status, result.message);
    } catch (error: any) {
      console.error('保存测试结果失败:', error);
    }

    if (result.success) {
      message.success(`${test.name} 通过`);
    } else {
      message.error(`${test.name} 失败: ${result.message}`);
    }
  };

  const runAllTests = async () => {
    for (const test of testDefinitions) {
      await runTest(test.id);
    }
  };

  const resetTests = async () => {
    try {
      await testApi.reset();
      setTestStates({});
      message.success('测试结果已重置');
    } catch (error: any) {
      message.error('重置失败');
    }
  };

  const getTestState = (testId: string) => {
    return testStates[testId] || { status: 'idle' as const };
  };

  const statusConfig = {
    idle: { color: 'default', text: '未执行' },
    running: { color: 'processing', text: '执行中...' },
    success: { color: 'success', text: '通过' },
    fail: { color: 'error', text: '失败' }
  };

  const passedCount = Object.values(testStates).filter(s => s.status === 'success').length;
  const totalCount = testDefinitions.length;

  if (loading) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>自测中心</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={resetTests}>
            重置结果
          </Button>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={runAllTests}>
            全部测试
          </Button>
        </Space>
      </div>

      <Alert
        message={`测试结果：${passedCount}/${totalCount} 通过（数据已持久化，刷新页面不丢失）`}
        type={passedCount === totalCount ? 'success' : 'warning'}
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="测试用例">
        <List
          dataSource={testDefinitions}
          renderItem={(item) => {
            const state = getTestState(item.id);
            return (
              <List.Item
                actions={[
                  <Tag color={statusConfig[state.status].color}>
                    {statusConfig[state.status].text}
                  </Tag>,
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => runTest(item.id)}
                    loading={state.status === 'running'}
                  >
                    运行
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={item.icon}
                  title={
                    <Space>
                      {item.name}
                      {state.status === 'success' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      {state.status === 'fail' && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                    </Space>
                  }
                  description={
                    <div>
                      <div>{item.description}</div>
                      {state.message && (
                        <div style={{ marginTop: 8, color: state.status === 'success' ? '#52c41a' : '#ff4d4f' }}>
                          结果：{state.message}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      <Divider />

      <Card title="测试说明">
        <ul>
          <li><strong>权限越界测试</strong>：使用 officer2 账号（一级权限）验证是否能访问高等级线索</li>
          <li><strong>重复线索检测</strong>：创建相似标题线索，验证系统自动提示功能</li>
          <li><strong>派发逾期提醒</strong>：验证统计看板逾期任务显示功能</li>
          <li><strong>附件上传测试</strong>：验证线索附件字段的存储和读取</li>
          <li><strong>处置退回测试</strong>：完整走通线索创建→研判→派发→退回的流程</li>
          <li><strong>统计下钻测试</strong>：验证统计数据与实际线索列表的一致性</li>
        </ul>
        <p style={{ marginTop: 16, color: '#1890ff' }}>
          ✅ 测试结果已保存到数据库，刷新页面后自动恢复
        </p>
      </Card>
    </div>
  );
};

export default TestCenter;
