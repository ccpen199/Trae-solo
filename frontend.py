#!/usr/bin/env python3
import json
import os
import re
import time
import urllib.parse
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = PROJECT_DIR / "public"
ENV_PATH = PROJECT_DIR / ".env"


def load_env():
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


ENV = load_env()
HOST = "127.0.0.1"
PORT = int(os.environ.get("FRONTEND_PORT") or ENV.get("FRONTEND_PORT", "43476"))
BACKEND_URL = os.environ.get("BACKEND_URL") or ENV.get("BACKEND_URL", "http://127.0.0.1:53476")
CACHE_BUSTER = str(int(time.time()))


class Handler(SimpleHTTPRequestHandler):
    server_version = "may-63476-frontend/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def log_message(self, fmt, *args):
        timestamp = datetime.now(timezone.utc).isoformat()
        try:
            print(f"{timestamp} {self.address_string()} {fmt % args}", flush=True)
        except Exception:
            pass

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            pass

    def send_headers(self, content_type, body_length, extra_headers=None):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(body_length))
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        current_timestamp = str(int(time.time()))

        if path in {"", "/"}:
            path = "/index.html"

        if path == "/config.js":
            payload = (
                "window.APP_CONFIG = "
                + json.dumps(
                    {
                        "backendUrl": BACKEND_URL,
                        "frontendPort": PORT,
                        "cacheBuster": current_timestamp,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                    ensure_ascii=False,
                )
                + ";\n"
            )
            body = payload.encode("utf-8")
            try:
                self.send_headers("application/javascript; charset=utf-8", len(body))
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
                pass
            return

        if path in {"/index.html", "/admin.html"}:
            try:
                file_path = PUBLIC_DIR / path.lstrip("/")
                content = file_path.read_text(encoding="utf-8")
                content = content.replace("TIMESTAMP", current_timestamp)
                content = content.replace("BACKEND_URL_PLACEHOLDER", BACKEND_URL)
                body = content.encode("utf-8")
                self.send_headers("text/html; charset=utf-8", len(body))
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
                pass
            except Exception as e:
                print(f"Error serving {path}: {e}", flush=True)
                self.send_error(404)
            return

        super().do_GET()

    def send_head(self):
        path = self.translate_path(self.path)
        f = None
        if os.path.isdir(path):
            parts = urllib.parse.urlsplit(self.path)
            if not parts.path.endswith('/'):
                self.send_response(301)
                new_parts = (parts[0], parts[1], parts[2] + '/',
                             parts[3], parts[4])
                new_url = urllib.parse.urlunsplit(new_parts)
                self.send_header("Location", new_url)
                self.end_headers()
                return None
            for index in "index.html", "index.htm":
                index = os.path.join(path, index)
                if os.path.exists(index):
                    path = index
                    break
            else:
                return self.list_directory(path)
        ctype = self.guess_type(path)
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None
        try:
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            fs = os.fstat(f.fileno())
            self.send_header("Content-Length", str(fs.st_size))
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            return f
        except:
            f.close()
            raise


class LocalServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Cache buster: {CACHE_BUSTER}", flush=True)
    print(f"Frontend port: {PORT}", flush=True)
    print(f"Backend URL: {BACKEND_URL}", flush=True)
    httpd = LocalServer((HOST, PORT), Handler)
    print(f"frontend listening on http://{HOST}:{PORT}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
