import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pill,
  Clock,
  Bell,
  Check,
  X,
  Trash2,
} from "lucide-react";

interface Medication {
  id: number;
  name: string;
  dosage: string;
  times: string[];
  enabled: boolean;
  type: string;
  notes: string;
}

export default function Medication() {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: 1,
      name: "降压药",
      dosage: "每次1片",
      times: ["08:00", "20:00"],
      enabled: true,
      type: "高血压",
      notes: "饭后服用",
    },
    {
      id: 2,
      name: "二甲双胍",
      dosage: "每次0.5g",
      times: ["07:30", "12:00", "18:00"],
      enabled: true,
      type: "糖尿病",
      notes: "饭前服用",
    },
    {
      id: 3,
      name: "阿司匹林",
      dosage: "每次100mg",
      times: ["08:00"],
      enabled: false,
      type: "心脑血管",
      notes: "早餐后服用",
    },
    {
      id: 4,
      name: "钙片",
      dosage: "每次2片",
      times: ["21:00"],
      enabled: true,
      type: "保健",
      notes: "睡前服用",
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    time: "08:00",
    type: "",
    notes: "",
  });

  const toggleMedication = (id: number) => {
    setMedications(
      medications.map((med) =>
        med.id === id ? { ...med, enabled: !med.enabled } : med
      )
    );
  };

  const deleteMedication = (id: number) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      const newMed: Medication = {
        id: Date.now(),
        name: newMedication.name,
        dosage: newMedication.dosage,
        times: [newMedication.time],
        enabled: true,
        type: newMedication.type,
        notes: newMedication.notes,
      };
      setMedications([...medications, newMed]);
      setShowAddModal(false);
      setNewMedication({
        name: "",
        dosage: "",
        time: "08:00",
        type: "",
        notes: "",
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "高血压":
        return "bg-red-100 text-red-700";
      case "糖尿病":
        return "bg-blue-100 text-blue-700";
      case "心脑血管":
        return "bg-purple-100 text-purple-700";
      case "保健":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <ArrowLeft size={36} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center text-[32px] font-bold text-gray-800">
            用药提醒
          </h1>
          <div className="w-14" />
        </div>

        <div className="bg-blue-500 text-white rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <Bell size={48} />
            <div>
              <p className="text-[24px] font-bold">今日提醒</p>
              <p className="text-[20px]">还有 2 个用药提醒待完成</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {medications.map((med) => (
            <div
              key={med.id}
              className={`bg-white rounded-2xl p-6 ${
                !med.enabled ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center">
                    <Pill size={40} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-[28px] font-bold text-gray-900">
                      {med.name}
                    </h3>
                    <p className="text-[20px] text-gray-600">{med.dosage}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleMedication(med.id)}
                  className={`relative w-20 h-12 rounded-full transition-colors ${
                    med.enabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-10 h-10 bg-white rounded-full shadow-md transition-transform ${
                      med.enabled ? "translate-x-9" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <span
                  className={`px-4 py-2 rounded-xl text-[18px] font-bold ${getTypeColor(
                    med.type
                  )}`}
                >
                  {med.type}
                </span>
                {med.times.map((time, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-[20px] text-gray-700"
                  >
                    <Clock size={24} />
                    {time}
                  </span>
                ))}
              </div>

              {med.notes && (
                <p className="text-[20px] text-gray-500 bg-yellow-50 p-3 rounded-xl">
                  💡 {med.notes}
                </p>
              )}

              <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => deleteMedication(med.id)}
                  className="flex items-center gap-2 text-red-500 text-[20px] font-bold px-4 py-2 rounded-xl hover:bg-red-50 active:scale-95 transition-transform"
                >
                  <Trash2 size={24} />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-blue-500 text-white text-[26px] font-bold py-6 rounded-2xl flex items-center justify-center gap-3 active:scale-98 transition-transform shadow-lg"
        >
          <Plus size={40} />
          添加用药提醒
        </button>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[32px] font-bold text-gray-900">
                  添加用药
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X size={32} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[22px] font-bold text-gray-700 mb-2 block">
                    药品名称
                  </label>
                  <input
                    type="text"
                    value={newMedication.name}
                    onChange={(e) =>
                      setNewMedication({
                        ...newMedication,
                        name: e.target.value,
                      })
                    }
                    placeholder="请输入药品名称"
                    className="w-full px-6 py-4 text-[22px] border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[22px] font-bold text-gray-700 mb-2 block">
                    服用剂量
                  </label>
                  <input
                    type="text"
                    value={newMedication.dosage}
                    onChange={(e) =>
                      setNewMedication({
                        ...newMedication,
                        dosage: e.target.value,
                      })
                    }
                    placeholder="例如：每次1片"
                    className="w-full px-6 py-4 text-[22px] border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[22px] font-bold text-gray-700 mb-2 block">
                    服药时间
                  </label>
                  <input
                    type="time"
                    value={newMedication.time}
                    onChange={(e) =>
                      setNewMedication({
                        ...newMedication,
                        time: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 text-[22px] border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[22px] font-bold text-gray-700 mb-2 block">
                    药品类型
                  </label>
                  <select
                    value={newMedication.type}
                    onChange={(e) =>
                      setNewMedication({
                        ...newMedication,
                        type: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 text-[22px] border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">请选择类型</option>
                    <option value="高血压">高血压</option>
                    <option value="糖尿病">糖尿病</option>
                    <option value="心脑血管">心脑血管</option>
                    <option value="保健">保健</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div>
                  <label className="text-[22px] font-bold text-gray-700 mb-2 block">
                    备注
                  </label>
                  <input
                    type="text"
                    value={newMedication.notes}
                    onChange={(e) =>
                      setNewMedication({
                        ...newMedication,
                        notes: e.target.value,
                      })
                    }
                    placeholder="例如：饭后服用"
                    className="w-full px-6 py-4 text-[22px] border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 text-[24px] font-bold py-5 rounded-xl active:scale-98 transition-transform"
                >
                  取消
                </button>
                <button
                  onClick={handleAddMedication}
                  className="flex-1 bg-blue-500 text-white text-[24px] font-bold py-5 rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-transform"
                >
                  <Check size={28} />
                  确认添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
