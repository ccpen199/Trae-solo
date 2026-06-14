import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Collapse,
  Input,
  Button,
  Space,
  Typography,
  message,
  Empty,
  Skeleton,
  Tag,
  List,
  Tooltip,
  Menu,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  LikeOutlined,
  DislikeOutlined,
  QuestionCircleOutlined,
  FireOutlined,
  LinkOutlined,
  FileTextOutlined,
  TeamOutlined,
  AppstoreOutlined,
  BookOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useRequest from '../../hooks/useRequest';
import { getFaqs, getFaqAutoAttribution, submitFaqFeedback } from '../../api/policy';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Panel } = Collapse;

const faqCategories = [
  { key: 'all', label: '全部问题', icon: <UnorderedListOutlined /> },
  { key: 'insurance', label: '社保类', icon: <FileTextOutlined /> },
  { key: 'employment', label: '就业类', icon: <TeamOutlined /> },
  { key: 'exam', label: '考试类', icon: <AppstoreOutlined /> },
  { key: 'training', label: '培训类', icon: <BookOutlined /> },
  { key: 'other', label: '其他', icon: <QuestionCircleOutlined /> },
];

const mockFaqs = [
  {
    id: 1,
    category: 'insurance',
    categoryName: '社保',
    question: '养老保险缴费年限不够15年怎么办？',
    answer: '达到法定退休年龄时累计缴费不足15年的，可以：\n\n1. **延长缴费至满15年**：按月领取基本养老金\n2. **转入城乡居民养老保险**：按照国务院规定享受相应的养老保险待遇\n3. **一次性领取个人账户储存额**：终止职工基本养老保险关系\n\n建议优先选择延长缴费，这样可以领取更高的养老金待遇。',
    likes: 256,
    dislikes: 12,
    views: 8956,
    feedback: null,
    attribution: {
      policyId: 1,
      policyTitle: '关于完善企业职工基本养老保险制度的实施意见',
    },
  },
  {
    id: 2,
    category: 'insurance',
    categoryName: '社保',
    question: '社保卡丢失了怎么补办？',
    answer: '社保卡丢失补办流程：\n\n**一、线上补办**\n1. 打开"掌上12333"APP或当地社保APP\n2. 找到"社保卡服务"模块\n3. 选择"补换卡申请"\n4. 填写相关信息并提交\n5. 等待邮寄送达\n\n**二、线下补办**\n1. 携带身份证到社保卡服务网点\n2. 填写《社保卡补换卡申请表》\n3. 缴纳工本费（一般20-30元）\n4. 即时领取或等待邮寄\n\n**三、注意事项**\n1. 丢失后请及时挂失，避免被盗刷\n2. 补办期间可使用电子社保卡\n3. 新卡激活后旧卡自动失效',
    likes: 189,
    dislikes: 8,
    views: 7523,
    feedback: null,
    attribution: {
      policyId: 3,
      policyTitle: '关于社会保障卡管理服务的实施办法',
    },
  },
  {
    id: 3,
    category: 'employment',
    categoryName: '就业',
    question: '失业后可以领取哪些补贴？',
    answer: '失业人员可以申领以下待遇：\n\n**一、失业保险金**\n- 条件：失业前累计缴费满1年、非因本人意愿中断就业、已办理失业登记\n- 标准：当地最低工资的80%-90%\n- 期限：12-24个月\n\n**二、失业补助金**\n- 条件：领取失业保险金期满仍未就业、或参保不足1年、或参保满1年但因本人原因解除劳动合同\n- 标准：不超过当地失业保险金的80%\n- 期限：最长6个月\n\n**三、技能提升补贴**\n- 条件：参保满1年、取得职业资格证书\n- 标准：初级1000元、中级1500元、高级2000元\n\n**四、价格临时补贴**\n- 条件：物价涨幅达到规定条件\n- 标准：按月发放',
    likes: 342,
    dislikes: 15,
    views: 12580,
    feedback: null,
    attribution: {
      policyId: 2,
      policyTitle: '关于优化营商环境进一步促进就业创业的通知',
    },
  },
  {
    id: 4,
    category: 'employment',
    categoryName: '就业',
    question: '灵活就业社保补贴怎么申请？',
    answer: '灵活就业社保补贴申请指南：\n\n**一、申请条件**\n1. 就业困难人员或离校2年内未就业高校毕业生\n2. 实现灵活就业并办理就业登记\n3. 以个人身份缴纳社会保险费\n\n**二、补贴标准**\n- 按实际缴费的2/3给予补贴\n- 补贴期限最长不超过3年\n- 对初次核定享受补贴政策时距退休年龄不足5年的人员，可延长至退休\n\n**三、申请材料**\n1. 身份证\n2. 就业失业登记证\n3. 社会保险缴费凭证\n4. 灵活就业证明\n\n**四、办理流程**\n1. 向社区（村）人社服务站提出申请\n2. 街道（乡镇）人社所审核\n3. 区（县）人社部门审批\n4. 公示无异议后拨付补贴',
    likes: 278,
    dislikes: 9,
    views: 9876,
    feedback: null,
    attribution: {
      policyId: 5,
      policyTitle: '关于加强技能人才队伍建设的实施办法',
    },
  },
  {
    id: 5,
    category: 'exam',
    categoryName: '考试',
    question: '一级建造师报考条件是什么？',
    answer: '一级建造师报考条件：\n\n**一、基本条件**\n凡遵守国家法律、法规，具备下列条件之一者，可以申请参加一级建造师执业资格考试：\n\n1. 取得工程类或工程经济类大学专科学历，工作满6年，其中从事建设工程项目施工管理工作满4年\n2. 取得工程类或工程经济类大学本科学历，工作满4年，其中从事建设工程项目施工管理工作满3年\n3. 取得工程类或工程经济类双学士学位或研究生班毕业，工作满3年，其中从事建设工程项目施工管理工作满2年\n4. 取得工程类或工程经济类硕士学位，工作满2年，其中从事建设工程项目施工管理工作满1年\n5. 取得工程类或工程经济类博士学位，从事建设工程项目施工管理工作满1年\n\n**二、免试条件**\n符合上述报名条件，于2003年12月31日前，取得建设部颁发的《建筑业企业一级项目经理资质证书》，并符合下列条件之一的人员，可免试《建设工程经济》和《建设工程项目管理》2个科目：\n1. 受聘担任工程或工程经济类高级专业技术职务\n2. 具有工程类或工程经济类大学专科以上学历并从事建设工程项目施工管理工作满20年',
    likes: 198,
    dislikes: 6,
    views: 6543,
    feedback: null,
    attribution: {
      policyId: 4,
      policyTitle: '关于做好2024年度人事考试工作的通知',
    },
  },
  {
    id: 6,
    category: 'exam',
    categoryName: '考试',
    question: '公务员考试报名流程是怎样的？',
    answer: '公务员考试报名流程：\n\n**一、查询招考公告**\n- 发布时间：国考一般10月中旬，省考各地时间不同\n- 发布渠道：国家公务员局官网、各地人事考试网\n\n**二、网上报名**\n1. 注册账号\n2. 填写个人信息\n3. 选择职位\n4. 提交报名申请\n\n**三、资格审查**\n- 报名后48小时内出审查结果\n- 审查不通过可改报其他职位\n\n**四、报名确认**\n- 通过资格审查后进行报名确认\n- 上传照片\n- 缴纳考试费用\n\n**五、打印准考证**\n- 考前一周左右打印\n- 需准备好准考证和身份证参加考试\n\n**六、参加考试**\n- 公共科目：行政职业能力测验、申论\n- 专业科目：部分职位需要考',
    likes: 267,
    dislikes: 11,
    views: 8765,
    feedback: null,
    attribution: {
      policyId: 4,
      policyTitle: '关于做好2024年度人事考试工作的通知',
    },
  },
  {
    id: 7,
    category: 'training',
    categoryName: '培训',
    question: '技能提升补贴怎么申请？',
    answer: '技能提升补贴申请指南：\n\n**一、申请条件**\n1. 依法参加失业保险，累计缴纳失业保险费12个月（含12个月）以上的\n2. 自2017年1月1日起取得初级（五级）、中级（四级）、高级（三级）职业资格证书或职业技能等级证书的\n\n**二、补贴标准**\n- 初级（五级）：1000元\n- 中级（四级）：1500元\n- 高级（三级）：2000元\n- 纳入当地急需紧缺职业（工种）目录的，补贴标准可上浮不超过50%\n\n**三、申请材料**\n1. 身份证\n2. 职业资格证书或职业技能等级证书\n3. 失业保险经办机构要求的其他材料\n\n**四、办理流程**\n1. 职工应在职业资格证书或职业技能等级证书核发之日起12个月内申请\n2. 到参保地失业保险经办机构或通过线上渠道申请\n3. 经办机构审核通过后直接发放至申请人银行账户',
    likes: 312,
    dislikes: 8,
    views: 10234,
    feedback: null,
    attribution: {
      policyId: 5,
      policyTitle: '关于加强技能人才队伍建设的实施办法',
    },
  },
  {
    id: 8,
    category: 'training',
    categoryName: '培训',
    question: '职业技能培训有哪些补贴政策？',
    answer: '职业技能培训补贴政策：\n\n**一、培训补贴对象**\n1. 贫困家庭子女\n2. 毕业年度高校毕业生\n3. 城乡未继续升学的应届初高中毕业生\n4. 农村转移就业劳动者\n5. 城镇登记失业人员\n6. 企业职工\n\n**二、补贴标准**\n- 职业技能培训补贴：每人每年最高不超过3次\n- 同一职业（工种）同一等级只能申请并享受一次\n- 具体标准根据培训时长、职业（工种）等确定，一般在500-3000元之间\n\n**三、生活费补贴**\n- 对重点群体参加培训期间给予生活费补贴\n- 补贴标准由各地确定，一般不超过当地最低工资标准的80%\n\n**四、申请流程**\n1. 选择定点培训机构参加培训\n2. 培训合格后取得证书\n3. 向当地人社部门申请补贴\n4. 审核通过后拨付至个人银行账户',
    likes: 178,
    dislikes: 5,
    views: 7654,
    feedback: null,
    attribution: {
      policyId: 5,
      policyTitle: '关于加强技能人才队伍建设的实施办法',
    },
  },
  {
    id: 9,
    category: 'other',
    categoryName: '其他',
    question: '如何查询个人社保缴费记录？',
    answer: '查询社保缴费记录的方式：\n\n**一、线上查询**\n1. "掌上12333"APP\n2. 当地社保APP/微信公众号\n3. 支付宝/微信的"社保查询"功能\n4. 国家社会保险公共服务平台\n\n**二、线下查询**\n1. 社保经办机构窗口\n2. 自助服务终端\n3. 拨打12333热线\n\n**三、查询内容**\n1. 养老保险缴费记录\n2. 医疗保险缴费记录\n3. 失业保险缴费记录\n4. 工伤保险缴费记录\n5. 生育保险缴费记录\n6. 个人账户储存额\n\n建议每年定期核对缴费记录，确保单位按时足额缴纳。',
    likes: 423,
    dislikes: 18,
    views: 15680,
    feedback: null,
    attribution: {
      policyId: 1,
      policyTitle: '关于完善企业职工基本养老保险制度的实施意见',
    },
  },
  {
    id: 10,
    category: 'other',
    categoryName: '其他',
    question: '异地就医医保怎么报销？',
    answer: '异地就医医保报销指南：\n\n**一、备案流程**\n1. 线上备案：通过"国家医保服务平台"APP或微信小程序\n2. 线下备案：到参保地医保经办机构办理\n3. 备案类型：异地长期居住、临时外出就医\n\n**二、结算方式**\n1. **直接结算**：备案后在异地定点医院就医，出院时直接结算，只需支付个人自付部分\n2. **手工报销**：未备案或不能直接结算的，先全额垫付，再回参保地报销\n\n**三、报销比例**\n- 已备案：与参保地报销比例相同\n- 未备案：报销比例降低10%-20%\n\n**四、注意事项**\n1. 备案有效期一般为6个月至5年\n2. 急诊抢救无需备案\n3. 门诊慢特病需要单独备案\n4. 保管好医疗费用票据和病历',
    likes: 356,
    dislikes: 14,
    views: 11234,
    feedback: null,
    attribution: {
      policyId: 3,
      policyTitle: '关于调整2024年度社会保险缴费基数的通知',
    },
  },
];

