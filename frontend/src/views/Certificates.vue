<template>
  <div class="certificates-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>电子证照库</span>
          <el-button type="primary" @click="addDialogVisible = true">
            <el-icon><Plus /></el-icon>
            添加证照
          </el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="8" v-for="cert in certificates" :key="cert.id">
          <el-card class="cert-card" shadow="hover">
            <div class="cert-header">
              <div class="cert-type">{{ cert.cert_type }}</div>
              <el-tag :type="cert.status ? 'success' : 'danger'">
                {{ cert.status ? '有效' : '已注销' }}
              </el-tag>
            </div>
            <div class="cert-name">{{ cert.cert_name }}</div>
            <div class="cert-number">{{ cert.cert_number }}</div>
            <div class="cert-info">
              <div>签发机构: {{ cert.issuer }}</div>
              <div>有效期至: {{ cert.expire_date }}</div>
              <div>核验次数: {{ cert.verify_count || 0 }}</div>
            </div>
            <div class="cert-actions">
              <el-button size="small" type="primary" @click="handleVerify(cert)">
                验真
              </el-button>
              <el-button size="small" @click="handleShare(cert)">
                授权共享
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="certificates.length === 0" description="暂无电子证照" />
    </el-card>

    <el-dialog v-model="addDialogVisible" title="添加电子证照" width="500px">
      <el-form :model="certForm" label-width="100px">
        <el-form-item label="证照类型">
          <el-select v-model="certForm.certType" placeholder="请选择证照类型">
            <el-option label="身份证" value="身份证" />
            <el-option label="营业执照" value="营业执照" />
            <el-option label="不动产权证" value="不动产权证" />
            <el-option label="驾驶证" value="驾驶证" />
            <el-option label="社保卡" value="社保卡" />
          </el-select>
        </el-form-item>
        <el-form-item label="证照名称">
          <el-input v-model="certForm.certName" placeholder="请输入证照名称" />
        </el-form-item>
        <el-form-item label="证照编号">
          <el-input v-model="certForm.certNumber" placeholder="请输入证照编号" />
        </el-form-item>
        <el-form-item label="签发机构">
          <el-input v-model="certForm.issuer" placeholder="请输入签发机构" />
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker v-model="certForm.expireDate" type="date" placeholder="选择日期" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addCertificate" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="shareDialogVisible" title="授权共享" width="500px">
      <el-form :model="shareForm" label-width="100px">
        <el-form-item label="目标部门">
          <el-input v-model="shareForm.targetDept" placeholder="请输入目标部门名称" />
        </el-form-item>
        <el-form-item label="用途">
          <el-input v-model="shareForm.purpose" type="textarea" :rows="3" placeholder="请输入共享用途" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shareDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitShare" :loading="sharing">确认授权</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';
import dayjs from 'dayjs';

const certificates = ref<any[]>([]);
const addDialogVisible = ref(false);
const shareDialogVisible = ref(false);
const submitting = ref(false);
const sharing = ref(false);
const currentCertId = ref<number | null>(null);

const certForm = reactive({
  certType: '',
  certName: '',
  certNumber: '',
  issuer: '',
  expireDate: ''
});

const shareForm = reactive({
  targetDept: '',
  purpose: ''
});

const loadCertificates = async () => {
  try {
    const res = await api.get('/certificates');
    if (res.code === 200) {
      certificates.value = res.data;
    }
  } catch (error) {
    console.error('加载证照失败', error);
  }
};

const addCertificate = async () => {
  submitting.value = true;
  try {
    const res = await api.post('/certificates', {
      ...certForm,
      expireDate: dayjs(certForm.expireDate).format('YYYY-MM-DD')
    });
    if (res.code === 200) {
      ElMessage.success('添加成功');
      addDialogVisible.value = false;
      loadCertificates();
    }
  } finally {
    submitting.value = false;
  }
};

const handleVerify = async (cert: any) => {
  try {
    const res = await api.get(`/certificates/${cert.id}/verify`);
    if (res.code === 200) {
      ElMessage.success(res.data.message + `，剩余 ${res.data.daysRemaining} 天`);
      loadCertificates();
    }
  } catch (error) {
    console.error('验真失败', error);
  }
};

const handleShare = (cert: any) => {
  currentCertId.value = cert.id;
  shareForm.targetDept = '';
  shareForm.purpose = '';
  shareDialogVisible.value = true;
};

const submitShare = async () => {
  if (!currentCertId.value) return;
  sharing.value = true;
  try {
    const res = await api.post(`/certificates/${currentCertId.value}/share`, shareForm);
    if (res.code === 200) {
      ElMessage.success('授权成功');
      shareDialogVisible.value = false;
    }
  } finally {
    sharing.value = false;
  }
};

onMounted(() => {
  loadCertificates();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cert-card {
  margin-bottom: 20px;
}

.cert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cert-type {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.cert-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 4px;
}

.cert-number {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 12px;
}

.cert-info {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.8;
  margin-bottom: 12px;
}

.cert-actions {
  display: flex;
  gap: 8px;
}
</style>
