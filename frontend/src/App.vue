<template>
  <div id="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">课</div>
        <div>
          <strong>教培课务系统</strong>
          <small>Training Center</small>
        </div>
      </div>
      <nav>
        <a v-for="tab in tabs" :key="tab.id" :class="{ active: activeTab === tab.id }" @click.prevent="activeTab = tab.id">
          {{ tab.label }}
        </a>
      </nav>
      <div class="api-box">
        <span>API 地址</span>
        <code>{{ apiBase }}</code>
      </div>
    </aside>
    <main class="workspace">
      <div class="topbar">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p v-if="!loading && !error">{{ pageSubtitle }}</p>
        </div>
        <div v-if="message" class="message success">{{ message }}</div>
        <div v-if="error" class="message error">{{ error }}</div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <DashboardView v-else-if="activeTab === 'dashboard'" :data="data.dashboard" :currency="currency" />
      <StudentsView v-else-if="activeTab === 'students'" :data="data.students" :currency="currency" :newStudent="newStudent" :classes="allClasses" :packages="allPackages" @add-student="handleAddStudent" @upload-contract="handleUploadContract" />
      <SchedulesView v-else-if="activeTab === 'schedules'" :data="data.schedules" :classes="allClasses" :teachers="allTeachers" :classrooms="allClassrooms" :studentClasses="allStudentClasses" @add-schedule="handleAddSchedule" />
      <AttendanceView v-else-if="activeTab === 'attendance'" :data="data.attendance" :schedules="data.schedules" :students="data.students" :purchases="data.finance.purchases" :currency="currency" :onCheckin="handleCheckin" />
      <FinanceView v-else-if="activeTab === 'finance'" :data="data.finance" :students="data.students" :packages="allPackages" @add-purchase="handleAddPurchase" @approve-refund="handleApproveRefund" @approve-transfer="handleApproveTransfer" @submit-refund="handleSubmitRefund" @submit-transfer="handleSubmitTransfer" :currency="currency" />
      <ReportsView v-else-if="activeTab === 'reports'" :data="data.reports" :currency="currency" :loadData="loadReportsData" />
      <SettingsView v-else-if="activeTab === 'settings'" :packages="allPackages" :teachers="allTeachers" :classrooms="allClassrooms" :classes="data.classes" @add-package="handleAddPackage" @add-teacher="handleAddTeacher" @add-classroom="handleAddClassroom" @add-class="handleAddClass" :currency="currency" />
    </main>
  </div>
</template>

<script setup>import { ref, reactive, computed, onMounted, watch } from 'vue';
import DashboardView from './views/DashboardView.vue';
import StudentsView from './views/StudentsView.vue';
import SchedulesView from './views/SchedulesView.vue';
import AttendanceView from './views/AttendanceView.vue';
import FinanceView from './views/FinanceView.vue';
import ReportsView from './views/ReportsView.vue';
import SettingsView from './views/SettingsView.vue';

const apiBase = '/api';
const tabs = [
  { id: 'dashboard', label: '运营看板' },
  { id: 'students', label: '学员管理' },
  { id: 'schedules', label: '排课管理' },
  { id: 'attendance', label: '考勤签到' },
  { id: 'finance', label: '财务管理' },
  { id: 'reports', label: '经营报表' },
  { id: 'settings', label: '基础设置' }
];

const activeTab = ref('dashboard');
const loading = ref(true);
const error = ref('');
const message = ref('');

const data = reactive({
  dashboard: { stats: {}, upcoming: [], lowBalance: [] },
  students: [],
  schedules: [],
  attendace: [],
  classes: [],
  finance: { purchases: [], refunds: [], transfers: [], summary: {} },
  reports: {}
});

const allPackages = ref([]);
const allTeachers = ref([]);
const allClassrooms = ref([]);
const allClasses = ref([]);
const allStudentClasses = ref([]);

const newStudent = reactive({
  name: '',
  gender: '女',
  birthday: '',
  phone: '',
  parent_name: '',
  parent_phone: '',
  consultant: '',
  learning_goal: ''
});

const pageTitle = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value);
  return tab ? tab.label : '运营看板';
});

const pageSubtitle = computed(() => {
  const subtitles = {
    dashboard: '实时掌握校区运营全貌',
    students: '管理学员档案与课包余额',
    schedules: '按班级、教师、教室安排课程',
    attendance: '记录出勤状态与课消计算',
    finance: '购课、退费、转课全流程管理',
    reports: '多维度经营数据分析',
    settings: '课包、教师、教室、班级基础配置'
  };
  return subtitles[activeTab.value] || '';
});

const currency = (val) => {
  if (!val && val !== 0) return '¥0';
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(val);
};

