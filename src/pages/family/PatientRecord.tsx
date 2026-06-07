import { useParams } from 'react-router-dom';
import { Heart, Activity, Clock, FileText } from 'lucide-react';

export default function PatientRecord() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1E293B]">患者档案</h1>

      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-[#1E293B]">基本信息</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">患者ID：</span><span className="font-medium">{id}</span></div>
          <div><span className="text-gray-500">姓名：</span><span className="font-medium">待获取</span></div>
          <div><span className="text-gray-500">年龄：</span><span className="font-medium">-</span></div>
          <div><span className="text-gray-500">性别：</span><span className="font-medium">-</span></div>
          <div><span className="text-gray-500">联系电话：</span><span className="font-medium">-</span></div>
          <div><span className="text-gray-500">地址：</span><span className="font-medium">-</span></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-[#0F6CBD]" />
          <h2 className="font-semibold text-[#1E293B]">医疗摘要</h2>
        </div>
        <p className="text-sm text-gray-600">暂无医疗摘要信息</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#108043]" />
          <h2 className="font-semibold text-[#1E293B]">服务记录</h2>
        </div>
        <div className="text-center text-gray-400 py-6 text-sm">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          暂无服务记录
        </div>
      </div>
    </div>
  );
}
