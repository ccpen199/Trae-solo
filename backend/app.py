from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import datetime, timedelta
import sqlite3
import hashlib
import json
import os
import uuid

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'charity-transparency-secret-key-2024'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

CORS(app, resources={r"/*": {"origins": "http://localhost:11095"}}, supports_credentials=True)
jwt = JWTManager(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'app.sqlite')

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            verified INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            ngo_id TEXT NOT NULL,
            ngo_name TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            start_date TEXT,
            end_date TEXT,
            category TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT,
            FOREIGN KEY (ngo_id) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS milestones (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            target_amount REAL NOT NULL,
            actual_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            deadline TEXT,
            completed_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS donations (
            id TEXT PRIMARY KEY,
            track_id TEXT UNIQUE NOT NULL,
            donor_id TEXT NOT NULL,
            donor_name TEXT NOT NULL,
            project_id TEXT NOT NULL,
            project_title TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'processing',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT,
            FOREIGN KEY (donor_id) REFERENCES users(id),
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS certificates (
            id TEXT PRIMARY KEY,
            donation_id TEXT NOT NULL,
            donor_name TEXT NOT NULL,
            project_title TEXT NOT NULL,
            amount REAL NOT NULL,
            certificate_no TEXT UNIQUE NOT NULL,
            issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT,
            FOREIGN KEY (donation_id) REFERENCES donations(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            milestone_id TEXT,
            name TEXT NOT NULL,
            description TEXT,
            executor_id TEXT,
            executor_name TEXT,
            amount REAL,
            status TEXT DEFAULT 'pending',
            vendor_name TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (milestone_id) REFERENCES milestones(id),
            FOREIGN KEY (executor_id) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vouchers (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            voucher_type TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            uploaded_by TEXT NOT NULL,
            uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT,
            FOREIGN KEY (task_id) REFERENCES tasks(id),
            FOREIGN KEY (uploaded_by) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            amount REAL NOT NULL,
            vendor_name TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            paid_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT,
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audits (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            auditor_id TEXT NOT NULL,
            auditor_name TEXT NOT NULL,
            report_summary TEXT,
            status TEXT DEFAULT 'pending',
            started_at TEXT,
            completed_at TEXT,
            white_paper_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (auditor_id) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS white_papers (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            audit_id TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            document_hash TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (audit_id) REFERENCES audits(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            action TEXT NOT NULL,
            actor_id TEXT NOT NULL,
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            target_type TEXT,
            target_id TEXT,
            details TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            signature TEXT
        )
    ''')
    
    cursor.execute('SELECT COUNT(*) as count FROM users')
    if cursor.fetchone()['count'] == 0:
        from werkzeug.security import generate_password_hash
        
        demo_users = [
            ('ngo001', generate_password_hash('123456'), 'ngo', '阳光公益基金会', 'contact@sunngo.org', '13800138001', 1),
            ('donor001', generate_password_hash('123456'), 'donor', '张三', 'zhangsan@example.com', '13900139001', 1),
            ('executor001', generate_password_hash('123456'), 'executor', '李四', 'lisi@example.com', '13700137001', 1),
            ('auditor001', generate_password_hash('123456'), 'auditor', '王审计', 'wang@audit.com', '13600136001', 1),
        ]
        
        for username, password, role, name, email, phone, verified in demo_users:
            user_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO users (id, username, password, role, name, email, phone, verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, username, password, role, name, email, phone, verified))
    
    conn.commit()
    conn.close()

def generate_signature(data):
    content = json.dumps(data, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256((content + app.config['JWT_SECRET_KEY']).encode()).hexdigest()

def generate_track_id():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = uuid.uuid4().hex[:6].upper()
    return f'DT-{timestamp}-{random_part}'

def generate_certificate_no():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = uuid.uuid4().hex[:4].upper()
    return f'CERT-{timestamp}-{random_part}'

def log_audit(action, actor, target_type=None, target_id=None, details=None):
    conn = get_db()
    cursor = conn.cursor()
    log_id = str(uuid.uuid4())
    log_data = {
        'id': log_id,
        'action': action,
        'actor_id': actor['id'],
        'actor_name': actor['name'],
        'actor_role': actor['role'],
        'target_type': target_type,
        'target_id': target_id,
        'details': details,
        'timestamp': datetime.now().isoformat()
    }
    signature = generate_signature(log_data)
    cursor.execute('''
        INSERT INTO audit_logs (id, action, actor_id, actor_name, actor_role, target_type, target_id, details, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (log_id, action, actor['id'], actor['name'], actor['role'], target_type, target_id, details, signature))
    conn.commit()
    conn.close()

from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM users WHERE username = ?', (data['username'],))
    if cursor.fetchone():
        conn.close()
        return jsonify({'success': False, 'message': '用户名已存在'}), 400
    
    user_id = str(uuid.uuid4())
    password_hash = generate_password_hash(data['password'])
    
    user_data = {
        'id': user_id,
        'username': data['username'],
        'role': data['role'],
        'name': data['name'],
        'email': data.get('email'),
        'phone': data.get('phone'),
        'verified': 0,
        'created_at': datetime.now().isoformat()
    }
    
    signature = generate_signature(user_data)
    
    cursor.execute('''
        INSERT INTO users (id, username, password, role, name, email, phone, verified, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    ''', (user_id, data['username'], password_hash, data['role'], data['name'], 
          data.get('email'), data.get('phone'), signature))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': '注册成功', 'user_id': user_id})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE username = ?', (data['username'],))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'success': False, 'message': '用户名或密码错误'}), 401
    
    if user['verified'] == 0 and user['role'] in ['ngo', 'auditor']:
        return jsonify({'success': False, 'message': '账户尚未审核通过'}), 403
    
    access_token = create_access_token(identity=user['id'])
    
    log_audit('login', dict(user), 'user', user['id'], '用户登录系统')
    
    return jsonify({
        'success': True,
        'access_token': access_token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone']
        }
    })

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone']
        }
    })

