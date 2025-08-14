from base_strategy import PasswordStrategy

class StrengthChecker(PasswordStrategy):
    def evaluate(self, password: str) -> str:
        score = sum([
            len(password) >= 8,
            any(c.isdigit() for c in password),
            any(c.islower() for c in password),
            any(c.isupper() for c in password),
            any(not c.isalnum() for c in password)
        ])
        return "Strong" if score >= 4 else "Moderate" if score == 3 else "Weak"
