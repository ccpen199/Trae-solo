<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">团长管理</h1>
      <el-button type="primary" @click="openDialog">新增团长</el-button>
    </div>
    
    <el-card>
      <el-form :inline="true" style="margin-bottom: 20px">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLeaders">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="leaders" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="电话" />
        <el-table-column prop="community" label="社区" />
        <el-table-column prop="level" label="等级" width="80" />
        <el-table-column prop="deposit" label="保证金" width="100">
          <template #default="{ row }">¥{{ row.deposit }}</template>
        </el-table-column>
        <el-table-column prop="performance_score" label="履约分" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="can_create_activity" label="开团权限" width="100">
          <template #default="{ row }">
            <el-tag :type="row.can_create_activity ? 'success' : 'warning'">
              {{ row.can_create_activity ? '允许' : '限制' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteLeader(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑团长' : '新增团长'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话" required>
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="社区" required>
          <el-input v-model="form.community" placeholder="请输入社区名称" />
        </el-form-item>
        <el-form-item label="服务范围">
          <el-input v-model="form.service_area" placeholder="请输入服务范围" />
        </el-form-item>
        <el-form-item label="资质">
          <el-input v-model="form.qualification" placeholder="请输入资质信息" />
        </el-form-item>
        <el-form-item label="保证金">
          <el-input-number v-model="form.deposit" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="等级">
          <el-input-number v-model="form.level" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" active-value="active" inactive-value="inactive" />
        </el-form-item>
        <el-form-item label="开团权限">
          <el-switch v-model="form.can_create_activity" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLeader">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { leadersAPI } from '../api';

const props = defineProps({
  currentRole: {
    type: String,
    default: 'admin'
  }
});

const leaders = ref([]);
const filters = reactive({
  status: ''
});

const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive({
  id: null,
  name: '',
  phone: '',
  community: '',
  service_area: '',
  qualification: '',
  deposit: 0,
  level: 1,
  status: 'active',
  can_create_activity: 1
});

const loadLeaders = async () => {
  try {
    const params = {};
    if (filters.status) params.status = filters.status;
    const res = await leadersAPI.list(params);
    leaders.value = res.data || [];
  } catch (error) {
    ElMessage.error('加载团长列表失败');
  }
};

const resetFilters = () => {
  filters.status = '';
  loadLeaders();
};

const openDialog = (row = null) => {
  isEdit.value = !!row;
  if (row) {
    Object.assign(form, row);
  } else {
    Object.assign(form, {
      id: null,
      name: '',
      phone: '',
      community: '',
      service_area: '',
      qualification: '',
      deposit: 0,
      level: 1,
      status: 'active',
      can_create_activity: 1
    });
  }
  dialogVisible.value = true;
};

const saveLeader = async () => {
  if (!form.name || !form.phone || !form.community) {
    ElMessage.warning('请填写必填项');
    return;
  }
  
  try {
    if (isEdit.value) {
      await leadersAPI.update(form.id, form);
      ElMessage.success('更新成功');
    } else {
      await leadersAPI.create(form);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadLeaders();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败');
  }
};

const deleteLeader = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该团长吗？', '提示', {
      type: 'warning'
    });
    await leadersAPI.delete(row.id);
    ElMessage.success('删除成功');
    loadLeaders();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

onMounted(() => {
  loadLeaders();
});
</script>
