import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  Calendar,
  Scale,
  Syringe,
  Bug,
  FileText,
  HeartPulse,
  Plus,
  Edit2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/UIComponents';
import { Badge, Tag } from '@/components/common/BadgeTagAvatar';
import { HealthScoreRing } from '@/components/business/HealthScoreRing';
import {
  Timeline,
  transformVaccineToTimeline,
  transformDewormingToTimeline,
  transformMedicalToTimeline,
} from '@/components/business/Timeline';
import { usePetStore } from '@/stores/petStore';
import { cn } from '@/utils/common';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    pets,
    currentPet,
    vaccines,
    dewormings,
    medicalRecords,
    fetchPetById,
    fetchPetHealthData,
    isLoading,
  } = usePetStore();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchPetById(id);
      fetchPetHealthData(id);
    }
  }, [id, fetchPetById, fetchPetHealthData]);

  const pet = currentPet || pets.find((p) => p.id === id);

  const weightData = [
    { date: '1月', weight: pet?.weight ? pet.weight - 0.3 : 3.9 },
    { date: '2月', weight: pet?.weight ? pet.weight - 0.2 : 4.0 },
    { date: '3月', weight: pet?.weight ? pet.weight - 0.1 : 4.1 },
    { date: '4月', weight: pet?.weight || 4.1 },
    { date: '5月', weight: pet?.weight ? pet.weight + 0.05 : 4.15 },
    { date: '6月', weight: pet?.weight || 4.2 },
  ];

  const glucoseData = pet?.chronicConditions?.[0]?.metrics?.map((m) => ({
    date: format(new Date(m.date), 'MM-dd', { locale: zhCN }),
    value: m.value,
  })) || [];

  if (!pet) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">加载中...</p>
      </div>
    );
  }

  const age = pet.birthday
    ? `${Math.floor((new Date().getTime() - new Date(pet.birthday).getTime()) / (1000 * 60 * 60 * 24 * 30))}个月`
    : '未知';

  const speciesEmoji = {
    dog: '🐕',
    cat: '🐱',
    rabbit: '🐰',
    bird: '🐦',
    other: '🐾',
  }[pet.species];

  const tabs = [
    { id: 'overview', label: '概览' },
    { id: 'vaccine', label: '疫苗记录' },
    { id: 'deworming', label: '驱虫记录' },
    { id: 'medical', label: '病历档案' },
    { id: 'chronic', label: '慢病管理' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/pets')}>
          ← 返回宠物列表
        </Button>
        <Button variant="outline" size="sm">
          <Edit2 className="w-4 h-4 mr-2" />
          编辑档案
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-mint-400 h-32 relative">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -bottom-12 left-8">
            <div className="relative">
              {pet.avatar ? (
                <img
                  src={pet.avatar}
                  alt={pet.name}
                  className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-float"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-primary-100 flex items-center justify-center text-5xl border-4 border-white shadow-float">
                  {speciesEmoji}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-16 px-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl font-bold text-neutral-900">{pet.name}</h1>
                <Badge variant={pet.healthScore >= 80 ? 'success' : pet.healthScore >= 60 ? 'warning' : 'danger'}>
                  健康分 {pet.healthScore}
                </Badge>
              </div>
              <p className="text-neutral-500 mt-1">
                {speciesEmoji} {pet.breed} · {pet.gender === 'male' ? '♂ 公' : '♀ 母'} · {age}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {pet.tags.map((tag) => (
                  <Tag key={tag} variant="mint">
                    {tag}
                  </Tag>
                ))}
                {pet.sterilization === 'yes' && <Tag variant="neutral">已绝育</Tag>}
              </div>
            </div>

            <HealthScoreRing score={pet.healthScore} size={120} />
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-100">
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-neutral-900">{pet.weight}kg</p>
              <p className="text-sm text-neutral-500 mt-1">当前体重</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-neutral-900">
                {pet.birthday ? format(new Date(pet.birthday), 'yyyy-MM-dd', { locale: zhCN }) : '未知'}
              </p>
              <p className="text-sm text-neutral-500 mt-1">出生日期</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-primary-600">{vaccines.length}</p>
              <p className="text-sm text-neutral-500 mt-1">疫苗记录</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-accent-600">{dewormings.length}</p>
              <p className="text-sm text-neutral-500 mt-1">驱虫记录</p>
            </div>
          </div>

          {pet.chronicConditions.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-800">慢病管理</h4>
                  {pet.chronicConditions.map((condition) => (
                    <div key={condition.id} className="mt-2">
                      <p className="text-amber-700 font-medium">{condition.name}</p>
                      <p className="text-sm text-amber-600 mt-0.5">
                        确诊时间：{format(new Date(condition.diagnosedAt), 'yyyy年MM月dd日', { locale: zhCN })}
                        {' · '}下次随访：{condition.nextFollowUp ? format(new Date(condition.nextFollowUp), 'yyyy年MM月dd日', { locale: zhCN }) : '待安排'}
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('chronic')}
                >
                  查看详情
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card padded={false}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="px-6" />
        <div className="p-6">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">体重趋势</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightData}>
                          <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2E7D5E" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#2E7D5E" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                          <Tooltip />
                          <Area type="monotone" dataKey="weight" stroke="#2E7D5E" strokeWidth={2} fill="url(#weightGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">基础信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500 flex items-center gap-2">
                        <Scale className="w-4 h-4" /> 体重
                      </span>
                      <span className="font-medium">{pet.weight} kg</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> 年龄
                      </span>
                      <span className="font-medium">{age}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500 flex items-center gap-2">
                        <Syringe className="w-4 h-4" /> 是否绝育
                      </span>
                      <span className="font-medium">{pet.sterilization === 'yes' ? '是' : '否'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500 flex items-center gap-2">
                        <Bug className="w-4 h-4" /> 过敏史
                      </span>
                      <span className="font-medium">{pet.allergies || '无'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-neutral-500 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> 病历记录
                      </span>
                      <span className="font-medium">{medicalRecords.length} 条</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">最近健康记录</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('vaccine')}>
                      查看全部 <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Timeline
                    items={[
                      ...transformVaccineToTimeline(vaccines),
                      ...transformDewormingToTimeline(dewormings),
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'vaccine' && (
            <Timeline items={transformVaccineToTimeline(vaccines)} />
          )}

          {activeTab === 'deworming' && (
            <Timeline items={transformDewormingToTimeline(dewormings)} />
          )}

          {activeTab === 'medical' && (
            <div className="space-y-4">
              {medicalRecords.length > 0 ? (
                transformMedicalToTimeline(medicalRecords).map((item) => (
                  <div key={item.id} className="bg-white rounded-xl p-5 shadow-soft border border-neutral-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                        <p className="text-sm text-neutral-500 mt-0.5">{item.description}</p>
                      </div>
                      <Badge variant={item.status === 'completed' ? 'success' : 'warning'}>
                        {item.status === 'completed' ? '已归档' : '待签署'}
                      </Badge>
                    </div>
                    <div className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-4 space-y-2">
                      <p><span className="text-neutral-500">诊断：</span>{item.title}</p>
                      <p><span className="text-neutral-500">医生：</span>{item.metadata?.veterinarian}</p>
                      <p><span className="text-neutral-500">日期：</span>{format(new Date(item.date), 'yyyy年MM月dd日', { locale: zhCN })}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无病历记录</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chronic' && (
            <div className="space-y-6">
              {pet.chronicConditions.length > 0 ? (
                pet.chronicConditions.map((condition) => (
                  <Card key={condition.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <HeartPulse className="w-5 h-5 text-red-500" />
                          {condition.name}
                        </CardTitle>
                        <Badge variant="warning">随访中</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-neutral-50 rounded-xl text-center">
                          <p className="text-sm text-neutral-500">确诊时间</p>
                          <p className="font-medium mt-1">
                            {format(new Date(condition.diagnosedAt), 'yyyy-MM-dd', { locale: zhCN })}
                          </p>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-xl text-center">
                          <p className="text-sm text-neutral-500">上次随访</p>
                          <p className="font-medium mt-1">
                            {condition.lastFollowUp ? format(new Date(condition.lastFollowUp), 'yyyy-MM-dd', { locale: zhCN }) : '待记录'}
                          </p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl text-center">
                          <p className="text-sm text-amber-600">下次随访</p>
                          <p className="font-medium mt-1 text-amber-700">
                            {condition.nextFollowUp ? format(new Date(condition.nextFollowUp), 'yyyy-MM-dd', { locale: zhCN }) : '待安排'}
                          </p>
                        </div>
                      </div>

                      {condition.type === 'diabetes' && glucoseData.length > 0 && (
                        <div>
                          <h5 className="font-medium text-neutral-700 mb-3">血糖监测趋势</h5>
                          <div className="h-48 bg-white rounded-xl p-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={glucoseData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} name="血糖(mmol/L)" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-neutral-700">随访计划</h5>
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            新增指标
                          </Button>
                        </div>
                        <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-4">
                          {condition.followUpPlan}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <HeartPulse className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无慢病管理记录</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function useState<T>(initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = React.useState(initial);
  return [value, setValue];
}

import * as React from 'react';
