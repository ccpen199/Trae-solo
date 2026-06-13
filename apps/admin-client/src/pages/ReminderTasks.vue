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
      <h3 class="text-base font-semibold text-gray-800 mb-4">
        筛选结果（共 {{ formatNumber(peopleTotal) }} 人）
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm table-striped">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-gray-500 font-medium">姓名</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">身份证</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">地区</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">逾期天数</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">手机号</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="peopleLoading">
              <td colspan="5" class="py-8 text-center text-gray-400">加载中...</td>
            </tr>
            <tr v-else-if="!people.length">
              <td colspan="5" class="py-8 text-center text-gray-400">暂无数据</td>
            </tr>
            <tr
              v-for="person in people"
              :key="person.id"
              class="border-b border-gray-100"
            >
              <td class="py-3 px-4">{{ person.nameMasked }}</td>
              <td class="py-3 px-4 tabular-nums">{{ person.idCardMasked }}</td>
              <td class="py-3 px-4">{{ person.region }}</td>
              <td class="py-3 px-4 text-right tabular-nums">
                <span :class="person.overdueDays > 30 ? 'text-danger font-medium' : ''">
                  {{ person.overdueDays }}
                </span>
              </td>
              <td class="py-3 px-4 tabular-nums">{{ person.phoneMasked }}</td>
            </tr>
          </tbody>
        </table>
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
            </tr>
          </thead>
          <tbody>
            <tr v-if="tasksLoading">
              <td colspan="7" class="py-8 text-center text-gray-400">加载中...</td>
            </tr>
            <tr v-else-if="!tasks.length">
              <td colspan="7" class="py-8 text-center text-gray-400">暂无任务</td>
            </tr>
            <tr
              v-for="task in tasks"
              :key="task.id"
              class="border-b border-gray-100"
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
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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
