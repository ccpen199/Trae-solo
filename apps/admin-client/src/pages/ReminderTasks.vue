<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Users,
  Send,
  CheckCircle2,
  Filter,
  Plus,
  X,
} from 'lucide-vue-next';
import { adminApi } from '@/api/admin';
import { formatNumber } from '@shared/utils';
import {
  InsuranceTypeMap,
  TaskStatusMap,
} from '@shared/types/admin';
import type {
  UncertifiedPersonFilter,
  UncertifiedPerson,
  ReminderTask,
  TaskStatus,
  CreateReminderTaskRequest,
  InsuranceType,
} from '@shared/types/admin';

const regions = ['南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左'];
const insuranceTypes: InsuranceType[] = ['PENSION', 'UNEMPLOYMENT', 'INJURY', 'MATERNITY'];

const filter = ref<UncertifiedPersonFilter>({
  region: [],
  ageRange: [50, 90],
  insuranceType: [],
  overdueDays: [7, 365],
});

const people = ref<UncertifiedPerson[]>([]);
const peopleTotal = ref(0);
const peoplePage = ref(1);
const peopleLoading = ref(false);

const tasks = ref<ReminderTask[]>([]);
const tasksTotal = ref(0);
const tasksPage = ref(1);
const tasksLoading = ref(false);

const showCreateDialog = ref(false);
const newTaskName = ref('');
const newTaskTemplateId = ref('default');
const newTaskScheduledAt = ref('');
const creating = ref(false);

const statPending = computed(() => peopleTotal.value);
const statRunning = computed(() => tasks.value.filter((t) => t.status === 'RUNNING').length);
const statMonthlySent = computed(() => {
  return tasks.value
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.deliveredCount, 0);
});

function toggleRegion(region: string) {
  const idx = filter.value.region?.indexOf(region) ?? -1;
  if (idx >= 0) {
    filter.value.region?.splice(idx, 1);
  } else {
    filter.value.region = [...(filter.value.region ?? []), region];
  }
}

function toggleInsuranceType(type: InsuranceType) {
  const arr = filter.value.insuranceType ?? [];
  const idx = arr.indexOf(type);
  if (idx >= 0) {
    arr.splice(idx, 1);
  } else {
    arr.push(type);
  }
  filter.value.insuranceType = [...arr];
}

async function searchPeople() {
  peopleLoading.value = true;
  try {
    const res = await adminApi.getUncertifiedPeople(filter.value, peoplePage.value, 10);
    people.value = res.list;
    peopleTotal.value = res.total;
  } catch {
    // silent
  } finally {
    peopleLoading.value = false;
  }
}

async function fetchTasks() {
  tasksLoading.value = true;
  try {
    const res = await adminApi.getReminderTasks(tasksPage.value, 10);
    tasks.value = res.list;
    tasksTotal.value = res.total;
  } catch {
    // silent
  } finally {
    tasksLoading.value = false;
  }
}

async function handleCreateTask() {
  if (!newTaskName.value.trim()) return;
  creating.value = true;
  try {
    const data: CreateReminderTaskRequest = {
      name: newTaskName.value,
      filter: filter.value,
      templateId: newTaskTemplateId.value,
    };
    if (newTaskScheduledAt.value) {
      data.scheduledAt = newTaskScheduledAt.value;
    }
    await adminApi.createReminderTask(data);
    showCreateDialog.value = false;
    newTaskName.value = '';
    newTaskScheduledAt.value = '';
    await fetchTasks();
  } catch {
    // silent
  } finally {
    creating.value = false;
  }
}

function getStatusClass(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    DRAFT: 'status-tag-warning',
    RUNNING: 'status-tag-info',
    COMPLETED: 'status-tag-success',
    CANCELLED: 'status-tag-danger',
  };
  return map[status];
}

const selectedPersonIds = ref<string[]>([]);
const selectedTask = ref<ReminderTask | null>(null);
const showTaskDetail = ref(false);
const sendingTaskId = ref<string | null>(null);

function togglePerson(id: string) {
  const i = selectedPersonIds.value.indexOf(id);
  if (i >= 0) selectedPersonIds.value.splice(i, 1);
  else selectedPersonIds.value.push(id);
}

function toggleAllPerson() {
  if (selectedPersonIds.value.length === people.value.length) {
    selectedPersonIds.value = [];
  } else {
    selectedPersonIds.value = people.value.map((p) => p.id);
  }
}

