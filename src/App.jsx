import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// Quiniela Mundial 2026 — persistencia compartida con Supabase.
// Estética inspirada en Notion/Ghost: neutra, espaciada, sutil.
// La lógica de puntos y desempates es idéntica a la versión previa.
// ============================================================

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
const ROW_ID = 1;

const BOMBO_1 = ["Francia","España","Argentina","Inglaterra","Portugal","Brasil","Países Bajos","Marruecos","Bélgica","Alemania","Croacia","Colombia","Senegal","México","Estados Unidos","Uruguay"];
const BOMBO_2 = ["Japón","Suiza","Irán","Turquía","Ecuador","Austria","Corea del Sur","Australia","Argelia","Egipto","Canadá","Noruega","Panamá","Costa de Marfil","Suecia","Paraguay"];
const BOMBO_3 = ["República Checa","Escocia","Túnez","RD Congo","Uzbekistán","Qatar","Irak","Sudáfrica","Arabia Saudita","Jordania","Bosnia y Herzegovina","Cabo Verde","Ghana","Curazao","Haití","Nueva Zelanda"];

const FLAGS = {
  "Francia":"🇫🇷",
  "España":"🇪🇸",
  "Argentina":"🇦🇷",
  "Inglaterra":"\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
  "Portugal":"🇵🇹",
  "Brasil":"🇧🇷",
  "Países Bajos":"🇳🇱",
  "Marruecos":"🇲🇦",
  "Bélgica":"🇧🇪",
  "Alemania":"🇩🇪",
  "Croacia":"🇭🇷",
  "Colombia":"🇨🇴",
  "Senegal":"🇸🇳",
  "México":"🇲🇽",
  "Estados Unidos":"🇺🇸",
  "Uruguay":"🇺🇾",
  "Japón":"🇯🇵",
  "Suiza":"🇨🇭",
  "Irán":"🇮🇷",
  "Turquía":"🇹🇷",
  "Ecuador":"🇪🇨",
  "Austria":"🇦🇹",
  "Corea del Sur":"🇰🇷",
  "Australia":"🇦🇺",
  "Argelia":"🇩🇿",
  "Egipto":"🇪🇬",
  "Canadá":"🇨🇦",
  "Noruega":"🇳🇴",
  "Panamá":"🇵🇦",
  "Costa de Marfil":"🇨🇮",
  "Suecia":"🇸🇪",
  "Paraguay":"🇵🇾",
  "República Checa":"🇨🇿",
  "Escocia":"\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
  "Túnez":"🇹🇳",
  "RD Congo":"🇨🇩",
  "Uzbekistán":"🇺🇿",
  "Qatar":"🇶🇦",
  "Irak":"🇮🇶",
  "Sudáfrica":"🇿🇦",
  "Arabia Saudita":"🇸🇦",
  "Jordania":"🇯🇴",
  "Bosnia y Herzegovina":"🇧🇦",
  "Bosnia and Herzegovina":"🇧🇦",
  "Bosnia-Herzegovina":"🇧🇦",
  "Bosnia & Herzegovina":"🇧🇦",
  "Bosnia":"🇧🇦",
  "Cabo Verde":"🇨🇻",
  "Ghana":"🇬🇭",
  "Curazao":"🇨🇼",
  "Haití":"🇭🇹",
  "Nueva Zelanda":"🇳🇿"
};

const FIFA_RANK = {
  "Francia": 1,
  "España": 2,
  "Argentina": 3,
  "Inglaterra": 4,
  "Portugal": 5,
  "Brasil": 6,
  "Países Bajos": 7,
  "Marruecos": 8,
  "Bélgica": 9,
  "Alemania": 10,
  "Croacia": 11,
  "Colombia": 13,
  "Senegal": 14,
  "México": 15,
  "Estados Unidos": 16,
  "Uruguay": 17,

  "Japón": 18,
  "Suiza": 19,
  "Irán": 21,
  "Turquía": 22,
  "Ecuador": 23,
  "Austria": 24,
  "Corea del Sur": 25,
  "Australia": 27,
  "Argelia": 28,
  "Egipto": 29,
  "Canadá": 30,
  "Noruega": 31,
  "Panamá": 33,
  "Costa de Marfil": 34,
  "Suecia": 38,
  "Paraguay": 40,

  "República Checa": 41,
  "Escocia": 43,
  "Túnez": 44,
  "RD Congo": 46,
  "Uzbekistán": 50,
  "Qatar": 55,
  "Irak": 57,
  "Sudáfrica": 60,
  "Arabia Saudita": 61,
  "Jordania": 63,
  "Bosnia y Herzegovina": 65,
  "Cabo Verde": 69,
  "Ghana": 74,
  "Curazao": 82,
  "Haití": 83,
  "Nueva Zelanda": 85
};

const flagOf = (team) => FLAGS[team] || "🏳️";
const teamLabel = (team) => team ? `${flagOf(team)} ${team}` : "—";
function teamRankingLabel(team){
  const rank = FIFA_RANK[team];
  return `${teamLabel(team)}${rank ? ` (#${rank})` : ""}`;
}


const SCORING = {
  groupWin: 3,
  groupDraw: 1,
  reachedR32: 4,
  reachedR16: 8,
  reachedR8: 12,
  reachedSemifinal: 16,
  wonThirdPlace: 8,
  reachedFinal: 20,
  champion: 24
};

const POT_MULTIPLIER = {
  1: 1.00,
  2: 1.25,
  3: 1.75
};

const ENTRY_FEE = 500;
const NUM_PARTICIPANTS = 16;
const IS_OFFICIAL_DRAW = false;
const RANKING_SOURCE_LABEL = "FIFA/Coca-Cola Men's World Ranking";
const RANKING_SOURCE_DATE = "1 de abril de 2026";
const RANKING_SOURCE_URL = "https://inside.fifa.com/fifa-world-ranking/men";

const fmtMXN = (n) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n||0);

