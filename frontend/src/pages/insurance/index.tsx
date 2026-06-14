import { useState } from 'react'
import { Card, Row, Col, Button, Tag, Tabs, Checkbox, Table, Modal, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  SafetyOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { INSURANCE_TYPES } from '@/utils/constants'

const mockInsuranceProducts = [
  {
    id: '1',
    name: '百万医疗险',
    company: '平安保险',
    type: 'medical',
    price: 299,
    period: '每年',
    coverage: '400万',
    deductible: '1万',
    tags: ['住院医疗', '门诊手术', '重疾绿通'],
    features: ['一般医疗200万', '重疾医疗200万', '住院垫付', '质子重离子'],
    rating: 4.9,
    sales: 125680,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
  },
  {
    id: '2',
    name: '重疾保障计划',
    company: '中国人寿',
    type: 'critical_illness',
    price: 3599,
    period: '每年',
    coverage: '50万',
    deductible: '0',
    tags: ['120种重疾', '多次赔付', '身故保障'],
    features: ['重疾赔付3次', '中症赔付2次', '轻症赔付3次', '身故保障'],
    rating: 4.8,
    sales: 89520,
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=250&fit=crop',
  },
  {
    id: '3',
    name: '综合意外险',
    company: '太平洋保险',
    type: 'accident',
    price: 199,
    period: '每年',
    coverage: '100万',
    deductible: '0',
    tags: ['意外身故', '医疗报销', '交通意外'],
    features: ['意外身故/伤残100万', '意外医疗5万', '住院津贴', '交通意外双倍'],
    rating: 4.7,
    sales: 256890,
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop',
  },
  {
    id: '4',
    name: '终身寿险',
    company: '泰康人寿',
    type: 'life',
    price: 5999,
    period: '每年',
    coverage: '100万',
    deductible: '0',
    tags: ['终身保障', '财富传承', '增额分红'],
    features: ['终身寿险保障', '现金价值递增', '保单贷款', '财富传承'],
    rating: 4.9,
    sales: 45620,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
  },
  {
    id: '5',
    name: '少儿重疾险',
    company: '友邦保险',
    type: 'critical_illness',
    price: 1899,
    period: '每年',
    coverage: '30万',
    deductible: '0',
    tags: ['少儿专属', '白血病双倍', '投保人豁免'],
    features: ['100种重疾', '30种中症', '30种轻症', '白血病双倍赔付'],
    rating: 4.9,
    sales: 67890,
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=250&fit=crop',
  },
  {
    id: '6',
    name: '老人医疗险',
    company: '人保健康',
    type: 'medical',
    price: 899,
    period: '每年',
    coverage: '200万',
    deductible: '2万',
    tags: ['61-80岁', '三高可投', '癌症保障'],
    features: ['癌症医疗200万', '三高糖尿病可投', '住院垫付', '就医绿通'],
    rating: 4.6,
    sales: 34560,
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&h=250&fit=crop',
  },
  {
    id: '7',
    name: '旅游意外险',
    company: '安联保险',
    type: 'accident',
    price: 99,
    period: '每次',
    coverage: '50万',
    deductible: '0',
    tags: ['境内外旅游', '紧急救援', '行李丢失'],
    features: ['意外身故50万', '医疗费用30万', '紧急救援', '行程取消'],
    rating: 4.8,
    sales: 198760,
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop',
  },
  {
    id: '8',
    name: '定期寿险',
    company: '华贵人寿',
    type: 'life',
    price: 1299,
    period: '每年',
    coverage: '100万',
    deductible: '0',
    tags: ['保到60岁', '家庭支柱', '性价比高'],
    features: ['身故/全残100万', '保障到60岁', '健康告知宽松', '保费低廉'],
    rating: 4.9,
    sales: 78960,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
  },
]

const Insurance = () => {
  const navigate = useNavigate()
  const [activeType, setActiveType] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [compareModalVisible, setCompareModalVisible] = useState(false)

  const filteredProducts = activeType === 'all'
    ? mockInsuranceProducts
    : mockInsuranceProducts.filter((p) => p.type === activeType)

  const handleProductSelect = (productId: string, checked: boolean) => {
    if (checked) {
      if (selectedProducts.length >= 3) {
        message.warning('最多只能选择3个产品进行对比')
        return
      }
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId))
    }
  }

  const handleCompare = () => {
    if (selectedProducts.length < 2) {
      message.warning('请至少选择2个产品进行对比')
      return
    }
    setCompareModalVisible(true)
  }

  const tabItems = [
    { key: 'all', label: '全部' },
    ...INSURANCE_TYPES.map((type) => ({ key: type.value, label: type.label })),
  ]

  const compareColumns = [
    {
      title: '对比项',
      dataIndex: 'feature',
      key: 'feature',
      width: 150,
      className: 'bg-gray-50 font-semibold',
    },
    ...selectedProducts.map((productId) => {
      const product = mockInsuranceProducts.find((p) => p.id === productId)
      return {
        title: product?.name,
        dataIndex: productId,
        key: productId,
      }
    }),
  ]

  const compareData = [
    {
      key: '1',
      feature: '保险公司',
      ...Object.fromEntries(selectedProducts.map((id) => {
        const p = mockInsuranceProducts.find((x) => x.id === id)
        return [id, p?.company]
      })),
    },
    {
      key: '2',
      feature: '保费',
      ...Object.fromEntries(selectedProducts.map((id) => {
        const p = mockInsuranceProducts.find((x) => x.id === id)
        return [id, `¥${p?.price}/${p?.period}`]
      })),
    },
    {
      key: '3',
      feature: '保额',
      ...Object.fromEntries(selectedProducts.map((id) => {
        const p = mockInsuranceProducts.find((x) => x.id === id)
        return [id, p?.coverage]
      })),
    },
    {
      key: '4',
      feature: '免赔额',
      ...Object.fromEntries(selectedProducts.map((id) => {
        const p = mockInsuranceProducts.find((x) => x.id === id)
        return [id, p?.deductible]
      })),
    },
    {
      key: '5',
      feature: '评分',
      ...Object.fromEntries(selectedProducts.map((id) => {
        const p = mockInsuranceProducts.find((x) => x.id === id)
        return [id, `★ ${p?.rating}`]
      })),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">保险商城</h2>
        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              已选择 <span className="text-[#1677ff] font-semibold">{selectedProducts.length}</span> 个产品
            </span>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={handleCompare}
              disabled={selectedProducts.length < 2}
            >
              开始对比
            </Button>
            <Button
              onClick={() => setSelectedProducts([])}
            >
              清空选择
            </Button>
          </div>
        )}
      </div>

      <Card className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeType}
          onChange={setActiveType}
          items={tabItems}
          className="px-6 pt-2"
        />
      </Card>

      <Row gutter={[16, 16]}>
        {filteredProducts.map((product) => (
          <Col xs={24} sm={12} lg={6} key={product.id}>
            <Card
              hoverable
              cover={
                <div className="relative">
                  <img
                    alt={product.name}
                    src={product.image}
                    className="h-40 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => handleProductSelect(product.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      对比
                    </Checkbox>
                  </div>
                </div>
              }
              className="cursor-pointer"
              onClick={() => navigate(`/insurance/${product.id}`)}
            >
              <Card.Meta
                title={
                  <div className="flex items-start justify-between">
                    <span className="font-semibold">{product.name}</span>
                    <span className="text-sm text-yellow-500">★ {product.rating}</span>
                  </div>
                }
                description={
                  <div className="space-y-2 mt-2">
                    <p className="text-gray-500 text-sm">{product.company}</p>
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map((tag, index) => (
                        <Tag key={index} color="green">{tag}</Tag>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-[#f5222d]">¥{product.price}</span>
                        <span className="text-gray-500 text-sm">/{product.period}</span>
                      </div>
                      <span className="text-gray-400 text-sm">保额 {product.coverage}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <CheckCircleOutlined className="text-[#52c41a]" />
                        <span>{product.features[0]}</span>
                      </div>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <SafetyOutlined className="text-6xl mb-4 opacity-30" />
          <p className="text-lg">暂无该类型的保险产品</p>
          <p className="text-sm mt-2">请尝试选择其他类型</p>
        </div>
      )}

      <Modal
        title="产品对比"
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setCompareModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <Table
          columns={compareColumns}
          dataSource={compareData}
          pagination={false}
          bordered
        />
      </Modal>
    </div>
  )
}

export default Insurance
