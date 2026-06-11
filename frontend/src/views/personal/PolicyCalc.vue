<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><Calculator /></el-icon> 政策计算器
      </div>
      <div></div>
    </div>

    <div class="card">
      <el-tabs v-model="activeTab" class="policy-tabs">
        <el-tab-pane label="社保补缴试算" name="social">
          <div class="calc-form">
            <el-form :model="socialForm" label-width="140px" inline>
              <el-form-item label="缴费基数(元)">
                <el-input-number v-model="socialForm.base_salary" :min="3000" :max="30000" :step="100" style="width:200px" />
              </el-form-item>
              <el-form-item label="补缴月数">
                <el-input-number v-model="socialForm.months" :min="1" :max="36" style="width:200px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="calcLoading" @click="calcSocial">
                  <el-icon><Search /></el-icon> 开始试算
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <div v-if="socialResult" class="result-box">
            <div class="result-title">试算结果</div>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="缴费基数">¥ {{ socialResult.base_salary.toLocaleString() }} / 月</el-descriptions-item>
              <el-descriptions-item label="补缴月数">{{ socialResult.months }} 个月</el-descriptions-item>
            </el-descriptions>

            <div class="rate-table-title">缴费比例明细</div>
            <el-table :data="rateTableData" border style="width:100%; margin-bottom:16px;">
              <el-table-column prop="name" label="险种" width="120" />
              <el-table-column prop="personalRate" label="个人比例" width="120">
                <template #default="{ row }">{{ (row.personalRate * 100).toFixed(2) }}%</template>
              </el-table-column>
              <el-table-column prop="personalMonthly" label="个人月缴(元)">
                <template #default="{ row }">¥ {{ row.personalMonthly.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column prop="companyRate" label="企业比例" width="120">
                <template #default="{ row }">{{ (row.companyRate * 100).toFixed(2) }}%</template>
              </el-table-column>
              <el-table-column prop="companyMonthly" label="企业月缴(元)">
                <template #default="{ row }">¥ {{ row.companyMonthly.toFixed(2) }}</template>
              </el-table-column>
            </el-table>

            <div class="summary-grid">
              <div class="summary-item blue">
                <div class="sum-label">个人缴费合计</div>
                <div class="sum-value">¥ {{ socialResult.total_personal.toLocaleString() }}</div>
                <div class="sum-sub">月缴 ¥ {{ socialResult.monthly_personal.toFixed(2) }} × {{ socialResult.months }} 月</div>
              </div>
              <div class="summary-item green">
                <div class="sum-label">企业缴费合计</div>
                <div class="sum-value">¥ {{ socialResult.total_company.toLocaleString() }}</div>
                <div class="sum-sub">月缴 ¥ {{ socialResult.monthly_company.toFixed(2) }} × {{ socialResult.months }} 月</div>
              </div>
              <div class="summary-item orange">
                <div class="sum-label">补缴总金额</div>
                <div class="sum-value big">¥ {{ socialResult.total.toLocaleString() }}</div>
                <div class="sum-sub">个人 + 企业</div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="创业担保贷款额度模拟" name="loan">
          <div class="calc-form">
            <el-form :model="loanForm" label-width="140px" inline>
              <el-form-item label="项目类型">
                <el-select v-model="loanForm.project_type" style="width:200px">
                  <el-option label="个人创业" value="individual" />
                  <el-option label="小微企业" value="micro" />
                  <el-option label="小型企业" value="small" />
                  <el-option label="中型企业" value="medium" />
                </el-select>
              </el-form-item>
              <el-form-item label="年营收(万元)">
                <el-input-number v-model="loanForm.annual_revenue" :min="0" :precision="2" style="width:200px" />
              </el-form-item>
              <el-form-item label="员工数(人)">
                <el-input-number v-model="loanForm.employee_count" :min="1" style="width:200px" />
              </el-form-item>
              <el-form-item label="抵押物值(万元)">
                <el-input-number v-model="loanForm.collateral" :min="0" :precision="2" style="width:200px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="calcLoading" @click="calcLoan">
                  <el-icon><Search /></el-icon> 模拟额度
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <div v-if="loanResult" class="result-box">
            <div class="result-title">模拟结果</div>
            <div class="loan-grid">
              <div class="loan-card primary">
                <div class="loan-label">预计贷款额度</div>
                <div class="loan-value">{{ loanResult.estimated_limit }} <span>万元</span></div>
                <div class="loan-sub">最高额度 {{ loanResult.max_limit }} 万元</div>
              </div>
              <div class="loan-card success">
                <div class="loan-label">年化利率</div>
                <div class="loan-value">{{ loanResult.annual_interest_rate }} <span>%</span></div>
                <div class="loan-sub">财政贴息后优惠利率</div>
              </div>
              <div class="loan-card warning">
                <div class="loan-label">年利息</div>
                <div class="loan-value">{{ loanResult.interest_year }} <span>万元</span></div>
                <div class="loan-sub">额度 × 年利率</div>
              </div>
              <div class="loan-card info">
                <div class="loan-label">贷款期限</div>
                <div class="loan-value">{{ loanResult.term_years }} <span>年</span></div>
                <div class="loan-sub">最长可贷期限</div>
              </div>
            </div>

            <el-descriptions :column="2" border style="margin-top:20px;">
              <el-descriptions-item label="项目类型">{{ projectTypeText(loanResult.project_type) }}</el-descriptions-item>
              <el-descriptions-item label="年营收">{{ loanResult.annual_revenue }} 万元</el-descriptions-item>
              <el-descriptions-item label="员工数">{{ loanResult.employee_count }} 人</el-descriptions-item>
              <el-descriptions-item label="抵押物值">{{ loanResult.collateral }} 万元</el-descriptions-item>
            </el-descriptions>

            <el-alert
              title="温馨提示"
              type="info"
              :closable="false"
              style="margin-top:16px;"
              description="以上额度为模拟测算结果，实际贷款额度以银行审批为准。创业担保贷款可享受财政贴息政策，详情请咨询当地人社部门。"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../../store/auth'

