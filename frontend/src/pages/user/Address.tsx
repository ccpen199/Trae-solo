import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin, Home, Building2, Edit3, Trash2, Star, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';

interface AddressItem {
  id: string; name: string; phone: string; address: string; tag: 'home' | 'company' | 'school' | 'other'; isDefault: boolean;
}

const tagConfig = {
  home: { label: '家', icon: Home, color: 'bg-blue-50 text-blue-600' },
  company: { label: '公司', icon: Building2, color: 'bg-purple-50 text-purple-600' },
  school: { label: '学校', icon: Building2, color: 'bg-green-50 text-green-600' },
  other: { label: '其他', icon: MapPin, color: 'bg-gray-50 text-gray-600' },
};

const mockAddresses: AddressItem[] = [
  { id: '1', name: '张三', phone: '138****8888', address: '北京市朝阳区望京SOHO T1 1201室', tag: 'home', isDefault: true },
  { id: '2', name: '张三', phone: '138****8888', address: '北京市海淀区中关村软件园二期8号楼3层', tag: 'company', isDefault: false },
  { id: '3', name: '李女士', phone: '139****6666', address: '北京市东城区国瑞城A座2205', tag: 'other', isDefault: false },
];

export default function AddressPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState(mockAddresses);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-700" /></button>
          <h1 className="text-base font-semibold text-gray-900">地址管理</h1>
          <button onClick={() => setShowAddModal(true)} className="p-2 -mr-2 rounded-full hover:bg-gray-100"><Plus className="w-5 h-5 text-brand-500" /></button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {addresses.map((addr) => {
          const tag = tagConfig[addr.tag];
          const TagIcon = tag.icon;
          return (
            <Card key={addr.id} hover>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tag.color}`}><TagIcon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{addr.name}</span>
                    <span className="text-sm text-gray-500">{addr.phone}</span>
                    {addr.isDefault && <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-50 text-brand-600 rounded text-xs font-medium"><Star className="w-3 h-3" />默认</span>}
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${tag.color}`}>{tag.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{addr.address}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-gray-50">
                {!addr.isDefault && <button onClick={() => setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === addr.id })))} className="text-xs text-brand-600 hover:text-brand-700 font-medium">设为默认</button>}
                <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"><Edit3 className="w-3 h-3" />编辑</button>
                <button onClick={() => setAddresses(addresses.filter((a) => a.id !== addr.id))} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"><Trash2 className="w-3 h-3" />删除</button>
              </div>
            </Card>
          );
        })}
        <button onClick={() => setShowAddModal(true)} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:border-brand-400 hover:text-brand-500">
          <Plus className="w-5 h-5" /><span className="font-medium">添加新地址</span>
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">添加地址</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <input placeholder="姓名" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <input placeholder="手机号" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex gap-2">
                {Object.entries(tagConfig).map(([key, cfg]) => (
                  <button key={key} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-brand-400 hover:text-brand-600">{cfg.label}</button>
                ))}
              </div>
              <textarea placeholder="详细地址：街道、门牌号、楼层等" rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
            <button onClick={() => setShowAddModal(false)} className="w-full mt-4 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium">保存地址</button>
          </div>
        </div>
      )}
    </div>
  );
}
