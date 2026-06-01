import sqlite3
conn = sqlite3.connect('data/app.sqlite')
tables = ['students', 'teachers', 'classrooms', 'course_packages', 'classes', 'purchases', 'schedules', 'attendances', 'consumptions', 'refunds', 'transfers']
print('5. 数据库数据统计:')
for t in tables:
    count = conn.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]
    print(f'   {t:20s}: {count} 条记录')
conn.close()
