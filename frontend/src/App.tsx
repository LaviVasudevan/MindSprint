import { useState } from "react";
import Home from "./components/Home";
import Game from "./components/Game";
import Result from "./components/Result";

const API = "/game";

interface GameResult {
  score: number;
  accuracy: number;
  correct: number;
  total: number;
}

export default function App() {
  const [screen, setScreen] = useState<"home" | "playing" | "result">("home");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);

  async function startGame(difficulty: string) {
    const res = await fetch(`${API}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty })
    });
    const data = await res.json();
    setSessionId(data.session_id);
    setScreen("playing");
  }

  function finishGame(resultData: GameResult) {
    setResult(resultData);
    setScreen("result");
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      {screen === "home"    && <Home onStart={startGame} />}
      {screen === "playing" && sessionId && <Game sessionId={sessionId} onFinish={finishGame} />}
      {screen === "result"  && result && <Result result={result} onRestart={() => setScreen("home")} />}
    </div>
  );
}