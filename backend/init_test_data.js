const db = require('./src/utils/db.js')

// 创建测试项目
const insertProject = db.prepare(`
  INSERT INTO projects (project_owner_id, project_name, project_code, status)
  VALUES (?, ?, ?, 'active')
`)
const projectResult = insertProject.run(4, '测试项目A', 'PROJ001')
const projectId = projectResult.lastInsertRowid
console.log('Created project:', projectId)

// 创建任务批次
const insertBatch = db.prepare(`
  INSERT INTO task_batches (project_id, batch_no, batch_name, total_tasks, status, created_by)
  VALUES (?, ?, ?, ?, 'completed', 1)
`)
const batchResult = insertBatch.run(projectId, 'BATCH20260501', '5月第一批任务', 3)
const batchId = batchResult.lastInsertRowid
console.log('Created batch:', batchId)

// 创建测试任务
const insertTask = db.prepare(`
  INSERT INTO tasks (batch_id, freelancer_id, task_no, task_content, unit_price, quantity, total_amount, acceptance_status, settled)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 0)
`)
insertTask.run(batchId, 5, 'TASK001', '页面设计', 500.00, 2, 1000.00)
insertTask.run(batchId, 5, 'TASK002', 'API开发', 800.00, 1, 800.00)
insertTask.run(batchId, 5, 'TASK003', '测试工作', 300.00, 3, 900.00)
console.log('Created 3 tasks')

// 验证数据
console.log('Tasks count:', db.prepare('SELECT COUNT(*) as count FROM tasks').get())
console.log('Tasks:', db.prepare('SELECT * FROM tasks').all())