function makeTeam(name, pot){
  return {
    team: name,
    pot,
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

function teamPot(t){
  if(!t) return 1;
  if(t.pot) return Number(t.pot);
  if(BOMBO_1.includes(t.team)) return 1;
  if(BOMBO_2.includes(t.team)) return 2;
  if(BOMBO_3.includes(t.team)) return 3;
  return 1;
}

function teamMultiplier(t){
  return POT_MULTIPLIER[teamPot(t)] || 1;
}

function teamPoints(t){
  if(!t) return 0;

  let base = 0;

  base += (Number(t.groupWins) || 0) * SCORING.groupWin;
  base += (Number(t.groupDraws) || 0) * SCORING.groupDraw;

  if(t.reachedR32) base += SCORING.reachedR32;
  if(t.reachedR16) base += SCORING.reachedR16;
  if(t.reachedR8) base += SCORING.reachedR8;
  if(t.reachedSemifinal) base += SCORING.reachedSemifinal;
  if(t.wonThirdPlace) base += SCORING.wonThirdPlace;
  if(t.reachedFinal) base += SCORING.reachedFinal;
  if(t.champion) base += SCORING.champion;

  return Math.round(base * teamMultiplier(t));
}

function teamStageRank(t){
  if(!t) return 0;
  if(t.champion) return 7;
  if(t.reachedFinal) return 6;
  if(t.reachedSemifinal) return 5;
  if(t.reachedR8) return 4;
  if(t.reachedR16) return 3;
  if(t.reachedR32) return 2;
  return 1;
}

function normalizeTeamProgress(t, changedKey, checked){
  t[changedKey] = checked;

  if(checked){
    if(["reachedR32","reachedR16","reachedR8","reachedSemifinal","wonThirdPlace","reachedFinal","champion"].includes(changedKey)){
      t.reachedR32 = true;
    }
    if(["reachedR16","reachedR8","reachedSemifinal","wonThirdPlace","reachedFinal","champion"].includes(changedKey)){
      t.reachedR16 = true;
    }
    if(["reachedR8","reachedSemifinal","wonThirdPlace","reachedFinal","champion"].includes(changedKey)){
      t.reachedR8 = true;
    }
    if(["reachedSemifinal","wonThirdPlace","reachedFinal","champion"].includes(changedKey)){
      t.reachedSemifinal = true;
    }
    if(changedKey === "champion"){
      t.reachedFinal = true;
    }
  }

  if(!checked){
    if(changedKey === "reachedR32"){
      t.reachedR16 = false;
      t.reachedR8 = false;
      t.reachedSemifinal = false;
      t.wonThirdPlace = false;
      t.reachedFinal = false;
      t.champion = false;
    }
    if(changedKey === "reachedR16"){
      t.reachedR8 = false;
      t.reachedSemifinal = false;
      t.wonThirdPlace = false;
      t.reachedFinal = false;
      t.champion = false;
    }
    if(changedKey === "reachedR8"){
      t.reachedSemifinal = false;
      t.wonThirdPlace = false;
      t.reachedFinal = false;
      t.champion = false;
    }
    if(changedKey === "reachedSemifinal"){
      t.wonThirdPlace = false;
      t.reachedFinal = false;
      t.champion = false;
    }
    if(changedKey === "reachedFinal"){
      t.champion = false;
    }
  }

  if(t.champion){
    t.reachedFinal = true;
    t.reachedSemifinal = true;
    t.reachedR8 = true;
    t.reachedR16 = true;
    t.reachedR32 = true;
    t.wonThirdPlace = false;
  }

  if(t.reachedFinal){
    t.reachedSemifinal = true;
    t.reachedR8 = true;
    t.reachedR16 = true;
    t.reachedR32 = true;
    t.wonThirdPlace = false;
  }

  if(t.wonThirdPlace){
    t.reachedSemifinal = true;
    t.reachedR8 = true;
    t.reachedR16 = true;
    t.reachedR32 = true;
    t.reachedFinal = false;
    t.champion = false;
  }

  return t;
}

const STAGE_LABEL={7:"Campeón",6:"Final",5:"Semifinal",4:"Cuartos",3:"Octavos",2:"Ronda de 32",1:"Fase de grupos"};
const STAGE_SHORT={7:"Campeón",6:"Final",5:"Semi",4:"Cuartos",3:"Octavos",2:"R32",1:"Grupos"};

function initialState(){
  const teams={};
  BOMBO_1.forEach(n=>teams[n]=makeTeam(n,1));
  BOMBO_2.forEach(n=>teams[n]=makeTeam(n,2));
  BOMBO_3.forEach(n=>teams[n]=makeTeam(n,3));
  const participants=Array.from({length:NUM_PARTICIPANTS},(_,i)=>({id:i+1,name:`Participante ${i+1}`,paid:false,b1:null,b2:null,b3:null}));
  return {
    participants,
    teams,
    prizes:{first:4400,second:2400,third:1200},
    lastUpdated:null,
    source:"mock",
    drawLocked:false
  };
}

async function fetchWorldCupResults(currentTeams){
  const response = await fetch("/api/openfootball-progress");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "No se pudo actualizar desde OpenFootball.");
  }

  const nextTeams = structuredClone(currentTeams);

  Object.entries(data.progress || {}).forEach(([teamName, progress]) => {
    if (!nextTeams[teamName]) return;

    nextTeams[teamName] = {
      ...nextTeams[teamName],
      ...progress
    };
  });

  return {
    source: "openfootball",
    teams: nextTeams,
    meta: {
      fetchedAt: data.fetchedAt,
      matchCount: data.matchCount,
      completedWithScore: data.completedWithScore,
      note: data.note
    }
  };
}

function currentPhase(teams){
  let max=1;
  Object.values(teams).forEach(t=>{max=Math.max(max,teamStageRank(t));});
  return STAGE_LABEL[max];
}

function computeStandings(state){
  const rows=state.participants.map(p=>{
    const t1=state.teams[p.b1],t2=state.teams[p.b2],t3=state.teams[p.b3];
    const total=[t1,t2,t3].reduce((s,t)=>s+teamPoints(t),0);
    const sortedStages=[t1,t2,t3].map(teamStageRank).sort((a,b)=>b-a);
    return {...p,total,t1,t2,t3,sortedStages};
  });
  rows.sort((a,b)=>{
    if(b.total!==a.total) return b.total-a.total;
    for(let i=0;i<3;i++){ if(b.sortedStages[i]!==a.sortedStages[i]) return b.sortedStages[i]-a.sortedStages[i]; }
    return 0;
  });
  let rank=0,prevKey=null;
  rows.forEach((r,idx)=>{const key=r.total+"|"+r.sortedStages.join(",");if(key!==prevKey)rank=idx+1;r.rank=rank;prevKey=key;});
  return rows;
}

// ---- Primitivos de UI ----
const Pill=({children,tone="neutral"})=>{
  const tones={
    neutral:"bg-stone-100 text-stone-600",
    paid:"bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    due:"bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    s2:"bg-emerald-50 text-emerald-700",
    s3:"bg-sky-50 text-sky-700",
    s5:"bg-violet-50 text-violet-700",
    s7:"bg-amber-50 text-amber-800",
    prize:"bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight ${tones[tone]}`}>{children}</span>;
};
const stageTone=(r)=>r>=7?"s7":r>=5?"s5":r>=3?"s3":r>=2?"s2":"neutral";

function standingsTieKey(row){
  return row.total + "|" + row.sortedStages.join(",");
}

function estimatedPrizeForRow(row, standings, prizes){
  const prizeByPosition = {
    1: prizes.first,
    2: prizes.second,
    3: prizes.third
  };

  const rowIndex = standings.findIndex(r => r.id === row.id);
  if(rowIndex === -1) return 0;

  const tieKey = standingsTieKey(row);

  let startIndex = rowIndex;
  while(
    startIndex > 0 &&
    standingsTieKey(standings[startIndex - 1]) === tieKey
  ){
    startIndex--;
  }

  let endIndex = rowIndex;
  while(
    endIndex < standings.length - 1 &&
    standingsTieKey(standings[endIndex + 1]) === tieKey
  ){
    endIndex++;
  }

  let prizePool = 0;

  for(let i = startIndex; i <= endIndex; i++){
    const position = i + 1;
    prizePool += prizeByPosition[position] || 0;
  }

  if(prizePool === 0) return 0;

  return Math.round(prizePool / (endIndex - startIndex + 1));
}

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
  "Bosnia-Herzegovina": "Bosnia y Herzegovina",
  "Bosnia & Herzegovina": "Bosnia y Herzegovina",
  "Bosnia": "Bosnia y Herzegovina",
  "Cape Verde": "Cabo Verde",
  Ghana: "Ghana",
  Curaçao: "Curazao",
  Curacao: "Curazao",
  Haiti: "Haití",
  "New Zealand": "Nueva Zelanda"
};

