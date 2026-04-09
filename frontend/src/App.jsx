import { useState, useEffect, useMemo, useCallback } from "react";
import API from "./api";
import {
  PieChart, Pie, Tooltip, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import "./App.css";

/* ─────────────────────────────────────────
   CONSTANTS  (module-level, never recreated)
───────────────────────────────────────── */
const COLORS_DARK  = ["#63b3ed","#68d391","#f6ad55","#fc8181","#b794f4","#4fd1c5","#f687b3","#fbd38d"];
const COLORS_LIGHT = ["#2b6cb0","#276749","#b7791f","#c53030","#6b46c1","#285e61","#97266d","#744210"];

const NAV_ITEMS = [
  { icon: "◈", label: "Dashboard" },
  { icon: "⬡", label: "Analytics" },
  { icon: "⊞", label: "Compare"   },
];

/* ─────────────────────────────────────────
   MODULE-LEVEL PURE COMPONENTS
   (never defined inside App or any render fn)
───────────────────────────────────────── */
const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="var(--accent)" fillOpacity="0.15"/>
    <polygon points="16,4 28,11 28,21 16,28 4,21 4,11" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
    <polygon points="16,10 22,13.5 22,20.5 16,24 10,20.5 10,13.5" fill="var(--accent)" fillOpacity="0.25"/>
    <circle cx="16" cy="16" r="3" fill="var(--accent)"/>
  </svg>
);

