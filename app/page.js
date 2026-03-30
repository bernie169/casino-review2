"use client";
import { useState, useRef } from "react";

const DEFAULT_CASINOS = [
  { id: 1,  name: "Betway",               domain: "betway.co.za",           slug: "betway" },
  { id: 2,  name: "Hollywoodbets",        domain: "hollywoodbets.net",       slug: "hollywoodbets" },
  { id: 3,  name: "Supabets",             domain: "supabets.co.za",          slug: "supabets" },
  { id: 4,  name: "10bet",                domain: "10bet.co.za",             slug: "10bet" },
  { id: 5,  name: "Sportingbet",          domain: "sportingbet.co.za",       slug: "sportingbet" },
  { id: 6,  name: "Sunbet",               domain: "sunbet.co.za",            slug: "sunbet" },
  { id: 7,  name: "Playabets",            domain: "playabets.co.za",         slug: "playabets" },
  { id: 8,  name: "World Sports Betting", domain: "wsb.co.za",               slug: "wsb" },
  { id: 9,  name: "Pari-Match",           domain: "parimatch.co.za",         slug: "parimatch" },
  { id: 10, name: "BetKing",              domain: "betking.co.za",           slug: "betking" },
  { id: 11, name: "Bet.co.za",            domain: "bet.co.za",               slug: "betcoza" },
  { id: 12, name: "Gbets",                domain: "gbets.co.za",             slug: "gbets" },
  { id: 13, name: "Spin Casino",          domain: "spincasino.com",          slug: "spincasino" },
  { id: 14, name: "Jackpot City",         domain: "jackpotcitycasino.com",   slug: "jackpotcity" },
  { id: 15, name: "Thunderbolt Casino",   domain: "thunderboltcasino.com",   slug: "thunderbolt" },
  { id: 16, name: "Silver Sands",         domain: "silversandscasino.com",   slug: "silversands" },
  { id: 17, name: "Yebo Casino",          domain: "yebocasino.co.za",        slug: "yebo" },
  { id: 18, name: "ZAR Casino",           domain: "zarcasino.com",           slug: "zar" },
  { id: 19, name: "Europa Casino",        domain: "europacasino.com",        slug: "europa" },
  { id: 20, name: "Matchbook",            domain: "matchbook.com",           slug: "matchbook" },
];

const DEFAULT_SOURCES = [
  { id: 1, label: "onlinemobileslots.com",  url: "https://www.onlinemobileslots.com",  locked: true },
  { id: 2, label: "goal.com/en-za/betting", url: "https://www.goal.com/en-za/betting", locked: true },
];

const LOG_COLORS = { status: "#8b949e", search: "#d2a8ff", done: "#3fb950", error: "#f85149" };

