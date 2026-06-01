import { useState, useEffect } from 'react';
import { contracts, assets, type Contract, type Asset } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'rental', label: '出租' },
  { value: 'contract', label: '承包' },
  { value: 'cooperative', label: '合作经营' },
  { value: 'idle', label: '闲置登记' },
] as const;

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待签' },
  { value: 'active', label: '生效' },
  { value: 'expired', label: '到期' },
  { value: 'terminated', label: '终止' },
] as const;

const TYPE_LABELS: Record<string, string> = {
  rental: '出租',
  contract: '承包',
  cooperative: '合作经营',
  idle: '闲置登记',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待签',
  active: '生效',
  expired: '到期',
  terminated: '终止',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-orange-100 text-orange-800',
  terminated: 'bg-red-100 text-red-800',
};

function isExpiringWithin30Days(endDate: string): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

export default function Contracts() {
  const [list, setList] = useState<Contract[]>([]);
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAsset, setFilterAsset] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formAssetId, setFormAssetId] = useState('');
  const [formContractNo, setFormContractNo] = useState('');
  const [formType, setFormType] = useState('rental');
  const [formLesseeName, setFormLesseeName] = useState('');
  const [formLesseeContact, setFormLesseeContact] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formRentAmount, setFormRentAmount] = useState('');
  const [formRentUnit, setFormRentUnit] = useState('年');
  const [formPaymentCycle, setFormPaymentCycle] = useState('年付');
  const [formStatus, setFormStatus] = useState('pending');
  const [formRemark, setFormRemark] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      if (filterAsset) params.asset_id = filterAsset;
      const data = await contracts.list(params);
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const data = await assets.list();
      setAssetList(data);
    } catch {
      setAssetList([]);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterType, filterStatus, filterAsset]);

  const openCreate = () => {
    setEditingId(null);
    setFormAssetId('');
    setFormContractNo('');
    setFormType('rental');
    setFormLesseeName('');
    setFormLesseeContact('');
    setFormStartDate('');
    setFormEndDate('');
    setFormRentAmount('');
    setFormRentUnit('年');
    setFormPaymentCycle('年付');
    setFormStatus('pending');
    setFormRemark('');
    setShowModal(true);
  };

  const openEdit = (c: Contract) => {
    setEditingId(c.id);
    setFormAssetId(String(c.asset_id));
    setFormContractNo(c.contract_no);
    setFormType(c.type);
    setFormLesseeName(c.lessee_name);
    setFormLesseeContact(c.lessee_contact);
    setFormStartDate(c.start_date?.slice(0, 10) ?? '');
    setFormEndDate(c.end_date?.slice(0, 10) ?? '');
    setFormRentAmount(String(c.rent_amount));
    setFormRentUnit(c.rent_unit);
    setFormPaymentCycle(c.payment_cycle);
    setFormStatus(c.status);
    setFormRemark(c.remark);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此合同？')) return;
    try {
      await contracts.delete(id);
      await fetchData();
    } catch {
      alert('删除失败');
    }
  };

  const handleSave = async () => {
    console.log('Saving contract, asset_id:', formAssetId);
    if (!formAssetId) {
      alert('请选择所属资产');
      return;
    }
    const payload = {
      asset_id: Number(formAssetId),
      contract_no: formContractNo,
      type: formType,
      lessee_name: formLesseeName,
      lessee_contact: formLesseeContact,
      start_date: formStartDate,
      end_date: formEndDate,
      rent_amount: Number(formRentAmount || 0),
      rent_unit: formRentUnit,
      payment_cycle: formPaymentCycle,
      status: formStatus,
      remark: formRemark,
    };
    try {
      if (editingId) {
        await contracts.update(editingId, payload);
      } else {
        await contracts.create(payload);
      }
      setShowModal(false);
      setEditingId(null);
      await fetchData();
    } catch (err: any) {
      console.error('Save failed:', err);
      alert('保存失败: ' + (err.message || '未知错误'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">经营管理</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          新增合同
        </button>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={filterAsset}
          onChange={(e) => setFilterAsset(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">全部资产</option>
          {assetList.map((a) => (
            <option key={a.id} value={String(a.id)}>
              {a.name}
            </option>
          ))}
        </select>

        <button
          onClick={fetchData}
          className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <Search className="h-4 w-4" />
          查询
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600">
              <th className="border border-gray-200 px-3 py-2 text-left font-medium">合同编号</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium">资产名称</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium">经营类型</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium">承租人</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium">联系方式</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium">起始日期</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium">到期日期</th>
              <th className="border border-gray-200 px-3 py-2 text-right font-medium">租金(元/年)</th>
              <th className="border border-gray-200 px-3 py-2 text-center font-medium">履约状态</th>
              <th className="border border-gray-200 px-3 py-2 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              list.map((c) => (
                <tr
                  key={c.id}
                  className={
                    isExpiringWithin30Days(c.end_date)
                      ? 'bg-orange-50 hover:bg-orange-100'
                      : 'hover:bg-gray-50'
                  }
                >
                  <td className="border border-gray-200 px-3 py-2">{c.contract_no}</td>
                  <td className="border border-gray-200 px-3 py-2">{c.asset_name ?? '-'}</td>
                  <td className="border border-gray-200 px-3 py-2">{TYPE_LABELS[c.type] ?? c.type}</td>
                  <td className="border border-gray-200 px-3 py-2">{c.lessee_name}</td>
                  <td className="border border-gray-200 px-3 py-2">{c.lessee_contact}</td>
                  <td className="border border-gray-200 px-3 py-2">{c.start_date?.slice(0, 10)}</td>
                  <td className="border border-gray-200 px-3 py-2">{c.end_date?.slice(0, 10)}</td>
                  <td className="border border-gray-200 px-3 py-2 text-right">
                    {Number(c.rent_amount).toLocaleString()}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      <Edit2 className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingId ? '编辑合同' : '新增合同'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所属资产 *</label>
                  <select
                    value={formAssetId}
                    onChange={(e) => setFormAssetId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">请选择资产</option>
                    {assetList.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">合同编号</label>
                  <input
                    type="text"
                    value={formContractNo}
                    onChange={(e) => setFormContractNo(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">经营类型</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">承租人</label>
                  <input
                    type="text"
                    value={formLesseeName}
                    onChange={(e) => setFormLesseeName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
                  <input
                    type="text"
                    value={formLesseeContact}
                    onChange={(e) => setFormLesseeContact(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">起始日期</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">到期日期</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">租金金额</label>
                  <input
                    type="number"
                    value={formRentAmount}
                    onChange={(e) => setFormRentAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">租金单位</label>
                  <input
                    type="text"
                    value={formRentUnit}
                    onChange={(e) => setFormRentUnit(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">缴费周期</label>
                  <input
                    type="text"
                    value={formPaymentCycle}
                    onChange={(e) => setFormPaymentCycle(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">履约状态</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    value={formRemark}
                    onChange={(e) => setFormRemark(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
