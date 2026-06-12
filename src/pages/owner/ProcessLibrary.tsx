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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const stages = [
  {
    key: 'hydropower',
    label: '水电改造',
    icon: Zap,
    color: 'text-haze-600',
    bgColor: 'bg-haze-100',
    borderColor: 'border-haze-300',
    dotColor: 'bg-haze-500',
  },
  {
    key: 'tile',
    label: '泥瓦工程',
    icon: Droplets,
    color: 'text-terracotta-600',
    bgColor: 'bg-terracotta-100',
    borderColor: 'border-terracotta-300',
    dotColor: 'bg-terracotta-500',
  },
  {
    key: 'carpentry',
    label: '木工工程',
    icon: Hammer,
    color: 'text-wood-700',
    bgColor: 'bg-wood-100',
    borderColor: 'border-wood-300',
    dotColor: 'bg-wood-500',
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
];

interface Process {
  id: string;
  name: string;
  stage: string;
  gbCount: number;
  duration: string;
  difficulty: string;
  description: string;
  image: string;
}

const processes: Process[] = [
  { id: 'p1', name: '强电回路布设', stage: 'hydropower', gbCount: 5, duration: '2-3天', difficulty: '高', description: '根据用电负载合理分配回路，大功率电器独立回路',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('electrical wiring renovation site circuit breaker distribution box professional construction, documentary photography') + '&image_size=landscape_4_3&seed=501' },
  { id: 'p2', name: '弱电综合布线', stage: 'hydropower', gbCount: 3, duration: '1-2天', difficulty: '中', description: '网络、电视、电话、智能系统点位布置',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('structured cabling network cable routing home renovation site, documentary photography') + '&image_size=landscape_4_3&seed=502' },
  { id: 'p3', name: '给水PPR管安装', stage: 'hydropower', gbCount: 4, duration: '2天', difficulty: '高', description: '冷热水管分色布管，左热右冷，横平竖直',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('PPR water pipe installation plumbing renovation blue red pipes, construction site photography') + '&image_size=landscape_4_3&seed=503' },
  { id: 'p4', name: '排水坡度施工', stage: 'hydropower', gbCount: 3, duration: '1天', difficulty: '中', description: '确保排水通畅，干湿区坡度分别控制',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('floor drain slope construction bathroom drainage system, renovation site photography') + '&image_size=landscape_4_3&seed=504' },
  { id: 'p5', name: '卫生间防水层', stage: 'hydropower', gbCount: 6, duration: '2天', difficulty: '高', description: '三遍涂刷工艺，48小时闭水试验',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('bathroom waterproof coating application blue membrane construction site, renovation photography') + '&image_size=landscape_4_3&seed=505' },
  { id: 'p6', name: '全屋水管打压', stage: 'hydropower', gbCount: 2, duration: '0.5天', difficulty: '低', description: '1.0MPa压力30分钟压降≤0.05MPa',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('water pressure test gauge plumbing system testing, construction site photography') + '&image_size=landscape_4_3&seed=506' },

  { id: 'p7', name: '墙地面找平', stage: 'tile', gbCount: 3, duration: '2-3天', difficulty: '中', description: '2米靠尺误差≤3mm，为后续铺贴打基础',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('floor screed leveling cement mortar construction site, renovation photography') + '&image_size=landscape_4_3&seed=507' },
  { id: 'p8', name: '瓷砖薄贴工艺', stage: 'tile', gbCount: 5, duration: '5-7天', difficulty: '高', description: '齿形刮板配合瓷砖胶，空鼓率≤5%',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('tile adhesive thin-set installation trowel notched trowel, tiling construction site') + '&image_size=landscape_4_3&seed=508' },
  { id: 'p9', name: '大地板砖干铺', stage: 'tile', gbCount: 4, duration: '4-6天', difficulty: '高', description: '半干湿砂浆垫层，平整度更高',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('large format tile dry laying method floor installation, construction site photography') + '&image_size=landscape_4_3&seed=509' },
  { id: 'p10', name: '墙砖铺贴', stage: 'tile', gbCount: 4, duration: '5-6天', difficulty: '中', description: '预排砖、找规矩、墙压地工艺',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wall tile installation ceramic tile bathroom tiling worker, construction site photography') + '&image_size=landscape_4_3&seed=510' },
  { id: 'p11', name: '美缝填缝施工', stage: 'tile', gbCount: 2, duration: '1-2天', difficulty: '低', description: '瓷砖铺贴7天后进行，色彩持久防霉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('epoxy grout sealing tile joints beautiful seam work, construction detail photography') + '&image_size=landscape_4_3&seed=511' },

  { id: 'p12', name: '轻钢龙骨吊顶', stage: 'carpentry', gbCount: 4, duration: '3-5天', difficulty: '高', description: '主龙骨间距≤800mm，防开裂处理',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('light steel keel ceiling framework installation gypsum board, construction site photography') + '&image_size=landscape_4_3&seed=512' },
  { id: 'p13', name: '定制衣柜安装', stage: 'carpentry', gbCount: 3, duration: '2-3天', difficulty: '中', description: '现场精准调平，五金件顺滑耐用',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('custom wardrobe cabinet installation interior carpentry work, construction site photography') + '&image_size=landscape_4_3&seed=513' },
  { id: 'p14', name: '实木门套制作', stage: 'carpentry', gbCount: 3, duration: '1-2天', difficulty: '中', description: '45度对角拼接，门扇垂直偏差≤2mm',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wooden door frame installation carpentry work interior door, construction site photography') + '&image_size=landscape_4_3&seed=514' },
  { id: 'p15', name: '背景墙木饰面', stage: 'carpentry', gbCount: 3, duration: '2-3天', difficulty: '高', description: '基层防潮处理，饰面拼接无缝',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wood veneer feature wall paneling installation interior carpentry, construction site photography') + '&image_size=landscape_4_3&seed=515' },

  { id: 'p16', name: '墙面基层处理', stage: 'paint', gbCount: 5, duration: '4-6天', difficulty: '高', description: '嵌缝→找平→挂网→三遍腻子',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wall putty plastering surface preparation painting process, construction site photography') + '&image_size=landscape_4_3&seed=516' },
  { id: 'p17', name: '乳胶漆涂刷', stage: 'paint', gbCount: 4, duration: '3-4天', difficulty: '中', description: '底漆一遍面漆两遍，无流坠无漏刷',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('latex paint roller wall painting interior renovation, worker using paint roller photography') + '&image_size=landscape_4_3&seed=517' },
  { id: 'p18', name: '艺术漆质感涂', stage: 'paint', gbCount: 3, duration: '5-7天', difficulty: '高', description: '肌理效果专业施工，色彩均匀一致',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('artistic paint texture wall finish decorative coating application, interior design photography') + '&image_size=landscape_4_3&seed=518' },
  { id: 'p19', name: '石膏线安装', stage: 'paint', gbCount: 2, duration: '1-2天', difficulty: '低', description: '快粘粉固定，阴阳角拼接严密',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('plaster cornice moulding installation ceiling decoration, construction detail photography') + '&image_size=landscape_4_3&seed=519' },
  { id: 'p20', name: '木作清漆涂装', stage: 'paint', gbCount: 3, duration: '3-5天', difficulty: '高', description: '三底两面工艺，手感光滑无颗粒',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wood furniture varnish clear coat spray painting finish, carpentry workshop photography') + '&image_size=landscape_4_3&seed=520' },

  { id: 'p21', name: '木地板铺装', stage: 'installation', gbCount: 4, duration: '2-3天', difficulty: '中', description: '悬浮式铺装，伸缩缝预留规范',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('wood laminate floor installation floating flooring system, construction interior photography') + '&image_size=landscape_4_3&seed=521' },
  { id: 'p22', name: '定制橱柜安装', stage: 'installation', gbCount: 3, duration: '2天', difficulty: '高', description: '地柜调平、吊柜承重、台面拼接',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('custom kitchen cabinet installation countertop sink fitting, interior renovation photography') + '&image_size=landscape_4_3&seed=522' },
  { id: 'p23', name: '卫浴五金安装', stage: 'installation', gbCount: 3, duration: '1天', difficulty: '中', description: '防水密封处理，承重挂件牢固',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('bathroom fixtures installation faucet shower hardware fitting, construction detail photography') + '&image_size=landscape_4_3&seed=523' },
  { id: 'p24', name: '开关插座安装', stage: 'installation', gbCount: 3, duration: '1天', difficulty: '低', description: '水平一致，相邻面板间隙≤0.5mm',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('electrical switch socket outlet wall installation, electrician work detail photography') + '&image_size=landscape_4_3&seed=524' },
  { id: 'p25', name: '灯具安装调试', stage: 'installation', gbCount: 2, duration: '1天', difficulty: '中', description: '承重挂钩、水平定位、电路检测',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('chandelier pendant light installation ceiling wiring, electrician work photography') + '&image_size=landscape_4_3&seed=525' },
];

export default function ProcessLibrary() {
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState('hydropower');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProcesses = processes.filter(p => {
    const matchStage = activeStage === 'all' || p.stage === activeStage;
    const matchSearch = !searchQuery || p.name.includes(searchQuery) || p.description.includes(searchQuery);
    return matchStage && matchSearch;
  });

  const stageProcesses = stages.reduce<Record<string, Process[]>>((acc, s) => {
    acc[s.key] = filteredProcesses.filter(p => p.stage === s.key);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="section-title">施工工艺库</h1>
          <p className="section-subtitle">187项标准工艺，每道工序均标注对应国标条款</p>
        </div>

        <div className="flex gap-3 mb-8 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-500" />
            <input
              type="text"
              placeholder="搜索工艺名称..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-base pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-3">
            <div className="sticky top-8">
              <div className="card-base overflow-hidden">
                <div className="px-5 py-4 border-b border-ivory-200">
                  <h3 className="font-semibold text-carbon-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-wood-600" />
                    装修5大阶段
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
                        onClick={() => setActiveStage(isActive ? 'all' : stage.key)}
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
                        onClick={() => navigate(`/owner/process/${proc.id}`)}
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
                            <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium text-white', stage.dotColor)}>
                              {proc.difficulty}难度
                            </span>
                          </div>
                        </div>
                        <div className="col-span-3 p-4 flex flex-col justify-between">
                          <div>
                            <h4 className="font-semibold text-carbon-800 mb-1 group-hover:text-terracotta-600 transition-colors">
                              {proc.name}
                            </h4>
                            <p className="text-xs text-ivory-600 line-clamp-2 leading-relaxed">
                              {proc.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-xs text-ivory-500">
                                <BookOpen className="w-3 h-3 text-wood-500" />
                                <span className="font-semibold text-wood-700">{proc.gbCount}</span>条国标
                              </span>
                              <span className="text-xs text-ivory-500">{proc.duration}</span>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
