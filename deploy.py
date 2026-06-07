#!/usr/bin/env python3
import os
import subprocess
import time
import re
import json
import urllib.request

PROJECT_DIR = os.path.abspath(os.path.dirname(__file__))

def run(cmd, **kwargs):
    result = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def check_port(port):
    stdout, _, _ = run(['lsof', '-nP', f'-iTCP:{port}', '-sTCP:LISTEN', '-t'])
    if stdout.strip():
        return int(stdout.strip().split('\n')[0])
    return None

def get_cwd(pid):
    stdout, _, _ = run(['lsof', '-p', str(pid), '-F', 'c'])
    for line in stdout.split('\n'):
        if line.startswith('c'):
            return line[1:]
    return None

def get_cmd(pid):
    stdout, _, _ = run(['ps', '-o', 'command=', '-p', str(pid)])
    return stdout.strip()

def kill_if_owned(pid, port):
    if not pid:
        return True
    
    cwd = get_cwd(pid)
    cmd = get_cmd(pid)
    
    print(f"  PID={pid}, cwd={cwd}, cmd={cmd[:60] if cmd else 'N/A'}")
    
    # 同时检查cwd和cmd是否属于当前项目
    cwd_match = cwd and cwd.startswith(PROJECT_DIR)
    cmd_match = cmd and PROJECT_DIR in cmd
    
    if cwd_match or cmd_match:
        print(f"  ✓ 属于当前项目，终止进程")
        run(['kill', str(pid)])
        time.sleep(2)
        return True
    else:
        print(f"  ✗ 不属于当前项目，跳过")
        return False

def find_available_ports():
    tail4 = 8991
    for slot in range(6):
        fport = 40000 + slot * 1000 + tail4
        bport = 50000 + slot * 1000 + tail4
        
        print(f"\n槽位{slot}: 前端{fport}, 后端{bport}")
        
        fpid = check_port(fport)
        bpid = check_port(bport)
        
        if not fpid and not bpid:
            print(f"  ✓ 两端口都空闲")
            return fport, bport
        
        can_use = True
        if fpid:
            print(f"  前端端口{fport}被占用:")
            if not kill_if_owned(fpid, fport):
                can_use = False
        
        if bpid:
            print(f"  后端端口{bport}被占用:")
            if not kill_if_owned(bpid, bport):
                can_use = False
        
        if can_use:
            # 再次检查
            time.sleep(1)
            if not check_port(fport) and not check_port(bport):
                print(f"  ✓ 端口已释放")
                return fport, bport
    
    print("\n❌ 所有槽位都被占用且无法释放！")
    raise Exception("No available ports")

def update_env(fport, bport):
    env_path = os.path.join(PROJECT_DIR, '.env')
    with open(env_path, 'r') as f:
        content = f.read()
    
    updates = [
        (r'FRONTEND_PORT=\d+', f'FRONTEND_PORT={fport}'),
        (r'BACKEND_PORT=\d+', f'BACKEND_PORT={bport}'),
        (r'API_BASE_URL=http://[^:]+:\d+', f'API_BASE_URL=http://127.0.0.1:{bport}'),
        (r'VITE_API_BASE_URL=http://[^:]+:\d+', f'VITE_API_BASE_URL=http://127.0.0.1:{bport}'),
    ]
    
    for pattern, replacement in updates:
        content = re.sub(pattern, replacement, content)
    
    with open(env_path, 'w') as f:
        f.write(content)
    
    print(f"\n✓ 已更新.env: 前端={fport}, 后端={bport}")

def start_service(name, script, port):
    print(f"\n启动{name}服务...")
    log_file = os.path.join(PROJECT_DIR, f'{name}.log')
    
    proc = subprocess.Popen(
        ['node', script],
        cwd=PROJECT_DIR,
        stdout=open(log_file, 'w'),
        stderr=subprocess.STDOUT,
        start_new_session=True
    )
    return proc.pid

def wait_for_port(port, name, timeout=15):
    print(f"等待{name}端口{port}...", end="", flush=True)
    for i in range(timeout):
        if check_port(port):
            print(" ✓")
            return True
        time.sleep(1)
        print(".", end="", flush=True)
    print(" ✗")
    return False

def test_api(name, url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        resp = urllib.request.urlopen(req, timeout=5)
        result = json.loads(resp.read())
        print(f"  ✓ {name}")
        return result
    except Exception as e:
        print(f"  ✗ {name}: {e}")
        return None

def main():
    print(f"项目目录: {PROJECT_DIR}")
    print("=" * 50)
    
    # 1. 查找可用端口
    fport, bport = find_available_ports()
    update_env(fport, bport)
    
    # 2. 启动服务
    backend_pid = start_service('backend', 'start-backend.js', bport)
    frontend_pid = start_service('frontend', 'start-frontend.js', fport)
    
    print(f"后端PID: {backend_pid}")
    print(f"前端PID: {frontend_pid}")
    
    # 3. 等待端口就绪
    backend_ok = wait_for_port(bport, '后端')
    frontend_ok = wait_for_port(fport, '前端')
    
    time.sleep(2)
    
    # 4. 验证服务
    print("\n" + "=" * 50)
    print("服务验证")
    print("=" * 50)
    
    # 检查进程状态
    for pid, name in [(backend_pid, '后端'), (frontend_pid, '前端')]:
        stdout, _, _ = run(['ps', '-o', 'stat=', '-p', str(pid)])
        stat = stdout.strip()
        if stat in ['T', 'Z']:
            print(f"  ✗ {name}进程状态异常: {stat}")
        else:
            print(f"  ✓ {name}进程状态正常: {stat}")
    
    # 检查HTTP
    print("\nHTTP 验证:")
    test_api('后端健康检查', f'http://127.0.0.1:{bport}/api/health')
    
    # 测试登录
    print("\n业务接口验证:")
    result = test_api('新人登录', f'http://127.0.0.1:{bport}/api/auth/login', 'POST', 
                      {'phone': '13800138001', 'password': '123456'})
    if result:
        token = result.get('token')
        print(f"    用户: {result['user']['name']}")
        test_api('获取新人资料', f'http://127.0.0.1:{bport}/api/couple/profile', token=token)
        test_api('获取备婚攻略', f'http://127.0.0.1:{bport}/api/guides', token=token)
    
    result = test_api('商家登录', f'http://127.0.0.1:{bport}/api/auth/login', 'POST',
                      {'phone': '13800138002', 'password': '123456'})
    if result:
        token = result.get('token')
        print(f"    商家: {result['user']['name']}")
        test_api('商家工作台', f'http://127.0.0.1:{bport}/api/merchant/dashboard', token=token)
    
    result = test_api('管理员登录', f'http://127.0.0.1:{bport}/api/auth/login', 'POST',
                      {'phone': '13800138000', 'password': '123456'})
    if result:
        token = result.get('token')
        test_api('平台统计', f'http://127.0.0.1:{bport}/api/admin/stats', token=token)
    
    print("\n" + "=" * 50)
    print("✅ 服务启动完成")
    print(f"前端地址: http://127.0.0.1:{fport}/")
    print(f"后端地址: http://127.0.0.1:{bport}/")
    print("=" * 50)

if __name__ == '__main__':
    main()