const displayTeam = (name) => {
  const translated = TEAM_NAME_MAP[name] || name;
  return teamLabel(translated);
};

function parseOpenFootballDate(match){
  if(!match.date || !match.time) return null;

  const parts = String(match.time).match(/^(\d{1,2}):(\d{2})\s+UTC([+-])(\d{1,2})$/);
  if(!parts) return null;

  const hh = parts[1].padStart(2,"0");
  const mm = parts[2];
  const sign = parts[3];
  const offsetHour = parts[4].padStart(2,"0");
  const offset = `${sign}${offsetHour}:00`;

  return new Date(`${match.date}T${hh}:${mm}:00${offset}`);
}

function formatCDMXDate(match){
  const d = parseOpenFootballDate(match);
  if(!d || Number.isNaN(d.getTime())) return match.date || "—";

  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(d);
}

function formatCDMXTime(match){
  const d = parseOpenFootballDate(match);
  if(!d || Number.isNaN(d.getTime())) return match.time || "—";

  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}
function matchScore(match){
  const score = getMatchScorePair(match);

  if(score){
    return `${score[0]} - ${score[1]}`;
  }

  return "vs";
}

function getMatchScorePair(match){
  if(Number.isFinite(match.score1) && Number.isFinite(match.score2)){
    return [match.score1, match.score2];
  }

  if(Number.isFinite(match.goals1) && Number.isFinite(match.goals2)){
    return [match.goals1, match.goals2];
  }

  if(Array.isArray(match.score) && match.score.length >= 2){
    const a = Number(match.score[0]);
    const b = Number(match.score[1]);
    if(Number.isFinite(a) && Number.isFinite(b)) return [a,b];
  }

  if(match.score && Array.isArray(match.score.ft) && match.score.ft.length >= 2){
    const a = Number(match.score.ft[0]);
    const b = Number(match.score.ft[1]);
    if(Number.isFinite(a) && Number.isFinite(b)) return [a,b];
  }

  if(match.score && Array.isArray(match.score.fulltime) && match.score.fulltime.length >= 2){
    const a = Number(match.score.fulltime[0]);
    const b = Number(match.score.fulltime[1]);
    if(Number.isFinite(a) && Number.isFinite(b)) return [a,b];
  }

  if(typeof match.score === "string"){
    const parts = match.score.match(/(\d+)\s*[-:]\s*(\d+)/);
    if(parts) return [Number(parts[1]), Number(parts[2])];
  }

  return null;
}
function sortMatchesChronologically(list){
  return [...list].sort((a,b)=>{
    const da = parseOpenFootballDate(a);
    const db = parseOpenFootballDate(b);

    if(da && db) return da.getTime() - db.getTime();
    if(da && !db) return -1;
    if(!da && db) return 1;

    const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
    if(dateCompare !== 0) return dateCompare;

    const timeCompare = String(a.time || "").localeCompare(String(b.time || ""));
    if(timeCompare !== 0) return timeCompare;

    return (Number(a.num) || 0) - (Number(b.num) || 0);
  });
}
function matchBucket(round){
  const r = String(round || "").toLowerCase();

  if(r.includes("matchday")) return "grupos";
  if(r.includes("round of 32")) return "r32";
  if(r.includes("round of 16")) return "r16";
  if(r.includes("quarter")) return "cuartos";
  if(r.includes("semi") || r.includes("final") || r.includes("third")) return "finales";

  return "otros";
}

const CHART_PHASES = [
  { key:"start", label:"Inicio" },
  { key:"groups", label:"Grupos" },
  { key:"r32", label:"R32" },
  { key:"r16", label:"Octavos" },
  { key:"r8", label:"Cuartos" },
  { key:"semi", label:"Semi" },
  { key:"final", label:"Final/3°" },
  { key:"champion", label:"Campeón" }
];

function teamPointsThroughPhase(t, phaseKey){
  if(!t) return 0;

  let base = 0;

  if(["groups","r32","r16","r8","semi","final","champion"].includes(phaseKey)){
    base += (Number(t.groupWins) || 0) * SCORING.groupWin;
    base += (Number(t.groupDraws) || 0) * SCORING.groupDraw;
  }

  if(["r32","r16","r8","semi","final","champion"].includes(phaseKey) && t.reachedR32) base += SCORING.reachedR32;
  if(["r16","r8","semi","final","champion"].includes(phaseKey) && t.reachedR16) base += SCORING.reachedR16;
  if(["r8","semi","final","champion"].includes(phaseKey) && t.reachedR8) base += SCORING.reachedR8;
  if(["semi","final","champion"].includes(phaseKey) && t.reachedSemifinal) base += SCORING.reachedSemifinal;
  if(["final","champion"].includes(phaseKey) && t.wonThirdPlace) base += SCORING.wonThirdPlace;
  if(["final","champion"].includes(phaseKey) && t.reachedFinal) base += SCORING.reachedFinal;
  if(phaseKey==="champion" && t.champion) base += SCORING.champion;

  return Math.round(base * teamMultiplier(t));
}

function participantPointsThroughPhase(p, teams, phaseKey){
  return [p.b1,p.b2,p.b3].reduce((sum, teamName) => {
    return sum + teamPointsThroughPhase(teams[teamName], phaseKey);
  }, 0);
}

