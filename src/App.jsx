import { useEffect, useMemo, useState } from "react";

const initialPlayers = [
  { name: "Fannsi", alias: "Åberg", handicap: 3.3, team: "Europe" },
  { name: "Biggi", alias: "McIlroy", handicap: 5.3, team: "Europe" },
  { name: "Jói Hnefi", alias: "Rose", handicap: 12.2, team: "Europe" },
  { name: "Svavar", alias: "Hovland", handicap: 14.0, team: "Europe" },
  { name: "Þröstur", alias: "Fleetwood", handicap: 20.5, team: "Europe" },
  { name: "Jóhannes", alias: "Lowry", handicap: 20.5, team: "Europe" },
  { name: "Ómar", alias: "Woods", handicap: 4.3, team: "USA" },
  { name: "Anton", alias: "Scheffler", handicap: 7.6, team: "USA" },
  { name: "Hemmi", alias: "Koepka", handicap: 10.5, team: "USA" },
  { name: "Ægir", alias: "DeChambeau", handicap: 12.4, team: "USA" },
  { name: "Ingvar", alias: "Thomas", handicap: 10.0, team: "USA" },
  { name: "Ari", alias: "Schauffele", handicap: 20.5, team: "USA" },
];

const aliasPool = [
  "Scheffler",
  "McIlroy",
  "Åberg",
  "Rahm",
  "Fleetwood",
  "Koepka",
  "Hovland",
  "Lowry",
  "Hatton",
  "Thomas",
  "Rose",
  "DeChambeau",
];

function parseNum(value) {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function fmt(value) {
  return Number(value || 0).toFixed(1);
}

function rebalanceTeams(players) {
  const sorted = [...players].sort((a, b) => a.handicap - b.handicap);
  const europe = [];
  const usa = [];
  let eTotal = 0;
  let uTotal = 0;

  sorted.forEach((player) => {
    if (europe.length >= 6) {
      usa.push({ ...player, team: "USA" });
      uTotal += Number(player.handicap || 0);
      return;
    }
    if (usa.length >= 6) {
      europe.push({ ...player, team: "Europe" });
      eTotal += Number(player.handicap || 0);
      return;
    }

    if (eTotal <= uTotal) {
      europe.push({ ...player, team: "Europe" });
      eTotal += Number(player.handicap || 0);
    } else {
      usa.push({ ...player, team: "USA" });
      uTotal += Number(player.handicap || 0);
    }
  });

  return [...europe, ...usa].sort((a, b) => a.name.localeCompare(b.name));
}

function pairSpread(teamPlayers) {
  const p = [...teamPlayers].sort((a, b) => a.handicap - b.handicap);
  return [
    [p[0], p[5]],
    [p[1], p[4]],
    [p[2], p[3]],
  ];
}

function singlesFromScreens(players) {
  const byName = Object.fromEntries(players.map((p) => [p.name, p]));
  const plan = [
    ["Fannsi", "Ómar", "Simulator 1"],
    ["Biggi", "Ingvar", "Simulator 2"],
    ["Jói Hnefi", "Hemmi", "Simulator 3"],
    ["Svavar", "Anton", "Simulator 1"],
    ["Jóhannes", "Ægir", "Simulator 2"],
    ["Þröstur", "Ari", "Simulator 3"],
  ];

  return plan.map(([eName, uName, simulator]) => {
    const europePlayer = byName[eName];
    const usaPlayer = byName[uName];
    const diff = Math.abs(europePlayer.handicap - usaPlayer.handicap);
    const strokePlayer =
      europePlayer.handicap > usaPlayer.handicap
        ? eName
        : europePlayer.handicap < usaPlayer.handicap
        ? uName
        : "Level";

    return {
      round: "Singles (HCP)",
      simulator,
      matchup: `${eName} vs ${uName}`,
      points: 1,
      winner: "",
      hole: "",
      scoreA: "",
      scoreB: "",
      hcpA: europePlayer.handicap,
      hcpB: usaPlayer.handicap,
      hcpDiff: Number(diff.toFixed(1)),
      strokePlayer,
    };
  });
}

function generateMatches(players) {
  const europe = players.filter((p) => p.team === "Europe").sort((a, b) => a.handicap - b.handicap);
  const usa = players.filter((p) => p.team === "USA").sort((a, b) => a.handicap - b.handicap);

  const eTexas = pairSpread(europe);
  const uTexas = pairSpread(usa);
  const eFourball = pairSpread(europe);
  const uFourball = pairSpread(usa);

  const texas = eTexas.map((pair, i) => ({
    round: "Texas Scramble",
    simulator: `Simulator ${i + 1}`,
    matchup: `${pair[0].name} & ${pair[1].name} vs ${uTexas[i][0].name} & ${uTexas[i][1].name}`,
    points: 1,
    winner: "",
    hole: "",
    scoreA: "",
    scoreB: "",
  }));

  const fourball = eFourball.map((pair, i) => ({
    round: "Fourball",
    simulator: `Simulator ${i + 1}`,
    matchup: `${pair[0].name} & ${pair[1].name} vs ${uFourball[i][0].name} & ${uFourball[i][1].name}`,
    points: 1,
    winner: "",
    hole: "",
    scoreA: "",
    scoreB: "",
  }));

  return [...texas, ...fourball, ...singlesFromScreens(players)];
}

function buildPoints(players) {
  return Object.fromEntries(players.map((p) => [p.name, 0]));
}

function buildSideStats(players) {
  return Object.fromEntries(
    players.map((p) => [p.name, { bestDrive: "", nearestHole: "" }])
  );
}

const sectionStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d0d7de",
  fontSize: 14,
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  background: "white",
  cursor: "pointer",
  fontSize: 14,
};

