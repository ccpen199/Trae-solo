import React from 'react'
import { Progress, Space, Typography } from 'antd'

const { Text } = Typography

/**
 * 匹配度展示组件
 * 环形进度条展示匹配度百分比
 *
 * @param {Object} props
 * @param {number} props.score - 总匹配度分数 (0-100)
 * @param {number} [props.size] - 环形图大小，默认80
 * @param {boolean} [props.showDetails] - 是否显示分项匹配度
 * @param {Object} [props.details] - 分项匹配度 { skills, experience, salary, intention }
 * @param {Object} [props.style] - 自定义样式
 */

const getScoreColor = (score) => {
  if (score >= 80) return '#52c41a'
  if (score >= 60) return '#faad14'
  if (score >= 40) return '#fa8c16'
  return '#ff4d4f'
}

const MatchScore = ({ score, size = 80, showDetails = false, details, style }) => {
  const color = getScoreColor(score)

  const detailItems = details
    ? [
        { label: '技能', value: details.skills, key: 'skills' },
        { label: '经验', value: details.experience, key: 'experience' },
        { label: '薪资', value: details.salary, key: 'salary' },
        { label: '意向度', value: details.intention, key: 'intention' }
      ]
    : []

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style
      }}
    >
      <Progress
        type="circle"
        percent={score}
        size={size}
        strokeColor={color}
        format={(percent) => (
          <span style={{ fontSize: size * 0.2, fontWeight: 600, color }}>
            {percent}%
          </span>
        )}
      />

      {showDetails && details && (
        <Space
          direction="vertical"
          size={4}
          style={{ width: '100%', marginTop: 12 }}
        >
          {detailItems.map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12
              }}
            >
              <Text type="secondary">{item.label}</Text>
              <Text strong style={{ color: getScoreColor(item.value) }}>
                {item.value}%
              </Text>
            </div>
          ))}
        </Space>
      )}
    </div>
  )
}

export default MatchScore
