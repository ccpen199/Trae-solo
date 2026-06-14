import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  Droplets,
  Hammer,
  Palette,
  Plug,
  Shield,
  Award,
  Package,
  BookOpen,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

type StandardLevel = 'gb' | 'hb' | 'qb';

interface ProcessStep {
  title: string;
  desc: string;
}

interface GbQuote {
  code: string;
  clause: string;
  text: string;
}

interface Faq {
  q: string;
  a: string;
}

interface PitfallGuide {
  id: string;
  title: string;
  risk: 'high' | 'medium' | 'low';
  viewCount: number;
  desc: string;
}

interface ProcessDetailData {
  id: string;
  name: string;
  stage: string;
  duration: string;
  difficulty: '低' | '中' | '高';
  description: string;
  standardLevel: StandardLevel;
  acceptanceStandard: string;
  recommendedMaterials: string[];
  steps: ProcessStep[];
  gbQuotes: GbQuote[];
  faqs: Faq[];
  pitfallGuides: PitfallGuide[];
}

const stagesMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  hydropower: { label: '水电改造', icon: Zap, color: 'text-haze-600', bgColor: 'bg-haze-100' },
  tile: { label: '泥瓦工程', icon: Droplets, color: 'text-terracotta-600', bgColor: 'bg-terracotta-100' },
  carpentry: { label: '木工工程', icon: Hammer, color: 'text-wood-700', bgColor: 'bg-wood-100' },
  paint: { label: '油漆工程', icon: Palette, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  installation: { label: '安装工程', icon: Plug, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  waterproof: { label: '防水工程', icon: Shield, color: 'text-sky-600', bgColor: 'bg-sky-100' },
  acceptance: { label: '竣工验收', icon: CheckCircle2, color: 'text-violet-600', bgColor: 'bg-violet-100' },
};

const processDetails: Record<string, ProcessDetailData> = {
  p1: {
    id: 'p1',
    name: '强电回路布设',
    stage: 'hydropower',
    duration: '2-3天',
    difficulty: '高',
    description: '根据用电负载合理分配回路，大功率电器独立回路，确保用电安全。通过标准化施工流程，做到走线规范、标识清晰、测试合格。',
    standardLevel: 'gb',
    acceptanceStandard: '绝缘电阻≥0.5MΩ，相位正确，漏电保护动作正常，管内电线占比≤40%',
    recommendedMaterials: ['国标BV铜线', 'PVC穿线管(壁厚≥1.5mm)', '品牌断路器', '弱电机柜', '屏蔽水晶头'],
    steps: [
      { title: '现场交底', desc: '确认各空间点位位置，标记大功率电器回路，配电箱扩容评估' },
      { title: '材料验收', desc: '检查电线品牌规格（BV/BVR线）、穿线管壁厚（≥1.5mm）、底盒质量' },
      { title: '弹线开槽', desc: '横平竖直弹线，墙面开槽深度≥3cm，严禁横向开槽超过50cm' },
      { title: '布管穿线', desc: '强电走天弱电走地，回路分离，管内电线占比≤40%' },
      { title: '回路测试', desc: '摇表绝缘测试≥0.5MΩ，相位检测，漏电保护测试' },
      { title: '封槽保护', desc: '水泥砂浆分层填缝，挂网防裂，做好管线走向标记' },
    ],
    gbQuotes: [
      { code: 'GB 50327-2001', clause: '第4.3.2条', text: '电气配线应分色，相线(L)颜色应统一，零线(N)宜用黑色，保护线(PE)必须用黄绿双色线。' },
      { code: 'GB 50303-2015', clause: '第12.2.2条', text: '塑料护套线严禁直接敷设在建筑物顶棚内、墙体内、抹灰层内、保温层内或装饰面内。' },
      { code: 'JGJ 242-2011', clause: '第9.3.2条', text: '每套住宅的空调电源插座、电源插座与照明应分路设计；厨房电源插座和卫生间电源插座宜设置独立回路。' },
    ],
    faqs: [
      { q: '为什么大功率电器要走独立回路？', a: '避免同时使用时过载跳闸，常用大功率如空调(4平方)、电热水器(6平方)、烤箱(4平方)均需独立回路。' },
      { q: '电线管内为什么不能超过40%填充率？', a: '保证电线散热空间，防止过热加速老化，同时方便后期换线维修。' },
      { q: '强电弱电间距多少才安全？', a: '平行间距≥30cm，交叉处需做锡纸屏蔽，避免电磁干扰网络、电视信号。' },
    ],
    pitfallGuides: [
      { id: 'pit1', title: '电路改造10大坑', risk: 'high', viewCount: 12580, desc: '偷工减料、回路混乱，后期隐患无穷' },
      { id: 'pit2', title: '插座点位如何规划', risk: 'medium', viewCount: 8932, desc: '这10个位置必留，少一个都后悔' },
      { id: 'pit3', title: '火线零线接反怎么办', risk: 'low', viewCount: 5241, desc: '教你用电笔快速检测相位' },
    ],
  },
  p5: {
    id: 'p5',
    name: '卫生间防水层',
    stage: 'waterproof',
    duration: '2天',
    difficulty: '高',
    description: '三遍涂刷工艺，48小时闭水试验，管根墙角加强处理。是家装中最重要的隐蔽工程之一，直接影响居住质量和邻里关系。',
    standardLevel: 'gb',
    acceptanceStandard: '闭水48小时无渗漏，淋浴区高度≥1.8m，干区≥30cm，管根加强处理',
    recommendedMaterials: ['聚合物水泥基防水涂料', '无纺布加强层', '堵漏王', '玻纤网格布'],
    steps: [
      { title: '基层处理', desc: '清理地面浮灰，修补裂缝孔洞，阴阳角抹圆弧' },
      { title: '管口加强', desc: '地漏、管根、阴阳角处先刷一遍附加层，贴无纺布加强' },
      { title: '第一遍涂刷', desc: '横向均匀涂刷，厚度约0.5mm，避免漏刷' },
      { title: '第二遍涂刷', desc: '第一遍干透后纵向涂刷，淋浴区刷至1.8m高' },
      { title: '第三遍涂刷', desc: '重点区域加强，整体厚度达到1.2-1.5mm' },
      { title: '闭水试验', desc: '蓄水3-5cm，48小时后检查楼下及相邻墙面无渗漏' },
    ],
    gbQuotes: [
      { code: 'GB 50327-2001', clause: '第6.3.3条', text: '防水层应从地面延伸到墙面，高出地面100mm；浴室墙面的防水层不得低于1800mm。' },
      { code: 'JGJ 298-2013', clause: '第5.1.3条', text: '防水工程完工后应做蓄水试验，蓄水时间不应少于24h。' },
    ],
    faqs: [
      { q: '为什么要做三遍防水？', a: '确保厚度均匀，避免单遍涂刷产生针孔漏点，交叉方向涂刷覆盖更全面。' },
      { q: '闭水试验只做24小时够吗？', a: '建议48小时更稳妥，特别是楼下无人居住时，24小时可能不足以发现慢渗。' },
      { q: '防水做好后多久可以贴砖？', a: '完全干透（夏季48h，冬季72h）后先做闭水试验，通过后方可进行下一道工序。' },
    ],
    pitfallGuides: [
      { id: 'pit4', title: '卫生间防水避坑指南', risk: 'high', viewCount: 23450, desc: '这5个位置不做好，漏水只是时间问题' },
      { id: 'pit5', title: '防水材料怎么选', risk: 'medium', viewCount: 11230, desc: '聚合物、聚氨酯、沥青漆区别详解' },
    ],
  },
  p10: {
    id: 'p10',
    name: '瓷砖薄贴工艺',
    stage: 'tile',
    duration: '5-7天',
    difficulty: '高',
    description: '齿形刮板配合瓷砖胶，空鼓率≤5%。适用于大尺寸瓷砖铺贴，粘结力强，厚度均匀，节省空间。',
    standardLevel: 'hb',
    acceptanceStandard: '单块砖边角空鼓率≤5%，通道位置零空鼓，平整度≤2mm/m',
    recommendedMaterials: ['C2TE级瓷砖胶', '齿形刮板(6mm)', '十字定位卡', '调平器'],
    steps: [
      { title: '基层检查', desc: '墙面平整度≤3mm/2m，无浮灰油污，提前浇水湿润' },
      { title: '预排砖', desc: '按墙面尺寸排版，非整砖放在不显眼位置，阳角整砖' },
      { title: '瓷砖胶配制', desc: '按比例加水搅拌，静置5分钟后再搅拌一次，随配随用' },
      { title: '薄涂刮胶', desc: '墙面和砖背面双面刮胶，齿形刮板刮出均匀条纹' },
      { title: '铺贴压实', desc: '揉压就位，用调平器调整平整度和缝隙' },
      { title: '清理养护', desc: '及时清理砖面余胶，24h后取出调平器，7d后可美缝' },
    ],
    gbQuotes: [
      { code: 'GB 50327-2001', clause: '第8.1.4条', text: '墙砖铺贴应平整、牢固、无歪斜、缺棱掉角和裂缝等缺陷。' },
      { code: 'JGJ/T 179-2009', clause: '第4.2.3条', text: '瓷砖胶粘结层厚度宜为3mm~6mm。' },
    ],
    faqs: [
      { q: '薄贴和厚贴有什么区别？', a: '薄贴用瓷砖胶3-6mm，粘结力是水泥砂浆的3倍，节省空间但对基层平整度要求高。' },
      { q: '瓷砖胶可以加水泥吗？', a: '绝对不行，会严重降低粘结强度，改变产品配方比例，导致空鼓脱落。' },
      { q: '哪些砖必须用薄贴？', a: '600x600以上大砖、全瓷砖、玻化砖吸水率低，必须用瓷砖胶薄贴工艺。' },
    ],
    pitfallGuides: [
      { id: 'pit6', title: '瓷砖空鼓脱落的5大原因', risk: 'high', viewCount: 18760, desc: '90%的问题都出在这几个环节' },
      { id: 'pit7', title: '瓷砖胶使用误区', risk: 'medium', viewCount: 9870, desc: '别让你的瓷砖胶变成"瓷砖交"' },
    ],
  },
  p18: {
    id: 'p18',
    name: '乳胶漆涂刷',
    stage: 'paint',
    duration: '3-4天',
    difficulty: '中',
    description: '底漆一遍面漆两遍，无流坠无漏刷，均匀一致。好的乳胶漆施工不仅美观，更能保护墙面、延长使用寿命。',
    standardLevel: 'gb',
    acceptanceStandard: '无掉粉、起皮、漏刷、透底，颜色均匀一致，平整度≤2mm',
    recommendedMaterials: ['抗碱封闭底漆', '净味乳胶漆', '羊毛滚筒/优质毛刷', '美纹纸'],
    steps: [
      { title: '基层检查', desc: '腻子层干透，含水率≤10%，打磨平整清扫浮灰' },
      { title: '成品保护', desc: '门窗、地面、开关插座贴美纹纸和保护膜' },
      { title: '底漆涂刷', desc: '先刷边角再滚涂大面，底漆干透约4-6小时' },
      { title: '第一遍面漆', desc: '均匀滚涂，注意接槎处理，避免流坠' },
      { title: '第二遍面漆', desc: '第一遍干透后（至少6小时）涂刷第二遍' },
      { title: '清理养护', desc: '7天内避免碰撞擦洗，完全固化后可正常使用' },
    ],
    gbQuotes: [
      { code: 'GB 50210-2018', clause: '第10.2.4条', text: '水性涂料涂饰工程的颜色、图案应符合设计要求。' },
      { code: 'GB 50210-2018', clause: '第10.2.5条', text: '水性涂料涂饰工程应涂饰均匀、粘结牢固，不得漏涂、透底、起皮和掉粉。' },
    ],
    faqs: [
      { q: '底漆为什么不能省？', a: '封闭碱性墙面，防止返碱泛黄，提高面漆附着力，节省面漆用量。' },
      { q: '滚涂好还是喷涂好？', a: '滚涂漆膜厚耐擦洗，有轻微纹理；喷涂表面光滑细腻，但漆膜薄，补漆有色差。' },
      { q: '冬天能刷乳胶漆吗？', a: '环境温度≥5℃才能施工，低于这个温度漆膜成膜不良，会粉化开裂。' },
    ],
    pitfallGuides: [
      { id: 'pit8', title: '乳胶漆施工常见问题', risk: 'medium', viewCount: 14560, desc: '发花、流挂、色差怎么解决' },
      { id: 'pit9', title: '乳胶漆选购攻略', risk: 'low', viewCount: 21340, desc: '净味、抗甲醛、儿童漆怎么选' },
    ],
  },
  p23: {
    id: 'p23',
    name: '定制橱柜安装',
    stage: 'installation',
    duration: '2天',
    difficulty: '高',
    description: '地柜调平、吊柜承重、台面拼接无缝。橱柜是厨房使用频率最高的家具，安装质量直接影响使用体验和寿命。',
    standardLevel: 'qb',
    acceptanceStandard: '台面拼接缝隙≤0.3mm，柜门平整缝隙均匀，抽屉推拉顺畅无异响',
    recommendedMaterials: ['石英石台面(≥15mm厚)', '阻尼铰链', '台下盆', 'DTC/百隆五金'],
    steps: [
      { title: '现场复核', desc: '核对墙面垂直度、地面平整度，确认水电点位' },
      { title: '地柜安装', desc: '按图纸摆放柜体，调平器调整水平和垂直' },
      { title: '吊柜安装', desc: '膨胀螺栓固定吊码，承重≥80kg/延米' },
      { title: '台面安装', desc: '现场拼接打磨，台下盆固定，防水密封' },
      { title: '五金调试', desc: '柜门缝隙调整，抽屉滑道测试，拉手安装' },
      { title: '清洁验收', desc: '清理现场，检查功能，客户签字确认' },
    ],
    gbQuotes: [
      { code: 'GB 50327-2001', clause: '第10.1.3条', text: '橱柜安装应牢固，配件齐全，位置正确，门、抽屉开启灵活。' },
    ],
    faqs: [
      { q: '吊柜会不会掉下来？', a: '使用吊码+膨胀螺栓固定，单个吊码承重≥50kg，正规安装完全不用担心。' },
      { q: '台面拼接缝明显怎么办？', a: '同色系石英石拼接后打磨抛光，肉眼几乎不可见，优质安装≤0.3mm。' },
      { q: '橱柜台面选多厚？', a: '石英石建议15mm以上，20mm更佳，太薄容易断裂。' },
    ],
    pitfallGuides: [
      { id: 'pit10', title: '橱柜安装验收清单', risk: 'high', viewCount: 25670, desc: '这10项必须逐项检查' },
      { id: 'pit11', title: '五金件怎么选', risk: 'medium', viewCount: 12340, desc: '铰链、导轨品牌对比' },
    ],
  },
  p29: {
    id: 'p29',
    name: '整体竣工验收',
    stage: 'acceptance',
    duration: '1天',
    difficulty: '高',
    description: '全房完工综合验收，空气检测，移交保修。是装修的最后一道关口，发现问题及时整改，避免入住后返工。',
    standardLevel: 'gb',
    acceptanceStandard: '观感质量合格，使用功能测试全部通过，空气检测符合GB 50325-2020标准',
    recommendedMaterials: ['功能检测工具箱', '空气质量检测仪', '竣工验收单', 'CMA检测机构'],
    steps: [
      { title: '资料核查', desc: '核对材料验收单、隐蔽工程记录、中期验收单' },
      { title: '观感检查', desc: '墙面、地面、吊顶、门窗、木作等外观质量' },
      { title: '功能测试', desc: '水电通断、卫浴试水、门窗开关、五金功能' },
      { title: '尺寸复核', desc: '核对实际工程量与预算是否一致' },
      { title: '空气检测', desc: '封闭门窗12小时后采样，CMA机构出具报告' },
      { title: '移交保修', desc: '签署验收单，交付钥匙和保修卡，结清尾款' },
    ],
    gbQuotes: [
      { code: 'GB 50300-2013', clause: '第5.0.4条', text: '建筑工程施工质量应按下列要求进行验收：工程质量验收均应在施工单位自检合格的基础上进行。' },
      { code: 'GB 50325-2020', clause: '第6.0.4条', text: '民用建筑工程验收时，必须进行室内环境污染物浓度检测。' },
    ],
    faqs: [
      { q: '验收不合格怎么办？', a: '在验收单上注明问题，约定整改期限，整改完成后重新验收，合格后再签字。' },
      { q: '空气检测超标怎么处理？', a: '要求装修方提供治理方案，达标后再入住，可要求赔偿延期损失。' },
      { q: '保修期限一般是多久？', a: '水电隐蔽工程保修5年，表面工程2年，合同有约定的从约定。' },
    ],
    pitfallGuides: [
      { id: 'pit12', title: '竣工验收20项必查清单', risk: 'high', viewCount: 32450, desc: '别着急签字，这些坑90%的人都踩过' },
      { id: 'pit13', title: '装修尾款怎么付', risk: 'medium', viewCount: 17890, desc: '先验后付还是先付后验？' },
    ],
  },
};

export default function ProcessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const detail = processDetails[id || 'p1'] || processDetails['p1'];
  const stageInfo = stagesMap[detail.stage] || stagesMap.hydropower;
  const StageIcon = stageInfo.icon;

  const getStandardBadge = (level: StandardLevel) => {
    if (level === 'gb') return { label: '国家标准', className: 'bg-wood-500 text-white' };
    if (level === 'hb') return { label: '行业标准', className: 'bg-haze-500 text-white' };
    return { label: '企业标准', className: 'bg-emerald-500 text-white' };
  };

  const standardBadge = getStandardBadge(detail.standardLevel);

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container py-8">
        <button
          onClick={() => navigate('/owner/process')}
          className="btn-ghost mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工艺库
        </button>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-3">
            <div className="sticky top-8">
              <div className="card-base overflow-hidden mb-4">
                <div className="px-5 py-4 border-b border-ivory-200 bg-gradient-to-r from-ivory-50 to-white">
                  <h3 className="font-semibold text-carbon-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-wood-600" />
                    施工步骤
                  </h3>
                  <p className="text-xs text-ivory-500 mt-0.5">共{detail.steps.length}步 · 工期{detail.duration}</p>
                </div>
                <div className="p-4">
                  <div className="relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-ivory-200" />
                    {detail.steps.map((step, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveStep(idx)}
                        className={cn(
                          'w-full relative flex items-start gap-3 py-3 text-left group',
                        )}
                      >
                        <div className={cn(
                          'relative z-10 w-5.5 h-5.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                          activeStep >= idx
                            ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/30'
                            : 'bg-white border-2 border-ivory-300 text-ivory-400'
                        )}>
                          {activeStep > idx ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <p className={cn(
                            'text-sm font-medium transition-colors',
                            activeStep === idx ? 'text-terracotta-700' : 'text-carbon-700 group-hover:text-carbon-900'
                          )}>
                            {step.title}
                          </p>
                          {activeStep === idx && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-ivory-600 mt-1 leading-relaxed"
                            >
                              {step.desc}
                            </motion.p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card-base p-5">
                <h3 className="font-semibold text-carbon-800 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-terracotta-600" />
                  推荐材料
                </h3>
                <ul className="space-y-2">
                  {detail.recommendedMaterials.map((mat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-carbon-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-terracotta-400 flex-shrink-0" />
                      {mat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="col-span-6 space-y-6">
            <div className="card-base p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={cn('badge inline-flex items-center gap-1.5', stageInfo.bgColor, stageInfo.color)}>
                  <StageIcon className="w-3.5 h-3.5" />
                  {stageInfo.label}
                </span>
                <span className="badge-wood">工期 {detail.duration}</span>
                <span className="badge-danger">难度 {detail.difficulty}</span>
                <span className={cn('badge', standardBadge.className)}>
                  <Award className="w-3 h-3" />
                  {standardBadge.label}
                </span>
                <span className="badge-haze">
                  <BookOpen className="w-3 h-3" />
                  {detail.gbQuotes.length}条标准
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-carbon-900 mb-3">{detail.name}</h1>
              <p className="text-carbon-600 leading-relaxed mb-4">{detail.description}</p>
              <div className="p-4 rounded-xl bg-wood-50 border border-wood-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-wood-500 text-white flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-wood-800 text-sm mb-1">验收标准</p>
                    <p className="text-sm text-wood-700 leading-relaxed">{detail.acceptanceStandard}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-serif text-xl font-semibold text-carbon-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                国标/行标条文引用
              </h3>
              {detail.gbQuotes.map((gb, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-xl bg-carbon-800/95 overflow-hidden"
                >
                  <div className="border-l-[3px] border-amber-400 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-mono text-amber-300 text-sm font-semibold">{gb.code}</p>
                        <p className="text-xs text-amber-200/60">{gb.clause}</p>
                      </div>
                    </div>
                    <blockquote className="text-ivory-100 leading-relaxed pl-2 border-l-2 border-amber-400/30 italic">
                      "{gb.text}"
                    </blockquote>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="card-base p-6">
              <h3 className="font-serif text-xl font-semibold text-carbon-800 mb-6">步骤详解</h3>
              <div className="space-y-6">
                {detail.steps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className={cn(
                      'p-5 rounded-xl border transition-all',
                      activeStep === idx
                        ? 'border-terracotta-300 bg-terracotta-50/50 shadow-sm'
                        : 'border-ivory-200 bg-white'
                    )}
                    onMouseEnter={() => setActiveStep(idx)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-wood-100 flex items-center justify-center font-serif font-bold text-wood-700">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-carbon-800 mb-2">{step.title}</h4>
                        <p className="text-sm text-carbon-600 leading-relaxed mb-4">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="card-base p-6">
              <h3 className="font-serif text-xl font-semibold text-carbon-800 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-haze-600" />
                常见问题 FAQ
              </h3>
              <div className="space-y-2">
                {detail.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="border border-ivory-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-ivory-50 transition-colors"
                    >
                      <span className="font-medium text-carbon-800 flex items-center gap-2">
                        <span className="text-terracotta-500 font-bold">Q{idx + 1}.</span>
                        {faq.q}
                      </span>
                      {expandedFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-ivory-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-ivory-400 flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {expandedFaq === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 ml-6 border-l-2 border-terracotta-200">
                            <p className="text-sm text-carbon-600 leading-relaxed">{faq.a}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="sticky top-8 space-y-4">
              <div className="card-base p-5">
                <h3 className="font-semibold text-carbon-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-terracotta-500" />
                  相关避坑指南
                </h3>
                <div className="space-y-3">
                  {detail.pitfallGuides.map((guide, idx) => (
                    <motion.div
                      key={guide.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      onClick={() => navigate('/owner/pitfalls')}
                      className="p-4 rounded-xl border border-ivory-200 hover:border-terracotta-300 hover:bg-terracotta-50/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={cn(
                          'badge text-[10px] flex-shrink-0',
                          guide.risk === 'high' && 'bg-rose-50 text-rose-700 border-rose-200',
                          guide.risk === 'medium' && 'bg-amber-50 text-amber-700 border-amber-200',
                          guide.risk === 'low' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        )}>
                          {guide.risk === 'high' ? '🔴 高风险' : guide.risk === 'medium' ? '🟡 中风险' : '🟢 低风险'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-ivory-300 group-hover:text-terracotta-500 flex-shrink-0 transition-colors" />
                      </div>
                      <h4 className="font-medium text-sm text-carbon-800 mb-1 group-hover:text-terracotta-700 transition-colors">
                        {guide.title}
                      </h4>
                      <p className="text-xs text-ivory-500 line-clamp-2 mb-2">{guide.desc}</p>
                      <p className="text-[11px] text-ivory-400 flex items-center gap-1">
                        👁 {guide.viewCount.toLocaleString()} 浏览
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="card-base p-5 bg-gradient-to-br from-terracotta-50 to-wood-50 border-terracotta-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-terracotta-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-carbon-800">标准验收节点</h4>
                </div>
                <ul className="space-y-2 text-sm text-carbon-600">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-terracotta-500" />
                    材料进场验收（品牌/规格）
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-terracotta-500" />
                    隐蔽工程验收（封槽前）
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-terracotta-500" />
                    中期验收（通电/通水测试）
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-terracotta-500" />
                    竣工验收（全面检测）
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
