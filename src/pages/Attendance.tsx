import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Tabs, List, SearchBar, Picker, Button, Empty } from 'antd-mobile';
import {
  CalendarCheck,
  Clock,
  User,
  ChevronRight,
  Filter,
  ArrowLeft,
  BarChart3,
  List as ListIcon,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAttendanceStore } from '@/store/attendanceStore';
import type { AttendanceRecord, AttendanceStatus } from '@shared/types';

const classOptions = [
  { label: '全部班级', value: '' },
  { label: '2024级计算机1班', value: '2024级计算机1班' },
  { label: '2024级计算机2班', value: '2024级计算机2班' },
  { label: '2024级电子商务1班', value: '2024级电子商务1班' },
  { label: '2024级电子商务2班', value: '2024级电子商务2班' },
  { label: '2023级会计1班', value: '2023级会计1班' },
];

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '正常', value: 'normal' },
  { label: '迟到', value: 'late' },
  { label: '缺勤', value: 'absent' },
  { label: '异常', value: 'exception' },
];

const mockTodayRecords: AttendanceRecord[] = [
  { id: 1, studentId: 1, studentName: '张三', schoolId: 1, checkInTime: '2024-01-15 07:45:30', checkInType: 'face', locationLat: 34.75, locationLng: 113.62, locationAccuracy: 5.2, isInFence: true, faceMatchScore: 95.5, status: 'normal', className: '2024级计算机1班' },
  { id: 2, studentId: 2, studentName: '李四', schoolId: 1, checkInTime: '2024-01-15 08:15:20', checkInType: 'face', locationLat: 34.75, locationLng: 113.62, locationAccuracy: 4.8, isInFence: true, faceMatchScore: 92.3, status: 'late', className: '2024级计算机1班' },
  { id: 3, studentId: 3, studentName: '王五', schoolId: 1, checkInTime: '2024-01-15 07:50:15', checkInType: 'face', locationLat: 34.75, locationLng: 113.62, locationAccuracy: 6.1, isInFence: true, faceMatchScore: 88.7, status: 'normal', className: '2024级计算机2班' },
  { id: 4, studentId: 4, studentName: '赵六', schoolId: 1, checkInTime: '', checkInType: 'face', locationLat: 0, locationLng: 0, locationAccuracy: 0, isInFence: false, faceMatchScore: 0, status: 'absent', className: '2024级电子商务1班' },
  { id: 5, studentId: 5, studentName: '钱七', schoolId: 1, checkInTime: '2024-01-15 08:05:45', checkInType: 'face', locationLat: 34.76, locationLng: 113.63, locationAccuracy: 8.5, isInFence: false, faceMatchScore: 90.2, status: 'exception', className: '2024级电子商务1班' },
];

const mockHistoryRecords: AttendanceRecord[] = [
  { id: 6, studentId: 6, studentName: '孙八', schoolId: 1, checkInTime: '2024-01-14 07:30:00', checkInType: 'face', locationLat: 34.75, locationLng: 113.62, locationAccuracy: 4.2, isInFence: true, faceMatchScore: 94.1, status: 'normal', className: '2023级会计1班' },
  { id: 7, studentId: 7, studentName: '周九', schoolId: 1, checkInTime: '2024-01-14 08:20:30', checkInType: 'face', locationLat: 34.75, locationLng: 113.62, locationAccuracy: 5.8, isInFence: true, faceMatchScore: 91.5, status: 'late', className: '2023级会计1班' },
  ...mockTodayRecords,
];

