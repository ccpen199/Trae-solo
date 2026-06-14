<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>🏢 {{ data.enterprise?.name || '企业详情' }}</h2>
        <p style="color: #909399;">六维穿透式数据分析 - 所有数据均标注更新时间与原始出处</p>
      </div>
      <div>
        <el-button @click="generateQRCode">生成资质二维码</el-button>
        <el-button @click="saveOffline">保存离线档案</el-button>
        <el-button type="primary" @click="generateReport">生成尽调报告</el-button>
      </div>
    </div>

    <el-card class="card-shadow" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <h3 style="margin-bottom: 16px;">{{ data.enterprise?.name }}</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div>
              <span style="color: #909399;">统一社会信用代码：</span>
              <span>{{ data.enterprise?.unified_social_credit }}</span>
            </div>
            <div>
              <span style="color: #909399;">法定代表人：</span>
              <span>{{ data.enterprise?.legal_representative }}</span>
            </div>
            <div>
              <span style="color: #909399;">注册资本：</span>
              <span>{{ data.enterprise?.registered_capital }}</span>
            </div>
            <div>
              <span style="color: #909399;">成立日期：</span>
              <span>{{ data.enterprise?.establishment_date }}</span>
            </div>
            <div>
              <span style="color: #909399;">经营状态：</span>
              <el-tag :type="data.enterprise?.status === '正常' ? 'success' : 'danger'">
                {{ data.enterprise?.status }}
              </el-tag>
            </div>
            <div>
              <span style="color: #909399;">风险等级：</span>
              <span :class="`risk-${data.enterprise?.risk_level === '高风险' ? 'high' : data.enterprise?.risk_level === '中风险' ? 'medium' : 'low'}`">
                {{ data.enterprise?.risk_level }}
              </span>
            </div>
          </div>
          <div style="margin-top: 16px;">
            <span style="color: #909399;">地址：</span>
            <span>{{ data.enterprise?.address }}</span>
          </div>
          <div style="margin-top: 8px;">
            <span style="color: #909399;">经营范围：</span>
            <span>{{ data.enterprise?.business_scope }}</span>
          </div>
          <div style="margin-top: 16px;">
            <span class="data-source-tag">数据来源：{{ data.enterprise?.data_source }}</span>
            <span class="data-source-tag">更新时间：{{ data.enterprise?.data_updated_at }}</span>
            <el-link type="primary" :href="data.enterprise?.source_url" target="_blank">
              查看原始出处
            </el-link>
          </div>
        </div>
        <div style="width: 200px; text-align: center;">
          <div style="font-size: 48px; font-weight: bold; color: #1e3a8a;">{{ data.enterprise?.total_score }}</div>
          <div style="color: #909399;">综合健康度</div>
          <el-progress
            :percentage="data.enterprise?.total_score"
            :color="getScoreColor(data.enterprise?.total_score)"
            style="margin-top: 8px;"
          />
        </div>
      </div>
    </el-card>

    <el-card class="card-shadow" style="margin-bottom: 20px;">
      <template #header>
        <span style="font-weight: bold;">📊 六维健康度评分</span>
      </template>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>🏢 工商信息</span>
            <span>{{ data.enterprise?.business_score }}/25</span>
          </div>
          <el-progress :percentage="(data.enterprise?.business_score || 0) * 4" :stroke-width="16" />
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>⚖️ 司法风险</span>
            <span>{{ data.enterprise?.judicial_score }}/25</span>
          </div>
          <el-progress :percentage="(data.enterprise?.judicial_score || 0) * 4" :stroke-width="16" color="#f56c6c" />
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>📋 招投标记录</span>
            <span>{{ data.enterprise?.bidding_score }}/15</span>
          </div>
          <el-progress :percentage="(data.enterprise?.bidding_score || 0) / 15 * 100" :stroke-width="16" color="#409eff" />
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>🏅 资质情况</span>
            <span>{{ data.enterprise?.qualification_score }}/15</span>
          </div>
          <el-progress :percentage="(data.enterprise?.qualification_score || 0) / 15 * 100" :stroke-width="16" color="#67c23a" />
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>👥 人员配置</span>
            <span>{{ data.enterprise?.personnel_score }}/10</span>
          </div>
          <el-progress :percentage="(data.enterprise?.personnel_score || 0) * 10" :stroke-width="16" color="#e6a23c" />
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>⭐ 信用状况</span>
            <span>{{ data.enterprise?.credit_score }}/10</span>
          </div>
          <el-progress :percentage="(data.enterprise?.credit_score || 0) * 10" :stroke-width="16" color="#909399" />
        </div>
      </div>
    </el-card>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="⚖️ 司法记录" name="judicial">
        <div v-if="data.judicial?.length > 0">
          <div v-for="item in data.judicial" :key="item.id" style="padding: 16px; border-bottom: 1px solid #f0f0f0;">
            <div style="font-weight: bold; margin-bottom: 8px;">
              [{{ item.case_type }}] {{ item.case_reason }}
            </div>
            <div style="color: #606266; margin-bottom: 4px;">
              <span>法院：{{ item.court }}</span>
              <span style="margin-left: 16px;">案号：{{ item.case_number }}</span>
            </div>
            <div style="color: #606266; margin-bottom: 4px;">
              <span>立案日期：{{ item.filing_date }}</span>
              <span style="margin-left: 16px;">判决日期：{{ item.judgment_date || '未判决' }}</span>
            </div>
            <div v-if="item.amount" style="color: #f56c6c; font-weight: bold;">
              涉及金额：¥{{ item.amount.toLocaleString() }}
            </div>
            <div style="margin-top: 8px;">
              <el-tag type="info">判决结果：{{ item.judgment_result || '待判决' }}</el-tag>
            </div>
            <div style="margin-top: 8px; font-size: 12px;">
              <span class="data-source-tag">来源：{{ item._meta?.source }}</span>
              <span class="data-source-tag">更新：{{ item._meta?.updatedAt }}</span>
              <el-link type="primary" :href="item._meta?.sourceUrl" target="_blank" size="small">原始出处</el-link>
            </div>
          </div>
        </div>
        <div v-else style="text-align: center; color: #909399; padding: 40px;">
          暂无司法记录
        </div>
      </el-tab-pane>

      <el-tab-pane label="📋 招投标记录" name="bidding">
        <el-table :data="data.bidding" v-if="data.bidding?.length > 0" stripe>
          <el-table-column prop="project_name" label="项目名称" min-width="250" />
          <el-table-column label="中标金额" width="180">
            <template #default="scope">
              ¥{{ scope.row.bidding_amount.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="bidding_date" label="投标日期" width="120" />
          <el-table-column prop="winning_status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.winning_status === '中标' ? 'success' : 'info'">
                {{ scope.row.winning_status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="tenderee" label="招标人" width="200" />
          <el-table-column prop="region" label="地区" width="150" />
        </el-table>
        <div v-else style="text-align: center; color: #909399; padding: 40px;">
          暂无招投标记录
        </div>
        <div v-if="data.bidding?.length > 0" style="margin-top: 16px; font-size: 12px;">
          <span class="data-source-tag">数据来源：全国公共资源交易平台</span>
        </div>
      </el-tab-pane>

      <el-tab-pane label="🏅 企业资质" name="qualification">
        <el-table :data="data.qualification" v-if="data.qualification?.length > 0" stripe>
          <el-table-column label="资质类型" min-width="200">
            <template #default="scope">
              {{ scope.row.qualification_type }} - {{ scope.row.qualification_level }}
            </template>
          </el-table-column>
          <el-table-column prop="certificate_number" label="证书编号" width="200" />
          <el-table-column prop="issuing_authority" label="发证机关" width="250" />
          <el-table-column label="有效期" width="250">
            <template #default="scope">
              {{ scope.row.issue_date }} 至 {{ scope.row.expiry_date }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === '有效' ? 'success' : 'danger'">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div v-else style="text-align: center; color: #909399; padding: 40px;">
          暂无资质信息
        </div>
      </el-tab-pane>

      <el-tab-pane label="👥 核心人员" name="personnel">
        <el-table :data="data.personnel" v-if="data.personnel?.length > 0" stripe>
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="position" label="职位" width="180" />
          <el-table-column prop="qualification_certificates" label="资质证书" min-width="250" />
          <el-table-column prop="registration_number" label="注册编号" width="180" />
        </el-table>
        <div v-else style="text-align: center; color: #909399; padding: 40px;">
          暂无人员信息
        </div>
      </el-tab-pane>

      <el-tab-pane label="⭐ 信用记录" name="credit">
        <div v-if="data.credit?.length > 0">
          <div v-for="item in data.credit" :key="item.id" style="padding: 16px; border-bottom: 1px solid #f0f0f0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-weight: bold;">
                [{{ item.credit_type }}] {{ item.credit_level }}
              </div>
              <div>
                <el-tag :type="item.status === '有效' ? 'success' : 'info'">{{ item.status }}</el-tag>
                <el-tag style="margin-left: 8px;">{{ item.repair_status }}</el-tag>
              </div>
            </div>
            <div style="margin: 8px 0;">{{ item.description }}</div>
            <div style="color: #909399; font-size: 12px;">
              <span>生效日期：{{ item.effective_date }}</span>
              <span style="margin-left: 16px;">公示截止：{{ item.display_deadline }}</span>
              <span v-if="item.days_remaining !== undefined" style="margin-left: 16px; color: #e6a23c;">
                剩余公示期：{{ Math.max(0, Math.floor(item.days_remaining)) }} 天
              </span>
            </div>
            <div v-if="item.repair_status === '未修复' && item.status === '有效'" style="margin-top: 8px;">
              <el-button size="small" type="primary" @click="applyRepair(item)">
                申请信用修复
              </el-button>
            </div>
          </div>
        </div>
        <div v-else style="text-align: center; color: #909399; padding: 40px;">
          暂无信用记录
        </div>
      </el-tab-pane>

      <el-tab-pane label="⚠️ 经营异常" name="abnormal">
        <el-table :data="data.abnormalities" v-if="data.abnormalities?.length > 0" stripe>
          <el-table-column prop="abnormal_type" label="异常类型" width="150" />
          <el-table-column prop="abnormal_reason" label="异常原因" min-width="250" />
          <el-table-column prop="decision_authority" label="决定机关" width="200" />
          <el-table-column prop="decision_date" label="决定日期" width="120" />
          <el-table-column prop="removal_date" label="移除日期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === '未移除' ? 'danger' : 'success'">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div v-else style="text-align: center; color: #909399; padding: 40px;">
          暂无经营异常记录
        </div>
      </el-tab-pane>

      <el-tab-pane label="🔍 风控规则评估" name="rules">
        <div v-if="ruleEvaluation">
          <el-alert
            :title="`共评估 ${ruleEvaluation.totalRules} 条规则，触发 ${ruleEvaluation.triggeredCount} 条`"
            :type="ruleEvaluation.triggeredCount > 0 ? 'warning' : 'success'"
            show-icon
            style="margin-bottom: 20px;"
          />
          <el-table :data="ruleEvaluation.results" stripe>
            <el-table-column prop="ruleName" label="规则名称" width="250" />
            <el-table-column prop="ruleLevel" label="级别" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.ruleLevel === 'high' ? 'danger' : scope.row.ruleLevel === 'medium' ? 'warning' : 'info'">
                  {{ scope.row.ruleLevel === 'high' ? '高' : scope.row.ruleLevel === 'medium' ? '中' : '低' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="是否触发" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.triggered ? 'danger' : 'success'">
                  {{ scope.row.triggered ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="说明" min-width="300" />
          </el-table>
        </div>
        <div v-else style="text-align: center; padding: 40px;">
          <el-button type="primary" @click="evaluateRules">执行风控规则评估</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="qrDialogVisible" title="企业资质二维码" width="400px">
      <div style="text-align: center;">
        <img :src="qrCodeImage" style="width: 300px; height: 300px;" />
        <p style="margin-top: 16px; color: #606266;">扫描二维码快速调取企业资质信息</p>
        <el-button type="primary" style="margin-top: 16px;" @click="downloadQR">
          下载二维码
        </el-button>
      </div>
    </el-dialog>

    <el-dialog v-model="repairDialogVisible" title="申请信用修复" width="500px">
      <el-form :model="repairForm" label-width="100px">
        <el-form-item label="信用记录">
          <span>{{ repairingRecord?.description }}</span>
        </el-form-item>
        <el-form-item label="证明文件" required>
          <el-upload
            action=""
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".jpg,.jpeg,.png,.pdf"
          >
            <el-button>选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传主管部门盖章的信用修复证明文件（支持 jpg、png、pdf）
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="repairDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRepair">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="offlineResultVisible" title="离线档案保存成功" width="600px" :close-on-click-modal="false">
      <div v-if="offlineResult" style="text-align: center;">
        <el-result icon="success" title="离线档案已保存">
          <template #sub-title>
            <span>档案ID: {{ offlineResult.archiveId }} | 已存入移动端离线缓存</span>
          </template>
          <template #extra>
            <div style="margin-bottom: 20px;">
              <img :src="offlineResult.qrCode" style="width: 180px; height: 180px; border: 1px solid #e4e7ed; padding: 10px; border-radius: 8px;" />
              <p style="margin-top: 12px; color: #606266; font-size: 13px;">企业资质二维码</p>
            </div>
          </template>
        </el-result>

        <el-alert
          :title="`最近同步时间: ${offlineResult.archiveData?.archivedAt || offlineResult.archiveData?.downloaded_at || '未知'}`"
          type="success"
          :closable="false"
          show-icon
          style="margin-bottom: 16px; text-align: left;"
        />

        <el-divider content-position="left">📦 离线档案包含的六维资料</el-divider>
        <el-descriptions :column="2" border size="small" style="margin-bottom: 16px; text-align: left;">
          <el-descriptions-item label="🏢 工商信息">
            <el-tag type="success" size="small">
              企业基本信息 ✓
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="⚖️ 司法信息">
            <el-tag type="success" size="small">
              {{ (offlineResult.archiveData?.judicial?.length || 0) }} 条记录 ✓
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="📋 招投标信息">
            <el-tag type="success" size="small">
              {{ (offlineResult.archiveData?.bidding?.length || 0) }} 条记录 ✓
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="📜 资质信息">
            <el-tag type="success" size="small">
              {{ (offlineResult.archiveData?.qualification?.length || 0) }} 条记录 ✓
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="👥 人员信息">
            <el-tag type="success" size="small">
              {{ (offlineResult.archiveData?.personnel?.length || 0) }} 条记录 ✓
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="⭐ 信用信息">
            <el-tag type="success" size="small">
              {{ (offlineResult.archiveData?.credit?.length || 0) }} 条记录 ✓
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="🚨 经营异常">
            <el-tag type="success" size="small">
              {{ (offlineResult.archiveData?.abnormal?.length || 0) }} 条记录 ✓
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="📊 健康度评分">
            <el-tag type="success" size="small">
              综合评分 {{ offlineResult.archiveData?.enterprise?.total_score || 0 }} ✓
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">📱 移动端扫码调取结果</el-divider>
        <el-alert
          title="扫码可快速调取以下资质信息"
          type="info"
          :closable="false"
          style="margin-bottom: 16px; text-align: left;"
        >
          <template #default>
            <p>✅ 企业营业执照信息（统一社会信用代码、注册资本、成立日期等）</p>
            <p>✅ 建筑业企业资质证书信息（资质类别、资质等级、有效期）</p>
            <p>✅ 安全生产许可证信息</p>
            <p>✅ 注册建造师、注册造价师等人员资格信息</p>
            <p>✅ 近3年信用记录与健康度评分</p>
          </template>
        </el-alert>

        <el-divider content-position="left">⚡ 快捷操作</el-divider>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <el-button type="primary" @click="goToOfflineArchives">
            <el-icon><FolderOpened /></el-icon>
            查看离线档案
          </el-button>
          <el-button @click="downloadOfflineQR">
            <el-icon><Download /></el-icon>
            下载二维码
          </el-button>
          <el-button type="success" @click="offlineResultVisible = false">
            继续浏览
          </el-button>
        </div>

        <el-alert
          title="💡 使用说明"
          type="info"
          :closable="false"
          style="text-align: left;"
        >
          <template #default>
            <p>📱 打开移动端 → 进入「离线档案」即可查看已缓存的企业数据</p>
            <p>📷 扫描资质二维码可快速调取企业完整资质信息</p>
            <p>🔄 离线档案支持手动同步，建议每周同步一次确保数据最新</p>
            <p>📍 已缓存数据可在无网络环境下正常访问</p>
          </template>
        </el-alert>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { enterpriseApi, reportsApi, mobileApi, riskRulesApi, creditApi } from '@/utils/api';
import { ElMessage } from 'element-plus';
import { FolderOpened, Download } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const enterpriseId = route.params.id;
const activeTab = ref('judicial');
const data = ref({});
const ruleEvaluation = ref(null);
const qrDialogVisible = ref(false);
const qrCodeImage = ref('');
const repairDialogVisible = ref(false);
const repairingRecord = ref(null);
const repairForm = ref({ file: null });
const offlineResultVisible = ref(false);
const offlineResult = ref(null);

const getScoreColor = (score) => {
  if (!score) return '#909399';
  if (score >= 80) return '#67c23a';
  if (score >= 60) return '#e6a23c';
  return '#f56c6c';
};

const loadData = async () => {
  try {
    data.value = await enterpriseApi.penetration(enterpriseId);
    // 加载企业数据后自动执行风控规则评估
    await evaluateRules();
  } catch (err) {
    console.error('Failed to load enterprise data:', err);
  }
};

const generateReport = async () => {
  try {
    const result = await reportsApi.generate({
      enterpriseId,
      reportType: 'detailed'
    });
    if (result.success) {
      ElMessage.success('尽调报告生成成功，正在下载...');
      setTimeout(() => {
        reportsApi.download(result.reportId);
      }, 500);
    }
  } catch (err) {
    console.error('Generate report failed:', err);
  }
};

const generateQRCode = async () => {
  try {
    const result = await mobileApi.generateQR(enterpriseId);
    qrCodeImage.value = result.qrCode;
    qrDialogVisible.value = true;
  } catch (err) {
    console.error('Generate QR code failed:', err);
  }
};

const downloadQR = () => {
  mobileApi.downloadQR(enterpriseId);
};

const saveOffline = async () => {
  try {
    const result = await mobileApi.saveOffline(enterpriseId, 1);
    offlineResult.value = result;
    offlineResultVisible.value = true;
  } catch (err) {
    console.error('Save offline failed:', err);
  }
};

const goToOfflineArchives = () => {
  offlineResultVisible.value = false;
  router.push('/mobile/offline');
};

const downloadOfflineQR = () => {
  if (offlineResult.value?.qrCode) {
    const link = document.createElement('a');
    link.href = offlineResult.value.qrCode;
    link.download = `qrcode_${data.enterprise?.name || 'enterprise'}.png`;
    link.click();
    ElMessage.success('二维码已开始下载');
  }
};

const evaluateRules = async () => {
  try {
    ruleEvaluation.value = await riskRulesApi.evaluate(enterpriseId);
    
    // 显示业务回写结果
    if (ruleEvaluation.value.actionResults && ruleEvaluation.value.actionResults.length > 0) {
      const successActions = ruleEvaluation.value.actionResults.filter(a => a.status === 'success');
      if (successActions.length > 0) {
        const actionDescs = successActions.map(a => `${a.action}(${a.ruleName})`).join('、');
        ElMessage.success(`规则命中，已执行：${actionDescs}`);
        
        // 重新加载企业数据，展示更新后的评分
        setTimeout(async () => {
          data.value = await enterpriseApi.penetration(enterpriseId);
        }, 500);
      }
      
      const skippedActions = ruleEvaluation.value.actionResults.filter(a => a.status === 'skipped');
      if (skippedActions.length > 0) {
        ElMessage.info(skippedActions.map(a => `${a.ruleName}: ${a.reason}`).join('、'));
      }
    }
  } catch (err) {
    console.error('Evaluate rules failed:', err);
  }
};

const applyRepair = (record) => {
  repairingRecord.value = record;
  repairDialogVisible.value = true;
};

const handleFileChange = (file) => {
  repairForm.value.file = file.raw;
};

const submitRepair = async () => {
  if (!repairForm.value.file) {
    ElMessage.warning('请上传证明文件');
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('proof', repairForm.value.file);
    
    await creditApi.applyRepair(repairingRecord.value.id, formData);
    ElMessage.success('修复申请已提交，等待人工复核');
    repairDialogVisible.value = false;
    loadData();
  } catch (err) {
    console.error('Submit repair failed:', err);
  }
};

onMounted(loadData);
</script>
