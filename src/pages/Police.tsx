import { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, FileCheck, Clock, User } from 'lucide-react';

const categories = ['户籍', '身份证', '居住证', '出入境'];

const guides = [
  {
    id: 1,
    category: '户籍',
    title: '户口迁移（市内）',
    materials: ['户口簿', '身份证', '房产证或租赁合同', '迁移申请书'],
    process: ['携带材料至迁入地派出所', '填写户口迁移申请表', '民警审核材料', '办理迁移手续', '领取新户口簿'],
    duration: '1-3个工作日',
    fee: '免费',
  },
  {
    id: 2,
    category: '户籍',
    title: '新生儿落户',
    materials: ['出生医学证明', '父母户口簿', '父母身份证', '结婚证'],
    process: ['准备相关材料', '到父或母户口所在地派出所申请', '民警审核', '办理落户登记'],
    duration: '当场办理',
    fee: '免费',
  },
  {
    id: 3,
    category: '身份证',
    title: '身份证申领',
    materials: ['户口簿', '旧身份证（换领）', '照片回执'],
    process: ['到户籍地派出所办理', '采集人像和指纹信息', '缴纳工本费', '等待制证', '领取新证'],
    duration: '15-30个工作日',
    fee: '¥20（换领）',
  },
  {
    id: 4,
    category: '身份证',
    title: '身份证补领',
    materials: ['户口簿或居住证', '挂失申报证明'],
    process: ['到派出所挂失', '填写补领申请表', '采集信息', '缴纳工本费', '领取新证'],
    duration: '15-30个工作日',
    fee: '¥40',
  },
  {
    id: 5,
    category: '居住证',
    title: '居住证申领',
    materials: ['身份证', '居住证明（租房合同/房产证）', '就业证明或就读证明', '近期照片'],
    process: ['网上预约或现场申请', '提交材料', '审核通过', '制作证件', '领取居住证'],
    duration: '15个工作日',
    fee: '免费',
  },
  {
    id: 6,
    category: '出入境',
    title: '护照申领',
    materials: ['身份证', '户口簿', '照片回执', '旧护照（换发）'],
    process: ['网上预约', '到出入境管理大厅办理', '采集信息', '缴费', '领取护照'],
    duration: '7个工作日',
    fee: '¥120',
  },
  {
    id: 7,
    category: '出入境',
    title: '港澳通行证',
    materials: ['身份证', '照片回执', '旧证（换发）'],
    process: ['网上预约', '到出入境管理大厅', '采集信息', '缴费', '领取证件'],
    duration: '7个工作日',
    fee: '¥60',
  },
];

export default function Police() {
  const [activeCategory, setActiveCategory] = useState('户籍');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = guides.filter((g) => g.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif-cn text-2xl font-bold text-warm-800 mb-6 flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-primary" />
        公安户政
      </h1>

      <div className="flex gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setExpandedId(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-white'
                : 'bg-white text-warm-600 hover:bg-warm-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map((guide) => {
          const isExpanded = expandedId === guide.id;
          return (
            <div key={guide.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : guide.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <div>
                  <h3 className="font-semibold text-warm-800">{guide.title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-warm-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {guide.duration}
                    </span>
                    <span className="text-xs text-warm-500 flex items-center gap-1">
                      <FileCheck className="w-3 h-3" />
                      {guide.fee}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-warm-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-warm-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-warm-100 pt-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-warm-700 mb-2 flex items-center gap-1">
                      <FileCheck className="w-4 h-4 text-accent" />
                      所需材料
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {guide.materials.map((m, i) => (
                        <span
                          key={i}
                          className="text-xs bg-warm-100 text-warm-700 px-3 py-1.5 rounded-md"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-warm-700 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4 text-primary" />
                      办理流程
                    </h4>
                    <ol className="space-y-2">
                      {guide.process.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-warm-600">
                          <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