const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-accent)", padding:"10px 14px", fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-primary)" }}>
      <p style={{ color:"var(--accent)", marginBottom:4 }}>{label}</p>
      {payload.map((p,i) => <p key={i}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

const tick = { fill:"var(--text-muted)", fontSize:10, fontFamily:"var(--font-mono)" };

/* Theme toggle — pill-style switch */
const ThemeToggle = ({ theme, onToggle }) => (
  <button className="theme-pill" onClick={onToggle} aria-label="Toggle theme">
    <span className={`theme-pill-icon ${theme === "dark" ? "active" : ""}`}>☾</span>
    <span className="theme-pill-track">
      <span className={`theme-pill-thumb ${theme === "light" ? "right" : ""}`}/>
    </span>
    <span className={`theme-pill-icon ${theme === "light" ? "active" : ""}`}>☀</span>
  </button>
);

/* Sidebar nav — pure, stable */
const Sidebar = ({ activeNav, onNav }) => (
  <aside className="sidebar">
    <div className="sidebar-logo">
      <Logo/>
      <div style={{ marginTop:10 }}>
        <h2>Repo<span>Lens</span></h2>
        <p>Analytics Platform</p>
      </div>
    </div>
    <nav className="sidebar-nav">
      {NAV_ITEMS.map((item,i) => (
        <div key={item.label} className={`nav-item ${i===activeNav?"active":""}`} onClick={() => onNav(i)}>
          <span className="nav-icon">{item.icon}</span>{item.label}
        </div>
      ))}
    </nav>
    <div className="sidebar-footer"><p>v1.0.0 · GitHub API</p></div>
  </aside>
);

/* Header — pure, stable */
const Header = ({ activeNav, theme, onToggleTheme }) => (
  <div className="header">
    <h1>{NAV_ITEMS[activeNav].label}</h1>
    <div className="header-right">
      <ThemeToggle theme={theme} onToggle={onToggleTheme}/>
      <div className="header-meta">
        <div className="status-dot"/>
        <span>API Connected</span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   APP
───────────────────────────────────────── */
export default function App() {
  const [username,   setUsername]   = useState("");
  const [user,       setUser]       = useState(null);
  const [repos,      setRepos]      = useState([]);
  const [commits,    setCommits]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [activeNav,  setActiveNav]  = useState(0);
  const [theme,      setTheme]      = useState("dark");

  const [username2,  setUsername2]  = useState("");
  const [user2,      setUser2]      = useState(null);
  const [repos2,     setRepos2]     = useState([]);
  const [loading2,   setLoading2]   = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), []);
  const handleNav   = useCallback((i) => setActiveNav(i), []);

  const palette = theme === "light" ? COLORS_LIGHT : COLORS_DARK;

  /* ── API ── */
  const fetchData = useCallback(async () => {
    const u = username.trim(); if (!u) return;
    setLoading(true); setUser(null); setRepos([]); setCommits([]);
    try {
      const [ur, rr] = await Promise.all([API.get(`/user/${u}`), API.get(`/repos/${u}`)]);
      setUser(ur.data); setRepos(rr.data);
      const top = rr.data.reduce((a,r) => r.stargazers_count>(a?.stargazers_count||0)?r:a, null);
      if (top) { const cr = await API.get(`/commits/${u}/${top.name}`); setCommits(cr.data); }
    } finally { setLoading(false); }
  }, [username]);

  const fetchData2 = useCallback(async () => {
    const u = username2.trim(); if (!u) return;
    setLoading2(true); setUser2(null); setRepos2([]);
    try {
      const [ur, rr] = await Promise.all([API.get(`/user/${u}`), API.get(`/repos/${u}`)]);
      setUser2(ur.data); setRepos2(rr.data);
    } finally { setLoading2(false); }
  }, [username2]);

  const handleKey  = useCallback(e => { if (e.key==="Enter") fetchData();  }, [fetchData]);
  const handleKey2 = useCallback(e => { if (e.key==="Enter") fetchData2(); }, [fetchData2]);

  /* ── Pure compute helpers (useMemo so they don't rerun on unrelated renders) ── */
  const ld = useMemo(() => {
    const m = {};
    repos.forEach(r => { if (r.language) m[r.language] = (m[r.language]||0)+1; });
    return Object.keys(m).map((n,i) => ({ name:n, value:m[n], fill:palette[i%palette.length] }));
  }, [repos, palette]);

  const ld2 = useMemo(() => {
    const m = {};
    repos2.forEach(r => { if (r.language) m[r.language] = (m[r.language]||0)+1; });
    return Object.keys(m).map((n,i) => ({ name:n, value:m[n], fill:palette[i%palette.length] }));
  }, [repos2, palette]);

  const totalStars  = useMemo(() => repos.reduce((a,r)=>a+r.stargazers_count,0), [repos]);
  const totalForks  = useMemo(() => repos.reduce((a,r)=>a+r.forks_count,0), [repos]);
  const totalStars2 = useMemo(() => repos2.reduce((a,r)=>a+r.stargazers_count,0), [repos2]);
  const totalForks2 = useMemo(() => repos2.reduce((a,r)=>a+r.forks_count,0), [repos2]);

  const tr  = useMemo(() => repos.length  ? repos.reduce((a,r)=>r.stargazers_count>(a?.stargazers_count||0)?r:a,null)  : null, [repos]);
  const tr2 = useMemo(() => repos2.length ? repos2.reduce((a,r)=>r.stargazers_count>(a?.stargazers_count||0)?r:a,null) : null, [repos2]);

  const inactive  = useMemo(() => repos.filter(r=>(Date.now()-new Date(r.updated_at))/(864e5)>180),  [repos]);
  const inactive2 = useMemo(() => repos2.filter(r=>(Date.now()-new Date(r.updated_at))/(864e5)>180), [repos2]);

  const cd = useMemo(() => {
    const m = {};
    commits.forEach(c => { const d=c.commit.author.date.slice(0,10); m[d]=(m[d]||0)+1; });
    return Object.keys(m).sort().map(d => ({ date:d, commits:m[d] }));
  }, [commits]);

  const repoHealth = useCallback(r => {
    let s=0;
    if (r.stargazers_count>50) s+=30;
    if (r.forks_count>10)      s+=20;
    if (r.open_issues_count<10) s+=20;
    if ((Date.now()-new Date(r.updated_at))/864e5<30) s+=30;
    return s;
  }, []);

  const hc = useCallback(s => s>=70?"good":s>=40?"ok":"poor", []);
  const h  = tr ? repoHealth(tr) : 0;

  const fmtDate = d => d ? new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—";
  const daysAgo = d => {
    const diff = Math.floor((Date.now()-new Date(d))/864e5);
    if (diff===0) return "today";
    if (diff<30)  return `${diff}d ago`;
    if (diff<365) return `${Math.floor(diff/30)}mo ago`;
    return `${Math.floor(diff/365)}y ago`;
  };

  /* ════════════════════════════════════════
     RENDER — pages as inline JSX blocks
     (NOT components — so no remount ever)
  ════════════════════════════════════════ */

  const dashboardJSX = (
    <>
      {/* Search */}
      <div className="search-card">
        <span className="search-label">Target</span>
        <div className="search-input-wrap">
          <span className="search-prefix">github.com/</span>
          <input placeholder="username" value={username}
            onChange={e => setUsername(e.target.value)} onKeyDown={handleKey}/>
        </div>
        <button className="btn-search" onClick={fetchData} disabled={loading}>
          {loading ? "Loading…" : "Analyze →"}
        </button>
      </div>

      {loading && <div className="spinner-wrap"><div className="spinner"/><span className="spinner-label">Fetching data…</span></div>}

      {!loading && !user && (
        <div className="empty-state">
          <Logo/>
          <h3>No profile loaded</h3>
          <p>Enter a GitHub username and press Analyze or hit Enter.</p>
        </div>
      )}

      {!loading && user && (<>
        {/* User card */}
        <div className="user-card">
          <img className="user-avatar" src={user.avatar_url} alt={user.login}/>
          <div className="user-info">
            <div className="user-name">{user.name||user.login}</div>
            <div className="user-login">@{user.login}</div>
            {user.bio && <div className="user-bio">{user.bio}</div>}
            <div className="user-meta">
              {[["Followers",user.followers],["Following",user.following],["Repos",user.public_repos]].map(([l,v])=>(
                <div key={l} className="user-meta-item">
                  <span className="user-meta-value">{Number(v).toLocaleString()}</span>
                  <span className="user-meta-label">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stat grid */}
        <div className="stat-grid">
          {[
            ["01","Total Stars",   totalStars, "accent-amber",  `across ${repos.length} repos`],
            ["02","Total Forks",   totalForks, "accent-green",  "community reach"],
            ["03","Languages",     ld.length,  "accent-blue",   "distinct technologies"],
            ["04","Inactive Repos",inactive.length,"accent-purple","no activity in 180d"],
          ].map(([idx,label,value,color,sub])=>(
            <div key={label} className="stat-card" data-index={idx}>
              <div className="stat-label">{label}</div>
              <div className={`stat-value ${color}`}>{Number(value).toLocaleString()}</div>
              <div className="stat-sub">{sub}</div>
            </div>
          ))}
        </div>

        {repos.length > 0 && (
          <div className="analytics-grid">
            {/* Pie */}
            <div className="card">
              <div className="card-header"><span className="card-title">Language Distribution</span><span className="card-badge">{ld.length} langs</span></div>
              <PieChart width={260} height={220}>
                <Pie data={ld} dataKey="value" nameKey="name" outerRadius={95} innerRadius={40} strokeWidth={0}>
                  {ld.map(e=><Cell key={e.name} fill={e.fill}/>)}
                </Pie>
                <Tooltip content={<Tooltip_/>}/>
              </PieChart>
              <div className="legend">
                {ld.map(e=>(
                  <div key={e.name} className="legend-item">
                    <div className="legend-dot" style={{background:e.fill}}/><span>{e.name}</span>
                    <span style={{color:"var(--text-muted)"}}>({e.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top repo + health */}
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {tr && (<>
                <div className="card">
                  <div className="card-header"><span className="card-title">Top Repository</span><span className="card-badge">⭐ starred</span></div>
                  <div className="top-repo-name">{tr.name}</div>
                  {tr.description && <p style={{fontSize:11,color:"var(--text-secondary)",marginBottom:12,fontStyle:"italic"}}>{tr.description}</p>}
                  <div className="top-repo-stat"><span>★</span><span>{tr.stargazers_count.toLocaleString()} stars</span></div>
                  <div className="top-repo-stat"><span style={{color:"var(--accent-green)"}}>⑂</span><span>{tr.forks_count.toLocaleString()} forks</span></div>
                  <div className="top-repo-stat"><span style={{color:"var(--accent-red)"}}>⊙</span><span>{tr.open_issues_count} open issues</span></div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Repo Health Score</span><span className="card-badge">{tr.name}</span></div>
                  <div className="health-score-wrap">
                    <div className={`health-score-number ${hc(h)}`}>{h}<span style={{fontSize:18,opacity:0.5}}>/100</span></div>
                    <div className="health-bar-track"><div className={`health-bar-fill ${hc(h)}`} style={{width:`${h}%`}}/></div>
                    <div className="health-label">{h>=70?"Excellent":h>=40?"Moderate":"Needs Attention"}</div>
                  </div>
                </div>
              </>)}
            </div>
          </div>
        )}

        {/* Commit chart */}
        {cd.length > 0 && (
          <div className="card chart-full">
            <div className="card-header"><span className="card-title">Commit Activity</span><span className="card-badge">{tr?.name}</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cd}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)"/>
                <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false}/>
                <YAxis tick={tick} axisLine={false} tickLine={false} width={28}/>
                <Tooltip content={<Tooltip_/>}/>
                <Line type="monotone" dataKey="commits" stroke="var(--accent)" strokeWidth={2}
                  dot={{r:3,fill:"var(--accent)",strokeWidth:0}} activeDot={{r:5,fill:"var(--accent)",strokeWidth:0}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Inactive */}
        {inactive.length > 0 && (
          <div className="card inactive-list">
            <div className="card-header"><span className="card-title">Inactive Repositories</span><span className="card-badge">{inactive.length} found</span></div>
            {inactive.slice(0,6).map(r=>(
              <div key={r.id} className="inactive-item">
                <div className="inactive-item-name">{r.name}</div>
                <span className="inactive-date">Last: {fmtDate(r.updated_at)}</span>
              </div>
            ))}
          </div>
        )}
      </>)}
    </>
  );

  /* ── Analytics page JSX ── */
  const starLb = useMemo(() =>
    [...repos].sort((a,b)=>b.stargazers_count-a.stargazers_count).slice(0,8)
      .map(r=>({name:r.name.length>14?r.name.slice(0,14)+"…":r.name,stars:r.stargazers_count,forks:r.forks_count})),
  [repos]);

  const actBuckets = useMemo(() => {
    const b={"< 30d":0,"30–90d":0,"90–180d":0,"> 180d":0};
    repos.forEach(r=>{ const d=(Date.now()-new Date(r.updated_at))/864e5; if(d<30)b["< 30d"]++; else if(d<90)b["30–90d"]++; else if(d<180)b["90–180d"]++; else b["> 180d"]++; });
    return Object.entries(b).map(([label,count],i)=>({label,count,fill:palette[i]}));
  }, [repos, palette]);

  const commitsByDay = useMemo(() => {
    const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], m={Sun:0,Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0};
    commits.forEach(c=>{ m[days[new Date(c.commit.author.date).getDay()]]++; });
    return days.map(d=>({day:d,commits:m[d]}));
  }, [commits]);

  const radarData = useMemo(() => {
    if (!user || !repos.length) return [];
    const norm=(v,max)=>Math.min(100,Math.round((v/max)*100));
    const active=repos.filter(r=>(Date.now()-new Date(r.updated_at))/864e5<90).length;
    return [
      {metric:"Stars",    value:norm(totalStars,5000)},
      {metric:"Forks",    value:norm(totalForks,1000)},
      {metric:"Reach",    value:norm(user.followers,2000)},
      {metric:"Languages",value:norm(ld.length,10)},
      {metric:"Activity", value:norm(active,repos.length||1)},
      {metric:"Repos",    value:norm(repos.length,100)},
    ];
  }, [user, repos, totalStars, totalForks, ld]);

  const topReposSorted = useMemo(() =>
    [...repos].sort((a,b)=>b.stargazers_count-a.stargazers_count).slice(0,10),
  [repos]);

  const analyticsJSX = user ? (()=>{
    const avgStars   = repos.length ? Math.round(totalStars/repos.length) : 0;
    const avgForks   = repos.length ? Math.round(totalForks/repos.length) : 0;
    const topLang    = ld.length ? ld.reduce((a,b)=>b.value>a.value?b:a) : null;
    const totalIssues= repos.reduce((a,r)=>a+r.open_issues_count,0);
    const fsRatio    = totalStars ? (totalForks/totalStars).toFixed(2)+"×" : "—";

    return (<>
      <div className="analytics-section-header">
        <div>
          <h2 className="analytics-title">Deep Analytics</h2>
          <p className="analytics-sub">Profile breakdown for <span style={{color:"var(--accent)"}}>@{user.login}</span></p>
        </div>
        <div className="analytics-header-badges">
          <span className="card-badge">{repos.length} repos</span>
          <span className="card-badge" style={{borderColor:"var(--accent-green)",color:"var(--accent-green)",background:"rgba(104,211,145,0.08)"}}>{ld.length} languages</span>
        </div>
      </div>

      <div className="kpi-strip">
        {[
          {label:"Avg Stars / Repo",  value:avgStars,              color:"var(--accent-amber)"},
          {label:"Avg Forks / Repo",  value:avgForks,              color:"var(--accent-green)"},
          {label:"Top Language",      value:topLang?.name??"—",    color:"var(--accent)"},
          {label:"Fork / Star Ratio", value:fsRatio,               color:"var(--accent-purple)"},
          {label:"Active Repos",      value:repos.length-inactive.length, color:"var(--accent-green)"},
          {label:"Open Issues Total", value:totalIssues,           color:"var(--accent-red)"},
        ].map(k=>(
          <div key={k.label} className="kpi-item">
            <div className="kpi-value" style={{color:k.color}}>{typeof k.value==="number"?k.value.toLocaleString():k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Stars & Forks by Repo</span><span className="card-badge">top 8</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={starLb} layout="vertical" barSize={8} barGap={2}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false}/>
              <XAxis type="number" tick={tick} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={tick} axisLine={false} tickLine={false} width={100}/>
              <Tooltip content={<Tooltip_/>}/>
              <Bar dataKey="stars" fill="var(--accent-amber)" radius={[0,2,2,0]}/>
              <Bar dataKey="forks" fill="var(--accent-green)" radius={[0,2,2,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div className="legend" style={{marginTop:8}}>
            <div className="legend-item"><div className="legend-dot" style={{background:"var(--accent-amber)"}}/><span>Stars</span></div>
            <div className="legend-item"><div className="legend-dot" style={{background:"var(--accent-green)"}}/><span>Forks</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Developer Profile Radar</span><span className="card-badge">normalised</span></div>
          <ResponsiveContainer width="100%" height={270}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)"/>
              <PolarAngleAxis dataKey="metric" tick={tick}/>
              <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.18} strokeWidth={2}/>
              <Tooltip content={<Tooltip_/>}/>
            </RadarChart>
          </ResponsiveContainer>
          <p style={{fontSize:10,color:"var(--text-muted)",marginTop:4,letterSpacing:1}}>All axes normalised 0–100 against benchmarks.</p>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Repo Activity Age</span><span className="card-badge">by last push</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={actBuckets} barSize={32}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false}/>
              <YAxis tick={tick} axisLine={false} tickLine={false} width={28}/>
              <Tooltip content={<Tooltip_/>}/>
              <Bar dataKey="count" radius={[3,3,0,0]}>{actBuckets.map(b=><Cell key={b.label} fill={b.fill}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Commits by Day of Week</span><span className="card-badge">{tr?.name??"top repo"}</span></div>
          {commitsByDay.some(d=>d.commits>0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={commitsByDay} barSize={24}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false}/>
                <YAxis tick={tick} axisLine={false} tickLine={false} width={28}/>
                <Tooltip content={<Tooltip_/>}/>
                <Bar dataKey="commits" fill="var(--accent)" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{padding:"32px 0",textAlign:"center",color:"var(--text-muted)",fontSize:12}}>No commit data loaded.</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Repository Leaderboard</span><span className="card-badge">top 10 by ★</span></div>
        <div className="table-wrap">
          <table className="repo-table">
            <thead><tr><th>#</th><th>Repository</th><th>Language</th><th>Stars</th><th>Forks</th><th>Issues</th><th>Updated</th><th>Health</th></tr></thead>
            <tbody>
              {topReposSorted.map((r,i)=>{
                const rh=repoHealth(r), rc=hc(rh);
                const li=ld.findIndex(l=>l.name===r.language);
                const lc=li>=0?palette[li%palette.length]:"var(--text-muted)";
                return (
                  <tr key={r.id} className="repo-row">
                    <td className="repo-rank">{String(i+1).padStart(2,"0")}</td>
                    <td className="repo-name-cell">
                      <a href={r.html_url} target="_blank" rel="noreferrer">{r.name}</a>
                      {r.description&&<span className="repo-desc">{r.description}</span>}
                    </td>
                    <td>{r.language?<span className="lang-tag" style={{color:lc,background:lc+"22",borderColor:lc+"55"}}>{r.language}</span>:<span style={{color:"var(--text-muted)"}}>—</span>}</td>
                    <td className="num-cell" style={{color:"var(--accent-amber)"}}>★ {r.stargazers_count.toLocaleString()}</td>
                    <td className="num-cell" style={{color:"var(--accent-green)"}}>⑂ {r.forks_count.toLocaleString()}</td>
                    <td className="num-cell" style={{color:r.open_issues_count>20?"var(--accent-red)":"var(--text-secondary)"}}>{r.open_issues_count}</td>
                    <td className="date-cell">{daysAgo(r.updated_at)}</td>
                    <td><div className="mini-health"><div className="mini-health-bar"><div className={`mini-health-fill ${rc}`} style={{width:`${rh}%`}}/></div><span className={`mini-health-score ${rc}`}>{rh}</span></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>);
  })() : (
    <div className="empty-state">
      <Logo/>
      <h3>No data to analyse</h3>
      <p>Search for a GitHub user on the Dashboard first.</p>
    </div>
  );

  /* ── Compare page JSX ── */
  const sharedLangs = useMemo(() =>
    ld.filter(l=>ld2.some(l2=>l2.name===l.name)).map(l=>l.name),
  [ld, ld2]);

  const headToHead = useMemo(() => [
    {metric:"Repos",     a:repos.length,      b:repos2.length},
    {metric:"Stars",     a:totalStars,         b:totalStars2},
    {metric:"Forks",     a:totalForks,         b:totalForks2},
    {metric:"Followers", a:user?.followers||0, b:user2?.followers||0},
    {metric:"Languages", a:ld.length,          b:ld2.length},
    {metric:"Inactive",  a:inactive.length,    b:inactive2.length},
  ], [repos, repos2, totalStars, totalStars2, totalForks, totalForks2, user, user2, ld, ld2, inactive, inactive2]);

  const compareJSX = (
    <>
      <div className="analytics-section-header" style={{marginBottom:0}}>
        <div>
          <h2 className="analytics-title">Head-to-Head Compare</h2>
          <p className="analytics-sub">Compare two GitHub developers side by side</p>
        </div>
      </div>

      <div className="compare-search-row">
        <div className="search-card" style={{flex:1}}>
          <span className="search-label">User A</span>
          <div className="search-input-wrap">
            <span className="search-prefix">github.com/</span>
            <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={handleKey}/>
          </div>
          <button className="btn-search" onClick={fetchData} disabled={loading}>{loading?"…":"Load →"}</button>
        </div>
        <div className="compare-vs">VS</div>
        <div className="search-card" style={{flex:1}}>
          <span className="search-label">User B</span>
          <div className="search-input-wrap">
            <span className="search-prefix">github.com/</span>
            <input placeholder="username" value={username2} onChange={e=>setUsername2(e.target.value)} onKeyDown={handleKey2}/>
          </div>
          <button className="btn-search" onClick={fetchData2} disabled={loading2}>{loading2?"…":"Load →"}</button>
        </div>
      </div>

      <div className="compare-profiles">
        {[{u:user,rs:repos,langs:ld,top:tr,ts:totalStars,tf:totalForks},{u:user2,rs:repos2,langs:ld2,top:tr2,ts:totalStars2,tf:totalForks2}].map((p,side)=>(
          <div key={side} className="compare-col" style={side===0?{}:{borderLeft:"1px solid var(--border)"}}>
            {p.u ? (<>
              <img className="compare-avatar" src={p.u.avatar_url} alt={p.u.login}/>
              <div className="compare-name">{p.u.name||p.u.login}</div>
              <div className="compare-login">@{p.u.login}</div>
              {p.u.bio&&<div className="compare-bio">{p.u.bio}</div>}
              <div className="compare-stats">
                {[["★ Stars",p.ts],["⑂ Forks",p.tf],["Repos",p.rs.length],["Followers",p.u.followers]].map(([l,v])=>(
                  <div key={l} className="compare-stat-item">
                    <span className="compare-stat-value">{Number(v).toLocaleString()}</span>
                    <span className="compare-stat-label">{l}</span>
                  </div>
                ))}
              </div>
              {p.top&&(
                <div className="compare-top-repo">
                  <span className="compare-top-repo-label">Top Repo</span>
                  <span className="compare-top-repo-name">{p.top.name}</span>
                  <span style={{color:"var(--accent-amber)",fontSize:11}}>★ {p.top.stargazers_count.toLocaleString()}</span>
                </div>
              )}
              <div className="compare-langs">
                {p.langs.slice(0,6).map(l=>(
                  <span key={l.name} className="lang-tag" style={{color:l.fill,background:l.fill+"22",borderColor:l.fill+"55",fontSize:10}}>{l.name}</span>
                ))}
              </div>
            </>) : <div style={{color:"var(--text-muted)",fontSize:12,textAlign:"center",padding:"40px 0"}}>No data loaded</div>}
          </div>
        ))}
      </div>

      {user && user2 && (<>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Head-to-Head Comparison</span>
            <span className="card-badge">{user.login} vs {user2.login}</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={headToHead} layout="vertical" barSize={10} barGap={4}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false}/>
              <XAxis type="number" tick={tick} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="metric" tick={tick} axisLine={false} tickLine={false} width={72}/>
              <Tooltip content={<Tooltip_/>}/>
              <Bar dataKey="a" name={user.login}  fill="var(--accent)"       radius={[0,2,2,0]}/>
              <Bar dataKey="b" name={user2.login} fill="var(--accent-purple)" radius={[0,2,2,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div className="legend" style={{marginTop:8}}>
            <div className="legend-item"><div className="legend-dot" style={{background:"var(--accent)"}}/><span>{user.login}</span></div>
            <div className="legend-item"><div className="legend-dot" style={{background:"var(--accent-purple)"}}/><span>{user2.login}</span></div>
          </div>
        </div>

        {sharedLangs.length>0&&(
          <div className="card">
            <div className="card-header"><span className="card-title">Shared Languages</span><span className="card-badge">{sharedLangs.length} in common</span></div>
            <div className="legend" style={{gap:"8px 12px"}}>
              {sharedLangs.map((lang,i)=>(
                <span key={lang} className="lang-tag" style={{color:palette[i%palette.length],background:palette[i%palette.length]+"22",borderColor:palette[i%palette.length]+"55",fontSize:12,padding:"4px 12px"}}>{lang}</span>
              ))}
            </div>
          </div>
        )}

        <div className="compare-winner-grid">
          {[
            {label:"Most Stars",     winner:totalStars>totalStars2?user.login:user2.login,  val:`${Math.max(totalStars,totalStars2).toLocaleString()} ★`},
            {label:"Most Repos",     winner:repos.length>repos2.length?user.login:user2.login, val:`${Math.max(repos.length,repos2.length)} repos`},
            {label:"Most Followers", winner:user.followers>user2.followers?user.login:user2.login, val:Math.max(user.followers,user2.followers).toLocaleString()},
            {label:"More Languages", winner:ld.length>ld2.length?user.login:user2.login,   val:`${Math.max(ld.length,ld2.length)} langs`},
          ].map(w=>(
            <div key={w.label} className="compare-winner-card">
              <div className="compare-winner-label">{w.label}</div>
              <div className="compare-winner-name">{w.winner}</div>
              <div className="compare-winner-val">{w.val}</div>
            </div>
          ))}
        </div>
      </>)}

      {(!user||!user2)&&(
        <div className="empty-state" style={{padding:"40px 0"}}>
          <div className="empty-state-icon">⊞</div>
          <p>Load both users above to see the full comparison.</p>
        </div>
      )}
    </>
  );

  const pages = [dashboardJSX, analyticsJSX, compareJSX];

  return (
    <div className="app">
      <Sidebar activeNav={activeNav} onNav={handleNav}/>
      <main className="main">
        <Header activeNav={activeNav} theme={theme} onToggleTheme={toggleTheme}/>
        <div className="content">
          {pages.map((page, i) => (
            <div key={i} style={{ display: i === activeNav ? "contents" : "none" }}>
              {page}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}