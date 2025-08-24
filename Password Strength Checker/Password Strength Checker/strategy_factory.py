from strength_checker import StrengthChecker
from time_to_crack import TimeToCrackCalculator

class StrategyFactory:
    @staticmethod
    def get_strategy(name: str):
        if name == "strength":
            return StrengthChecker()
        elif name == "time_to_crack":
            return TimeToCrackCalculator()
        raise ValueError(f"Unknown strategy: {name}")
