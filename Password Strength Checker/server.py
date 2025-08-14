import http.server
import socketserver
import webbrowser
import os
import json
from datetime import datetime
from strategy_factory import StrategyFactory

# Directory containing static files
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

# ANSI color codes
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"

class MyRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def log_message(self, format, *args):
        """Pretty-print logs with timestamps and request info."""
        timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
        log_text = f"{timestamp} {self.client_address[0]} {self.command} {self.path} {format % args}"
        
        # Color errors in red, everything else in green
        if "404" in log_text or "500" in log_text or "Error" in log_text:
            print(f"{RED}{log_text}{RESET}")
        else:
            print(f"{GREEN}{log_text}{RESET}")

    def do_GET(self):
        # Ignore favicon requests
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        return super().do_GET()

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length).decode('utf-8'))

            if data.get('action') == 'evaluate_password':
                password = data.get('password')
                strength = StrategyFactory.get_strategy("strength").evaluate(password)
                time = StrategyFactory.get_strategy("time_to_crack").evaluate(password)

                response = {
                    'strength': strength,
                    'time_to_crack': time,
                    'properties': {
                        'length': len(password),
                        'has_numbers': any(c.isdigit() for c in password),
                        'has_lowercase': any(c.islower() for c in password),
                        'has_uppercase': any(c.isupper() for c in password),
                        'has_special': any(not c.isalnum() for c in password)
                    }
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            error_msg = f"Server Error: {e}"
            print(f"{RED}{datetime.now().strftime('[%Y-%m-%d %H:%M:%S]')} {error_msg}{RESET}")

def run_server():
    port = 8000
    with socketserver.TCPServer(("", port), MyRequestHandler) as httpd:
        print(f"{GREEN}Server running at http://localhost:{port}{RESET}")
        webbrowser.open(f"http://localhost:{port}")
        httpd.serve_forever()

if __name__ == '__main__':
    run_server()