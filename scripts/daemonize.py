#!/usr/bin/env python3
import argparse
import os
import subprocess
import sys
import time
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Start a local service detached from this shell.")
    parser.add_argument("--pid-file", required=True)
    parser.add_argument("--log-file", required=True)
    parser.add_argument("--cwd", default=".")
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()

    command = args.command
    if command and command[0] == "--":
        command = command[1:]
    if not command:
        parser.error("missing command")

    cwd = Path(args.cwd).resolve()
    pid_file = (cwd / args.pid_file).resolve()
    log_file = (cwd / args.log_file).resolve()
    pid_file.parent.mkdir(parents=True, exist_ok=True)
    log_file.parent.mkdir(parents=True, exist_ok=True)

    with log_file.open("ab", buffering=0) as log:
        proc = subprocess.Popen(
            command,
            cwd=str(cwd),
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            close_fds=True,
            start_new_session=True,
            env=os.environ.copy(),
        )

    pid_file.write_text(f"{proc.pid}\n", encoding="utf-8")
    time.sleep(0.5)
    if proc.poll() is not None:
        sys.stderr.write(f"service exited with code {proc.returncode}; see {log_file}\n")
        return proc.returncode or 1
    print(proc.pid)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
