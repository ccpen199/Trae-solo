import React, { useState } from 'react'
import {
  Typography,
  Card,
  Tabs,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Table,
  Drawer,
  Descriptions,
  Statistic,
  Timeline,
  Avatar,
  List,
  Empty
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  FileProtectOutlined,
  IdcardOutlined,
  TeamOutlined,
  HomeOutlined,
  ShopOutlined,
  BookOutlined,
  HeartOutlined,
  CarOutlined,
  GiftOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'

const { Title } = Typography
const { Option } = Select

const certificateCategories = [
  { key: 'all', name: '全部', icon: <AppstoreOutlined /> },
  { key: 'identity', name: '身份证件类', icon: <IdcardOutlined /> },
  { key: 'social', name: '社会保障类', icon: <TeamOutlined /> },
  { key: 'housing', name: '住房保障类', icon: <HomeOutlined /> },
  { key: 'enterprise', name: '企业登记类', icon: <ShopOutlined /> },
  { key: 'education', name: '教育证明类', icon: <BookOutlined /> },
  { key: 'health', name: '医疗卫生类', icon: <HeartOutlined /> },
  { key: 'traffic', name: '交通出行类', icon: <CarOutlined /> },
  { key: 'welfare', name: '社会福利类', icon: <GiftOutlined /> },
  { key: 'other', name: '其他', icon: <AppstoreOutlined /> }
]

const certificateTypes = [
  { id: 1, name: '居民身份证', category: 'identity', dept: '公安局', count: 6854320, status: 'active', icon: 'idcard' },
  { id: 2, name: '户口簿', category: 'identity', dept: '公安局', count: 2156780, status: 'active', icon: 'book' },
  { id: 3, name: '护照', category: 'identity', dept: '出入境管理局', count: 892340, status: 'active', icon: 'global' },
  { id: 4, name: '驾驶证', category: 'traffic', dept: '交通管理局', count: 3421560, status: 'active', icon: 'car' },
  { id: 5, name: '行驶证', category: 'traffic', dept: '交通管理局', count: 4532100, status: 'active', icon: 'car' },
  { id: 6, name: '营业执照', category: 'enterprise', dept: '市场监督管理局', count: 756890, status: 'active', icon: 'shop' },
  { id: 7, name: '不动产权证', category: 'housing', dept: '自然资源局', count: 1892340, status: 'active', icon: 'home' },
  { id: 8, name: '社会保障卡', category: 'social', dept: '人力资源和社会保障厅', count: 5678230, status: 'active', icon: 'team' },
  { id: 9, name: '医保卡', category: 'health', dept: '医疗保障局', count: 5432100, status: 'active', icon: 'hospital' },
  { id: 10, name: '结婚证', category: 'identity', dept: '民政局', count: 3421560, status: 'active', icon: 'heart' },
  { id: 11, name: '离婚证', category: 'identity', dept: '民政局', count: 876540, status: 'active', icon: 'close' },
  { id: 12, name: '出生医学证明', category: 'health', dept: '卫生健康委员会', count: 1234560, status: 'active', icon: 'baby' },
  { id: 13, name: '死亡证明', category: 'health', dept: '卫生健康委员会', count: 567890, status: 'active', icon: 'exclamation' },
  { id: 14, name: '学历证书', category: 'education', dept: '教育厅', count: 2345670, status: 'active', icon: 'book' },
  { id: 15, name: '学位证书', category: 'education', dept: '教育厅', count: 1234560, status: 'active', icon: 'trophy' },
  { id: 16, name: '教师资格证', category: 'education', dept: '教育厅', count: 345670, status: 'active', icon: 'usergroup' },
  { id: 17, name: '医师资格证', category: 'health', dept: '卫生健康委员会', count: 89230, status: 'active', icon: 'medicine' },
  { id: 18, name: '护士执业证', category: 'health', dept: '卫生健康委员会', count: 123450, status: 'active', icon: 'medicine' },
  { id: 19, name: '食品经营许可证', category: 'enterprise', dept: '市场监督管理局', count: 234560, status: 'active', icon: 'shop' },
  { id: 20, name: '餐饮服务许可证', category: 'enterprise', dept: '市场监督管理局', count: 156780, status: 'active', icon: 'coffee' },
  { id: 21, name: '建筑工程施工许可证', category: 'housing', dept: '住房和城乡建设厅', count: 45670, status: 'active', icon: 'build' },
  { id: 22, name: '商品房预售许可证', category: 'housing', dept: '住房和城乡建设厅', count: 23450, status: 'active', icon: 'home' },
  { id: 23, name: '低保证', category: 'welfare', dept: '民政局', count: 345670, status: 'active', icon: 'gift' },
  { id: 24, name: '特困人员救助供养证', category: 'welfare', dept: '民政局', count: 78900, status: 'active', icon: 'gift' },
  { id: 25, name: '残疾人证', category: 'welfare', dept: '残疾人联合会', count: 234560, status: 'active', icon: 'user' },
  { id: 26, name: '老年优待证', category: 'welfare', dept: '卫生健康委员会', count: 890120, status: 'active', icon: 'user' },
  { id: 27, name: '失业保险金领取证', category: 'social', dept: '人力资源和社会保障厅', count: 123450, status: 'active', icon: 'team' },
  { id: 28, name: '养老保险待遇领取证', category: 'social', dept: '人力资源和社会保障厅', count: 987650, status: 'active', icon: 'team' },
  { id: 29, name: '道路运输经营许可证', category: 'traffic', dept: '交通运输厅', count: 56780, status: 'active', icon: 'truck' },
  { id: 30, name: '出租车从业资格证', category: 'traffic', dept: '交通运输厅', count: 34560, status: 'active', icon: 'car' },
  { id: 31, name: '烟花爆竹经营许可证', category: 'other', dept: '应急管理厅', count: 12340, status: 'inactive', icon: 'fire' },
  { id: 32, name: '特种作业操作证', category: 'other', dept: '应急管理厅', count: 67890, status: 'active', icon: 'tool' }
]

const mockCertQueryData = [
  { key: '1', certNo: '640104********0011', certType: '居民身份证', holder: '张**', idCard: '640104********0011', issueDept: '银川市公安局', issueDate: '2020-05-20', validDate: '2040-05-19', status: '有效' },
  { key: '2', certNo: '640104********0022', certType: '社会保障卡', holder: '李**', idCard: '640104********0022', issueDept: '宁夏回族自治区人力资源和社会保障厅', issueDate: '2019-03-15', validDate: '2029-03-14', status: '有效' },
  { key: '3', certNo: '宁(2023)银川市不动产权第0012345号', certType: '不动产权证', holder: '王**', idCard: '640104********0033', issueDept: '银川市自然资源局', issueDate: '2023-08-10', validDate: '长期', status: '有效' },
  { key: '4', certNo: '91640000********12', certType: '营业执照', holder: '宁夏****有限公司', idCard: '-', issueDept: '宁夏回族自治区市场监督管理厅', issueDate: '2022-06-01', validDate: '2042-05-31', status: '有效' },
  { key: '5', certNo: '640104********0055', certType: '驾驶证', holder: '赵**', idCard: '640104********0055', issueDept: '银川市公安局交通警察支队', issueDate: '2018-11-20', validDate: '2028-11-19', status: '有效' },
  { key: '6', certNo: '640104********0066', certType: '医保卡', holder: '孙**', idCard: '640104********0066', issueDept: '银川市医疗保障局', issueDate: '2021-04-10', validDate: '长期', status: '已挂失' },
  { key: '7', certNo: '640104********0077', certType: '结婚证', holder: '周**', idCard: '640104********0077', issueDept: '银川市兴庆区民政局', issueDate: '2020-10-01', validDate: '长期', status: '有效' },
  { key: '8', certNo: '640104********0088', certType: '出生医学证明', holder: '吴**', idCard: '-', issueDept: '银川市妇幼保健院', issueDate: '2023-12-25', validDate: '长期', status: '有效' }
]

const mockAuditData = [
  { key: '1', time: '2024-06-14 14:32:15', caller: '银川市政务服务中心', method: 'API接口', certType: '居民身份证', holder: '张**', fields: '姓名,身份证号,照片', purpose: '业务办理身份核验', ip: '10.0.1.23', status: '成功' },
  { key: '2', time: '2024-06-14 14:28:42', caller: '宁夏社保服务平台', method: 'API接口', certType: '社会保障卡', holder: '李**', fields: '社保编号,缴费记录', purpose: '社保业务查询', ip: '10.0.2.45', status: '成功' },
  { key: '3', time: '2024-06-14 14:25:10', caller: '银川市不动产登记中心', method: '系统直连', certType: '不动产权证', holder: '王**', fields: '权利人,坐落,面积', purpose: '不动产交易核验', ip: '10.0.3.67', status: '成功' },
  { key: '4', time: '2024-06-14 14:20:33', caller: '宁夏企业登记系统', method: 'API接口', certType: '营业执照', holder: '宁夏****公司', fields: '企业名称,统一社会信用代码,法定代表人', purpose: '企业资质核验', ip: '10.0.4.89', status: '成功' },
  { key: '5', time: '2024-06-14 14:15:56', caller: '银川市公安局交管支队', method: '系统直连', certType: '驾驶证', holder: '赵**', fields: '驾驶证号,准驾车型,有效期', purpose: '交通违法处理', ip: '10.0.5.12', status: '成功' },
  { key: '6', time: '2024-06-14 14:10:28', caller: '某第三方应用', method: 'API接口', certType: '居民身份证', holder: '孙**', fields: '姓名,身份证号,住址', purpose: '用户实名认证', ip: '112.34.56.78', status: '拒绝' },
  { key: '7', time: '2024-06-14 14:05:15', caller: '银川市医保中心', method: 'API接口', certType: '医保卡', holder: '周**', fields: '医保卡号,参保状态', purpose: '医保报销核验', ip: '10.0.6.34', status: '成功' },
  { key: '8', time: '2024-06-14 14:00:42', caller: '宁夏教育资源平台', method: 'API接口', certType: '学历证书', holder: '吴**', fields: '毕业院校,专业,学历', purpose: '教育服务认证', ip: '10.0.7.56', status: '成功' },
  { key: '9', time: '2024-06-14 13:55:20', caller: '银川市民政局', method: '系统直连', certType: '结婚证', holder: '郑**', fields: '夫妻双方信息,登记日期', purpose: '婚姻状况核验', ip: '10.0.8.78', status: '成功' },
  { key: '10', time: '2024-06-14 13:50:10', caller: '某互联网平台', method: 'API接口', certType: '居民身份证', holder: '冯**', fields: '姓名,身份证号,照片', purpose: '用户注册认证', ip: '123.45.67.89', status: '拒绝' }
]

const mockVerifyData = [
  { key: '1', time: '2024-06-14 15:30:25', verifier: '银川市政务服务中心', certNo: '640104********0011', certType: '居民身份证', method: '二维码扫码', result: '通过' },
  { key: '2', time: '2024-06-14 15:25:10', verifier: '银川市不动产登记中心', certNo: '宁(2023)银川市不动产权第0012345号', certType: '不动产权证', method: '证照编号查询', result: '通过' },
  { key: '3', time: '2024-06-14 15:20:45', verifier: '某银行营业厅', certNo: '91640000********12', certType: '营业执照', method: '二维码扫码', result: '通过' },
  { key: '4', time: '2024-06-14 15:15:30', verifier: '银川市人社局', certNo: '640104********0022', certType: '社会保障卡', method: '身份证查询', result: '通过' },
  { key: '5', time: '2024-06-14 15:10:18', verifier: '某酒店前台', certNo: '640104********0033', certType: '居民身份证', method: '二维码扫码', result: '不通过' },
  { key: '6', time: '2024-06-14 15:05:55', verifier: '银川市车管所', certNo: '640104********0055', certType: '驾驶证', method: '证照编号查询', result: '通过' },
  { key: '7', time: '2024-06-14 15:00:42', verifier: '某医疗机构', certNo: '640104********0066', certType: '医保卡', method: '二维码扫码', result: '通过' },
  { key: '8', time: '2024-06-14 14:55:30', verifier: '银川市教育局', certNo: '640104********0088', certType: '学历证书', method: '证照编号查询', result: '通过' },
  { key: '9', time: '2024-06-14 14:50:15', verifier: '某企业HR', certNo: '640104********0099', certType: '学位证书', method: '二维码扫码', result: '不通过' },
  { key: '10', time: '2024-06-14 14:45:00', verifier: '银川市民政局', certNo: '640104********0077', certType: '结婚证', method: '身份证查询', result: '通过' }
]

const deptVerifyRank = [
  { name: '银川市政务服务中心', count: 1256 },
  { name: '银川市不动产登记中心', count: 892 },
  { name: '银川市市场监督管理局', count: 756 },
  { name: '银川市人社局', count: 634 },
  { name: '银川市医疗保障局', count: 521 },
  { name: '银川市公安局', count: 489 },
  { name: '银川市住房和城乡建设局', count: 378 },
  { name: '银川市教育局', count: 267 }
]

const Certificates: React.FC = () => {
  const [activeTab, setActiveTab] = useState('catalog')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedCert, setSelectedCert] = useState<any>(null)

  const filteredCerts = certificateTypes.filter((cert) => {
    const matchCategory = selectedCategory === 'all' || cert.category === selectedCategory
    const matchSearch = !searchText || cert.name.includes(searchText) || cert.dept.includes(searchText)
    return matchCategory && matchSearch
  })

  const handleCertClick = (cert: any) => {
    setSelectedCert(cert)
    setDetailVisible(true)
  }

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default'
  }

  const getStatusText = (status: string) => {
    return status === 'active' ? '在用' : '停用'
  }

  const catalogTabContent = (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space wrap>
          {certificateCategories.map((cat) => (
            <Tag
              key={cat.key}
              color={selectedCategory === cat.key ? 'blue' : 'default'}
              style={{
                cursor: 'pointer',
                padding: '4px 12px',
                fontSize: 13,
                borderRadius: 4,
                border: selectedCategory === cat.key ? '1px solid #0958d9' : '1px solid #d9d9d9'
              }}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.icon} {cat.name}
            </Tag>
          ))}
        </Space>
        <Input
          placeholder="搜索证照名称或发证部门"
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>
      <Row gutter={[16, 16]}>
        {filteredCerts.map((cert) => (
          <Col span={6} key={cert.id}>
            <Card
              hoverable
              onClick={() => handleCertClick(cert)}
              style={{
                borderRadius: 8,
                border: '1px solid #e8e8e8',
                transition: 'all 0.3s'
              }}
              styles={{ body: { padding: 16 } }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                <Avatar
                  size={48}
                  style={{
                    backgroundColor: '#e6f4ff',
                    color: '#0958d9',
                    marginRight: 12
                  }}
                  icon={<SafetyCertificateOutlined style={{ fontSize: 24 }} />}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 15,
                      color: '#262626',
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cert.name}
                  </div>
                  <Tag color={getStatusColor(cert.status)} style={{ margin: 0 }}>
                    {getStatusText(cert.status)}
                  </Tag>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                发证部门：{cert.dept}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 8,
                  borderTop: '1px solid #f0f0f0'
                }}
              >
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>累计制证量</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#0958d9' }}>
                  {(cert.count / 10000).toFixed(1)}万
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      {filteredCerts.length === 0 && (
        <Empty description="暂无匹配的证照类型" style={{ margin: '60px 0' }} />
      )}
    </div>
  )

  const queryTabContent = (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>持证人姓名</div>
            <Input placeholder="请输入持证人姓名" allowClear />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>身份证号</div>
            <Input placeholder="请输入身份证号" allowClear />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>证照类型</div>
            <Select placeholder="请选择证照类型" style={{ width: '100%' }} allowClear>
              <Option value="idcard">居民身份证</Option>
              <Option value="social">社会保障卡</Option>
              <Option value="house">不动产权证</Option>
              <Option value="business">营业执照</Option>
              <Option value="driver">驾驶证</Option>
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>证照编号</div>
            <Input placeholder="请输入证照编号" allowClear />
          </Col>
        </Row>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button>重置</Button>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
          </Space>
        </div>
      </Card>
      <Card>
        <Table
          columns={[
            { title: '证照编号', dataIndex: 'certNo', key: 'certNo', width: 200 },
            { title: '证照类型', dataIndex: 'certType', key: 'certType', width: 120 },
            { title: '持证人', dataIndex: 'holder', key: 'holder', width: 100 },
            { title: '发证机关', dataIndex: 'issueDept', key: 'issueDept' },
            { title: '发证日期', dataIndex: 'issueDate', key: 'issueDate', width: 110 },
            { title: '有效期至', dataIndex: 'validDate', key: 'validDate', width: 110 },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              width: 80,
              render: (text: string) => (
                <Tag color={text === '有效' ? 'success' : 'warning'}>{text}</Tag>
              )
            },
            {
              title: '操作',
              key: 'action',
              width: 180,
              render: () => (
                <Space size="small">
                  <Button type="link" size="small" icon={<EyeOutlined />}>
                    查看详情
                  </Button>
                  <Button type="link" size="small" icon={<SafetyCertificateOutlined />}>
                    证照验真
                  </Button>
                  <Button type="link" size="small" icon={<HistoryOutlined />}>
                    调用记录
                  </Button>
                </Space>
              )
            }
          ]}
          dataSource={mockCertQueryData}
          pagination={{ pageSize: 10, total: 128, showSizeChanger: true }}
        />
      </Card>
    </div>
  )

  const auditTabContent = (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日调用量"
              value={2856}
              prefix={<EyeOutlined style={{ color: '#0958d9' }} />}
              valueStyle={{ color: '#0958d9' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计调用量"
              value={1258634}
              prefix={<FileProtectOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="授权调用"
              value={1245320}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>次</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="拒绝调用"
              value={13314}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>次</span>}
            />
          </Card>
        </Col>
      </Row>
      <Card style={{ marginBottom: 16 }}>
        <ReactECharts
          option={{
            title: {
              text: '近7天调用趋势',
              left: 'left',
              textStyle: { fontSize: 14, fontWeight: 500 }
            },
            tooltip: {
              trigger: 'axis'
            },
            legend: {
              data: ['调用量', '成功量', '拒绝量'],
              top: 0,
              right: 0
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              top: '15%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              boundaryGap: false,
              data: ['6月8日', '6月9日', '6月10日', '6月11日', '6月12日', '6月13日', '6月14日']
            },
            yAxis: {
              type: 'value'
            },
            series: [
              {
                name: '调用量',
                type: 'line',
                smooth: true,
                data: [2100, 2350, 2580, 2420, 2650, 2780, 2856],
                itemStyle: { color: '#0958d9' },
                areaStyle: {
                  color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(9, 88, 217, 0.3)' },
                      { offset: 1, color: 'rgba(9, 88, 217, 0.05)' }
                    ]
                  }
                }
              },
              {
                name: '成功量',
                type: 'line',
                smooth: true,
                data: [2050, 2280, 2510, 2360, 2590, 2720, 2790],
                itemStyle: { color: '#52c41a' }
              },
              {
                name: '拒绝量',
                type: 'line',
                smooth: true,
                data: [50, 70, 70, 60, 60, 60, 66],
                itemStyle: { color: '#ff4d4f' }
              }
            ]
          }}
          style={{ height: 280 }}
        />
      </Card>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input placeholder="调用方名称" style={{ width: 180 }} allowClear />
            <Select placeholder="证照类型" style={{ width: 150 }} allowClear>
              <Option value="idcard">居民身份证</Option>
              <Option value="social">社会保障卡</Option>
              <Option value="business">营业执照</Option>
            </Select>
            <Select placeholder="操作类型" style={{ width: 120 }} allowClear>
              <Option value="query">查询</Option>
              <Option value="verify">验真</Option>
              <Option value="download">下载</Option>
            </Select>
            <Select placeholder="调用状态" style={{ width: 120 }} allowClear>
              <Option value="success">成功</Option>
              <Option value="fail">拒绝</Option>
            </Select>
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            <Button icon={<ReloadOutlined />}>重置</Button>
          </Space>
        </div>
        <Table
          columns={[
            { title: '调用时间', dataIndex: 'time', key: 'time', width: 170 },
            { title: '调用方', dataIndex: 'caller', key: 'caller', width: 160 },
            { title: '调用方式', dataIndex: 'method', key: 'method', width: 100 },
            { title: '证照类型', dataIndex: 'certType', key: 'certType', width: 100 },
            { title: '持证人', dataIndex: 'holder', key: 'holder', width: 80 },
            { title: '调用字段', dataIndex: 'fields', key: 'fields' },
            { title: '用途', dataIndex: 'purpose', key: 'purpose', width: 140 },
            { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 120 },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              width: 80,
              render: (text: string) => (
                <Tag color={text === '成功' ? 'success' : 'error'}>{text}</Tag>
              )
            }
          ]}
          dataSource={mockAuditData}
          pagination={{ pageSize: 10, total: 2568, showSizeChanger: true }}
        />
      </Card>
    </div>
  )

  const verifyTabContent = (
    <div>
      <Row gutter={16}>
        <Col span={16}>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Card style={{ textAlign: 'center', background: '#f0f7ff' }}>
                  <Statistic
                    title="总验真次数"
                    value={8532}
                    valueStyle={{ color: '#0958d9' }}
                    suffix={<span style={{ fontSize: 14 }}>次</span>}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ textAlign: 'center', background: '#f6ffed' }}>
                  <Statistic
                    title="通过次数"
                    value={8284}
                    valueStyle={{ color: '#52c41a' }}
                    suffix={<span style={{ fontSize: 14 }}>次</span>}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ textAlign: 'center', background: '#fff2f0' }}>
                  <Statistic
                    title="通过率"
                    value={97.1}
                    precision={1}
                    valueStyle={{ color: '#52c41a' }}
                    suffix={<span style={{ fontSize: 14 }}>%</span>}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
          <Card title="验真记录">
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Input placeholder="证照编号/验证人" style={{ width: 200 }} allowClear />
                <Select placeholder="验真结果" style={{ width: 120 }} allowClear>
                  <Option value="pass">通过</Option>
                  <Option value="fail">不通过</Option>
                </Select>
                <Select placeholder="验真方式" style={{ width: 140 }} allowClear>
                  <Option value="qrcode">二维码扫码</Option>
                  <Option value="no">证照编号查询</Option>
                  <Option value="idcard">身份证查询</Option>
                </Select>
                <Button type="primary" icon={<SearchOutlined />}>查询</Button>
              </Space>
            </div>
            <Table
              columns={[
                { title: '验真时间', dataIndex: 'time', key: 'time', width: 170 },
                { title: '验证方', dataIndex: 'verifier', key: 'verifier', width: 180 },
                { title: '证照编号', dataIndex: 'certNo', key: 'certNo' },
                { title: '证照类型', dataIndex: 'certType', key: 'certType', width: 110 },
                { title: '验真方式', dataIndex: 'method', key: 'method', width: 110 },
                {
                  title: '验真结果',
                  dataIndex: 'result',
                  key: 'result',
                  width: 90,
                  render: (text: string) => (
                    <Tag
                      icon={text === '通过' ? <CheckOutlined /> : <CloseOutlined />}
                      color={text === '通过' ? 'success' : 'error'}
                    >
                      {text}
                    </Tag>
                  )
                }
              ]}
              dataSource={mockVerifyData}
              pagination={{ pageSize: 10, total: 856, showSizeChanger: true }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="各部门验真量排行">
            <List
              dataSource={deptVerifyRank}
              renderItem={(item, index) => (
                <List.Item>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: index < 3 ? '#0958d9' : '#d9d9d9',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        marginRight: 12,
                        flexShrink: 0
                      }}
                    >
                      {index + 1}
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </span>
                    <span style={{ fontWeight: 600, color: '#0958d9' }}>{item.count}</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )

  const tabItems = [
    { key: 'catalog', label: '证照目录', children: catalogTabContent },
    { key: 'query', label: '证照查询', children: queryTabContent },
    { key: 'audit', label: '调用审计', children: auditTabContent },
    { key: 'verify', label: '验真记录', children: verifyTabContent }
  ]

  return (
    <div>
      <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
        电子证照库管理
      </Title>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          style={{ marginBottom: 16 }}
        />
      </Card>

      <Drawer
        title="证照详情"
        placement="right"
        width={640}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedCert && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
              <Avatar
                size={64}
                style={{
                  backgroundColor: '#e6f4ff',
                  color: '#0958d9',
                  marginRight: 16
                }}
                icon={<SafetyCertificateOutlined style={{ fontSize: 32 }} />}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: 20, color: '#262626' }}>{selectedCert.name}</h3>
                <Tag color={getStatusColor(selectedCert.status)} style={{ marginTop: 8 }}>
                  {getStatusText(selectedCert.status)}
                </Tag>
              </div>
            </div>

            <Descriptions title="基本信息" column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="证照类型">{selectedCert.name}</Descriptions.Item>
              <Descriptions.Item label="发证部门">{selectedCert.dept}</Descriptions.Item>
              <Descriptions.Item label="累计制证量">{selectedCert.count.toLocaleString()} 张</Descriptions.Item>
              <Descriptions.Item label="证照类别">
                {certificateCategories.find((c) => c.key === selectedCert.category)?.name}
              </Descriptions.Item>
              <Descriptions.Item label="启用状态">
                <Tag color={getStatusColor(selectedCert.status)}>{getStatusText(selectedCert.status)}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12, color: '#262626' }}>字段定义</h4>
              <Card size="small">
                <Row gutter={[8, 8]}>
                  {['证照编号', '持证人姓名', '身份证号', '发证机关', '发证日期', '有效期至', '照片', '证件状态'].map(
                    (field) => (
                      <Col span={8} key={field}>
                        <Tag color="blue" style={{ width: '100%', textAlign: 'center', margin: 0 }}>
                          {field}
                        </Tag>
                      </Col>
                    )
                  )}
                </Row>
              </Card>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12, color: '#262626' }}>制证流程</h4>
              <Card size="small">
                <Timeline
                  items={[
                    { color: 'blue', children: '业务受理 - 申请人提交申请材料' },
                    { color: 'blue', children: '材料审核 - 相关部门审核材料完整性' },
                    { color: 'blue', children: '信息核验 - 核验申请人身份信息' },
                    { color: 'blue', children: '证照制作 - 生成电子证照并签章' },
                    { color: 'green', children: '证照发放 - 推送至持证人电子证照包' }
                  ]}
                />
              </Card>
            </div>

            <div>
              <h4 style={{ marginBottom: 12, color: '#262626' }}>样例展示</h4>
              <Card
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f7ff 100%)',
                  border: '1px solid #91caff'
                }}
              >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <SafetyCertificateOutlined style={{ fontSize: 48, color: '#0958d9', marginBottom: 12 }} />
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#0958d9' }}>
                    {selectedCert.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>
                    （样例展示）
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default Certificates
