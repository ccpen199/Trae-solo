import React from 'react';
import { 
  Tv, 
  CheckSquare, 
  DollarSign, 
  ChefHat, 
  Wrench,
  AlertTriangle,
  Clock,
  TrendingUp,
  Plus
} from 'lucide-react';
import { useHomeContext } from '../context/HomeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  subtitle?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { appliances, tasks, budgetEntries, recipes, inventory, repairs, setActiveTab } = useHomeContext();

  const activeAppliances = appliances.filter(a => a.status === 'active').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalBudget = budgetEntries.reduce((sum, b) => sum + b.amount, 0);
  const lowStockItems = inventory.filter(i => i.lowStock).length;
  const pendingRepairs = repairs.filter(r => r.status !== 'completed').length;
  const favoriteRecipes = recipes.filter(r => r.favorite).length;

  const recentTasks = tasks
    .filter(t => t.status !== 'completed')
    .slice(0, 5)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          title="家电设备"
          value={activeAppliances}
          icon={<Tv className="w-6 h-6" />}
          color="blue"
          subtitle={`共${appliances.length}台设备`}
          onClick={() => setActiveTab('appliances')}
        />
        <StatCard
          title="待完成任务"
          value={pendingTasks}
          icon={<CheckSquare className="w-6 h-6" />}
          color="orange"
          subtitle={`已完成${completedTasks}项`}
          onClick={() => setActiveTab('tasks')}
        />
        <StatCard
          title="支出总计"
          value={`¥${totalBudget.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          subtitle="累计支出"
          onClick={() => setActiveTab('budget')}
        />
        <StatCard
          title="库存预警"
          value={lowStockItems}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          subtitle="需要补充"
          onClick={() => setActiveTab('inventory')}
        />
        <StatCard
          title="收藏菜谱"
          value={favoriteRecipes}
          icon={<ChefHat className="w-6 h-6" />}
          color="purple"
          subtitle={`共${recipes.length}道菜谱`}
          onClick={() => setActiveTab('recipes')}
        />
        <StatCard
          title="待处理维修"
          value={pendingRepairs}
          icon={<Wrench className="w-6 h-6" />}
          color="orange"
          subtitle={`共${repairs.length}条记录`}
          onClick={() => setActiveTab('repairs')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">近期任务</h3>
            <button 
              onClick={() => setActiveTab('tasks')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部
            </button>
          </div>
          <div className="p-4 space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' : 
                      task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.dueDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>暂无待处理任务</p>
                <button 
                  onClick={() => setActiveTab('tasks')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                >
                  <Plus className="w-4 h-4" /> 添加新任务
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">支出概览</h3>
            <button 
              onClick={() => setActiveTab('budget')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">本月支出</p>
                <p className="text-xl font-bold text-gray-800">¥{totalBudget.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span className="text-sm text-gray-600">设备购买</span>
                </div>
                <span className="text-sm font-medium">
                  ¥{budgetEntries.filter(b => b.category === 'purchase').reduce((s, b) => s + b.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-500"></div>
                  <span className="text-sm text-gray-600">维护费用</span>
                </div>
                <span className="text-sm font-medium">
                  ¥{budgetEntries.filter(b => b.category === 'maintenance').reduce((s, b) => s + b.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-sm text-gray-600">水电费用</span>
                </div>
                <span className="text-sm font-medium">
                  ¥{budgetEntries.filter(b => b.category === 'utility').reduce((s, b) => s + b.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
