import { mockDonors } from '../../data/mockData';
import { Building2, DollarSign, Award, Search, Plus, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const Donors = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDonors = mockDonors.filter(
    (donor) =>
      donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDonations = mockDonors.reduce(
    (sum, d) => sum + d.totalDonations,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索捐赠方名称、行业..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          邀请捐赠方
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {mockDonors.length}
              </p>
              <p className="text-xs text-gray-500">入驻捐赠方</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {(totalDonations / 10000).toFixed(0)}万
              </p>
              <p className="text-xs text-gray-500">累计捐赠金额</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {mockDonors.reduce((sum, d) => sum + d.projectCount, 0)}
              </p>
              <p className="text-xs text-gray-500">资助项目数</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredDonors.map((donor) => (
          <div
            key={donor.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {donor.name}
                    </h3>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                      {donor.industry}
                    </span>
                  </div>
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                  {donor.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-1">累计捐赠</p>
                <p className="text-lg font-bold text-green-600">
                  ¥{(donor.totalDonations / 10000).toFixed(0)}万
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">资助项目</p>
                <p className="text-lg font-bold text-blue-600">
                  {donor.projectCount}个
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Donors;