const router = useRouter()
const activeTab = ref('social')
const calcLoading = ref(false)
const socialResult = ref(null)
const loanResult = ref(null)
const socialForm = ref({ base_salary: 5000, months: 6 })
const loanForm = ref({ project_type: 'individual', annual_revenue: 50, employee_count: 5, collateral: 0 })

const rateTableData = computed(() => {
  if (!socialResult.value) return []
  const rates = socialResult.value.rates
  const base = socialResult.value.base_salary
  const items = []
  const allKeys = new Set([...Object.keys(rates.personal), ...Object.keys(rates.company)])
  const nameMap = { pension: '养老保险', medical: '医疗保险', unemployment: '失业保险', injury: '工伤保险', maternity: '生育保险' }
  allKeys.forEach(k => {
    items.push({
      name: nameMap[k] || k,
      personalRate: rates.personal[k] || 0,
      personalMonthly: (rates.personal[k] || 0) * base,
      companyRate: rates.company[k] || 0,
      companyMonthly: (rates.company[k] || 0) * base
    })
  })
  return items
})

function projectTypeText(t) {
  const map = { individual: '个人创业', micro: '小微企业', small: '小型企业', medium: '中型企业' }
  return map[t] || t
}

async function calcSocial() {
  calcLoading.value = true
  try {
    const res = await api.get('/personal/policy-calc/social-insurance', { params: socialForm.value })
    socialResult.value = res.data.data
    ElMessage.success('试算完成')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '试算失败')
  } finally {
    calcLoading.value = false
  }
}

async function calcLoan() {
  calcLoading.value = true
  try {
    const res = await api.get('/personal/policy-calc/venture-loan', { params: loanForm.value })
    loanResult.value = res.data.data
    ElMessage.success('模拟完成')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '模拟失败')
  } finally {
    calcLoading.value = false
  }
}

function goBack() {
  router.push('/personal')
}
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}
.back-btn {
  cursor: pointer;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
.policy-tabs :deep(.el-tabs__header) { margin-bottom: 24px; }
.calc-form {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}
.result-box {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 8px;
  padding: 24px;
}
.result-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d4ed8;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.result-title::before {
  content: '';
  width: 4px;
  height: 18px;
  background: #1d4ed8;
  border-radius: 2px;
}
.rate-table-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 20px 0 12px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 8px;
}
.summary-item {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border-left: 4px solid #1d4ed8;
}
.summary-item.green { border-left-color: #047857; }
.summary-item.orange { border-left-color: #c2410c; }
.sum-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}
.sum-value {
  font-size: 26px;
  font-weight: 700;
  color: #1d4ed8;
}
.summary-item.green .sum-value { color: #047857; }
.summary-item.orange .sum-value { color: #c2410c; }
.sum-value.big { font-size: 30px; }
.sum-sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 6px;
}
.loan-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.loan-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border-top: 4px solid #1d4ed8;
}
.loan-card.primary { border-top-color: #1d4ed8; }
.loan-card.success { border-top-color: #047857; }
.loan-card.warning { border-top-color: #c2410c; }
.loan-card.info { border-top-color: #6d28d9; }
.loan-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}
.loan-value {
  font-size: 28px;
  font-weight: 700;
  color: #1d4ed8;
}
.loan-card.success .loan-value { color: #047857; }
.loan-card.warning .loan-value { color: #c2410c; }
.loan-card.info .loan-value { color: #6d28d9; }
.loan-value span {
  font-size: 14px;
  font-weight: 500;
  margin-left: 2px;
}
.loan-sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 6px;
}
@media (max-width: 768px) {
  .summary-grid { grid-template-columns: 1fr; }
  .loan-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
