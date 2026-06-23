#!/usr/bin/env python3
import argparse
import os
import sys


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cwd", required=True)
    parser.add_argument("--pidfile", required=True)
    parser.add_argument("--log", required=True)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.command and args.command[0] == "--":
        args.command = args.command[1:]
    if not args.command:
        parser.error("command is required")
    return args


def main():
    args = parse_args()
    read_fd, write_fd = os.pipe()

    first_pid = os.fork()
    if first_pid > 0:
        os.close(write_fd)
        data = b""
        while True:
            chunk = os.read(read_fd, 64)
            if not chunk:
                break
            data += chunk
        os.close(read_fd)
        _, status = os.waitpid(first_pid, 0)
        if status != 0:
            sys.exit(os.waitstatus_to_exitcode(status))
        if data:
            print(data.decode("ascii").strip())
        return

    os.close(read_fd)
    os.setsid()
    second_pid = os.fork()
    if second_pid > 0:
        os.write(write_fd, str(second_pid).encode("ascii"))
        os.close(write_fd)
        with open(args.pidfile, "w", encoding="utf-8") as pid_file:
            pid_file.write(f"{second_pid}\n")
        os._exit(0)

    os.close(write_fd)
    os.chdir(args.cwd)
    os.umask(0o022)

    log_fd = os.open(args.log, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    null_fd = os.open(os.devnull, os.O_RDONLY)
    os.dup2(null_fd, 0)
    os.dup2(log_fd, 1)
    os.dup2(log_fd, 2)
    os.close(null_fd)
    os.close(log_fd)

    os.execvp(args.command[0], args.command)


if __name__ == "__main__":
    main()