@app.route('/api/projects', methods=['GET'])
def list_projects():
    status = request.args.get('status')
    conn = get_db()
    cursor = conn.cursor()
    
    if status:
        cursor.execute('SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC', (status,))
    else:
        cursor.execute('SELECT * FROM projects ORDER BY created_at DESC')
    
    projects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'success': True, 'projects': projects})

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
    project = cursor.fetchone()
    
    if not project:
        conn.close()
        return jsonify({'success': False, 'message': '项目不存在'}), 404
    
    cursor.execute('SELECT * FROM milestones WHERE project_id = ? ORDER BY created_at', (project_id,))
    milestones = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC', (project_id,))
    tasks = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'success': True,
        'project': dict(project),
        'milestones': milestones,
        'tasks': tasks
    })

@app.route('/api/projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if user['role'] != 'ngo':
        conn.close()
        return jsonify({'success': False, 'message': '只有公益机构可以发布项目'}), 403
    
    if user['verified'] == 0:
        conn.close()
        return jsonify({'success': False, 'message': '账户尚未审核通过'}), 403
    
    project_id = str(uuid.uuid4())
    
    project_data = {
        'id': project_id,
        'title': data['title'],
        'description': data['description'],
        'target_amount': data['target_amount'],
        'current_amount': 0,
        'ngo_id': user_id,
        'ngo_name': user['name'],
        'status': 'pending',
        'start_date': data.get('start_date'),
        'end_date': data.get('end_date'),
        'category': data.get('category'),
        'created_at': datetime.now().isoformat()
    }
    
    signature = generate_signature(project_data)
    
    cursor.execute('''
        INSERT INTO projects (id, title, description, target_amount, current_amount, ngo_id, ngo_name, 
                              status, start_date, end_date, category, created_at, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    ''', (project_id, data['title'], data['description'], data['target_amount'], 0, 
          user_id, user['name'], data.get('start_date'), data.get('end_date'), 
          data.get('category'), project_data['created_at'], signature))
    
    conn.commit()
    
    log_audit('create_project', dict(user), 'project', project_id, f'创建项目: {data["title"]}')
    
    conn.close()
    
    return jsonify({'success': True, 'message': '项目已提交，等待审核', 'project_id': project_id})

@app.route('/api/projects/<project_id>/approve', methods=['POST'])
@jwt_required()
def approve_project(project_id):
    user_id = get_jwt_identity()
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if user['role'] not in ['auditor', 'ngo']:
        conn.close()
        return jsonify({'success': False, 'message': '无权限审核项目'}), 403
    
    cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
    project = cursor.fetchone()
    
    if not project:
        conn.close()
        return jsonify({'success': False, 'message': '项目不存在'}), 404
    
    if project['status'] != 'pending':
        conn.close()
        return jsonify({'success': False, 'message': '项目状态不允许审核'}), 400
    
    updated_data = {
        'id': project_id,
        'status': 'fundraising',
        'updated_at': datetime.now().isoformat()
    }
    
    new_signature = generate_signature(dict(project) | updated_data)
    
    cursor.execute('UPDATE projects SET status = ?, signature = ? WHERE id = ?', 
                   ('fundraising', new_signature, project_id))
    
    conn.commit()
    
    log_audit('approve_project', dict(user), 'project', project_id, f'审核通过项目: {project["title"]}')
    
    conn.close()
    
    return jsonify({'success': True, 'message': '项目已审核通过，开始募集'})

@app.route('/api/projects/<project_id>/milestones', methods=['POST'])
@jwt_required()
def add_milestone(project_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
    project = cursor.fetchone()
    
    if not project:
        conn.close()
        return jsonify({'success': False, 'message': '项目不存在'}), 404
    
    if user['role'] != 'ngo' or project['ngo_id'] != user_id:
        conn.close()
        return jsonify({'success': False, 'message': '无权限操作'}), 403
    
    milestone_id = str(uuid.uuid4())
    
    milestone_data = {
        'id': milestone_id,
        'project_id': project_id,
        'name': data['name'],
        'description': data.get('description'),
        'target_amount': data['target_amount'],
        'actual_amount': 0,
        'status': 'pending',
        'deadline': data.get('deadline'),
        'created_at': datetime.now().isoformat()
    }
    
    signature = generate_signature(milestone_data)
    
    cursor.execute('''
        INSERT INTO milestones (id, project_id, name, description, target_amount, actual_amount, 
                               status, deadline, created_at, signature)
        VALUES (?, ?, ?, ?, ?, 0, 'pending', ?, ?, ?)
    ''', (milestone_id, project_id, data['name'], data.get('description'), 
          data['target_amount'], data.get('deadline'), milestone_data['created_at'], signature))
    
    conn.commit()
    
    log_audit('add_milestone', dict(user), 'milestone', milestone_id, f'添加里程碑: {data["name"]}')
    
    conn.close()
    
    return jsonify({'success': True, 'message': '里程碑已添加', 'milestone_id': milestone_id})

@app.route('/api/donations', methods=['POST'])
@jwt_required()
def create_donation():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    cursor.execute('SELECT * FROM projects WHERE id = ?', (data['project_id'],))
    project = cursor.fetchone()
    
    if not project:
        conn.close()
        return jsonify({'success': False, 'message': '项目不存在'}), 404
    
    if project['status'] != 'fundraising':
        conn.close()
        return jsonify({'success': False, 'message': '项目不在募集中'}), 400
    
    donation_id = str(uuid.uuid4())
    track_id = generate_track_id()
    
    donation_data = {
        'id': donation_id,
        'track_id': track_id,
        'donor_id': user_id,
        'donor_name': user['name'],
        'project_id': data['project_id'],
        'project_title': project['title'],
        'amount': data['amount'],
        'status': 'completed',
        'created_at': datetime.now().isoformat()
    }
    
    signature = generate_signature(donation_data)
    
    cursor.execute('''
        INSERT INTO donations (id, track_id, donor_id, donor_name, project_id, project_title, 
                               amount, status, created_at, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
    ''', (donation_id, track_id, user_id, user['name'], data['project_id'], 
          project['title'], data['amount'], donation_data['created_at'], signature))
    
    new_amount = project['current_amount'] + data['amount']
    
    project_update_data = dict(project)
    project_update_data['current_amount'] = new_amount
    new_project_signature = generate_signature(project_update_data)
    
    cursor.execute('UPDATE projects SET current_amount = ?, signature = ? WHERE id = ?', 
                   (new_amount, new_project_signature, data['project_id']))
    
    cert_id = str(uuid.uuid4())
    certificate_no = generate_certificate_no()
    
    cert_data = {
        'id': cert_id,
        'donation_id': donation_id,
        'donor_name': user['name'],
        'project_title': project['title'],
        'amount': data['amount'],
        'certificate_no': certificate_no,
        'issued_at': datetime.now().isoformat()
    }
    
    cert_signature = generate_signature(cert_data)
    
    cursor.execute('''
        INSERT INTO certificates (id, donation_id, donor_name, project_title, amount, 
                                  certificate_no, issued_at, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (cert_id, donation_id, user['name'], project['title'], data['amount'], 
          certificate_no, cert_data['issued_at'], cert_signature))
    
    conn.commit()
    
    log_audit('donate', dict(user), 'donation', donation_id, 
              f'向项目 {project["title"]} 捐赠 {data["amount"]} 元')
    
    conn.close()
    
    return jsonify({
        'success': True, 
        'message': '捐赠成功',
        'donation_id': donation_id,
        'track_id': track_id,
        'certificate_no': certificate_no
    })

@app.route('/api/donations/my', methods=['GET'])
@jwt_required()
def get_my_donations():
    user_id = get_jwt_identity()
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT d.*, c.certificate_no 
        FROM donations d 
        LEFT JOIN certificates c ON d.id = c.donation_id 
        WHERE d.donor_id = ? 
        ORDER BY d.created_at DESC
    ''', (user_id,))
    
    donations = []
    for row in cursor.fetchall():
        donation = dict(row)
        donations.append(donation)
    
    conn.close()
    
    return jsonify({'success': True, 'donations': donations})

@app.route('/api/donations/track/<track_id>', methods=['GET'])
def track_donation(track_id):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM donations WHERE track_id = ?', (track_id,))
    donation = cursor.fetchone()
    
    if not donation:
        conn.close()
        return jsonify({'success': False, 'message': '捐赠记录不存在'}), 404
    
    cursor.execute('SELECT * FROM certificates WHERE donation_id = ?', (donation['id'],))
    certificate = cursor.fetchone()
    
    cursor.execute('''
        SELECT t.*, v.id as voucher_id, v.voucher_type, v.file_name
        FROM tasks t
        LEFT JOIN vouchers v ON t.id = v.task_id
        WHERE t.project_id = ?
        ORDER BY t.created_at DESC
    ''', (donation['project_id'],))
    
    tasks = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute('''
        SELECT p.*, t.name as task_name
        FROM payments p
        JOIN tasks t ON p.task_id = t.id
        WHERE t.project_id = ?
        ORDER BY p.created_at DESC
    ''', (donation['project_id'],))
    
    payments = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'success': True,
        'donation': dict(donation),
        'certificate': dict(certificate) if certificate else None,
        'tasks': tasks,
        'payments': payments
    })

