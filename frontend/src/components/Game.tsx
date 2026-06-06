import { useState, useEffect, useRef } from "react";

const API = "/game";

interface Props {
  sessionId: string;
  onFinish: (result: GameResult) => void;
}

interface GameResult {
  score: number;
  accuracy: number;
  correct: number;
  total: number;
}

interface AnswerResponse {
  correct: boolean;
  score: number;
  streak: number;
  next_question: string;
  time_remaining: number;
}

export default function Game({ sessionId, onFinish }: Props) {
  const [question, setQuestion] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gameOver = useRef<boolean>(false);

  // Client-side countdown â€” display only
  // Server validates real elapsed time on every answer
  useEffect(() => {
    const tick = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(tick);
          handleEndGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Fetch first question
  useEffect(() => {
    fetch(`${API}/question?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => setQuestion(d.question));
  }, [sessionId]);

  async function submitAnswer() {
    if (!input || gameOver.current) return;

    const res = await fetch(`${API}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, answer: parseInt(input) })
    });

    if (!res.ok) return;
    const data: AnswerResponse = await res.json();

    setScore(data.score);
    setStreak(data.streak);
    setQuestion(data.next_question);
    setInput("");
    setFeedback(data.correct ? "correct" : "wrong");
    setTimeout(() => setFeedback(null), 400);
    inputRef.current?.focus();

    if (data.time_remaining <= 0) handleEndGame();
  }

  async function handleEndGame() {
    if (gameOver.current) return;
    gameOver.current = true;

    const res = await fetch(`${API}/end?session_id=${sessionId}`, { method: "POST" });
    const data: GameResult = await res.json();
    onFinish(data);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submitAnswer();
  }

  const timerColor = timeLeft <= 10 ? "#e53e3e" : timeLeft <= 20 ? "#dd6b20" : "#2d3748";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
        <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: timerColor }}>
          {timeLeft}s
        </span>
        <span>Score: <strong>{score}</strong></span>
        {streak > 1 && <span style={{ color: "#e6a817" }}>ðŸ”¥ {streak} streak</span>}
      </div>

      <div style={{
        fontSize: "3rem",
        fontWeight: "bold",
        textAlign: "center",
        margin: "2rem 0",
        color: feedback === "correct" ? "#38a169" : feedback === "wrong" ? "#e53e3e" : "#2d3748"
      }}>
        {question}
      </div>

      <input
        ref={inputRef}
        type="number"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        autoFocus
        style={{ fontSize: "2rem", width: "100%", textAlign: "center", padding: "0.5rem" }}
        placeholder="?"
      />
      <button
        onClick={submitAnswer}
        style={{ marginTop: "1rem", width: "100%", padding: "0.75rem", fontSize: "1.2rem", cursor: "pointer" }}
      >
        Submit
      </button>
    </div>
  );
}