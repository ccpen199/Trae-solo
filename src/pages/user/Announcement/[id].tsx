import React, { useEffect, useState } from 'react';
import { Card, Breadcrumb, Tag, Alert, Spin, Button, Descriptions, Timeline, Row, Col, Statistic, Progress, Divider, Space } from 'antd';
import {
  HomeOutlined, LeftOutlined, PushpinOutlined, EnvironmentOutlined, ClockCircleOutlined,
  SendOutlined, CheckCircleOutlined, SafetyCertificateOutlined, TeamOutlined,
  ThunderboltOutlined, FieldTimeOutlined, AuditOutlined, NotificationOutlined,
  UserOutlined, PhoneOutlined, SolutionOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { announcementApi } from '@/services/announcement';
import { formatDateTime, serviceTypeMap } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { Announcement } from '@/types';

const pushStatusMap: Record<number, { text: string; color: string; icon: React.ReactNode }> = {
  0: { text: '未推送', color: 'default', icon: <SendOutlined /> },
  1: { text: '已推送', color: 'green', icon: <CheckCircleOutlined /> },
  2: { text: '紧急推送', color: 'red', icon: <PushpinOutlined /> },
};

const typeColorMap: Record<string, string> = {
  outage: '#FF7D00',
  repair: '#F53F3F',
  notice: '#165DFF',
};

const repairStageColorMap: Record<string, string> = {
  接报: 'blue', 派单: 'blue', 故障告警: 'red', 用户报障: 'blue', 巡检发现: 'red',
  现场警戒: 'orange', 关阀控险: 'orange', 关阀排水: 'cyan', 到场: 'cyan',
  应急保障: 'cyan', 故障定位: 'cyan', 精准定位: 'cyan', 应急联动: 'blue',
  开挖作业: 'gold', 开挖换管: 'gold', 管道修复: 'gold', 电缆中间头制作: 'gold',
  电熔焊接: 'gold',
  打压试验: 'green', 耐压试验: 'green', 严密性试验: 'green', 回填恢复: 'green',
  恢复供水: 'green', 恢复送电: 'green', 置换通气: 'green', 复查确认: 'green',
  现场恢复: 'green', 处置: 'gold', 恢复: 'green',
};

const AnnouncementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Announcement | null>(null);

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res: any = await announcementApi.getAnnouncementDetail(Number(id));
      setDetail(res);
    } catch (error) {
      console.error('加载公告详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  if (!detail) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  const announcementDetail = detail as any;
  const isEmergency = detail.type === 'repair';
  const repairProgress: any[] = announcementDetail.repairProgress || [];

  const getRepairCurrentStage = () => {
    if (!repairProgress.length) return { index: 0, percent: 0, stage: '待启动' };
    const greenStages = repairProgress.filter(p =>
      (p.color || repairStageColorMap[p.stage] || 'blue') === 'green'
    ).length;
    const percent = Math.round((greenStages / repairProgress.length) * 100);
    const lastStage = repairProgress[repairProgress.length - 1];
    return {
      index: repairProgress.length - 1,
      percent,
      stage: lastStage.stage,
    };
  };

  const repairStageInfo = getRepairCurrentStage();

  return (
    <div className="space-y-6">
      {isEmergency && (
        <Alert
          message="🚨 紧急抢修公告"
          description="此公告为紧急抢修公告，已通过短信、APP推送、微信公众号等多渠道通知受影响用户，请密切关注最新动态。如有紧急情况请拨打24小时热线 962960。"
          type="error"
          showIcon
          banner
          icon={<ThunderboltOutlined />}
        />
      )}

      <Card className="shadow-md">
        <div className="flex items-center justify-between mb-6">
          <Breadcrumb items={[
            { title: <><HomeOutlined /> <span onClick={() => navigate('/')} className="cursor-pointer hover:text-primary-500">首页</span></> },
            { title: <span onClick={() => navigate('/announcements')} className="cursor-pointer hover:text-primary-500">公告列表</span> },
            { title: '公告详情' },
          ]} />
          <Button icon={<LeftOutlined />} onClick={() => navigate('/announcements')}>
            返回列表
          </Button>
        </div>

        <Spin spinning={loading}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <StatusTag type="announcementType" status={detail.type} />
              {detail.serviceType !== 'all' && (
                <Tag color={serviceTypeMap[detail.serviceType]?.color}>
                  {serviceTypeMap[detail.serviceType]?.name}
                </Tag>
              )}
              {announcementDetail.pushStatus !== undefined && (
                <Tag color={pushStatusMap[announcementDetail.pushStatus]?.color} icon={pushStatusMap[announcementDetail.pushStatus]?.icon}>
                  {pushStatusMap[announcementDetail.pushStatus]?.text}
                </Tag>
              )}
              {isEmergency && repairProgress.length > 0 && (
                <Tag color={repairStageInfo.percent === 100 ? 'green' : 'processing'}>
                  抢修进度：{repairStageInfo.percent}% · 当前阶段：{repairStageInfo.stage}
                </Tag>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">{detail.title}</h1>
            <p className="text-gray-500 mb-6 text-sm">{detail.summary}</p>

            {isEmergency && repairProgress.length > 0 && (
              <Card
                type="inner"
                className="mb-6 border-l-4"
                style={{ borderLeftColor: '#F53F3F', background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)' }}
                title={
                  <Space>
                    <ThunderboltOutlined style={{ color: '#F53F3F' }} />
                    <span className="font-semibold">抢修关键指标</span>
                  </Space>
                }
                extra={
                  <Tag color="geekblue" icon={<FieldTimeOutlined />}>
                    实时更新 · {repairProgress.length}个处理节点
                  </Tag>
                }
              >
                <Row gutter={[16, 16]} className="mb-4">
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={<span className="text-gray-600 text-xs"><EnvironmentOutlined /> 影响区域</span>}
                      value={(detail.affectAreaNames || []).length}
                      suffix="个行政区"
                      valueStyle={{ fontSize: 18, color: '#165DFF' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={<span className="text-gray-600 text-xs"><TeamOutlined /> 抢修力量</span>}
                      value={repairProgress.filter(p => p.operator && p.operator.includes('班')).length + 2}
                      suffix="支队伍"
                      valueStyle={{ fontSize: 18, color: '#FF7D00' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title={<span className="text-gray-600 text-xs"><SafetyCertificateOutlined /> 当前阶段</span>}
                      value={repairStageInfo.stage}
                      valueStyle={{ fontSize: 16, color: repairStageInfo.percent === 100 ? '#00B42A' : '#F53F3F' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1"><FieldTimeOutlined /> 整体抢修进度</div>
                      <Progress
                        percent={repairStageInfo.percent}
                        size="small"
                        status={repairStageInfo.percent === 100 ? 'success' : 'active'}
                        strokeColor={{ '0%': '#F53F3F', '100%': '#00B42A' }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            )}

            <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} className="mb-6">
              <Descriptions.Item label="发布时间">
                <ClockCircleOutlined className="mr-1" />
                {formatDateTime(detail.publishTime || detail.createTime, 'YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="发布人">
                <UserOutlined className="mr-1" />
                {detail.creatorName}
              </Descriptions.Item>
              <Descriptions.Item label="服务类型">
                {detail.serviceType === 'all' ? '综合服务' : serviceTypeMap[detail.serviceType]?.name}
              </Descriptions.Item>
              <Descriptions.Item label="影响区域" span={2}>
                <EnvironmentOutlined className="mr-1" />
                {(detail.affectAreaNames || []).map((area, index) => (
                  <Tag key={index} color="blue" className="mb-1">{area}</Tag>
                ))}
              </Descriptions.Item>
              {announcementDetail.pushTime && (
                <Descriptions.Item label="推送时间">
                  <NotificationOutlined className="mr-1" />
                  {formatDateTime(announcementDetail.pushTime, 'YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="咨询热线" span={2}>
                <PhoneOutlined className="mr-1 text-red-500" />
                <span className="text-red-500 font-semibold text-lg">962960</span>
                <span className="ml-2 text-gray-500 text-xs">（24小时人工值守）</span>
              </Descriptions.Item>
            </Descriptions>

            <div
              className="prose max-w-none mb-8 p-6 bg-white rounded-xl border border-gray-100"
              dangerouslySetInnerHTML={{ __html: detail.content }}
              style={{ lineHeight: '1.9', color: '#333' }}
            />

            {isEmergency && repairProgress.length > 0 && (
              <div className="mb-8">
                <Divider orientation="left" orientationMargin={0}>
                  <Space>
                    <FieldTimeOutlined style={{ color: '#F53F3F', fontSize: 16 }} />
                    <span className="font-semibold text-base">抢修处理进展时间线</span>
                    <Tag color="red" className="ml-2">共 {repairProgress.length} 个节点</Tag>
                  </Space>
                </Divider>
                <Card
                  className="shadow-sm"
                  style={{
                    background: 'linear-gradient(180deg, #fafcff 0%, #ffffff 40%)',
                    border: '1px solid #e8eef7',
                  }}
                  bodyStyle={{ padding: '28px 24px 12px' }}
                >
                  <Timeline
                    mode="left"
                    style={{ fontSize: 13 }}
                    items={repairProgress.map((p, idx) => {
                      const dotColor = p.color || repairStageColorMap[p.stage] || 'blue';
                      const isLast = idx === repairProgress.length - 1;
                      return {
                        color: dotColor,
                        dot: isLast ? (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center -ml-1 -mt-1 animate-pulse"
                            style={{
                              backgroundColor: dotColor === 'green' ? '#00B42A' : '#F53F3F',
                              boxShadow: `0 0 0 4px ${dotColor === 'green' ? 'rgba(0,180,42,0.15)' : 'rgba(245,63,63,0.15)'}`,
                            }}
                          >
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        ) : undefined,
                        children: (
                          <div className={`pl-2 pb-5 ${isLast ? '' : ''}`}>
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                              <Space>
                                <Tag
                                  color={dotColor}
                                  style={{ fontWeight: 600, margin: 0, fontSize: 12 }}
                                >
                                  第{idx + 1}步 · {p.stage}
                                </Tag>
                                {isLast && (
                                  <Tag color="processing" style={{ margin: 0 }}>
                                    {dotColor === 'green' ? '✓ 已完成' : '⏱ 进行中'}
                                  </Tag>
                                )}
                              </Space>
                              <span className="text-xs text-gray-500">
                                <ClockCircleOutlined className="mr-1" />
                                {formatDateTime(p.time, 'YYYY-MM-DD HH:mm')}
                              </span>
                            </div>
                            <div className="text-gray-700 text-sm leading-6 mb-1 pl-1">
                              {p.desc}
                            </div>
                            {p.operator && (
                              <div className="text-xs text-gray-400 pl-1 flex items-center gap-1">
                                <SolutionOutlined />
                                <span>责任方：</span>
                                <span className="text-gray-500">{p.operator}</span>
                              </div>
                            )}
                          </div>
                        ),
                        label: (
                          <div className="text-right pr-3 pt-1">
                            <div className="font-mono text-sm font-semibold" style={{ color: dotColor === 'green' ? '#00B42A' : dotColor === 'red' ? '#F53F3F' : '#165DFF' }}>
                              {formatDateTime(p.time, 'HH:mm')}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatDateTime(p.time, 'MM-DD')}
                            </div>
                          </div>
                        ),
                      };
                    })}
                  />
                </Card>
              </div>
            )}

            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AuditOutlined style={{ color: '#165DFF' }} />
                公告审核与发布链路
              </h3>
              <Timeline
                items={[
                  {
                    color: 'blue',
                    children: (
                      <div>
                        <div className="text-sm font-medium">创建公告</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatDateTime(detail.createTime, 'YYYY-MM-DD HH:mm')} by {detail.creatorName}
                        </div>
                      </div>
                    ),
                  },
                  ...(detail.status >= 1 ? [{
                    color: 'blue',
                    children: (
                      <div>
                        <div className="text-sm font-medium">提交审核</div>
                        <div className="text-xs text-gray-500 mt-0.5">创建人提交至运营主管审批</div>
                      </div>
                    ),
                  }] : []),
                  ...(detail.status >= 2 ? [{
                    color: 'green',
                    children: (
                      <div>
                        <div className="text-sm font-medium">✓ 审核通过</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          运营主管审核通过，内容合规准予发布
                        </div>
                      </div>
                    ),
                  }] : []),
                  ...(detail.status >= 2 && announcementDetail.publishTime ? [{
                    color: 'green',
                    children: (
                      <div>
                        <div className="text-sm font-medium">✓ 正式发布</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatDateTime(announcementDetail.publishTime, 'YYYY-MM-DD HH:mm')} · 官网&APP同步上线
                        </div>
                      </div>
                    ),
                  }] : []),
                  ...(announcementDetail.pushStatus === 1 || announcementDetail.pushStatus === 2 ? [{
                    color: announcementDetail.pushStatus === 2 ? 'red' : 'blue',
                    dot: announcementDetail.pushStatus === 2 ? <PushpinOutlined /> : undefined,
                    children: (
                      <div>
                        <div className="text-sm font-medium">
                          {announcementDetail.pushStatus === 2 ? '🚨 紧急推送' : '📢 常规推送'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {announcementDetail.pushStatus === 2
                            ? `多渠道紧急推送（短信+APP+微信） · ${formatDateTime(announcementDetail.pushTime, 'YYYY-MM-DD HH:mm')}`
                            : `APP消息推送 · ${formatDateTime(announcementDetail.pushTime, 'YYYY-MM-DD HH:mm')}`
                          }
                        </div>
                      </div>
                    ),
                  }] : []),
                  ...(detail.status === 3 ? [{
                    color: 'red',
                    children: (
                      <div>
                        <div className="text-sm font-medium">审核驳回</div>
                        <div className="text-xs text-gray-500 mt-0.5">内容需修改后重新提交审核</div>
                      </div>
                    ),
                  }] : []),
                  ...(detail.status === 4 ? [{
                    color: 'default',
                    children: (
                      <div>
                        <div className="text-sm font-medium">已下架</div>
                        <div className="text-xs text-gray-500 mt-0.5">公告已从前端展示渠道移除</div>
                      </div>
                    ),
                  }] : []),
                ]}
              />
            </div>

            <Alert
              message="温馨提示"
              description={
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1.5">
                  <li>请提前做好相关准备，合理安排生活用水、用电、用气</li>
                  <li>如有疑问或紧急情况，请拨打24小时服务热线：
                    <span className="text-red-500 font-semibold ml-1">962960</span>
                  </li>
                  <li>恢复供应时间可能因天气或施工原因有所调整，请留意最新通知</li>
                  <li>请关闭家中阀门，避免恢复供应时造成财产损失</li>
                  {isEmergency && (
                    <li className="text-red-600">
                      <strong>紧急提示：</strong>抢修期间如需应急供水/供电/供气，请联系社区居委会或就近服务网点
                    </li>
                  )}
                </ul>
              }
              type="info"
              showIcon
              icon={<SafetyCertificateOutlined />}
            />
          </div>
        </Spin>
      </Card>
    </div>
  );
};

export default AnnouncementDetail;
