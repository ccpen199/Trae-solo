#!/usr/bin/env python3
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "frontend" / "dist"


def load_env():
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ[key.strip()] = value.strip()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def translate_path(self, path):
        resolved = Path(super().translate_path(path))
        if resolved.exists():
            return str(resolved)
        return str(PUBLIC / "index.html")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    load_env()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("FRONTEND_PORT", "48935"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"frontend listening on http://{host}:{port}", flush=True)
    server.serve_forever()