@app.route('/api/tasks', methods=['POST'])
@jwt_required()
def create_task():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    cursor.execute('SELECT * FROM projects WHERE id = ?', (data['project_id'],))
    project = cursor.fetchone()
    
    if not project:
        conn.close()
        return jsonify({'success': False, 'message': '项目不存在'}), 404
    
    if user['role'] != 'ngo' or project['ngo_id'] != user_id:
        conn.close()
        return jsonify({'success': False, 'message': '无权限操作'}), 403
    
    task_id = str(uuid.uuid4())
    
    task_data = {
        'id': task_id,
        'project_id': data['project_id'],
        'milestone_id': data.get('milestone_id'),
        'name': data['name'],
        'description': data.get('description'),
        'amount': data.get('amount'),
        'status': 'pending',
        'vendor_name': data.get('vendor_name'),
        'created_at': datetime.now().isoformat()
    }
    
    signature = generate_signature(task_data)
    
    cursor.execute('''
        INSERT INTO tasks (id, project_id, milestone_id, name, description, amount, 
                          status, vendor_name, created_at, signature)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    ''', (task_id, data['project_id'], data.get('milestone_id'), data['name'], 
          data.get('description'), data.get('amount'), data.get('vendor_name'), 
          task_data['created_at'], signature))
    
    conn.commit()
    
    log_audit('create_task', dict(user), 'task', task_id, f'创建任务: {data["name"]}')
    
    conn.close()
    
    return jsonify({'success': True, 'message': '任务已创建', 'task_id': task_id})

