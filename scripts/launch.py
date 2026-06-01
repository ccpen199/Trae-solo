#!/usr/bin/env python3
import os
from pathlib import Path
import subprocess
import sys
import time


ROOT = Path(__file__).resolve().parents[1]


def pid_is_running(pid):
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def main():
    if len(sys.argv) < 5:
        print("usage: launch.py <name> <pid-file> <log-file> <command...>", file=sys.stderr)
        return 2

    name, pid_file, log_file, *command = sys.argv[1:]
    pid_path = ROOT / pid_file
    log_path = ROOT / log_file

    if pid_path.exists():
        raw_pid = pid_path.read_text(encoding="utf-8").strip()
        if raw_pid.isdigit() and pid_is_running(int(raw_pid)):
            print(f"{name} already running with pid {raw_pid}")
            return 0
        pid_path.unlink(missing_ok=True)

    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_handle = log_path.open("ab", buffering=0)
    proc = subprocess.Popen(
        command,
        cwd=ROOT,
        stdin=subprocess.DEVNULL,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        close_fds=True,
        start_new_session=True,
        env=os.environ.copy(),
    )
    pid_path.write_text(f"{proc.pid}\n", encoding="utf-8")
    time.sleep(0.35)
    if proc.poll() is not None:
        print(f"{name} exited immediately with code {proc.returncode}; see {log_file}", file=sys.stderr)
        return proc.returncode or 1

    print(f"started {name} with pid {proc.pid}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

