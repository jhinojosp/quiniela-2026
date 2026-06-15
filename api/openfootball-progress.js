const OPENFOOTBALL_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const TEAM_NAME_MAP = {
  Mexico: "México",
  "South Africa": "Sudáfrica",
  France: "Francia",
  Spain: "España",
  Argentina: "Argentina",
  England: "Inglaterra",
  Portugal: "Portugal",
  Brazil: "Brasil",
  Netherlands: "Países Bajos",
  Morocco: "Marruecos",
  Belgium: "Bélgica",
  Germany: "Alemania",
  Croatia: "Croacia",
  Colombia: "Colombia",
  Senegal: "Senegal",
  "United States": "Estados Unidos",
  USA: "Estados Unidos",
  Uruguay: "Uruguay",
  Japan: "Japón",
  Switzerland: "Suiza",
  Iran: "Irán",
  Turkey: "Turquía",
  Ecuador: "Ecuador",
  Austria: "Austria",
  "South Korea": "Corea del Sur",
  Australia: "Australia",
  Algeria: "Argelia",
  Egypt: "Egipto",
  Canada: "Canadá",
  Norway: "Noruega",
  Panama: "Panamá",
  "Côte d’Ivoire": "Costa de Marfil",
  "Cote d'Ivoire": "Costa de Marfil",
  "Ivory Coast": "Costa de Marfil",
  Sweden: "Suecia",
  Paraguay: "Paraguay",
  Czechia: "República Checa",
  "Czech Republic": "República Checa",
  Scotland: "Escocia",
  Tunisia: "Túnez",
  "DR Congo": "RD Congo",
  "Congo DR": "RD Congo",
  Uzbekistan: "Uzbekistán",
  Qatar: "Qatar",
  Iraq: "Irak",
  "Saudi Arabia": "Arabia Saudita",
  Jordan: "Jordania",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  "Bosnia-Herzegovina": "Bosnia y Herzegovina",
  "Bosnia & Herzegovina": "Bosnia y Herzegovina",
  Bosnia: "Bosnia y Herzegovina",
  "Cape Verde": "Cabo Verde",
  Ghana: "Ghana",
  Curaçao: "Curazao",
  Curacao: "Curazao",
  Haiti: "Haití",
  "New Zealand": "Nueva Zelanda"
};

const APP_TEAMS = new Set(Object.values(TEAM_NAME_MAP));

function translateTeam(name) {
  if (!name || typeof name !== "string") return null;
  return TEAM_NAME_MAP[name] || null;
}

function blankProgress() {
  return {
    groupWins: 0,
    groupDraws: 0,
    groupLosses: 0,
    reachedR32: false,
    reachedR16: false,
    reachedR8: false,
    reachedSemifinal: false,
    wonThirdPlace: false,
    reachedFinal: false,
    champion: false
  };
}

function ensure(progress, team) {
  if (!team || !APP_TEAMS.has(team)) return null;
  if (!progress[team]) progress[team] = blankProgress();
  return progress[team];
}

