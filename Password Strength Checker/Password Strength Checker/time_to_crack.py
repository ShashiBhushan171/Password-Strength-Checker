import re
import math
from base_strategy import PasswordStrategy
class TimeToCrackCalculator(PasswordStrategy):
    def evaluate(self, password: str) -> str:
        """Estimate the time to brute-force crack the password (formatted)."""
        seconds = self.estimate_seconds(password)
        return self._format_time(seconds)
    
    def estimate_seconds(self, password: str) -> float:
        """Return estimated crack time in seconds (raw number)."""
        charset_size = self._get_charset_size(password)
        if charset_size == 0 or len(password) == 0:
            return 0.0

        # Avoid huge exponentiation by using logarithms
        total_combinations_log = len(password) * math.log10(charset_size)
        attempts_per_sec = 1_000_000_000  # 1 billion guesses/sec
        return 10 ** total_combinations_log / attempts_per_sec

    def _get_charset_size(self, password: str) -> int:
        size = 0
        if re.search(r"[a-z]", password):
            size += 26
        if re.search(r"[A-Z]", password):
            size += 26
        if re.search(r"[0-9]", password):
            size += 10
        if re.search(r"[^a-zA-Z0-9]", password):
            size += 32
        return size

    def _format_time(self, sec: float) -> str:
        if sec < 1:
            return f"{sec:.6f} seconds"
        y = sec // (365 * 24 * 3600)
        sec %= (365 * 24 * 3600)
        d = sec // (24 * 3600)
        sec %= (24 * 3600)
        h = sec // 3600
        sec %= 3600
        m = sec // 60
        sec %= 60
        return f"{int(y)} years, {int(d)} days, {int(h)} hours, {int(m)} minutes, {int(sec)} seconds"