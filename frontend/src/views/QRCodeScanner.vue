<template>
  <div class="mobile-container">
    <div class="page-header">
      <h2>📷 扫码查询</h2>
      <p style="color: #909399;">扫描二维码快速调取合作方资质信息</p>
    </div>

    <el-card class="card-shadow" style="margin-bottom: 20px;">
      <template #header>
        <span style="font-weight: bold;">扫码方式</span>
      </template>
      <el-radio-group v-model="scanMode" style="width: 100%;">
        <el-radio value="paste" style="display: block; margin-bottom: 12px;">
          粘贴二维码数据（JSON格式）
        </el-radio>
        <el-radio value="select" style="display: block; margin-bottom: 12px;">
          选择企业（演示模式）
        </el-radio>
      </el-radio-group>
    </el-card>

    <el-card v-if="scanMode === 'paste'" class="card-shadow" style="margin-bottom: 20px;">
      <template #header>
        <span style="font-weight: bold;">粘贴二维码数据</span>
      </template>
      <el-input
        v-model="qrDataInput"
        type="textarea"
        :rows="4"
        placeholder='粘贴二维码JSON数据，例如：{"type":"enterprise","enterpriseId":1,"name":"中建一局..."}'
        style="margin-bottom: 12px;"
      />
      <el-button type="primary" style="width: 100%;" @click="scanQR" :loading="scanning">
        解析二维码
      </el-button>
    </el-card>

    <el-card v-if="scanMode === 'select'" class="card-shadow" style="margin-bottom: 20px;">
      <template #header>
        <span style="font-weight: bold;">选择企业（演示）</span>
      </template>
      <el-select v-model="selectedEnterpriseId" filterable style="width: 100%; margin-bottom: 12px;">
        <el-option
          v-for="e in enterpriseList"
          :key="e.id"
          :label="e.name"
          :value="e.id"
        />
      </el-select>
      <el-button type="primary" style="width: 100%;" @click="simulateScan" :loading="scanning">
        模拟扫码
      </el-button>
    </el-card>

    <el-divider v-if="scanResult">扫描结果</el-divider>

    <div v-if="scanResult">
      <el-alert
        v-if="scanResult.riskAlerts?.inBlacklist"
        title="⚠️ 警告：该企业在分包商黑名单中！"
        type="error"
        show-icon
        style="margin-bottom: 12px;"
      />
      <el-alert
        v-else-if="scanResult.riskAlerts?.hasBadCredit"
        title="⚠️ 提示：该企业存在不良信用记录"
        type="warning"
        show-icon
        style="margin-bottom: 12px;"
      />
      <el-alert
        v-else
        title="✅ 该企业无重大风险预警"
        type="success"
        show-icon
        style="margin-bottom: 12px;"
      />

      <el-card class="card-shadow" style="margin-bottom: 20px;">
        <template #header>
          <span style="font-weight: bold;">企业信息</span>
        </template>
        <h3 style="margin-bottom: 12px;">{{ scanResult.enterprise?.name }}</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px;">
          <div><span style="color: #909399;">统一社会信用代码：</span>{{ scanResult.enterprise?.unified_social_credit }}</div>
          <div><span style="color: #909399;">法定代表人：</span>{{ scanResult.enterprise?.legal_representative }}</div>
          <div><span style="color: #909399;">注册资本：</span>{{ scanResult.enterprise?.registered_capital }}</div>
          <div><span style="color: #909399;">风险等级：</span>
            <span :class="`risk-${scanResult.enterprise?.risk_level === '高风险' ? 'high' : scanResult.enterprise?.risk_level === '中风险' ? 'medium' : 'low'}`">
              {{ scanResult.enterprise?.risk_level }}
            </span>
          </div>
        </div>
      </el-card>

      <el-card class="card-shadow" style="margin-bottom: 20px;">
        <template #header>
          <span style="font-weight: bold;">企业资质</span>
        </template>
        <div v-if="scanResult.qualifications?.length > 0">
          <div v-for="q in scanResult.qualifications" :key="q.id" style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
            <div style="font-weight: bold;">{{ q.qualification_type }} - {{ q.qualification_level }}</div>
            <div style="font-size: 12px; color: #909399;">
              证书编号：{{ q.certificate_number }} | 有效期至：{{ q.expiry_date }}
            </div>
          </div>
        </div>
        <div v-else style="text-align: center; color: #909399; padding: 20px;">暂无资质信息</div>
      </el-card>

      <el-card class="card-shadow" style="margin-bottom: 20px;">
        <template #header>
          <span style="font-weight: bold;">核心人员</span>
        </template>
        <el-table :data="scanResult.personnel || []" v-if="scanResult.personnel?.length > 0" size="small">
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="position" label="职位" width="150" />
          <el-table-column prop="qualification_certificates" label="资质证书" />
        </el-table>
        <div v-else style="text-align: center; color: #909399; padding: 20px;">暂无人员信息</div>
      </el-card>

      <el-card class="card-shadow" style="margin-bottom: 20px;">
        <template #header>
          <span style="font-weight: bold;">快捷操作</span>
        </template>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <el-button type="primary" @click="viewDetail">
            <el-icon><View /></el-icon>
            查看详细档案
          </el-button>
          <el-button type="success" @click="generateReport">
            <el-icon><Document /></el-icon>
            生成尽调报告
          </el-button>
          <el-button type="warning" @click="saveOffline">
            <el-icon><Download /></el-icon>
            保存离线档案
          </el-button>
          <el-button type="info" @click="generateQRCode">
            <el-icon><Picture /></el-icon>
            生成二维码
          </el-button>
        </div>
      </el-card>
    </div>

    <el-card class="card-shadow">
      <template #header>
        <span style="font-weight: bold;">📋 扫码记录</span>
      </template>
      <div v-if="scanHistory.length === 0" style="text-align: center; color: #909399; padding: 20px;">
        暂无扫码记录
      </div>
      <div v-else>
        <div v-for="(record, idx) in scanHistory" :key="idx" style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: bold;">{{ record.enterprise?.name }}</div>
            <div style="font-size: 12px; color: #909399;">{{ record.scanTime }}</div>
          </div>
          <el-button size="small" type="primary" @click="loadScanResult(record)">查看</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { mobileApi, enterpriseApi, reportsApi } from '@/utils/api';