function LeaderboardChart({ standings, teams }){
  const topRows = standings.slice(0, 8);
  const width = 720;
  const height = 260;
  const pad = { top: 18, right: 18, bottom: 34, left: 34 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const series = topRows.map((p) => ({
    id: p.id,
    name: p.name,
    values: CHART_PHASES.map((phase) => participantPointsThroughPhase(p, teams, phase.key)),
  }));

  const maxValue = Math.max(1, ...series.flatMap(s => s.values));
  const roundedMax = Math.max(5, Math.ceil(maxValue / 5) * 5);

  const xFor = (idx) => pad.left + (idx / (CHART_PHASES.length - 1)) * chartW;
  const yFor = (value) => pad.top + chartH - (value / roundedMax) * chartH;

  const colors = ["#292524","#78716c","#a16207","#166534","#1d4ed8","#7c3aed","#be123c","#0f766e"];

  if(series.length === 0){
    return null;
  }

  return (
    <div className="bg-white rounded-xl ring-1 ring-stone-200/70 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Evolución por fase</h2>
          <p className="text-[11px] text-stone-400 mt-0.5">Top 8 actual para mantener la gráfica legible.</p>
        </div>
        <span className="text-[11px] text-stone-400">Puntos acumulados</span>
      </div>

      <div className="p-3 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] w-full h-auto">
          {[0,0.25,0.5,0.75,1].map((t,i)=>{
            const y = pad.top + chartH * t;
            const value = Math.round(roundedMax * (1 - t));
            return (
              <g key={i}>
                <line x1={pad.left} x2={width-pad.right} y1={y} y2={y} stroke="#f5f5f4" />
                <text x={pad.left-8} y={y+4} textAnchor="end" fontSize="10" fill="#a8a29e">{value}</text>
              </g>
            );
          })}

          {CHART_PHASES.map((phase,idx)=>(
            <g key={phase.key}>
              <text x={xFor(idx)} y={height-10} textAnchor="middle" fontSize="10" fill="#a8a29e">{phase.label}</text>
            </g>
          ))}

          {series.map((s,si)=>{
            const points = s.values.map((v,idx)=>`${xFor(idx)},${yFor(v)}`).join(" ");
            return (
              <g key={s.id}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={colors[si % colors.length]}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
                {s.values.map((v,idx)=>(
                  <circle key={idx} cx={xFor(idx)} cy={yFor(v)} r="3" fill={colors[si % colors.length]} />
                ))}
              </g>
            );
          })}
        </svg>

        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          {series.map((s,si)=>(
            <div key={s.id} className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:colors[si % colors.length]}}></span>
                <span className="truncate text-stone-600">{s.name}</span>
              </div>
              <span className="tabular-nums font-medium text-stone-800">{s.values[s.values.length-1]} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [state,setState]=useState(null);
  const [tab,setTab]=useState("dashboard");
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  
  const admin = !!session?.user;
  const [loadingResults,setLoadingResults]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState(null);

  const [matches,setMatches]=useState([]);
  const [matchesLoading,setMatchesLoading]=useState(false);
  const [matchFilter,setMatchFilter]=useState("todos");
  
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const {data,error}=await supabase.from("quiniela").select("data").eq("id",ROW_ID).maybeSingle();
        if(error) throw error;
        if(!active) return;
        if(data?.data && data.data.participants?.length){ setState(data.data); }
        else {
          const seed=initialState();
          await supabase.from("quiniela").upsert({id:ROW_ID,data:seed});
          setState(seed);
        }
      }catch(e){ setError(e.message||"Error al cargar"); setState(initialState()); }
    })();
    const channel=supabase.channel("quiniela-rt")
      .on("postgres_changes",{event:"*",schema:"public",table:"quiniela",filter:`id=eq.${ROW_ID}`},
        (payload)=>{ if(payload.new?.data) setState(payload.new.data); })
      .subscribe();
    return ()=>{ active=false; supabase.removeChannel(channel); };
  },[]);
  
