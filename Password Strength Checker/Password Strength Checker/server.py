import http.server
import socketserver
import webbrowser
import os
import json
import argparse
from datetime import datetime
from typing import Type

# Assuming strategy_factory.py exists and is structured correctly
from strategy_factory import StrategyFactory

# --- Constants ---
# Use os.path.realpath to get the canonical path of the script's directory
STATIC_DIR = os.path.dirname(os.path.realpath(__file__))
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"

class APIServerHandler(http.server.SimpleHTTPRequestHandler):
    """
    Custom request handler that serves static files and provides a POST API endpoint
    for password evaluation.
    """

    def __init__(self, *args, **kwargs):
        # Serve files from the script's directory
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def log_message(self, format: str, *args) -> None:
        """Override to provide custom, colored logging with timestamps."""
        timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
        log_entry = f"{timestamp} {self.client_address[0]} {self.command} {self.path} {args[1]}"
        
        # Color-code based on status code
        status_code = str(args[1])
        if status_code.startswith(('2', '3')):
            print(f"{GREEN}{log_entry}{RESET}")
        else:
            print(f"{RED}{log_entry}{RESET}")

    def _send_cors_headers(self) -> None:
        """Sends headers to allow Cross-Origin Resource Sharing (CORS)."""
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json_response(self, status_code: int, data: dict) -> None:
        """Helper to send a JSON response with appropriate headers."""
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.end_headers()
        try:
            self.wfile.write(json.dumps(data).encode("utf-8"))
        except ConnectionAbortedError:
            # Client closed the connection, which is fine.
            pass

    def do_OPTIONS(self) -> None:
        """Handle pre-flight CORS requests."""
        self.send_response(204) # No Content
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        """Handle GET requests to serve static files."""
        if self.path == "/favicon.ico":
            self.send_response(204) # No Content
            self.end_headers()
            return
        # Fallback to the default handler for any other file
        super().do_GET()

    def do_POST(self) -> None:
        """Handle POST requests for the API endpoint."""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body)

            action = data.get("action")
            if action == "evaluate_password":
                self._handle_evaluate_password(data)
            else:
                self._send_json_response(400, {"error": "Invalid or missing action"})

        except json.JSONDecodeError:
            self._send_json_response(400, {"error": "Invalid JSON format"})
        except Exception as e:
            print(f"{RED}Server Error: {e}{RESET}")
            self._send_json_response(500, {"error": "An internal server error occurred"})

    def _handle_evaluate_password(self, data: dict) -> None:
        """Processes the password evaluation logic."""
        password = data.get("password")
        if not isinstance(password, str):
            self._send_json_response(400, {"error": "Password must be a string"})
            return

        strength = StrategyFactory.get_strategy("strength").evaluate(password)
        time_to_crack = StrategyFactory.get_strategy("time_to_crack").evaluate(password)

        response_data = {
            "strength": strength,
            "time_to_crack": time_to_crack,
        }
        self._send_json_response(200, response_data)

def run_server(port: int, handler: Type[http.server.BaseHTTPRequestHandler]) -> None:
    """Starts the web server and opens the browser."""
    with socketserver.TCPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}"
        print(f"{GREEN}Server starting at {url}{RESET}")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n{RED}Server shutting down.{RESET}")
            httpd.shutdown()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run a simple password evaluation server.")
    parser.add_argument("--port", type=int, default=8000, help="Port to run the server on.")
    args = parser.parse_args()
    
    run_server(port=args.port, handler=APIServerHandler)