const primaryButton = {
  ...buttonStyle,
  background: "#111827",
  color: "white",
  border: "1px solid #111827",
};

function TeamCard({ title, players, total }) {
  const isEurope = title === "Europe";
  const playerCardStyle = {
    display: "flex",
    justifyContent: "space-between",
    border: isEurope ? "1px solid #bfdbfe" : "1px solid #fecaca",
    background: isEurope ? "#eff6ff" : "#fef2f2",
    borderRadius: 12,
    padding: 10,
  };

  return (
    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ color: "#475569", marginBottom: 12 }}>Total handicap: {fmt(total)}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {players.map((p) => (
          <div key={p.name} style={playerCardStyle}>
            <div>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{p.alias}</div>
            </div>
            <div>{fmt(p.handicap)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const storageKey = "nomy-cup-state-v1";

  const loadState = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saved = loadState();
  const [players, setPlayers] = useState(saved?.players || initialPlayers);
  const [matches, setMatches] = useState(saved?.matches || generateMatches(saved?.players || initialPlayers));
  const [individualPoints, setIndividualPoints] = useState(saved?.individualPoints || buildPoints(saved?.players || initialPlayers));
  const [sideStats, setSideStats] = useState(saved?.sideStats || buildSideStats(saved?.players || initialPlayers));
  const [tab, setTab] = useState(saved?.tab || "teams");
  const [mobileSimulator, setMobileSimulator] = useState(saved?.mobileSimulator || "Simulator 1");
  const [bestDriveWinner, setBestDriveWinner] = useState(saved?.bestDriveWinner || "");
  const [bestDriveValue, setBestDriveValue] = useState(saved?.bestDriveValue || "");
  const [nearestWinner, setNearestWinner] = useState(saved?.nearestWinner || "");
  const [nearestValue, setNearestValue] = useState(saved?.nearestValue || "");

  const europePlayers = useMemo(() => players.filter((p) => p.team === "Europe"), [players]);
  const usaPlayers = useMemo(() => players.filter((p) => p.team === "USA"), [players]);
  const europeTotal = useMemo(() => europePlayers.reduce((a, p) => a + p.handicap, 0), [europePlayers]);
  const usaTotal = useMemo(() => usaPlayers.reduce((a, p) => a + p.handicap, 0), [usaPlayers]);

  const teamPoints = useMemo(() => {
    let europe = 0;
    let usa = 0;
    matches.forEach((m) => {
      if (m.winner === "Europe") europe += Number(m.points || 0);
      if (m.winner === "USA") usa += Number(m.points || 0);
      if (m.winner === "Halved") {
        europe += Number(m.points || 0) / 2;
        usa += Number(m.points || 0) / 2;
      }
    });
    return { europe, usa };
  }, [matches]);

  const leaderboard = useMemo(() => {
    return [...players]
      .map((p) => ({ ...p, points: Number(individualPoints[p.name] || 0) }))
      .sort((a, b) => b.points - a.points || a.handicap - b.handicap);
  }, [players, individualPoints]);

  const mobileMatches = useMemo(
    () => matches.filter((m) => m.simulator === mobileSimulator),
    [matches, mobileSimulator]
  );

  const updatePlayer = (index, field, value) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: field === "handicap" ? parseNum(value) : value } : p)));
  };

  const applyRoster = () => {
    const cleaned = players.map((p, i) => ({
      ...p,
      name: (p.name || `Player ${i + 1}`).trim(),
      alias: (p.alias || aliasPool[i] || `Alias ${i + 1}`).trim(),
      handicap: parseNum(p.handicap),
    }));
    setPlayers(cleaned);
    setMatches(generateMatches(cleaned));
    setIndividualPoints((prev) => Object.fromEntries(cleaned.map((p) => [p.name, prev[p.name] || 0])));
    setSideStats((prev) => Object.fromEntries(cleaned.map((p) => [p.name, prev[p.name] || { bestDrive: "", nearestHole: "" }])));
  };

  const autoRebalance = () => {
    const balanced = rebalanceTeams(players);
    setPlayers(balanced);
    setMatches(generateMatches(balanced));
    setIndividualPoints((prev) => Object.fromEntries(balanced.map((p) => [p.name, prev[p.name] || 0])));
    setSideStats((prev) => Object.fromEntries(balanced.map((p) => [p.name, prev[p.name] || { bestDrive: "", nearestHole: "" }])));
  };

  const updateMatch = (idx, field, value) => {
    setMatches((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const updateWinner = (idx, winner) => updateMatch(idx, "winner", winner);

  const updatePointEntry = (name, value) => {
    setIndividualPoints((prev) => ({ ...prev, [name]: parseNum(value) }));
  };

  const updateSideStat = (name, field, value) => {
    setSideStats((prev) => ({
      ...prev,
      [name]: { ...(prev[name] || { bestDrive: "", nearestHole: "" }), [field]: value },
    }));
  };

  const tabs = ["teams", "matches", "mobile", "sidegames", "leaderboard"];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      players,
      matches,
      individualPoints,
      sideStats,
      tab,
      mobileSimulator,
      bestDriveWinner,
      bestDriveValue,
      nearestWinner,
      nearestValue,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [players, matches, individualPoints, sideStats, tab, mobileSimulator, bestDriveWinner, bestDriveValue, nearestWinner, nearestValue]);

  const resetSavedData = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
    setPlayers(initialPlayers);
    setMatches(generateMatches(initialPlayers));
    setIndividualPoints(buildPoints(initialPlayers));
    setSideStats(buildSideStats(initialPlayers));
    setTab("teams");
    setMobileSimulator("Simulator 1");
    setBestDriveWinner("");
    setBestDriveValue("");
    setNearestWinner("");
    setNearestValue("");
  };

  const getPlayerColors = (team) => ({
    border: team === "Europe" ? "1px solid #bfdbfe" : "1px solid #fecaca",
    background: team === "Europe" ? "#eff6ff" : "#fef2f2",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 16, fontFamily: "Arial, sans-serif", color: "#0f172a" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={sectionStyle}>
          <h1 style={{ margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: 10 }}>
            🏆 <span style={{ fontWeight: 800 }}>Nomy Cup</span>
          </h1>
          <div style={{ color: "#475569", marginBottom: 12 }}>Texas Scramble • Fourball • Singles (HCP)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div style={{ border: "1px solid #1e40af", background: "#1e3a8a", borderRadius: 14, padding: 12, color: "white" }}>
              <div style={{ color: "#ffffff", fontSize: 13 }}>Europe</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{teamPoints.europe.toFixed(1)}</div>
              <div style={{ color: "#475569" }}>Total HCP {fmt(europeTotal)}</div>
            </div>
            <div style={{ border: "1px solid #991b1b", background: "#7f1d1d", borderRadius: 14, padding: 12, color: "white" }}>
              <div style={{ color: "#ffffff", fontSize: 13 }}>USA</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{teamPoints.usa.toFixed(1)}</div>
              <div style={{ color: "#475569" }}>Total HCP {fmt(usaTotal)}</div>
            </div>
            <div style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 14, padding: 12 }}>
              <div style={{ color: "#475569", fontSize: 13 }}>Status</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {teamPoints.europe === teamPoints.usa ? "Tied" : teamPoints.europe > teamPoints.usa ? "Europe" : "USA"}
              </div>
              <div style={{ color: "#475569" }}>Winning target 6.5</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={tab === t ? primaryButton : buttonStyle}
            >
              {t === "sidegames" ? "Side Games" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "teams" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Edit players and handicaps</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {players.map((player, index) => (
                  <div key={`${player.name}-${index}`} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 10, padding: 10, borderRadius: 12, ...getPlayerColors(player.team) }}>
                    <input style={inputStyle} value={player.name} onChange={(e) => updatePlayer(index, "name", e.target.value)} placeholder="Name" />
                    <input style={inputStyle} value={player.alias} onChange={(e) => updatePlayer(index, "alias", e.target.value)} placeholder="Alias" />
                    <input style={inputStyle} type="number" step="0.1" value={player.handicap} onChange={(e) => updatePlayer(index, "handicap", e.target.value)} placeholder="HCP" />
                    <input style={inputStyle} value={player.team} onChange={(e) => updatePlayer(index, "team", e.target.value)} placeholder="Team" />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                <button style={primaryButton} onClick={applyRoster}>Apply & regenerate</button>
                <button style={buttonStyle} onClick={autoRebalance}>Auto rebalance teams</button>
                <button style={buttonStyle} onClick={resetSavedData}>Reset saved data</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <TeamCard title="Europe" players={europePlayers} total={europeTotal} />
              <TeamCard title="USA" players={usaPlayers} total={usaTotal} />
            </div>
          </div>
        )}

        {tab === "matches" && (
          <div style={{ display: "grid", gap: 16 }}>
            {['Texas Scramble', 'Fourball', 'Singles (HCP)'].map((round) => (
              <div key={round} style={sectionStyle}>
                <h2 style={{ marginTop: 0 }}>{round}</h2>
                <div style={{ display: 'grid', gap: 12 }}>
                  {matches.map((match, idx) => match.round === round ? (
                    <div key={`${round}-${idx}`} style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 12 }}>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{match.simulator}</div>
                      <div style={{ fontWeight: 700, margin: '4px 0 8px 0' }}>{match.matchup}</div>
                      {round === 'Singles (HCP)' && (
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                          Europe {fmt(match.hcpA)} • USA {fmt(match.hcpB)} • {match.strokePlayer} gets {fmt(match.hcpDiff)} strokes
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <input style={inputStyle} placeholder="Current hole" value={match.hole} onChange={(e) => updateMatch(idx, 'hole', e.target.value)} />
                        <input style={inputStyle} placeholder="Europe side" value={match.scoreA} onChange={(e) => updateMatch(idx, 'scoreA', e.target.value)} />
                        <input style={inputStyle} placeholder="USA side" value={match.scoreB} onChange={(e) => updateMatch(idx, 'scoreB', e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button style={match.winner === 'Europe' ? primaryButton : buttonStyle} onClick={() => updateWinner(idx, 'Europe')}>Europe win</button>
                        <button style={match.winner === 'USA' ? primaryButton : buttonStyle} onClick={() => updateWinner(idx, 'USA')}>USA win</button>
                        <button style={match.winner === 'Halved' ? primaryButton : buttonStyle} onClick={() => updateWinner(idx, 'Halved')}>Halved</button>
                      </div>
                    </div>
                  ) : null)}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "mobile" && (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <div style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Simulator entry</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {['Simulator 1','Simulator 2','Simulator 3'].map((sim) => (
                  <button key={sim} style={mobileSimulator === sim ? primaryButton : buttonStyle} onClick={() => setMobileSimulator(sim)}>{sim.replace('Simulator ','Sim ')}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {mobileMatches.map((match, idx) => {
                const realIndex = matches.findIndex((m) => m.round === match.round && m.simulator === match.simulator && m.matchup === match.matchup);
                return (
                  <div key={`${match.matchup}-${idx}`} style={sectionStyle}>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{match.round}</div>
                    <div style={{ fontWeight: 700, margin: '6px 0 10px 0' }}>{match.matchup}</div>
                    {match.round === 'Singles (HCP)' && (
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                        {match.strokePlayer} gets {fmt(match.hcpDiff)} strokes
                      </div>
                    )}
                    <div style={{ display: 'grid', gap: 8 }}>
                      <input style={{ ...inputStyle, height: 44 }} placeholder="Current hole" value={match.hole} onChange={(e) => updateMatch(realIndex, 'hole', e.target.value)} />
                      <input style={{ ...inputStyle, height: 44 }} placeholder="Europe side score" value={match.scoreA} onChange={(e) => updateMatch(realIndex, 'scoreA', e.target.value)} />
                      <input style={{ ...inputStyle, height: 44 }} placeholder="USA side score" value={match.scoreB} onChange={(e) => updateMatch(realIndex, 'scoreB', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 10 }}>
                      <button style={match.winner === 'Europe' ? primaryButton : buttonStyle} onClick={() => updateWinner(realIndex, 'Europe')}>Europe win</button>
                      <button style={match.winner === 'USA' ? primaryButton : buttonStyle} onClick={() => updateWinner(realIndex, 'USA')}>USA win</button>
                      <button style={match.winner === 'Halved' ? primaryButton : buttonStyle} onClick={() => updateWinner(realIndex, 'Halved')}>Halved</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "sidegames" && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Overall side game winners</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ marginBottom: 6 }}>Best drive winner</div>
                  <input style={inputStyle} value={bestDriveWinner} onChange={(e) => setBestDriveWinner(e.target.value)} placeholder="Player" />
                </div>
                <div>
                  <div style={{ marginBottom: 6 }}>Best drive value</div>
                  <input style={inputStyle} value={bestDriveValue} onChange={(e) => setBestDriveValue(e.target.value)} placeholder="e.g. 289 m" />
                </div>
                <div>
                  <div style={{ marginBottom: 6 }}>Nearest hole winner</div>
                  <input style={inputStyle} value={nearestWinner} onChange={(e) => setNearestWinner(e.target.value)} placeholder="Player" />
                </div>
                <div>
                  <div style={{ marginBottom: 6 }}>Nearest hole value</div>
                  <input style={inputStyle} value={nearestValue} onChange={(e) => setNearestValue(e.target.value)} placeholder="e.g. 1.82 m" />
                </div>
              </div>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Per-player long drive and nearest to hole</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {players.map((player) => (
                  <div key={player.name} style={{ borderRadius: 14, padding: 12, ...getPlayerColors(player.team) }}>
                    <div style={{ fontWeight: 700 }}>{player.name}</div>
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 10 }}>{player.alias} • {player.team}</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <input style={inputStyle} value={sideStats[player.name]?.bestDrive || ''} onChange={(e) => updateSideStat(player.name, 'bestDrive', e.target.value)} placeholder="Best drive" />
                      <input style={inputStyle} value={sideStats[player.name]?.nearestHole || ''} onChange={(e) => updateSideStat(player.name, 'nearestHole', e.target.value)} placeholder="Nearest hole" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Most points by single player</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {players.map((player) => (
                  <div key={`${player.name}-points`} style={{ borderRadius: 14, padding: 12, ...getPlayerColors(player.team) }}>
                    <div style={{ fontWeight: 700 }}>{player.name}</div>
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>{player.team}</div>
                    <input style={inputStyle} type="number" step="0.5" value={individualPoints[player.name] ?? 0} onChange={(e) => updatePointEntry(player.name, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "leaderboard" && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div style={{ ...sectionStyle, gridColumn: 'span 2' }}>
              <h2 style={{ marginTop: 0 }}>Individual leaderboard</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {leaderboard.map((player, index) => (
                  <div key={player.name} style={{ display: 'flex', justifyContent: 'space-between', borderRadius: 12, padding: 10, ...getPlayerColors(player.team) }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{index + 1}. {player.name}</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>{player.alias} • {player.team}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{fmt(player.points)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Side games summary</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                <div><strong>Best drive:</strong> {bestDriveWinner || '—'} {bestDriveValue ? `• ${bestDriveValue}` : ''}</div>
                <div><strong>Nearest hole:</strong> {nearestWinner || '—'} {nearestValue ? `• ${nearestValue}` : ''}</div>
                <div><strong>Formats:</strong> Texas Scramble, Fourball, Singles (HCP)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
