#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start a command as a detached local daemon.")
    parser.add_argument("--cwd", required=True)
    parser.add_argument("--pid-file", required=True)
    parser.add_argument("--log-file", required=True)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.command and args.command[0] == "--":
        args.command = args.command[1:]
    if not args.command:
        parser.error("command is required")
    return args


def redirect_stdio(log_file: Path) -> None:
    log_file.parent.mkdir(parents=True, exist_ok=True)
    sys.stdout.flush()
    sys.stderr.flush()
    with open("/dev/null", "rb", buffering=0) as stdin:
        os.dup2(stdin.fileno(), 0)
    with open(log_file, "ab", buffering=0) as log:
        os.dup2(log.fileno(), 1)
        os.dup2(log.fileno(), 2)


def main() -> None:
    args = parse_args()
    cwd = Path(args.cwd).resolve()
    pid_file = Path(args.pid_file).resolve()
    log_file = Path(args.log_file).resolve()

    first_pid = os.fork()
    if first_pid > 0:
        print(first_pid, flush=True)
        os._exit(0)

    os.setsid()

    second_pid = os.fork()
    if second_pid > 0:
        os._exit(0)

    os.chdir(cwd)
    os.umask(0o022)
    pid_file.write_text(f"{os.getpid()}\n", encoding="utf-8")
    redirect_stdio(log_file)
    os.execvp(args.command[0], args.command)


if __name__ == "__main__":
    main()

