import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Droplets,
  Hammer,
  Palette,
  Plug,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Search,
  Eye,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const stages = [
  {
    key: 'hydropower',
    label: '水电工程',
    icon: Zap,
    color: 'text-haze-600',
    bgColor: 'bg-haze-100',
    borderColor: 'border-haze-300',
    dotColor: 'bg-haze-500',
  },
  {
    key: 'tile',
    label: '泥木工程',
    icon: Droplets,
    color: 'text-terracotta-600',
    bgColor: 'bg-terracotta-100',
    borderColor: 'border-terracotta-300',
    dotColor: 'bg-terracotta-500',
  },
  {
    key: 'paint',
    label: '油漆工程',
    icon: Palette,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    dotColor: 'bg-amber-500',
  },
  {
    key: 'installation',
    label: '安装工程',
    icon: Plug,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  {
    key: 'waterproof',
    label: '防水工程',
    icon: Shield,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    borderColor: 'border-sky-300',
    dotColor: 'bg-sky-500',
  },
  {
    key: 'acceptance',
    label: '竣工验收',
    icon: CheckCircle2,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    borderColor: 'border-violet-300',
    dotColor: 'bg-violet-500',
  },
];

type StandardLevel = 'gb' | 'hb' | 'qb';

interface Process {
  id: string;
  name: string;
  stage: string;
  gbCodes: string[];
  duration: string;
  difficulty: '低' | '中' | '高';
  description: string;
  image: string;
  viewCount: number;
  standardLevel: StandardLevel;
  acceptanceStandard: string;
  recommendedMaterials: string[];
}

const processes: Process[] = [
  { id: 'p1', name: '强电回路布设', stage: 'hydropower', gbCodes: ['GB 50327-2001', 'GB 50303-2015'], duration: '2-3天', difficulty: '高', description: '根据用电负载合理分配回路，大功率电器独立回路，确保用电安全', standardLevel: 'gb', acceptanceStandard: '绝缘电阻≥0.5MΩ，相位正确，漏电保护动作正常', recommendedMaterials: ['国标BV铜线', 'PVC穿线管(壁厚≥1.5mm)', '品牌断路器'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('electrical wiring renovation site circuit breaker distribution box professional construction, documentary photography') + '&image_size=landscape_4_3&seed=501', viewCount: 15820 },
  { id: 'p2', name: '弱电综合布线', stage: 'hydropower', gbCodes: ['GB 50311-2016'], duration: '1-2天', difficulty: '中', description: '网络、电视、电话、智能系统点位布置，强弱电分离防干扰', standardLevel: 'gb', acceptanceStandard: '六类线通断测试通过，信号衰减≤3dB', recommendedMaterials: ['六类非屏蔽双绞线', '弱电机柜', '屏蔽水晶头'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('structured cabling network cable routing home renovation site, documentary photography') + '&image_size=landscape_4_3&seed=502', viewCount: 9340 },
  { id: 'p3', name: '给水PPR管安装', stage: 'hydropower', gbCodes: ['GB 50242-2002'], duration: '2天', difficulty: '高', description: '冷热水管分色布管，左热右冷，横平竖直，热熔连接规范', standardLevel: 'gb', acceptanceStandard: '打压试验1.0MPa 30分钟压降≤0.05MPa', recommendedMaterials: ['品牌PPR热水管', '等径直接/弯头', '生料带'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('PPR water pipe installation plumbing renovation blue red pipes, construction site photography') + '&image_size=landscape_4_3&seed=503', viewCount: 12450 },
  { id: 'p4', name: '排水坡度施工', stage: 'hydropower', gbCodes: ['GB 50242-2002'], duration: '1天', difficulty: '中', description: '确保排水通畅，干湿区坡度分别控制，管道封堵防堵塞', standardLevel: 'gb', acceptanceStandard: '干区坡度≥1%，湿区≥2%，通水试验无积水', recommendedMaterials: ['PVC排水管', '地漏(水封≥5cm)', '管道堵漏王'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('floor drain slope construction bathroom drainage system, renovation site photography') + '&image_size=landscape_4_3&seed=504', viewCount: 7680 },

  { id: 'p5', name: '卫生间防水层', stage: 'waterproof', gbCodes: ['GB 50327-2001', 'JGJ 298-2013'], duration: '2天', difficulty: '高', description: '三遍涂刷工艺，48小时闭水试验，管根墙角加强处理', standardLevel: 'gb', acceptanceStandard: '闭水48小时无渗漏，淋浴区高度≥1.8m', recommendedMaterials: ['聚合物水泥基防水涂料', '无纺布加强层', '堵漏王'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('bathroom waterproof coating application blue membrane construction site, renovation photography') + '&image_size=landscape_4_3&seed=505', viewCount: 28930 },
  { id: 'p6', name: '全屋水管打压', stage: 'waterproof', gbCodes: ['GB 50242-2002'], duration: '0.5天', difficulty: '低', description: '1.0MPa压力30分钟压降≤0.05MPa，确保无渗漏', standardLevel: 'gb', acceptanceStandard: '试验压力1.0MPa，30分钟压降≤0.05MPa', recommendedMaterials: ['手动试压泵', '压力表', '堵头'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('water pressure test gauge plumbing system testing, construction site photography') + '&image_size=landscape_4_3&seed=506', viewCount: 6520 },
  { id: 'p7', name: '厨房防水施工', stage: 'waterproof', gbCodes: ['GB 50327-2001'], duration: '1.5天', difficulty: '中', description: '水槽区域重点加强，墙面返高30cm，地面全刷', standardLevel: 'gb', acceptanceStandard: '闭水24小时无渗漏，墙面返高≥30cm', recommendedMaterials: ['JS聚合物防水涂料', '玻纤网格布', '密封膏'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('kitchen waterproofing application construction site, renovation documentary') + '&image_size=landscape_4_3&seed=530', viewCount: 11240 },
  { id: 'p8', name: '阳台防水处理', stage: 'waterproof', gbCodes: ['GB 50327-2001'], duration: '1天', difficulty: '中', description: '地漏坡度排水通畅，墙面返高30cm，门口挡水条', standardLevel: 'qb', acceptanceStandard: '排水坡度≥2%，闭水试验无渗漏', recommendedMaterials: ['聚氨酯防水涂料', '挡水条', '地漏'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('balcony waterproofing floor drain renovation, construction site photography') + '&image_size=landscape_4_3&seed=531', viewCount: 8760 },

  { id: 'p9', name: '墙地面找平', stage: 'tile', gbCodes: ['GB 50209-2010'], duration: '2-3天', difficulty: '中', description: '2米靠尺误差≤3mm，为后续铺贴打基础', standardLevel: 'gb', acceptanceStandard: '2m靠尺检测平整度偏差≤3mm', recommendedMaterials: ['32.5级水泥', '中粗砂', '界面剂'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('floor screed leveling cement mortar construction site, renovation photography') + '&image_size=landscape_4_3&seed=507', viewCount: 10230 },
  { id: 'p10', name: '瓷砖薄贴工艺', stage: 'tile', gbCodes: ['GB 50327-2001', 'JGJ/T 179-2009'], duration: '5-7天', difficulty: '高', description: '齿形刮板配合瓷砖胶，空鼓率≤5%', standardLevel: 'hb', acceptanceStandard: '单块砖边角空鼓率≤5%，通道位置零空鼓', recommendedMaterials: ['C2TE级瓷砖胶', '齿形刮板(6mm)', '十字定位卡'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('tile adhesive thin-set installation trowel notched trowel, tiling construction site') + '&image_size=landscape_4_3&seed=508', viewCount: 19870 },
  { id: 'p11', name: '大地板砖干铺', stage: 'tile', gbCodes: ['GB 50209-2010'], duration: '4-6天', difficulty: '高', description: '半干湿砂浆垫层，平整度更高，减少空鼓', standardLevel: 'qb', acceptanceStandard: '平整度≤2mm/m，无明显高低差', recommendedMaterials: ['干硬性水泥砂浆(1:3)', '素水泥浆', '橡皮锤'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('large format tile dry laying method floor installation, construction site photography') + '&image_size=landscape_4_3&seed=509', viewCount: 8940 },
  { id: 'p12', name: '墙砖铺贴', stage: 'tile', gbCodes: ['GB 50327-2001'], duration: '5-6天', difficulty: '中', description: '预排砖、找规矩、墙压地工艺，阴阳角45度拼缝', standardLevel: 'gb', acceptanceStandard: '阴阳角方正≤2mm，砖缝均匀顺直', recommendedMaterials: ['墙砖专用瓷砖胶', '阳角条', '调平器'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wall tile installation ceramic tile bathroom tiling worker, construction site photography') + '&image_size=landscape_4_3&seed=510', viewCount: 14560 },
  { id: 'p13', name: '美缝填缝施工', stage: 'tile', gbCodes: ['JGJ/T 179-2009'], duration: '1-2天', difficulty: '低', description: '瓷砖铺贴7天后进行，色彩持久防霉，缝隙饱满', standardLevel: 'qb', acceptanceStandard: '缝隙饱满无空洞，表面光滑不塌陷', recommendedMaterials: ['环氧美缝剂', '美纹纸', '压缝球'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('epoxy grout sealing tile joints beautiful seam work, construction detail photography') + '&image_size=landscape_4_3&seed=511', viewCount: 13280 },
  { id: 'p14', name: '轻钢龙骨吊顶', stage: 'tile', gbCodes: ['GB 50327-2001', 'GB 50210-2018'], duration: '3-5天', difficulty: '高', description: '主龙骨间距≤800mm，防开裂处理，转角整板套割', standardLevel: 'gb', acceptanceStandard: '龙骨间距符合要求，石膏板封面错缝安装', recommendedMaterials: ['50系列主/副龙骨', '12mm厚纸面石膏板', '防锈自攻螺丝'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('light steel keel ceiling framework installation gypsum board, construction site photography') + '&image_size=landscape_4_3&seed=512', viewCount: 16720 },
  { id: 'p15', name: '定制衣柜安装', stage: 'tile', gbCodes: ['GB 50327-2001'], duration: '2-3天', difficulty: '中', description: '现场精准调平，五金件顺滑耐用，缝隙均匀', standardLevel: 'qb', acceptanceStandard: '柜体垂直度≤2mm，门缝≤2mm均匀一致', recommendedMaterials: ['定制柜体板材(ENF级)', 'DTC/百隆铰链', '反弹器/拉手'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('custom wardrobe cabinet installation interior carpentry work, construction site photography') + '&image_size=landscape_4_3&seed=513', viewCount: 18930 },
  { id: 'p16', name: '实木门套制作', stage: 'tile', gbCodes: ['GB 50210-2018'], duration: '1-2天', difficulty: '中', description: '45度对角拼接，门扇垂直偏差≤2mm', standardLevel: 'gb', acceptanceStandard: '对角线长度差≤2mm，门扇开合顺畅无异响', recommendedMaterials: ['实木/实木复合门套线', '发泡胶', '合页(3个/扇)'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wooden door frame installation carpentry work interior door, construction site photography') + '&image_size=landscape_4_3&seed=514', viewCount: 7650 },

  { id: 'p17', name: '墙面基层处理', stage: 'paint', gbCodes: ['GB 50327-2001', 'GB 50210-2018'], duration: '4-6天', difficulty: '高', description: '嵌缝→找平→挂网→三遍腻子，防开裂基础', standardLevel: 'gb', acceptanceStandard: '2m靠尺平整度≤2mm，阴阳角方正顺直', recommendedMaterials: ['耐水腻子粉', '网格布/牛皮纸', '阴/阳角条'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wall putty plastering surface preparation painting process, construction site photography') + '&image_size=landscape_4_3&seed=516', viewCount: 14320 },
  { id: 'p18', name: '乳胶漆涂刷', stage: 'paint', gbCodes: ['GB 50210-2018'], duration: '3-4天', difficulty: '中', description: '底漆一遍面漆两遍，无流坠无漏刷，均匀一致', standardLevel: 'gb', acceptanceStandard: '无掉粉、起皮、漏刷、透底，颜色均匀一致', recommendedMaterials: ['抗碱封闭底漆', '净味乳胶漆', '羊毛滚筒/优质毛刷'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('latex paint roller wall painting interior renovation, worker using paint roller photography') + '&image_size=landscape_4_3&seed=517', viewCount: 21450 },
  { id: 'p19', name: '艺术漆质感涂', stage: 'paint', gbCodes: ['JGJ/T 29-2015'], duration: '5-7天', difficulty: '高', description: '肌理效果专业施工，色彩均匀一致，纹理清晰', standardLevel: 'hb', acceptanceStandard: '图案纹理清晰，颜色协调无明显色差', recommendedMaterials: ['艺术漆专用底/中/面漆', '肌理工具套装', '色浆'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('artistic paint texture wall finish decorative coating application, interior design photography') + '&image_size=landscape_4_3&seed=518', viewCount: 9870 },
  { id: 'p20', name: '石膏线安装', stage: 'paint', gbCodes: ['GB 50210-2018'], duration: '1-2天', difficulty: '低', description: '快粘粉固定，阴阳角拼接严密，线条顺直', standardLevel: 'gb', acceptanceStandard: '拼接缝隙≤0.5mm，水平垂直偏差≤2mm', recommendedMaterials: ['石膏线条', '快粘粉', '专用钉子'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('plaster cornice moulding installation ceiling decoration, construction detail photography') + '&image_size=landscape_4_3&seed=519', viewCount: 5430 },
  { id: 'p21', name: '木作清漆涂装', stage: 'paint', gbCodes: ['GB 50327-2001'], duration: '3-5天', difficulty: '高', description: '三底两面工艺，手感光滑无颗粒，木纹清晰', standardLevel: 'qb', acceptanceStandard: '漆膜光滑饱满，木纹清晰，无流挂针孔', recommendedMaterials: ['木器清漆(底漆+面漆)', '砂纸(240#~600#)', '过滤网'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wood furniture varnish clear coat spray painting finish, carpentry workshop photography') + '&image_size=landscape_4_3&seed=520', viewCount: 6780 },

  { id: 'p22', name: '木地板铺装', stage: 'installation', gbCodes: ['GB 50209-2010'], duration: '2-3天', difficulty: '中', description: '悬浮式铺装，伸缩缝预留规范，防潮膜铺设', standardLevel: 'gb', acceptanceStandard: '行走无异响，伸缩缝8-12mm均匀预留', recommendedMaterials: ['防潮珍珠棉', '地板钉/卡扣', '踢脚线+收边条'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wood laminate floor installation floating flooring system, construction interior photography') + '&image_size=landscape_4_3&seed=521', viewCount: 17560 },
  { id: 'p23', name: '定制橱柜安装', stage: 'installation', gbCodes: ['GB 50327-2001'], duration: '2天', difficulty: '高', description: '地柜调平、吊柜承重、台面拼接无缝', standardLevel: 'qb', acceptanceStandard: '台面拼接缝隙≤0.3mm，柜门平整缝隙均匀', recommendedMaterials: ['石英石台面(≥15mm厚)', '阻尼铰链', '台下盆'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('custom kitchen cabinet installation countertop sink fitting, interior renovation photography') + '&image_size=landscape_4_3&seed=522', viewCount: 22340 },
  { id: 'p24', name: '卫浴五金安装', stage: 'installation', gbCodes: ['GB 50242-2002'], duration: '1天', difficulty: '中', description: '防水密封处理，承重挂件牢固，位置精准', standardLevel: 'gb', acceptanceStandard: '试水无渗漏，挂件牢固不松动，水平准确', recommendedMaterials: ['黄铜/不锈钢五金件', '中性玻璃胶', '膨胀螺栓'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('bathroom fixtures installation faucet shower hardware fitting, construction detail photography') + '&image_size=landscape_4_3&seed=523', viewCount: 8920 },
  { id: 'p25', name: '开关插座安装', stage: 'installation', gbCodes: ['GB 50303-2015'], duration: '1天', difficulty: '低', description: '水平一致，相邻面板间隙≤0.5mm，相位正确', standardLevel: 'gb', acceptanceStandard: '相位检测正确，面板整齐水平一致', recommendedMaterials: ['品牌插座面板', '防水盒(厨卫)', '暗盒修复器'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('electrical switch socket outlet wall installation, electrician work detail photography') + '&image_size=landscape_4_3&seed=524', viewCount: 11280 },
  { id: 'p26', name: '灯具安装调试', stage: 'installation', gbCodes: ['GB 50303-2015'], duration: '1天', difficulty: '中', description: '承重挂钩、水平定位、电路检测，灯具牢固', standardLevel: 'gb', acceptanceStandard: '承重≥灯具重量4倍，通电全亮无频闪', recommendedMaterials: ['膨胀挂钩/吊钩', '绝缘胶带', '灯具配件包'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('chandelier pendant light installation ceiling wiring, electrician work photography') + '&image_size=landscape_4_3&seed=525', viewCount: 9450 },

  { id: 'p27', name: '隐蔽工程验收', stage: 'acceptance', gbCodes: ['GB 50327-2001', 'GB 50300-2013'], duration: '0.5天', difficulty: '高', description: '水电管线封槽前全面验收，拍照留档，签字确认', standardLevel: 'gb', acceptanceStandard: '水电管线走向清晰，测试全部合格，拍照留档', recommendedMaterials: ['绝缘摇表', '压力表', '验收记录单'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('construction site inspection quality check acceptance, engineering professional photography') + '&image_size=landscape_4_3&seed=526', viewCount: 24560 },
  { id: 'p28', name: '中期竣工验收', stage: 'acceptance', gbCodes: ['GB 50210-2018'], duration: '1天', difficulty: '高', description: '泥木油漆完工后的全面检查，工程量确认', standardLevel: 'gb', acceptanceStandard: '各分项工程合格率100%，工程量核对一致', recommendedMaterials: ['2米靠尺', '对角检测尺', '空鼓锤'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('interior renovation mid-term inspection quality control, professional site check') + '&image_size=landscape_4_3&seed=527', viewCount: 18230 },
  { id: 'p29', name: '整体竣工验收', stage: 'acceptance', gbCodes: ['GB 50300-2013', 'GB 50210-2018'], duration: '1天', difficulty: '高', description: '全房完工综合验收，空气检测，移交保修', standardLevel: 'gb', acceptanceStandard: '观感质量合格，使用功能测试全部通过', recommendedMaterials: ['功能检测工具箱', '空气质量检测仪', '竣工验收单'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('final home renovation acceptance inspection handover, professional quality check photography') + '&image_size=landscape_4_3&seed=528', viewCount: 31240 },
  { id: 'p30', name: '室内空气检测', stage: 'acceptance', gbCodes: ['GB 50325-2020', 'GB/T 18883-2002'], duration: '1天', difficulty: '中', description: '甲醛、苯系物、TVOC检测，CMA认证机构出具报告', standardLevel: 'gb', acceptanceStandard: '甲醛≤0.07mg/m³，苯≤0.06mg/m³，TVOC≤0.45mg/m³', recommendedMaterials: ['CMA认证机构', '大气采样器', '分光光度计'],
    image: '/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('indoor air quality testing formaldehyde detection equipment, professional environmental testing') + '&image_size=landscape_4_3&seed=529', viewCount: 26780 },
];

const tabStages = [
  { key: 'all', label: '全部工艺' },
  ...stages.map(s => ({ key: s.key, label: s.label })),
];

export default function ProcessLibrary() {
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProcesses = processes.filter(p => {
    const matchStage = activeStage === 'all' || activeTab === 'all' ? true : p.stage === activeStage || p.stage === activeTab;
    const finalStage = activeTab !== 'all' ? activeTab : activeStage;
    const stageMatch = finalStage === 'all' || p.stage === finalStage;
    const matchSearch = !searchQuery || p.name.includes(searchQuery) || p.description.includes(searchQuery) || p.gbCodes.some(c => c.includes(searchQuery));
    return stageMatch && matchSearch;
  });

  const stageProcesses = stages.reduce<Record<string, Process[]>>((acc, s) => {
    acc[s.key] = filteredProcesses.filter(p => p.stage === s.key);
    return acc;
  }, {});

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    setActiveStage(key);
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === '高') return 'bg-rose-500';
    if (difficulty === '中') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStandardBadge = (level: StandardLevel) => {
    if (level === 'gb') return { label: '国标', className: 'bg-wood-500 text-white' };
    if (level === 'hb') return { label: '行标', className: 'bg-haze-500 text-white' };
    return { label: '企标', className: 'bg-emerald-500 text-white' };
  };

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="section-title">施工工艺库</h1>
          <p className="section-subtitle">187项标准工艺，每道工序均标注对应国标条款</p>
        </div>

        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-500" />
            <input
              type="text"
              placeholder="搜索工艺名称、国标编号..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-base pl-10"
            />
          </div>
        </div>

        <div className="card-base p-2 mb-8 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabStages.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={cn(
                  'px-5 py-2.5 rounded-btn text-sm font-medium transition-all whitespace-nowrap',
                  activeTab === tab.key
                    ? 'bg-terracotta-500 text-white shadow-sm'
                    : 'text-carbon-600 hover:bg-ivory-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-3">
            <div className="sticky top-8">
              <div className="card-base overflow-hidden">
                <div className="px-5 py-4 border-b border-ivory-200">
                  <h3 className="font-semibold text-carbon-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-wood-600" />
                    装修6大阶段
                  </h3>
                </div>
                <div className="p-2 relative">
                  <div className="absolute left-[22px] top-8 bottom-8 w-0.5 bg-ivory-200" />
                  {stages.map((stage, idx) => {
                    const Icon = stage.icon;
                    const count = processes.filter(p => p.stage === stage.key).length;
                    const isActive = activeStage === stage.key;
                    return (
                      <button
                        key={stage.key}
                        onClick={() => {
                          setActiveStage(isActive ? 'all' : stage.key);
                          setActiveTab(isActive ? 'all' : stage.key);
                        }}
                        className={cn(
                          'w-full relative flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 text-left mb-1',
                          isActive
                            ? `${stage.bgColor} shadow-sm`
                            : 'hover:bg-ivory-100'
                        )}
                      >
                        <div className="relative z-10 flex-shrink-0">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                            isActive
                              ? `${stage.bgColor} ${stage.color} ring-2 ring-white shadow-md`
                              : 'bg-white border border-ivory-200 text-ivory-500'
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className={cn(
                            'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white',
                            stage.dotColor
                          )}>
                            {idx + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'font-medium text-sm',
                            isActive ? stage.color : 'text-carbon-700'
                          )}>
                            {stage.label}
                          </p>
                          <p className="text-xs text-ivory-500">{count}项工艺</p>
                        </div>
                        {isActive && (
                          <ChevronRight className={cn('w-4 h-4 flex-shrink-0', stage.color)} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card-base p-5 mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-carbon-800 text-sm">国标承诺</p>
                    <p className="text-xs text-ivory-500">每项工艺严格遵循GB标准</p>
                  </div>
                </div>
                <p className="text-xs text-carbon-600 leading-relaxed">
                  所有工艺均参考 <span className="font-mono text-wood-700">GB 50327-2001</span>《住宅装饰装修工程施工规范》及最新增补标准制定。
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-9 space-y-10">
            {stages.map(stage => {
              const items = stageProcesses[stage.key] || [];
              if (items.length === 0) return null;
              const Icon = stage.icon;
              return (
                <div key={stage.key} id={`stage-${stage.key}`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stage.bgColor)}>
                      <Icon className={cn('w-5 h-5', stage.color)} />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-carbon-800">{stage.label}</h2>
                    <span className="text-sm text-ivory-500">{items.length}项工艺</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {items.map((proc, idx) => (
                      <motion.div
                        key={proc.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.4 }}
                        onClick={() => navigate(`/owner/knowledge/process/${proc.id}`)}
                        className="card-hoverable group overflow-hidden cursor-pointer grid grid-cols-5 gap-0"
                      >
                        <div className="col-span-2 relative overflow-hidden bg-ivory-100 aspect-[4/3]">
                          <img
                            src={proc.image}
                            alt={proc.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium text-white', getDifficultyColor(proc.difficulty))}>
                              {proc.difficulty}难度
                            </span>
                            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', getStandardBadge(proc.standardLevel).className)}>
                              {getStandardBadge(proc.standardLevel).label}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-3 p-4 flex flex-col justify-between">
                          <div>
                            <h4 className="font-semibold text-carbon-800 mb-1 group-hover:text-terracotta-600 transition-colors line-clamp-1">
                              {proc.name}
                            </h4>
                            <p className="text-xs text-ivory-600 line-clamp-2 leading-relaxed mb-2">
                              {proc.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {proc.gbCodes.slice(0, 2).map(code => (
                                <span key={code} className="px-1.5 py-0.5 rounded bg-wood-50 text-wood-700 border border-wood-200 font-mono text-[10px]">
                                  {code}
                                </span>
                              ))}
                              {proc.gbCodes.length > 2 && (
                                <span className="px-1.5 py-0.5 rounded bg-ivory-100 text-ivory-500 text-[10px]">
                                  +{proc.gbCodes.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-ivory-100">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-ivory-500">{proc.duration}</span>
                              <span className="flex items-center gap-1 text-xs text-ivory-500">
                                <Eye className="w-3 h-3" />
                                {proc.viewCount.toLocaleString()}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-ivory-300 group-hover:text-terracotta-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredProcesses.length === 0 && (
              <div className="card-base p-16 text-center">
                <p className="text-ivory-500">没有找到匹配的工艺</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveTab('all'); setActiveStage('all'); }}
                  className="btn-secondary mt-4"
                >
                  清除筛选条件
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
