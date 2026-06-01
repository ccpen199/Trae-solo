#!/usr/bin/env python3
from __future__ import annotations

import json
import socket
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen


PROJECT_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = PROJECT_DIR / ".env"
ORDER_ID = "may-63474"


def read_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


def write_env(env: dict[str, str]) -> None:
    keys = [
        "HOST",
        "FRONTEND_PORT",
        "BACKEND_PORT",
        "API_BASE_URL",
        "VITE_API_BASE_URL",
        "DATABASE_PATH",
        "NODE_ENV",
    ]
    lines = [f"{key}={env[key]}" for key in keys if key in env]
    ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def can_bind(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((host, port))
        except OSError:
            return False
    return True


def existing_backend_is_ours(port: int) -> bool:
    try:
        with urlopen(f"http://127.0.0.1:{port}/api/health", timeout=1.5) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return bool(payload.get("ok") and payload.get("order") == ORDER_ID)
    except (OSError, URLError, json.JSONDecodeError):
        return False


def existing_frontend_is_ours(port: int) -> bool:
    try:
        with urlopen(f"http://127.0.0.1:{port}/", timeout=1.5) as response:
            text = response.read().decode("utf-8", errors="ignore")
        return ORDER_ID in text
    except (OSError, URLError):
        return False


def choose_port(host: str, desired: int, service: str) -> int:
    if service == "backend" and existing_backend_is_ours(desired):
        return desired
    if service == "frontend" and existing_frontend_is_ours(desired):
        return desired
    if can_bind(host, desired):
        return desired

    for offset in range(1, 100):
        candidate = desired + offset
        if candidate <= 65535 and can_bind(host, candidate):
            return candidate
    raise SystemExit(f"No available {service} port near {desired}")


def main() -> None:
    env = read_env()
    host = env.get("HOST", "127.0.0.1")
    frontend_port = choose_port(host, int(env.get("FRONTEND_PORT", "43474")), "frontend")
    backend_port = choose_port(host, int(env.get("BACKEND_PORT", "53474")), "backend")

    env["HOST"] = host
    env["FRONTEND_PORT"] = str(frontend_port)
    env["BACKEND_PORT"] = str(backend_port)
    env["API_BASE_URL"] = f"http://127.0.0.1:{backend_port}"
    env["VITE_API_BASE_URL"] = env["API_BASE_URL"]
    env.setdefault("DATABASE_PATH", "./data/app.sqlite")
    env.setdefault("NODE_ENV", "development")
    write_env(env)
    print(f"FRONTEND_PORT={frontend_port}")
    print(f"BACKEND_PORT={backend_port}")


if __name__ == "__main__":
    main()

