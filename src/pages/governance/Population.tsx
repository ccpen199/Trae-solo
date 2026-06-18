import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  GraduationCap,
  Home,
  Briefcase,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { useGet } from '../../hooks/useApi';
import Card from '../../components/Card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PopulationProfile } from '../../../shared/types';

export default function Population() {
  const { data: profile, isLoading } = useGet<PopulationProfile>(
    ['population-profile'],
    '/governance/population',
    { refetchInterval: 60000 }
  );

  const ageData = profile?.ageDistribution?.map((item) => ({
    name: item.range,
    人数: item.count,
    占比: item.percentage,
  })) || [];

  const genderData = profile?.genderDistribution ? [
    { name: '男性', value: profile.genderDistribution.male, percentage: profile.genderDistribution.malePercentage, color: '#165DFF' },
    { name: '女性', value: profile.genderDistribution.female, percentage: profile.genderDistribution.femalePercentage, color: '#F53F3F' },
  ] : [];

  const householdData = profile?.householdDistribution ? [
    { name: '本地户籍', value: profile.householdDistribution.local, percentage: profile.householdDistribution.localPercentage, color: '#00B42A' },
    { name: '外来人口', value: profile.householdDistribution.nonLocal, percentage: profile.householdDistribution.nonLocalPercentage, color: '#FF7D00' },
  ] : [];

  const educationData = profile?.educationDistribution?.map((item) => ({
    name: item.level,
    人数: item.count,
    占比: item.percentage,
  })) || [];

  const GENDER_COLORS = ['#165DFF', '#F53F3F'];
  const HOUSEHOLD_COLORS = ['#00B42A', '#FF7D00'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <Card.Body>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">辖区人口画像</h2>
              <p className="text-sm text-gray-500">多维度人口结构分析，助力精准治理</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Card.Body className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <Card.Body className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总人口</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {profile?.total?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    同比增长 {profile?.yearOverYearGrowth || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">就业率</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {profile?.employmentRate || 0}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    适龄劳动人口就业比例
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">男女性别比</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {profile?.genderDistribution ? (
                      (profile.genderDistribution.male / profile.genderDistribution.female * 100).toFixed(1)
                    ) : 0}
                    <span className="text-lg font-normal text-gray-500">: 100</span>
                  </p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs flex items-center gap-1">
                      <UserPlus className="w-3 h-3 text-blue-600" />
                      {profile?.genderDistribution?.malePercentage || 0}%
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <UserMinus className="w-3 h-3 text-red-500" />
                      {profile?.genderDistribution?.femalePercentage || 0}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <PieChartIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">户籍结构</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {profile?.householdDistribution?.localPercentage || 0}
                    <span className="text-lg font-normal text-gray-500">%</span>
                  </p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-green-600">本地 {profile?.householdDistribution?.localPercentage || 0}%</span>
                    <span className="text-xs text-orange-600">外来 {profile?.householdDistribution?.nonLocalPercentage || 0}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Home className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              年龄分布
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value.toLocaleString() + (name === '占比' ? '%' : '人'),
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="人数" fill="#165DFF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="占比" fill="#FF7D00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              性别分布
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    labelLine={false}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString() + '人', '人数']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-2">
              {genderData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">
                    {item.name}: {item.value.toLocaleString()}人 ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              户籍分布
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={householdData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    labelLine={false}
                  >
                    {householdData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString() + '人', '人数']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-2">
              {householdData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">
                    {item.name}: {item.value.toLocaleString()}人 ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              教育程度分布
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value.toLocaleString() + (name === '占比' ? '%' : '人'),
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="人数" fill="#722ED1" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="占比" fill="#0FC6C2" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900">人口画像洞察</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-5">
              <h4 className="font-semibold text-blue-900 mb-2">老龄化趋势</h4>
              <p className="text-sm text-blue-700">
                60岁以上人口占比达{profile?.ageDistribution?.find(a => a.range.includes('60'))?.percentage || 0}%，
                需加强养老服务设施建设和医疗保障投入。
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-5">
              <h4 className="font-semibold text-green-900 mb-2">劳动力充足</h4>
              <p className="text-sm text-green-700">
                18-59岁劳动年龄人口占比{
                  profile?.ageDistribution
                    ?.filter(a => {
                      const match = a.range.match(/(\d+)-(\d+)/);
                      if (match) {
                        const start = parseInt(match[1]);
                        const end = parseInt(match[2]);
                        return start >= 18 && end <= 59;
                      }
                      return false;
                    })
                    .reduce((sum, a) => sum + a.percentage, 0) || 0
                }%，
                就业率达{profile?.employmentRate || 0}%，人口红利持续释放。
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-5">
              <h4 className="font-semibold text-orange-900 mb-2">人口流入</h4>
              <p className="text-sm text-orange-700">
                外来人口占比{profile?.householdDistribution?.nonLocalPercentage || 0}%，
                需完善公共服务均等化，保障外来人口权益。
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
}
