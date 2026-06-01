import Database from 'better-sqlite3';

const db = new Database('./data/app.sqlite');

const failedTasks = db.prepare('SELECT id FROM tasks WHERE status = ?').all('failed');
console.log('找到失败任务:', failedTasks.length);

failedTasks.forEach(task => {
  const existingSteps = db.prepare('SELECT COUNT(*) as c FROM task_steps WHERE task_id = ?').get(task.id).c;
  if (existingSteps === 0) {
    console.log('给任务', task.id, '添加步骤数据');
    
    const steps = [
      ['权限校验', 'success', 'check permissions', 'granted'],
      ['连接数据库', 'success', 'connect db', 'connected'],
      ['锁定表', 'success', 'lock tables', 'locked'],
      ['执行备份', 'failed', 'execute dump', 'connection timeout'],
      ['压缩文件', 'skipped', 'compress', 'skipped'],
      ['加密存储', 'skipped', 'encrypt', 'skipped'],
      ['校验完整性', 'skipped', 'verify checksum', 'skipped'],
      ['解锁释放', 'skipped', 'unlock', 'skipped']
    ];
    
    const insertStep = db.prepare(`
      INSERT INTO task_steps (task_id, step_name, step_order, status, input_data, output_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    steps.forEach((step, idx) => {
      insertStep.run(task.id, step[0], idx + 1, step[1], step[2], step[3]);
    });
    
    db.prepare(`
      UPDATE tasks SET error_code = ?, error_message = ? WHERE id = ?
    `).run('BACKUP_FAILED_001', '执行备份步骤失败：数据库连接超时', task.id);
  }
});

console.log('修复完成！');
console.log('');
console.log('=== 验证数据 ===');
const taskList = db.prepare(`
  SELECT t.id, t.task_no, t.status, t.error_message, 
         (SELECT COUNT(*) FROM task_steps WHERE task_id = t.id) as step_count,
         (SELECT COUNT(*) FROM exceptions WHERE task_id = t.id) as exc_count
  FROM tasks t
`).all();

taskList.forEach(t => {
  console.log(`[${t.id}] ${t.task_no} - ${t.status} - 步骤:${t.step_count} - 异常:${t.exc_count}`);
  if (t.error_message) {
    console.log(`    错误: ${t.error_message}`);
  }
});

db.close();
