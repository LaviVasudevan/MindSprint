import random

def generate_question(difficulty: str) -> dict:
    if difficulty == "easy":
        a, b = random.randint(1, 20), random.randint(1, 20)
        op = random.choice(["+", "-"])
    elif difficulty == "medium":
        a, b = random.randint(2, 12), random.randint(2, 12)
        op = random.choice(["*", "/"])
        if op == "/":
            a = a * b  # guarantee integer result
    else:  # hard
        a, b = random.randint(2, 50), random.randint(2, 10)
        op = random.choice(["+", "-", "*", "**"])

    answer = int(eval(f"{a} {op} {b}"))
    display_op = {"*": "Ãƒâ€”", "/": "ÃƒÂ·", "**": "^", "+": "+", "-": "-"}[op]

    return {
        "question": f"{a} {display_op} {b}",
        "answer": answer
    }