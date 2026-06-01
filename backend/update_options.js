import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, './data/app.sqlite'));

try {
  db.exec('ALTER TABLE questions ADD COLUMN options TEXT');
  console.log('✅ 添加 options 字段成功');
} catch(e) {
  console.log('ℹ️  字段已存在');
}

const questions = [
  { id: 1, options: JSON.stringify([
    { text: '已通过 ISO14001 认证', score: 10 },
    { text: '已建立体系但未认证', score: 5 },
    { text: '未建立环境管理体系', score: 0 }
  ])},
  { id: 2, options: JSON.stringify([
    { text: '有量化减排目标和行动计划', score: 10 },
    { text: '有计划但无量化目标', score: 5 },
    { text: '无减排计划', score: 0 }
  ])},
  { id: 3, options: JSON.stringify([
    { text: '近三年无环境污染事故', score: 10 },
    { text: '发生过一般事故', score: 5 },
    { text: '发生过重大污染事故', score: 0 }
  ])},
  { id: 4, options: JSON.stringify([
    { text: '完全遵守最低工资和工时规定', score: 10 },
    { text: '基本合规，偶有加班超时', score: 5 },
    { text: '存在合规问题', score: 0 }
  ])},
  { id: 5, options: JSON.stringify([
    { text: '完全禁止并有执行机制', score: 10 },
    { text: '有政策但执行不足', score: 5 },
    { text: '存在童工/强迫劳动问题', score: 0 }
  ])},
  { id: 6, options: JSON.stringify([
    { text: '有完善的申诉反馈机制', score: 10 },
    { text: '有基本沟通渠道', score: 5 },
    { text: '无申诉反馈机制', score: 0 }
  ])},
  { id: 7, options: JSON.stringify([
    { text: '已通过职业健康安全认证', score: 10 },
    { text: '已建立体系但未认证', score: 5 },
    { text: '未建立安全管理体系', score: 0 }
  ])},
  { id: 8, options: JSON.stringify([
    { text: '近三年无安全事故', score: 10 },
    { text: '发生过一般事故', score: 5 },
    { text: '发生过重大安全事故', score: 0 }
  ])},
  { id: 9, options: JSON.stringify([
    { text: '有完善反腐败政策和执行', score: 10 },
    { text: '有基本政策', score: 5 },
    { text: '无反腐败政策', score: 0 }
  ])},
  { id: 10, options: JSON.stringify([
    { text: '定期公开披露 ESG 信息', score: 10 },
    { text: '内部披露', score: 5 },
    { text: '不披露 ESG 信息', score: 0 }
  ])},
  { id: 11, options: JSON.stringify([
    { text: '完整核算并披露 Scope 1&2', score: 10 },
    { text: '部分核算披露', score: 5 },
    { text: '未核算碳排放', score: 0 }
  ])},
  { id: 12, options: JSON.stringify([
    { text: '可再生能源占比 > 30%', score: 10 },
    { text: '可再生能源占比 10%-30%', score: 5 },
    { text: '可再生能源占比 < 10%', score: 0 }
  ])},
  { id: 13, options: JSON.stringify([
    { text: '近三年无重大违法违规', score: 10 },
    { text: '有一般违规行为', score: 5 },
    { text: '有重大违法违规', score: 0 }
  ])},
  { id: 14, options: JSON.stringify([
    { text: '有完善的合规管理体系', score: 10 },
    { text: '有基本合规制度', score: 5 },
    { text: '无合规管理体系', score: 0 }
  ])}
];

const stmt = db.prepare('UPDATE questions SET options = ? WHERE id = ?');
questions.forEach(q => {
  stmt.run(q.options, q.id);
});

console.log('✅ 更新 ' + questions.length + ' 个问题的选项数据');
db.close();
