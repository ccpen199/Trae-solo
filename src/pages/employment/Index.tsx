import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

export default function EmploymentIndex() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">就业服务</h1>
      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/employment/unemployment')}
          className="bg-white border border-neutral-200 rounded-lg p-6 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-accent-100 text-accent-600 flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 mb-1">失业金申领</h3>
          <p className="text-sm text-neutral-500">在线申领失业保险金</p>
        </div>
      </div>
    </div>
  );
}
