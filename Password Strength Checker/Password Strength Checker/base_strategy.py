class PasswordStrategy:
    def evaluate(self, password: str) -> str:
        raise NotImplementedError("Override in subclass")
