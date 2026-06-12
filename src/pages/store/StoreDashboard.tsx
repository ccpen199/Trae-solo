import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Clock,
  Package,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Stethoscope,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge, Tag, Avatar, AvatarGroup } from '@/components/common/BadgeTagAvatar';
import { Progress } from '@/components/common/UIComponents';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { cn, formatCurrency } from '@/utils/common';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function StoreDashboard() {
  const { appointments, schedules, employees, fetchAppointments, fetchSchedules, fetchEmployees, isLoading } = useAppointmentStore();
  const { inventoryItems, lowStockItems, fetchInventoryItems, fetchLowStockItems } = useInventoryStore();

  useEffect(() => {
    fetchAppointments();
    fetchSchedules();
    fetchEmployees();
    fetchInventoryItems();
    fetchLowStockItems();
  }, [fetchAppointments, fetchSchedules, fetchEmployees, fetchInventoryItems, fetchLowStockItems]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = appointments.filter((a) => a.scheduledDate === today);
  const todaySchedules = schedules.filter((s) => s.date === today);

  const statusCounts = {
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    in_service: appointments.filter((a) => a.status === 'in_service').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  const todayRevenue = todayAppointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + a.totalPrice, 0);

  const quickActions = [
    { icon: Calendar, label: '排班调度', path: '/store/schedule', color: 'bg-primary-100 text-primary-600' },
    { icon: Stethoscope, label: '服务执行', path: '/store/service', color: 'bg-accent-100 text-accent-600' },
    { icon: Package, label: '库存管理', path: '/store/inventory', color: 'bg-mint-100 text-mint-600' },
    { icon: Users, label: '病历管理', path: '/store/medical', color: 'bg-blue-100 text-blue-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">门店工作台</h1>
          <p className="text-neutral-500 mt-1">
            {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })} · 中心店
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AvatarGroup max={3}>
            {employees.slice(0, 3).map((emp) => (
              <Avatar
                key={emp.id}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.id}`}
                name={emp.name}
                size="sm"
                status={todaySchedules.find((s) => s.employeeId === emp.id) ? 'online' : 'offline'}
              />
            ))}
          </AvatarGroup>
          <Button variant="outline">切换门店</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '今日预约', value: todayAppointments.length, icon: Calendar, color: 'from-primary-500 to-primary-600', suffix: '单' },
          { label: '今日营收', value: formatCurrency(todayRevenue), icon: TrendingUp, color: 'from-accent-500 to-accent-400', suffix: '' },
          { label: '待服务', value: statusCounts.confirmed, icon: Clock, color: 'from-amber-500 to-amber-400', suffix: '单' },
          { label: '已完成', value: statusCounts.completed, icon: CheckCircle, color: 'from-green-500 to-green-400', suffix: '单' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hoverable>
              <CardContent>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {stat.value}
                  <span className="text-sm font-normal text-neutral-400 ml-1">{stat.suffix}</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">库存预警</h4>
                <p className="text-sm text-white/80">有 {lowStockItems.length} 个物品库存不足，请及时补货</p>
              </div>
            </div>
            <Button variant="ghost" className="bg-white/10 hover:bg-white/20 text-white">
              去查看
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">今日预约</CardTitle>
              <Button variant="ghost" size="sm">
                查看全部
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.map((apt, index) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl hover:bg-white hover:shadow-soft transition-all cursor-pointer"
                >
                  <div className="text-center w-16 flex-shrink-0">
                    <p className="text-lg font-bold text-neutral-900">{apt.startTime}</p>
                    <p className="text-xs text-neutral-400">{apt.endTime}</p>
                  </div>
                  <div className="w-0.5 h-12 bg-primary-200 rounded-full" />
                  <Avatar
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${apt.ownerName}`}
                    name={apt.ownerName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-neutral-900">{apt.ownerName}</h4>
                      <span className="text-sm text-neutral-500">· {apt.petName}</span>
                      <Badge variant={
                        apt.status === 'in_service' ? 'warning' :
                        apt.status === 'completed' ? 'success' :
                        apt.status === 'cancelled' ? 'danger' : 'info'
                      } size="sm">
                        {apt.status === 'confirmed' ? '待服务' :
                         apt.status === 'in_service' ? '服务中' :
                         apt.status === 'completed' ? '已完成' :
                         apt.status === 'cancelled' ? '已取消' : apt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {apt.serviceId === 'srv_001' ? '精致洗护套餐' :
                       apt.serviceId === 'srv_002' ? '体内外驱虫服务' :
                       apt.serviceId === 'srv_003' ? '疫苗接种服务' : '服务预约'}
                    </p>
                  </div>
                  <Avatar
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${apt.staffId}`}
                    name="员工"
                    size="sm"
                  />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">快捷操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.path}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="p-4 bg-neutral-50 rounded-xl hover:bg-white hover:shadow-soft transition-all text-center"
                  >
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-neutral-700">{action.label}</p>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">员工排班</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.map((emp) => {
                  const schedule = todaySchedules.find((s) => s.employeeId === emp.id);
                  return (
                    <div key={emp.id} className="flex items-center gap-3">
                      <Avatar
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.id}`}
                        name={emp.name}
                        size="sm"
                        status={schedule ? 'online' : 'offline'}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{emp.name}</p>
                        <p className="text-xs text-neutral-500">{emp.position}</p>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {schedule ? `${schedule.startTime} - ${schedule.endTime}` : '休息'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">今日目标</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">预约完成率</span>
                    <span className="text-sm font-medium text-primary-600">
                      {todayAppointments.length > 0 ? Math.round((statusCounts.completed / todayAppointments.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={todayAppointments.length > 0 ? (statusCounts.completed / todayAppointments.length) * 100 : 0}
                    color="primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">营收目标</span>
                    <span className="text-sm font-medium text-accent-600">
                      {Math.min(100, Math.round((todayRevenue / 5000) * 100))}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (todayRevenue / 5000) * 100)}
                    color="accent"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">客户满意度</span>
                    <span className="text-sm font-medium text-mint-600">98%</span>
                  </div>
                  <Progress value={98} color="mint" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
