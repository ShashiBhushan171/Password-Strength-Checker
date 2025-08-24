import re
from base_strategy import PasswordStrategy
from time_to_crack import TimeToCrackCalculator

class StrengthChecker(PasswordStrategy):
    def __init__(self, time_calc: TimeToCrackCalculator = None, common_passwords_file: str = "common_passwords.txt"):
        """Hybrid StrengthChecker: checks common passwords, patterns, and brute-force time."""
        self.time_calc = time_calc or TimeToCrackCalculator()
        
        # Load common password list
        try:
            with open(common_passwords_file, "r", encoding="utf-8", errors="ignore") as f:
                self.common_passwords = set(p.strip().lower() for p in f)
        except FileNotFoundError:
            self.common_passwords = set()

    def evaluate(self, password: str) -> str:
        pwd_lower = password.lower()

        # 1. Check if it's a common password
        if pwd_lower in self.common_passwords:
            return "Very Weak (common password)"

        # 2. Check for predictable patterns
        if self._has_patterns(password):
            return "Weak (predictable pattern)"

        # 3. Fallback: brute-force estimation
        seconds = self.time_calc.estimate_seconds(password)
        return self._strength_from_time(seconds)

    def _strength_from_time(self, seconds: float) -> str:
        if seconds < 1:
            return "Very Weak"
        elif seconds < 60:
            return "Weak"
        elif seconds < 86400:  # 1 day
            return "Moderate"
        elif seconds < 31557600:  # 1 year
            return "Good"
        elif seconds < 315576000:  # 10 years
            return "Strong"
        else:
            return "Very Strong"

    def _has_patterns(self, password: str) -> bool:
        """Detect weak patterns in the password."""
        # Repeated characters (aaaa, 1111)
        if re.fullmatch(r"(.)\1{3,}", password):
            return True
        # Sequential numbers/letters
        if re.search(r"(1234|abcd|qwerty|asdf)", password.lower()):
            return True
        # Common substitutions (p@ssw0rd etc.)
        if re.search(r"p[a@]ss[wvv]0?rd", password.lower()):
            return True
        return False