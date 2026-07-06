"""
Frontend SPA serveri
=====================
React dasturini LAN da ulashish uchun.
Barcha 404 so'rovlarni index.html ga yo'naltiradi
(React ichki routing ishlashi uchun).
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
DIST = os.path.join(os.path.dirname(__file__), '..', 'dist')

class SPAHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.abspath(DIST), **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = '/index.html'
        return super().do_GET()

    def log_message(self, fmt, *a):
        if '200' in str(a) or '304' in str(a):
            return
        super().log_message(fmt, *a)

if __name__ == '__main__':
    if not os.path.isdir(DIST):
        print(f"[XATO] dist papkasi topilmadi: {DIST}")
        print("       npm run build bajaring!")
        sys.exit(1)
    s = HTTPServer(('0.0.0.0', PORT), SPAHandler)
    print(f"Frontend: http://0.0.0.0:{PORT}")
    try:
        s.serve_forever()
    except KeyboardInterrupt:
        print("\nFrontend to'xtatildi.")
