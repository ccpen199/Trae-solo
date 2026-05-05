<template>
  <div class="upload-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>上传物流单</span>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </template>

      <el-alert
        title="上传说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <p>请上传Excel文件，支持 .xlsx 和 .xls 格式。</p>
          <p>Excel模板字段：物流单号、代单号、货物名称、货物数量、货物重量、货物体积、生产企业编号、生产企业名称、发起企业编号、发起企业名称、中转企业编号、中转企业名称、接收企业编号、接收企业名称、当前企业编号、当前企业名称、发货地址、收货地址</p>
        </template>
      </el-alert>

      <el-upload
        class="upload-demo"
        drag
        :action="uploadUrl"
        :headers="uploadHeaders"
        :on-success="handleSuccess"
        :on-error="handleError"
        :before-upload="beforeUpload"
        :limit="1"
        :on-exceed="handleExceed"
        :file-list="fileList"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 xlsx/xls 文件，且不超过 10MB
          </div>
        </template>
      </el-upload>

      <el-divider />

      <div class="result-section" v-if="uploadResult">
        <el-card>
          <template #header>
            <span>上传结果</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="总条数">
              {{ uploadResult.total }}
            </el-descriptions-item>
            <el-descriptions-item label="成功条数">
              <el-tag type="success">{{ uploadResult.successCount }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="失败条数">
              <el-tag type="danger">{{ uploadResult.failCount }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="错误详情" v-if="uploadResult.errors && uploadResult.errors.length > 0">
              <ul class="error-list">
                <li v-for="(error, index) in uploadResult.errors" :key="index">
                  <el-tag type="warning">第{{ error.row }}行</el-tag> {{ error.message }}
                </li>
              </ul>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type UploadUserFile, type UploadRawFile } from 'element-plus';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const fileList = ref<UploadUserFile[]>([]);
const uploadResult = ref<any>(null);

const uploadUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:12257';
  return `${baseUrl}/api/logistics/import`;
});

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
});

const handleBack = () => {
  router.back();
};

const beforeUpload = (file: UploadRawFile) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel';
  const isLt10M = file.size / 1024 / 1024 < 10;

  if (!isExcel && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    ElMessage.error('只能上传 xlsx/xls 格式的文件');
    return false;
  }
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB');
    return false;
  }
  return true;
};

const handleSuccess = (response: any, file: UploadUserFile, files: UploadUserFile[]) => {
  if (response.code === 0 || response.success) {
    ElMessage.success('上传成功');
    uploadResult.value = response.data;
  } else {
    ElMessage.error(response.message || '上传失败');
  }
};

const handleError = (error: any, file: UploadUserFile, files: UploadUserFile[]) => {
  console.error('Upload error:', error);
  ElMessage.error('上传失败，请重试');
};

const handleExceed = (files: UploadRawFile[], fileList: UploadUserFile[]) => {
  ElMessage.warning('每次只能上传一个文件');
};
</script>

<style scoped>
.upload-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-demo {
  width: 100%;
}

.result-section {
  margin-top: 20px;
}

.error-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.error-list li {
  margin-bottom: 5px;
  padding: 5px 0;
  border-bottom: 1px dashed #eee;
}

.error-list li:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
</style>
