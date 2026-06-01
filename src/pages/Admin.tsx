import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Building2,
  ShoppingCart,
  User,
  History,
  FileSearch,
  UserCog,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Clock,
  AlertCircle,
  ChevronRight,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Store,
  Phone
} from 'lucide-react';
import { mastersApi, reportsApi, refundsApi, shiftsApi, reconciliationApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';

interface AdminProps {
  tab?: string;
}

interface TabConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

export default function Admin({ tab }: AdminProps) {
  const navigate = useNavigate();
  const hasRole = useAuthStore(state => state.hasRole);
  const user = useAuthStore(state => state.user);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(tab || 'users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const tabConfigs: TabConfig[] = [
    { key: 'users', label: '用户管理', icon: <Users className="w-4 h-4" />, roles: ['admin'] },
    { key: 'roles', label: '角色权限', icon: <Shield className="w-4 h-4" />, roles: ['admin'] },
    { key: 'stores', label: '门店管理', icon: <Building2 className="w-4 h-4" />, roles: ['admin'] },
    { key: 'products', label: '商品管理', icon: <ShoppingCart className="w-4 h-4" />, roles: ['admin', 'store_manager'] },
    { key: 'members', label: '会员管理', icon: <User className="w-4 h-4" />, roles: ['admin', 'store_manager'] },
    { key: 'audit', label: '操作审计', icon: <History className="w-4 h-4" />, roles: ['admin', 'finance'] },
    { key: 'review', label: '业务复查', icon: <FileSearch className="w-4 h-4" />, roles: ['admin', 'finance', 'store_manager'] },
    { key: 'profile', label: '个人设置', icon: <UserCog className="w-4 h-4" /> }
  ];

  const visibleTabs = tabConfigs.filter(t => !t.roles ? true : hasRole(...t.roles));

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    loadTabData();
  }, [activeTab, page, searchKeyword]);

  const loadTabData = async () => {
    switch (activeTab) {
      case 'users': loadUsers(); break;
      case 'roles': loadRoles(); break;
      case 'stores': loadStores(); break;
      case 'products': loadProducts(); break;
      case 'members': loadMembers(); break;
      case 'audit': loadAuditLogs(); break;
      case 'review': loadReviewItems(); break;
    }
  };

  const loadUsers = async () => {
    try {
      const res = await mastersApi.getUsers({ keyword: searchKeyword, page, pageSize });
      setUsers(res.data.list || res.data || []);
      setTotal(res.data.total || (res.data.list || []).length);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await reportsApi.getRoles();
      setRoles(res.data || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const loadStores = async () => {
    try {
      const res = await mastersApi.getStores();
      setStores(res.data.list || res.data || []);
    } catch (err) {
      console.error('Failed to load stores:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await mastersApi.getProducts({ keyword: searchKeyword, page, pageSize });
      setProducts(res.data.list || res.data || []);
      setTotal(res.data.total || (res.data.list || []).length);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await mastersApi.getMembers({ keyword: searchKeyword, page, pageSize });
      setMembers(res.data.list || res.data || []);
      setTotal(res.data.total || (res.data.list || []).length);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await reportsApi.getAuditLogs({ page, pageSize });
      setAuditLogs(res.data.list || res.data || []);
      setTotal(res.data.total || (res.data.list || []).length);
    } catch (err) {
      setAuditLogs([]);
    }
  };

  const loadReviewItems = async () => {
    try {
      const [refundsRes, shiftsRes, reconRes] = await Promise.all([
        refundsApi.getRefunds({ status: 'pending', pageSize: 20 }),
        shiftsApi.getShifts({ status: 'pending', pageSize: 20 }),
        reconciliationApi.getReconciliations({ status: 'pending', pageSize: 20 })
      ]);

      const items = [
        ...((refundsRes.data.list || refundsRes.data || []).map((r: any) => ({
          ...r,
          type: 'refund',
          typeLabel: '退款审核',
          typeIcon: <AlertCircle className="w-4 h-4 text-red-500" />,
          amount: r.amount,
          status: r.status === 'pending' ? '待审核' : r.status
        }))),
        ...((shiftsRes.data.list || shiftsRes.data || []).filter((s: any) => s.difference_amount !== 0).map((s: any) => ({
          ...s,
          type: 'shift',
          typeLabel: '交班差异',
          typeIcon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
          amount: s.difference_amount,
          status: s.status === 'closed' ? '已完成' : '待复核'
        }))),
        ...((reconRes.data.list || reconRes.data || []).map((r: any) => ({
          ...r,
          type: 'recon',
          typeLabel: '对账差异',
          typeIcon: <AlertCircle className="w-4 h-4 text-purple-500" />,
          amount: r.difference_amount,
          status: r.status === 'completed' ? '已完成' : '待处理'
        })))
      ];

      setReviewItems(items.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      console.error('Failed to load review items:', err);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    setSearchKeyword('');
    navigate(`/admin/${key}`);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      finance: 'bg-blue-100 text-blue-700',
      store_manager: 'bg-green-100 text-green-700',
      cashier: 'bg-yellow-100 text-yellow-700',
      area_operator: 'bg-orange-100 text-orange-700'
    };
    const labels: Record<string, string> = {
      admin: '系统管理员',
      finance: '财务',
      store_manager: '门店店长',
      cashier: '收银员',
      area_operator: '区域运营'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      active: '启用',
      inactive: '禁用',
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      normal: 'bg-gray-100 text-gray-700',
      silver: 'bg-blue-100 text-blue-700',
      gold: 'bg-yellow-100 text-yellow-700',
      diamond: 'bg-purple-100 text-purple-700'
    };
    const labels: Record<string, string> = {
      normal: '普通会员',
      silver: '银卡会员',
      gold: '金卡会员',
      diamond: '钻石会员'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level] || 'bg-gray-100 text-gray-700'}`}>
        {labels[level] || level}
      </span>
    );
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除此项吗？')) {
      try {
        await mastersApi.deleteProduct(id);
        loadTabData();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleToggleStatus = async (id: number, status: string) => {
    try {
      if (activeTab === 'users') {
        await mastersApi.updateUser(id, { status });
      }
      loadUsers();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const openModal = (type: string, item?: any) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users': return renderUsers();
      case 'roles': return renderRoles();
      case 'stores': return renderStores();
      case 'products': return renderProducts();
      case 'members': return renderMembers();
      case 'audit': return renderAudit();
      case 'review': return renderReview();
      case 'profile': return renderProfile();
      default: return null;
    }
  };

  const renderSearchBar = (placeholder: string, onAdd?: string, onRefresh?: () => void) => (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
      {onAdd && hasRole('admin') && (
        <button
          onClick={() => openModal(onAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus className="w-4 h-4" />
          新增
        </button>
      )}
      {onRefresh && (
        <button onClick={onRefresh} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition">
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      {renderSearchBar('搜索用户名/姓名...', 'addUser', loadUsers)}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用户名</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">姓名</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">角色</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">门店</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">手机号</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-medium text-sm">
                      {u.real_name?.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-800">{u.username}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-800">{u.real_name}</td>
                <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                <td className="py-3 px-4 text-gray-600 text-sm">{u.store_name || '-'}</td>
                <td className="py-3 px-4 text-gray-600 text-sm">{u.phone || '-'}</td>
                <td className="py-3 px-4">{getStatusBadge(u.status)}</td>
                <td className="py-3 px-4 text-gray-500 text-sm">{formatDate(u.created_at)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(u.id, u.status === 'active' ? 'inactive' : 'active')}
                      className={`p-1.5 rounded transition ${u.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                    >
                      {u.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">暂无用户数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRoles = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">角色权限配置</h3>
        {hasRole('admin') && (
          <button
            onClick={() => openModal('addRole')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            <Plus className="w-4 h-4" />
            新增角色
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id || role.code} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{role.name}</h4>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-blue-600 rounded transition">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">权限列表：</p>
              <div className="flex flex-wrap gap-1">
                {(role.permissions || []).slice(0, 6).map((perm: any, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {(typeof perm === 'string' ? perm : perm.name || perm.code || '').replace(':', ' ')}
                  </span>
                ))}
                {(role.permissions || []).length > 6 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                    +{(role.permissions || []).length - 6} 更多
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                <Users className="w-4 h-4 inline mr-1" />
                {role.user_count || 0} 个用户
              </span>
              <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                配置权限 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {roles.length === 0 && (
          <div className="col-span-3 py-12 text-center text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无角色数据</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStores = () => (
    <div className="space-y-4">
      {renderSearchBar('搜索门店名称...', 'addStore', loadStores)}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <div key={store.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{store.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(store.status)}
                  {store.is_main && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">总店</span>}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {store.phone || '未设置'}
              </p>
              <p className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                店长：{store.manager_name || '未设置'}
              </p>
              <p className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                收银员：{store.cashier_count || 0} 人
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">今日销售：</span>
                <span className="font-semibold text-gray-800 ml-1">{formatCurrency(store.today_sales || 0)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {stores.length === 0 && (
          <div className="col-span-3 py-12 text-center text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无门店数据</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-4">
      {renderSearchBar('搜索商品名称/条码...', 'addProduct', loadProducts)}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">商品信息</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分类</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">售价</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">库存</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? products.map((product) => (
              <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.barcode || '-'}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">{product.category_name || '-'}</td>
                <td className="py-3 px-4 text-right font-medium text-gray-800">{formatCurrency(product.price)}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-gray-800'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-3 px-4">{getStatusBadge(product.status)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">暂无商品数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-4">
      {renderSearchBar('搜索会员姓名/手机号...', 'addMember', loadMembers)}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {member.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{member.name}</h4>
                  <p className="text-sm text-gray-500">{member.phone}</p>
                </div>
              </div>
              {getLevelBadge(member.level)}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-gray-800">{member.points || 0}</p>
                <p className="text-xs text-gray-500">积分</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-gray-800">{formatCurrency(member.balance || 0)}</p>
                <p className="text-xs text-gray-500">余额</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-gray-800">{member.order_count || 0}</p>
                <p className="text-xs text-gray-500">订单</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">注册：{formatDate(member.created_at)}</span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="col-span-3 py-12 text-center text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无会员数据</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索操作人/操作类型..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部类型</option>
          <option value="login">登录</option>
          <option value="order">订单</option>
          <option value="refund">退款</option>
          <option value="reconciliation">对账</option>
        </select>
        <button onClick={loadAuditLogs} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition">
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm transition hover:bg-blue-100">
          <Download className="w-4 h-4" />
          导出
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {auditLogs.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      (log.action_type || log.action || '').includes('create') ? 'bg-green-100 text-green-600' :
                      (log.action_type || log.action || '').includes('delete') ? 'bg-red-100 text-red-600' :
                      (log.action_type || log.action || '').includes('update') ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <History className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800">{log.real_name || log.operator_name || log.username}</span>
                        <span className="text-xs text-gray-500">
                          {log.store_name && `· ${log.store_name}`}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {log.action_type || log.action}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{log.action_detail || log.detail}</p>
                      {log.ip_address && (
                        <p className="text-xs text-gray-400 mt-1">IP: {log.ip_address}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无操作日志</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">业务复查中心</h3>
        <button onClick={loadReviewItems} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition">
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600">待审核退款</p>
              <p className="text-2xl font-bold text-red-700">
                {reviewItems.filter(i => i.type === 'refund').length}
              </p>
            </div>
          </div>
          <a href="/refunds?status=pending" className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-yellow-600">交班差异待复核</p>
              <p className="text-2xl font-bold text-yellow-700">
                {reviewItems.filter(i => i.type === 'shift').length}
              </p>
            </div>
          </div>
          <a href="/shifts" className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileSearch className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">对账差异待处理</p>
              <p className="text-2xl font-bold text-purple-700">
                {reviewItems.filter(i => i.type === 'recon').length}
              </p>
            </div>
          </div>
          <a href="/reconciliation?status=pending" className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">单号</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">门店</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">金额</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {reviewItems.length > 0 ? reviewItems.map((item) => (
              <tr key={`${item.type}-${item.id}`} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {item.typeIcon}
                    <span className="text-sm text-gray-600">{item.typeLabel}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-gray-800">
                  {item.order_no || item.shift_no || item.recon_no || '-'}
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">{item.store_name || '-'}</td>
                <td className="py-3 px-4 text-right font-medium text-gray-800">{formatCurrency(item.amount || 0)}</td>
                <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                <td className="py-3 px-4 text-gray-500 text-sm">{formatDateTime(item.created_at)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition">
                      处理
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>暂无待处理项</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {user?.real_name?.charAt(0)}
          </div>
          <h3 className="text-xl font-bold text-gray-800">{user?.real_name}</h3>
          <p className="text-gray-500 mt-1">{user?.username}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            {getRoleBadge(user?.role || '')}
            {user?.store_name && (
              <span className="text-sm text-gray-500">{user.store_name}</span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-4">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">手机号</p>
                <p className="font-medium text-gray-800 mt-1">{user?.phone || '未设置'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">邮箱</p>
                <p className="font-medium text-gray-800 mt-1">{user?.email || '未设置'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">创建时间</p>
                <p className="font-medium text-gray-800 mt-1">{formatDate(user?.created_at)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">最后登录</p>
                <p className="font-medium text-gray-800 mt-1">{formatDateTime(user?.last_login_at)}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-4">安全设置</h4>
            <div className="space-y-3">
              <button
                onClick={() => openModal('changePassword')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-800">修改密码</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => openModal('editProfile')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              编辑资料
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">系统管理</h2>
          <p className="text-gray-500">管理用户、角色权限、操作审计和业务复查</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl inline-flex">
        {visibleTabs.map((tabConfig) => (
          <button
            key={tabConfig.key}
            onClick={() => handleTabChange(tabConfig.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tabConfig.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tabConfig.icon}
            {tabConfig.label}
          </button>
        ))}
      </div>

      {renderTabContent()}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {modalType === 'addUser' ? '新增用户' :
                modalType === 'addRole' ? '新增角色' :
                modalType === 'addStore' ? '新增门店' :
                modalType === 'addProduct' ? '新增商品' :
                modalType === 'addMember' ? '新增会员' :
                modalType === 'changePassword' ? '修改密码' :
                modalType === 'editProfile' ? '编辑资料' : '详情'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <Edit className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-500 text-sm">功能开发中...</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition">
                取消
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
