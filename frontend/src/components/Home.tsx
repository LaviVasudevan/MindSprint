interface Props {
  onStart: (difficulty: string) => void;
}

export default function Home({ onStart }: Props) {
  return (
    <div>
      <h1>MindSprint</h1>
      <p>60 seconds. How many can you get?</p>
      {["easy", "medium", "hard"].map(d => (
        <button
          key={d}
          onClick={() => onStart(d)}
          style={{ margin: "0.5rem", padding: "0.75rem 2rem", fontSize: "1rem", cursor: "pointer" }}
        >
          {d.charAt(0).toUpperCase() + d.slice(1)}
        </button>
      ))}
    </div>
  );
}