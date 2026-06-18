import { motion } from 'framer-motion';
import { CheckCircle, Clock, Circle, ChevronRight, Building2 } from 'lucide-react';
import { useGet } from '../../hooks/useApi';
import Card from '../../components/Card';
import type { LifecycleNode } from '../../../shared/types';

export default function Lifecycle() {
  const { data: lifecycleNodes, isLoading } = useGet<LifecycleNode[]>(
    ['lifecycle'],
    '/enterprise/lifecycle'
  );

  const stages = [
    { id: 'startup', name: '初创期', color: 'bg-blue-500' },
    { id: 'growth', name: '成长期', color: 'bg-green-500' },
    { id: 'maturity', name: '成熟期', color: 'bg-purple-500' },
    { id: 'decline', name: '衰退/转型期', color: 'bg-orange-500' },
  ];

  const currentStage = 'growth';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">企业生命周期</h3>
        <div className="relative">
          <div className="flex justify-between mb-2">
            {stages.map((stage) => (
              <div key={stage.id} className="flex flex-col items-center relative z-10">
                <div className={`w-12 h-12 rounded-full ${stage.color} flex items-center justify-center text-white font-bold mb-2 ${
                  stage.id === currentStage ? 'ring-4 ring-offset-2' : stage.id === 'startup' ? 'ring-4 ring-offset-2 ring-green-500/50' : 'opacity-50'
                }`}>
                  {stage.id === currentStage ? <Building2 className="w-6 h-6" /> : 
                   stage.id === 'startup' ? <CheckCircle className="w-6 h-6" /> :
                   <span className="text-sm">{stages.indexOf(stage) + 1}</span>}
                </div>
                <span className={`text-sm font-medium ${
                  stage.id === currentStage || stage.id === 'startup' ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {stage.name}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-0">
            <div className="h-0.5 bg-green-500" style={{ width: '33%' }} />
          </div>
        </div>
      </div>

      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900">生命周期服务图谱</h3>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-1/4 mb-3" />
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {stages.map((stage, stageIdx) => (
                <div key={stage.id} className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-full ${stage.color} flex items-center justify-center text-white text-sm font-bold`}>
                      {stageIdx + 1}
                    </div>
                    <h4 className="font-semibold text-gray-900">{stage.name}</h4>
                    {stage.id === currentStage && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        当前阶段
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-11">
                    {[
                      { name: '工商注册', status: 'completed', desc: '完成企业设立登记' },
                      { name: '税务登记', status: 'completed', desc: '完成税务报到' },
                      { name: '银行开户', status: 'completed', desc: '开立基本存款账户' },
                      { name: '社保开户', status: 'current', desc: '办理社会保险登记' },
                      { name: '公积金开户', status: 'upcoming', desc: '办理住房公积金登记' },
                      { name: '资质办理', status: 'upcoming', desc: '申请行业相关资质' },
                    ].filter((_, i) => i >= stageIdx * 2 && i < (stageIdx + 1) * 2 + 1).map((node, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          node.status === 'completed' ? 'border-green-200 bg-green-50' :
                          node.status === 'current' ? 'border-primary/30 bg-primary/5' :
                          'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {node.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : node.status === 'current' ? (
                            <Clock className="w-5 h-5 text-primary animate-pulse" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                          <span className={`font-medium ${
                            node.status === 'completed' ? 'text-green-700' :
                            node.status === 'current' ? 'text-primary' :
                            'text-gray-500'
                          }`}>
                            {node.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{node.desc}</p>
                        <button className="mt-3 w-full text-xs text-primary flex items-center justify-center gap-1 hover:underline">
                          查看服务 <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </motion.div>
  );
}