async function sendSingleReminder(id: string) {
  sendingTaskId.value = id;
  await new Promise((r) => setTimeout(r, 700));
  const p = people.value.find((x) => x.id === id);
  if (p) {
    people.value = people.value.filter((x) => x.id !== id);
    peopleTotal.value = Math.max(0, peopleTotal.value - 1);
  }
  sendingTaskId.value = null;
}

async function sendBatchReminder() {
  if (!selectedPersonIds.value.length) return;
  sendingTaskId.value = 'batch';
  await new Promise((r) => setTimeout(r, 1200));
  const ids = new Set(selectedPersonIds.value);
  people.value = people.value.filter((x) => !ids.has(x.id));
  peopleTotal.value = Math.max(0, peopleTotal.value - selectedPersonIds.value.length);
  selectedPersonIds.value = [];
  sendingTaskId.value = null;
}

function openTaskDetail(task: ReminderTask) {
  selectedTask.value = task;
  showTaskDetail.value = true;
}

const deliverRate = computed(() => {
  if (!selectedTask.value) return 0;
  return selectedTask.value.targetCount
    ? selectedTask.value.deliveredCount / selectedTask.value.targetCount
    : 0;
});
const readRate = computed(() => {
  if (!selectedTask.value || !selectedTask.value.deliveredCount) return 0;
  return selectedTask.value.readCount / selectedTask.value.deliveredCount;
});
const convertRate = computed(() => {
  if (!selectedTask.value || !selectedTask.value.readCount) return 0;
  return selectedTask.value.convertedCount / selectedTask.value.readCount;
});

onMounted(() => {
  searchPeople();
  fetchTasks();
});
</script>

