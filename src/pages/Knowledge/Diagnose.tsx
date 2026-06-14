import { motion } from 'framer-motion'
import { Upload, ShieldCheck, Leaf, Image as ImageIcon } from 'lucide-react'
import type { PestDiagnosis } from '@/types'

const MOCK_RESULT: PestDiagnosis = {
  id: 'PD-DEMO',
  imageUrl: '',
  pestName: '番茄晚疫病',
  confidence: 95,
  description: '番茄晚疫病是由致病疫霉菌引起的真菌性病害，主要危害叶片、茎秆和果实。叶片染病多从叶尖、叶缘开始，初为暗绿色水浸状，后变为褐色，湿度大时叶背面产生白色霉层。',
  treatment: [
    '喷施72%霜脲锰锌可湿性粉剂600倍液',
    '使用25%嘧菌酯悬浮剂1500倍液喷雾',
    '发病初期用68.75%银法利悬浮剂600倍液',
    '交替用药，间隔7天喷施一次',
  ],
  prevention: [
    '选用抗病品种，合理密植',
    '加强通风降湿，避免大水漫灌',
    '及时清除病残体，减少菌源',
    '定植前进行土壤消毒处理',
  ],
}

const DIAGNOSIS_HISTORY: PestDiagnosis[] = [
  {
    id: 'PD-001',
    imageUrl: '',
    pestName: '黄瓜霜霉病',
    confidence: 89,
    description: '叶片正面出现黄色褪绿斑，背面产生灰黑色霉层',
    treatment: ['喷施代森锰锌', '使用霜霉威盐酸盐'],
    prevention: ['控制湿度', '合理密植'],
  },
  {
    id: 'PD-002',
    imageUrl: '',
    pestName: '苹果褐斑病',
    confidence: 92,
    description: '叶片上出现褐色不规则病斑，边缘不清晰',
    treatment: ['喷施多菌灵', '使用波尔多液防治'],
    prevention: ['冬季清园', '增强树势'],
  },
  {
    id: 'PD-003',
    imageUrl: '',
    pestName: '水稻纹枯病',
    confidence: 87,
    description: '叶鞘上出现云纹状灰绿色至灰褐色病斑',
    treatment: ['喷施井冈霉素', '使用噻呋酰胺'],
    prevention: ['合理施肥', '适时晒田'],
  },
]

export default function DiagnosePage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-3xl font-bold text-earth-500">病虫害AI识别</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8"
        >
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary-500" />
            </div>
            <p className="text-lg font-medium text-gray-600">拖拽或点击上传作物图片</p>
            <p className="text-sm text-gray-400 mt-1">支持 JPG、PNG 格式，最大 10MB</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="font-serif text-xl font-semibold text-earth-500 mb-4">诊断结果示例</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-3">
              <div className="bg-gray-50 flex items-center justify-center p-8 min-h-[200px]">
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                </div>
              </div>
              <div className="col-span-2 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-serif text-xl font-bold text-earth-500">{MOCK_RESULT.pestName}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-sm font-medium">
                    置信度 {MOCK_RESULT.confidence}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{MOCK_RESULT.description}</p>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-primary-500" />
                    <h4 className="text-sm font-semibold text-earth-500">治疗建议</h4>
                  </div>
                  <ul className="space-y-1">
                    {MOCK_RESULT.treatment.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-primary-500">{i + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="w-4 h-4 text-primary-500" />
                    <h4 className="text-sm font-semibold text-earth-500">预防措施</h4>
                  </div>
                  <ul className="space-y-1">
                    {MOCK_RESULT.prevention.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-gold-500">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-serif text-xl font-semibold text-earth-500 mb-4">诊断历史</h2>
          <div className="space-y-3">
            {DIAGNOSIS_HISTORY.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-earth-500">{record.pestName}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{record.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary-500">{record.confidence}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
