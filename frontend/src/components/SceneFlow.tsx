import { Card, Steps, List, Tag, Space, Descriptions, Badge } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { SceneInstance, SceneTemplate } from '@/types'
import dayjs from 'dayjs'

interface SceneFlowProps {
  template?: SceneTemplate
  instance?: SceneInstance
  showMaterials?: boolean
}

const SceneFlow = ({ template, instance, showMaterials = true }: SceneFlowProps) => {
  const steps = instance?.flowStatus || template?.steps?.map((step) => ({
    step: step.order,
    title: step.title,
    status: 'pending' as const,
    services: step.services.map((s) => ({ serviceId: s, serviceName: s, status: '待办理' }))
  })) || []

  const materials = instance?.materials || template?.materials || []

  const getStepStatus = (status: string) => {
    if (status === 'completed') return 'finish'
    if (status === 'processing') return 'process'
    return 'wait'
  }

  const getServiceStatusColor = (status: string) => {
    if (status === '已完成') return 'success'
    if (status === '办理中') return 'processing'
    if (status === '已驳回') return 'error'
    return 'default'
  }

  return (
    <div>
      <Card title="事项组合" className="card-shadow" style={{ marginBottom: 16 }}>
        <Steps
          direction="vertical"
          current={steps.findIndex((s) => s.status === 'processing') + 1}
          items={steps.map((step) => ({
            status: getStepStatus(step.status),
            title: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <span style={{ fontWeight: 500 }}>{step.title}</span>
                  {step.status === 'completed' && <Badge status="success" text="已完成" />}
                  {step.status === 'processing' && <Badge status="processing" text="进行中" />}
                  {step.status === 'pending' && <Badge status="default" text="待办理" />}
                </Space>
                {step.time && <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  {dayjs(step.time).format('YYYY-MM-DD HH:mm')}
                </span>}
              </div>
            ),
            description: (
              <div style={{ marginTop: 8 }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <span style={{ color: '#595959', fontSize: 13 }}>包含服务：</span>
                  {step.services.map((service, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#fafafa',
                        borderRadius: 4
                      }}
                    >
                      <Space>
                        <ArrowRightOutlined style={{ color: '#1890ff' }} />
                        <span>{service.serviceName}</span>
                      </Space>
                      <Tag color={getServiceStatusColor(service.status)}>
                        {service.status}
                      </Tag>
                    </div>
                  ))}
                </Space>
              </div>
            )
          }))}
        />
      </Card>

      {showMaterials && materials.length > 0 && (
        <Card title="材料清单" className="card-shadow">
          <List
            dataSource={materials}
            renderItem={(material, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
                  title={
                    <Space>
                      <span>{material.name}</span>
                      {'required' in material && material.required && (
                        <Tag color="red">必填</Tag>
                      )}
                      {'uploaded' in material && material.uploaded && (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      )}
                      {'uploaded' in material && !material.uploaded && (
                        <ClockCircleOutlined style={{ color: '#faad14' }} />
                      )}
                    </Space>
                  }
                  description={
                    'description' in material ? material.description : '请上传相关材料'
                  }
                />
                {'step' in material && (
                  <Tag>步骤 {material.step}</Tag>
                )}
              </List.Item>
            )}
          />
        </Card>
      )}

      {instance && (
        <Card title="流转状态" className="card-shadow" style={{ marginTop: 16 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="当前步骤">
              第 {instance.currentStep} / {instance.totalSteps} 步
            </Descriptions.Item>
            <Descriptions.Item label="整体状态">
              <Tag color={
                instance.status === 'completed' ? 'green' :
                instance.status === 'in_progress' ? 'blue' :
                instance.status === 'rejected' ? 'red' : 'default'
              }>
                {instance.status === 'completed' ? '已完成' :
                 instance.status === 'in_progress' ? '进行中' :
                 instance.status === 'rejected' ? '已驳回' : '待开始'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(instance.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {instance.completedAt && (
              <Descriptions.Item label="完成时间">
                {dayjs(instance.completedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </div>
  )
}

export default SceneFlow
