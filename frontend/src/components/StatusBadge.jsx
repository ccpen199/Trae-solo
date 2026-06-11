import React from 'react'
import { Tag } from 'antd'

/**
 * 状态标签组件
 * 统一处理各种状态的颜色映射
 *
 * @param {Object} props
 * @param {string} props.type - 状态类型: job_status | application_status | interview_status | offer_status | fraud_status
 * @param {string} props.status - 状态值
 * @param {string} [props.text] - 显示文本，不传则根据状态自动映射
 * @param {Object} [props.style] - 自定义样式
 */

const STATUS_MAP = {
  job_status: {
    published: { color: 'green', text: '已发布' },
    draft: { color: 'default', text: '草稿' },
    closed: { color: 'red', text: '已关闭' },
    offline: { color: 'orange', text: '已下线' }
  },
  application_status: {
    applied: { color: 'blue', text: '已投递' },
    screening: { color: 'cyan', text: '筛选中' },
    interview: { color: 'geekblue', text: '面试中' },
    offer: { color: 'purple', text: 'Offer中' },
    hired: { color: 'green', text: '已入职' },
    rejected: { color: 'red', text: '已拒绝' }
  },
  interview_status: {
    pending: { color: 'orange', text: '待开始' },
    ongoing: { color: 'blue', text: '进行中' },
    completed: { color: 'green', text: '已完成' },
    cancelled: { color: 'default', text: '已取消' }
  },
  offer_status: {
    draft: { color: 'default', text: '草稿' },
    sent: { color: 'blue', text: '已发送' },
    signed: { color: 'green', text: '已签收' },
    rejected: { color: 'red', text: '已拒绝' },
    withdrawn: { color: 'orange', text: '已撤回' }
  },
  fraud_status: {
    normal: { color: 'green', text: '正常' },
    warning: { color: 'orange', text: '可疑' },
    rejected: { color: 'red', text: '欺诈' }
  }
}

const StatusBadge = ({ type, status, text, style }) => {
  const statusConfig = STATUS_MAP[type]?.[status] || {
    color: 'default',
    text: status
  }

  return (
    <Tag
      color={statusConfig.color}
      style={{
        margin: 0,
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 12,
        ...style
      }}
    >
      {text || statusConfig.text}
    </Tag>
  )
}

export default StatusBadge
