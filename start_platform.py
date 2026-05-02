#!/usr/bin/env python3
import os
import sys
import signal
import subprocess
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

BACKEND_PORT = 51120
FRONTEND_PORT = 61120

processes = []

def signal_handler(sig, frame):
    print("\nStopping services...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=5)
        except:
            try:
                p.kill()
            except:
                pass
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def wait_for_port(port, timeout=30):
    import socket
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1):
                return True
        except:
            time.sleep(1)
    return False

def check_port_in_use(port):
    import socket
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1):
            return True
    except:
        return False

print("=" * 60)
print("  Supply Chain Finance Platform")
print("=" * 60)

# Kill any existing processes on our ports
import socket
def kill_port(port):
    try:
        result = subprocess.run(
            ["lsof", "-ti", f":{port}"],
            capture_output=True,
            text=True
        )
        if result.stdout.strip():
            for pid in result.stdout.strip().split('\n'):
                try:
                    os.kill(int(pid), signal.SIGKILL)
                    print(f"  Killed process on port {port} (PID: {pid})")
                except:
                    pass
    except:
        pass

kill_port(BACKEND_PORT)
kill_port(FRONTEND_PORT)
time.sleep(1)

print("\n[1/2] Starting Backend (port 111201)...")

# Start backend using Python directly
backend_env = os.environ.copy()
backend_env["PYTHONPATH"] = BACKEND_DIR

backend_script = f"""
import sys
sys.path.insert(0, '{BACKEND_DIR}')

from main import app
import uvicorn

print("Backend starting on http://127.0.0.1:{BACKEND_PORT}")
print("Press Ctrl+C to stop")
uvicorn.run(app, host="127.0.0.1", port={BACKEND_PORT}, log_level="warning")
"""

backend_proc = subprocess.Popen(
    [sys.executable, "-u", "-c", backend_script],
    cwd=BACKEND_DIR,
    env=backend_env,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT
)
processes.append(backend_proc)

# Wait for backend
print("  Waiting for backend to start...")
if wait_for_port(BACKEND_PORT, timeout=20):
    print(f"  ✓ Backend is running on http://127.0.0.1:{BACKEND_PORT}")
else:
    print("  ✗ Backend failed to start")
    # Show what happened
    stdout, _ = backend_proc.communicate(timeout=2)
    if stdout:
        print(f"  Output: {stdout.decode()[:1000]}")

print("\n[2/2] Starting Frontend (port 111202)...")

# Start frontend using npm
frontend_proc = subprocess.Popen(
    ["npm", "run", "dev"],
    cwd=FRONTEND_DIR,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT
)
processes.append(frontend_proc)

print("  Waiting for frontend to start...")
if wait_for_port(FRONTEND_PORT, timeout=30):
    print(f"  ✓ Frontend is running on http://127.0.0.1:{FRONTEND_PORT}")
else:
    print("  ✗ Frontend may take longer to start...")

print("\n" + "=" * 60)
print("  Services started!")
print("=" * 60)
print(f"  Frontend URL: http://127.0.0.1:{FRONTEND_PORT}")
print(f"  Backend URL:  http://127.0.0.1:{BACKEND_PORT}")
print(f"  API Docs:     http://127.0.0.1:{BACKEND_PORT}/docs")
print("=" * 60)
print("\nTest accounts:")
print("  - supplier / 123456 (供应商)")
print("  - core / 123456 (核心企业)")
print("  - risk / 123456 (风控)")
print("  - finance / 123456 (财务)")
print("  - admin / admin123 (管理员)")
print("\nPress Ctrl+C to stop all services.")
print("-" * 60)

# Monitor processes
while True:
    for i, p in enumerate(processes):
        if p.poll() is not None:
            stdout = p.stdout.read() if p.stdout else b""
            print(f"\nProcess {i+1} exited with code {p.returncode}")
            if stdout:
                print(f"Output: {stdout.decode()[:2000]}")
    
    time.sleep(5)
