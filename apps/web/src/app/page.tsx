export const dynamic = "force-dynamic";

interface DbStatus {
  connected: boolean;
  version?: string;
  error?: string;
}

async function getApiStatus(): Promise<{ health: any; db: DbStatus | null; error: string | null }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  try {
    const [healthRes, dbRes] = await Promise.all([
      fetch(`${apiUrl}/health`),
      fetch(`${apiUrl}/db-check`),
    ]);
    const health = await healthRes.json();
    const db: DbStatus = await dbRes.json();
    return { health, db, error: null };
  } catch (err: any) {
    return { health: null, db: null, error: String(err?.message ?? err) };
  }
}

export default async function Home() {
  const { health, db, error } = await getApiStatus();

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h1>Modular Forms — Sandbox Status</h1>

      <h2>API Health</h2>
      {error ? (
        <p style={{ color: "red" }}>Could not reach API: {error}</p>
      ) : (
        <pre style={{ background: "#f0f0f0", padding: "1rem" }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      )}

      <h2>Database</h2>
      {db ? (
        <pre style={{ background: db.connected ? "#e6ffe6" : "#ffe6e6", padding: "1rem" }}>
          {JSON.stringify(db, null, 2)}
        </pre>
      ) : (
        <p style={{ color: "red" }}>No DB response</p>
      )}
    </main>
  );
}
