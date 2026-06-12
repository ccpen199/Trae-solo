import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Syringe,
  Bug,
  Stethoscope,
  ChevronRight,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Tabs } from '@/components/common/UIComponents';
import { Badge } from '@/components/common/BadgeTagAvatar';
import { PetSelector } from '@/components/business/PetCard';
import {
  Timeline,
  transformVaccineToTimeline,
  transformDewormingToTimeline,
  transformMedicalToTimeline,
} from '@/components/business/Timeline';
import { usePetStore } from '@/stores/petStore';
import { useState } from 'react';

export default function HealthRecordsPage() {
  const { pets, currentPet, vaccines, dewormings, medicalRecords, fetchPets, setCurrentPet, fetchPetHealthData } = usePetStore();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  useEffect(() => {
    if (currentPet) {
      fetchPetHealthData(currentPet.id);
    }
  }, [currentPet, fetchPetHealthData]);

  const tabs = [
    { id: 'all', label: '全部记录' },
    { id: 'vaccine', label: '疫苗接种' },
    { id: 'deworming', label: '驱虫记录' },
    { id: 'medical', label: '诊疗病历' },
  ];

  const getAllRecords = () => {
    const records = [
      ...transformVaccineToTimeline(vaccines),
      ...transformDewormingToTimeline(dewormings),
      ...transformMedicalToTimeline(medicalRecords),
    ];
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getFilteredRecords = () => {
    switch (activeTab) {
      case 'vaccine':
        return transformVaccineToTimeline(vaccines);
      case 'deworming':
        return transformDewormingToTimeline(dewormings);
      case 'medical':
        return transformMedicalToTimeline(medicalRecords);
      default:
        return getAllRecords();
    }
  };

  const nextVaccine = vaccines[0]?.nextDueDate;
  const nextDeworming = dewormings[0]?.nextDueDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-primary-500 to-mint-400 rounded-2xl p-6 text-white">
        <h1 className="font-display text-2xl font-bold mb-2">健康档案</h1>
        <p className="text-white/80">完整记录宠物健康数据，满足《动物诊疗机构管理办法》存档要求</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Link to="/pets" className="block">
          <Card hoverable>
            <CardContent className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{pets.length}</p>
                <p className="text-sm text-neutral-500">宠物档案</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Syringe className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{vaccines.length}</p>
              <p className="text-sm text-neutral-500">疫苗记录</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Bug className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{dewormings.length}</p>
              <p className="text-sm text-neutral-500">驱虫记录</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{medicalRecords.length}</p>
              <p className="text-sm text-neutral-500">诊疗病历</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {(nextVaccine || nextDeworming) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">即将到期提醒</h4>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-amber-700">
              {nextVaccine && (
                <span className="flex items-center gap-1">
                  <Syringe className="w-4 h-4" />
                  疫苗到期：{nextVaccine}
                </span>
              )}
              {nextDeworming && (
                <span className="flex items-center gap-1">
                  <Bug className="w-4 h-4" />
                  驱虫到期：{nextDeworming}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm font-medium text-neutral-700 mb-2">选择宠物</p>
        <PetSelector
          pets={pets}
          selectedId={currentPet?.id || null}
          onSelect={(pet) => setCurrentPet(pet)}
        />
      </div>

      {currentPet ? (
        <Card padded={false}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="px-6" />
          <div className="p-6">
            <Timeline items={getFilteredRecords()} />
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-neutral-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>请先选择宠物查看健康记录</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