<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div class="data-card data-card-primary p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">待提醒人数</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums">{{ formatNumber(statPending) }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users class="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
      <div class="data-card data-card-accent p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">进行中任务</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums">{{ statRunning }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Send class="w-5 h-5 text-accent" />
          </div>
        </div>
      </div>
      <div class="data-card data-card-success p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">本月已发送</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums">{{ formatNumber(statMonthlySent) }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 class="w-5 h-5 text-success" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-5">
      <div class="flex items-center gap-2 mb-4">
        <Filter class="w-4 h-4 text-gray-500" />
        <h3 class="text-base font-semibold text-gray-800">人员筛选</h3>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-600 mb-2">地区</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="region in regions"
              :key="region"
              class="px-3 py-1.5 rounded text-xs border transition-colors"
              :class="filter.region?.includes(region)
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'"
              @click="toggleRegion(region)"
            >
              {{ region }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-2">
              年龄范围：{{ filter.ageRange?.[0] }} - {{ filter.ageRange?.[1] }} 岁
            </label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="filter.ageRange![0]"
                type="range"
                :min="18"
                :max="90"
                class="flex-1 accent-primary"
              />
              <input
                v-model.number="filter.ageRange![1]"
                type="range"
                :min="18"
                :max="90"
                class="flex-1 accent-primary"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-2">逾期天数范围</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="filter.overdueDays![0]"
                type="number"
                class="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-center"
              />
              <span class="text-gray-400">-</span>
              <input
                v-model.number="filter.overdueDays![1]"
                type="number"
                class="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-center"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-2">险种</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="type in insuranceTypes"
              :key="type"
              class="px-3 py-1.5 rounded text-xs border transition-colors"
              :class="filter.insuranceType?.includes(type)
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'"
              @click="toggleInsuranceType(type)"
            >
              {{ InsuranceTypeMap[type] }}
            </button>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button
            class="px-5 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            @click="searchPeople"
          >
            查询
          </button>
          <button
            class="px-5 py-2 bg-accent text-white rounded-lg text-sm hover:bg-blue-500 transition-colors flex items-center gap-1.5"
            @click="showCreateDialog = true"
          >
            <Plus class="w-4 h-4" />
            创建提醒任务
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-800">
          筛选结果（共 {{ formatNumber(peopleTotal) }} 人）
        </h3>
        <div class="flex items-center gap-2">
          <span v-if="selectedPersonIds.length" class="text-xs text-primary font-medium">
            已选 {{ selectedPersonIds.length }} 人
          </span>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-blue-500 transition-colors disabled:opacity-40 flex items-center gap-1"
            :disabled="!selectedPersonIds.length || sendingTaskId !== null"
            @click="sendBatchReminder"
          >
            <Send class="w-3 h-3" />
            {{ sendingTaskId === 'batch' ? '发送中...' : '批量发送提醒' }}
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm table-striped">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="py-3 px-3 text-left w-10">
                <input
                  type="checkbox"
                  :checked="people.length > 0 && selectedPersonIds.length === people.length"
                  :indeterminate="selectedPersonIds.length > 0 && selectedPersonIds.length < people.length"
                  @change="toggleAllPerson"
                  class="accent-primary"
                />
              </th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">姓名</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">身份证</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">地区</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">逾期天数</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">手机号</th>
              <th class="py-3 px-4 text-center w-28 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="peopleLoading">
              <td colspan="7" class="py-8 text-center text-gray-400">加载中...</td>
            </tr>
            <tr v-else-if="!people.length">
              <td colspan="7" class="py-8 text-center text-gray-400">暂无数据</td>
            </tr>
            <tr
              v-for="person in people"
              :key="person.id"
              class="border-b border-gray-100"
            >
              <td class="py-3 px-3">
                <input
                  type="checkbox"
                  :checked="selectedPersonIds.includes(person.id)"
                  @change="togglePerson(person.id)"
                  class="accent-primary"
                />
              </td>
              <td class="py-3 px-4">{{ person.nameMasked }}</td>
              <td class="py-3 px-4 tabular-nums">{{ person.idCardMasked }}</td>
              <td class="py-3 px-4">{{ person.region }}</td>
              <td class="py-3 px-4 text-right tabular-nums">
                <span :class="person.overdueDays > 30 ? 'text-danger font-medium' : ''">
                  {{ person.overdueDays }}
                </span>
              </td>
              <td class="py-3 px-4 tabular-nums">{{ person.phoneMasked }}</td>
              <td class="py-3 px-4 text-center">
                <button
                  class="text-xs px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
                  :disabled="sendingTaskId === person.id"
                  @click="sendSingleReminder(person.id)"
                >
                  {{ sendingTaskId === person.id ? '发送中' : '发送提醒' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-3 text-[11px] text-gray-400 flex items-center gap-4">
        <span>💡 勾选人员后可批量发送短信提醒；单人发送即从待提醒列表移除</span>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-5">
      <h3 class="text-base font-semibold text-gray-800 mb-4">任务列表</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm table-striped">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-gray-500 font-medium">任务名称</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">状态</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">进度</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">已送达</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">已读</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">转化</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">创建时间</th>
              <th class="py-3 px-4 w-20 text-center text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="tasksLoading">
              <td colspan="8" class="py-8 text-center text-gray-400">加载中...</td>
            </tr>
            <tr v-else-if="!tasks.length">
              <td colspan="8" class="py-8 text-center text-gray-400">暂无任务</td>
            </tr>
            <tr
              v-for="task in tasks"
              :key="task.id"
              class="border-b border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer"
              @click="openTaskDetail(task)"
            >
              <td class="py-3 px-4 font-medium text-gray-800">{{ task.name }}</td>
              <td class="py-3 px-4">
                <span class="status-tag" :class="getStatusClass(task.status)">
                  {{ TaskStatusMap[task.status] }}
                </span>
              </td>
              <td class="py-3 px-4" style="min-width: 120px">
                <div class="flex items-center gap-2">
                  <div class="progress-bar flex-1">
                    <div class="progress-bar-fill" :style="{ width: task.progress + '%' }"></div>
                  </div>
                  <span class="text-xs text-gray-500 tabular-nums w-10 text-right">{{ task.progress }}%</span>
                </div>
              </td>
              <td class="py-3 px-4 text-right tabular-nums">{{ formatNumber(task.deliveredCount) }}</td>
              <td class="py-3 px-4 text-right tabular-nums">{{ formatNumber(task.readCount) }}</td>
              <td class="py-3 px-4 text-right tabular-nums">{{ formatNumber(task.convertedCount) }}</td>
              <td class="py-3 px-4 text-gray-500">{{ task.createdAt }}</td>
              <td class="py-3 px-4 text-center" @click.stop>
                <button
                  class="text-xs text-primary hover:underline"
                  @click="openTaskDetail(task)"
                >
                  详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-[11px] text-gray-400 mt-3">💡 点击任意任务行可查看完整转化漏斗明细与闭环状态</p>
    </div>

    <Teleport to="body">
      <div
        v-if="showTaskDetail && selectedTask"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showTaskDetail = false"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">{{ selectedTask.name }}</h3>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ selectedTask.createdAt }} 创建
                <span class="status-tag ml-2" :class="getStatusClass(selectedTask.status)">
                  {{ TaskStatusMap[selectedTask.status] }}
                </span>
              </p>
            </div>
            <button
              class="text-gray-400 hover:text-gray-600"
              @click="showTaskDetail = false"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="grid grid-cols-4 gap-3 mb-6">
            <div class="p-3 rounded-xl bg-gray-50 text-center">
              <p class="text-xs text-gray-400 mb-1">目标人群</p>
              <p class="text-xl font-bold text-gray-800 tabular-nums">{{ formatNumber(selectedTask.targetCount) }}</p>
            </div>
            <div class="p-3 rounded-xl bg-blue-50 text-center">
              <p class="text-xs text-gray-400 mb-1">已送达</p>
              <p class="text-xl font-bold text-primary tabular-nums">{{ formatNumber(selectedTask.deliveredCount) }}</p>
            </div>
            <div class="p-3 rounded-xl bg-amber-50 text-center">
              <p class="text-xs text-gray-400 mb-1">已读</p>
              <p class="text-xl font-bold text-amber-600 tabular-nums">{{ formatNumber(selectedTask.readCount) }}</p>
            </div>
            <div class="p-3 rounded-xl bg-green-50 text-center">
              <p class="text-xs text-gray-400 mb-1">完成认证</p>
              <p class="text-xl font-bold text-success tabular-nums">{{ formatNumber(selectedTask.convertedCount) }}</p>
            </div>
          </div>

          <div class="mb-6">
            <h4 class="text-sm font-semibold text-gray-700 mb-3">📊 转化漏斗</h4>
            <div class="space-y-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-gray-500">送达率（目标 → 送达）</span>
                  <span class="text-xs font-medium text-primary tabular-nums">
                    {{ (deliverRate * 100).toFixed(1) }}%
                  </span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all" :style="{ width: (deliverRate * 100) + '%' }" />
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-gray-500">阅读率（送达 → 已读）</span>
                  <span class="text-xs font-medium text-amber-600 tabular-nums">
                    {{ (readRate * 100).toFixed(1) }}%
                  </span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 rounded-full transition-all" :style="{ width: (readRate * 100) + '%' }" />
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-gray-500">转化率（已读 → 完成认证）</span>
                  <span class="text-xs font-medium text-success tabular-nums">
                    {{ (convertRate * 100).toFixed(1) }}%
                  </span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-success rounded-full transition-all" :style="{ width: (convertRate * 100) + '%' }" />
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-blue-50 border border-blue-100 mb-5">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">🔗 任务处理闭环</h4>
            <div class="flex items-center gap-2 text-xs overflow-x-auto pb-1">
              <span class="px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle2 class="w-3 h-3" /> 创建筛选
              </span>
              <span class="text-gray-300">→</span>
              <span class="px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle2 class="w-3 h-3" /> 发送短信
              </span>
              <span class="text-gray-300">→</span>
              <span class="px-2 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                <Bell class="w-3 h-3" /> 用户点击阅读
              </span>
              <span class="text-gray-300">→</span>
              <span class="px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                <Users class="w-3 h-3" /> 进入认证页
              </span>
              <span class="text-gray-300">→</span>
              <span class="px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle2 class="w-3 h-3" /> 完成认证
              </span>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <button
              class="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              @click="showTaskDetail = false"
            >
              关闭
            </button>
            <button
              class="px-5 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              导出任务报告
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showCreateDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showCreateDialog = false"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-semibold text-gray-800">创建提醒任务</h3>
            <button
              class="text-gray-400 hover:text-gray-600"
              @click="showCreateDialog = false"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-700 mb-1.5">任务名称</label>
              <input
                v-model="newTaskName"
                type="text"
                placeholder="请输入任务名称"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1.5">短信模板</label>
              <select
                v-model="newTaskTemplateId"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="default">默认认证提醒模板</option>
                <option value="urgent">紧急认证提醒模板</option>
                <option value="gentle">温和认证提醒模板</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1.5">发送时间（留空立即发送）</label>
              <input
                v-model="newTaskScheduledAt"
                type="datetime-local"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              class="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              @click="showCreateDialog = false"
            >
              取消
            </button>
            <button
              class="flex-1 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              :disabled="creating || !newTaskName.trim()"
              @click="handleCreateTask"
            >
              {{ creating ? '创建中...' : '创建任务' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