const mockHotQuestions = [
  { id: 9, question: '如何查询个人社保缴费记录？', count: 15680 },
  { id: 3, question: '失业后可以领取哪些补贴？', count: 12580 },
  { id: 10, question: '异地就医医保怎么报销？', count: 11234 },
  { id: 7, question: '技能提升补贴怎么申请？', count: 10234 },
  { id: 4, question: '灵活就业社保补贴怎么申请？', count: 9876 },
];

const FAQ = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [faqFeedback, setFaqFeedback] = useState({});
  const [expandedKeys, setExpandedKeys] = useState([]);

  const { loading: faqsLoading } = useRequest(getFaqs, {
    onError: () => message.error('获取FAQ列表失败'),
  });

  const { loading: attributionLoading } = useRequest(getFaqAutoAttribution, {
    onError: () => message.error('获取归因分析失败'),
  });

  const { loading: feedbackLoading, run: runFeedback } = useRequest(submitFaqFeedback, {
    manual: true,
    onError: () => message.error('提交反馈失败'),
  });

  const filteredFaqs = useMemo(() => {
    let result = [...mockFaqs];

    if (activeCategory !== 'all') {
      result = result.filter((f) => f.category === activeCategory);
    }

    if (searchText) {
      result = result.filter(
        (f) => f.question.includes(searchText) || f.answer.includes(searchText)
      );
    }

    return result;
  }, [activeCategory, searchText]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleFeedback = async (faqId, type) => {
    if (faqFeedback[faqId]) {
      message.warning('您已提交过反馈');
      return;
    }

    try {
      await runFeedback(faqId, { helpful: type === 'like' });
      setFaqFeedback((prev) => ({
        ...prev,
        [faqId]: type,
      }));
      message.success('感谢您的反馈');
    } catch (err) {
      message.error('反馈提交失败');
    }
  };

  const handlePanelChange = (keys) => {
    setExpandedKeys(keys);
  };

  const handlePolicyClick = (policyId) => {
    navigate(`/policy/list/${policyId}`);
  };

  const handleQuestionClick = (faqId) => {
    const faq = mockFaqs.find((f) => f.id === faqId);
    if (faq) {
      setExpandedKeys((prev) => {
        if (prev.includes(faqId)) {
          return prev.filter((k) => k !== faqId);
        }
        return [...prev, faqId];
      });
    }
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      insurance: '#1E6FDB',
      employment: '#52C41A',
      exam: '#722ED1',
      training: '#FAAD14',
      other: '#8C8C8C',
    };
    return colorMap[category] || '#1E6FDB';
  };

  const loading = faqsLoading || attributionLoading || feedbackLoading;

  const renderFeedbackButtons = (faq) => {
    const feedback = faqFeedback[faq.id];

    return (
      <Space style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          这个回答对您有帮助吗？
        </Text>
        <Button
          type="text"
          icon={<LikeOutlined />}
          size="small"
          onClick={() => handleFeedback(faq.id, 'like')}
          disabled={!!feedback}
          style={{
            color: feedback === 'like' ? '#52C41A' : undefined,
            fontWeight: feedback === 'like' ? 'bold' : undefined,
          }}
        >
          有帮助 ({faq.likes + (feedback === 'like' ? 1 : 0)})
        </Button>
        <Button
          type="text"
          icon={<DislikeOutlined />}
          size="small"
          onClick={() => handleFeedback(faq.id, 'dislike')}
          disabled={!!feedback}
          style={{
            color: feedback === 'dislike' ? '#F5222D' : undefined,
            fontWeight: feedback === 'dislike' ? 'bold' : undefined,
          }}
        >
          没帮助 ({faq.dislikes + (feedback === 'dislike' ? 1 : 0)})
        </Button>
      </Space>
    );
  };

  const renderAttributionTag = (faq) => {
    if (!faq.attribution) return null;

    return (
      <Tag
        icon={<LinkOutlined />}
        color="blue"
        style={{
          cursor: 'pointer',
          marginTop: 8,
          background: '#F0F5FF',
          borderColor: '#91CAFF',
          color: '#1E6FDB',
        }}
        onClick={(e) => {
          e.stopPropagation();
          handlePolicyClick(faq.attribution.policyId);
        }}
      >
        <Tooltip title="点击查看政策详情">
          <span>自动归因：{faq.attribution.policyTitle}</span>
        </Tooltip>
      </Tag>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <QuestionCircleOutlined style={{ color: '#1E6FDB' }} />
            常见问题
          </Space>
        </Title>
        <Search
          placeholder="搜索问题和答案..."
          allowClear
          enterButton
          size="large"
          onSearch={handleSearch}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400 }}
          prefix={<SearchOutlined />}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={5}>
          <Card
            title={
              <Space>
                <AppstoreOutlined style={{ color: '#1E6FDB' }} />
                问题分类
              </Space>
            }
          >
            <Menu
              mode="inline"
              selectedKeys={[activeCategory]}
              onClick={({ key }) => setActiveCategory(key)}
              style={{ border: 'none' }}
              items={faqCategories.map((cat) => ({
                key: cat.key,
                label: (
                  <Space>
                    {cat.icon}
                    {cat.label}
                    <Tag
                      color={cat.key === 'all' ? 'default' : getCategoryColor(cat.key)}
                      style={{ marginLeft: 'auto' }}
                    >
                      {cat.key === 'all'
                        ? mockFaqs.length
                        : mockFaqs.filter((f) => f.category === cat.key).length}
                    </Tag>
                  </Space>
                ),
              }))}
            />
          </Card>

          <Card
            style={{ marginTop: 16 }}
            title={
              <Space>
                <FireOutlined style={{ color: '#F5222D' }} />
                热门问题排行
                <Tag color="red" style={{ marginLeft: 'auto' }}>
                  TOP 5
                </Tag>
              </Space>
            }
          >
            <List
              dataSource={mockHotQuestions}
              locale={{ emptyText: <Empty description="暂无热门问题" /> }}
              renderItem={(item, index) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    padding: '12px 0',
                    borderBottom:
                      index < mockHotQuestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                  onClick={() => handleQuestionClick(item.id)}
                >
                  <Space style={{ width: '100%' }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: index < 3 ? '#F5222D' : '#d9d9d9',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <Text
                      ellipsis
                      style={{
                        flex: 1,
                        color: index < 3 ? '#1E6FDB' : '#666',
                        fontWeight: index < 3 ? 500 : 400,
                      }}
                    >
                      {item.question}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.count?.toLocaleString()}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} sm={24} md={19}>
          <Card
            title={
              <Space>
                <UnorderedListOutlined style={{ color: '#1E6FDB' }} />
                {faqCategories.find((c) => c.key === activeCategory)?.label || '问题列表'}
                <Tag color="blue">{filteredFaqs.length} 条</Tag>
              </Space>
            }
            bodyStyle={{ padding: '16px 24px' }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 10 }} />
            ) : filteredFaqs.length === 0 ? (
              <Empty description="未找到相关问题" />
            ) : (
              <Collapse
                activeKey={expandedKeys}
                onChange={handlePanelChange}
                accordion={false}
                ghost
              >
                {filteredFaqs.map((faq) => (
                  <Panel
                    key={faq.id}
                    header={
                      <Space style={{ width: '100%' }}>
                        <Tag color={getCategoryColor(faq.category)}>
                          {faq.categoryName}
                        </Tag>
                        <Text strong style={{ fontSize: 15 }}>
                          {faq.question}
                        </Text>
                        <Text
                          type="secondary"
                          style={{ marginLeft: 'auto', fontSize: 12 }}
                        >
                          {faq.views.toLocaleString()} 次浏览
                        </Text>
                      </Space>
                    }
                    extra={
                      expandedKeys.includes(faq.id) ? null : (
                        <Tooltip title="查看答案">
                          <Button
                            type="link"
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                          >
                            展开
                          </Button>
                        </Tooltip>
                      )
                    }
                  >
                    <div style={{ padding: '12px 44px 12px 12px' }}>
                      <Paragraph style={{ marginBottom: 12, whiteSpace: 'pre-line' }}>
                        {faq.answer}
                      </Paragraph>
                      {renderAttributionTag(faq)}
                      {renderFeedbackButtons(faq)}
                    </div>
                  </Panel>
                ))}
              </Collapse>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FAQ;
