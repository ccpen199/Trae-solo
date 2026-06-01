<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">团购活动</h1>
      <el-button type="primary" @click="openDialog" v-if="currentRole !== 'customer'">新增活动</el-button>
    </div>
    
    <el-card>
      <el-form :inline="true" style="margin-bottom: 20px">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="草稿" value="draft" />
            <el-option label="进行中" value="active" />
            <el-option label="已结束" value="ended" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadActivities">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="activities" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="活动标题" />
        <el-table-column prop="leader_name" label="团长" width="120" />
        <el-table-column prop="cut_off_time" label="截单时间" width="180" />
        <el-table-column prop="pickup_point" label="提货点" />
        <el-table-column prop="min_group_size" label="成团人数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="currentRole === 'customer' ? 100 : 200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <template v-if="currentRole !== 'customer'">
              <el-button size="small" @click="openDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteActivity(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑活动' : '新增活动'" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="团长" required>
          <el-select v-model="form.leader_id" placeholder="请选择团长" style="width: 100%">
            <el-option v-for="leader in leaderList" :key="leader.id" :label="leader.name" :value="leader.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动标题" required>
          <el-input v-model="form.title" placeholder="请输入活动标题" />
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入活动描述" />
        </el-form-item>
        <el-form-item label="截单时间" required>
          <el-date-picker v-model="form.cut_off_time" type="datetime" placeholder="选择截单时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="提货点" required>
          <el-input v-model="form.pickup_point" placeholder="请输入提货点" />
        </el-form-item>
        <el-form-item label="成团人数">
          <el-input-number v-model="form.min_group_size" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="草稿" value="draft" />
            <el-option label="进行中" value="active" />
            <el-option label="已结束" value="ended" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品列表">
          <el-button size="small" @click="addProduct">添加商品</el-button>
          <div v-for="(product, index) in form.products" :key="index" style="display: flex; gap: 10px; margin-bottom: 10px">
            <el-input v-model="product.name" placeholder="商品名称" style="flex: 2" />
            <el-input-number v-model="product.price" :min="0" :precision="2" placeholder="价格" style="width: 120px" />
            <el-input-number v-model="product.stock" :min="0" placeholder="库存" style="width: 100px" />
            <el-input v-model="product.unit" placeholder="单位" style="width: 80px" />
            <el-button size="small" type="danger" @click="removeProduct(index)">删除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveActivity">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="活动详情" width="600px">
      <div v-if="currentActivity">
        <p><strong>标题：</strong>{{ currentActivity.title }}</p>
        <p><strong>团长：</strong>{{ currentActivity.leader_name }}</p>
        <p><strong>截单时间：</strong>{{ currentActivity.cut_off_time }}</p>
        <p><strong>提货点：</strong>{{ currentActivity.pickup_point }}</p>
        <h4 style="margin: 20px 0 10px">商品列表</h4>
        <el-table :data="currentActivity.products || []" size="small">
          <el-table-column prop="name" label="商品" />
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="80" />
          <el-table-column prop="sold" label="已售" width="80" />
          <el-table-column prop="unit" label="单位" width="80" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { activitiesAPI, leadersAPI } from '../api';

const props = defineProps({
  currentRole: {
    type: String,
    default: 'admin'
  }
});

const activities = ref([]);
const leaderList = ref([]);
const filters = reactive({
  status: ''
});

const dialogVisible = ref(false);
const detailVisible = ref(false);
const isEdit = ref(false);
const currentActivity = ref(null);
const form = reactive({
  id: null,
  leader_id: null,
  title: '',
  description: '',
  cut_off_time: '',
  pickup_point: '',
  min_group_size: 0,
  status: 'draft',
  products: []
});

const getStatusType = (status) => {
  const types = { draft: 'info', active: 'success', ended: 'danger' };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = { draft: '草稿', active: '进行中', ended: '已结束' };
  return texts[status] || status;
};

const loadActivities = async () => {
  try {
    const params = {};
    if (filters.status) params.status = filters.status;
    const res = await activitiesAPI.list(params);
    activities.value = res.data || [];
  } catch (error) {
    ElMessage.error('加载活动列表失败');
  }
};

const loadLeaders = async () => {
  try {
    const res = await leadersAPI.list();
    leaderList.value = res.data || [];
  } catch (error) {
    ElMessage.error('加载团长列表失败');
  }
};

const resetFilters = () => {
  filters.status = '';
  loadActivities();
};

const addProduct = () => {
  form.products.push({ name: '', price: 0, stock: 0, unit: '' });
};

const removeProduct = (index) => {
  form.products.splice(index, 1);
};

const openDialog = (row = null) => {
  isEdit.value = !!row;
  if (row) {
    Object.assign(form, row);
  } else {
    Object.assign(form, {
      id: null,
      leader_id: null,
      title: '',
      description: '',
      cut_off_time: '',
      pickup_point: '',
      min_group_size: 0,
      status: 'draft',
      products: []
    });
  }
  dialogVisible.value = true;
};

const viewDetail = async (row) => {
  try {
    const res = await activitiesAPI.get(row.id);
    currentActivity.value = res.data;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('加载详情失败');
  }
};

const saveActivity = async () => {
  if (!form.leader_id || !form.title || !form.cut_off_time || !form.pickup_point) {
    ElMessage.warning('请填写必填项');
    return;
  }
  
  try {
    if (isEdit.value) {
      await activitiesAPI.update(form.id, form);
      ElMessage.success('更新成功');
    } else {
      await activitiesAPI.create(form);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadActivities();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败');
  }
};

const deleteActivity = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该活动吗？', '提示', { type: 'warning' });
    await activitiesAPI.delete(row.id);
    ElMessage.success('删除成功');
    loadActivities();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败');
  }
};

onMounted(() => {
  loadActivities();
  loadLeaders();
});
</script>
