<template>
  <div class="citizen-index">
    <div class="card">
      <div class="card-header">
        <h2>群众办事端</h2>
      </div>
      <div class="card-body">
        <div class="form-section">
          <h3>身份确认</h3>
          <div class="form-row">
            <div class="form-group">
              <label>身份证号 *</label>
              <input v-model="applicantForm.id_card" type="text" placeholder="请输入身份证号" maxlength="18" />
            </div>
            <div class="form-group">
              <label>姓名 *</label>
              <input v-model="applicantForm.name" type="text" placeholder="请输入姓名" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>手机号</label>
              <input v-model="applicantForm.phone" type="text" placeholder="请输入手机号" maxlength="11" />
            </div>
            <div class="form-group">
              <label>地址</label>
              <input v-model="applicantForm.address" type="text" placeholder="请输入地址" />
            </div>
          </div>
          <button class="btn btn-primary" @click="confirmApplicant">确认身份</button>
        </div>

        <div v-if="currentApplicant" class="info-section">
          <div class="alert alert-success">
            <strong>欢迎，{{ currentApplicant.name }}！</strong> 身份已确认
          </div>
          
          <h3>功能入口</h3>
          <div class="action-grid">
            <div class="action-card" @click="go('/citizen/materials')">
              <div class="action-icon blue">📁</div>
              <h4>我的材料库</h4>
              <p>查看和管理已提交的材料</p>
            </div>
            <div class="action-card" @click="go('/citizen/apply')">
              <div class="action-icon green">📝</div>
              <h4>办理事项</h4>
              <p>申请办理政务服务事项</p>
            </div>
            <div class="action-card" @click="go('/citizen/applications')">
              <div class="action-icon orange">📋</div>
              <h4>办理记录</h4>
              <p>查看申请办理进度</p>
            </div>
            <div class="action-card" @click="go('/citizen/authorizations')">
              <div class="action-icon red">🔑</div>
              <h4>授权管理</h4>
              <p>管理材料使用授权</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const currentApplicant = ref(null)
const applicantForm = ref({
  id_card: '',
  name: '',
  phone: '',
  address: ''
})

const go = (path) => router.push(path)

const confirmApplicant = async () => {
  if (!applicantForm.value.id_card || !applicantForm.value.name) {
    alert('请填写身份证号和姓名')
    return
  }

  try {
    const res = await api.createApplicant(applicantForm.value)
    currentApplicant.value = res.data
    localStorage.setItem('currentApplicant', JSON.stringify(res.data))
    alert('身份确认成功！')
  } catch (err) {
    alert('操作失败：' + err.message)
  }
}

const savedApplicant = localStorage.getItem('currentApplicant')
if (savedApplicant) {
  currentApplicant.value = JSON.parse(savedApplicant)
  applicantForm.value = {
    id_card: currentApplicant.value.id_card,
    name: currentApplicant.value.name,
    phone: currentApplicant.value.phone || '',
    address: currentApplicant.value.address || ''
  }
}
</script>

<style scoped>
.citizen-index {
  padding: 20px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}
.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}
.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}
.card-body {
  padding: 20px;
}
.form-section h3,
.info-section h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #303133;
}
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}
.form-group {
  flex: 1;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}
.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-group input:focus {
  outline: none;
  border-color: #409eff;
}
.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}
.btn-primary {
  background: #409eff;
  color: white;
}
.btn-primary:hover {
  background: #66b1ff;
}
.info-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #ebeef5;
}
.alert {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
}
.alert-success {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}
.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.action-card {
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 25px 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}
.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.action-icon {
  font-size: 40px;
  margin-bottom: 15px;
}
.blue { color: #409eff; }
.green { color: #67c23a; }
.orange { color: #e6a23c; }
.red { color: #f56c6c; }
.action-card h4 {
  margin: 15px 0 10px 0;
  font-size: 16px;
  color: #303133;
}
.action-card p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}
</style>
