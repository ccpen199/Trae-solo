import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  Shield,
  Download,
  Printer,
  Mail,
  UserCheck,
  Building2,
  Signature,
  Lock,
  AlertTriangle,
  ArrowRight,
  Copy,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockContract = {
  id: 'CTR-2026-00532',
  title: '建筑装饰工程施工合同',
  type: '装修工程合同',
  propertyName: '环球金融中心 T3 座 28层',
  propertyAddress: '上海市浦东新区世纪大道1000号环球金融中心T3 2801-2810',
  propertyType: '甲级写字楼',
  area: 2350,
  parties: [
    {
      id: 'P1',
      type: '甲方（发包方）',
      company: '恒信资本管理有限公司',
      legalRepresentative: '张宏伟',
      contact: '138****6688',
      email: 'zhanghongwei@hengxin.com',
      address: '上海市浦东新区陆家嘴环路1000号',
      signedAt: null,
      signatureImage: null,
    },
    {
      id: 'P2',
      type: '乙方（承包方）',
      company: '金螳螂建筑装饰股份有限公司',
      legalRepresentative: '倪林',
      contact: '139****8899',
      email: 'zhoulang@jintanglang.com',
      address: '江苏省苏州市工业园区民营工业区内',
      signedAt: '2026-06-10 14:32:18',
      signatureImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTUwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCAyNSBDIDIwIDEwLCA0MCA1LCA2MCAyMCBDIDgwIDM1LCAxMDAgMTUsIDEyMCAyNSBDIDEzMCAzMCwgMTQwIDI4LCAxNDUgMjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM4NUQ5NyIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMCAzMiBDIDMwIDI1LCA1MCAzNSwgNzAgMjggTCAxMDAgMjggQyAxMjAgMjAsIDEzNSAzNSwgMTQ1IDI4IiBmaWxsPSJub25lIiBzdHJva2U9IiMzODVEOTciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
    }
  ],
  amount: 6130000,
  duration: 120,
  startDate: '2026-06-20',
  endDate: '2026-10-17',
  scope: '室内装修设计与施工，包含：1.硬装工程；2.机电安装工程；3.弱电智能化系统；4.办公家具及软装配置；5.消防工程申报及验收配合。',
  paymentTerms: [
    { stage: '预付款', percent: 30, amount: 1839000, due: '合同签署后3个工作日内', condition: '合同生效' },
    { stage: '进度款一', percent: 25, amount: 1532500, due: '施工进度完成50%后5个工作日内', condition: '隐蔽工程验收通过' },
    { stage: '进度款二', percent: 25, amount: 1532500, due: '施工进度完成85%后5个工作日内', condition: '机电安装完成' },
    { stage: '竣工款', percent: 17, amount: 1042100, due: '竣工验收合格后7个工作日内', condition: '验收合格并交付' },
    { stage: '质保金', percent: 3, amount: 183900, due: '质保期满后10个工作日内', condition: '质保期24个月' },
  ],
  warrantyPeriod: 24,
  status: '待签署',
  signSteps: [
    { key: 'verify', title: '身份验证', completed: true },
    { key: 'review', title: '条款审核', completed: true },
    { key: 'sign', title: '电子签名', completed: false, current: true },
    { key: 'confirm', title: '合同生效', completed: false },
  ],
  createdAt: '2026-06-10 10:00:00',
  createdBy: '系统自动生成',
  auditTrail: [
    { time: '2026-06-10 10:00:00', action: '合同创建', user: '系统', ip: '172.16.0.1', location: '上海市' },
    { time: '2026-06-10 10:15:22', action: '价格条款确认', user: '张宏伟', ip: '114.82.36.118', location: '上海市浦东新区' },
    { time: '2026-06-10 14:32:18', action: '乙方完成签署', user: '周朗', ip: '58.210.78.112', location: '江苏省苏州市' },
    { time: '2026-06-10 14:35:00', action: '短信通知甲方', user: '系统', ip: '172.16.0.1', location: '上海市' },
  ],
  templateVersion: 'v2.1.0',
  applicableLaw: '《中华人民共和国民法典》《建设工程质量管理条例》',
  disputeResolution: '向工程所在地人民法院提起诉讼',
};

