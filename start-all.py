#!/usr/bin/env python3
import os
import subprocess
import time
import sys
import re

PROJECT_DIR = os.path.abspath(os.path.dirname(__file__))

def get_process_cwd(pid):
    try:
        result = subprocess.run(
            ['lsof', '-p', str(pid), '-F', 'c'],
            capture_output=True, text=True
        )
        for line in result.stdout.split('\n'):
            if line.startswith('c'):
                return line[1:]
    except:
        pass
    return None

def get_process_cmd(pid):
    try:
        result = subprocess.run(
            ['ps', '-o', 'command=', '-p', str(pid)],
            capture_output=True, text=True
        )
        return result.stdout.strip()
    except:
        return None

def kill_if_owned(pid, port_name):
    if not pid:
        return True
    
    cwd = get_process_cwd(pid)
    cmd = get_process_cmd(pid)
    
    print(f"  {port_name} PID={pid}, cwd={cwd}, cmd={cmd[:50] if cmd else 'N/A'}")
    
    if cwd and cwd.startswith(PROJECT_DIR):
        print(f"  ✓ 属于当前项目，终止进程...")
        subprocess.run(['kill', str(pid)])
        time.sleep(2)
        return True
    else:
        print(f"  ✗ 不属于当前项目，跳过")
        return False

def find_available_port():
    tail4 = 8991
    slots = [0, 1, 2, 3, 4, 5]
    
    for slot in slots:
        fport = 40000 + slot * 1000 + tail4
        bport = 50000 + slot * 1000 + tail4
        
        print(f"\n检查槽位{slot}: 前端{fport}, 后端{bport}")
        
        fpid = None
        bpid = None
        
        try:
            result = subprocess.run(
                ['lsof', '-nP', '-iTCP:{}'.format(fport), '-sTCP:LISTEN', '-t'],
                capture_output=True, text=True
            )
            if result.stdout.strip():
                fpid = int(result.stdout.strip().split('\n')[0])
            
            result = subprocess.run(
                ['lsof', '-nP', '-iTCP:{}'.format(bport), '-sTCP:LISTEN', '-t'],
                capture_output=True, text=True
            )
            if result.stdout.strip():
                bpid = int(result.stdout.strip().split('\n')[0])
        except:
            pass
        
        if not fpid and not bpid:
            print(f"  ✓ 两个端口都空闲")
            return fport, bport
        
        if fpid:
            if not kill_if_owned(fpid, f"前端{fport}"):
                continue
        
        if bpid:
            if not kill_if_owned(bpid, f"后端{bport}"):
                continue
        
        return fport, bport
    
    print("\n所有槽位都被占用且无法释放！")
    sys.exit(1)

def update_env(fport, bport):
    env_path = os.path.join(PROJECT_DIR, '.env')
    with open(env_path, 'r') as f:
        content = f.read()
    
    content = re.sub(r'FRONTEND_PORT=\d+', f'FRONTEND_PORT={fport}', content)
    content = re.sub(r'BACKEND_PORT=\d+', f'BACKEND_PORT={bport}', content)
    content = re.sub(r'API_BASE_URL=http://[^:]+:\d+', f'API_BASE_URL=http://127.0.0.1:{bport}', content)
    content = re.sub(r'VITE_API_BASE_URL=http://[^:]+:\d+', f'VITE_API_BASE_URL=http://127.0.0.1:{bport}', content)
    
    with open(env_path, 'w') as f:
        f.write(content)
    
    print(f"\n已更新.env: 前端={fport}, 后端={bport}")

def main():
    print(f"项目目录: {PROJECT_DIR}")
    fport, bport = find_available_port()
    update_env(fport, bport)
    
    print("\n启动后端服务...")
    subprocess.Popen(
        ['node', 'start-backend.js'],
        cwd=PROJECT_DIR,
        stdout=open(os.path.join(PROJECT_DIR, 'backend.log'), 'w'),
        stderr=subprocess.STDOUT,
        start_new_session=True
    )
    time.sleep(4)
    
    print("启动前端服务...")
    subprocess.Popen(
        ['node', 'start-frontend.js'],
        cwd=PROJECT_DIR,
        stdout=open(os.path.join(PROJECT_DIR, 'frontend.log'), 'w'),
        stderr=subprocess.STDOUT,
        start_new_session=True
    )
    time.sleep(8)
    
    print("\n=== 服务状态检查 ===")
    for port, name in [(bport, '后端'), (fport, '前端')]:
        result = subprocess.run(
            ['lsof', '-nP', f'-iTCP:{port}', '-sTCP:LISTEN'],
            capture_output=True, text=True
        )
        if result.stdout.strip():
            print(f"✓ {name}端口 {port} 监听正常")
        else:
            print(f"✗ {name}端口 {port} 未监听")
    
    print("\n=== 日志检查 ===")
    for log, name in [('backend.log', '后端'), ('frontend.log', '前端')]:
        log_path = os.path.join(PROJECT_DIR, log)
        if os.path.exists(log_path):
            with open(log_path, 'r') as f:
                lines = f.readlines()[-5:]
            print(f"\n{name}日志最后5行:")
            for line in lines:
                print(f"  {line.strip()}")

if __name__ == '__main__':
    main()
