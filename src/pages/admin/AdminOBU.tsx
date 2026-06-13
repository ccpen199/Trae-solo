import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Search,
  Filter,
  Plus,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Package,
  Clock,
  User,
  Car,
  Calendar,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import dayjs from 'dayjs';

export default function AdminOBU() {
  const { obus } = useStore();
  const [statusFilter, setStatusFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOBU, setSelectedOBU] = useState<string | null>(null);

  const statusOptions = ['全部', '库存', '已激活', '挂失', '故障', '已报废'];

  const stats = [
    { label: '设备总数', value: obus.length, icon: Package, color: 'bg-primary-500' },
    { label: '已激活', value: obus.filter((o) => o.status === '已激活').length, icon: CheckCircle, color: 'bg-green-500' },
    { label: '库存', value: obus.filter((o) => o.status === '库存').length, icon: Package, color: 'bg-blue-500' },
    { label: '故障', value: obus.filter((o) => o.status === '故障').length, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已激活':
        return 'bg-green-100 text-green-700';
      case '库存':
        return 'bg-blue-100 text-blue-700';
      case '挂失':
        return 'bg-yellow-100 text-yellow-700';
      case '故障':
        return 'bg-red-100 text-red-700';
      case '已报废':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '已激活':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case '库存':
        return <Package className="w-4 h-4 text-blue-500" />;
      case '挂失':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case '故障':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case '已报废':
        return <Trash2 className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredOBUs = obus.filter((obu) => {
    const matchStatus = statusFilter === '全部' || obu.status === statusFilter;
    const matchSearch =
      searchTerm === '' ||
      obu.deviceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obu.model.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">OBU设备管理</h1>
              <p className="text-dark-400">OBU设备全生命周期管理</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors">
                <Download className="w-4 h-4" />
                导出
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                <Plus className="w-4 h-4" />
                设备入库
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
              className="card-dark p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white font-mono">{stat.value}</p>
              <p className="text-sm text-dark-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-dark p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="搜索设备编号或型号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field-dark pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-dark-400" />
              <div className="flex gap-1">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      statusFilter === status
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">设备编号</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">型号</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">状态</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">绑定用户</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">绑定车辆</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">激活时间</th>
                  <th className="text-left py-3 px-4 text-dark-400 font-medium">有效期</th>
                  <th className="text-center py-3 px-4 text-dark-400 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOBUs.map((obu, idx) => (
                  <motion.tr
                    key={obu.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                    className={`border-b border-dark-700 hover:bg-dark-800 cursor-pointer transition-colors ${
                      selectedOBU === obu.id ? 'bg-dark-800' : ''
                    }`}
                    onClick={() => setSelectedOBU(selectedOBU === obu.id ? null : obu.id)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(obu.status)}
                        <span className="text-white font-mono">{obu.deviceNo}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-dark-300">{obu.model}</td>
                    <td className="py-4 px-4">
                      <span className={`badge ${getStatusColor(obu.status)}`}>
                        {obu.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {obu.userId ? (
                        <span className="text-white flex items-center gap-1">
                          <User className="w-3 h-3 text-dark-400" />
                          用户 {obu.userId.slice(1)}
                        </span>
                      ) : (
                        <span className="text-dark-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {obu.vehicleId ? (
                        <span className="text-white flex items-center gap-1">
                          <Car className="w-3 h-3 text-dark-400" />
                          车辆 {obu.vehicleId.slice(1)}
                        </span>
                      ) : (
                        <span className="text-dark-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-dark-300">
                      {obu.activateTime ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-dark-400" />
                          {dayjs(obu.activateTime).format('YYYY-MM-DD')}
                        </span>
                      ) : (
                        <span className="text-dark-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`font-mono ${
                          dayjs(obu.expiryDate).isBefore(dayjs().add(6, 'month'))
                            ? 'text-red-400'
                            : 'text-dark-300'
                        }`}
                      >
                        {obu.expiryDate}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 rounded-lg bg-dark-700 text-dark-300 hover:bg-primary-500 hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Edit:', obu.id);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {obu.status === '已激活' && (
                          <button
                            className="p-1.5 rounded-lg bg-dark-700 text-dark-300 hover:bg-yellow-500 hover:text-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('挂失:', obu.id);
                            }}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOBUs.length === 0 && (
            <div className="text-center py-12">
              <Radio className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">暂无符合条件的设备</p>
            </div>
          )}
        </motion.div>
    </div>
  );
}