const contractClauses = [
  {
    title: '第一条 工程概况',
    content: '1.1 工程名称：恒信资本环球金融中心28层装修工程\n1.2 工程地点：上海市浦东新区世纪大道1000号\n1.3 工程内容：室内装饰装修、机电安装、弱电系统、办公家具及软装\n1.4 承包方式：包工包料、包质量、包工期、包安全、包验收\n1.5 开工日期：2026年6月20日（具体以甲方书面通知为准）\n1.6 竣工日期：2026年10月17日，总工期120日历天',
  },
  {
    title: '第二条 工程价款',
    content: `2.1 合同总价：人民币陆佰壹拾叁万元整（¥6,130,000.00）\n2.2 计价方式：固定总价合同\n2.3 工程量变更：工程变更需经双方书面确认后方可实施\n2.4 付款方式：\n    ① 预付款30%：¥1,839,000.00，合同生效后3个工作日内支付\n    ② 进度款一25%：¥1,532,500.00，施工完成50%且隐蔽工程验收后5个工作日内\n    ③ 进度款二25%：¥1,532,500.00，施工完成85%且机电安装完成后5个工作日内\n    ④ 竣工款17%：¥1,042,100.00，竣工验收合格后7个工作日内\n    ⑤ 质保金3%：¥183,900.00，质保期满24个月后10个工作日内`,
  },
  {
    title: '第三条 工程质量',
    content: '3.1 工程质量标准：达到国家及行业现行施工验收规范合格标准，且满足甲方使用要求\n3.2 质量目标：NPS评分不低于45分，客户满意度达到90%以上\n3.3 主要材料必须采用甲方确认的品牌型号，进场时需双方联合验收\n3.4 隐蔽工程验收：上道工序未经甲方验收合格，不得进行下道工序施工\n3.5 工程竣工后乙方应提交完整的竣工图和技术资料各四套',
  },
  {
    title: '第四条 双方责任',
    content: '4.1 甲方责任：\n    ① 提供施工所需的场地、水源、电源接口\n    ② 协调物业及周边关系，办理施工所需各项手续\n    ③ 按合同约定及时支付工程款项\n    ④ 组织工程竣工验收\n4.2 乙方责任：\n    ① 严格按照图纸和规范施工，确保工程质量\n    ② 建立安全生产管理体系，杜绝安全事故\n    ③ 接受甲方及监理单位的监督管理\n    ④ 做好成品保护工作，竣工后清理施工现场',
  },
  {
    title: '第五条 工程变更与签证',
    content: '5.1 施工中甲方对原设计进行变更，应提前7天以书面形式通知乙方\n5.2 因乙方施工原因需变更设计的，须经甲方同意后方可实施\n5.3 所有变更必须办理工程签证，签证费用按合同约定的计价方式计算\n5.4 乙方应在收到变更指令后3天内提交变更报价，甲方应在7天内予以确认\n5.5 变更签证的费用在竣工结算时一并支付',
  },
  {
    title: '第六条 竣工验收与结算',
    content: '6.1 工程完工后，乙方应提交竣工报告及完整的验收资料\n6.2 甲方应在收到竣工报告后10天内组织验收\n6.3 验收合格后，双方签署《工程竣工验收单》\n6.4 乙方应在竣工验收后15天内提交完整的结算资料\n6.5 甲方应在收到结算资料后30天内完成审核\n6.6 结算完成后，除预留的质保金外，余款应在10天内支付完毕',
  },
  {
    title: '第七条 质量保修',
    content: '7.1 质量保修期：自竣工验收合格之日起24个月\n7.2 保修期内，乙方应在接到维修通知后24小时内派员到场\n7.3 维修费用由责任方承担\n7.4 保修期满后，乙方应提供有偿维修服务，费用按市场价计算',
  },
  {
    title: '第八条 违约责任',
    content: '8.1 乙方逾期竣工的，每逾期一天支付合同总价款0.1%的违约金，累计不超过5%\n8.2 甲方逾期付款的，按逾期金额的日万分之三支付违约金\n8.3 工程质量不合格的，乙方应无偿返修并承担由此造成的一切损失\n8.4 任何一方单方解除合同的，应向对方支付合同总价款15%的违约金',
  },
  {
    title: '第九条 争议解决',
    content: '9.1 合同履行过程中发生的争议，双方应友好协商解决\n9.2 协商不成的，任何一方均可向工程所在地人民法院提起诉讼\n9.3 争议解决期间，除争议事项外，合同其他条款应继续履行',
  },
  {
    title: '第十条 附则',
    content: '10.1 本合同自双方签字盖章之日起生效\n10.2 本合同一式陆份，甲方执叁份，乙方执贰份，鉴证方执壹份\n10.3 合同附件与本合同具有同等法律效力\n10.4 未尽事宜，双方可另行签订补充协议',
  },
];

