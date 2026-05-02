import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Divider,
  message,
  Spin,
  Switch,
  Input,
  Tag,
  Space
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { matchApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MatchReport = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const { user } = useAuth();

  const gameModeOptions = [
    { label: '默认模式', value: 'default' },
    { label: '经典模式', value: 'classic' },
    { label: '极速模式', value: 'speed' },
  ];

  const matchTypeOptions = [
    { label: '排位赛', value: 'ranked' },
    { label: '普通赛', value: 'normal' },
    { label: '练习赛', value: 'practice' },
  ];

  const positionOptions = [
    { label: '上单', value: 'top' },
    { label: '打野', value: 'jungle' },
    { label: '中单', value: 'mid' },
    { label: 'ADC', value: 'adc' },
    { label: '辅助', value: 'support' },
  ];

  const teamOptions = [
    { label: '红队', value: 'red' },
    { label: '蓝队', value: 'blue' },
  ];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const playerStats = values.players?.map((p, index) => ({
        user_id: p.user_id,
        team_id: p.team_id,
        position: p.position,
        kills: p.kills || 0,
        deaths: p.deaths || 0,
        assists: p.assists || 0,
        damage_dealt: p.damage_dealt || 0,
        damage_taken: p.damage_taken || 0,
        gold_earned: p.gold_earned || 0,
        win: p.win || false,
        performance_score: calculatePerformanceScore(p),
      })) || [];

      const response = await matchApi.quickReport({
        game_mode: values.game_mode,
        match_type: values.match_type,
        playerStats,
      });

      if (response.data.success) {
        message.success('战绩上报成功！积分正在计算中...');
        form.resetFields();
      }
    } catch (error) {
      message.error(error.response?.data?.error || '上报失败');
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceScore = (player) => {
    const kills = player.kills || 0;
    const deaths = player.deaths || 0;
    const assists = player.assists || 0;
    const damage = player.damage_dealt || 0;
    
    const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
    const damageScore = Math.min(damage / 1000, 100);
    
    return Math.round(kda * 10 + damageScore);
  };

  const generateSampleData = () => {
    const samplePlayers = [
      {
        user_id: 6,
        team_id: 'red',
        position: 'top',
        kills: 8,
        deaths: 3,
        assists: 5,
        damage_dealt: 15000,
        damage_taken: 8000,
        gold_earned: 12000,
        win: true,
      },
      {
        user_id: 7,
        team_id: 'red',
        position: 'jungle',
        kills: 6,
        deaths: 2,
        assists: 12,
        damage_dealt: 12000,
        damage_taken: 15000,
        gold_earned: 10000,
        win: true,
      },
      {
        user_id: 8,
        team_id: 'red',
        position: 'mid',
        kills: 10,
        deaths: 4,
        assists: 8,
        damage_dealt: 18000,
        damage_taken: 7000,
        gold_earned: 15000,
        win: true,
      },
      {
        user_id: 9,
        team_id: 'blue',
        position: 'adc',
        kills: 5,
        deaths: 6,
        assists: 4,
        damage_dealt: 14000,
        damage_taken: 10000,
        gold_earned: 11000,
        win: false,
      },
      {
        user_id: 10,
        team_id: 'blue',
        position: 'support',
        kills: 2,
        deaths: 5,
        assists: 15,
        damage_dealt: 6000,
        damage_taken: 12000,
        gold_earned: 8000,
        win: false,
      },
    ];

    form.setFieldsValue({
      game_mode: 'default',
      match_type: 'ranked',
      players: samplePlayers,
    });

    message.info('已填充示例数据，请检查后提交');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">战绩上报</h1>
        <Button onClick={generateSampleData}>填充示例数据</Button>
      </div>

      <Card className="quick-report-form">
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          initialValues={{
            game_mode: 'default',
            match_type: 'ranked',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="游戏模式"
                name="game_mode"
                rules={[{ required: true, message: '请选择游戏模式' }]}
              >
                <Select options={gameModeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="比赛类型"
                name="match_type"
                rules={[{ required: true, message: '请选择比赛类型' }]}
              >
                <Select options={matchTypeOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>玩家数据</Divider>

          <Form.List name="players">
            {(fields, { add, remove }) => (
              <>
                <div className="player-stat-row player-stat-header">
                  <span>玩家</span>
                  <span>队伍</span>
                  <span>位置</span>
                  <span>击杀</span>
                  <span>死亡</span>
                  <span>助攻</span>
                  <span>胜利</span>
                </div>

                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="player-stat-row" style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'user_id']}
                      rules={[{ required: true, message: '请选择玩家' }]}
                      style={{ margin: 0 }}
                    >
                      <Select placeholder="选择玩家">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((id) => (
                          <Select.Option key={id} value={id}>
                            player{id <= 5 ? id : id - 1} (ID: {id})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'team_id']}
                      rules={[{ required: true, message: '请选择队伍' }]}
                      style={{ margin: 0 }}
                    >
                      <Select placeholder="队伍" options={teamOptions} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'position']}
                      style={{ margin: 0 }}
                    >
                      <Select placeholder="位置" allowClear options={positionOptions} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'kills']}
                      initialValue={0}
                      style={{ margin: 0 }}
                    >
                      <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'deaths']}
                      initialValue={0}
                      style={{ margin: 0 }}
                    >
                      <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'assists']}
                      initialValue={0}
                      style={{ margin: 0 }}
                    >
                      <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
                    </Form.Item>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'win']}
                        valuePropName="checked"
                        initialValue={false}
                        style={{ margin: 0 }}
                      >
                        <Switch 
                          checkedChildren="胜" 
                          unCheckedChildren="负"
                          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>
                        <MinusCircleOutlined />
                      </Button>
                    </div>
                  </div>
                ))}

                <Form.Item style={{ marginTop: 16 }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加玩家
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider>高级数据（可选）</Divider>

          <Form.List name="players">
            {(fields) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Row key={key} gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Form.Item label={`玩家${index + 1} - 造成伤害`} {...restField} name={[name, 'damage_dealt']} initialValue={0}>
                        <InputNumber min={0} addonAfter="点" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label={`玩家${index + 1} - 承受伤害`} {...restField} name={[name, 'damage_taken']} initialValue={0}>
                        <InputNumber min={0} addonAfter="点" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label={`玩家${index + 1} - 获得金币`} {...restField} name={[name, 'gold_earned']} initialValue={0}>
                        <InputNumber min={0} addonAfter="金币" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
              </>
            )}
          </Form.List>

          <Divider />

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              size="large"
              style={{ width: '100%', height: 48, fontSize: 16 }}
            >
              提交战绩报告
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="工作流程说明" style={{ marginTop: 24 }}>
        <ol style={{ lineHeight: 2.5 }}>
          <li><strong>提交报告</strong> → 战绩数据存入数据库</li>
          <li><strong>报告验证</strong> → 自动验证数据完整性</li>
          <li><strong>积分计算</strong> → 规则引擎计算每位玩家积分变动</li>
          <li><strong>排行榜刷新</strong> → 更新全服排行榜数据</li>
          <li><strong>奖励检查</strong> → 检查是否达成奖励条件</li>
        </ol>
      </Card>
    </div>
  );
};

export default MatchReport;
