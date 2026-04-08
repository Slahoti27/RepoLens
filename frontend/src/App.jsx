import { useState } from "react";
import API from "./api";
import {
  PieChart, Pie, Tooltip, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import "./App.css";

const COLORS = [
  "#63b3ed", "#68d391", "#f6ad55", "#fc8181",
  "#b794f4", "#4fd1c5", "#f687b3", "#fbd38d",
];

const NAV_ITEMS = [
  { icon: "◈", label: "Dashboard" },
  { icon: "⬡", label: "Analytics" },
  { icon: "⊞", label: "Compare" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-accent)",
      padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: "11px",
    }}>
      <p style={{ color: "var(--accent)", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: "var(--text-primary)" }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

const tickStyle = { fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" };

function App() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commits, setCommits] = useState([]);
  const [activeNav, setActiveNav] = useState(0);

  const fetchData = async () => {
    const cleanUsername = username.trim();
    if (!cleanUsername) return;
    setLoading(true);
    setUser(null); setRepos([]); setCommits([]);
    try {
      const userRes = await API.get(`/user/${cleanUsername}`);
      const repoRes = await API.get(`/repos/${cleanUsername}`);
      setUser(userRes.data);
      setRepos(repoRes.data);
      const topRepo = repoRes.data.reduce(
        (top, r) => (r.stargazers_count > (top?.stargazers_count || 0) ? r : top), null
      );
      if (topRepo) {
        const commitRes = await API.get(`/commits/${cleanUsername}/${topRepo.name}`);
        setCommits(commitRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") fetchData(); };

  // ── Derivations ──
  const getCommitData = () => {
    const map = {};
    commits.forEach((c) => {
      const date = c.commit.author.date.slice(0, 10);
      map[date] = (map[date] || 0) + 1;
    });
    return Object.keys(map).sort().map((date) => ({ date, commits: map[date] }));
  };

  const getLanguageData = () => {
    const map = {};
    repos.forEach((r) => { if (r.language) map[r.language] = (map[r.language] || 0) + 1; });
    return Object.keys(map).map((lang, i) => ({ name: lang, value: map[lang], fill: COLORS[i % COLORS.length] }));
  };

  const getTopRepo = () =>
    repos.length ? repos.reduce((top, r) => r.stargazers_count > (top?.stargazers_count || 0) ? r : top, null) : null;

  const getInactiveRepos = () =>
    repos.filter((r) => (Date.now() - new Date(r.updated_at)) / (1000 * 60 * 60 * 24) > 180);

  const getRepoHealth = (repo) => {
    let score = 0;
    if (repo.stargazers_count > 50) score += 30;
    if (repo.forks_count > 10) score += 20;
    if (repo.open_issues_count < 10) score += 20;
    if ((Date.now() - new Date(repo.updated_at)) / (1000 * 60 * 60 * 24) < 30) score += 30;
    return score;
  };

  const healthClass = (s) => s >= 70 ? "good" : s >= 40 ? "ok" : "poor";
  const getTotalStars = () => repos.reduce((a, r) => a + r.stargazers_count, 0);
  const getTotalForks = () => repos.reduce((a, r) => a + r.forks_count, 0);

  // Analytics derivations
  const getStarLeaderboard = () =>
    [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 8)
      .map((r) => ({ name: r.name.length > 14 ? r.name.slice(0, 14) + "…" : r.name, stars: r.stargazers_count, forks: r.forks_count }));

  const getActivityBuckets = () => {
    const b = { "< 30d": 0, "30–90d": 0, "90–180d": 0, "> 180d": 0 };
    repos.forEach((r) => {
      const d = (Date.now() - new Date(r.updated_at)) / (1000 * 60 * 60 * 24);
      if (d < 30) b["< 30d"]++;
      else if (d < 90) b["30–90d"]++;
      else if (d < 180) b["90–180d"]++;
      else b["> 180d"]++;
    });
    return Object.entries(b).map(([label, count], i) => ({ label, count, fill: COLORS[i] }));
  };

  const getCommitsByDay = () => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const map = { Sun:0, Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0 };
    commits.forEach((c) => { map[days[new Date(c.commit.author.date).getDay()]]++; });
    return days.map((d) => ({ day: d, commits: map[d] }));
  };

  const getRadarData = () => {
    if (!user || !repos.length) return [];
    const norm = (val, max) => Math.min(100, Math.round((val / max) * 100));
    const activeRepos = repos.filter((r) => (Date.now() - new Date(r.updated_at)) / (1000 * 60 * 60 * 24) < 90).length;
    return [
      { metric: "Stars",     value: norm(getTotalStars(), 5000) },
      { metric: "Forks",     value: norm(getTotalForks(), 1000) },
      { metric: "Reach",     value: norm(user.followers, 2000) },
      { metric: "Languages", value: norm(getLanguageData().length, 10) },
      { metric: "Activity",  value: norm(activeRepos, repos.length || 1) },
      { metric: "Repos",     value: norm(repos.length, 100) },
    ];
  };

  const getAllReposSorted = () =>
    [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 10);

  const topRepo = getTopRepo();
  const health = topRepo ? getRepoHealth(topRepo) : 0;
  const langData = getLanguageData();
  const commitData = getCommitData();
  const inactiveRepos = getInactiveRepos();

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  const daysAgo = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "today";
    if (diff < 30) return `${diff}d ago`;
    if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
    return `${Math.floor(diff / 365)}y ago`;
  };

  const NoDataState = ({ message }) => (
    <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>{message}</div>
  );

  // ══════════════════════════════
  //  DASHBOARD PAGE
  // ══════════════════════════════
  const DashboardPage = () => (
    <>
      <div className="search-card">
        <span className="search-label">Target</span>
        <div className="search-input-wrap">
          <span className="search-prefix">github.com/</span>
          <input placeholder="username" value={username}
            onChange={(e) => setUsername(e.target.value)} onKeyDown={handleKey} />
        </div>
        <button className="btn-search" onClick={fetchData} disabled={loading}>
          {loading ? "Loading..." : "Analyze →"}
        </button>
      </div>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          <span className="spinner-label">Fetching data...</span>
        </div>
      )}

      {!loading && !user && (
        <div className="empty-state">
          <div className="empty-state-icon">⬡</div>
          <h3>No profile loaded</h3>
          <p>Enter a GitHub username above to explore their repositories, commit activity, and language breakdown.</p>
        </div>
      )}

      {!loading && user && (
        <>
          <div className="user-card">
            <img className="user-avatar" src={user.avatar_url} alt={user.login} />
            <div className="user-info">
              <div className="user-name">{user.name || user.login}</div>
              <div className="user-login">@{user.login}</div>
              {user.bio && <div className="user-bio">{user.bio}</div>}
              <div className="user-meta">
                {[["Followers", user.followers], ["Following", user.following], ["Repos", user.public_repos]].map(([label, val]) => (
                  <div key={label} className="user-meta-item">
                    <span className="user-meta-value">{val.toLocaleString()}</span>
                    <span className="user-meta-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-grid">
            {[
              ["01", "Total Stars",    getTotalStars(), "accent-amber",  `across ${repos.length} repos`],
              ["02", "Total Forks",    getTotalForks(), "accent-green",  "community reach"],
              ["03", "Languages",      langData.length, "accent-blue",   "distinct technologies"],
              ["04", "Inactive Repos", inactiveRepos.length, "accent-purple", "no activity in 180d"],
            ].map(([idx, label, value, color, sub]) => (
              <div key={label} className="stat-card" data-index={idx}>
                <div className="stat-label">{label}</div>
                <div className={`stat-value ${color}`}>{value.toLocaleString()}</div>
                <div className="stat-sub">{sub}</div>
              </div>
            ))}
          </div>

          {repos.length > 0 && (
            <div className="analytics-grid">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Language Distribution</span>
                  <span className="card-badge">{langData.length} langs</span>
                </div>
                <PieChart width={260} height={220}>
                  <Pie data={langData} dataKey="value" nameKey="name" outerRadius={95} innerRadius={40} strokeWidth={0}>
                    {langData.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
                <div className="legend">
                  {langData.map((e) => (
                    <div key={e.name} className="legend-item">
                      <div className="legend-dot" style={{ background: e.fill }} />
                      <span>{e.name}</span>
                      <span style={{ color: "var(--text-muted)" }}>({e.value})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {topRepo && (
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Top Repository</span>
                      <span className="card-badge">⭐ starred</span>
                    </div>
                    <div className="top-repo-name">{topRepo.name}</div>
                    {topRepo.description && (
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 12, fontStyle: "italic" }}>{topRepo.description}</p>
                    )}
                    <div className="top-repo-stat"><span>★</span><span>{topRepo.stargazers_count.toLocaleString()} stars</span></div>
                    <div className="top-repo-stat"><span style={{ color: "var(--accent-green)" }}>⑂</span><span>{topRepo.forks_count.toLocaleString()} forks</span></div>
                    <div className="top-repo-stat"><span style={{ color: "var(--accent-red)" }}>⊙</span><span>{topRepo.open_issues_count} open issues</span></div>
                  </div>
                )}
                {topRepo && (
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Repo Health Score</span>
                      <span className="card-badge">{topRepo.name}</span>
                    </div>
                    <div className="health-score-wrap">
                      <div className={`health-score-number ${healthClass(health)}`}>
                        {health}<span style={{ fontSize: 18, opacity: 0.5 }}>/100</span>
                      </div>
                      <div className="health-bar-track">
                        <div className={`health-bar-fill ${healthClass(health)}`} style={{ width: `${health}%` }} />
                      </div>
                      <div className="health-label">{health >= 70 ? "Excellent" : health >= 40 ? "Moderate" : "Needs Attention"}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {commitData.length > 0 && (
            <div className="card chart-full">
              <div className="card-header">
                <span className="card-title">Commit Activity</span>
                <span className="card-badge">{topRepo?.name}</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={commitData}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="commits" stroke="var(--accent)" strokeWidth={2}
                    dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "var(--accent)", strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {inactiveRepos.length > 0 && (
            <div className="card inactive-list">
              <div className="card-header">
                <span className="card-title">Inactive Repositories</span>
                <span className="card-badge">{inactiveRepos.length} found</span>
              </div>
              {inactiveRepos.slice(0, 6).map((r) => (
                <div key={r.id} className="inactive-item">
                  <div className="inactive-item-name">{r.name}</div>
                  <span className="inactive-date">Last: {formatDate(r.updated_at)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );

  // ══════════════════════════════
  //  ANALYTICS PAGE
  // ══════════════════════════════
  const AnalyticsPage = () => {
    if (!user) return (
      <div className="empty-state">
        <div className="empty-state-icon">⬡</div>
        <h3>No data to analyse</h3>
        <p>Search for a GitHub user on the Dashboard first.</p>
      </div>
    );

    const starLeaderboard = getStarLeaderboard();
    const activityBuckets = getActivityBuckets();
    const commitsByDay = getCommitsByDay();
    const radarData = getRadarData();
    const topRepos = getAllReposSorted();
    const avgStars = repos.length ? Math.round(getTotalStars() / repos.length) : 0;
    const avgForks = repos.length ? Math.round(getTotalForks() / repos.length) : 0;
    const mostUsedLang = langData.length ? langData.reduce((a, b) => b.value > a.value ? b : a) : null;
    const totalIssues = repos.reduce((a, r) => a + r.open_issues_count, 0);
    const activeRepoCount = repos.length - inactiveRepos.length;
    const forkStarRatio = getTotalStars() ? (getTotalForks() / getTotalStars()).toFixed(2) + "×" : "—";

    return (
      <>
        {/* Section header */}
        <div className="analytics-section-header">
          <div>
            <h2 className="analytics-title">Deep Analytics</h2>
            <p className="analytics-sub">Profile breakdown for <span style={{ color: "var(--accent)" }}>@{user.login}</span></p>
          </div>
          <div className="analytics-header-badges">
            <span className="card-badge">{repos.length} repos</span>
            <span className="card-badge" style={{ borderColor: "var(--accent-green)", color: "var(--accent-green)", background: "rgba(104,211,145,0.08)" }}>
              {langData.length} languages
            </span>
          </div>
        </div>

        {/* KPI strip */}
        <div className="kpi-strip">
          {[
            { label: "Avg Stars / Repo",  value: avgStars,        color: "var(--accent-amber)"  },
            { label: "Avg Forks / Repo",  value: avgForks,        color: "var(--accent-green)"  },
            { label: "Top Language",      value: mostUsedLang?.name ?? "—", color: "var(--accent)" },
            { label: "Fork / Star Ratio", value: forkStarRatio,   color: "var(--accent-purple)" },
            { label: "Active Repos",      value: activeRepoCount, color: "var(--accent-green)"  },
            { label: "Open Issues Total", value: totalIssues,     color: "var(--accent-red)"    },
          ].map((k) => (
            <div key={k.label} className="kpi-item">
              <div className="kpi-value" style={{ color: k.color }}>
                {typeof k.value === "number" ? k.value.toLocaleString() : k.value}
              </div>
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Row 1: Bar + Radar */}
        <div className="analytics-grid">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Stars & Forks by Repo</span>
              <span className="card-badge">top 8</span>
            </div>
            {starLeaderboard.length ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={starLeaderboard} layout="vertical" barSize={8} barGap={2}>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="stars" fill="var(--accent-amber)" radius={[0, 2, 2, 0]} />
                    <Bar dataKey="forks" fill="var(--accent-green)" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="legend" style={{ marginTop: 8 }}>
                  <div className="legend-item"><div className="legend-dot" style={{ background: "var(--accent-amber)" }} /><span>Stars</span></div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: "var(--accent-green)" }} /><span>Forks</span></div>
                </div>
              </>
            ) : <NoDataState message="No repo data." />}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Developer Profile Radar</span>
              <span className="card-badge">normalised</span>
            </div>
            {radarData.length ? (
              <ResponsiveContainer width="100%" height={270}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="metric" tick={tickStyle} />
                  <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.18} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <NoDataState message="Not enough data." />}
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, letterSpacing: 1 }}>
              All axes normalised 0–100 against community benchmarks.
            </p>
          </div>
        </div>

        {/* Row 2: Activity buckets + commits by day */}
        <div className="analytics-grid">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Repo Activity Age</span>
              <span className="card-badge">by last push</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityBuckets} barSize={32}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {activityBuckets.map((b) => <Cell key={b.label} fill={b.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Commits by Day of Week</span>
              <span className="card-badge">{topRepo?.name ?? "top repo"}</span>
            </div>
            {commitsByDay.some((d) => d.commits > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={commitsByDay} barSize={24}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="commits" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <NoDataState message="No commit data loaded." />}
          </div>
        </div>

        {/* Row 3: Full repo table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Repository Leaderboard</span>
            <span className="card-badge">top 10 by ★</span>
          </div>
          <div className="table-wrap">
            <table className="repo-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Repository</th>
                  <th>Language</th>
                  <th>Stars</th>
                  <th>Forks</th>
                  <th>Issues</th>
                  <th>Updated</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {topRepos.map((r, i) => {
                  const h = getRepoHealth(r);
                  const hc = healthClass(h);
                  const langIdx = langData.findIndex((l) => l.name === r.language);
                  const langColor = langIdx >= 0 ? COLORS[langIdx % COLORS.length] : "#6b7fa3";
                  return (
                    <tr key={r.id} className="repo-row">
                      <td className="repo-rank">{String(i + 1).padStart(2, "0")}</td>
                      <td className="repo-name-cell">
                        <a href={r.html_url} target="_blank" rel="noreferrer">{r.name}</a>
                        {r.description && <span className="repo-desc">{r.description}</span>}
                      </td>
                      <td>
                        {r.language
                          ? <span className="lang-tag" style={{ color: langColor, background: langColor + "22", borderColor: langColor + "55" }}>{r.language}</span>
                          : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td className="num-cell" style={{ color: "var(--accent-amber)" }}>★ {r.stargazers_count.toLocaleString()}</td>
                      <td className="num-cell" style={{ color: "var(--accent-green)" }}>⑂ {r.forks_count.toLocaleString()}</td>
                      <td className="num-cell" style={{ color: r.open_issues_count > 20 ? "var(--accent-red)" : "var(--text-secondary)" }}>{r.open_issues_count}</td>
                      <td className="date-cell">{daysAgo(r.updated_at)}</td>
                      <td>
                        <div className="mini-health">
                          <div className="mini-health-bar">
                            <div className={`mini-health-fill ${hc}`} style={{ width: `${h}%` }} />
                          </div>
                          <span className={`mini-health-score ${hc}`}>{h}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  // ══════════════════════════════
  //  COMPARE PAGE (placeholder)
  // ══════════════════════════════
  const ComparePage = () => (
    <div className="empty-state">
      <div className="empty-state-icon">⊞</div>
      <h3>Compare coming soon</h3>
      <p>Head-to-head comparison between two GitHub profiles is on the roadmap.</p>
    </div>
  );

  const pages = [DashboardPage, AnalyticsPage, ComparePage];
  const ActivePage = pages[activeNav];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Repo<span>Lens</span></h2>
          <p>Analytics Platform</p>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => (
            <div key={item.label} className={`nav-item ${i === activeNav ? "active" : ""}`} onClick={() => setActiveNav(i)}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main">
        <div className="header">
          <h1>{NAV_ITEMS[activeNav].label}</h1>
        </div>
        <div className="content">
          <ActivePage />
        </div>
      </main>
    </div>
  );
}

export default App;