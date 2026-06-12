import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Plus,
  ChevronRight,
  Clock,
  User,
  Stethoscope,
  Pill,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge, Tag, Avatar } from '@/components/common/BadgeTagAvatar';
import { Tabs } from '@/components/common/UIComponents';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePetStore } from '@/stores/petStore';
import { cn, formatCurrency } from '@/utils/common';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { MedicalRecord, Prescription } from '@/types/medical';

export default function MedicalRecordsPage() {
  const { medicalRecords, prescriptions, fetchMedicalRecords, fetchPrescriptions, reviewPrescription, isLoading } = useInventoryStore();
  const { pets, fetchPets } = usePetStore();
  const [activeTab, setActiveTab] = useState('records');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNewRecord, setShowNewRecord] = useState(false);

  useEffect(() => {
    fetchMedicalRecords();
    fetchPrescriptions();
    fetchPets();
  }, [fetchMedicalRecords, fetchPrescriptions, fetchPets]);

  const filteredRecords = medicalRecords.filter((r) => {
    const pet = pets.find((p) => p.id === r.petId);
    return (
      r.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const pendingPrescriptions = prescriptions.filter((p) => p.status === 'pending_review');
  const approvedPrescriptions = prescriptions.filter((p) => p.status === 'approved');

  const currentRecord = medicalRecords.find((r) => r.id === selectedRecord);
  const currentPet = currentRecord ? pets.find((p) => p.id === currentRecord.petId) : null;

  const getRecordTypeLabel = (type: string) => {
    return {
      outpatient: '门诊病历',
      vaccination: '疫苗接种',
      deworming: '驱虫记录',
      physical_exam: '体检报告',
      surgery: '手术记录',
      follow_up: '复诊记录',
    }[type] || type;
  };

  const getRecordTypeColor = (type: string) => {
    return {
      outpatient: 'bg-blue-100 text-blue-700',
      vaccination: 'bg-green-100 text-green-700',
      deworming: 'bg-yellow-100 text-yellow-700',
      physical_exam: 'bg-mint-100 text-mint-700',
      surgery: 'bg-red-100 text-red-700',
      follow_up: 'bg-purple-100 text-purple-700',
    }[type] || 'bg-neutral-100 text-neutral-700';
  };

  const handlePrescriptionReview = async (prescriptionId: string, approved: boolean, notes?: string) => {
    await reviewPrescription(prescriptionId, approved, notes);
  };

  const renderMedicalRecord = (record: MedicalRecord) => {
    const pet = pets.find((p) => p.id === record.petId);
    return (
      <motion.div
        key={record.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onClick={() => {
          setSelectedRecord(record.id);
          setShowDetail(true);
        }}
        className="p-5 bg-white rounded-2xl border border-neutral-100 hover:shadow-soft transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Badge className={getRecordTypeColor(record.type)} size="sm">
              {getRecordTypeLabel(record.type)}
            </Badge>
            <Badge variant={record.isArchived ? 'success' : 'warning'} size="sm">
              {record.isArchived ? '已归档' : '草稿'}
            </Badge>
          </div>
          <span className="text-sm text-neutral-400">
            {format(new Date(record.visitDate), 'yyyy-MM-dd', { locale: zhCN })}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          {pet && (
            <img
              src={pet.avatar}
              alt={pet.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
          )}
          <div>
            <h4 className="font-semibold text-neutral-900">
              {pet?.name} <span className="text-sm font-normal text-neutral-500">· {pet?.breed}</span>
            </h4>
            <p className="text-sm text-neutral-500">
              执业兽医: {record.veterinarianName}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-neutral-500 w-16 flex-shrink-0">主诉:</span>
            <p className="text-sm text-neutral-700 line-clamp-1">{record.chiefComplaint}</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-neutral-500 w-16 flex-shrink-0">诊断:</span>
            <p className="text-sm text-neutral-700 line-clamp-1">{record.diagnosis}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            {record.prescriptions && record.prescriptions.length > 0 && (
              <Tag variant="info" size="sm">
                <Pill className="w-3.5 h-3.5 mr-1" />
                {record.prescriptions.length}个处方
              </Tag>
            )}
            {record.images && record.images.length > 0 && (
              <Tag variant="neutral" size="sm">
                {record.images.length}张图片
              </Tag>
            )}
          </div>
          <span className="text-xs text-neutral-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            合规存档
          </span>
        </div>
      </motion.div>
    );
  };

  const renderPrescription = (prescription: Prescription, showActions: boolean = false) => {
    const pet = pets.find((p) => p.id === prescription.petId);
    return (
      <motion.div
        key={prescription.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-white rounded-2xl border border-neutral-100 hover:shadow-soft transition-all"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Badge variant={
              prescription.status === 'approved' ? 'success' :
              prescription.status === 'rejected' ? 'danger' :
              prescription.status === 'dispensed' ? 'info' : 'warning'
            } size="sm">
              {prescription.status === 'pending_review' ? '待审方' :
               prescription.status === 'approved' ? '已通过' :
               prescription.status === 'rejected' ? '已驳回' :
               prescription.status === 'dispensed' ? '已发药' : prescription.status}
            </Badge>
            <span className="text-xs text-neutral-400">{prescription.prescriptionNo}</span>
          </div>
          <span className="text-sm text-neutral-400">
            {format(new Date(prescription.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          {pet && (
            <img
              src={pet.avatar}
              alt={pet.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
          )}
          <div className="flex-1">
            <h4 className="font-medium text-neutral-900">{pet?.name}</h4>
            <p className="text-xs text-neutral-500">
              {prescription.diagnosis}
            </p>
          </div>
        </div>

        <div className="bg-neutral-50 rounded-xl p-3 mb-4">
          <h5 className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-1">
            <Pill className="w-4 h-4 text-primary-500" />
            用药明细
          </h5>
          <div className="space-y-2">
            {prescription.medications.map((med, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">
                  {med.medicationName} × {med.quantity}
                </span>
                <span className="text-neutral-500">
                  {med.dosage} · {med.frequency}
                </span>
              </div>
            ))}
          </div>
        </div>

        {prescription.reviewNotes && (
          <div className="bg-blue-50 rounded-xl p-3 mb-4">
            <h5 className="text-sm font-medium text-blue-700 mb-1">审方意见</h5>
            <p className="text-sm text-blue-600">{prescription.reviewNotes}</p>
          </div>
        )}

        {showActions && prescription.status === 'pending_review' && (
          <div className="flex items-center gap-3">
            <Button
              variant="success"
              size="sm"
              className="flex-1"
              onClick={() => handlePrescriptionReview(prescription.id, true, '处方合理，同意发药')}
              isLoading={isLoading}
            >
              审核通过
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              onClick={() => handlePrescriptionReview(prescription.id, false, '请核对用药剂量')}
              isLoading={isLoading}
            >
              驳回
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">病历管理</h1>
          <p className="text-neutral-500 mt-1">电子病历管理，符合《动物诊疗机构管理办法》存档要求</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button onClick={() => setShowNewRecord(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建病历
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">电子病历合规说明</h4>
            <p className="text-sm text-white/80 mt-0.5">
              根据《动物诊疗机构管理办法》，电子病历需包含主诉、现病史、既往史、体格检查、诊断、治疗方案、用药、医嘱、兽医签名及归档时间，保存期限不得少于3年。
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '病历总数', value: medicalRecords.length, icon: FileText, color: 'from-primary-500 to-primary-600' },
          { label: '待审处方', value: pendingPrescriptions.length, icon: AlertCircle, color: 'from-amber-500 to-orange-500' },
          { label: '已归档', value: medicalRecords.filter((r) => r.isArchived).length, icon: ShieldCheck, color: 'from-green-500 to-green-600' },
          { label: '本月新增', value: 12, icon: Plus, color: 'from-accent-500 to-accent-400' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hoverable>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card padded={false}>
        <Tabs
          tabs={[
            { id: 'records', label: '病历档案' },
            { id: 'prescriptions', label: `处方审方 (${pendingPrescriptions.length})` },
            { id: 'history', label: '历史处方' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="px-6"
        />

        <div className="p-6">
          {activeTab !== 'history' && (
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索宠物名称、诊断、主诉..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                筛选
              </Button>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="grid grid-cols-2 gap-4">
              {filteredRecords.map((record) => renderMedicalRecord(record))}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {pendingPrescriptions.length === 0 ? (
                <div className="text-center py-16 text-neutral-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">暂无待审核处方</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {pendingPrescriptions.map((prescription) => renderPrescription(prescription, true))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {approvedPrescriptions.map((prescription) => renderPrescription(prescription, false))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {showDetail && currentRecord && currentPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8" onClick={() => setShowDetail(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={currentPet.avatar} alt={currentPet.name} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h3 className="font-semibold text-neutral-900">{currentPet.name} 的病历档案</h3>
                  <p className="text-sm text-neutral-500">
                    {getRecordTypeLabel(currentRecord.type)} · {format(new Date(currentRecord.visitDate), 'yyyy-MM-dd', { locale: zhCN })}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)} className="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">主诉</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-700">{currentRecord.chiefComplaint}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">现病史</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-700">{currentRecord.presentIllness || '无'}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">体格检查</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {currentRecord.physicalExam && Object.entries(currentRecord.physicalExam).map(([key, value]) => (
                      <div key={key} className="bg-neutral-50 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">
                          {{ temperature: '体温', heartRate: '心率', respiratoryRate: '呼吸', weight: '体重' }[key] || key}
                        </p>
                        <p className="font-semibold text-neutral-900">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">诊断</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-700 font-medium">{currentRecord.diagnosis}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">治疗方案</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-700">{currentRecord.treatmentPlan || '无'}</p>
                  </CardContent>
                </Card>
              </div>

              {currentRecord.prescriptions && currentRecord.prescriptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">处方用药</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentRecord.prescriptions.map((prescription, idx) => (
                        <div key={idx} className="bg-neutral-50 rounded-xl p-4">
                          <p className="font-medium text-neutral-900 mb-2">处方 #{idx + 1}</p>
                          <div className="grid grid-cols-2 gap-3">
                            {prescription.medications?.map((med: any, midx: number) => (
                              <div key={midx} className="text-sm">
                                <span className="font-medium text-neutral-700">{med.medicationName}</span>
                                <span className="text-neutral-500 ml-2">× {med.quantity}</span>
                                <p className="text-xs text-neutral-500">{med.dosage} · {med.frequency}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">兽医签名与归档</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentRecord.veterinarianId}`}
                        name={currentRecord.veterinarianName}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-neutral-900">{currentRecord.veterinarianName}</p>
                        <p className="text-sm text-neutral-500">执业兽医</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-500">签名时间</p>
                      <p className="font-medium text-neutral-900">
                        {format(new Date(currentRecord.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </p>
                    </div>
                  </div>
                  {currentRecord.archivedAt && (
                    <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-sm">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        已合规归档，保存至2027年
                      </span>
                      <span className="text-neutral-400">
                        归档时间: {format(new Date(currentRecord.archivedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