function normalizeProgress(p) {
  if (!p) return p;

  if (p.champion) {
    p.reachedFinal = true;
    p.reachedSemifinal = true;
    p.reachedR8 = true;
    p.reachedR16 = true;
    p.reachedR32 = true;
    p.wonThirdPlace = false;
  }

  if (p.reachedFinal) {
    p.reachedSemifinal = true;
    p.reachedR8 = true;
    p.reachedR16 = true;
    p.reachedR32 = true;
    p.wonThirdPlace = false;
  }

  if (p.wonThirdPlace) {
    p.reachedSemifinal = true;
    p.reachedR8 = true;
    p.reachedR16 = true;
    p.reachedR32 = true;
    p.reachedFinal = false;
    p.champion = false;
  }

  if (p.reachedSemifinal) {
    p.reachedR8 = true;
    p.reachedR16 = true;
    p.reachedR32 = true;
  }

  if (p.reachedR8) {
    p.reachedR16 = true;
    p.reachedR32 = true;
  }

  if (p.reachedR16) {
    p.reachedR32 = true;
  }

  return p;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getScorePair(match) {
  try {
    if (Number.isFinite(match.score1) && Number.isFinite(match.score2)) {
      return [match.score1, match.score2];
    }

    if (Number.isFinite(match.goals1) && Number.isFinite(match.goals2)) {
      return [match.goals1, match.goals2];
    }

    if (Array.isArray(match.score) && match.score.length >= 2) {
      const a = toNumber(match.score[0]);
      const b = toNumber(match.score[1]);
      return a === null || b === null ? null : [a, b];
    }

    if (match.score && Array.isArray(match.score.ft) && match.score.ft.length >= 2) {
      const a = toNumber(match.score.ft[0]);
      const b = toNumber(match.score.ft[1]);
      return a === null || b === null ? null : [a, b];
    }

    if (match.score && Array.isArray(match.score.fulltime) && match.score.fulltime.length >= 2) {
      const a = toNumber(match.score.fulltime[0]);
      const b = toNumber(match.score.fulltime[1]);
      return a === null || b === null ? null : [a, b];
    }

    if (typeof match.score === "string") {
      const parts = match.score.match(/(\d+)\s*[-:]\s*(\d+)/);
      if (parts) return [Number(parts[1]), Number(parts[2])];
    }

    return null;
  } catch {
    return null;
  }
}

function getWinner(match) {
  const t1 = translateTeam(match.team1);
  const t2 = translateTeam(match.team2);
  const score = getScorePair(match);

  if (!t1 || !t2 || !score) return null;

  const [s1, s2] = score;

  if (s1 > s2) return t1;
  if (s2 > s1) return t2;

  return null;
}

function applyGroupRecord(progress, match) {
  const round = String(match.round || "").toLowerCase();
  const isGroupMatch = Boolean(match.group) || round.includes("matchday");

  if (!isGroupMatch) return;

  const t1 = translateTeam(match.team1);
  const t2 = translateTeam(match.team2);
  const score = getScorePair(match);

  if (!t1 || !t2 || !score) return;

  const [s1, s2] = score;

  const p1 = ensure(progress, t1);
  const p2 = ensure(progress, t2);

  if (!p1 || !p2) return;

  if (s1 > s2) {
    p1.groupWins += 1;
    p2.groupLosses += 1;
  } else if (s2 > s1) {
    p2.groupWins += 1;
    p1.groupLosses += 1;
  } else {
    p1.groupDraws += 1;
    p2.groupDraws += 1;
  }
}

function applyRoundProgress(progress, match) {
  const round = String(match.round || "").toLowerCase();

  const t1 = translateTeam(match.team1);
  const t2 = translateTeam(match.team2);

  const p1 = ensure(progress, t1);
  const p2 = ensure(progress, t2);

  if (round.includes("round of 32")) {
    if (p1) p1.reachedR32 = true;
    if (p2) p2.reachedR32 = true;
  }

  if (round.includes("round of 16")) {
    if (p1) p1.reachedR16 = true;
    if (p2) p2.reachedR16 = true;
  }

  if (round.includes("quarter")) {
    if (p1) p1.reachedR8 = true;
    if (p2) p2.reachedR8 = true;
  }

  if (round.includes("semi")) {
    if (p1) p1.reachedSemifinal = true;
    if (p2) p2.reachedSemifinal = true;
  }

  if (round.includes("third") || round.includes("3rd")) {
    const winner = getWinner(match);
    const winnerProgress = ensure(progress, winner);
    if (winnerProgress) winnerProgress.wonThirdPlace = true;
  }

  if (round.includes("final") && !round.includes("quarter") && !round.includes("semi")) {
    if (p1) p1.reachedFinal = true;
    if (p2) p2.reachedFinal = true;

    const winner = getWinner(match);
    const winnerProgress = ensure(progress, winner);
    if (winnerProgress) winnerProgress.champion = true;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const response = await fetch(OPENFOOTBALL_URL, {
      headers: { "User-Agent": "quiniela-2026-vercel-function" }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "OpenFootball request failed",
        status: response.status
      });
    }

    const data = await response.json();
    const matches = Array.isArray(data.matches) ? data.matches : [];

    const progress = {};
    let completedWithScore = 0;
    let processingErrors = 0;

    for (const match of matches) {
      const score = getScorePair(match);

      if (score) completedWithScore += 1;

      try {
        applyGroupRecord(progress, match);
        applyRoundProgress(progress, match);
      } catch {
        processingErrors += 1;
      }
    }

    for (const team of Object.keys(progress)) {
      normalizeProgress(progress[team]);
    }

    return res.status(200).json({
      source: "openfootball",
      fetchedAt: new Date().toISOString(),
      tournament: data.name || "World Cup 2026",
      matchCount: matches.length,
      completedWithScore,
      processingErrors,
      progress,
      note:
        completedWithScore === 0
          ? "OpenFootball currently has schedule data but no scores detected."
          : "Progress and group records derived from OpenFootball match data."
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error",
      details: error.message
    });
  }
}