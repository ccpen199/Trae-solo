<script setup lang="ts">
import { ref } from 'vue';
import { Users, Search, Plus, Pencil, Trash2 } from 'lucide-vue-next';

interface AdminUser {
  id: string;
  employeeId: string;
  nameMasked: string;
  role: string;
  department: string;
  status: 'ACTIVE' | 'DISABLED';
  lastLoginAt: string;
}

const mockUsers: AdminUser[] = [
  { id: '1', employeeId: 'GX001', nameMasked: '张*明', role: '超级管理员', department: '信息中心', status: 'ACTIVE', lastLoginAt: '2025-01-15 09:30:00' },
  { id: '2', employeeId: 'GX002', nameMasked: '李*华', role: '数据分析师', department: '社保局', status: 'ACTIVE', lastLoginAt: '2025-01-14 14:20:00' },
  { id: '3', employeeId: 'GX003', nameMasked: '王*强', role: '操作员', department: '认证中心', status: 'ACTIVE', lastLoginAt: '2025-01-13 16:45:00' },
  { id: '4', employeeId: 'GX004', nameMasked: '赵*丽', role: '操作员', department: '社保局', status: 'DISABLED', lastLoginAt: '2024-12-20 10:00:00' },
];

const users = ref<AdminUser[]>(mockUsers);
const searchKeyword = ref('');
</script>

<template>
  <div class="space-y-5">
    <div class="bg-white rounded-lg shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Users class="w-5 h-5 text-primary" />
          <h3 class="text-base font-semibold text-gray-800">用户管理</h3>
        </div>
        <button class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <Plus class="w-4 h-4" />
          添加用户
        </button>
      </div>

      <div class="mb-4">
        <div class="relative max-w-xs">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索工号/姓名"
            class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm table-striped">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-gray-500 font-medium">工号</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">姓名</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">角色</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">部门</th>
              <th class="text-center py-3 px-4 text-gray-500 font-medium">状态</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">最后登录</th>
              <th class="text-center py-3 px-4 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="border-b border-gray-100"
            >
              <td class="py-3 px-4 tabular-nums">{{ user.employeeId }}</td>
              <td class="py-3 px-4">{{ user.nameMasked }}</td>
              <td class="py-3 px-4">{{ user.role }}</td>
              <td class="py-3 px-4">{{ user.department }}</td>
              <td class="py-3 px-4 text-center">
                <span
                  class="status-tag"
                  :class="user.status === 'ACTIVE' ? 'status-tag-success' : 'status-tag-danger'"
                >
                  {{ user.status === 'ACTIVE' ? '启用' : '禁用' }}
                </span>
              </td>
              <td class="py-3 px-4 text-gray-500">{{ user.lastLoginAt }}</td>
              <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button class="p-1 text-gray-400 hover:text-primary transition-colors" title="编辑">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button class="p-1 text-gray-400 hover:text-danger transition-colors" title="删除">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
