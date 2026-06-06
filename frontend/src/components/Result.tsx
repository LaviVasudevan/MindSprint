import { useState, useEffect } from "react";

interface GameResult {
  score: number;
  accuracy: number;
  correct: number;
  total: number;
}

interface LeaderboardEntry {
  session_id: string;
  score: number;
}

interface Props {
  result: GameResult;
  onRestart: () => void;
}

export default function Result({ result, onRestart }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetch("/game/leaderboard")
      .then(r => r.json())
      .then(data => setLeaderboard(data));
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Time's up!</h2>
      <p style={{ fontSize: "3rem", padding: "0.75rem 2rem", fontWeight: "bold" }}>{result.score}</p>
      <p>{result.correct} / {result.total} correct · {result.accuracy}% accuracy</p>

      <h3 style={{ marginTop: "2rem" }}>Top 10</h3>
      {leaderboard.length === 0 ? (
        <p>No scores yet</p>
      ) : (
        <table style={{ margin: "0 auto", borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ padding: "0.5rem 1rem" }}>Rank</th>
              <th style={{ padding: "0.5rem 1rem" }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, i) => (
              <tr key={entry.session_id}
                style={{ background: entry.score === result.score ? "#e6f7e6" : "transparent" }}>
                <td style={{ padding: "0.5rem 1rem" }}>#{i + 1}</td>
                <td style={{ padding: "0.5rem 1rem" }}>{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={onRestart}
        style={{ marginTop: "2rem", padding: "0.75rem 2rem", fontSize: "1rem", cursor: "pointer" }}>
        Play again
      </button>
    </div>
  );
}