@app.route('/api/tasks/<task_id>/assign', methods=['POST'])
@jwt_required()
def assign_task(task_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
    task = cursor.fetchone()
    
    if not task:
        conn.close()
        return jsonify({'success': False, 'message': '任务不存在'}), 404
    
    cursor.execute('SELECT * FROM projects WHERE id = ?', (task['project_id'],))
    project = cursor.fetchone()
    
    if user['role'] != 'ngo' or project['ngo_id'] != user_id:
        conn.close()
        return jsonify({'success': False, 'message': '无权限操作'}), 403
    
    cursor.execute('SELECT * FROM users WHERE id = ? AND role = "executor"', (data['executor_id'],))
    executor = cursor.fetchone()
    
    if not executor:
        conn.close()
        return jsonify({'success': False, 'message': '执行人不存在'}), 404
    
    updated_task = dict(task)
    updated_task['executor_id'] = data['executor_id']
    updated_task['executor_name'] = executor['name']
    updated_task['status'] = 'in_progress'
    
    new_signature = generate_signature(updated_task)
    
    cursor.execute('''
        UPDATE tasks SET executor_id = ?, executor_name = ?, status = 'in_progress', signature = ? 
        WHERE id = ?
    ''', (data['executor_id'], executor['name'], new_signature, task_id))
    
    conn.commit()
    
    log_audit('assign_task', dict(user), 'task', task_id, 
              f'分配任务给执行人: {executor["name"]}')
    
    conn.close()
    
    return jsonify({'success': True, 'message': '任务已分配'})

@app.route('/api/tasks/my', methods=['GET'])
@jwt_required()
def get_my_tasks():
    user_id = get_jwt_identity()
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT t.*, p.title as project_title
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE t.executor_id = ?
        ORDER BY t.created_at DESC
    ''', (user_id,))
    
    tasks = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'success': True, 'tasks': tasks})

@app.route('/api/tasks/<task_id>/upload', methods=['POST'])
@jwt_required()
def upload_voucher(task_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
    task = cursor.fetchone()
    
    if not task:
        conn.close()
        return jsonify({'success': False, 'message': '任务不存在'}), 404
    
    if task['executor_id'] != user_id and user['role'] not in ['ngo', 'executor']:
        conn.close()
        return jsonify({'success': False, 'message': '无权限操作'}), 403
    
    voucher_id = str(uuid.uuid4())
    
    voucher_data = {
        'id': voucher_id,
        'task_id': task_id,
        'voucher_type': data['voucher_type'],
        'file_name': data['file_name'],
        'file_path': f'/uploads/{voucher_id}_{data["file_name"]}',
        'uploaded_by': user_id,
        'uploaded_at': datetime.now().isoformat()
    }
    
    signature = generate_signature(voucher_data)
    
    cursor.execute('''
        INSERT INTO vouchers (id, task_id, voucher_type, file_name, file_path, uploaded_by, uploaded_at, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (voucher_id, task_id, data['voucher_type'], data['file_name'], 
          voucher_data['file_path'], user_id, voucher_data['uploaded_at'], signature))
    
    updated_task = dict(task)
    updated_task['status'] = 'submitted'
    new_task_signature = generate_signature(updated_task)
    
    cursor.execute('UPDATE tasks SET status = "submitted", signature = ? WHERE id = ?', 
                   (new_task_signature, task_id))
    
    conn.commit()
    
    log_audit('upload_voucher', dict(user), 'voucher', voucher_id, 
              f'上传凭证类型: {data["voucher_type"]}')
    
    conn.close()
    
    return jsonify({'success': True, 'message': '凭证已上传', 'voucher_id': voucher_id})

@app.route('/api/tasks/<task_id>/approve', methods=['POST'])
@jwt_required()
def approve_task(task_id):
    user_id = get_jwt_identity()
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
    task = cursor.fetchone()
    
    if not task:
        conn.close()
        return jsonify({'success': False, 'message': '任务不存在'}), 404
    
    cursor.execute('SELECT * FROM projects WHERE id = ?', (task['project_id'],))
    project = cursor.fetchone()
    
    if user['role'] != 'ngo' or project['ngo_id'] != user_id:
        conn.close()
        return jsonify({'success': False, 'message': '无权限操作'}), 403
    
    updated_task = dict(task)
    updated_task['status'] = 'approved'
    new_task_signature = generate_signature(updated_task)
    
    cursor.execute('UPDATE tasks SET status = "approved", signature = ? WHERE id = ?', 
                   (new_task_signature, task_id))
    
    if task['amount'] and task['vendor_name']:
        payment_id = str(uuid.uuid4())
        
        payment_data = {
            'id': payment_id,
            'task_id': task_id,
            'amount': task['amount'],
            'vendor_name': task['vendor_name'],
            'status': 'completed',
            'paid_at': datetime.now().isoformat(),
            'created_at': datetime.now().isoformat()
        }
        
        payment_signature = generate_signature(payment_data)
        
        cursor.execute('''
            INSERT INTO payments (id, task_id, amount, vendor_name, status, paid_at, created_at, signature)
            VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)
        ''', (payment_id, task_id, task['amount'], task['vendor_name'], 
              payment_data['paid_at'], payment_data['created_at'], payment_signature))
        
        log_audit('create_payment', dict(user), 'payment', payment_id, 
                  f'向供应商 {task["vendor_name"]} 支付 {task["amount"]} 元')
    
    conn.commit()
    
    log_audit('approve_task', dict(user), 'task', task_id, f'审核通过任务: {task["name"]}')
    
    conn.close()
    
    return jsonify({'success': True, 'message': '任务已审核通过，款项已拨付'})

@app.route('/api/audits', methods=['POST'])
@jwt_required()
def create_audit():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if user['role'] != 'auditor':
        conn.close()
        return jsonify({'success': False, 'message': '只有审计师可以创建审计'}), 403
    
    cursor.execute('SELECT * FROM projects WHERE id = ?', (data['project_id'],))
    project = cursor.fetchone()
    
    if not project:
        conn.close()
        return jsonify({'success': False, 'message': '项目不存在'}), 404
    
    audit_id = str(uuid.uuid4())
    
    audit_data = {
        'id': audit_id,
        'project_id': data['project_id'],
        'auditor_id': user_id,
        'auditor_name': user['name'],
        'status': 'in_progress',
        'started_at': datetime.now().isoformat(),
        'created_at': datetime.now().isoformat()
    }
    
    signature = generate_signature(audit_data)
    
    cursor.execute('''
        INSERT INTO audits (id, project_id, auditor_id, auditor_name, status, started_at, created_at, signature)
        VALUES (?, ?, ?, ?, 'in_progress', ?, ?, ?)
    ''', (audit_id, data['project_id'], user_id, user['name'], 
          audit_data['started_at'], audit_data['created_at'], signature))
    
    conn.commit()
    
    log_audit('create_audit', dict(user), 'audit', audit_id, f'开始审计项目: {project["title"]}')
    
    conn.close()
    
    return jsonify({'success': True, 'message': '审计已开始', 'audit_id': audit_id})

@app.route('/api/audits/<audit_id>/complete', methods=['POST'])
@jwt_required()
def complete_audit(audit_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if user['role'] != 'auditor':
        conn.close()
        return jsonify({'success': False, 'message': '只有审计师可以完成审计'}), 403
    
    cursor.execute('SELECT * FROM audits WHERE id = ?', (audit_id,))
    audit = cursor.fetchone()
    
    if not audit:
        conn.close()
        return jsonify({'success': False, 'message': '审计不存在'}), 404
    
    cursor.execute('SELECT * FROM projects WHERE id = ?', (audit['project_id'],))
    project = cursor.fetchone()
    
    cursor.execute('SELECT * FROM donations WHERE project_id = ?', (audit['project_id'],))
    donations = cursor.fetchall()
    
    cursor.execute('SELECT * FROM tasks WHERE project_id = ?', (audit['project_id'],))
    tasks = cursor.fetchall()
    
    cursor.execute('SELECT * FROM payments WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)', (audit['project_id'],))
    payments = cursor.fetchall()
    
    white_paper_id = str(uuid.uuid4())
    
    white_paper_content = f'''
# 公益项目审计白皮书

## 项目基本信息
- 项目名称：{project['title']}
- 执行机构：{project['ngo_name']}
- 目标金额：{project['target_amount']} 元
- 实际募集：{project['current_amount']} 元
- 项目状态：已结项

## 捐赠明细
共收到 {len(donations)} 笔捐赠，总金额 {project['current_amount']} 元

## 执行明细
共执行 {len(tasks)} 个任务

## 支付明细
共支付 {len(payments)} 笔款项

## 审计结论
{data.get('report_summary', '经审计，该项目财务记录完整，凭证齐全，符合公益项目透明化要求。')}

---
审计师：{user['name']}
审计日期：{datetime.now().strftime('%Y-%m-%d')}
'''
    
    document_hash = hashlib.sha256(white_paper_content.encode()).hexdigest()
    
    white_paper_data = {
        'id': white_paper_id,
        'project_id': audit['project_id'],
        'audit_id': audit_id,
        'title': f'{project["title"]} - 审计白皮书',
        'content': white_paper_content,
        'document_hash': document_hash,
        'created_at': datetime.now().isoformat()
    }
    
    wp_signature = generate_signature(white_paper_data)
    
    cursor.execute('''
        INSERT INTO white_papers (id, project_id, audit_id, title, content, document_hash, created_at, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (white_paper_id, audit['project_id'], audit_id, white_paper_data['title'], 
          white_paper_content, document_hash, white_paper_data['created_at'], wp_signature))
    
    updated_audit = dict(audit)
    updated_audit['status'] = 'completed'
    updated_audit['report_summary'] = data.get('report_summary')
    updated_audit['completed_at'] = datetime.now().isoformat()
    updated_audit['white_paper_id'] = white_paper_id
    
    new_audit_signature = generate_signature(updated_audit)
    
    cursor.execute('''
        UPDATE audits SET status = 'completed', report_summary = ?, completed_at = ?, white_paper_id = ?, signature = ?
        WHERE id = ?
    ''', (data.get('report_summary'), updated_audit['completed_at'], white_paper_id, 
          new_audit_signature, audit_id))
    
    updated_project = dict(project)
    updated_project['status'] = 'completed'
    new_project_signature = generate_signature(updated_project)
    
    cursor.execute('UPDATE projects SET status = "completed", signature = ? WHERE id = ?', 
                   (new_project_signature, audit['project_id']))
    
    conn.commit()
    
    log_audit('complete_audit', dict(user), 'audit', audit_id, f'完成审计，生成白皮书')
    
    conn.close()
    
    return jsonify({
        'success': True, 
        'message': '审计已完成，白皮书已生成，项目已结项',
        'white_paper_id': white_paper_id
    })

@app.route('/api/white-papers/<wp_id>', methods=['GET'])
def get_white_paper(wp_id):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM white_papers WHERE id = ?', (wp_id,))
    white_paper = cursor.fetchone()
    
    conn.close()
    
    if not white_paper:
        return jsonify({'success': False, 'message': '白皮书不存在'}), 404
    
    return jsonify({'success': True, 'white_paper': dict(white_paper)})

@app.route('/api/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    user_id = get_jwt_identity()
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if user['role'] not in ['auditor', 'ngo']:
        conn.close()
        return jsonify({'success': False, 'message': '无权限查看'}), 403
    
    cursor.execute('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100')
    logs = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({'success': True, 'logs': logs})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as count FROM projects WHERE status = "fundraising"')
    active_projects = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM projects WHERE status = "completed"')
    completed_projects = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM donations')
    total_donations = cursor.fetchone()['count']
    
    cursor.execute('SELECT SUM(amount) as total FROM donations')
    total_amount = cursor.fetchone()['total'] or 0
    
    cursor.execute('SELECT COUNT(*) as count FROM users WHERE role = "donor"')
    donor_count = cursor.fetchone()['count']
    
    conn.close()
    
    return jsonify({
        'success': True,
        'stats': {
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'total_donations': total_donations,
            'total_amount': total_amount,
            'donor_count': donor_count
        }
    })

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=11094, debug=False)