import { ElMessage } from 'element-plus';
import { View, Document, Download, Picture } from '@element-plus/icons-vue';

const router = useRouter();
const scanMode = ref('select');
const qrDataInput = ref('');
const selectedEnterpriseId = ref(null);
const enterpriseList = ref([]);
const scanning = ref(false);
const scanResult = ref(null);
const scanHistory = ref([]);

const loadEnterprises = async () => {
  try {
    const data = await enterpriseApi.list({ pageSize: 50 });
    enterpriseList.value = data.list;
  } catch (err) {
    console.error('Load enterprises failed:', err);
  }
};

const scanQR = async () => {
  if (!qrDataInput.value.trim()) {
    ElMessage.warning('请输入二维码数据');
    return;
  }
  
  scanning.value = true;
  try {
    let qrData;
    try {
      qrData = JSON.parse(qrDataInput.value.trim());
    } catch (e) {
      ElMessage.error('二维码数据格式错误，请输入有效的JSON');
      return;
    }
    
    const result = await mobileApi.scanQR(qrData);
    scanResult.value = result;
    scanHistory.value.unshift(result);
    if (scanHistory.value.length > 10) scanHistory.value.pop();
    ElMessage.success('扫码成功');
  } catch (err) {
    console.error('Scan QR failed:', err);
  } finally {
    scanning.value = false;
  }
};

const simulateScan = async () => {
  if (!selectedEnterpriseId.value) {
    ElMessage.warning('请选择企业');
    return;
  }
  
  scanning.value = true;
  try {
    const enterprise = enterpriseList.value.find(e => e.id === selectedEnterpriseId.value);
    const qrData = {
      type: 'enterprise',
      enterpriseId: selectedEnterpriseId.value,
      name: enterprise?.name,
      creditCode: enterprise?.unified_social_credit,
      apiEndpoint: `/api/enterprises/${selectedEnterpriseId.value}/penetration`,
      timestamp: Date.now()
    };
    
    const result = await mobileApi.scanQR(qrData);
    scanResult.value = result;
    scanHistory.value.unshift(result);
    if (scanHistory.value.length > 10) scanHistory.value.pop();
    ElMessage.success('扫码成功');
  } catch (err) {
    console.error('Simulate scan failed:', err);
  } finally {
    scanning.value = false;
  }
};

const loadScanResult = (record) => {
  scanResult.value = record;
};

const viewDetail = () => {
  if (scanResult.value?.enterprise?.id) {
    router.push(`/enterprise/${scanResult.value.enterprise.id}`);
  }
};

const generateReport = async () => {
  if (!scanResult.value?.enterprise?.id) return;
  
  try {
    const result = await reportsApi.generate({
      enterpriseId: scanResult.value.enterprise.id,
      reportType: 'standard'
    });
    if (result.success) {
      ElMessage.success('报告生成成功');
      setTimeout(() => reportsApi.download(result.reportId), 500);
    }
  } catch (err) {
    console.error('Generate report failed:', err);
  }
};

const saveOffline = async () => {
  if (!scanResult.value?.enterprise?.id) return;
  
  try {
    await mobileApi.saveOffline(scanResult.value.enterprise.id, 1);
    ElMessage.success('离线档案保存成功');
  } catch (err) {
    console.error('Save offline failed:', err);
  }
};

const generateQRCode = async () => {
  if (!scanResult.value?.enterprise?.id) return;
  
  try {
    const result = await mobileApi.generateQR(scanResult.value.enterprise.id);
    const win = window.open('', '_blank');
    win?.document.write(`<img src="${result.qrCode}" style="display: block; margin: 50px auto; width: 300px; height: 300px;" />`);
    win?.document.write(`<p style="text-align: center;">${result.enterpriseName} - 企业资质二维码</p>`);
  } catch (err) {
    console.error('Generate QR failed:', err);
  }
};

onMounted(loadEnterprises);
</script>
