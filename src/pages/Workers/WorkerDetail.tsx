import { Card, Descriptions, Tag, Table, Progress, Badge, Steps, Button, Tabs, Typography, Space, Alert } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { workerProfiles } from '@/mock/data'
import type { WorkerProfile } from '@/types'
import { useParams, useNavigate } from 'react-router-dom'

const levelColorMap: Record<string, string> = {
  L1: 'green',
  L2: 'blue',
  L3: 'orange',
  L4: 'red',
}

const statusColorMap: Record<WorkerProfile['status'], string> = {
  active: 'green',
  suspended: 'red',
  recertifying: 'orange',
  inactive: 'default',
}

const statusLabelMap: Record<WorkerProfile['status'], string> = {
  active: '在岗',
  suspended: '停岗',
  recertifying: '复培中',
  inactive: '离岗',
}

const identityBadgeMap: Record<string, { status: 'success' | 'processing' | 'error'; text: string }> = {
  verified: { status: 'success', text: '已核验' },
  pending: { status: 'processing', text: '待核验' },
  rejected: { status: 'error', text: '已驳回' },
}

const medicalTagMap: Record<string, { color: string; text: string }> = {
  verified: { color: 'green', text: '已验证' },
  ocr_processed: { color: 'blue', text: '已识别' },
  uploaded: { color: 'orange', text: '待识别' },
  none: { color: 'default', text: '未上传' },
}

const levelStepMap: Record<string, number> = { L1: 0, L2: 1, L3: 2, L4: 3 }

const skillColumns = [
  { title: '证书名称', dataIndex: 'name', key: 'name' },
  { title: '等级', dataIndex: 'level', key: 'level' },
  { title: '颁发机构', dataIndex: 'issuer', key: 'issuer' },
  { title: '颁发日期', dataIndex: 'issueDate', key: 'issueDate' },
  { title: '到期日期', dataIndex: 'expireDate', key: 'expireDate' },
  {
    title: '结构化数据',
    dataIndex: 'structuredData',
    key: 'structuredData',
    render: (data: Record<string, string>) => (
      <Space direction="vertical" size={2}>
        {Object.entries(data).map(([key, value]) => (
          <span key={key}>
            {key}: {value}
          </span>
        ))}
      </Space>
    ),
  },
]