useEffect(() => {
  let mounted = true;

  supabase.auth.getSession().then(({ data }) => {
    if (!mounted) return;
    setSession(data.session);
    setAuthLoading(false);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

useEffect(()=>{
  let active = true;

  const loadMatches = async () => {
    setMatchesLoading(true);

    try {
      const response = await fetch("/api/openfootball-worldcup");
      const data = await response.json();

      if(!response.ok) throw new Error(data.error || "No se pudieron cargar partidos.");

      const loadedMatches = data?.data?.matches || [];

      if(active) {
        setMatches(loadedMatches);
      }
    } catch(e) {
      if(active) {
        setError("No se pudieron cargar partidos de OpenFootball: " + (e.message || ""));
      }
    } finally {
      if(active) setMatchesLoading(false);
    }
  };

  loadMatches();

  return () => {
    active = false;
  };
},[]);
  
  const refreshMatches=async()=>{
    setMatchesLoading(true);
  
    try {
      const response = await fetch("/api/openfootball-worldcup");
      const data = await response.json();
  
      if(!response.ok) throw new Error(data.error || "No se pudieron cargar partidos.");
  
      setMatches(data?.data?.matches || []);
    } catch(e) {
      setError("No se pudieron cargar partidos de OpenFootball: " + (e.message || ""));
    } finally {
      setMatchesLoading(false);
    }
  };
  const persist=useCallback(async(next)=>{
    setSaving(true);
    try{
      const {error}=await supabase.from("quiniela").update({data:next}).eq("id",ROW_ID);
      if(error) throw error;
      setError(null);
    }catch(e){ setError("No se pudo guardar: "+(e.message||"")); }
    finally{ setSaving(false); }
  },[]);

  const update=useCallback((fn)=>{
    setState(prev=>{ const n=structuredClone(prev); fn(n); persist(n); return n; });
  },[persist]);

  const touchUpdated=(n)=>{n.lastUpdated=new Date().toISOString();};
  const standings=useMemo(()=>state?computeStandings(state):[],[state]);

  if(!state){
    return <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm" style={{fontFamily:"ui-sans-serif,system-ui,sans-serif"}}>Cargando quiniela…</div>;
  }

  const paidCount=state.participants.filter(p=>p.paid).length;
  const unpaidCount=NUM_PARTICIPANTS-paidCount;
  const collected=paidCount*ENTRY_FEE;
  const pending=unpaidCount*ENTRY_FEE;
  const totalPool=NUM_PARTICIPANTS*ENTRY_FEE;
  const totalPrizes=state.prizes.first+state.prizes.second+state.prizes.third;
  const phase=currentPhase(state.teams);
  const lastUpdatedLabel=state.lastUpdated?new Date(state.lastUpdated).toLocaleString("es-MX",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"Sin actualizaciones";
  const hasAssignedTeams = state.participants.some(p => p.b1 || p.b2 || p.b3);
  const drawLocked = !!state.drawLocked;
  const displayedMatches = sortMatchesChronologically(
    matches.filter((m)=>matchFilter==="todos" || matchBucket(m.round)===matchFilter)
  );
  
  const sourceName =
    state.source === "openfootball" ? "OpenFootball" :
    state.source === "api" ? "API externa" :
    "Datos manuales";
  
  const sourceMeta = state.sourceMeta || {};
  const sourceFetchedLabel = sourceMeta.fetchedAt
    ? new Date(sourceMeta.fetchedAt).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null;
  
  const sortear=()=>{
    if(drawLocked){
      alert("El sorteo está bloqueado. Desbloquéalo en modo Admin si necesitas hacer cambios.");
      return;
    }
    const hasDraw=state.participants.some(p=>p.b1||p.b2||p.b3);
    if(hasDraw && !window.confirm("Ya existe un sorteo. ¿Sobrescribir las asignaciones actuales?")) return;
    const shuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
    const s1=shuffle(BOMBO_1),s2=shuffle(BOMBO_2),s3=shuffle(BOMBO_3);
    update(n=>{n.participants.forEach((p,i)=>{p.b1=s1[i];p.b2=s2[i];p.b3=s3[i];});touchUpdated(n);});
  };
  const limpiarSorteo=()=>{
    if(drawLocked){
      alert("El sorteo está bloqueado. Desbloquéalo en modo Admin si necesitas hacer cambios.");
      return;
    }
    if(!window.confirm("¿Limpiar el sorteo? Se quitan los equipos asignados; se conservan nombres y pagos.")) return;
    update(n=>{n.participants.forEach(p=>{p.b1=null;p.b2=null;p.b3=null;});touchUpdated(n);});
  };

  const toggleDrawLock=()=>{
    const nextLocked = !drawLocked;
  
    if(nextLocked){
      const ok = window.confirm(
        "¿Bloquear el sorteo como oficial? Esto evitará sortear o limpiar equipos por accidente."
      );
      if(!ok) return;
    } else {
      const ok = window.confirm(
        "¿Desbloquear el sorteo? Esto permitirá volver a sortear o limpiar equipos."
      );
      if(!ok) return;
    }
  
    update(n=>{
      n.drawLocked = nextLocked;
      touchUpdated(n);
    });
  };
  
  const actualizarResultados=async()=>{
    setLoadingResults(true);
  
    try {
      const res = await fetchWorldCupResults(state.teams);
  
      update(n=>{
        n.teams = res.teams;
        n.source = res.source;
        n.sourceMeta = res.meta;
        touchUpdated(n);
      });
  
      if (res.meta?.completedWithScore === 0) {
        setError("OpenFootball está conectado, pero todavía no tiene resultados capturados. No se cambiaron puntos.");
      } else {
        setError(null);
      }
    } catch (e) {
      setError("No se pudo actualizar resultados: " + (e.message || ""));
    } finally {
      setLoadingResults(false);
    }
  };
  
  const exportar=()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="quiniela_mundial_2026.json";a.click();
    URL.revokeObjectURL(url);
  };
  const importar=(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{try{const data=JSON.parse(reader.result);const merged={...initialState(),...data,teams:{...initialState().teams,...(data.teams||{})}};setState(merged);persist(merged);alert("Datos importados.");}catch{alert("Archivo inválido.");}};
    reader.readAsText(file);
  };
  const reiniciar=()=>{ if(window.confirm("¿Reiniciar toda la quiniela? Se borran participantes, sorteo, pagos y resultados.")){const fresh=initialState();setState(fresh);persist(fresh);} };

  const loginAdmin = async () => {
    if (!email || !password) {
      alert("Escribe tu email y contraseña.");
      return;
    }
  
    setSaving(true);
  
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error) throw error;
  
      setSession(data.session);
      setEmail("");
      setPassword("");
      setError(null);
    } catch (e) {
      setError("No se pudo iniciar sesión: " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };
  
  const logoutAdmin = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const TABS=[
    ["dashboard","Tabla"],
    ["participantes","Pagos"],
    ["equipos","Equipos"],
    ["resultados","Resultados"],
    ["partidos","Partidos"],
    ["premios","Premios"],
    ["reglas","Reglas"],
    ["admin",admin?"Admin":"Login"]
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 antialiased" style={{fontFamily:"ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif"}}>
      <style>{`
        *{transition:background-color .15s ease,color .15s ease,border-color .15s ease,box-shadow .15s ease;}
        ::selection{background:#d6e9d6;}
        input:focus,select:focus{outline:none;box-shadow:0 0 0 2px rgba(120,150,120,.35);}
      `}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[26px] sm:text-3xl font-semibold tracking-tight leading-none">Quiniela Mundial 2026</h1>
              <p className="text-stone-400 text-sm mt-1.5">Bolsa de {fmtMXN(totalPool)} · {NUM_PARTICIPANTS} participantes</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {admin
                ? <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-stone-800 text-white">Admin</span>
                : <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-stone-100 text-stone-500">Solo lectura</span>}
              {saving && <span className="text-[11px] text-stone-400">Guardando…</span>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{phase}
            </span>
            <span className="text-stone-300">·</span>
            <span>Act. {lastUpdatedLabel}</span>
            <>
              <span className="text-stone-300">·</span>
              {drawLocked ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  Sorteo oficial bloqueado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  Sorteo de prueba
                </span>
              )}
            </>
          </div>
        </header>

        {error && <div className="mb-4 text-xs bg-rose-50 text-rose-600 px-3 py-2 rounded-lg ring-1 ring-rose-100">{error}</div>}

        <nav className="mb-6 -mx-1 overflow-x-auto">
          <div className="flex gap-0.5 min-w-max px-1">
            {TABS.map(([key,label])=>(
              <button key={key} onClick={()=>setTab(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${tab===key?"bg-white text-stone-900 shadow-sm ring-1 ring-stone-200/70":"text-stone-400 hover:text-stone-600"}`}>
                {label}
              </button>
            ))}
          </div>
        </nav>

        {tab==="dashboard" && (
          <section className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[["Recaudado",fmtMXN(collected),`${paidCount} de ${NUM_PARTICIPANTS}`],
                ["Pendiente",fmtMXN(pending),`${unpaidCount} sin pagar`],
                ["Fase",phase,"actual"]].map(([t,v,s])=>(
                <div key={t} className="bg-white rounded-xl ring-1 ring-stone-200/70 p-3">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wide">{t}</div>
                  <div className="text-base sm:text-lg font-semibold mt-1 leading-tight">{v}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{s}</div>
                </div>
              ))}
            </div>
            <LeaderboardChart standings={standings} teams={state.teams} />
            <div className="bg-white rounded-xl ring-1 ring-stone-200/70 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Clasificación</h2>
                <span className="text-[11px] text-stone-400">Premio estimado</span>
              </div>
              <ol className="divide-y divide-stone-50">
                {standings.map((r)=>{
                  const podium=r.rank<=3;
                  return (
                    <li key={r.id} className="px-3 sm:px-4 py-2.5 flex items-center gap-3 hover:bg-stone-50/60">
                      <span className={`w-6 text-center text-sm font-semibold tabular-nums ${podium?"text-amber-600":"text-stone-300"}`}>{r.rank}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{r.name}</span>
                          {!r.paid && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Pago pendiente"></span>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {[r.t1,r.t2,r.t3].map((t,i)=>t
                            ? <Pill key={i} tone={stageTone(teamStageRank(t))}>{teamLabel(t.team)} · {teamPoints(t)}</Pill>
                            : <Pill key={i} tone="neutral">—</Pill>)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-semibold tabular-nums leading-none">{r.total}</div>
                        {hasAssignedTeams && estimatedPrizeForRow(r, standings, state.prizes) > 0 && (
                            <div className="mt-1">
                              <Pill tone="prize">
                                {fmtMXN(estimatedPrizeForRow(r, standings, state.prizes))}
                              </Pill>
                            </div>
                          )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
            <p className="text-[11px] text-stone-400 text-center">Fuente: {sourceName}</p>
          </section>
        )}

        {tab==="participantes" && (
          <section className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[["Pagados",paidCount],["Sin pagar",unpaidCount],["Recaudado",fmtMXN(collected)],["Pendiente",fmtMXN(pending)]].map(([t,v])=>(
                <div key={t} className="bg-white rounded-xl ring-1 ring-stone-200/70 p-3">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wide">{t}</div>
                  <div className="text-lg font-semibold mt-1">{v}</div>
                </div>
              ))}
            </div>
            {!admin && <p className="text-xs text-stone-400">Consulta de pagos y participantes.</p>}
            <div className="bg-white rounded-xl ring-1 ring-stone-200/70 overflow-hidden divide-y divide-stone-50">
              {state.participants.map((p,idx)=>(
                <div key={p.id} className="px-3 sm:px-4 py-2.5 flex items-center gap-3">
                  <span className="w-5 text-center text-xs text-stone-300 tabular-nums">{idx+1}</span>
                  {admin
                    ? <input value={p.name} onChange={e=>update(n=>{n.participants[idx].name=e.target.value;})}
                        className="flex-1 min-w-0 px-2 py-1 rounded-md text-sm bg-stone-50 hover:bg-stone-100 border border-transparent focus:bg-white focus:border-stone-200" />
                    : <span className="flex-1 text-sm">{p.name}</span>}
                  {admin
                    ? <button onClick={()=>update(n=>{n.participants[idx].paid=!n.participants[idx].paid;})}
                        className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium ${p.paid?"bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100":"bg-amber-50 text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100"}`}>
                        {p.paid?"Pagado":"Pendiente"}
                      </button>
                    : <Pill tone={p.paid?"paid":"due"}>{p.paid?"Pagado":"Pendiente"}</Pill>}
                </div>
              ))}
            </div>
          </section>
        )}

        {tab==="equipos" && (
          <section className="space-y-4">
            {admin
              ? <div className="flex flex-wrap gap-2">
                  <button
                    onClick={sortear}
                    disabled={drawLocked}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Sortear equipos
                  </button>
            
                  <button
                    onClick={limpiarSorteo}
                    disabled={drawLocked}
                    className="px-3 py-1.5 rounded-lg bg-white text-stone-600 text-sm font-medium ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Limpiar sorteo
                  </button>
            
                  <button
                    onClick={toggleDrawLock}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ring-1 ${
                      drawLocked
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 ring-amber-100 hover:bg-amber-100"
                    }`}
                  >
                    {drawLocked ? "Desbloquear sorteo" : "Bloquear sorteo oficial"}
                  </button>
                </div>
              : null}
              <div className="text-xs text-stone-400 space-y-1">
                <p>Cada participante recibe un equipo de cada bombo, sin repetir.</p>
                <p>
                  Bombos internos construidos con base en el {RANKING_SOURCE_LABEL} publicado el {RANKING_SOURCE_DATE}.{" "}
                  <a
                    href={RANKING_SOURCE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-900"
                  >
                    Ver fuente FIFA
                  </a>
                </p>
              </div>
            <div className="bg-white rounded-xl ring-1 ring-stone-200/70 overflow-hidden divide-y divide-stone-50">
              {state.participants.map((p,idx)=>(
                <div key={p.id} className="px-3 sm:px-4 py-2.5">
                  <div className="text-sm font-medium mb-1.5">{p.name}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {[["b1",BOMBO_1,"1"],["b2",BOMBO_2,"2"],["b3",BOMBO_3,"3"]].map(([key,list,n])=>(
                      <div key={key}>
                        <div className="text-[10px] text-stone-400 mb-0.5 uppercase tracking-wide">Bombo {n}</div>
                        {admin
                          ? <select
                              value={p[key]||""}
                              disabled={drawLocked}
                              onChange={e=>update(nn=>{nn.participants[idx][key]=e.target.value||null;})}
                              className="w-full px-1.5 py-1 rounded-md text-xs bg-stone-50 border border-transparent focus:bg-white focus:border-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">—</option>
                              {list.map(t=><option key={t} value={t}>{t}</option>)}
                            </select>
                          : <div className="text-xs px-1.5 py-1 rounded-md bg-stone-50 truncate">{teamLabel(p[key])}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab==="resultados" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {admin ? (
                <button onClick={actualizarResultados} disabled={loadingResults}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-40">
                  {loadingResults?"Actualizando…":"Actualizar resultados"}
                </button>
              ) : (
                <span className="text-xs text-stone-400">Avances registrados por el admin.</span>
              )}
              <span className="text-[11px] text-stone-400">
                Fuente: {sourceName}
              </span>
            </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="bg-white rounded-xl ring-1 ring-stone-200/70 p-3">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wide">Fuente</div>
                  <div className="text-sm font-semibold mt-1">{sourceName}</div>
                </div>
              
                <div className="bg-white rounded-xl ring-1 ring-stone-200/70 p-3">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wide">Partidos</div>
                  <div className="text-sm font-semibold mt-1">
                    {sourceMeta.matchCount ?? "—"}
                  </div>
                </div>
              
                <div className="bg-white rounded-xl ring-1 ring-stone-200/70 p-3">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wide">Con score</div>
                  <div className="text-sm font-semibold mt-1">
                    {sourceMeta.completedWithScore ?? "—"}
                  </div>
                </div>
              
                <div className="bg-white rounded-xl ring-1 ring-stone-200/70 p-3">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wide">Consulta</div>
                  <div className="text-sm font-semibold mt-1">
                    {sourceFetchedLabel || "—"}
                  </div>
                </div>
              </div>
              
              {sourceMeta.note && (
                <div className="text-xs bg-stone-100 text-stone-500 px-3 py-2 rounded-lg ring-1 ring-stone-200/70">
                  {sourceMeta.note}
                </div>
              )}
            {admin ? (
              <div className="bg-white rounded-xl ring-1 ring-stone-200/70 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-stone-400 text-left border-b border-stone-100">
                    <th className="px-3 py-2 font-medium">Equipo</th><th className="px-1 py-2 font-medium text-center">B</th>
                    <th className="px-1 py-2 font-medium text-center">G</th>
                    <th className="px-1 py-2 font-medium text-center">E</th>
                    <th className="px-1 py-2 font-medium text-center">P</th>
                    {[["reachedR32","R32"],["reachedR16","R16"],["reachedR8","R8"],["reachedSemifinal","Sf"],["wonThirdPlace","3°"],["reachedFinal","Fn"],["champion","Cmp"]].map(([k,l])=><th key={k} className="px-1 py-2 font-medium text-center">{l}</th>)}
                    <th className="px-2 py-2 font-medium text-center">Pts</th>
                  </tr></thead>
                  <tbody className="divide-y divide-stone-50">
                    {Object.values(state.teams).sort((a,b)=>a.pot-b.pot||a.team.localeCompare(b.team)).map(t=>(
                      <tr key={t.team} className="hover:bg-stone-50/60">
                        <td className="px-3 py-1.5 whitespace-nowrap">{teamLabel(t.team)}</td><td className="px-1 py-1.5 text-center text-stone-400">{t.pot}</td>
                        <td className="px-1 py-1.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={t.groupWins || 0}
                            onChange={e=>update(n=>{
                              n.teams[t.team].groupWins = Number(e.target.value) || 0;
                              touchUpdated(n);
                            })}
                            className="w-10 px-1 py-0.5 rounded-md text-xs text-center bg-stone-50 border border-stone-100"
                          />
                        </td>
                        
                        <td className="px-1 py-1.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={t.groupDraws || 0}
                            onChange={e=>update(n=>{
                              n.teams[t.team].groupDraws = Number(e.target.value) || 0;
                              touchUpdated(n);
                            })}
                            className="w-10 px-1 py-0.5 rounded-md text-xs text-center bg-stone-50 border border-stone-100"
                          />
                        </td>
                        
                        <td className="px-1 py-1.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={t.groupLosses || 0}
                            onChange={e=>update(n=>{
                              n.teams[t.team].groupLosses = Number(e.target.value) || 0;
                              touchUpdated(n);
                            })}
                            className="w-10 px-1 py-0.5 rounded-md text-xs text-center bg-stone-50 border border-stone-100"
                          />
                        </td>
                        {["reachedR32","reachedR16","reachedR8","reachedSemifinal","wonThirdPlace","reachedFinal","champion"].map(k=>(
                          <td key={k} className="px-1 py-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={t[k]}
                              onChange={e=>update(n=>{
                                normalizeTeamProgress(n.teams[t.team], k, e.target.checked);
                                touchUpdated(n);
                              })}
                              className="w-3.5 h-3.5 accent-stone-700"
                            />                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-center font-semibold tabular-nums">{teamPoints(t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl ring-1 ring-stone-200/70 overflow-hidden divide-y divide-stone-50">
                {Object.values(state.teams).filter(t=>teamStageRank(t)>1).sort((a,b)=>teamStageRank(b)-teamStageRank(a)).map(t=>(
                  <div key={t.team} className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-sm">{teamLabel(t.team)}</span>
                    <div className="flex items-center gap-2">
                      <Pill tone={stageTone(teamStageRank(t))}>{STAGE_SHORT[teamStageRank(t)]}</Pill>
                      <span className="text-sm font-semibold tabular-nums w-5 text-right">{teamPoints(t)}</span>
                    </div>
                  </div>
                ))}
                {Object.values(state.teams).every(t=>teamStageRank(t)<=1) && <div className="px-4 py-8 text-center text-sm text-stone-400">Aún no hay avances registrados.</div>}
              </div>
            )}
            <p className="text-[11px] text-stone-400">   Los puntos se calculan automáticamente con base en el avance de cada equipo. </p>
          </section>
        )}
        {tab==="partidos" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold">Calendario y resultados</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Horarios en hora de Ciudad de México. Fuente: OpenFootball.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshMatches}
                  disabled={matchesLoading}
                  className="px-2.5 py-1 rounded-lg bg-white text-stone-600 text-xs font-medium ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-40"
                >
                  {matchesLoading ? "Actualizando…" : "Actualizar partidos"}
                </button>
              
                <span className="text-[11px] text-stone-400">
                  {matchesLoading ? "Cargando…" : `${matches.length} partidos`}
                </span>
              </div>
            </div>
        
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                ["todos","Todos"],
                ["grupos","Grupos"],
                ["r32","R32"],
                ["r16","Octavos"],
                ["cuartos","Cuartos"],
                ["finales","Semis / Final"]
              ].map(([key,label])=>(
                <button
                  key={key}
                  onClick={()=>setMatchFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                    matchFilter===key
                      ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200/70"
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
        
            <div className="bg-white rounded-xl ring-1 ring-stone-200/70 overflow-hidden divide-y divide-stone-50">
              {displayedMatches.map((m,idx)=>(
                  <div key={`${m.num || idx}-${m.date}-${m.team1}-${m.team2}`} className="px-3 sm:px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <Pill tone="neutral">{m.round || "—"}</Pill>
                          {m.group && <Pill tone="neutral">{m.group}</Pill>}
                          {m.num && <span className="text-[11px] text-stone-300">Partido {m.num}</span>}
                        </div>
        
                        <div className="text-sm font-medium text-stone-800">
                          {displayTeam(m.team1)} <span className="text-stone-300 px-1">{matchScore(m)}</span> {displayTeam(m.team2)}
                        </div>
        
                        <div className="text-xs text-stone-400 mt-1">
                          {m.ground || "Sede por confirmar"}
                        </div>
                      </div>
        
                      <div className="text-right shrink-0">
                        <div className="text-xs font-medium text-stone-700">{formatCDMXDate(m)}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{formatCDMXTime(m)}</div>
                      </div>
                    </div>
                  </div>
                ))}
        
              {!matchesLoading && displayedMatches.length===0 && (
                <div className="px-4 py-8 text-center text-sm text-stone-400">
                  No hay partidos para este filtro.
                </div>
              )}
        
              {matchesLoading && (
                <div className="px-4 py-8 text-center text-sm text-stone-400">
                  Cargando calendario…
                </div>
              )}
            </div>
          </section>
        )}
        {tab==="premios" && (
          <section className="space-y-4">
            <div className="bg-white rounded-xl ring-1 ring-stone-200/70 p-4 sm:p-5 space-y-3">
              {[["first","1° lugar"],["second","2° lugar"],["third","3° lugar"]].map(([k,l])=>(
                <div key={k} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-stone-600">{l}</label>
                  {admin
                    ? <input type="number" value={state.prizes[k]} onChange={e=>update(n=>{n.prizes[k]=Number(e.target.value)||0;})}
                        className="w-32 px-2 py-1 rounded-md text-sm text-right bg-stone-50 border border-transparent focus:bg-white focus:border-stone-200" />
                    : <span className="text-sm font-semibold tabular-nums">{fmtMXN(state.prizes[k])}</span>}
                </div>
              ))}
              <div className="border-t border-stone-100 pt-3 flex justify-between text-sm">
                <span className="font-medium">Total premios</span><span className="font-semibold tabular-nums">{fmtMXN(totalPrizes)}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-400">
                <span>Bolsa total</span><span className="tabular-nums">{fmtMXN(totalPool)}</span>
              </div>
              {totalPrizes!==totalPool && (
                <div className={`text-xs px-3 py-2 rounded-lg ${totalPrizes>totalPool?"bg-rose-50 text-rose-600 ring-1 ring-rose-100":"bg-amber-50 text-amber-700 ring-1 ring-amber-100"}`}>
                  {totalPrizes>totalPool
                    ? `Los premios (${fmtMXN(totalPrizes)}) exceden la bolsa (${fmtMXN(totalPool)}).`
                    : `Los premios no igualan la bolsa. Diferencia: ${fmtMXN(totalPool-totalPrizes)}.`}
                </div>
              )}
            </div>
            {!admin && <p className="text-xs text-stone-400">Premios definidos para la quiniela.</p>}
          </section>
        )}

        {tab==="reglas" && (
          <section className="space-y-4">
            <article className="rounded-2xl bg-white ring-1 ring-stone-200/70 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">Reglas</h2>
                  <p className="text-sm text-stone-400 mt-1">Quiniela Mundial 2026</p>
                </div>
        
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["Entrada", fmtMXN(ENTRY_FEE)],
                    ["Participantes", String(NUM_PARTICIPANTS)],
                    ["Bolsa", fmtMXN(totalPool)]
                  ].map(([t,v])=>(
                    <div key={t} className="rounded-xl bg-stone-50 px-3 py-3">
                      <p className="text-xs text-stone-400">{t}</p>
                      <p className="font-semibold text-stone-900">{v}</p>
                    </div>
                  ))}
                </div>
        
                <div>
                  <h3 className="text-stone-900 font-semibold mb-1.5">Premios</h3>
                  <p className="text-sm text-stone-500">
                    1° lugar {fmtMXN(state.prizes.first)} · 2° lugar {fmtMXN(state.prizes.second)} · 3° lugar {fmtMXN(state.prizes.third)}. Total {fmtMXN(totalPrizes)}.
                  </p>
                </div>
        
                <div>
                  <h3 className="text-stone-900 font-semibold mb-1.5">Sorteo</h3>
                  <p className="text-sm text-stone-500">
                    Participan 48 selecciones divididas en 3 bombos internos de 16, usando como referencia el {RANKING_SOURCE_LABEL} publicado el {RANKING_SOURCE_DATE}. Cada quien recibe tres equipos: uno de cada bombo. Así todos tienen un equipo fuerte, uno medio y uno de menor ranking.
                  </p>
        
                  <a
                    href={RANKING_SOURCE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex mt-2 text-xs font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 hover:text-stone-900"
                  >
                    Ver ranking oficial FIFA utilizado como referencia
                  </a>
                </div>
        
                <div>
                  <h3 className="text-stone-900 font-semibold mb-2">Puntos por avance</h3>
        
                  <div className="rounded-lg ring-1 ring-stone-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-stone-50 text-xs font-semibold text-stone-500">
                        <tr>
                          <th className="text-left px-3 py-2">Ronda</th>
                          <th className="text-right px-3 py-2">B1</th>
                          <th className="text-right px-3 py-2">B2</th>
                          <th className="text-right px-3 py-2">B3</th>
                        </tr>
                      </thead>
        
                      <tbody>
                        {[
                            ["Victoria en grupos","+3","+4","+5"],
                            ["Empate en grupos","+1","+1","+2"],
                            ["Ronda de 32","+4","+5","+7"],
                            ["Octavos","+8","+10","+14"],
                            ["Cuartos","+12","+15","+21"],
                            ["Semifinal","+16","+20","+28"],
                            ["Gana 3° lugar","+8","+10","+14"],
                            ["Final","+20","+25","+35"],
                            ["Campeón","+24","+30","+42"]
                          ].map(([k,b1,b2,b3],i)=>(
                          <tr key={k} className={i%2 ? "bg-stone-50/50" : ""}>
                            <td className="px-3 py-1.5 text-stone-700">{k}</td>
                            <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-stone-800">{b1}</td>
                            <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-stone-800">{b2}</td>
                            <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-stone-800">{b3}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
        
                  <p className="text-stone-400 text-xs mt-2">
                    Los equipos suman puntos en fase de grupos usando el sistema FIFA: 3 puntos por victoria, 1 por empate y 0 por derrota. Además, suman puntos acumulativos por avance de ronda. Los puntos totales de cada equipo se ajustan según su bombo: Bombo 1 vale 1.00x, Bombo 2 vale 1.25x y Bombo 3 vale 1.75x. No hay puntos por goles ni diferencia de goles.
                  </p>
                </div>
        
                <div>
                  <h3 className="text-stone-900 font-semibold mb-1.5">Desempates</h3>
                  <ol className="space-y-1">
                    {[
                      "Gana quien tenga el equipo que llegó más lejos.",
                      "Si sigue el empate, se compara el segundo mejor equipo.",
                      "Luego el tercer equipo.",
                      "Si persiste, el premio se reparte entre los empatados."
                    ].map((t,i)=>(
                      <li key={i} className="flex gap-2 text-sm text-stone-500">
                        <span className="text-stone-300 tabular-nums">{i+1}.</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                </div>
        
                <div>
                  <h3 className="text-stone-900 font-semibold mb-2">Bombos</h3>
                  <p className="text-xs text-stone-400 mb-3">
                    El número entre paréntesis corresponde al ranking FIFA/Coca-Cola publicado el {RANKING_SOURCE_DATE}. Los bombos son internos de la quiniela y no corresponden a los bombos oficiales del sorteo FIFA.
                  </p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      ["Bombo 1", BOMBO_1],
                      ["Bombo 2", BOMBO_2],
                      ["Bombo 3", BOMBO_3]
                    ].map(([t,list])=>(
                      <div key={t} className="rounded-xl bg-stone-50 p-3">
                        <p className="font-semibold text-stone-800 mb-2">{t}</p>
                        <div className="flex flex-wrap gap-1">
                          {list.map(n=>(
                            <span key={n} className="px-2 py-1 rounded-md bg-white ring-1 ring-stone-100 text-xs text-stone-600">
                              {teamRankingLabel(n)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </section>
        )}

        {tab==="admin" && (
          <section className="space-y-6">
            <div className="rounded-2xl bg-white ring-1 ring-stone-200 p-4">
              <h3 className="text-base font-semibold text-stone-900">Modo administrador</h3>
        
              {admin ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-stone-600">
                    Sesión iniciada como admin: {session.user.email}
                  </p>
        
                  <button
                    onClick={logoutAdmin}
                    className="px-3 py-1.5 rounded-lg bg-white text-stone-600 text-sm font-medium ring-1 ring-stone-200 hover:bg-stone-50"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="mt-3 grid gap-2 max-w-sm">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email admin"
                    className="px-3 py-2 rounded-lg text-sm bg-stone-50 border border-stone-200 focus:bg-white"
                  />
        
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="px-3 py-2 rounded-lg text-sm bg-stone-50 border border-stone-200 focus:bg-white"
                  />
        
                  <button
                    onClick={loginAdmin}
                    disabled={saving || authLoading}
                    className="px-3 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? "Entrando..." : "Entrar como admin"}
                  </button>
                </div>
              )}
        
              <p className="mt-4 text-xs text-stone-500">
                Todos pueden ver la quiniela. Solo el usuario admin autenticado en Supabase puede guardar cambios.
              </p>
            </div>
        
            <div className="rounded-2xl bg-white ring-1 ring-stone-200 p-4">
              <h3 className="text-base font-semibold text-stone-900">Datos</h3>
        
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={exportar}
                  className="px-3 py-1.5 rounded-lg bg-white text-stone-600 text-sm font-medium ring-1 ring-stone-200 hover:bg-stone-50"
                >
                  Exportar JSON
                </button>
        
                {admin && (
                  <>
                    <label className="px-3 py-1.5 rounded-lg bg-white text-stone-600 text-sm font-medium ring-1 ring-stone-200 hover:bg-stone-50 cursor-pointer">
                      Importar JSON
                      <input type="file" accept="application/json" onChange={importar} className="hidden" />
                    </label>
        
                    <button
                      onClick={reiniciar}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-sm font-medium ring-1 ring-rose-100 hover:bg-rose-100"
                    >
                      Reiniciar
                    </button>
                  </>
                )}
              </div>
        
              {!admin && (
                <p className="mt-3 text-xs text-stone-500">
                  Importar y reiniciar requieren sesión admin.
                </p>
              )}
            </div>
          </section>
        )}

        <footer className="mt-10 text-center text-[11px] text-stone-300">Quiniela Mundial 2026</footer>
      </div>
    </div>
  );
}
