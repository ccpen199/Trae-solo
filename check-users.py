#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('data/app.sqlite')
cur = conn.cursor()

print('--- All users ---')
for row in cur.execute('SELECT id, username, name, role, cert_status FROM users'):
    print(f'  {row[0]:2d} {row[1]:10s} {row[2]:10s} {row[3]:10s} {row[4]}')

print()
print('--- Check role constraint ---')
for row in cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"):
    print(row[0][:400])

conn.close()
