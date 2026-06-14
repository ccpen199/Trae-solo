import React from 'react';
import { Modal, Descriptions, Button, Space, QRCode } from 'antd';
import { Desensitize, StatusTag } from '@/components/common';
import type { Reservation } from '@/services/api/reservation';
import { formatDateTime } from '@/utils/format';

interface ReservationDetailProps {
  open: boolean;
  record: Reservation | null;
  onCancel: () => void;
  onConfirm?: (record: Reservation) => void;
  onVerify?: (record: Reservation) => void;
  onCancelReservation?: (record: Reservation) => void;
}

const statusMap: Record<string, { type: 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'default'; text: string }> = {
  pending: { type: 'pending', text: '待确认' },
  confirmed: { type: 'info', text: '已确认' },
  used: { type: 'success', text: '已核销' },
  cancelled: { type: 'danger', text: '已取消' },
  expired: { type: 'default', text: '已过期' },
};

const ReservationDetail: React.FC<ReservationDetailProps> = ({
  open,
  record,
  onCancel,
  onConfirm,
  onVerify,
  onCancelReservation,
}) => {
  if (!record) return null;

  const statusInfo = statusMap[record.status] || statusMap.pending;

  const renderActions = () => {
    const actions: React.ReactNode[] = [];
    if (record.status === 'pending') {
      actions.push(
        <Button key="confirm" type="primary" onClick={() => onConfirm?.(record)}>
          确认预约
        </Button>
      );
    }
    if (record.status === 'confirmed') {
      actions.push(
        <Button key="verify" type="primary" onClick={() => onVerify?.(record)}>
          核销
        </Button>
      );
    }
    if (record.status === 'pending' || record.status === 'confirmed') {
      actions.push(
        <Button key="cancel" danger onClick={() => onCancelReservation?.(record)}>
          取消预约
        </Button>
      );
    }
    actions.push(
      <Button key="close" onClick={onCancel}>
        关闭
      </Button>
    );
    return actions;
  };

  return (
    <Modal
      title="预约详情"
      open={open}
      onCancel={onCancel}
      width={640}
      footer={<Space>{renderActions()}</Space>}
    >
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="预约编号" span={2}>
          <span className="font-mono">{record.orderNo}</span>
        </Descriptions.Item>
        <Descriptions.Item label="场所名称" span={2}>{record.placeName}</Descriptions.Item>
        <Descriptions.Item label="预约人姓名">
          <Desensitize value={record.visitorName} type="name" allowToggle />
        </Descriptions.Item>
        <Descriptions.Item label="手机号">
          <Desensitize value={record.visitorPhone} type="phone" allowToggle />
        </Descriptions.Item>
        <Descriptions.Item label="身份证号" span={2}>
          <Desensitize value={record.visitorIdCard} type="idCard" allowToggle />
        </Descriptions.Item>
        <Descriptions.Item label="预约日期">{record.visitDate}</Descriptions.Item>
        <Descriptions.Item label="预约时段">{record.visitTimeSlot}</Descriptions.Item>
        <Descriptions.Item label="参观人数">{record.visitorCount}人</Descriptions.Item>
        <Descriptions.Item label="预约状态">
          <StatusTag status={statusInfo.type} text={statusInfo.text} />
        </Descriptions.Item>
        <Descriptions.Item label="创建时间" span={2}>{formatDateTime(record.createdAt)}</Descriptions.Item>
        {record.confirmedAt && (
          <Descriptions.Item label="确认时间" span={2}>{formatDateTime(record.confirmedAt)}</Descriptions.Item>
        )}
        {record.usedAt && (
          <Descriptions.Item label="核销时间" span={2}>{formatDateTime(record.usedAt)}</Descriptions.Item>
        )}
        {record.cancelledAt && (
          <>
            <Descriptions.Item label="取消时间" span={2}>{formatDateTime(record.cancelledAt)}</Descriptions.Item>
            {record.cancelReason && (
              <Descriptions.Item label="取消原因" span={2}>{record.cancelReason}</Descriptions.Item>
            )}
          </>
        )}
        {record.remark && (
          <Descriptions.Item label="备注" span={2}>{record.remark}</Descriptions.Item>
        )}
      </Descriptions>

      {(record.status === 'confirmed' || record.status === 'pending') && (
        <div className="mt-6 flex flex-col items-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <div className="text-sm text-neutral-500 mb-2">核销二维码</div>
          <QRCode value={record.orderNo} size={160} />
          <div className="mt-2 text-xs text-neutral-400 font-mono">{record.orderNo}</div>
        </div>
      )}
    </Modal>
  );
};

export default ReservationDetail;
