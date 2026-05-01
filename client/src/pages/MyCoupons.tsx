import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  Empty,
  Tabs,
  Badge,
  Popconfirm,
  message
} from 'antd';
import {
  GiftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { couponApi } from '@/services/api';
import { getStatusBadgeProps } from '@/stores/store';
import { CouponStatus } from '@/types';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

const MyCouponsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  const { data: coupons, isLoading } = useQuery(
    ['my-coupons', activeTab],
    () => couponApi.getMyCoupons({
      status: activeTab !== 'all' ? activeTab : undefined,
      limit: 100
    }),
    {
      staleTime: 5000
    }
  );

  const refundMutation = useMutation(
    ({ couponId, extendValidity }: { couponId: string; extendValidity: boolean }) =>
      couponApi.refundCoupon(couponId, extendValidity),
    {
      onSuccess: () => {
        message.success('优惠券已退回');
        queryClient.invalidateQueries(['my-coupons']);
        setSelectedCoupon(null);
      },
      onError: () => {
        message.error('退回失败，请重试');
      }
    }
  );

  const getCouponCountByStatus = (status: CouponStatus) => {
    return coupons?.data?.filter((c: any) => c.status === status).length || 0;
  };

  const columns = [
    {
      title: '券码',
      dataIndex: 'couponCode',
      key: 'couponCode',
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{text}</span>
      )
    },
    {
      title: '面值',
      dataIndex: 'value',
      key: 'value',
      render: (val: number, record: any) => (
        <span style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d4f' }}>
          ¥{val}
          {record.minOrderAmount > 0 && (
            <span style={{ fontSize: 12, color: '#999', fontWeight: 'normal' }}>
              （满{record.minOrderAmount}可用）
            </span>
          )}
        </span>
      )
    },
    {
      title: '有效期',
      key: 'validity',
      render: (_: any, record: any) => {
        const isExpiringSoon = dayjs(record.validTo).diff(dayjs(), 'day') <= 7;
        const isExpired = dayjs(record.validTo).isBefore(dayjs());
        
        return (
          <div>
            <div>
              {dayjs(record.validFrom).format('MM-DD')} ~ {dayjs(record.validTo).format('MM-DD')}
            </div>
            {isExpiringSoon && !isExpired && (
              <Tag color="orange" style={{ marginTop: 4 }}>
                即将过期
              </Tag>
            )}
          </div>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const badge = getStatusBadgeProps(status);
        return <Tag color={badge.color}>{badge.text}</Tag>;
      }
    },
    {
      title: '领取时间',
      dataIndex: 'distributedAt',
      key: 'distributedAt',
      render: (date: string) => date ? dayjs(date).format('MM-DD HH:mm') : '-'
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      key: 'usedAt',
      render: (date: string) => date ? dayjs(date).format('MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedCoupon(record)}
          >
            详情
          </Button>
          {record.status === CouponStatus.USED && (
            <Popconfirm
              title="确认退回优惠券"
              description="退回后优惠券将恢复可用状态，是否继续？"
              onConfirm={() =>
                refundMutation.mutate({
                  couponId: record.id,
                  extendValidity: true
                })
              }
              okText="确认退回"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                icon={<RedoOutlined />}
              >
                退回
              </Button>
            </Popconfirm>
          )}
        </div>
      )
    }
  ];

  const getCouponCard = (coupon: any) => {
    const isExpired = dayjs(coupon.validTo).isBefore(dayjs());
    const isUsed = coupon.status === CouponStatus.USED;
    const isFrozen = coupon.status === CouponStatus.FROZEN;
    const isDisabled = isExpired || isUsed || isFrozen;

    return (
      <Card
        key={coupon.id}
        size="small"
        style={{
          marginBottom: 16,
          opacity: isDisabled ? 0.6 : 1,
          borderLeft: `4px solid ${isDisabled ? '#d9d9d9' : '#ff4d4f'}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
              ¥{coupon.value}
              <span style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
                {coupon.minOrderAmount > 0 ? ` 满${coupon.minOrderAmount}可用` : ' 无门槛'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              券码: {coupon.couponCode}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              有效期: {dayjs(coupon.validFrom).format('MM-DD')} ~ {dayjs(coupon.validTo).format('MM-DD')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 8 }}>
              {getStatusBadgeProps(coupon.status).text === '待使用' ? (
                <Tag color="green">可用</Tag>
              ) : getStatusBadgeProps(coupon.status).text === '已使用' ? (
                <Tag color="blue">已使用</Tag>
              ) : getStatusBadgeProps(coupon.status).text === '已过期' ? (
                <Tag>已过期</Tag>
              ) : getStatusBadgeProps(coupon.status).text === '已冻结' ? (
                <Tag color="orange">已冻结</Tag>
              ) : (
                <Tag>{getStatusBadgeProps(coupon.status).text}</Tag>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                size="small"
                type="primary"
                disabled={isDisabled}
                onClick={() => message.info('去下单使用功能开发中')}
              >
                立即使用
              </Button>
              <Button size="small" onClick={() => setSelectedCoupon(coupon)}>
                详情
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderTabContent = () => {
    const filteredCoupons =
      activeTab === 'all'
        ? coupons?.data || []
        : coupons?.data?.filter((c: any) => c.status === activeTab) || [];

    if (isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Empty description="加载中..." />
        </div>
      );
    }

    if (filteredCoupons.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无优惠券"
        />
      );
    }

    return (
      <div>
        {filteredCoupons.map((coupon: any) => getCouponCard(coupon))}
      </div>
    );
  };

  return (
    <div>
      <Card title="我的券包">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: (
                <span>
                  全部
                  <Badge
                    count={coupons?.data?.length || 0}
                    style={{ marginLeft: 8 }}
                  />
                </span>
              ),
              children: renderTabContent()
            },
            {
              key: CouponStatus.PENDING_USE,
              label: (
                <span>
                  <GiftOutlined style={{ marginRight: 4 }} />
                  可用
                  <Badge
                    count={getCouponCountByStatus(CouponStatus.PENDING_USE)}
                    style={{ marginLeft: 8 }}
                  />
                </span>
              ),
              children: renderTabContent()
            },
            {
              key: CouponStatus.USED,
              label: (
                <span>
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  已使用
                  <Badge
                    count={getCouponCountByStatus(CouponStatus.USED)}
                    style={{ marginLeft: 8 }}
                  />
                </span>
              ),
              children: renderTabContent()
            },
            {
              key: CouponStatus.EXPIRED,
              label: (
                <span>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  已过期
                  <Badge
                    count={getCouponCountByStatus(CouponStatus.EXPIRED)}
                    style={{ marginLeft: 8 }}
                  />
                </span>
              ),
              children: renderTabContent()
            },
            {
              key: CouponStatus.FROZEN,
              label: (
                <span>
                  <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                  已冻结
                  <Badge
                    count={getCouponCountByStatus(CouponStatus.FROZEN)}
                    style={{ marginLeft: 8 }}
                  />
                </span>
              ),
              children: renderTabContent()
            }
          ]}
        />
      </Card>

      <Modal
        title="优惠券详情"
        open={!!selectedCoupon}
        onCancel={() => setSelectedCoupon(null)}
        footer={[
          selectedCoupon?.status === CouponStatus.PENDING_USE && (
            <Button
              key="use"
              type="primary"
              onClick={() => {
                message.info('去下单使用功能开发中');
                setSelectedCoupon(null);
              }}
            >
              立即使用
            </Button>
          ),
          <Button key="close" onClick={() => setSelectedCoupon(null)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedCoupon && (
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
                padding: 24,
                borderRadius: 8,
                color: '#fff',
                marginBottom: 24
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 'bold' }}>
                ¥{selectedCoupon.value}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
                {selectedCoupon.minOrderAmount > 0
                  ? `满${selectedCoupon.minOrderAmount}元可用`
                  : '无门槛使用'}
              </div>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="券码">
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {selectedCoupon.couponCode}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const badge = getStatusBadgeProps(selectedCoupon.status);
                  return <Tag color={badge.color}>{badge.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="面值">
                ¥{selectedCoupon.value}
              </Descriptions.Item>
              <Descriptions.Item label="使用门槛">
                {selectedCoupon.minOrderAmount > 0
                  ? `满¥${selectedCoupon.minOrderAmount}`
                  : '无门槛'}
              </Descriptions.Item>
              <Descriptions.Item label="有效期开始">
                {dayjs(selectedCoupon.validFrom).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="有效期结束">
                {dayjs(selectedCoupon.validTo).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="领取时间">
                {selectedCoupon.distributedAt
                  ? dayjs(selectedCoupon.distributedAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="使用时间">
                {selectedCoupon.usedAt
                  ? dayjs(selectedCoupon.usedAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              {selectedCoupon.orderId && (
                <Descriptions.Item label="关联订单">
                  <span style={{ fontFamily: 'monospace' }}>
                    {selectedCoupon.orderId}
                  </span>
                </Descriptions.Item>
              )}
              {selectedCoupon.storeId && (
                <Descriptions.Item label="适用门店">
                  {selectedCoupon.storeId}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyCouponsPage;
