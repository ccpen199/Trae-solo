import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Result,
  Row,
  Space,
  Tag,
  Tooltip,
  message,
} from 'antd';
import type { EChartsOption } from 'echarts';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CopyOutlined,
  UserOutlined,
  IdcardOutlined,
  FileTextOutlined,
  BankOutlined,
  HomeOutlined,
  SafetyOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CameraOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/common/StatusBadge';
import type { LandlordApplication, LandlordApplicationStatus } from '@/types';

/** 审核操作类型 */
type AuditAction = 'approve' | 'reject';

/** 产权核验指标项 */
interface PropertyMetricItem {
  key: string;
  label: string;
  passed: boolean;
  icon: React.ReactNode;
}

/** 活体检测指标项 */
interface LivenessMetricItem {
  key: string;
  label: string;
  passed: boolean;
  desc: string;
}

/**
 * 身份证照片占位卡片
 * 用于模拟无图场景的占位展示
 */
function IdCardPlaceholder({
  side,
  label,
}: {
  side: 'front' | 'back';
  label: string;
}) {
  return (
    <div
      style={{
        aspectRatio: '8 / 5',
        background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
        borderRadius: 12,
        border: '1px dashed #D1D5DB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9CA3AF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 20,
          right: 20,
          height: 6,
          background: '#D1D5DB',
          borderRadius: 3,
          opacity: 0.5,
        }}
      />
      <IdcardOutlined style={{ fontSize: 56, opacity: 0.5, marginBottom: 12 }} />
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        {side === 'front' ? '含头像、姓名、证件号等' : '含国徽、签发机关、有效期等'}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 20,
          right: 20,
          height: 6,
          background: '#D1D5DB',
          borderRadius: 3,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

/**
 * 证件材料卡片外壳
 */
function MaterialCard({
  title,
  icon,
  children,
  extra,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <Card
      style={{
        borderRadius: 12,
        border: '1px solid #EEF0F2',
      }}
      styles={{ body: { padding: 16 } }}
      title={
        <Space>
          <span
            style={{
              color: '#0F4C81',
              fontSize: 16,
            }}
          >
            {icon}
          </span>
          <span style={{ fontWeight: 600, color: '#1A1A2E' }}>{title}</span>
        </Space>
      }
      extra={extra}
    >
      {children}
    </Card>
  );
}

/** 产权核验指标展示横排组件 */
function PropertyMetricRow({ items }: { items: PropertyMetricItem[] }) {
  return (
    <Row gutter={[12, 12]}>
      {items.map((item) => (
        <Col xs={12} sm={12} md={12} lg={6} key={item.key}>
          <div
            style={{
              background: item.passed ? '#F0FBF6' : '#FEF1F2',
              borderRadius: 10,
              padding: '14px 12px',
              border: `1px solid ${item.passed ? '#C6EDDB' : '#FBCBD0'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: item.passed ? '#00A86B' : '#E63946',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {item.passed ? <CheckCircleFilled /> : <CloseCircleFilled />}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 12,
                  color: item.passed ? '#00A86B' : '#E63946',
                  fontWeight: 600,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {item.passed ? '核验通过' : '核验未通过'}
              </div>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
}

/** 人脸比对仪表盘配置 */
function buildGaugeOption(score: number): EChartsOption {
  const color = score >= 85 ? '#00A86B' : score >= 60 ? '#FF6B35' : '#E63946';
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        splitNumber: 10,
        radius: '92%',
        center: ['50%', '58%'],
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [0.6, '#E63946'],
              [0.85, '#FF6B35'],
              [1, '#00A86B'],
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '58%',
          width: 8,
          offsetCenter: [0, '-8%'],
          itemStyle: {
            color: color,
            shadowBlur: 6,
            shadowColor: color,
          },
        },
        axisTick: {
          length: 6,
          lineStyle: {
            color: 'auto',
            width: 1,
          },
        },
        splitLine: {
          length: 10,
          lineStyle: {
            color: 'auto',
            width: 2,
          },
        },
        axisLabel: {
          color: '#6B7280',
          fontSize: 10,
          distance: -24,
          rotate: 'tangential',
        },
        title: {
          offsetCenter: [0, '55%'],
          fontSize: 13,
          color: '#6B7280',
          fontWeight: 500,
        },
        detail: {
          fontSize: 34,
          offsetCenter: [0, '0%'],
          valueAnimation: true,
          formatter: '{value}',
          color: color,
          fontWeight: 700,
        },
        data: [
          {
            value: score,
            name: '匹配度',
          },
        ],
      },
    ],
  };
}

/** 身份证号脱敏 */
function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 15) return idCard;
  return `${idCard.slice(0, 6)}********${idCard.slice(-4)}`;
}

/** 手机号脱敏 */
function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

export default function AuditDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { landlordApplications, setAuditStatus } = useAppStore();
  const [form] = Form.useForm<{ remark: string }>();
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);

  /** 查找当前申请记录 */
  const application = useMemo<LandlordApplication | undefined>(() => {
    if (!id) return undefined;
    return landlordApplications.find((a) => a.id === id);
  }, [id, landlordApplications]);

  /** 产权核验状态（兼容 propertyVerify 和 propertyVerifyResult 两种字段名） */
  const propertyVerifyResult = useMemo(() => {
    const raw = application?.propertyVerify ?? application?.propertyVerifyResult;
    return (raw ?? {
      status: 'pending' as const,
      score: 0,
      details: {},
    }) as {
      status: string;
      score?: number;
      details?: Record<string, any>;
      ownerNameMatched?: boolean;
      ownerCertNoMatched?: boolean;
      propertyUnitNoValid?: boolean;
      hasMortgage?: boolean;
      hasSeizure?: boolean;
      hasObjection?: boolean;
      verifySource?: string;
      verifyTime?: string;
    };
  }, [application]);

  /** 人脸核验状态（兼容 faceVerify 和 faceVerifyResult 两种字段名） */
  const faceVerifyResult = useMemo(() => {
    const raw = application?.faceVerify ?? application?.faceVerifyResult;
    return (raw ?? {
      status: 'pending' as const,
      score: 0,
      matchScore: 0,
      livenessScore: 0,
      antiSpoofingPassed: false,
    }) as {
      status: string;
      score?: number;
      matchScore?: number;
      livenessScore?: number;
      antiSpoofingPassed?: boolean;
      similarity?: number;
      livenessPassed?: boolean;
      channel?: string;
      sessionId?: string;
      verifyTime?: string;
      idCardFaceUrl?: string;
      liveFaceUrl?: string;
    };
  }, [application]);

  /** 产权证书图片列表（模拟） */
  const certImages = useMemo(() => {
    return application?.propertyCertImages?.length
      ? application.propertyCertImages
      : [
          `https://picsum.photos/seed/cert-a-${id}/800/600`,
          `https://picsum.photos/seed/cert-b-${id}/800/600`,
          `https://picsum.photos/seed/cert-c-${id}/800/600`,
        ];
  }, [application, id]);

  /** 人脸对比图（模拟） */
  const faceImages = useMemo(
    () => ({
      idCard:
        faceVerifyResult.idCardFaceUrl ||
        `https://picsum.photos/seed/face-id-${id}/400/500`,
      live:
        faceVerifyResult.liveFaceUrl ||
        `https://picsum.photos/seed/face-live-${id}/400/500`,
    }),
    [faceVerifyResult, id]
  );

  /** 产权核验 4 个指标 */
  const propertyMetrics = useMemo<PropertyMetricItem[]>(() => {
    const r = propertyVerifyResult;
    return [
      {
        key: 'certNo',
        label: '证号有效',
        passed: r?.propertyUnitNoValid ?? true,
        icon: <FileTextOutlined />,
      },
      {
        key: 'owner',
        label: '权属匹配',
        passed: r?.ownerNameMatched ?? true,
        icon: <UserOutlined />,
      },
      {
        key: 'exists',
        label: '房产存在',
        passed: r?.ownerCertNoMatched ?? true,
        icon: <HomeOutlined />,
      },
      {
        key: 'mortgage',
        label: '无抵押',
        passed: !r?.hasMortgage,
        icon: <BankOutlined />,
      },
    ];
  }, [propertyVerifyResult]);

  /** 活体检测指标列表 */
  const livenessMetrics = useMemo<LivenessMetricItem[]>(() => {
    const face = faceVerifyResult;
    const basePassed = face?.livenessPassed ?? true;
    return [
      {
        key: 'blink',
        label: '眨眼检测',
        passed: basePassed,
        desc: '检测到有效眨眼动作 2 次',
      },
      {
        key: 'mouth',
        label: '张嘴检测',
        passed: basePassed,
        desc: '检测到张嘴闭合完整动作',
      },
      {
        key: 'head',
        label: '转头检测',
        passed: basePassed,
        desc: '左右转头角度分别为 28° / 25°',
      },
      {
        key: 'attack',
        label: '防攻击检测',
        passed: basePassed,
        desc: '未检测到屏幕翻拍 / 面具 / 照片攻击',
      },
    ];
  }, [faceVerifyResult]);

  /** 人脸相似度 */
  const similarity = faceVerifyResult.similarity ?? 85;

  /** 提交审核操作 */
  const handleAudit = async (action: AuditAction) => {
    try {
      if (!application) return;
      const values = await form.validateFields();

      setSubmitting(action);
      const targetStatus: LandlordApplicationStatus =
        action === 'approve' ? 'approved' : 'rejected';

      setAuditStatus(application.id, targetStatus, values.remark);

      const msgKey = `audit-${action}-${Date.now()}`;
      const successText =
        action === 'approve'
          ? '✅ 审核通过成功 · 系统已写入审计日志 · 即将返回列表...'
          : '🚫 驳回成功 · 复核记录已生成 · 房东将收到重新提交通知 · 即将返回列表...';

      message.loading({ content: '正在提交审核结果...', key: msgKey, duration: 0.4 });
      setTimeout(() => {
        message.success({ content: successText, key: msgKey, duration: 0.6 });
      }, 400);

      setTimeout(() => {
        form.resetFields();
        navigate('/landlord/audit');
      }, 1200);
    } catch {
      message.warning('请填写审核意见（必填）');
    } finally {
      setSubmitting(null);
    }
  };

  /** 记录不存在场景 */
  if (!application) {
    return (
      <div className="animate-fade-in-up" style={{ padding: 48 }}>
        <Result
          status="404"
          title="未找到该申请记录"
          subTitle="申请记录可能已被删除或编号有误"
          extra={
            <Button type="primary" onClick={() => navigate('/landlord/audit')}>
              返回审核列表
            </Button>
          }
        />
      </div>
    );
  }

  const bizStatus = (() => {
    if (application.status === 'verifying') {
      return application.currentStep <= 2 ? 'auto_verifying' : 'manual_review';
    }
    return application.status;
  })();

  const isFinal = application.status === 'approved' || application.status === 'rejected';

  /** 产权核验状态文字映射 */
  const propertyStatusText: Record<string, string> = {
    passed: '已通过',
    failed: '未通过',
    processing: '处理中',
    pending: '待核验',
  };
  /** 人脸核验状态文字映射 */
  const faceStatusText: Record<string, string> = {
    passed: '比对通过',
    failed: '比对失败',
    pending: '待比对',
  };

  /** 是否可以通过审核：前置核验全部通过 */
  const canApprove =
    !isFinal &&
    propertyVerifyResult.status === 'passed' &&
    faceVerifyResult.status === 'passed';
  /** 是否可以驳回：只要不是最终状态即可 */
  const canReject = !isFinal;

  return (
    <div className="animate-fade-in-up" style={{ padding: 24 }}>
      {/* 顶部：返回按钮 + 标题 + 状态徽章 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space size={16} wrap>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/landlord/audit')}
            style={{ padding: '4px 12px' }}
          >
            返回列表
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1A1A2E',
                  fontFamily: "'Noto Serif SC', serif",
                }}
              >
                {application.applyNo}
              </h1>
              <StatusBadge
                status={bizStatus === 'auto_verifying' ? 'reviewing' : bizStatus}
                type="audit"
              />
              {application.auditorName && (
                <Tag color="geekblue" style={{ margin: 0 }}>
                  审核人：{application.auditorName}
                </Tag>
              )}
            </div>
            <div style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
              提交时间：{dayjs(application.submitTime).format('YYYY-MM-DD HH:mm:ss')}
              {application.completeTime &&
                ` · 完成时间：${dayjs(application.completeTime).format('YYYY-MM-DD HH:mm:ss')}`}
            </div>
          </div>
        </Space>

        <Space>
          <Avatar
            style={{ backgroundColor: '#0F4C81' }}
            size={44}
            icon={<UserOutlined />}
          >
            {application.landlordName.slice(0, 1)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{application.landlordName}</div>
            <div style={{ color: '#6B7280', fontSize: 12 }}>
              {maskPhone(application.landlordPhone)}
            </div>
          </div>
        </Space>
      </div>

      {/* 基本信息条 */}
      <Card
        style={{ marginBottom: 16, borderRadius: 12 }}
        styles={{ body: { padding: '14px 20px' } }}
      >
        <Row gutter={[24, 12]}>
          <Col span={6}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>产权地址</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A2E', marginTop: 4 }}>
              {application.propertyAddress}
            </div>
          </Col>
          <Col span={4}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>房屋户型</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A2E', marginTop: 4 }}>
              {application.bedrooms}室{application.livingRooms}厅{application.bathrooms}卫
            </div>
          </Col>
          <Col span={4}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>建筑面积</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A2E', marginTop: 4 }}>
              {application.area} ㎡
            </div>
          </Col>
          <Col span={5}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>期望月租</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#E63946',
                marginTop: 4,
              }}
            >
              ¥ {application.expectedRent.toLocaleString()} / 月
            </div>
          </Col>
          <Col span={5}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>身份证号</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#1A1A2E',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {maskIdCard(application.landlordIdCard)}
              </span>
              <CopyOutlined
                style={{ color: '#9CA3AF', fontSize: 12, cursor: 'pointer' }}
                onClick={() => {
                  navigator.clipboard?.writeText(application.landlordIdCard);
                  message.success('已复制');
                }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* 左右分栏主布局（比例 8:6） */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* 左栏：证件材料瀑布流 */}
        <Col xs={24} lg={16} xl={16}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* 身份证材料 */}
            <MaterialCard
              title="身份证材料"
              icon={<IdcardOutlined />}
              extra={
                <Tag color="purple" style={{ margin: 0 }}>
                  {application.idCardHoldingImage ? '已上传手持照' : '待补充手持照'}
                </Tag>
              }
            >
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 8, fontSize: 12, color: '#6B7280' }}>
                    身份证正面
                  </div>
                  {application.idCardHoldingImage ? (
                    <Image
                      src={application.idCardHoldingImage}
                      alt="身份证正面"
                      style={{
                        borderRadius: 10,
                        width: '100%',
                        aspectRatio: '8 / 5',
                        objectFit: 'cover',
                        border: '1px solid #EEF0F2',
                      }}
                      preview={{ mask: (
                        <div style={{ color: '#fff' }}>
                          <EyeInvisibleOutlined /> 点击预览
                        </div>
                      )}}
                    />
                  ) : (
                    <IdCardPlaceholder side="front" label="身份证正面" />
                  )}
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 8, fontSize: 12, color: '#6B7280' }}>
                    身份证反面
                  </div>
                  <IdCardPlaceholder side="back" label="身份证反面" />
                </Col>
              </Row>
            </MaterialCard>

            {/* 手持身份证照（单独放大） */}
            <MaterialCard
              title="手持身份证照"
              icon={<CameraOutlined />}
              extra={
                <Space size={8}>
                  <Tag color={application.idCardHoldingImage ? 'green' : 'orange'} style={{ margin: 0 }}>
                    {application.idCardHoldingImage ? '已上传' : '待上传'}
                  </Tag>
                </Space>
              }
            >
              {application.idCardHoldingImage ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Image
                    src={application.idCardHoldingImage}
                    alt="手持身份证"
                    style={{
                      borderRadius: 12,
                      maxHeight: 400,
                      border: '1px solid #EEF0F2',
                      objectFit: 'contain',
                    }}
                    preview
                  />
                </div>
              ) : (
                <Empty
                  description={
                    <span style={{ color: '#9CA3AF' }}>房东未上传手持身份证照</span>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </MaterialCard>

            {/* 产权证书列表 */}
            <MaterialCard
              title="产权证书"
              icon={<FileTextOutlined />}
              extra={
                <Tag color="blue" style={{ margin: 0 }}>
                  共 {certImages.length} 张
                </Tag>
              }
            >
              <Image.PreviewGroup>
                <Row gutter={[12, 12]}>
                  {certImages.map((url, idx) => (
                    <Col xs={24} sm={12} md={8} key={idx}>
                      <div
                        style={{
                          position: 'relative',
                          borderRadius: 10,
                          overflow: 'hidden',
                          border: '1px solid #EEF0F2',
                          cursor: 'zoom-in',
                        }}
                      >
                        <Image
                          src={url}
                          alt={`产权证书 ${idx + 1}`}
                          width="100%"
                          height={180}
                          style={{ objectFit: 'cover', display: 'block' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            background: 'rgba(15,76,129,0.88)',
                            color: '#fff',
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}
                        >
                          证书 {idx + 1}
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            background: 'rgba(0,0,0,0.55)',
                            color: '#fff',
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <EyeTwoTone /> 点击放大
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            </MaterialCard>
          </Space>
        </Col>

        {/* 右栏：核验结果面板 */}
        <Col xs={24} lg={8} xl={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* 实名认证核验卡片 */}
            <Card
              style={{ borderRadius: 12 }}
              styles={{ body: { padding: 18 } }}
              title={
                <Space>
                  <SafetyOutlined
                    style={{ color: '#00A86B', fontSize: 16 }}
                  />
                  <span style={{ fontWeight: 600, color: '#1A1A2E' }}>
                    实名认证核验
                  </span>
                </Space>
              }
              extra={
                <Tag
                  color={application.status !== 'rejected' ? 'success' : 'error'}
                  style={{ margin: 0, paddingInline: 10 }}
                >
                  {application.status !== 'rejected' ? (
                    <Space size={4}>
                      <CheckCircleFilled /> 核验通过
                    </Space>
                  ) : (
                    <Space size={4}>
                      <CloseCircleFilled /> 核验失败
                    </Space>
                  )}
                </Tag>
              }
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#FAFBFC',
                    borderRadius: 8,
                    border: '1px solid #EEF0F2',
                  }}
                >
                  <span style={{ color: '#6B7280', fontSize: 13 }}>身份证号</span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#1A1A2E',
                    }}
                  >
                    {maskIdCard(application.landlordIdCard)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#FAFBFC',
                    borderRadius: 8,
                    border: '1px solid #EEF0F2',
                  }}
                >
                  <span style={{ color: '#6B7280', fontSize: 13 }}>手机号</span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#1A1A2E',
                    }}
                  >
                    {maskPhone(application.landlordPhone)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#FAFBFC',
                    borderRadius: 8,
                    border: '1px solid #EEF0F2',
                  }}
                >
                  <span style={{ color: '#6B7280', fontSize: 13 }}>核验时间</span>
                  <span style={{ fontWeight: 500, color: '#1A1A2E' }}>
                    {faceVerifyResult.verifyTime
                      ? dayjs(faceVerifyResult.verifyTime).format(
                          'YYYY-MM-DD HH:mm'
                        )
                      : '—'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#FAFBFC',
                    borderRadius: 8,
                    border: '1px solid #EEF0F2',
                  }}
                >
                  <span style={{ color: '#6B7280', fontSize: 13 }}>核验渠道</span>
                  <Tag color="blue" style={{ margin: 0 }}>
                    {faceVerifyResult.channel === 'alipay'
                      ? '支付宝刷脸'
                      : faceVerifyResult.channel === 'wechat'
                      ? '微信刷脸'
                      : faceVerifyResult.channel === 'ctid'
                      ? 'CTID 网证'
                      : '银行级核验'}
                  </Tag>
                </div>
              </Space>
            </Card>

            {/* 产权核验卡片 */}
            <Card
              style={{ borderRadius: 12 }}
              styles={{ body: { padding: 18 } }}
              title={
                <Space>
                  <HomeOutlined style={{ color: '#4787C7', fontSize: 16 }} />
                  <span style={{ fontWeight: 600, color: '#1A1A2E' }}>产权核验</span>
                </Space>
              }
              extra={
                <Tag
                  color={
                    propertyVerifyResult.status === 'passed'
                      ? 'success'
                      : propertyVerifyResult.status === 'failed'
                      ? 'error'
                      : propertyVerifyResult.status === 'processing'
                      ? 'processing'
                      : 'warning'
                  }
                  style={{ margin: 0 }}
                >
                  {propertyVerifyResult.status === 'passed'
                    ? '已通过'
                    : propertyVerifyResult.status === 'failed'
                    ? '未通过'
                    : propertyVerifyResult.status === 'processing'
                    ? '处理中'
                    : '待核验'}
                </Tag>
              }
            >
              <PropertyMetricRow items={propertyMetrics} />
              {propertyVerifyResult.verifySource && (
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    color: '#6B7280',
                    textAlign: 'right',
                  }}
                >
                  核验来源：
                  {propertyVerifyResult.verifySource === 'government_api'
                    ? '不动产登记中心接口'
                    : propertyVerifyResult.verifySource === 'third_party'
                    ? '第三方核验机构'
                    : '人工录入核验'}
                </div>
              )}
            </Card>

            {/* 人脸活体比对卡片 */}
            <Card
              style={{ borderRadius: 12 }}
              styles={{ body: { padding: 18 } }}
              title={
                <Space>
                  <UserOutlined style={{ color: '#7B61FF', fontSize: 16 }} />
                  <span style={{ fontWeight: 600, color: '#1A1A2E' }}>人脸活体比对</span>
                </Space>
              }
              extra={
                <Tag
                  color={
                    faceVerifyResult.status === 'passed'
                      ? 'success'
                      : faceVerifyResult.status === 'failed'
                      ? 'error'
                      : 'warning'
                  }
                  style={{ margin: 0 }}
                >
                  {faceVerifyResult.status === 'passed'
                    ? '比对通过'
                    : faceVerifyResult.status === 'failed'
                    ? '比对失败'
                    : '待比对'}
                </Tag>
              }
            >
              {/* 上半：左右对比图 */}
              <Row gutter={[10, 10]} style={{ marginBottom: 8 }}>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                    证件照
                  </div>
                  <div
                    style={{
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1px solid #EEF0F2',
                      aspectRatio: '4 / 5',
                      background: '#F3F4F6',
                    }}
                  >
                    <Image.PreviewGroup>
                      <Image
                        src={faceImages.idCard}
                        alt="证件照"
                        preview
                        width="100%"
                        height="100%"
                        style={{ objectFit: 'cover', display: 'block' }}
                      />
                    </Image.PreviewGroup>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                    实时抓拍
                  </div>
                  <div
                    style={{
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1px solid #EEF0F2',
                      aspectRatio: '4 / 5',
                      background: '#F3F4F6',
                    }}
                  >
                    <Image.PreviewGroup>
                      <Image
                        src={faceImages.live}
                        alt="实时抓拍"
                        preview
                        width="100%"
                        height="100%"
                        style={{ objectFit: 'cover', display: 'block' }}
                      />
                    </Image.PreviewGroup>
                  </div>
                </Col>
              </Row>

              {/* 中部：匹配度仪表盘 */}
              <div
                style={{
                  background:
                    'linear-gradient(180deg, #F8FBFF 0%, #FAFBFC 100%)',
                  borderRadius: 12,
                  border: '1px solid #EEF0F2',
                  padding: '4px 0 0 0',
                  marginBottom: 12,
                }}
              >
                <ReactECharts
                  option={buildGaugeOption(similarity)}
                  style={{ height: 210 }}
                  notMerge
                  lazyUpdate
                />
              </div>

              {/* 下部：活体检测指标列表 */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', marginBottom: 10 }}>
                活体检测指标
              </div>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {livenessMetrics.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: item.passed ? '#F0FBF6' : '#FEF1F2',
                    }}
                  >
                    <span
                      style={{
                        color: item.passed ? '#00A86B' : '#E63946',
                        fontSize: 14,
                        marginTop: 2,
                      }}
                    >
                      {item.passed ? <CheckCircleFilled /> : <CloseCircleFilled />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#1A1A2E',
                        }}
                      >
                        {item.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* 底部操作区：审核意见输入 + 大按钮组 */}
      <Card
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 20 } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                审核意见 <span style={{ color: '#E63946' }}>*</span>
              </span>
            }
            name="remark"
            initialValue={application.rejectReason}
            rules={[{ required: !isFinal, message: '请填写审核意见' }]}
          >
            <Input.TextArea
              rows={3}
              maxLength={300}
              showCount
              disabled={isFinal}
              placeholder={
                isFinal
                  ? '该申请已完成审核'
                  : '请认真核对材料后填写审核意见，系统将自动记录审计日志...'
              }
            />
          </Form.Item>

          {/* 前置核验状态横幅（更醒目的核验状态提示） */}
          {!isFinal && (
            <div style={{ marginBottom: 16 }}>
              {/* 核验未完成（pending / processing） */}
              {(propertyVerifyResult.status === 'pending' ||
                propertyVerifyResult.status === 'processing' ||
                faceVerifyResult.status === 'pending' ||
                faceVerifyResult.status === 'processing') && (
                <Alert
                  type="info"
                  showIcon
                  message={
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        ⏳ 前置核验进行中，请等待产权核验和人脸比对全部完成后再进行审批
                      </div>
                      <Space size={16} wrap>
                        <span>
                          产权核验：
                          <span
                            style={{
                              color:
                                propertyVerifyResult.status === 'passed'
                                  ? '#00A86B'
                                  : propertyVerifyResult.status === 'failed'
                                  ? '#E63946'
                                  : '#0F4C81',
                              fontWeight: 500,
                            }}
                          >
                            {propertyStatusText[propertyVerifyResult.status] ?? '待核验'}
                          </span>
                        </span>
                        <span>
                          人脸比对：
                          <span
                            style={{
                              color:
                                faceVerifyResult.status === 'passed'
                                  ? '#00A86B'
                                  : faceVerifyResult.status === 'failed'
                                  ? '#E63946'
                                  : '#0F4C81',
                              fontWeight: 500,
                            }}
                          >
                            {faceStatusText[faceVerifyResult.status] ?? '待比对'}
                          </span>
                        </span>
                      </Space>
                    </div>
                  }
                  style={{ borderRadius: 8 }}
                />
              )}

              {/* 核验存在不通过项（failed） */}
              {(propertyVerifyResult.status === 'failed' ||
                faceVerifyResult.status === 'failed') &&
                propertyVerifyResult.status !== 'pending' &&
                propertyVerifyResult.status !== 'processing' &&
                faceVerifyResult.status !== 'pending' &&
                faceVerifyResult.status !== 'processing' && (
                  <Alert
                    type="error"
                    showIcon
                    message={
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                          ❌ 前置核验存在不通过项，需人工复核后谨慎审批
                        </div>
                        <Space size={16} wrap>
                          {propertyVerifyResult.status === 'failed' && (
                            <span style={{ color: '#E63946' }}>
                              产权核验：{propertyStatusText.failed}
                            </span>
                          )}
                          {faceVerifyResult.status === 'failed' && (
                            <span style={{ color: '#E63946' }}>
                              人脸比对：{faceStatusText.failed}
                            </span>
                          )}
                        </Space>
                      </div>
                    }
                    style={{ borderRadius: 8 }}
                  />
                )}

              {/* 核验全部通过 */}
              {propertyVerifyResult.status === 'passed' &&
                faceVerifyResult.status === 'passed' && (
                  <Alert
                    type="success"
                    showIcon
                    message={
                      <div>
                        <span style={{ fontWeight: 600 }}>
                          ✅ 前置核验全部通过，可进行最终审批
                        </span>
                        <Space size={16} wrap style={{ marginLeft: 12 }}>
                          <span style={{ color: '#00A86B' }}>
                            产权核验：{propertyStatusText.passed}
                          </span>
                          <span style={{ color: '#00A86B' }}>
                            人脸比对：{faceStatusText.passed}
                          </span>
                        </Space>
                      </div>
                    }
                    style={{ borderRadius: 8 }}
                  />
                )}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 4,
            }}
          >
            <Button
              size="large"
              onClick={() => navigate('/landlord/audit')}
              style={{ paddingInline: 28 }}
            >
              返回列表
            </Button>
            {!isFinal && (
              <>
                {/* 驳回按钮：始终可用，核验未完成时显示提示 */}
                <Tooltip
                  title={
                    propertyVerifyResult.status === 'pending' ||
                    propertyVerifyResult.status === 'processing' ||
                    faceVerifyResult.status === 'pending' ||
                    faceVerifyResult.status === 'processing'
                      ? '核验未完成时驳回，房东可重新提交材料'
                      : ''
                  }
                  placement="top"
                >
                  <Button
                    size="large"
                    danger
                    icon={<CloseCircleFilled />}
                    loading={submitting === 'reject'}
                    disabled={!canReject}
                    onClick={() =>
                      Modal.confirm({
                        title: '确认驳回该申请？',
                        content:
                          '驳回后将生成复核记录，房东将收到重新提交通知。请确认已填写驳回理由。',
                        okText: '确认驳回',
                        okButtonProps: { danger: true },
                        cancelText: '取消',
                        onOk: () => handleAudit('reject'),
                      })
                    }
                    style={{ paddingInline: 28, fontWeight: 600 }}
                  >
                    驳回申请
                  </Button>
                </Tooltip>

                {/* 通过按钮：只有两者都 passed 时才可用 */}
                <Tooltip
                  title={
                    canApprove ? '' : '前置核验未全部通过，无法审批通过'
                  }
                  placement="top"
                >
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleFilled />}
                    loading={submitting === 'approve'}
                    disabled={!canApprove}
                    onClick={() => handleAudit('approve')}
                    style={{
                      background: '#00A86B',
                      borderColor: '#00A86B',
                      paddingInline: 28,
                      fontWeight: 600,
                    }}
                  >
                    通过审核
                  </Button>
                </Tooltip>
              </>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}