async function apiCall(path, options = {}) {
  try {
    const res = await fetch(`${apiBase}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  } catch (e) {
    throw e;
  }
}

async function loadAll() {
  loading.value = true;
  error.value = '';
  try {
    const [dashboard, students, schedules, attendance, finance, reports, packages, teachers, classrooms, classes, studentClasses] = await Promise.all([
      apiCall('/dashboard'),
      apiCall('/students'),
      apiCall('/schedules'),
      apiCall('/attendance'),
      apiCall('/finance'),
      apiCall('/reports'),
      apiCall('/course-packages'),
      apiCall('/teachers'),
      apiCall('/classrooms'),
      apiCall('/classes'),
      apiCall('/student-classes')
    ]);
    Object.assign(data, { dashboard, students, schedules, attendance, finance, reports });
    allPackages.value = packages;
    allTeachers.value = teachers;
    allClassrooms.value = classrooms;
    allClasses.value = classes;
    allStudentClasses.value = studentClasses;
  } catch (e) {
    error.value = e.message || '加载失败';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function showMessage(msg) {
  message.value = msg;
  setTimeout(() => message.value = '', 3000);
}

async function handleAddStudent() {
  if (!newStudent.name || newStudent.name.trim() === '') {
    error.value = '学员姓名不能为空';
    return;
  }
  if (!newStudent.parent_phone || !/^1\d{10}$/.test(newStudent.parent_phone)) {
    error.value = '家长电话格式不正确';
    return;
  }
  if (newStudent.learning_goal && newStudent.learning_goal.length > 500) {
    error.value = '学习目标不能超过500字';
    return;
  }
  try {
    await apiCall('/students', {
      method: 'POST',
      body: JSON.stringify(newStudent)
    });
    Object.assign(newStudent, {
      name: '', gender: '女', birthday: '', phone: '', parent_name: '', parent_phone: '', consultant: '', learning_goal: ''
    });
    error.value = '';
    showMessage('学员已新增');
    await loadAll();
  } catch (e) {
    error.value = e.message || '新增失败';
  }
}

async function handleAddSchedule(schedule) {
  try {
    await apiCall('/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule)
    });
    showMessage('课程已安排');
    await loadAll();
  } catch (e) {
    error.value = e.message || '排课失败';
    throw e;
  }
}

async function handleCheckin({ id, status, checkin_time, remark }) {
  try {
    const result = await apiCall(`/attendance/${id}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ status, checkin_time, remark })
    });
    showMessage(result.message || '签到成功');
    await loadAll();
    return result;
  } catch (e) {
    error.value = e.message || '签到失败';
    throw e;
  }
}

async function handleAddPurchase(purchase) {
  try {
    await apiCall('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchase)
    });
    showMessage('购课已录入');
    await loadAll();
  } catch (e) {
    error.value = e.message || '购课录入失败';
    throw e;
  }
}

async function handleSubmitRefund(refund) {
  try {
    await apiCall('/refunds', {
      method: 'POST',
      body: JSON.stringify(refund)
    });
    showMessage('退费申请已提交');
    await loadAll();
  } catch (e) {
    error.value = e.message || '退费申请失败';
    throw e;
  }
}

async function handleApproveRefund({ id, approved_by, status }) {
  try {
    await apiCall(`/refunds/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approved_by, status })
    });
    showMessage('退费已审批');
    await loadAll();
  } catch (e) {
    error.value = e.message || '审批失败';
    throw e;
  }
}

async function handleSubmitTransfer(transfer) {
  try {
    await apiCall('/transfers', {
      method: 'POST',
      body: JSON.stringify(transfer)
    });
    showMessage('转课申请已提交');
    await loadAll();
  } catch (e) {
    error.value = e.message || '转课申请失败';
    throw e;
  }
}

async function handleApproveTransfer({ id, approved_by, status }) {
  try {
    await apiCall(`/transfers/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approved_by, status })
    });
    showMessage('转课已审批');
    await loadAll();
  } catch (e) {
    error.value = e.message || '审批失败';
    throw e;
  }
}

async function handleAddPackage(pkg) {
  try {
    await apiCall('/course-packages', {
      method: 'POST',
      body: JSON.stringify(pkg)
    });
    showMessage('课包已新增');
    await loadAll();
  } catch (e) {
    error.value = e.message || '新增失败';
    throw e;
  }
}

async function handleAddTeacher(teacher) {
  try {
    await apiCall('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacher)
    });
    showMessage('教师已新增');
    await loadAll();
  } catch (e) {
    error.value = e.message || '新增失败';
    throw e;
  }
}

async function handleAddClassroom(classroom) {
  try {
    await apiCall('/classrooms', {
      method: 'POST',
      body: JSON.stringify(classroom)
    });
    showMessage('教室已新增');
    await loadAll();
  } catch (e) {
    error.value = e.message || '新增失败';
    throw e;
  }
}

async function handleAddClass(cls) {
  try {
    await apiCall('/classes', {
      method: 'POST',
      body: JSON.stringify(cls)
    });
    showMessage('班级已新增');
    await loadAll();
  } catch (e) {
    error.value = e.message || '新增失败';
    throw e;
  }
}

async function handleUploadContract(file) {
  try {
    const formData = new FormData();
    formData.append('contract', file);
    const result = await apiCall('/upload/contract', {
      method: 'POST',
      body: formData,
      headers: {}
    });
    showMessage('合同上传成功');
    return result;
  } catch (e) {
    error.value = e.message || '上传失败';
    throw e;
  }
}

async function loadReportsData({ startDate, endDate } = {}) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const reports = await apiCall(`/reports${queryString}`);
    data.reports = reports;
    showMessage('报表数据已更新');
  } catch (e) {
    error.value = e.message || '加载报表失败';
    console.error(e);
  }
}

watch(activeTab, () => {
  error.value = '';
  message.value = '';
  if (activeTab.value === 'reports') {
    loadReportsData();
  }
});

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.message {
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
}
.message.success {
  background: #e6f7f0;
  color: #0f7f5a;
}
.message.error {
  background: #fde8e8;
  color: #c53030;
}
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #687789;
  font-size: 16px;
}
</style>