const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const { todayRecords, historyRecords, loading, getTodayRecords, getHistoryRecords } = useAttendanceStore();
  
  const [activeTab, setActiveTab] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 0) {
        await getTodayRecords({ pageSize: 50 });
      } else if (activeTab === 1) {
        await getHistoryRecords({ pageSize: 50 });
      }
    } catch (error) {
      console.error('Load attendance error:', error);
    }
  };

  const getStatusConfig = (status: AttendanceStatus) => {
    switch (status) {
      case 'normal':
        return { color: 'success', text: '正常', bgColor: 'bg-green-50', textColor: 'text-green-600' };
      case 'late':
        return { color: 'warning', text: '迟到', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' };
      case 'absent':
        return { color: 'danger', text: '缺勤', bgColor: 'bg-red-50', textColor: 'text-red-600' };
      case 'exception':
        return { color: 'primary', text: '异常', bgColor: 'bg-blue-50', textColor: 'text-blue-600' };
    }
  };

  const getRecords = () => {
    const records = activeTab === 0 ? mockTodayRecords : mockHistoryRecords;
    return records.filter((record) => {
      const matchKeyword = !searchKeyword || 
        record.studentName.includes(searchKeyword) || 
        record.className?.includes(searchKeyword);
      const matchClass = !selectedClass || record.className === selectedClass;
      const matchStatus = !selectedStatus || record.status === selectedStatus;
      return matchKeyword && matchClass && matchStatus;
    });
  };

  const statisticsData = [
    { name: '周一', normal: 450, late: 28, absent: 15, exception: 7 },
    { name: '周二', normal: 462, late: 22, absent: 12, exception: 4 },
    { name: '周三', normal: 448, late: 35, absent: 18, exception: 9 },
    { name: '周四', normal: 470, late: 18, absent: 10, exception: 2 },
    { name: '周五', normal: 455, late: 25, absent: 14, exception: 6 },
  ];

  const pieData = [
    { name: '正常', value: 820, color: '#10B981' },
    { name: '迟到', value: 128, color: '#F59E0B' },
    { name: '缺勤', value: 69, color: '#EF4444' },
    { name: '异常', value: 28, color: '#3B82F6' },
  ];

  const summaryStats = {
    total: 1045,
    normal: 820,
    late: 128,
    absent: 69,
    exception: 28,
    rate: (820 / 1045 * 100).toFixed(1),
  };

  const tabs = [
    { key: '0', title: '今日考勤', icon: CalendarCheck },
    { key: '1', title: '考勤记录', icon: ListIcon },
    { key: '2', title: '统计分析', icon: BarChart3 },
  ];

  const filteredRecords = getRecords();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">考勤管理</h1>
          <button
            onClick={() => setFilterVisible(!filterVisible)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Filter className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center p-2 bg-white/10 rounded-xl">
            <p className="text-2xl font-bold text-white">{summaryStats.total}</p>
            <p className="text-white/70 text-xs">应到人数</p>
          </div>
          <div className="text-center p-2 bg-white/10 rounded-xl">
            <p className="text-2xl font-bold text-green-300">{summaryStats.normal}</p>
            <p className="text-white/70 text-xs">正常</p>
          </div>
          <div className="text-center p-2 bg-white/10 rounded-xl">
            <p className="text-2xl font-bold text-yellow-300">{summaryStats.late}</p>
            <p className="text-white/70 text-xs">迟到</p>
          </div>
          <div className="text-center p-2 bg-white/10 rounded-xl">
            <p className="text-2xl font-bold text-red-300">{summaryStats.absent}</p>
            <p className="text-white/70 text-xs">缺勤</p>
          </div>
        </div>
      </div>

      {filterVisible && (
        <div className="bg-white px-4 py-3 border-b border-gray-100 animate-fade-in">
          <SearchBar
            placeholder="搜索学生姓名或班级"
            value={searchKeyword}
            onChange={setSearchKeyword}
            className="mb-3"
          />
          <div className="flex gap-3">
            <Button
              block
              size="small"
              onClick={() => setShowClassPicker(true)}
              className="flex-1 !bg-gray-50 !text-gray-700 !border-gray-200"
            >
              <span className="flex items-center justify-center">
                <User className="w-4 h-4 mr-1" />
                {selectedClass || '选择班级'}
              </span>
            </Button>
            <Button
              block
              size="small"
              onClick={() => setShowStatusPicker(true)}
              className="flex-1 !bg-gray-50 !text-gray-700 !border-gray-200"
            >
              <span className="flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {selectedStatus ? statusOptions.find(s => s.value === selectedStatus)?.label : '选择状态'}
              </span>
            </Button>
          </div>
        </div>
      )}

      <Tabs
        activeKey={activeTab.toString()}
        onChange={(key) => setActiveTab(parseInt(key))}
        className="bg-white sticky top-0 z-10"
      >
        {tabs.map((tab) => (
          <Tabs.Tab key={tab.key} title={
            <div className="flex items-center justify-center py-2">
              <tab.icon className="w-4 h-4 mr-1" />
              {tab.title}
            </div>
          } />
        ))}
      </Tabs>

      <div className="p-4">
        {activeTab === 2 ? (
          <div className="space-y-4">
            <Card className="rounded-2xl border-0 shadow-lg">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">本周考勤趋势</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statisticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="normal" name="正常" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="late" name="迟到" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" name="缺勤" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="exception" name="异常" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">考勤状态分布</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">考勤统计概览</h3>
                <div className="space-y-3">
                  {[
                    { label: '出勤率', value: `${summaryStats.rate}%`, color: 'text-green-600', bgColor: 'bg-green-50' },
                    { label: '正常出勤', value: `${summaryStats.normal}人`, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { label: '迟到人次', value: `${summaryStats.late}人`, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                    { label: '缺勤人次', value: `${summaryStats.absent}人`, color: 'text-red-600', bgColor: 'bg-red-50' },
                    { label: '异常人次', value: `${summaryStats.exception}人`, color: 'text-purple-600', bgColor: 'bg-purple-50' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">{item.label}</span>
                      <span className={`font-semibold ${item.color} px-3 py-1 rounded-lg ${item.bgColor}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="rounded-2xl border-0 shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {activeTab === 0 ? '今日考勤列表' : '考勤记录'}
                </h3>
                <span className="text-sm text-gray-400">共 {filteredRecords.length} 条</span>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-100 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : filteredRecords.length === 0 ? (
                <Empty description="暂无考勤记录" />
              ) : (
                <List>
                  {filteredRecords.map((record) => {
                    const statusConfig = getStatusConfig(record.status);
                    return (
                      <List.Item
                        key={record.id}
                        className="!px-0 !py-3 border-b border-gray-50 last:border-0"
                        prefix={
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        }
                        extra={
                          <Tag color={statusConfig.color}>
                            {statusConfig.text}
                          </Tag>
                        }
                        arrow={<ChevronRight className="w-4 h-4 text-gray-300" />}
                        onClick={() => navigate(`/attendance/${record.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800">{record.studentName}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-400">
                            <span className="mr-3">{record.className}</span>
                            {record.checkInTime && (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {record.checkInTime.split(' ')[1]}
                              </span>
                            )}
                          </div>
                        </div>
                      </List.Item>
                    );
                  })}
                </List>
              )}
            </div>
          </Card>
        )}
      </div>

      <Picker
        columns={[classOptions]}
        visible={showClassPicker}
        onClose={() => setShowClassPicker(false)}
        value={[selectedClass]}
        onConfirm={(v) => setSelectedClass(v[0] as string)}
      />
      
      <Picker
        columns={[statusOptions]}
        visible={showStatusPicker}
        onClose={() => setShowStatusPicker(false)}
        value={[selectedStatus]}
        onConfirm={(v) => setSelectedStatus(v[0] as string)}
      />
    </div>
  );
};

export default Attendance;
