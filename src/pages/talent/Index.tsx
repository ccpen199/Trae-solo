import { useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';

export default function TalentIndex() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">人才服务</h1>
      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/talent/title')}
          className="bg-white border border-neutral-200 rounded-lg p-6 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-success-100 text-success-600 flex items-center justify-center mb-4">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 mb-1">职称申报</h3>
          <p className="text-sm text-neutral-500">在线申报专业技术职称</p>
        </div>
      </div>
    </div>
  );
}
