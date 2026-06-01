import os

base_dir = '/Users/chen/Documents/trae_projects/local_projects/may-63455/frontend/src'

print(f"Base directory: {base_dir}")
print(f"Views directory exists: {os.path.exists(os.path.join(base_dir, 'views'))}")

# 创建 App.vue
app_vue = '''<template>
  <div id="app">
    <el-container style="min-height: 100vh">
      <el-header style="background: #409EFF; color: white; padding: 0 20px">
        <div style="display: flex; align-items: center; height: 100%">
          <h2 style="margin: 0; color: white">Peizhen Service</h2>
          <el-menu mode="horizontal" :default-active="$route.path" router style="margin-left: 30px; background: #409EFF; border: none">
            <el-menu-item index="/">Home</el-menu-item>
            <el-menu-item index="/patient-order">Order</el-menu-item>
            <el-menu-item index="/escort-list">Escort</el-menu-item>
            <el-menu-item index="/order-list">Orders</el-menu-item>
            <el-menu-item index="/service-record">Record</el-menu-item>
            <el-menu-item index="/settlement">Settle</el-menu-item>
            <el-menu-item index="/admin">Admin</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main><router-view /></el-main>
    </el-container>
  </div>
</template>

<script setup></script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
#app { font-family: Arial, sans-serif; }
.el-menu--horizontal { border-bottom: none !important; }
.el-menu--horizontal .el-menu-item { color: white !important; }
.el-menu--horizontal .el-menu-item:hover,
.el-menu--horizontal .el-menu-item.is-active { background-color: rgba(255,255,255,0.2) !important; }
</style>
'''

with open(os.path.join(base_dir, 'App.vue'), 'w', encoding='utf-8') as f:
    f.write(app_vue)
print("Created App.vue")

# 创建 Home.vue
home_vue = '''<template>
  <div class="home">
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6"><el-card><div style="text-align:center"><div style="font-size:32px;color:#409EFF;font-weight:bold">{{ stats.patients }}</div><div style="color:#909399;margin-top:10px">Patients</div></div></el-card></el-col>
      <el-col :span="6"><el-card><div style="text-align:center"><div style="font-size:32px;color:#67C23A;font-weight:bold">{{ stats.escorts }}</div><div style="color:#909399;margin-top:10px">Escorts</div></div></el-card></el-col>
      <el-col :span="6"><el-card><div style="text-align:center"><div style="font-size:32px;color:#E6A23C;font-weight:bold">{{ stats.todayOrders }}</div><div style="color:#909399;margin-top:10px">Today</div></div></el-card></el-col>
      <el-col :span="6"><el-card><div style="text-align:center"><div style="font-size:32px;color:#F56C6C;font-weight:bold">Y{{ stats.revenue }}</div><div style="color:#909399;margin-top:10px">Revenue</div></div></el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
const stats = reactive({ patients: 128, escorts: 35, todayOrders: 12, revenue: '58,680' })
</script>

<style scoped>.home { padding: 20px 0; }</style>
'''

with open(os.path.join(base_dir, 'views', 'Home.vue'), 'w', encoding='utf-8') as f:
    f.write(home_vue)
print("Created Home.vue")

# 创建 PatientOrder.vue
patient_order_vue = '''<template>
  <div class="patient-order">
    <el-card>
      <template #header><span style="font-weight:bold;font-size:18px">Patient Order</span></template>
      <el-form :model="form" label-width="120px" style="max-width:600px">
        <el-form-item label="Name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="Phone"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="Age"><el-input-number v-model="form.age" :min="1" :max="120" /></el-form-item>
        <el-form-item label="Hospital"><el-input v-model="form.hospital" /></el-form-item>
        <el-form-item label="Department"><el-input v-model="form.department" /></el-form-item>
        <el-form-item label="Date"><el-date-picker v-model="form.date" type="date" style="width:100%" /></el-form-item>
        <el-form-item><el-button type="primary" @click="submit">Submit</el-button><el-button @click="reset">Reset</el-button></el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
const form = reactive({ name: '', phone: '', age: 30, hospital: '', department: '', date: '' })
const submit = () => ElMessage.success('Order submitted!')
const reset = () => Object.assign(form, { name: '', phone: '', age: 30, hospital: '', department: '', date: '' })
</script>

<style scoped>.patient-order { padding: 20px 0; }</style>
'''

with open(os.path.join(base_dir, 'views', 'PatientOrder.vue'), 'w', encoding='utf-8') as f:
    f.write(patient_order_vue)
