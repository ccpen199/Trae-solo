<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">作业指导书管理</span>
      <el-button type="primary" @click="$router.push('/sops/create')">
        <el-icon><Plus /></el-icon>新建指导书
      </el-button>
    </div>
    
    <el-card>
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="产品">
          <el-select v-model="filters.product_id" clearable placeholder="选择产品" style="width: 150px;">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="工序">
          <el-select v-model="filters.process_id" clearable placeholder="选择工序" style="width: 150px;">
            <el-option v-for="p in processes" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="选择状态" style="width: 120px;">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending_review" />
            <el-option label="已发布" value="approved" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadSOPs">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="sops" border>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="product_name" label="产品" width="120" />
        <el-table-column prop="process_name" label="工序" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click="$router.push('/sops/' + row.id)">查看</el-button>
            <el-button link size="small" v-if="row.status === 'draft'" @click="$router.push('/sops/' + row.id + '/edit')">编辑</el-button>
            <el-button link size="small" v-if="row.status === 'draft'" @click="submitReview(row.id)">提交审核</el-button>
            <el-button link size="small" v-if="row.status === 'pending_review' && isLeader" type="primary" @click="approveSOP(row.id)">审核通过</el-button>
            <el-button link size="small" v-if="row.status === 'pending_review' && isLeader" type="danger" @click="rejectSOP(row.id)">驳回</el-button>
            <el-button link size="small" type="danger" @click="deleteSOP(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const sops = ref([]);
const products = ref([]);
const processes = ref([]);
const filters = ref({ product_id: '', process_id: '', status: '' });

const isLeader = computed(() => userStore.currentUser?.role === 'leader');

const statusType = (status) => {
  const types = { draft: 'info', pending_review: 'warning', approved: 'success' };
  return types[status] || 'info';
};

const statusText = (status) => {
  const texts = { draft: '草稿', pending_review: '待审核', approved: '已发布' };
  return texts[status] || status;
};

const formatDate = (date) => new Date(date).toLocaleString();

const loadSOPs = async () => {
  try {
    const res = await api.get('/sops', { params: filters.value });
    sops.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const loadOptions = async () => {
  const [pRes, proRes] = await Promise.all([api.get('/products'), api.get('/processes')]);
  products.value = pRes.data;
  processes.value = proRes.data;
};

const resetFilters = () => {
  filters.value = { product_id: '', process_id: '', status: '' };
  loadSOPs();
};

const submitReview = async (id) => {
  await api.post(`/sops/${id}/submit`);
  ElMessage.success('已提交审核');
  loadSOPs();
};

const approveSOP = async (id) => {
  try {
    await ElMessageBox.prompt('请输入生效日期和失效日期', '审核通过', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '生效日期 (YYYY-MM-DD)',
      inputValue: new Date().toISOString().split('T')[0]
    }).then(async ({ value: effectiveDate }) => {
      await api.post(`/sops/${id}/approve`, {
        reviewer_id: userStore.currentUser.id,
        effective_date: effectiveDate,
        expiry_date: null
      });
      ElMessage.success('审核通过，已发布');
      loadSOPs();
    });
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

const rejectSOP = async (id) => {
  await api.post(`/sops/${id}/reject`);
  ElMessage.success('已驳回');
  loadSOPs();
};

const deleteSOP = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除此作业指导书吗？', '提示', { type: 'warning' });
    await api.delete(`/sops/${id}`);
    ElMessage.success('删除成功');
    loadSOPs();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

onMounted(() => {
  loadSOPs();
  loadOptions();
});
</script>
