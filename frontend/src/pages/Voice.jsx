import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Input, Button, List, Tag, message, Select } from 'antd';
import { AudioOutlined, SendOutlined } from '@ant-design/icons';
import { sendVoiceCommand, getVoiceLogs, getUsers } from '../api';

const { TextArea } = Input;
const { Option } = Select;

const intentMap = {
  power_on: '开机',
  power_off: '关机',
  set_mode: '设置模式',
  set_temperature: '调节温度',
  unknown: '未知命令'
};

function Voice() {
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsRes, usersRes] = await Promise.all([
        getVoiceLogs(),
        getUsers()
      ]);
      setLogs(logsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      message.error('数据加载失败');
    }
  };

  const handleSend = async () => {
    if (!command.trim()) {
      message.warning('请输入语音命令');
      return;
    }
    try {
      setLoading(true);
      const res = await sendVoiceCommand(command, selectedUser);
      setResult(res.data);
      setCommand('');
      loadData();
    } catch (error) {
      message.error('命令执行失败');
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    '打开客厅电视',
    '关闭主卧空调',
    '设置制冷模式',
    '调节温度26度',
    '开启离家模式'
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="哈利语音助手" extra={
            <Select
              placeholder="选择用户"
              style={{ width: 150 }}
              value={selectedUser}
              onChange={setSelectedUser}
              allowClear
            >
              {users.map((u) => (
                <Option key={u.id} value={u.id}>{u.name}</Option>
              ))}
            </Select>
          }>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {quickCommands.map((cmd, idx) => (
                  <Tag
                    key={idx}
                    color="blue"
                    style={{ cursor: 'pointer', padding: '4px 12px' }}
                    onClick={() => setCommand(cmd)}
                  >
                    {cmd}
                  </Tag>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <TextArea
                  rows={4}
                  placeholder="请输入语音命令，例如：打开客厅空调..."
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              </div>
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={loading}
                  size="large"
                >
                  发送命令
                </Button>
              </div>
            </div>
            {result && (
              <Card type="inner" title="执行结果" size="small">
                <p><strong>命令:</strong> {result.command}</p>
                <p><strong>意图:</strong> {intentMap[result.intent] || result.intent}</p>
                <p><strong>结果:</strong> {result.result}</p>
              </Card>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="语音指令日志">
            <List
              dataSource={logs}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<AudioOutlined />}
                    title={
                      <span>
                        {item.command}
                        <Tag color={item.success ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                          {item.success ? '成功' : '失败'}
                        </Tag>
                      </span>
                    }
                    description={
                      <span>
                        意图: {intentMap[item.intent] || item.intent} |
                        用户: {item.user_name || '匿名'} |
                        {item.created_at}
                      </span>
                    }
                  />
                </List.Item>
              )}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Voice;