print("Created PatientOrder.vue")

# 创建 EscortList.vue
escort_list_vue = '''<template>
  <div class="escort-list">
    <el-card>
      <template #header><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:bold;font-size:18px">Escort List</span><el-button type="primary">Add</el-button></div></template>
      <el-table :data="tableData" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="Name" width="120" />
        <el-table-column prop="phone" label="Phone" width="150" />
        <el-table-column prop="specialty" label="Specialty" />
        <el-table-column prop="rating" label="Rating" width="100" />
        <el-table-column prop="status" label="Status" width="100">
          <template #default="scope"><el-tag :type="scope.row.status == 'Available' ? 'success' : 'info'">{{ scope.row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="Action" width="150">
          <template #default="scope"><el-button size="small" type="primary">Edit</el-button><el-button size="small" type="danger">Delete</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const tableData = ref([
  { id: 1, name: 'Dr.Zhang', phone: '138****1234', specialty: 'Internal Medicine', rating: 4.9, status: 'Available' },
  { id: 2, name: 'Nurse.Li', phone: '139****5678', specialty: 'Pediatrics', rating: 4.8, status: 'Available' },
  { id: 3, name: 'Mr.Wang', phone: '137****9012', specialty: 'General', rating: 4.7, status: 'Busy' }
])
</script>

<style scoped>.escort-list { padding: 20px 0; }</style>
'''

with open(os.path.join(base_dir, 'views', 'EscortList.vue'), 'w', encoding='utf-8') as f:
    f.write(escort_list_vue)
print("Created EscortList.vue")

# 创建 OrderList.vue
order_list_vue = '''<template>
  <div class="order-list">
    <el-card>
      <template #header><span style="font-weight:bold;font-size:18px">Order List</span></template>
      <el-table :data="tableData" border>
        <el-table-column prop="id" label="Order ID" width="120" />
        <el-table-column prop="patientName" label="Patient" width="120" />
        <el-table-column prop="hospital" label="Hospital" />
        <el-table-column prop="escortName" label="Escort" width="120" />
        <el-table-column prop="amount" label="Amount" width="100"><template #default="scope">Y{{ scope.row.amount }}</template></el-table-column>
        <el-table-column prop="status" label="Status" width="100"><template #default="scope"><el-tag>{{ scope.row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="createTime" label="Time" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const tableData = ref([
  { id: 'ORD001', patientName: 'Zhang San', hospital: 'Beijing Hospital', escortName: 'Dr.Zhang', amount: 299, status: 'Pending', createTime: '2024-01-15 09:30' },
  { id: 'ORD002', patientName: 'Li Si', hospital: '301 Hospital', escortName: 'Nurse.Li', amount: 99, status: 'Processing', createTime: '2024-01-15 10:15' },
  { id: 'ORD003', patientName: 'Wang Wu', hospital: 'ZhongRi Hospital', escortName: 'Mr.Wang', amount: 199, status: 'Completed', createTime: '2024-01-14 14:20' }
])
</script>

<style scoped>.order-list { padding: 20px 0; }</style>
'''

with open(os.path.join(base_dir, 'views', 'OrderList.vue'), 'w', encoding='utf-8') as f:
    f.write(order_list_vue)
print("Created OrderList.vue")

# 创建 ServiceRecord.vue
service_record_vue = '''<template>
  <div class="service-record">
    <el-card>
      <template #header><span style="font-weight:bold;font-size:18px">Service Record</span></template>
      <el-table :data="tableData" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="orderId" label="Order ID" width="120" />
        <el-table-column prop="patientName" label="Patient" width="120" />
        <el-table-column prop="escortName" label="Escort" width="120" />
        <el-table-column prop="serviceContent" label="Content" />
        <el-table-column prop="serviceTime" label="Hours" width="100" />
        <el-table-column prop="serviceDate" label="Date" width="150" />
        <el-table-column prop="rating" label="Rating" width="100"><template #default="scope"><el-rate v-model="scope.row.rating" disabled /></template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const tableData = ref([
  { id: 1, orderId: 'ORD003', patientName: 'Wang Wu', escortName: 'Mr.Wang', serviceContent: 'Checkup assistance', serviceTime: 4, serviceDate: '2024-01-14', rating: 5 },
  { id: 2, orderId: 'ORD006', patientName: 'Sun Ba', escortName: 'Dr.Zhang', serviceContent: 'Full accompaniment', serviceTime: 6, serviceDate: '2024-01-13', rating: 4 }
])
</script>

<style scoped>.service-record { padding: 20px 0; }</style>
'''

