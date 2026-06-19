import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '../../store/appStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  policies?: PolicyRef[];
}

interface PolicyRef {
  title: string;
  dept: string;
}

interface QARule {
  keywords: string[];
  answer: string;
  policies: PolicyRef[];
}

const qaRules: QARule[] = [
  {
    keywords: ['公积金', '贷款', '额度'],
    answer: '根据郑州市住房公积金管理中心规定，公积金贷款额度根据缴存年限、账户余额和还款能力综合计算。单人最高可贷60万元，夫妻双方最高可贷80万元。贷款额度=缴存账户余额×缴存时间系数×流动性系数，具体可登录郑州住房公积金网上办事大厅查询。',
    policies: [
      { title: '郑州市住房公积金贷款管理办法', dept: '郑州住房公积金管理中心' },
      { title: '关于调整住房公积金贷款政策的通知', dept: '郑州住房公积金管理中心' }
    ]
  },
  {
    keywords: ['新生儿', '落户', '出生'],
    answer: '新生儿落户需准备以下材料：1.《出生医学证明》；2.父母双方居民户口簿；3.父母结婚证；4.父母双方身份证。可通过"郑好办"APP在线申请"出生一件事"联办，同时办理出生证明、户口登记和医保参保，无需多次跑腿。',
    policies: [
      { title: '郑州市新生儿落户办事指南', dept: '郑州市公安局' },
      { title: '郑州市"出生一件事"联办实施方案', dept: '郑州市政务服务和大数据管理局' }
    ]
  },
  {
    keywords: ['育儿', '补贴'],
    answer: '郑州市育儿补贴政策：二孩家庭一次性补贴5000元，三孩家庭一次性补贴10000元。申请条件：1.夫妻双方或一方为郑州市户籍；2.2023年1月1日以后出生的二孩/三孩；3.子女已落户郑州市。可通过"郑好办"APP或社区服务中心申请。',
    policies: [
      { title: '郑州市育儿补贴发放实施办法', dept: '郑州市卫生健康委员会' },
      { title: '关于优化生育政策促进人口长期均衡发展的实施方案', dept: '郑州市人民政府' }
    ]
  },
  {
    keywords: ['医保', '报销'],
    answer: '郑州市医保报销流程：1.门诊报销：持医保卡/电子医保凭证在定点医疗机构直接结算，报销比例社区50%-65%、三甲45%-55%；2.住院报销：起付线社区300元/三甲900元，报销比例社区85%-90%/三甲75%-85%；3.异地就医：需提前在"郑好办"APP备案，备案后可直接结算。',
    policies: [
      { title: '郑州市城乡居民基本医疗保险实施办法', dept: '郑州市医疗保障局' },
      { title: '郑州市异地就医直接结算经办规程', dept: '郑州市医疗保障局' }
    ]
  },
  {
    keywords: ['社保', '缴费', '养老保险'],
    answer: '郑州市社保缴费标准：1.灵活就业人员养老保险缴费基数下限3579元、上限17895元，缴费比例20%；2.职工基本养老保险单位16%、个人8%；3.可通过"郑好办"APP、河南税务小程序或银行网点缴费。缴费年限累计满15年可按月领取养老金。',
    policies: [
      { title: '河南省社会保险费征缴暂行办法', dept: '河南省人力资源和社会保障厅' },
      { title: '郑州市灵活就业人员参加基本养老保险办法', dept: '郑州市人力资源和社会保障局' }
    ]
  },
  {
    keywords: ['居住证', '暂住'],
    answer: '郑州市居住证办理流程：1.登记：到居住地公安派出所或通过"郑好办"APP进行居住登记；2.申领：登记满半年后可申领居住证，需提供身份证、居住证明（租赁合同或房产证）、就业/就读证明；3.居住证可享受子女入学、社保参保、车辆上牌等市民待遇。',
    policies: [
      { title: '郑州市居住证管理实施办法', dept: '郑州市公安局' },
      { title: '居住证持有人享受公共服务便利清单', dept: '郑州市人民政府' }
    ]
  },
  {
    keywords: ['不动产', '房产', '过户', '二手房'],
    answer: '郑州市二手房过户"一件事"联办流程：1.网签备案→2.税务核税缴税→3.不动产登记，3个环节一站式办理。所需材料：买卖双方身份证、不动产权证书、买卖合同、婚姻状况证明。可通过"郑好办"APP预约办理，一般3个工作日内办结。',
    policies: [
      { title: '郑州市不动产登记"一窗受理"实施方案', dept: '郑州市自然资源和规划局' },
      { title: '郑州市存量房交易过户办事指南', dept: '郑州市住房保障和房地产管理局' }
    ]
  },
  {
    keywords: ['企业', '开办', '注册', '工商'],
    answer: '郑州市企业开办"一件事"联办：1.营业执照→2.公章刻制→3.税务登记→4.社保开户→5.公积金开户，0.5个工作日办结。所需材料：法人身份证、公司章程、股东名册、注册地址证明。全程可通过"郑好办"APP或河南政务服务网在线办理，免费赠送一套印章。',
    policies: [
      { title: '郑州市企业开办"一件事"工作规程', dept: '郑州市市场监督管理局' },
      { title: '关于进一步优化营商环境的若干措施', dept: '郑州市人民政府' }
    ]
  },
  {
    keywords: ['退休', '养老金', '养老'],
    answer: '郑州市退休办理"一件事"联办：1.养老金待遇核定→2.医保退休认定→3.公积金提取→4.老年优待证办理。办理条件：达到法定退休年龄且养老保险缴费满15年。所需材料：身份证、社保卡、个人档案。可通过"郑好办"APP在线申请，办理结果短信通知。',
    policies: [
      { title: '河南省企业职工基本养老保险经办规程', dept: '河南省人力资源和社会保障厅' },
      { title: '郑州市退休"一件事"联办服务规范', dept: '郑州市政务服务和大数据管理局' }
    ]
  },
  {
    keywords: ['学位', '入学', '学区', '上学'],
    answer: '郑州市义务教育入学政策：1.市区户籍适龄儿童按学区免试就近入学；2.随迁子女入学需提供居住证、劳动合同/营业执照、户口簿；3.每年6月通过"郑好办"APP进行网上报名，7月公布录取结果。学区划分每年5月由各区教育局公布。',
    policies: [
      { title: '郑州市义务教育阶段招生入学工作实施意见', dept: '郑州市教育局' },
      { title: '郑州市随迁子女入学管理办法', dept: '郑州市教育局' }
    ]
  },
  {
    keywords: ['违章', '交通', '罚款'],
    answer: '郑州市交通违章处理方式：1.线上处理：通过"交管12123"APP或"郑好办"APP查询并处理6分以下违章，可直接在线缴纳罚款；2.线下处理：携带驾驶证、行驶证到交警大队或交通违法处理窗口办理。注意：一个记分周期内累计12分需参加学习和考试。',
    policies: [
      { title: '道路交通安全违法行为处理程序规定', dept: '郑州市公安局交警支队' },
      { title: '郑州市交通违法线上处理服务指南', dept: '郑州市政务服务和大数据管理局' }
    ]
  },
  {
    keywords: ['低保', '救助', '困难'],
    answer: '郑州市低保申请条件：1.共同生活家庭成员月人均收入低于郑州市低保标准（城市730元/月、农村580元/月）；2.家庭财产符合规定。申请材料：户口簿、身份证、收入证明、财产声明。办理流程：向社区/村委会提出申请→街道/乡镇审核→区民政部门审批，可通过"郑好办"APP在线申请。',
    policies: [
      { title: '郑州市城乡居民最低生活保障实施办法', dept: '郑州市民政局' },
      { title: '郑州市社会救助暂行办法', dept: '郑州市人民政府' }
    ]
  }
];