export default function Home() {
  const [casinos, setCasinos]     = useState(DEFAULT_CASINOS);
  const [sources, setSources]     = useState(DEFAULT_SOURCES);
  const [selected, setSelected]   = useState(null);
  const [tab, setTab]             = useState("casinos");
  const [search, setSearch]       = useState("");
  const [busy, setBusy]           = useState(false);
  const [logs, setLogs]           = useState([]);
  const [progress, setProgress]   = useState(0);
  const [markdown, setMarkdown]   = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [copied, setCopied]       = useState(false);
  const [showAddCasino, setShowAddCasino] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newCasino, setNewCasino] = useState({ name: "", domain: "" });
  const [newSource, setNewSource] = useState({ label: "", url: "" });
  const nextId  = useRef(300);
  const logRef  = useRef(null);

  const addLog = (msg, type = "status") => {
    setLogs(p => [...p, { msg, type }]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = 9999; }, 40);
  };

  const generate = async () => {
    if (!selected) return;
    setBusy(true);
    setLogs([]);
    setMarkdown("");
    setWordCount(0);
    setProgress(5);
    setTab("output");

    addLog(`Starting review for ${selected.name}…`);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ casino: selected, sources }),
      });

      if (!res.ok) {
        const err = await res.json();
        addLog(err.error || `Server error ${res.status}`, "error");
        setBusy(false);
        return;
      }

      // Read the SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "status") {
              addLog(event.text, "status");
              setProgress(p => Math.min(p + 10, 85));
            } else if (event.type === "search") {
              addLog(`🔍 ${event.text}`, "search");
              setProgress(p => Math.min(p + 5, 85));
            } else if (event.type === "done") {
              const wc = event.text.trim().split(/\s+/).length;
              setMarkdown(event.text.trim());
              setWordCount(wc);
              setProgress(100);
              addLog(`✅ Done — ${wc.toLocaleString()} words`, "done");
            } else if (event.type === "error") {
              addLog(`❌ ${event.text}`, "error");
            }
          } catch {}
        }
      }
    } catch (err) {
      addLog(`❌ ${err.message}`, "error");
    }

    setBusy(false);
  };

  const reset = () => { setMarkdown(""); setLogs([]); setWordCount(0); setProgress(0); };

  const addCasino = () => {
    if (!newCasino.name.trim() || !newCasino.domain.trim()) return;
    const slug = newCasino.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setCasinos(p => [...p, { id: nextId.current++, name: newCasino.name.trim(), domain: newCasino.domain.trim().replace(/^https?:\/\//, ""), slug }]);
    setNewCasino({ name: "", domain: "" });
    setShowAddCasino(false);
  };

  const addSource = () => {
    if (!newSource.label.trim() || !newSource.url.trim()) return;
    setSources(p => [...p, { id: nextId.current++, label: newSource.label.trim(), url: newSource.url.trim(), locked: false }]);
    setNewSource({ label: "", url: "" });
    setShowAddSource(false);
  };

  const filtered = casinos.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* NAV */}
      <div style={{ background: "#010409", borderBottom: "1px solid #21262d" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "stretch" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 0", marginRight: 28 }}>
            <div style={{ width: 30, height: 30, background: "#e8ff00", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="bc" style={{ fontWeight: 900, fontSize: 15, color: "#0d1117" }}>SA</span>
            </div>
            <div>
              <div className="bc" style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.1 }}>Casino Review Agent</div>
              <div className="bc" style={{ fontSize: 10, color: "#484f58", letterSpacing: ".1em", textTransform: "uppercase" }}>SEO · Claude AI · South Africa</div>
            </div>
          </div>

          {["casinos", "sources", "output"].map(t => (
            <button key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
              {t === "casinos" ? `🎰 Casinos (${casinos.length})`
               : t === "sources" ? `🌐 Sources (${sources.length})`
               : `📄 Output${wordCount ? ` · ${wordCount.toLocaleString()}w` : ""}`}
            </button>
          ))}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: busy ? "#e8ff00" : wordCount ? "#3fb950" : "#484f58", animation: busy ? "pulse 1s infinite" : "none" }} />
            <span className="bc" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: busy ? "#e8ff00" : wordCount ? "#3fb950" : "#484f58" }}>
              {busy ? "Working…" : wordCount ? "Complete" : "Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "24px 20px" }}>

        {/* CASINOS */}
        {tab === "casinos" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <input className="inp" placeholder="Search casinos…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
              <button className="btn btn-g" onClick={() => setShowAddCasino(p => !p)}>+ Add Casino</button>
              {selected && <span className="badge" style={{ background: "#e8ff0015", color: "#e8ff00", border: "1px solid #e8ff0030" }}>Selected: {selected.name}</span>}
            </div>

            {showAddCasino && (
              <div style={{ background: "#161b22", border: "1px solid #e8ff0030", borderRadius: 4, padding: 14, marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label className="bc" style={{ fontSize: 11, color: "#8b949e", display: "block", marginBottom: 4, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>Casino Name</label>
                  <input className="inp" placeholder="e.g. LuckyBet" value={newCasino.name} onChange={e => setNewCasino(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && addCasino()} />
                </div>
                <div style={{ flex: 2, minWidth: 200 }}>
                  <label className="bc" style={{ fontSize: 11, color: "#8b949e", display: "block", marginBottom: 4, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>Domain</label>
                  <input className="inp" placeholder="e.g. luckybet.co.za" value={newCasino.domain} onChange={e => setNewCasino(p => ({ ...p, domain: e.target.value }))} onKeyDown={e => e.key === "Enter" && addCasino()} />
                </div>
                <button className="btn btn-y" onClick={addCasino}>Add</button>
                <button className="btn btn-g" onClick={() => setShowAddCasino(false)}>Cancel</button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8, marginBottom: 20 }}>
              {filtered.map(c => (
                <div key={c.id} className={`card${selected?.id === c.id ? " selected" : ""}`} onClick={() => !busy && setSelected(c)} style={{ padding: "13px 14px" }}>
                  <div className="bc" style={{ fontWeight: 800, fontSize: 15, color: selected?.id === c.id ? "#e8ff00" : "#e6edf3", paddingRight: 18, lineHeight: 1.2 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#484f58", marginTop: 3 }}>{c.domain}</div>
                  {!DEFAULT_CASINOS.find(d => d.id === c.id) && (
                    <button className="remove-x" onClick={e => { e.stopPropagation(); setCasinos(p => p.filter(x => x.id !== c.id)); if (selected?.id === c.id) setSelected(null); }}>×</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 4, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                {selected ? (
                  <>
                    <div className="bc" style={{ fontSize: 12, color: "#8b949e", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>Ready to generate</div>
                    <div style={{ fontSize: 14, color: "#e6edf3", marginTop: 3 }}>
                      <span style={{ color: "#e8ff00", fontWeight: 600 }}>{selected.name}</span>
                      {" · "}{selected.domain}{" · "}{sources.length + 1} sources · ~3000 words
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 14, color: "#484f58" }}>← Select a casino to get started</div>
                )}
              </div>
              <button className="btn btn-y" disabled={!selected || busy} onClick={generate} style={{ fontSize: 16, padding: "13px 34px" }}>
                {busy ? "Working…" : "Generate Review →"}
              </button>
            </div>
          </div>
        )}

        {/* SOURCES */}
        {tab === "sources" && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 className="bc" style={{ fontWeight: 800, fontSize: 22 }}>Research Sources</h2>
                <p style={{ fontSize: 13, color: "#8b949e", marginTop: 4 }}>Casino's own website is always added as primary source. Add any extra review sites below.</p>
              </div>
              <button className="btn btn-g" onClick={() => setShowAddSource(p => !p)}>+ Add Source</button>
            </div>

            <div style={{ background: "#0f2a14", border: "1px solid #3fb95033", borderRadius: 4, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <span>⭐</span>
              <div>
                <div className="bc" style={{ fontWeight: 700, fontSize: 12, color: "#3fb950", letterSpacing: ".08em", textTransform: "uppercase" }}>Auto-added · Primary source of truth</div>
                <div style={{ fontSize: 13, color: "#8b949e", marginTop: 2 }}>The selected casino's own website is always searched first for live data — bonuses, payments, licensing.</div>
              </div>
            </div>

            {showAddSource && (
              <div style={{ background: "#161b22", border: "1px solid #58a6ff33", borderRadius: 4, padding: 14, marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label className="bc" style={{ fontSize: 11, color: "#8b949e", display: "block", marginBottom: 4, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>Label</label>
                  <input className="inp" placeholder="e.g. casinoreviews.co.za" value={newSource.label} onChange={e => setNewSource(p => ({ ...p, label: e.target.value }))} />
                </div>
                <div style={{ flex: 2, minWidth: 220 }}>
                  <label className="bc" style={{ fontSize: 11, color: "#8b949e", display: "block", marginBottom: 4, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>Full URL</label>
                  <input className="inp" placeholder="https://www.example.com" value={newSource.url} onChange={e => setNewSource(p => ({ ...p, url: e.target.value }))} />
                </div>
                <button className="btn btn-y" onClick={addSource}>Add</button>
                <button className="btn btn-g" onClick={() => setShowAddSource(false)}>Cancel</button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sources.map(s => (
                <div key={s.id} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 4, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div className="bc" style={{ fontWeight: 700, fontSize: 15 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#484f58", marginTop: 2 }}>{s.url}</div>
                  </div>
                  <span className="badge" style={{ background: "#21262d", color: "#8b949e", border: "1px solid #30363d" }}>Secondary</span>
                  {!s.locked
                    ? <button className="btn btn-r" onClick={() => setSources(p => p.filter(x => x.id !== s.id))}>Remove</button>
                    : <span style={{ fontSize: 11, color: "#3d444d" }}>🔒 default</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OUTPUT */}
        {tab === "output" && (
          <div>
            {(busy || progress > 0) && (
              <div className="prog-bar" style={{ marginBottom: 16 }}>
                <div className="prog-fill" style={{ width: `${progress}%` }} />
              </div>
            )}

            {logs.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div className="bc" style={{ fontSize: 11, fontWeight: 700, color: "#484f58", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Activity Log</div>
                <div className="log" ref={logRef}>
                  {logs.map((l, i) => (
                    <div key={i} style={{ color: LOG_COLORS[l.type] || "#8b949e" }}>{l.msg}</div>
                  ))}
                  {busy && <div style={{ color: "#e8ff00", animation: "pulse 1s infinite" }}>▌</div>}
                </div>
              </div>
            )}

            {markdown ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                  <span className="bc" style={{ fontWeight: 800, fontSize: 20 }}>{selected?.name} Review</span>
                  <span className="badge" style={{ background: "#3fb95020", color: "#3fb950", border: "1px solid #3fb95033" }}>{wordCount.toLocaleString()} words</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button className="btn btn-g" onClick={() => { navigator.clipboard.writeText(markdown); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                      {copied ? "✅ Copied" : "📋 Copy"}
                    </button>
                    <button className="btn btn-g" onClick={() => { const b = new Blob([markdown], { type: "text/markdown" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `${selected?.slug}-review-sa.md`; a.click(); }}>
                      ⬇ Download .md
                    </button>
                    <button className="btn btn-g" onClick={reset}>↩ Reset</button>
                  </div>
                </div>
                <div className="mdout">{markdown}</div>
              </div>
            ) : !busy && (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#3d444d" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
                <div className="bc" style={{ fontSize: 18, marginBottom: 6 }}>No review yet</div>
                <div style={{ fontSize: 13 }}>Go to Casinos → select one → Generate Review</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
