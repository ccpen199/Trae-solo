import sqlite3, json
from datetime import datetime

conn = sqlite3.connect('backend/data/app.sqlite')
c = conn.cursor()

entries = [
    (1, 'resume_padding', 'medium', json.dumps({'check_item': '项目经验时间重叠', 'detail': '大模型微调平台与RAG系统时间线存在2个月重叠', 'overlap_months': 2}, ensure_ascii=False)),
    (1, 'ai_generated', 'low', json.dumps({'check_item': 'AI生成内容初步检测', 'detail': '部分技术描述措辞模式与AI生成文本存在相似性', 'gltr_score': 0.28, 'suspicious_patterns': ['技术描述过于结构化', '量化指标呈现模式单一']}, ensure_ascii=False)),
    (2, 'exaggeration', 'high', json.dumps({'check_item': '项目成果夸大', 'detail': 'QPS提升200%的表述缺乏数据支撑，通常同类系统优化后QPS提升约50-80%', 'claim': 'QPS提升200%', 'industry_average': '50-80%'}, ensure_ascii=False)),
    (2, 'resume_padding', 'low', json.dumps({'check_item': '技能标签冗余', 'detail': '标注了10项技术技能但项目经验中仅涉及5项', 'claimed_skills': 10, 'verified_skills': 5, 'unverified': ['微服务', '分布式系统', '高并发', 'Docker', 'Kafka']}, ensure_ascii=False)),
    (3, 'ai_generated', 'medium', json.dumps({'check_item': 'GLTR统计特征分析', 'detail': '项目描述文本的词汇多样性偏低，Top-10常用词占比68%', 'gltr_top10_ratio': 0.68, 'expected_ratio': '0.45-0.55', 'suspicious_fragments': ['准确率达到95%']}, ensure_ascii=False)),
]

now = datetime.utcnow().isoformat()
for resume_id, check_type, severity, details in entries:
    c.execute('INSERT INTO anticheat_logs (resume_id, check_type, severity, details, created_at) VALUES (?, ?, ?, ?, ?)',
              (resume_id, check_type, severity, details, now))
    print(f'Added {check_type}/{severity} for resume {resume_id}')

flags_1 = json.dumps([
    {'type': 'time_overlap', 'severity': 'medium', 'message': '项目经验时间重叠', 'details': {'overlap_months': 2}},
    {'type': 'ai_suspected', 'severity': 'low', 'message': '部分内容疑似AI辅助', 'details': {'gltr_score': 0.28}}
], ensure_ascii=False)
flags_2 = json.dumps([
    {'type': 'exaggeration', 'severity': 'high', 'message': '项目成果可能夸大', 'details': {'claim': 'QPS提升200%'}},
    {'type': 'skill_inflation', 'severity': 'low', 'message': '技能标签可能冗余', 'details': {'claimed': 10, 'verified': 5}}
], ensure_ascii=False)
flags_3 = json.dumps([
    {'type': 'ai_generated', 'severity': 'medium', 'message': '部分描述疑似AI润色', 'details': {'gltr_top10_ratio': 0.68}}
], ensure_ascii=False)

c.execute('UPDATE resumes SET anticheat_flags = ? WHERE id = 1', [flags_1])
c.execute('UPDATE resumes SET anticheat_flags = ? WHERE id = 2', [flags_2])
c.execute('UPDATE resumes SET anticheat_flags = ? WHERE id = 3', [flags_3])
c.execute('UPDATE resumes SET ai_generated_score = 0.28 WHERE id = 1')
c.execute('UPDATE resumes SET ai_generated_score = 0.15 WHERE id = 2')
c.execute('UPDATE resumes SET ai_generated_score = 0.68 WHERE id = 3')

conn.commit()

c.execute('SELECT COUNT(*) FROM anticheat_logs')
print(f'Total anticheat_logs: {c.fetchone()[0]}')
c.execute('SELECT id, length(anticheat_flags), ai_generated_score FROM resumes')
for row in c.fetchall():
    print(f'Resume {row[0]}: flags_len={row[1]}, ai_score={row[2]}')
conn.close()
print('Done!')
