import React, { useState, useMemo } from 'react';
import {
  Phone,
  Mail,
  Users,
  Calendar,
  Plus,
  Search,
  Download,
  Filter,
  X,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';

import ContactRecordItem from '@/components/agency/ContactRecordItem';

import {
  useAgencyStore,
  type ContactType,
  type ContactRecord,
} from '@/store/useAgencyStore';

const contactTypeLabels: Record<ContactType, string> = {
  call: '电话',
  email: '邮件',
  meeting: '会议',
  audition: '试镜',
};

interface FilterState {
  dateRange: 'all' | 'week' | 'month' | 'quarter';
  contactType: ContactType | 'all';
  artist: string;
  teamMember: string;
}

const ContactRecords: React.FC = () => {
  const { contactRecords, teamMembers, artists, addContactRecord } = useAgencyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    contactType: 'all',
    artist: '',
    teamMember: '',
  });
  const [newRecord, setNewRecord] = useState({
    contactType: 'call' as ContactType,
    artistId: '',
    teamMemberId: '',
    notes: '',
    followUpDate: '',
  });

  const filteredRecords = useMemo(() => {
    return contactRecords.filter((record) => {
      const matchesSearch =
        searchTerm === '' ||
        record.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.teamMemberName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filters.contactType === 'all' || record.contactType === filters.contactType;
      const matchesArtist = filters.artist === '' || record.artistId === filters.artist;
      const matchesTeamMember = filters.teamMember === '' || record.teamMemberId === filters.teamMember;

      let matchesDate = true;
      if (filters.dateRange !== 'all') {
        const recordDate = new Date(record.date);
        const now = new Date();
        const diffDays = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
        if (filters.dateRange === 'week') matchesDate = diffDays <= 7;
        else if (filters.dateRange === 'month') matchesDate = diffDays <= 30;
        else if (filters.dateRange === 'quarter') matchesDate = diffDays <= 90;
      }

      return matchesSearch && matchesType && matchesArtist && matchesTeamMember && matchesDate;
    });
  }, [contactRecords, searchTerm, filters]);

  const handleAddRecord = () => {
    const artist = artists.find((a) => a.id === newRecord.artistId);
    const member = teamMembers.find((m) => m.id === newRecord.teamMemberId);

    if (newRecord.artistId && newRecord.teamMemberId && newRecord.notes) {
      addContactRecord({
        date: format(new Date(), 'yyyy-MM-dd HH:mm'),
        contactType: newRecord.contactType,
        artistId: newRecord.artistId,
        artistName: artist?.realName || '',
        teamMemberId: newRecord.teamMemberId,
        teamMemberName: member?.name || '',
        notes: newRecord.notes,
        followUpDate: newRecord.followUpDate || undefined,
      });
      setShowAddModal(false);
      setNewRecord({
        contactType: 'call',
        artistId: '',
        teamMemberId: '',
        notes: '',
        followUpDate: '',
      });
    }
  };

  const handleExport = () => {
    console.log('Export contact history');
  };

  const activeFiltersCount =
    (filters.dateRange !== 'all' ? 1 : 0) +
    (filters.contactType !== 'all' ? 1 : 0) +
    (filters.artist !== '' ? 1 : 0) +
    (filters.teamMember !== '' ? 1 : 0);

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">联系记录档案</h1>
              <p className="text-midnight-300">
                共 {contactRecords.length} 条记录 · 当前显示 {filteredRecords.length} 条
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>
                导出记录
              </Button>
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                添加记录
              </Button>
            </div>
          </div>
        </div>

        <Card variant="glass" className="mb-6 animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索记录内容、艺人或联系人..."
                  leftIcon={<Search className="w-4 h-4" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex rounded-xl overflow-hidden border-2 border-midnight-700">
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                      viewMode === 'timeline'
                        ? 'bg-gradient-primary text-white'
                        : 'text-midnight-300 hover:text-white hover:bg-midnight-700/50'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    时间轴
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                      viewMode === 'list'
                        ? 'bg-gradient-primary text-white'
                        : 'text-midnight-300 hover:text-white hover:bg-midnight-700/50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    列表
                  </button>
                </div>
                <Button
                  variant="outline"
                  leftIcon={<Filter className="w-4 h-4" />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  筛选
                  {activeFiltersCount > 0 && (
                    <Badge variant="primary" size="sm" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-midnight-700/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-midnight-200 mb-2">时间范围</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as FilterState['dateRange'] })}
                    className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                  >
                    <option value="all">全部</option>
                    <option value="week">最近一周</option>
                    <option value="month">最近一个月</option>
                    <option value="quarter">最近一季度</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-midnight-200 mb-2">联系类型</label>
                  <select
                    value={filters.contactType}
                    onChange={(e) => setFilters({ ...filters, contactType: e.target.value as ContactType | 'all' })}
                    className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                  >
                    <option value="all">全部</option>
                    <option value="call">电话</option>
                    <option value="email">邮件</option>
                    <option value="meeting">会议</option>
                    <option value="audition">试镜</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-midnight-200 mb-2">艺人</label>
                  <select
                    value={filters.artist}
                    onChange={(e) => setFilters({ ...filters, artist: e.target.value })}
                    className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                  >
                    <option value="">全部艺人</option>
                    {artists.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.realName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-midnight-200 mb-2">团队成员</label>
                  <select
                    value={filters.teamMember}
                    onChange={(e) => setFilters({ ...filters, teamMember: e.target.value })}
                    className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                  >
                    <option value="">全部成员</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                {activeFiltersCount > 0 && (
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<X className="w-4 h-4" />}
                      onClick={() =>
                        setFilters({
                          dateRange: 'all',
                          contactType: 'all',
                          artist: '',
                          teamMember: '',
                        })
                      }
                    >
                      清除筛选
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" />
                联系记录
              </CardTitle>
              <CardDescription>按时间倒序排列</CardDescription>
            </div>
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
              查看全部
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredRecords.length > 0 ? (
              viewMode === 'timeline' ? (
                <div className="space-y-0">
                  {filteredRecords.map((record) => (
                    <ContactRecordItem
                      key={record.id}
                      id={record.id}
                      date={record.date}
                      contactType={record.contactType}
                      artistName={record.artistName}
                      teamMemberName={record.teamMemberName}
                      notes={record.notes}
                      followUpDate={record.followUpDate}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-midnight-700/30">
                        <th className="text-left p-4 text-sm font-medium text-midnight-300">日期</th>
                        <th className="text-left p-4 text-sm font-medium text-midnight-300">类型</th>
                        <th className="text-left p-4 text-sm font-medium text-midnight-300">艺人</th>
                        <th className="text-left p-4 text-sm font-medium text-midnight-300">联系人</th>
                        <th className="text-left p-4 text-sm font-medium text-midnight-300">备注</th>
                        <th className="text-left p-4 text-sm font-medium text-midnight-300">跟进日期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="border-t border-midnight-700/50 hover:bg-midnight-700/20 transition-colors"
                        >
                          <td className="p-4">
                            <span className="text-sm text-midnight-300">{record.date}</span>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                record.contactType === 'call'
                                  ? 'success'
                                  : record.contactType === 'email'
                                  ? 'secondary'
                                  : record.contactType === 'meeting'
                                  ? 'primary'
                                  : 'warning'
                              }
                              size="sm"
                              className="flex items-center gap-1 w-fit"
                            >
                              {record.contactType === 'call' && <Phone className="w-3 h-3" />}
                              {record.contactType === 'email' && <Mail className="w-3 h-3" />}
                              {record.contactType === 'meeting' && <Users className="w-3 h-3" />}
                              {record.contactType === 'audition' && <Calendar className="w-3 h-3" />}
                              {contactTypeLabels[record.contactType]}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-medium text-white">{record.artistName}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-midnight-200">{record.teamMemberName}</span>
                          </td>
                          <td className="p-4 max-w-xs">
                            <span className="text-sm text-midnight-300 line-clamp-2">{record.notes}</span>
                          </td>
                          <td className="p-4">
                            {record.followUpDate ? (
                              <span className="text-sm text-amber-400">{record.followUpDate}</span>
                            ) : (
                              <span className="text-sm text-midnight-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="py-16 text-center">
                <Calendar className="w-12 h-12 text-midnight-600 mx-auto mb-4" />
                <p className="text-midnight-400 mb-2">暂无符合条件的联系记录</p>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(true)}>
                  添加第一条记录
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Modal open={showAddModal} onOpenChange={setShowAddModal}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>添加联系记录</ModalTitle>
              <ModalDescription>记录与艺人的沟通内容和后续安排</ModalDescription>
            </ModalHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">联系类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['call', 'email', 'meeting', 'audition'] as ContactType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewRecord({ ...newRecord, contactType: type })}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        newRecord.contactType === type
                          ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                          : 'border-midnight-700 text-midnight-300 hover:border-midnight-600 hover:text-white'
                      }`}
                    >
                      {type === 'call' && <Phone className="w-5 h-5" />}
                      {type === 'email' && <Mail className="w-5 h-5" />}
                      {type === 'meeting' && <Users className="w-5 h-5" />}
                      {type === 'audition' && <Calendar className="w-5 h-5" />}
                      <span className="text-xs">{contactTypeLabels[type]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">艺人</label>
                <select
                  value={newRecord.artistId}
                  onChange={(e) => setNewRecord({ ...newRecord, artistId: e.target.value })}
                  className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                >
                  <option value="">请选择艺人</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.realName} ({a.stageName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">联系人</label>
                <select
                  value={newRecord.teamMemberId}
                  onChange={(e) => setNewRecord({ ...newRecord, teamMemberId: e.target.value })}
                  className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                >
                  <option value="">请选择团队成员</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {m.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">沟通记录</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="请输入沟通内容..."
                  rows={4}
                  className="w-full rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 py-3 transition-all resize-none focus:outline-none placeholder-midnight-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">跟进日期 (可选)</label>
                <Input
                  type="date"
                  value={newRecord.followUpDate}
                  onChange={(e) => setNewRecord({ ...newRecord, followUpDate: e.target.value })}
                />
              </div>
            </div>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button
                onClick={handleAddRecord}
                disabled={!newRecord.artistId || !newRecord.teamMemberId || !newRecord.notes}
              >
                保存记录
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default ContactRecords;
