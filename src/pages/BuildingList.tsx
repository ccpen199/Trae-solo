import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, MapPin, Calendar, ChevronRight } from 'lucide-react';
import type { Building } from '@/types';

const mockBuildings: Building[] = [
  { id: 1, name: '1号楼', address: '阳光花园A区', floors: 18, units: 72, households: 68, buildYear: 2018, image: 'https://picsum.photos/seed/build1/400/200' },
  { id: 2, name: '2号楼', address: '阳光花园A区', floors: 24, units: 96, households: 92, buildYear: 2019, image: 'https://picsum.photos/seed/build2/400/200' },
  { id: 3, name: '3号楼', address: '阳光花园A区', floors: 18, units: 72, households: 70, buildYear: 2018, image: 'https://picsum.photos/seed/build3/400/200' },
  { id: 4, name: '5号楼', address: '阳光花园B区', floors: 22, units: 88, households: 85, buildYear: 2020, image: 'https://picsum.photos/seed/build4/400/200' },
  { id: 5, name: '6号楼', address: '阳光花园B区', floors: 18, units: 72, households: 68, buildYear: 2020, image: 'https://picsum.photos/seed/build5/400/200' },
  { id: 6, name: '8号楼', address: '阳光花园C区', floors: 26, units: 104, households: 100, buildYear: 2021, image: 'https://picsum.photos/seed/build6/400/200' },
];

const BuildingList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">楼栋管理</h1>
          <p className="text-gray-500 mt-1">查看和管理小区所有楼栋信息</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockBuildings.map((building) => (
          <div
            key={building.id}
            onClick={() => navigate(`/buildings/${building.id}`)}
            className="card cursor-pointer group hover:-translate-y-1 duration-300 overflow-hidden"
          >
            <div className="relative -mx-6 -mt-6 mb-4">
              <img
                src={building.image}
                alt={building.name}
                className="w-full h-40 object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-3 left-3">
                <span className="badge bg-white/90 text-secondary-700 backdrop-blur-sm">
                  {building.address}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary-500" />
                <h3 className="text-lg font-semibold text-gray-900 font-serif">{building.name}</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-xs">楼层</p>
                <p className="font-semibold text-gray-900">{building.floors}层</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-xs">单元</p>
                <p className="font-semibold text-gray-900">{building.units}户</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-xs">入住</p>
                <p className="font-semibold text-accent-green-600">{building.households}户</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>入住率 {Math.round((building.households / building.units) * 100)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{building.buildYear}年建成</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuildingList;
