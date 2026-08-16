"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";

type Submission = {
  id: string;
  name: string;
  email: string;
  title: string;
  link: string;
  story: string;
  createdAt: string;
};

const SESSION_KEY = "sd-admin-password";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchSubmissions = async (pw: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        headers: { "x-admin-password": pw },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load submissions.");
      }
      setSubmissions(data.submissions);
      setUnlocked(true);
      sessionStorage.setItem(SESSION_KEY, pw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setUnlocked(false);
      sessionStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setPassword(saved);
      fetchSubmissions(saved);
    }
  }, []);

  if (!unlocked) {
    return (
      <main className="admin-gate">
        <div className="admin-gate-box">
          <a href="/" className="admin-brand"><span>second</span><span>draft</span></a>
          <h1>Admin access</h1>
          <p>Enter the admin password to view submitted inventions.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchSubmissions(password);
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              autoFocus
            />
            {error && <p className="admin-error">{error}</p>}
            <button type="submit" className="dark-button" disabled={loading}>
              {loading ? "checking..." : <>unlock <ArrowUpRight size={15} /></>}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-header">
        <a href="/" className="admin-brand"><span>second</span><span>draft</span></a>
        <div className="admin-header-right">
          <span>{submissions?.length ?? 0} submission{submissions?.length === 1 ? "" : "s"}</span>
          <button
            type="button"
            className="admin-refresh"
            onClick={() => fetchSubmissions(password)}
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw size={15} className={loading ? "spinning" : ""} />
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {submissions && submissions.length === 0 && (
        <p className="admin-empty">No submissions yet — they'll show up here as people submit inventions.</p>
      )}

      <div className="admin-list">
        {submissions?.map((s) => (
          <div className="admin-card" key={s.id}>
            <div className="admin-card-head">
              <h2>{s.title}</h2>
              <time>{new Date(s.createdAt).toLocaleString()}</time>
            </div>
            <div className="admin-card-meta">
              <span>{s.name}</span>
              <a href={`mailto:${s.email}`}>{s.email}</a>
              {s.link && (
                <a href={s.link} target="_blank" rel="noopener noreferrer">
                  {s.link} <ArrowUpRight size={12} />
                </a>
              )}
            </div>
            <p>{s.story}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
