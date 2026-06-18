#!/usr/bin/env python3
import argparse
import os
import sys


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start a detached local process.")
    parser.add_argument("--pid-file", required=True)
    parser.add_argument("--log-file", required=True)
    parser.add_argument("--cwd", required=True)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.command and args.command[0] == "--":
        args.command = args.command[1:]
    if not args.command:
        parser.error("command is required")
    return args


def main() -> None:
    args = parse_args()
    pid = os.fork()
    if pid:
        with open(args.pid_file, "w", encoding="utf-8") as handle:
            handle.write(f"{pid}\n")
        return

    os.setsid()
    os.chdir(args.cwd)
    os.umask(0o022)

    stdin_fd = os.open(os.devnull, os.O_RDONLY)
    log_fd = os.open(args.log_file, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    os.dup2(stdin_fd, 0)
    os.dup2(log_fd, 1)
    os.dup2(log_fd, 2)
    os.close(stdin_fd)
    os.close(log_fd)

    os.execvp(args.command[0], args.command)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"daemonize failed: {exc}", file=sys.stderr)
        raise
