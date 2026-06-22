#!/usr/bin/env python3
import mimetypes
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = PROJECT_ROOT / ".env"
PUBLIC_DIR = PROJECT_ROOT / "frontend" / "public"


def load_env() -> dict[str, str]:
    data: dict[str, str] = {}
    if not ENV_PATH.exists():
        return data
    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


ENV = load_env()
HOST = ENV.get("HOST", "127.0.0.1")
PORT = int(ENV.get("FRONTEND_PORT", "49333"))
ORDER_ID = ENV.get("ORDER_ID", PROJECT_ROOT.name)
PROJECT_TITLE = ENV.get("PROJECT_TITLE", "PinAI 线索运营台")
API_BASE_URL = ENV.get("API_BASE_URL", "http://127.0.0.1:59333")
BACKEND_URL = ENV.get("BACKEND_URL", API_BASE_URL)
FRONTEND_URL = ENV.get("FRONTEND_URL", f"http://{HOST}:{PORT}")


class FrontendHandler(BaseHTTPRequestHandler):
    server_version = "PinAIFrontend/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print(
            f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] "
            f"{self.client_address[0]} {fmt % args}"
        )

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path or "/"
        if path == "/":
            return self._serve_index(send_body=True)
        if path == "/favicon.ico":
            return self._serve_favicon()
        return self._serve_file(path, send_body=True)

    def do_HEAD(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path or "/"
        if path == "/":
            return self._serve_index(send_body=False)
        if path == "/favicon.ico":
            return self._serve_favicon()
        return self._serve_file(path, send_body=False)

    def _serve_index(self, send_body: bool) -> None:
        template = (PUBLIC_DIR / "index.html").read_text(encoding="utf-8")
        html = (
            template.replace("__PROJECT_TITLE__", PROJECT_TITLE)
            .replace("__ORDER_ID__", ORDER_ID)
            .replace("__API_BASE_URL__", API_BASE_URL)
            .replace("__BACKEND_URL__", BACKEND_URL)
            .replace("__FRONTEND_URL__", FRONTEND_URL)
        )
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if send_body:
            self.wfile.write(body)

    def _serve_file(self, path: str, send_body: bool) -> None:
        clean_path = path.lstrip("/")
        file_path = (PUBLIC_DIR / clean_path).resolve()
        try:
            file_path.relative_to(PUBLIC_DIR.resolve())
        except ValueError:
            return self._not_found()

        if not file_path.exists() or not file_path.is_file():
            return self._not_found()

        body = file_path.read_bytes()
        content_type, _ = mimetypes.guess_type(str(file_path))
        self.send_response(200)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if send_body:
            self.wfile.write(body)

    def _serve_favicon(self) -> None:
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _not_found(self) -> None:
        body = b"Not Found"
        self.send_response(404)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), FrontendHandler)
    print(f"Frontend listening on http://{HOST}:{PORT} for {ORDER_ID}")
    server.serve_forever()


if __name__ == "__main__":
    main()
