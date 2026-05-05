<template>
  <div class="container">
    <div class="page-header flex-between">
      <h1 class="page-title">用户管理</h1>
      <button class="btn btn-primary" @click="showCreateModal = true">
        + 新增用户
      </button>
    </div>

    <div class="card">
      <div class="flex gap-16 mb-24" style="flex-wrap: wrap;">
        <div class="form-group" style="margin-bottom: 0; min-width: 200px;">
          <input
            v-model="searchForm.keyword"
            type="text"
            class="form-input"
            placeholder="搜索账号、昵称、邮箱..."
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-group" style="margin-bottom: 0; min-width: 150px;">
          <select v-model="searchForm.status" class="form-input">
            <option value="">全部状态</option>
            <option value="ACTIVE">正常</option>
            <option value="INACTIVE">未激活</option>
            <option value="SUSPENDED">已禁用</option>
          </select>
        </div>
        <div class="flex gap-8">
          <button class="btn btn-primary" @click="handleSearch">搜索</button>
          <button class="btn btn-default" @click="handleReset">重置</button>
        </div>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>账号</th>
              <th>昵称</th>
              <th>邮箱</th>
              <th>手机号</th>
              <th>角色</th>
              <th>状态</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.account }}</td>
              <td>{{ user.nickname || '-' }}</td>
              <td>{{ user.email || '-' }}</td>
              <td>{{ user.phone || '-' }}</td>
              <td>
                <span class="badge" :class="user.role.code === 'ADMIN' ? 'badge-success' : 'badge-warning'">
                  {{ user.role.name }}
                </span>
              </td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(user.status)">
                  {{ getStatusText(user.status) }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="flex gap-8">
                  <button class="btn btn-default" style="padding: 4px 8px; font-size: 12px;" @click="handleEdit(user)">编辑</button>
                  <button class="btn btn-default" style="padding: 4px 8px; font-size: 12px;" @click="handleToggleStatus(user)">
                    {{ user.status === 'ACTIVE' ? '禁用' : '启用' }}
                  </button>
                  <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" @click="handleDelete(user)">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="8" class="text-center" style="color: var(--text-secondary);">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="total > 0">
        <button class="pagination-btn" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <span style="color: var(--text-secondary);">第 {{ page }} 页 / 共 {{ totalPages }} 页（{{ total }} 条）</span>
        <button class="pagination-btn" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
      </div>
    </div>

    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header flex-between">
          <h3>{{ showCreateModal ? '新增用户' : '编辑用户' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          
          <form @submit.prevent="handleSubmit">
            <div class="form-group" v-if="showCreateModal">
              <label class="form-label">账号 <span style="color: var(--error-color)">*</span></label>
              <input v-model="form.account" type="text" class="form-input" placeholder="3-20个字符，支持字母、数字、下划线" required />
            </div>

            <div class="form-group">
              <label class="form-label">昵称 <span style="color: var(--error-color)">*</span></label>
              <input v-model="form.nickname" type="text" class="form-input" placeholder="请输入昵称" required />
            </div>

            <div class="form-group" v-if="showCreateModal">
              <label class="form-label">密码 <span style="color: var(--error-color)">*</span></label>
              <input v-model="form.password" type="password" class="form-input" placeholder="至少8位，包含大写字母、小写字母和数字" required />
            </div>

            <div class="form-group" v-if="showEditModal">
              <label class="form-label">新密码（留空则不修改）</label>
              <input v-model="form.password" type="password" class="form-input" placeholder="至少8位，包含大写字母、小写字母和数字" />
            </div>

            <div class="form-group">
              <label class="form-label">邮箱</label>
              <input v-model="form.email" type="email" class="form-input" placeholder="请输入邮箱" />
            </div>

            <div class="form-group">
              <label class="form-label">手机号</label>
              <input v-model="form.phone" type="tel" class="form-input" placeholder="请输入手机号" />
            </div>

            <div class="form-group">
              <label class="form-label">角色 <span style="color: var(--error-color)">*</span></label>
              <select v-model="form.roleId" class="form-input" required>
                <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
              </select>
            </div>

            <div class="form-group" v-if="showEditModal">
              <label class="form-label">状态</label>
              <select v-model="form.status" class="form-input">
                <option value="ACTIVE">正常</option>
                <option value="INACTIVE">未激活</option>
                <option value="SUSPENDED">已禁用</option>
              </select>
            </div>

            <div class="form-group flex gap-16" style="justify-content: flex-end; margin-bottom: 0;">
              <button type="button" class="btn btn-default" @click="closeModal">取消</button>
              <button type="submit" class="btn btn-primary" :disabled="formLoading">
                {{ formLoading ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { get, post, put, del } from '@/utils/request';
import type { User, Role, PageResponse, CreateUserRequest, UpdateUserRequest } from '@/types';
import { UserStatus, UserStatusText } from '@/types';

type UserStatusType = UserStatus;

const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const error = ref('');

const searchForm = reactive({
  keyword: '',
  status: '',
});

const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingUser = ref<User | null>(null);
const formError = ref('');
const formLoading = ref(false);

const form = reactive({
  account: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  roleId: '',
  status: UserStatus.ACTIVE,
});

const totalPages = computed(() => Math.ceil(total.value / pageSize) || 1);

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function getStatusText(status: UserStatusType): string {
  return UserStatusText[status] || status;
}

function getStatusBadgeClass(status: UserStatusType): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return 'badge-success';
    case UserStatus.INACTIVE:
      return 'badge-warning';
    case UserStatus.SUSPENDED:
      return 'badge-error';
    default:
      return '';
  }
}

async function loadRoles() {
  const response = await get<Role[]>('/admin/roles');
  if (response.success && response.data) {
    roles.value = response.data;
    if (response.data.length > 0 && !form.roleId) {
      const userRole = response.data.find(r => r.code === 'USER');
      form.roleId = userRole?.id || response.data[0].id;
    }
  }
}

async function loadUsers() {
  error.value = '';
  const params: Record<string, unknown> = {
    page: page.value,
    pageSize,
  };

  if (searchForm.keyword) {
    params.keyword = searchForm.keyword;
  }

  if (searchForm.status) {
    params.status = searchForm.status;
  }

  const response = await get<PageResponse<User>>('/admin/users', params);
  
  if (response.success && response.data) {
    users.value = response.data.list;
    total.value = response.data.total;
  } else {
    error.value = response.message;
  }
}

function handleSearch() {
  page.value = 1;
  loadUsers();
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.status = '';
  page.value = 1;
  loadUsers();
}

function changePage(newPage: number) {
  page.value = newPage;
  loadUsers();
}

function handleEdit(user: User) {
  editingUser.value = user;
  form.account = user.account;
  form.password = '';
  form.nickname = user.nickname || '';
  form.email = user.email || '';
  form.phone = user.phone || '';
  form.roleId = user.role.id;
  form.status = user.status;
  showEditModal.value = true;
  formError.value = '';
}

function closeModal() {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingUser.value = null;
  formError.value = '';
  form.account = '';
  form.password = '';
  form.nickname = '';
  form.email = '';
  form.phone = '';
  form.status = UserStatus.ACTIVE;
  if (roles.value.length > 0) {
    const userRole = roles.value.find(r => r.code === 'USER');
    form.roleId = userRole?.id || roles.value[0].id;
  }
}

async function handleSubmit() {
  formError.value = '';
  formLoading.value = true;

  try {
    const submitData: CreateUserRequest | UpdateUserRequest = {
      ...form,
    };

    if (!submitData.email) (submitData as { email?: null }).email = null;
    if (!submitData.phone) (submitData as { phone?: null }).phone = null;
    if (showEditModal.value && !form.password) {
      delete (submitData as UpdateUserRequest).password;
    }

    let response;
    if (showCreateModal.value) {
      response = await post<User>('/admin/users', submitData);
    } else {
      response = await put<User>(`/admin/users/${editingUser.value?.id}`, submitData);
    }
    
    if (response.success) {
      closeModal();
      loadUsers();
    } else {
      formError.value = response.message;
    }
  } finally {
    formLoading.value = false;
  }
}

async function handleToggleStatus(user: User) {
  const newStatus: UserStatusType = user.status === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
  const confirmMsg = user.status === UserStatus.ACTIVE
    ? `确定要禁用用户 ${user.account} 吗？`
    : `确定要启用用户 ${user.account} 吗？`;

  if (!confirm(confirmMsg)) {
    return;
  }

  const response = await put(`/admin/users/${user.id}/status`, { status: newStatus });
  if (response.success) {
    loadUsers();
  } else {
    alert(response.message);
  }
}

async function handleDelete(user: User) {
  if (!confirm(`确定要删除用户 ${user.account} 吗？此操作不可恢复。`)) {
    return;
  }

  const response = await del(`/admin/users/${user.id}`);
  if (response.success) {
    loadUsers();
  } else {
    alert(response.message);
  }
}

onMounted(() => {
  loadRoles();
  loadUsers();
});
</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--white);
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  font-size: 24px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}
</style>