export default function ContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(mockContract);
  const [signStep, setSignStep] = useState<'review' | 'verify' | 'sign' | 'done'>('review');
  const [verifyCode, setVerifyCode] = useState(['', '', '', '', '', '']);
  const [isSigning, setIsSigning] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const handleScroll = () => {
    if (contractRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contractRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setHasScrolled(true);
      }
    }
  };
  
  useEffect(() => {
    const ref = contractRef.current;
    ref?.addEventListener('scroll', handleScroll);
    return () => ref?.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verifyCode];
      newCode[index] = value;
      setVerifyCode(newCode);
    }
  };
  
  const handleSign = () => {
    setIsSigning(true);
    setTimeout(() => {
      setContract(prev => ({
        ...prev,
        status: '已签署',
        parties: prev.parties.map(p => p.id === 'P1' ? {
          ...p,
          signedAt: new Date().toLocaleString('zh-CN'),
          signatureImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTUwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCAzMCBDIDMwIDUsIDUwIDI4LCA3MCAxNSBDIDkwIDUsIDEyMCAyNSwgMTQ1IDEwIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEE4NTMiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNNSAzNSBDIDI1IDI1LCA0NSAzNSwgNzAgMjggTCAxMDAgMzAgQyAxMjAgMjUsIDEzNSAzNSwgMTQ1IDI4IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEE4NTMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
        } : p),
        signSteps: prev.signSteps.map(s => ({ ...s, completed: true, current: false })),
      }));
      setSignStep('done');
      setIsSigning(false);
    }, 2000);
  };
  
  const allSigned = contract.parties.every(p => p.signedAt);
  const codeComplete = verifyCode.every(c => c !== '');
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-[1400px] p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">{contract.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-info-500/20 text-info-300 border border-info-500/30">
                {contract.type}
              </span>
              {allSigned && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  已生效
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-400 mt-0.5">
              合同编号：{contract.id} · 签订日期：{contract.createdAt.slice(0, 10)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3.5 py-2 rounded-lg text-xs font-medium bg-primary-800/50 text-neutral-300 hover:bg-primary-700 transition-colors flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              下载PDF
            </button>
            <button className="px-3.5 py-2 rounded-lg text-xs font-medium bg-primary-800/50 text-neutral-300 hover:bg-primary-700 transition-colors flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              打印
            </button>
            <button className="px-3.5 py-2 rounded-lg text-xs font-medium bg-primary-800/50 text-neutral-300 hover:bg-primary-700 transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              发送邮件
            </button>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 xl:col-span-8">
            {signStep === 'review' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-base p-8"
              >
                <div className="text-center mb-6 pb-6 border-b border-gold-500/10">
                  <FileText className="w-12 h-12 text-gold-400 mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-white">请仔细阅读合同条款</h2>
                  <p className="text-sm text-neutral-400 mt-1">请滚动至合同底部确认已阅读全部内容</p>
                </div>
                
                <div
                  ref={contractRef}
                  className="h-[450px] overflow-y-auto pr-4 space-y-6 font-mono text-[13px] leading-relaxed text-neutral-200 contract-scroll"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">建筑装饰工程施工合同</h3>
                    <p className="text-sm text-neutral-400">合同编号：{contract.id}</p>
                  </div>
                  
                  <div className="mb-8 p-5 bg-primary-800/20 rounded-xl border border-gold-500/10">
                    <p className="text-sm leading-relaxed">
                      甲方（发包方）：<span className="text-gold-300 font-bold">{contract.parties[0].company}</span><br />
                      乙方（承包方）：<span className="text-gold-300 font-bold">{contract.parties[1].company}</span><br /><br />
                      依照《中华人民共和国民法典》及相关法律法规的规定，双方经友好协商，就乙方承接甲方装修工程事宜达成如下协议，以资共同信守。
                    </p>
                  </div>
                  
                  {contractClauses.map((clause, idx) => (
                    <div key={idx} className="mb-6">
                      <h4 className="font-bold text-gold-300 mb-2">{clause.title}</h4>
                      <p className="whitespace-pre-line text-neutral-200">{clause.content}</p>
                    </div>
                  ))}
                  
                  <div className="mt-10 pt-6 border-t border-gold-500/10">
                    <h4 className="font-bold text-gold-300 mb-4">附件清单</h4>
                    <ul className="space-y-1.5 text-neutral-300">
                      <li className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-primary-400" />
                        附件一：施工图纸及设计说明（共12张）
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-primary-400" />
                        附件二：工程报价明细表（分部分项工程量清单）
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-primary-400" />
                        附件三：材料设备品牌型号清单
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-primary-400" />
                        附件四：项目管理班子人员名单
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-primary-400" />
                        附件五：安全生产责任书
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-primary-400" />
                        附件六：质量保修承诺书
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 pt-5 border-t border-gold-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasScrolled ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-neutral-500" />
                      )}
                      <span className={cn("text-sm", hasScrolled ? "text-emerald-300" : "text-neutral-400")}>
                        {hasScrolled ? "已阅读全部合同条款" : "请滚动阅读完整合同内容"}
                      </span>
                    </div>
                    <button
                      onClick={() => setSignStep('verify')}
                      disabled={!hasScrolled}
                      className={cn(
                        "px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                        hasScrolled
                          ? "btn-gold"
                          : "bg-neutral-700/50 text-neutral-500 cursor-not-allowed"
                      )}
                    >
                      下一步：身份验证
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {signStep === 'verify' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-base p-8 text-center max-w-xl mx-auto"
              >
                <div className="w-16 h-16 rounded-2xl bg-gold-500/20 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-gold-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">签署方身份验证</h2>
                <p className="text-sm text-neutral-400 mb-6">请输入发送到手机 <span className="text-gold-300 font-mono">138****6688</span> 的验证码</p>
                
                <div className="flex justify-center gap-3 mb-6">
                  {verifyCode.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(idx, e.target.value)}
                      className="w-14 h-14 text-center text-2xl font-mono font-bold bg-primary-800/50 border-2 border-primary-700/50 rounded-xl text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all"
                    />
                  ))}
                </div>
                
                <p className="text-xs text-neutral-500 mb-6">
                  未收到验证码？ <button className="text-gold-400 hover:text-gold-300">重新发送(59s)</button>
                </p>
                
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSignStep('review')}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary-800/50 text-neutral-300 hover:bg-primary-700 transition-colors"
                  >
                    返回
                  </button>
                  <button
                    onClick={() => setSignStep('sign')}
                    disabled={!codeComplete}
                    className={cn(
                      "px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                      codeComplete
                        ? "btn-gold"
                        : "bg-neutral-700/50 text-neutral-500 cursor-not-allowed"
                    )}
                  >
                    <UserCheck className="w-4 h-4" />
                    验证通过
                  </button>
                </div>
              </motion.div>
            )}
            
            {signStep === 'sign' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-base p-8"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gold-500/20 flex items-center justify-center mx-auto mb-4">
                    <Signature className="w-8 h-8 text-gold-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1">电子签名</h2>
                  <p className="text-sm text-neutral-400">请在下方签名区域书写您的签名</p>
                </div>
                
                <div className="p-6 bg-white rounded-xl relative mb-6">
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={200}
                    className="w-full h-48 border-2 border-dashed border-gold-500/30 rounded-lg cursor-crosshair bg-white"
                    onMouseDown={() => setIsDrawing(true)}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-400 text-sm">
                    请在此区域签名
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3 mb-6">
                  <button
                    onClick={() => {}}
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-primary-800/50 text-neutral-300 hover:bg-primary-700 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    清除
                  </button>
                  <button className="px-5 py-2 rounded-lg text-sm font-medium bg-primary-800/50 text-neutral-300 hover:bg-primary-700 transition-colors flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 10 10M16 2v4M20 6h-4" />
                    </svg>
                    使用预设签名
                  </button>
                </div>
                
                <div className="p-4 rounded-xl bg-warning-500/10 border border-warning-500/30 mb-6 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning-300 mb-1">重要提示</p>
                    <p className="text-warning-200/80 text-xs">
                      点击「确认签署」即表示您已阅读并同意本合同全部条款，确认签署行为系本人真实意思表示，
                      该电子签名与手写签名或盖章具有同等法律效力。
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSignStep('verify')}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary-800/50 text-neutral-300 hover:bg-primary-700 transition-colors"
                  >
                    返回
                  </button>
                  <button
                    onClick={handleSign}
                    disabled={isSigning}
                    className="btn-gold px-8 py-2.5 text-sm font-bold flex items-center gap-2"
                  >
                    {isSigning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
                        区块链存证中...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        确认签署，立即生效
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
            
            {signStep === 'done' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-base p-8 text-center max-w-xl mx-auto"
              >
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute top-0 right-1/3 w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center"
                  >
                    <Shield className="w-4 h-4 text-primary-900" />
                  </motion.div>
                </div>
                
                <h2 className="text-2xl font-bold glow-text-gold mb-2">合同签署成功！</h2>
                <p className="text-sm text-neutral-400 mb-6">合同已在区块链完成存证，具有法律效力</p>
                
                <div className="p-6 rounded-xl bg-primary-800/30 border border-gold-500/20 mb-6 text-left">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gold-500/10">
                    <Lock className="w-4 h-4 text-gold-400" />
                    <span className="text-xs text-gold-300 font-medium">区块链存证信息</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">区块高度</span>
                      <span className="font-mono text-white">#18,452,367</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">交易哈希</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-white text-xs">0x7f3d...e82b</span>
                        <button className="text-gold-400"><Copy className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">存证时间</span>
                      <span className="font-mono text-white">{new Date().toLocaleString('zh-CN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">公证机构</span>
                      <span className="text-white">上海市东方公证处</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                  <button className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary-800/50 text-neutral-300 hover:bg-primary-700 transition-colors flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    查看完整合同
                  </button>
                  <button className="btn-gold px-6 py-2.5 text-sm font-bold flex items-center gap-1.5">
                    <Download className="w-4 h-4" />
                    下载合同PDF
                  </button>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="col-span-12 xl:col-span-4 space-y-5">
            <div className="card-base p-5 border border-gold-500/30">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold-400" />
                签署进度
              </h3>
              <div className="space-y-3">
                {contract.signSteps.map((step, idx) => (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                      step.completed
                        ? "bg-emerald-500 border-emerald-500 text-primary-900"
                        : step.current
                        ? "bg-gold-500/20 border-gold-500 text-gold-300"
                        : "bg-primary-800/50 border-neutral-600 text-neutral-500"
                    )}>
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", step.completed || step.current ? "text-white" : "text-neutral-500")}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Signature className="w-4 h-4 text-gold-400" />
                签署方信息
              </h3>
              {contract.parties.map((party, idx) => (
                <div key={party.id} className={cn("mb-4 last:mb-0", idx > 0 && "pt-4 border-t border-neutral-700/30")}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {party.type.includes('甲方') ? (
                        <Building2 className="w-4 h-4 text-primary-400" />
                      ) : (
                        <Building2 className="w-4 h-4 text-gold-400" />
                      )}
                      <span className="text-xs font-bold text-gold-300">{party.type}</span>
                    </div>
                    {party.signedAt ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        已签署
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning-500/20 text-warning-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        待签署
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-white text-sm">{party.company}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">法定代表人：{party.legalRepresentative}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">联系方式：{party.contact}</p>
                  
                  {party.signatureImage && (
                    <div className="mt-3 pt-3 border-t border-neutral-700/30">
                      <img
                        src={party.signatureImage}
                        alt="电子签名"
                        className="h-10"
                      />
                      <p className="text-[10px] text-neutral-500 mt-1.5">
                        签署时间：{party.signedAt}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold-400" />
                合同摘要
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-neutral-700/30">
                  <span className="text-neutral-400">工程名称</span>
                  <span className="text-white text-right max-w-[180px] truncate" title={contract.propertyName}>
                    {contract.propertyName}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-700/30">
                  <span className="text-neutral-400">合同金额</span>
                  <span className="font-mono font-bold glow-text-gold">¥{(contract.amount / 10000).toFixed(0)}万</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-700/30">
                  <span className="text-neutral-400">工期</span>
                  <span className="font-mono text-white">{contract.duration}天</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-700/30">
                  <span className="text-neutral-400">开工日期</span>
                  <span className="font-mono text-white">{contract.startDate}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-400">质保期</span>
                  <span className="font-mono text-white">{contract.warrantyPeriod}个月</span>
                </div>
              </div>
            </div>
            
            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold-400" />
                操作审计
              </h3>
              <div className="space-y-3">
                {contract.auditTrail.map((log, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        idx === contract.auditTrail.length - 1 ? "bg-gold-400" : "bg-neutral-600"
                      )} />
                      {idx < contract.auditTrail.length - 1 && (
                        <div className="w-0.5 h-full bg-neutral-700/50" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-xs font-medium text-white">{log.action}</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        {log.user} · {log.location} · {log.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