with open(os.path.join(base_dir, 'views', 'ServiceRecord.vue'), 'w', encoding='utf-8') as f:
    f.write(service_record_vue)
print("Created ServiceRecord.vue")

# 创建 Settlement.vue
settlement_vue = '''<template>
  <div class="settlement">
    <el-row :gutter="20" style="margin-bottom:20px">
      <el-col :span="8"><el-card><div style="text-align:center"><div style="font-size:28px;color:#67C23A;font-weight:bold">Y{{ totalRevenue }}</div><div style="color:#909399;margin-top:10px">Total Revenue</div></div></el-card></el-col>
      <el-col :span="8"><el-card><div style="text-align:center"><div style="font-size:28px;color:#E6A23C;font-weight:bold">Y{{ pendingSettlement }}</div><div style="color:#909399;margin-top:10px">Pending</div></div></el-card></el-col>
      <el-col :span="8"><el-card><div style="text-align:center"><div style="font-size:28px;color:#409EFF;font-weight:bold">Y{{ settled }}</div><div style="color:#909399;margin-top:10px">Settled</div></div></el-card></el-col>
    </el-row>
    <el-card>
      <template #header><span style="font-weight:bold;font-size:18px">Settlement List</span></template>
      <el-table :data="tableData" border>
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="escortName" label="Escort" width="120" />
        <el-table-column prop="orderCount" label="Orders" width="100" />
        <el-table-column prop="amount" label="Amount" width="120"><template #default="scope">Y{{ scope.row.amount }}</template></el-table-column>
        <el-table-column prop="status" label="Status" width="100"><template #default="scope"><el-tag :type="scope.row.status == 'Settled' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag></template></el-table-column>
        <el-table-column label="Action" width="100"><template #default="scope"><el-button v-if="scope.row.status == 'Pending'" size="small" type="primary">Settle</el-button></template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const totalRevenue = ref('58,680')
const pendingSettlement = ref('12,500')
const settled = ref('46,180')
const tableData = ref([
  { id: 'SET001', escortName: 'Dr.Zhang', orderCount: 5, amount: 1495, status: 'Settled' },
  { id: 'SET002', escortName: 'Nurse.Li', orderCount: 3, amount: 897, status: 'Settled' },
  { id: 'SET003', escortName: 'Mr.Wang', orderCount: 8, amount: 2392, status: 'Pending' }
])
</script>

<style scoped>.settlement { padding: 20px 0; }</style>
'''

with open(os.path.join(base_dir, 'views', 'Settlement.vue'), 'w', encoding='utf-8') as f:
    f.write(settlement_vue)
print("Created Settlement.vue")

# 创建 Admin.vue
admin_vue = '''<template>
  <div class="admin">
    <el-card>
      <template #header><span style="font-weight:bold;font-size:18px">Admin</span></template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Users" name="users">
          <el-table :data="userData" border style="margin-top:20px">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="Username" width="150" />
            <el-table-column prop="name" label="Name" width="120" />
            <el-table-column prop="role" label="Role" width="120"><template #default="scope"><el-tag>{{ scope.row.role }}</el-tag></template></el-table-column>
            <el-table-column prop="status" label="Status" width="100"><template #default="scope"><el-tag :type="scope.row.status == 'Active' ? 'success' : 'info'">{{ scope.row.status }}</el-tag></template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="Settings" name="settings">
          <el-form :model="settingsForm" label-width="150px" style="max-width:600px;margin-top:20px">
            <el-form-item label="System Name"><el-input v-model="settingsForm.systemName" /></el-form-item>
            <el-form-item label="Service Rate%"><el-input-number v-model="settingsForm.serviceRate" :min="0" :max="100" /></el-form-item>
            <el-form-item><el-button type="primary">Save</el-button></el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
const activeTab = ref('users')
const userData = ref([
  { id: 1, username: 'admin', name: 'Admin', role: 'Admin', status: 'Active' },
  { id: 2, username: 'manager', name: 'Manager', role: 'Manager', status: 'Active' }
])
const settingsForm = reactive({ systemName: 'Peizhen Service', serviceRate: 10 })
</script>

<style scoped>.admin { padding: 20px 0; }</style>
'''

with open(os.path.join(base_dir, 'views', 'Admin.vue'), 'w', encoding='utf-8') as f:
    f.write(admin_vue)
print("Created Admin.vue")

print("All Vue files created successfully!")