const trainingColumns = [
  { title: '课程名称', dataIndex: 'courseName', key: 'courseName' },
  { title: '完成日期', dataIndex: 'completedDate', key: 'completedDate' },
  { title: '成绩', dataIndex: 'score', key: 'score' },
  {
    title: '是否通过',
    dataIndex: 'passed',
    key: 'passed',
    render: (passed: boolean) => (
      <Tag color={passed ? 'green' : 'red'} icon={passed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
        {passed ? '通过' : '未通过'}
      </Tag>
    ),
  },
  {
    title: '证书编号',
    dataIndex: 'certificateId',
    key: 'certificateId',
    render: (id: string | undefined) => id || '-',
  },
]

const ocrColumns = [
  { title: '检查项目', dataIndex: 'name', key: 'name' },
  { title: '结果', dataIndex: 'result', key: 'result' },
  {
    title: '是否正常',
    dataIndex: 'normal',
    key: 'normal',
    render: (normal: boolean) => (
      <Tag color={normal ? 'green' : 'red'}>{normal ? '正常' : '异常'}</Tag>
    ),
  },
]

const WorkerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const worker = workerProfiles.find((w) => w.id === id)

  if (!worker) {
    return (
      <div className="page-container">
        <Alert
          message="未找到劳动者"
          description={`ID 为 ${id} 的劳动者信息不存在`}
          type="error"
          showIcon
        />
      </div>
    )
  }

  const identityTab = (
    <Card>
      <Descriptions column={2} bordered>
        <Descriptions.Item label="核验状态">
          <Badge {...identityBadgeMap[worker.identity.status]} />
        </Descriptions.Item>
        <Descriptions.Item label="身份证号">{worker.identity.idNumber}</Descriptions.Item>
        <Descriptions.Item label="真实姓名">{worker.identity.realName}</Descriptions.Item>
        {worker.identity.status === 'verified' && worker.identity.verifiedAt && (
          <Descriptions.Item label="核验时间">{worker.identity.verifiedAt}</Descriptions.Item>
        )}
      </Descriptions>
      {worker.identity.status === 'rejected' && worker.identity.rejectReason && (
        <Alert
          style={{ marginTop: 16 }}
          message="驳回原因"
          description={worker.identity.rejectReason}
          type="error"
          showIcon
        />
      )}
    </Card>
  )

  const medicalTag = medicalTagMap[worker.medical.status]
  const medicalTab = (
    <Card>
      <Descriptions column={2} bordered>
        <Descriptions.Item label="体检状态">
          <Tag color={medicalTag.color}>{medicalTag.text}</Tag>
        </Descriptions.Item>
        {worker.medical.uploadDate && (
          <Descriptions.Item label="上传日期">{worker.medical.uploadDate}</Descriptions.Item>
        )}
        {worker.medical.verifiedAt && (
          <Descriptions.Item label="验证时间">{worker.medical.verifiedAt}</Descriptions.Item>
        )}
      </Descriptions>
      {worker.medical.ocrResult && (
        <>
          <Descriptions column={2} bordered style={{ marginTop: 16 }}>
            <Descriptions.Item label="体检医院">{worker.medical.ocrResult.hospital}</Descriptions.Item>
            <Descriptions.Item label="体检日期">{worker.medical.ocrResult.examDate}</Descriptions.Item>
          </Descriptions>
          <Table
            style={{ marginTop: 16 }}
            rowKey="name"
            columns={ocrColumns}
            dataSource={worker.medical.ocrResult.items}
            pagination={false}
            size="small"
          />
        </>
      )}
    </Card>
  )

  const skillTab = (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card title="技能证书">
        <Table
          rowKey="id"
          columns={skillColumns}
          dataSource={worker.skills}
          pagination={false}
          size="small"
        />
      </Card>
      <Card title="培训记录">
        <Table
          rowKey="id"
          columns={trainingColumns}
          dataSource={worker.training}
          pagination={false}
          size="small"
        />
      </Card>
    </Space>
  )

  const ratingTab = (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="综合评分">
            <Progress
              percent={Math.round((worker.rating / 5) * 100)}
              format={() => `${worker.rating} / 5.0`}
              strokeColor="#1677ff"
              style={{ maxWidth: 300 }}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="投诉归因标签">
        {worker.complaintTags.length > 0 ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {worker.complaintTags.map((tag) => (
              <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="orange">
                  {tag.category} - {tag.label} ({tag.count}次)
                </Tag>
                {tag.lastOccurred && (
                  <span style={{ color: '#999', fontSize: 12 }}>
                    最近: {tag.lastOccurred}
                  </span>
                )}
              </div>
            ))}
          </Space>
        ) : (
          <span style={{ color: '#999' }}>暂无投诉记录</span>
        )}
      </Card>
    </Space>
  )

  const levelTab = (
    <Card>
      <Steps
        current={levelStepMap[worker.level]}
        style={{ marginBottom: 32 }}
        items={[
          { title: 'L1', description: '初级', icon: <ClockCircleOutlined /> },
          { title: 'L2', description: '中级', icon: <ClockCircleOutlined /> },
          { title: 'L3', description: '高级', icon: <ClockCircleOutlined /> },
          { title: 'L4', description: '专家', icon: <CheckCircleOutlined /> },
        ]}
      />
      <Descriptions column={2} bordered>
        <Descriptions.Item label="当前等级">
          <Tag color={levelColorMap[worker.level]}>{worker.level}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="城市服务半径">{worker.serviceRadius} km</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={statusColorMap[worker.status]}>{statusLabelMap[worker.status]}</Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/workers')}
        >
          返回
        </Button>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {worker.name}
        </Typography.Title>
        <Tag color={levelColorMap[worker.level]}>{worker.level}</Tag>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered>
          <Descriptions.Item label="姓名">{worker.name}</Descriptions.Item>
          <Descriptions.Item label="手机号">{worker.phone}</Descriptions.Item>
          <Descriptions.Item label="年龄">{worker.age}</Descriptions.Item>
          <Descriptions.Item label="性别">{worker.gender === 'male' ? '男' : '女'}</Descriptions.Item>
          <Descriptions.Item label="城市">{worker.city}</Descriptions.Item>
          <Descriptions.Item label="服务半径">{worker.serviceRadius} km</Descriptions.Item>
          <Descriptions.Item label="服务类目">
            <Space>
              {worker.serviceCategories.map((cat) => (
                <Tag key={cat}>{cat}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="加入日期">{worker.joinDate}</Descriptions.Item>
          <Descriptions.Item label="最后活跃日期">{worker.lastActiveDate}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColorMap[worker.status]}>{statusLabelMap[worker.status]}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs
        items={[
          { key: 'identity', label: '身份核验', children: identityTab },
          { key: 'medical', label: '体检报告', children: medicalTab },
          { key: 'skills', label: '技能证书与培训', children: skillTab },
          { key: 'rating', label: '评分与投诉', children: ratingTab },
          { key: 'level', label: '分级准入', children: levelTab },
        ]}
      />
    </div>
  )
}

export default WorkerDetail