const quickQuestions = [
  '公积金贷款额度怎么算？',
  '新生儿落户要什么材料？',
  '育儿补贴怎么领？',
  '医保怎么报销？'
];

const AI_AVATAR = '🤖';
const USER_AVATAR = '👤';
const WELCOME_MSG = '您好！我是小智，郑州市政务智能助手。您可以向我咨询公积金、医保、落户、社保等政务问题，也可以点击下方快捷问题快速提问。';

function findAnswer(question: string): { answer: string; policies: PolicyRef[] } {
  const matched = qaRules.find(rule =>
    rule.keywords.some(kw => question.includes(kw))
  );
  if (matched) {
    return { answer: matched.answer, policies: matched.policies };
  }
  return {
    answer: '抱歉，我暂时没有找到与您问题相关的政策信息。建议您通过以下方式获取帮助：\n1. 在"郑好办"APP搜索相关服务\n2. 拨打12345市民服务热线\n3. 前往各区政务服务中心咨询',
    policies: []
  };
}

let msgIdCounter = 0;
function nextId(): string {
  return `msg_${Date.now()}_${++msgIdCounter}`;
}

const ChatQaPage: React.FC = () => {
  const router = useRouter();
  const { speak } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef('');
  const initialized = useRef(false);

  const addMessage = useCallback((role: 'user' | 'ai', content: string, policies?: PolicyRef[]) => {
    const msg: ChatMessage = {
      id: nextId(),
      role,
      content,
      timestamp: Date.now(),
      policies
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  const simulateAIReply = useCallback((question: string) => {
    setIsTyping(true);
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      const { answer, policies } = findAnswer(question);
      const msg = addMessage('ai', answer, policies);
      setIsTyping(false);
      speak(answer.replace(/\n/g, '。').substring(0, 200));
      scrollViewRef.current = msg.id;
    }, delay);
  }, [addMessage, speak]);

  const handleSend = useCallback((text?: string) => {
    const content = (text || inputValue).trim();
    if (!content || isTyping) return;
    setInputValue('');
    const msg = addMessage('user', content);
    scrollViewRef.current = msg.id;
    simulateAIReply(content);
  }, [inputValue, isTyping, addMessage, simulateAIReply]);

  const handleQuickQuestion = useCallback((question: string) => {
    if (isTyping) return;
    handleSend(question);
  }, [isTyping, handleSend]);

  const handleVoiceInput = useCallback(() => {
    Taro.showToast({ title: '语音输入开发中', icon: 'none' });
  }, []);

  const handlePolicyClick = useCallback((title: string) => {
    speak(title);
    Taro.showToast({ title: '查看政策详情', icon: 'none' });
  }, [speak]);

  const handleBack = useCallback(() => {
    Taro.navigateBack();
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const welcomeMsg = addMessage('ai', WELCOME_MSG);
    scrollViewRef.current = welcomeMsg.id;

    const preQuestion = router.params.question || router.params.keyword;
    if (preQuestion) {
      setTimeout(() => {
        const userMsg = addMessage('user', preQuestion);
        scrollViewRef.current = userMsg.id;
        simulateAIReply(preQuestion);
      }, 800);
    }
  }, [router.params.question, router.params.keyword, addMessage, simulateAIReply]);

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.backBtn} onClick={handleBack}>
          <Text className={styles.backIcon}>←</Text>
        </View>
        <Text className={styles.headerTitle}>小智智能问答</Text>
        <View className={styles.headerRight} />
      </View>

      <ScrollView
        className={styles.chatArea}
        scrollY
        scrollIntoView={scrollViewRef.current}
        scrollWithAnimation
      >
        <View className={styles.chatList}>
          {messages.map(msg => (
            <View
              key={msg.id}
              id={msg.id}
              className={`${styles.msgRow} ${msg.role === 'user' ? styles.msgRowUser : styles.msgRowAi}`}
            >
              <View className={`${styles.avatar} ${msg.role === 'user' ? styles.avatarUser : styles.avatarAi}`}>
                <Text className={styles.avatarText}>
                  {msg.role === 'user' ? USER_AVATAR : AI_AVATAR}
                </Text>
              </View>
              <View className={styles.msgContent}>
                <View className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi}`}>
                  <Text className={styles.bubbleText}>{msg.content}</Text>
                </View>
                {msg.policies && msg.policies.length > 0 && (
                  <View className={styles.policyRefs}>
                    <Text className={styles.policyRefTitle}>📜 关联政策</Text>
                    {msg.policies.map((p, idx) => (
                      <View
                        key={idx}
                        className={styles.policyRefItem}
                        onClick={() => handlePolicyClick(p.title)}
                      >
                        <Text className={styles.policyRefName}>{p.title}</Text>
                        <Text className={styles.policyRefDept}>{p.dept}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}

          {isTyping && (
            <View className={`${styles.msgRow} ${styles.msgRowAi}`}>
              <View className={`${styles.avatar} ${styles.avatarAi}`}>
                <Text className={styles.avatarText}>{AI_AVATAR}</Text>
              </View>
              <View className={styles.msgContent}>
                <View className={`${styles.bubble} ${styles.bubbleAi}`}>
                  <View className={styles.typingDots}>
                    <View className={styles.dot} />
                    <View className={styles.dot} />
                    <View className={styles.dot} />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {messages.length <= 1 && (
        <View className={styles.quickSection}>
          <Text className={styles.quickTitle}>💡 快捷提问</Text>
          <View className={styles.quickList}>
            {quickQuestions.map(q => (
              <View
                key={q}
                className={styles.quickItem}
                onClick={() => handleQuickQuestion(q)}
              >
                <Text className={styles.quickItemText}>{q}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.inputBar}>
        <View className={styles.voiceBtn} onClick={handleVoiceInput}>
          <Text className={styles.voiceIcon}>🎤</Text>
        </View>
        <View className={styles.inputWrap}>
          <Input
            className={styles.input}
            value={inputValue}
            onInput={e => setInputValue(e.detail.value)}
            onConfirm={() => handleSend()}
            placeholder="输入您的问题..."
            confirmType="send"
            adjustPosition
          />
        </View>
        <View
          className={`${styles.sendBtn} ${inputValue.trim() ? styles.sendBtnActive : ''}`}
          onClick={() => handleSend()}
        >
          <Text className={styles.sendBtnText}>发送</Text>
        </View>
      </View>
    </View>
  );
};

export default ChatQaPage;
