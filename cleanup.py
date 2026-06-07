#!/usr/bin/env python3
import os
import signal
import subprocess
import time
import sys

PROJECT_DIR = "/Users/chen/Documents/trae_projects/local_projects/may-89014"

def kill_all():
    result = subprocess.run(["ps", "aux"], capture_output=True, text=True)
    for line in result.stdout.splitlines():
        if ("may-89014" in line and ("node" in line or "vite" in line) and "grep" not in line):
            parts = line.split()
            pid = int(parts[1])
            try:
                os.kill(pid, signal.SIGKILL)
                print(f"Killed {pid}")
            except:
                pass
    time.sleep(3)

def check_ports():
    for port in [49014, 59014, 49015, 59015]:
        result = subprocess.run(["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN"], capture_output=True, text=True)
        if result.stdout.strip():
            print(f"Port {port} IN USE")
            print(result.stdout)
        else:
            print(f"Port {port} FREE")

if __name__ == "__main__":
    kill_all()
    check_ports()
    
    # Remove old database and logs
    for f in [
        f"{PROJECT_DIR}/backend/data/app.sqlite",
        f"{PROJECT_DIR}/backend/data/app.sqlite-wal",
        f"{PROJECT_DIR}/backend/data/app.sqlite-shm",
        f"{PROJECT_DIR}/backend.log",
        f"{PROJECT_DIR}/frontend.log"
    ]:
        if os.path.exists(f):
            os.remove(f)
            print(f"Removed {f}")
