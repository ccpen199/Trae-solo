import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Spin, Result, Typography, Space, Tag, Statistic } from 'antd';
import {
  SafetyOutlined, EyeOutlined, VideoCameraOutlined,
  ClockCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import { streamApi } from '@/services/api';
import VideoPlayer from '@/components/VideoPlayer';
import { formatTime, getPermissionText } from '@/utils/format';
import { StreamSession } from '@/types';

const { Title, Paragraph, Text } = Typography;
const { Countdown } = Statistic;

const TemporaryView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tempToken = searchParams.get('temp_token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState<StreamSession | null>(null);
  const [expireAt, setExpireAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!tempToken) {
      setError('缺少访问令牌参数');
      setLoading(false);
      return;
    }
    loadStream();
  }, [tempToken]);

  const loadStream = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await streamApi.getTemporaryStream(tempToken!);
      setSession(res);
      if (res.expireAt) {
        setExpireAt(new Date(res.expireAt));
      }
    } catch (e: any) {
      setError(e?.message || '临时链接无效或已过期');
    } finally {
      setLoading(false);
    }
  };

  if (!tempToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f0f2f5' }}>
        <Result
          status="warning"
          title="无效的访问链接"
          subTitle="请检查链接是否完整，或联系分享人重新生成"
          extra={
            <Button type="primary" onClick={() => navigate('/login')}>前往登录</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <Space size="middle">
            <SafetyOutlined className="text-4xl text-white" />
            <Title level={2} style={{ color: '#fff', margin: 0 }}>临时访问页面</Title>
          </Space>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)' }} className="!mt-2">
            通过该链接您可以临时查看被分享的监控画面，权限由分享人决定
          </Paragraph>
        </div>

        <Card className="!rounded-2xl !shadow-2xl">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Spin size="large" tip="正在验证访问权限..." />
            </div>
          ) : error ? (
            <Result
              status="warning"
              icon={<WarningOutlined />}
              title="无法访问"
              subTitle={error}
              extra={
                <Space direction="vertical" className="w-full">
                  <Alert
                    type="warning"
                    showIcon
                    message="常见原因："
                    description={
                      <ul className="list-disc ml-5 text-sm mt-1 space-y-0.5">
                        <li>链接已超过分享有效期</li>
                        <li>分享人已主动撤销该分享</li>
                        <li>链接被复制时不完整</li>
                      </ul>
                    }
                    className="!mb-4"
                  />
                  <Button type="primary" onClick={() => navigate('/login')}>
                    登录我的账号
                  </Button>
                </Space>
              }
            />
          ) : session ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <VideoCameraOutlined className="text-2xl text-blue-500" />
                    <Title level={3} style={{ margin: 0 }}>{session.device?.name || '监控设备'}</Title>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Tag icon={<EyeOutlined />} color="blue">
                      权限：{getPermissionText(session.permission)}
                    </Tag>
                    {expireAt && (
                      <Tag icon={<ClockCircleOutlined />} color="orange">
                        有效期至：{formatTime(expireAt.toISOString())}
                      </Tag>
                    )}
                    <Tag color="purple">
                      编码：{session.device?.videoCodec || 'H.264'} / {session.device?.audioCodec || 'G.711A'}
                    </Tag>
                    {session.device?.resolution && <Tag color="cyan">{session.device?.resolution}</Tag>}
                  </div>
                </div>
                {expireAt && (
                  <div className="text-right">
                    <Text type="secondary" className="text-xs block">链接剩余有效时间</Text>
                    <Countdown
                      value={expireAt.getTime()}
                      format="HH:mm:ss"
                      onFinish={() => {
                        setError('临时链接已过期');
                        setSession(null);
                      }}
                    />
                  </div>
                )}
              </div>

              <Alert
                type="info"
                showIcon
                message="使用须知"
                description={
                  <ul className="list-disc ml-5 text-sm space-y-0.5">
                    <li>本页面为临时访问，请勿将链接分享给他人</li>
                    <li>画面延迟取决于网络状况，一般在 1-3 秒</li>
                    <li>{session.permission === 'view'
                      ? '当前为「只看」权限，仅可预览画面'
                      : session.permission === 'talk'
                        ? '当前为「可对讲」权限，可预览并使用语音（按住说话按钮）'
                        : '当前为「可配置」权限，可预览并操作云台'
                    }</li>
                  </ul>
                }
                className="!mb-4"
              />

              <div style={{ aspectRatio: '16/9' }}>
                <VideoPlayer
                  wsUrl={session.wsUrl}
                  permission={session.permission}
                  deviceName={session.device?.name}
                  height="100%"
                />
              </div>

              <div className="text-center pt-2 text-sm text-gray-500">
                已有账号？<a onClick={() => navigate('/login')} className="text-blue-600 cursor-pointer">立即登录</a>，体验更多功能
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default TemporaryView;
