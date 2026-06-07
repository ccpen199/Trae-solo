<template>
  <div class="seals-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>电子印章管理</span>
          <el-button type="primary" @click="createDialogVisible = true">
            <el-icon><Plus /></el-icon>
            创建印章
          </el-button>
        </div>
      </template>

      <el-table :data="seals" v-loading="loading">
        <el-table-column prop="seal_name" label="印章名称" />
        <el-table-column prop="seal_type" label="印章类型" />
        <el-table-column prop="gb_standard" label="标准规范" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleSign(row)">
              文档签章
            </el-button>
            <el-button link @click="loadRecords(row.id)">
              用印记录
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="seals.length === 0" description="暂无电子印章" />
    </el-card>

    <el-dialog v-model="createDialogVisible" title="创建电子印章" width="500px">
      <el-form :model="sealForm" label-width="100px">
        <el-form-item label="印章名称">
          <el-input v-model="sealForm.sealName" placeholder="请输入印章名称" />
        </el-form-item>
        <el-form-item label="印章类型">
          <el-select v-model="sealForm.sealType" placeholder="请选择印章类型">
            <el-option label="公章" value="公章" />
            <el-option label="财务章" value="财务章" />
            <el-option label="法人章" value="法人章" />
            <el-option label="合同章" value="合同章" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="standard-tip">
        <el-icon><InfoFilled /></el-icon>
        本系统电子印章符合 GB/T 33481-2016 标准规范
      </div>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createSeal" :loading="creating">创建印章</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="signDialogVisible" title="文档签章" width="500px">
      <el-form :model="signForm" label-width="100px">
        <el-form-item label="文档名称">
          <el-input v-model="signForm.documentName" placeholder="请输入文档名称" />
        </el-form-item>
        <el-form-item label="文档哈希">
          <el-input v-model="signForm.documentHash" type="textarea" :rows="3" placeholder="请输入文档SHA256哈希值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="signDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSign" :loading="signing">确认签章</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordsDialogVisible" title="用印记录" width="700px">
      <el-table :data="records" size="small">
        <el-table-column prop="document_name" label="文档名称" />
        <el-table-column prop="sign_time" label="签章时间" width="180" />
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column label="签名值" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="font-family: monospace; font-size: 12px;">{{ row.signature }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';

const loading = ref(false);
const seals = ref<any[]>([]);
const records = ref<any[]>([]);
const createDialogVisible = ref(false);
const signDialogVisible = ref(false);
const recordsDialogVisible = ref(false);
const creating = ref(false);
const signing = ref(false);
const currentSealId = ref<number | null>(null);

const sealForm = reactive({
  sealName: '',
  sealType: '公章'
});

const signForm = reactive({
  documentName: '',
  documentHash: ''
});

const loadSeals = async () => {
  loading.value = true;
  try {
    const res = await api.get('/seals');
    if (res.code === 200) {
      seals.value = res.data;
    }
  } finally {
    loading.value = false;
  }
};

const createSeal = async () => {
  creating.value = true;
  try {
    const res = await api.post('/seals', sealForm);
    if (res.code === 200) {
      ElMessage.success('印章创建成功');
      createDialogVisible.value = false;
      loadSeals();
    }
  } finally {
    creating.value = false;
  }
};

const handleSign = (row: any) => {
  currentSealId.value = row.id;
  signForm.documentName = '';
  signForm.documentHash = '';
  signDialogVisible.value = true;
};

const submitSign = async () => {
  if (!currentSealId.value) return;
  signing.value = true;
  try {
    const res = await api.post(`/seals/${currentSealId.value}/sign`, signForm);
    if (res.code === 200) {
      ElMessage.success('签章成功');
      signDialogVisible.value = false;
    }
  } finally {
    signing.value = false;
  }
};

const loadRecords = async (sealId: number) => {
  try {
    const res = await api.get('/seals/records/list');
    if (res.code === 200) {
      records.value = res.data;
      recordsDialogVisible.value = true;
    }
  } catch (error) {
    console.error('加载记录失败', error);
  }
};

onMounted(() => {
  loadSeals();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.standard-tip {
  padding: 12px;
  background: #ecfdf5;
  border-radius: 6px;
  color: #059669;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
