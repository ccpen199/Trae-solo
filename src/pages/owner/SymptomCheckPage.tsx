import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Stethoscope,
  Calendar,
  Check,
  Search,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge, Tag } from '@/components/common/BadgeTagAvatar';
import { Steps, Progress } from '@/components/common/UIComponents';
import { useMemberStore } from '@/stores/memberStore';
import { usePetStore } from '@/stores/petStore';
import { cn } from '@/utils/common';
import type { PetSpecies, Gender } from '@/types/pet';
import type { SymptomCheckRequest } from '@/types/knowledge';

export default function SymptomCheckPage() {
  const navigate = useNavigate();
  const { breeds, symptoms, symptomCheckResult, fetchBreeds, fetchSymptoms, checkSymptoms, clearSymptomCheck, isLoading } = useMemberStore();
  const { pets } = usePetStore();

  const [step, setStep] = useState(1);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  const [breedId, setBreedId] = useState<string | null>(null);
  const [ageMonths, setAgeMonths] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSymptoms();
  }, [fetchSymptoms]);

  useEffect(() => {
    if (species) {
      fetchBreeds(species);
    }
  }, [species, fetchBreeds]);

  const steps = [
    { id: '1', label: '选择宠物' },
    { id: '2', label: '选择症状' },
    { id: '3', label: '查看结果' },
  ];

  const symptomCategories = [
    { name: '皮肤相关', symptoms: ['sym_001', 'sym_002', 'sym_003'] },
    { name: '消化系统', symptoms: ['sym_004', 'sym_005', 'sym_006'] },
    { name: '泌尿系统', symptoms: ['sym_007', 'sym_008'] },
    { name: '呼吸系统', symptoms: ['sym_009', 'sym_010'] },
    { name: '耳部/其他', symptoms: ['sym_011', 'sym_012'] },
  ];

  const filteredSymptoms = symptoms.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleCheck = async () => {
    if (!species || !ageMonths || !gender || selectedSymptoms.length === 0) return;

    const request: SymptomCheckRequest = {
      species,
      breedId: breedId || undefined,
      ageMonths,
      gender,
      symptomIds: selectedSymptoms,
    };

    await checkSymptoms(request);
    setStep(3);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedPet(null);
    setSpecies(null);
    setBreedId(null);
    setAgeMonths(null);
    setGender(null);
    setSelectedSymptoms([]);
    clearSymptomCheck();
  };

  const speciesOptions = [
    { value: 'dog' as const, label: '狗狗', emoji: '🐕' },
    { value: 'cat' as const, label: '猫咪', emoji: '🐱' },
    { value: 'rabbit' as const, label: '兔子', emoji: '🐰' },
    { value: 'bird' as const, label: '鸟类', emoji: '🐦' },
    { value: 'other' as const, label: '其他', emoji: '🐾' },
  ];

  const genderOptions = [
    { value: 'male' as const, label: '公', emoji: '♂' },
    { value: 'female' as const, label: '母', emoji: '♀' },
  ];

  const urgencyColors: Record<string, string> = {
    routine: 'bg-green-100 text-green-700',
    soon: 'bg-yellow-100 text-yellow-700',
    emergency: 'bg-red-100 text-red-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="bg-gradient-to-r from-accent-500 to-accent-400 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <HeartPulse className="w-8 h-8" />
          <div>
            <h1 className="font-display text-2xl font-bold">AI症状自查</h1>
            <p className="text-white/80 text-sm">基于宠物品种知识图谱的智能分析</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white/10 rounded-xl flex items-start gap-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-white/90">
            本系统仅提供参考建议，不能替代专业兽医诊断。如症状严重，请立即就医。
          </p>
        </div>
      </div>

      <Steps steps={steps} currentStep={step - 1} className="mb-8" />

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {pets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">从我的宠物中选择</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {pets.map((pet) => (
                    <motion.button
                      key={pet.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedPet(pet.id);
                        setSpecies(pet.species);
                        setBreedId(pet.breedId);
                        setGender(pet.gender);
                        if (pet.birthday) {
                          const age = Math.floor(
                            (new Date().getTime() - new Date(pet.birthday).getTime()) / (1000 * 60 * 60 * 24 * 30)
                          );
                          setAgeMonths(age);
                        }
                      }}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        selectedPet === pet.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={pet.avatar}
                          alt={pet.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-semibold text-neutral-900">{pet.name}</p>
                          <p className="text-sm text-neutral-500">{pet.breed}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-sm text-neutral-400">或手动填写信息</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">宠物基础信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">宠物种类</label>
                <div className="grid grid-cols-5 gap-3">
                  {speciesOptions.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSpecies(opt.value);
                        setSelectedPet(null);
                      }}
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all',
                        species === opt.value && !selectedPet
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-200'
                      )}
                    >
                      <span className="text-3xl block mb-1">{opt.emoji}</span>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {species && breeds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">品种</label>
                  <div className="grid grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                    {breeds.map((breed) => (
                      <button
                        key={breed.id}
                        onClick={() => setBreedId(breed.id)}
                        className={cn(
                          'px-4 py-2 rounded-xl border text-sm font-medium text-left transition-all',
                          breedId === breed.id
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-neutral-200 hover:border-primary-200'
                        )}
                      >
                        {breed.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">年龄（月）</label>
                  <input
                    type="number"
                    value={ageMonths || ''}
                    onChange={(e) => setAgeMonths(Number(e.target.value))}
                    placeholder="请输入月龄"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">性别</label>
                  <div className="grid grid-cols-2 gap-3">
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setGender(opt.value)}
                        className={cn(
                          'px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2',
                          gender === opt.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-neutral-200 hover:border-primary-200'
                        )}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!species || !ageMonths || !gender}
              size="lg"
            >
              下一步
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">选择症状（可多选）</CardTitle>
                <Badge variant="info">
                  已选 {selectedSymptoms.length} 项
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索症状..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                />
              </div>

              {searchQuery ? (
                <div className="flex flex-wrap gap-2">
                  {filteredSymptoms.map((symptom) => (
                    <motion.button
                      key={symptom.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSymptom(symptom.id)}
                      className={cn(
                        'px-4 py-2 rounded-xl border-2 font-medium transition-all flex items-center gap-2',
                        selectedSymptoms.includes(symptom.id)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-primary-200'
                      )}
                    >
                      {selectedSymptoms.includes(symptom.id) && (
                        <Check className="w-4 h-4" />
                      )}
                      {symptom.name}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {symptomCategories.map((category) => (
                    <div key={category.name}>
                      <h4 className="text-sm font-medium text-neutral-700 mb-2">{category.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {symptoms
                          .filter((s) => category.symptoms.includes(s.id))
                          .map((symptom) => (
                            <motion.button
                              key={symptom.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => toggleSymptom(symptom.id)}
                              className={cn(
                                'px-4 py-2 rounded-xl border-2 font-medium transition-all flex items-center gap-2',
                                selectedSymptoms.includes(symptom.id)
                                  ? 'border-primary-500 bg-primary-500 text-white'
                                  : 'border-neutral-200 hover:border-primary-200'
                              )}
                            >
                              {selectedSymptoms.includes(symptom.id) && (
                                <Check className="w-4 h-4" />
                              )}
                              {symptom.name}
                            </motion.button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>
              <ChevronLeft className="w-5 h-5 mr-2" />
              上一步
            </Button>
            <Button
              onClick={handleCheck}
              disabled={selectedSymptoms.length === 0}
              isLoading={isLoading}
              size="lg"
            >
              开始分析
              <Stethoscope className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      )}

      {step === 3 && symptomCheckResult && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                紧急程度提示
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                'p-4 rounded-xl',
                urgencyColors[symptomCheckResult.urgencyAdvice.includes('尽快') ? 'soon' : 'routine']
              )}>
                <p className="font-medium">{symptomCheckResult.urgencyAdvice}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">可能的疾病（按匹配度排序）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {symptomCheckResult.possibleDiseases.map((disease, index) => (
                <motion.div
                  key={disease.diseaseId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-neutral-50 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-neutral-900">{disease.diseaseName}</h4>
                    <div className="flex items-center gap-2">
                      <Progress value={disease.matchScore} color="primary" size="sm" className="w-32" />
                      <span className="text-sm font-medium text-primary-600">{disease.matchScore}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500">{disease.description}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">建议检查项目</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {symptomCheckResult.recommendedTests.map((test, index) => (
                  <Tag key={index} variant="mint">
                    <Stethoscope className="w-3.5 h-3.5 mr-1" />
                    {test}
                  </Tag>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">推荐服务</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {symptomCheckResult.recommendedServices.map((service, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ y: -2 }}
                    onClick={() => navigate('/booking')}
                    className="p-4 bg-primary-50 rounded-xl text-left hover:bg-primary-100 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-primary-700">{service}</p>
                      <p className="text-xs text-primary-500 mt-0.5">点击预约服务</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary-400" />
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                建议立即预约
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 mb-4">
                根据症状分析，建议尽快带宠物到医院进行专业检查，避免延误病情。
              </p>
              <Button size="lg" className="w-full" onClick={() => navigate('/booking')}>
                立即预约门诊
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" size="lg" onClick={handleReset}>
              重新自查
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/consult')}>
              在线问诊
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
