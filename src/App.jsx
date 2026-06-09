import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// Quiniela Mundial 2026 - Persistencia compartida con Supabase
// Todos ven los mismos datos. Solo el admin (PIN) puede editar.
// ============================================================

// ---- Supabase ----
// Las claves se leen de variables de entorno (.env / Vercel).
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
const ROW_ID = 1; // toda la quiniela vive en una sola fila JSON

const DEFAULT_PIN = "2026";

const BOMBO_1 = ["Francia","España","Argentina","Inglaterra","Portugal","Brasil","Países Bajos","Marruecos","Bélgica","Alemania","Croacia","Colombia","Senegal","México","Estados Unidos","Uruguay"];
const BOMBO_2 = ["Japón","Suiza","Irán","Turquía","Ecuador","Austria","Corea del Sur","Australia","Argelia","Egipto","Canadá","Noruega","Panamá","Costa de Marfil","Suecia","Paraguay"];
const BOMBO_3 = ["República Checa","Escocia","Túnez","RD Congo","Uzbekistán","Qatar","Irak","Sudáfrica","Arabia Saudita","Jordania","Bosnia y Herzegovina","Cabo Verde","Ghana","Curazao","Haití","Nueva Zelanda"];

const SCORING = { reachedR32:1, reachedR16:2, reachedR8:3, reachedSemifinal:4, wonThirdPlace:2, reachedFinal:5, champion:6 };
const ENTRY_FEE = 500;
const NUM_PARTICIPANTS = 16;

const fmtMXN = (n) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n||0);

function makeTeam(name, pot){return {team:name,pot,reachedR32:false,reachedR16:false,reachedR8:false,reachedSemifinal:false,wonThirdPlace:false,reachedFinal:false,champion:false};}

function teamPoints(t){
  if(!t) return 0;
  let p=0;
  if(t.reachedR32)p+=SCORING.reachedR32;
  if(t.reachedR16)p+=SCORING.reachedR16;
  if(t.reachedR8)p+=SCORING.reachedR8;
  if(t.reachedSemifinal)p+=SCORING.reachedSemifinal;
  if(t.wonThirdPlace)p+=SCORING.wonThirdPlace;
  if(t.reachedFinal)p+=SCORING.reachedFinal;
  if(t.champion)p+=SCORING.champion;
  return p;
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
const STAGE_LABEL={7:"Campeón",6:"Final",5:"Semifinal",4:"Cuartos",3:"Octavos",2:"Ronda de 32",1:"Fase de grupos"};

function initialState(){
  const teams={};
  BOMBO_1.forEach(n=>teams[n]=makeTeam(n,1));
  BOMBO_2.forEach(n=>teams[n]=makeTeam(n,2));
  BOMBO_3.forEach(n=>teams[n]=makeTeam(n,3));
  const participants=Array.from({length:NUM_PARTICIPANTS},(_,i)=>({id:i+1,name:`Participante ${i+1}`,paid:false,b1:null,b2:null,b3:null}));
  return {participants,teams,prizes:{first:4400,second:2400,third:1200},lastUpdated:null,source:"mock"};
}

// ---- Capa de resultados (mock; listo para API real) ----
async function fetchWorldCupResults(currentTeams){
  // Producción: reemplazar por fetch a football-data.org / API-Football / Sportradar
  // y mapear la respuesta a la estructura interna { [nombre]: {reachedR32,...} }.
  return new Promise(res=>setTimeout(()=>res({source:"mock",teams:currentTeams}),400));
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

// ---- UI helpers ----
const Badge=({children,color="slate"})=>{
  const map={slate:"bg-slate-100 text-slate-700",green:"bg-emerald-100 text-emerald-700",red:"bg-rose-100 text-rose-700",blue:"bg-sky-100 text-sky-700",gold:"bg-amber-100 text-amber-800",purple:"bg-violet-100 text-violet-700"};
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[color]}`}>{children}</span>;
};
const stageBadgeColor=(r)=>r>=7?"gold":r>=5?"purple":r>=3?"blue":r>=2?"green":"slate";
const Card=({title,value,sub})=>(
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="text-xs text-slate-500">{title}</div>
    <div className="text-xl font-semibold text-slate-800 mt-1">{value}</div>
    {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
  </div>
);

export default function App(){
  const [state,setState]=useState(null);      // null = cargando
  const [tab,setTab]=useState("dashboard");
  const [admin,setAdmin]=useState(false);
  const [pinInput,setPinInput]=useState("");
  const [loadingResults,setLoadingResults]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState(null);

  // ---- Cargar desde Supabase al iniciar + suscripción en tiempo real ----
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const {data,error}=await supabase.from("quiniela").select("data").eq("id",ROW_ID).maybeSingle();
        if(error) throw error;
        if(!active) return;
        if(data?.data){ setState(data.data); }
        else {
          // primera vez: sembrar la fila con el estado inicial
          const seed=initialState();
          const {error:insErr}=await supabase.from("quiniela").insert({id:ROW_ID,data:seed});
          if(insErr) throw insErr;
          setState(seed);
        }
      }catch(e){ setError(e.message||"Error al cargar datos"); setState(initialState()); }
    })();

    const channel=supabase.channel("quiniela-rt")
      .on("postgres_changes",{event:"*",schema:"public",table:"quiniela",filter:`id=eq.${ROW_ID}`},
        (payload)=>{ if(payload.new?.data) setState(payload.new.data); })
      .subscribe();

    return ()=>{ active=false; supabase.removeChannel(channel); };
  },[]);

  // ---- Guardar en Supabase (solo admin dispara cambios) ----
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
    setState(prev=>{
      const n=structuredClone(prev);
      fn(n);
      persist(n);
      return n;
    });
  },[persist]);

  const touchUpdated=(n)=>{n.lastUpdated=new Date().toISOString();};

  const standings=useMemo(()=>state?computeStandings(state):[],[state]);

  if(!state){
    return <div className="min-h-screen flex items-center justify-center text-slate-500" style={{fontFamily:"system-ui,sans-serif"}}>Cargando quiniela...</div>;
  }

  const paidCount=state.participants.filter(p=>p.paid).length;
  const unpaidCount=NUM_PARTICIPANTS-paidCount;
  const collected=paidCount*ENTRY_FEE;
  const pending=unpaidCount*ENTRY_FEE;
  const totalPool=NUM_PARTICIPANTS*ENTRY_FEE;
  const totalPrizes=state.prizes.first+state.prizes.second+state.prizes.third;
  const phase=currentPhase(state.teams);
  const lastUpdatedLabel=state.lastUpdated?new Date(state.lastUpdated).toLocaleString("es-MX"):"Sin actualizaciones";
  const prizeFor=(rank)=>rank===1?state.prizes.first:rank===2?state.prizes.second:rank===3?state.prizes.third:0;

  const sortear=()=>{
    const hasDraw=state.participants.some(p=>p.b1||p.b2||p.b3);
    if(hasDraw && !window.confirm("Ya existe un sorteo. ¿Sobrescribir las asignaciones actuales?")) return;
    const shuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
    const s1=shuffle(BOMBO_1),s2=shuffle(BOMBO_2),s3=shuffle(BOMBO_3);
    update(n=>{n.participants.forEach((p,i)=>{p.b1=s1[i];p.b2=s2[i];p.b3=s3[i];});touchUpdated(n);});
  };

  const limpiarSorteo=()=>{
    // Borra solo las asignaciones de equipos. No toca nombres ni pagos.
    if(!window.confirm("¿Limpiar el sorteo? Se quitarán los equipos asignados, pero se conservan nombres y pagos.")) return;
    update(n=>{n.participants.forEach(p=>{p.b1=null;p.b2=null;p.b3=null;});touchUpdated(n);});
  };

  const actualizarResultados=async()=>{
    setLoadingResults(true);
    const res=await fetchWorldCupResults(state.teams);
    update(n=>{n.teams={...n.teams,...res.teams};n.source=res.source;touchUpdated(n);});
    setLoadingResults(false);
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
  const reiniciar=()=>{ if(window.confirm("¿Reiniciar toda la quiniela? Se borrarán participantes, sorteo, pagos y resultados.")){const fresh=initialState();setState(fresh);persist(fresh);} };
  const tryPin=()=>{ if(pinInput===DEFAULT_PIN){setAdmin(true);setPinInput("");}else alert("PIN incorrecto."); };

  const TABS=[["dashboard","Dashboard"],["participantes","Participantes"],["equipos","Equipos / Sorteo"],["resultados","Resultados"],["premios","Premios"],["reglas","Reglas"],["admin","Admin"]];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" style={{fontFamily:"system-ui,sans-serif"}}>
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h1 className="text-2xl font-bold">Quiniela Mundial 2026 ⚽</h1>
          <div className="flex items-center gap-2 text-sm">
            {saving && <Badge color="blue">Guardando...</Badge>}
            {admin ? <Badge color="green">Modo admin activo</Badge> : <Badge color="slate">Solo lectura</Badge>}
            <Badge color="blue">Fase: {phase}</Badge>
          </div>
        </div>

        {error && <div className="mb-3 text-xs bg-rose-50 text-rose-700 p-2 rounded">{error}</div>}

        <div className="flex flex-wrap gap-1 mb-4 bg-white p-1 rounded-xl border border-slate-200">
          {TABS.map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab===key?"bg-slate-800 text-white":"text-slate-600 hover:bg-slate-100"}`}>{label}</button>
          ))}
        </div>

        {/* DASHBOARD */}
        {tab==="dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card title="Bolsa total" value={fmtMXN(totalPool)} sub={`${NUM_PARTICIPANTS} participantes`} />
              <Card title="Recaudado" value={fmtMXN(collected)} sub={`${paidCount} pagados`} />
              <Card title="Pendiente" value={fmtMXN(pending)} sub={`${unpaidCount} sin pagar`} />
              <Card title="Fase actual" value={phase} sub={`Act.: ${lastUpdatedLabel}`} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600 text-left"><tr>
                  <th className="p-2 w-10">#</th><th className="p-2">Participante</th><th className="p-2 text-center">Pts</th><th className="p-2">Equipos</th><th className="p-2 text-center">Pago</th><th className="p-2 text-right">Premio</th>
                </tr></thead>
                <tbody>
                  {standings.map(r=>(
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="p-2 font-semibold">{r.rank}</td>
                      <td className="p-2">{r.name}</td>
                      <td className="p-2 text-center font-semibold">{r.total}</td>
                      <td className="p-2"><div className="flex flex-wrap gap-1">
                        {[r.t1,r.t2,r.t3].map((t,i)=>t?<Badge key={i} color={stageBadgeColor(teamStageRank(t))}>{t.team} ({teamPoints(t)})</Badge>:<Badge key={i} color="slate">—</Badge>)}
                      </div></td>
                      <td className="p-2 text-center">{r.paid?<Badge color="green">Pagado</Badge>:<Badge color="red">Pendiente</Badge>}</td>
                      <td className="p-2 text-right">{r.rank<=3?<Badge color="gold">{fmtMXN(prizeFor(r.rank))}</Badge>:"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-slate-400">Fuente: {state.source==="api"?"API externa":"datos manuales/mock"} · Última actualización: {lastUpdatedLabel}</div>
          </div>
        )}

        {/* PARTICIPANTES */}
        {tab==="participantes" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card title="Pagados" value={paidCount} /><Card title="Sin pagar" value={unpaidCount} /><Card title="Recaudado" value={fmtMXN(collected)} /><Card title="Pendiente" value={fmtMXN(pending)} /><Card title="Bolsa total" value={fmtMXN(totalPool)} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600 text-left"><tr><th className="p-2 w-10">#</th><th className="p-2">Nombre</th><th className="p-2 text-center">Pagó ({fmtMXN(ENTRY_FEE)})</th></tr></thead>
                <tbody>
                  {state.participants.map((p,idx)=>(
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="p-2">{idx+1}</td>
                      <td className="p-2"><input disabled={!admin} value={p.name} onChange={e=>update(n=>{n.participants[idx].name=e.target.value;})} className="w-full px-2 py-1 rounded border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500" /></td>
                      <td className="p-2 text-center">
                        {admin ? (
                          <button
                            onClick={()=>update(n=>{n.participants[idx].paid=!n.participants[idx].paid;})}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${p.paid?"bg-emerald-100 text-emerald-700 hover:bg-emerald-200":"bg-rose-100 text-rose-700 hover:bg-rose-200"}`}
                          >
                            {p.paid?"Pagado":"Pendiente"}
                          </button>
                        ) : (
                          p.paid?<Badge color="green">Pagado</Badge>:<Badge color="red">Pendiente</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!admin && <p className="text-xs text-slate-400">Activa el modo admin para editar nombres y pagos.</p>}
          </div>
        )}

        {/* EQUIPOS / SORTEO */}
        {tab==="equipos" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {admin && <button onClick={sortear} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium">Sortear equipos</button>}
              {admin && <button onClick={limpiarSorteo} className="px-3 py-2 rounded-lg bg-rose-100 text-rose-700 text-sm font-medium">Limpiar sorteo</button>}
              <span className="text-xs text-slate-500">Cada participante recibe 1 equipo de cada bombo, sin duplicados.</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600 text-left"><tr><th className="p-2">Participante</th><th className="p-2">Bombo 1</th><th className="p-2">Bombo 2</th><th className="p-2">Bombo 3</th></tr></thead>
                <tbody>
                  {state.participants.map((p,idx)=>(
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="p-2">{p.name}</td>
                      {[["b1",BOMBO_1],["b2",BOMBO_2],["b3",BOMBO_3]].map(([key,list])=>(
                        <td key={key} className="p-2">
                          {admin ? (
                            <select value={p[key]||""} onChange={e=>update(n=>{n.participants[idx][key]=e.target.value||null;})} className="w-full px-2 py-1 rounded border border-slate-200">
                              <option value="">—</option>
                              {list.map(t=><option key={t} value={t}>{t}</option>)}
                            </select>
                          ) : (p[key]||"—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!admin && <p className="text-xs text-slate-400">Activa el modo admin para sortear o editar asignaciones.</p>}
          </div>
        )}

        {/* RESULTADOS */}
        {tab==="resultados" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={actualizarResultados} disabled={loadingResults} className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium disabled:opacity-50">{loadingResults?"Actualizando...":"Actualizar resultados"}</button>
              <Badge color={state.source==="api"?"green":"slate"}>Fuente: {state.source==="api"?"API externa":"datos manuales/mock"}</Badge>
              <span className="text-xs text-slate-500">Última actualización: {lastUpdatedLabel}</span>
            </div>
            {admin ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-left"><tr>
                    <th className="p-2">Equipo</th><th className="p-2 text-center">B</th>
                    {[["reachedR32","R32"],["reachedR16","R16"],["reachedR8","R8"],["reachedSemifinal","Semi"],["wonThirdPlace","3er"],["reachedFinal","Final"],["champion","Camp"]].map(([k,l])=><th key={k} className="p-2 text-center">{l}</th>)}
                    <th className="p-2 text-center">Pts</th>
                  </tr></thead>
                  <tbody>
                    {Object.values(state.teams).sort((a,b)=>a.pot-b.pot||a.team.localeCompare(b.team)).map(t=>(
                      <tr key={t.team} className="border-t border-slate-100">
                        <td className="p-2">{t.team}</td><td className="p-2 text-center">{t.pot}</td>
                        {["reachedR32","reachedR16","reachedR8","reachedSemifinal","wonThirdPlace","reachedFinal","champion"].map(k=>(
                          <td key={k} className="p-2 text-center"><input type="checkbox" checked={t[k]} onChange={e=>update(n=>{n.teams[t.team][k]=e.target.checked;touchUpdated(n);})} className="w-4 h-4" /></td>
                        ))}
                        <td className="p-2 text-center font-semibold">{teamPoints(t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600 text-left"><tr><th className="p-2">Equipo</th><th className="p-2 text-center">Bombo</th><th className="p-2">Etapa</th><th className="p-2 text-center">Pts</th></tr></thead>
                  <tbody>
                    {Object.values(state.teams).filter(t=>teamStageRank(t)>1).sort((a,b)=>teamStageRank(b)-teamStageRank(a)).map(t=>(
                      <tr key={t.team} className="border-t border-slate-100"><td className="p-2">{t.team}</td><td className="p-2 text-center">{t.pot}</td><td className="p-2"><Badge color={stageBadgeColor(teamStageRank(t))}>{STAGE_LABEL[teamStageRank(t)]}</Badge></td><td className="p-2 text-center font-semibold">{teamPoints(t)}</td></tr>
                    ))}
                    {Object.values(state.teams).every(t=>teamStageRank(t)<=1) && <tr><td colSpan={4} className="p-4 text-center text-slate-400">Aún no hay avances registrados.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-slate-400">El admin captura avances manualmente. fetchWorldCupResults() está listo para conectar una API real (football-data.org, API-Football, Sportradar).</p>
          </div>
        )}

        {/* PREMIOS */}
        {tab==="premios" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 max-w-md">
              {[["first","1° lugar"],["second","2° lugar"],["third","3° lugar"]].map(([k,l])=>(
                <div key={k} className="flex items-center justify-between gap-2">
                  <label className="text-sm">{l}</label>
                  <input type="number" disabled={!admin} value={state.prizes[k]} onChange={e=>update(n=>{n.prizes[k]=Number(e.target.value)||0;})} className="w-32 px-2 py-1 rounded border border-slate-200 text-right disabled:bg-slate-50" />
                </div>
              ))}
              <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-semibold"><span>Total premios</span><span>{fmtMXN(totalPrizes)}</span></div>
              <div className="flex justify-between text-sm text-slate-500"><span>Bolsa total</span><span>{fmtMXN(totalPool)}</span></div>
              {totalPrizes!==totalPool && (
                <div className={`text-xs p-2 rounded ${totalPrizes>totalPool?"bg-rose-50 text-rose-700":"bg-amber-50 text-amber-700"}`}>
                  {totalPrizes>totalPool?`Advertencia: los premios (${fmtMXN(totalPrizes)}) exceden la bolsa total (${fmtMXN(totalPool)}).`:`Aviso: los premios (${fmtMXN(totalPrizes)}) no igualan la bolsa total (${fmtMXN(totalPool)}). Diferencia: ${fmtMXN(totalPool-totalPrizes)}.`}
                </div>
              )}
            </div>
            {!admin && <p className="text-xs text-slate-400">Activa el modo admin para editar premios.</p>}
          </div>
        )}

        {/* REGLAS */}
        {tab==="reglas" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 text-sm leading-relaxed">
            <h2 className="text-lg font-bold">Reglas de la Quiniela Mundial 2026</h2>
            <div><h3 className="font-semibold">Entrada y bolsa</h3><p>Entrada: {fmtMXN(ENTRY_FEE)} por persona. Participantes: {NUM_PARTICIPANTS}. Bolsa total: {fmtMXN(totalPool)}.</p></div>
            <div><h3 className="font-semibold">Premios</h3><p>1° lugar: {fmtMXN(state.prizes.first)} · 2° lugar: {fmtMXN(state.prizes.second)} · 3° lugar: {fmtMXN(state.prizes.third)}. Total: {fmtMXN(totalPrizes)}.</p></div>
            <div><h3 className="font-semibold">Sorteo</h3><p>Participan 48 selecciones divididas en 3 bombos de 16, según el ranking FIFA oficial publicado el 1 de abril de 2026. Cada participante recibe exactamente 3 equipos: uno del Bombo 1, uno del Bombo 2 y uno del Bombo 3.</p></div>
            <div><h3 className="font-semibold">Sistema de puntos (acumulativo por avance)</h3>
              <ul className="list-disc ml-5"><li>Ronda de 32 (R32): +1</li><li>Octavos (R16): +2</li><li>Cuartos (R8): +3</li><li>Semifinal: +4</li><li>Gana 3er lugar: +2</li><li>Final: +5</li><li>Campeón: +6</li></ul>
              <p className="text-slate-500 mt-1">No hay puntos por victorias, empates, goles, diferencia de goles ni resultados de grupos. El total de cada participante es la suma de sus 3 equipos.</p>
              <p className="text-slate-500 mt-1">Ejemplo: un equipo que llega a cuartos suma R32 (+1), R16 (+2) y R8 (+3) = 6 puntos.</p>
            </div>
            <div><h3 className="font-semibold">Desempates</h3><ol className="list-decimal ml-5"><li>Gana quien tenga el equipo que llegó más lejos.</li><li>Si persiste, se compara el segundo mejor equipo.</li><li>Si persiste, se compara el tercer equipo.</li><li>Si aún hay empate, el premio se reparte entre los empatados.</li></ol></div>
            <div><h3 className="font-semibold">Bombos</h3><p><b>Bombo 1:</b> {BOMBO_1.join(", ")}.</p><p className="mt-1"><b>Bombo 2:</b> {BOMBO_2.join(", ")}.</p><p className="mt-1"><b>Bombo 3:</b> {BOMBO_3.join(", ")}.</p></div>
          </div>
        )}

        {/* ADMIN */}
        {tab==="admin" && (
          <div className="space-y-4 max-w-md">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="font-semibold">Modo administrador</h3>
              {admin ? (
                <button onClick={()=>setAdmin(false)} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium">Salir del modo admin</button>
              ) : (
                <div className="flex gap-2">
                  <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)} placeholder="PIN" className="px-2 py-1 rounded border border-slate-200" />
                  <button onClick={tryPin} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium">Entrar</button>
                </div>
              )}
              <p className="text-xs text-slate-400">Prototipo: el PIN local no es seguridad real. Para uso público final, migrar a autenticación real con Supabase/Firebase.</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <h3 className="font-semibold">Datos</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={exportar} className="px-3 py-2 rounded-lg bg-slate-100 text-sm font-medium">Exportar datos JSON</button>
                <label className="px-3 py-2 rounded-lg bg-slate-100 text-sm font-medium cursor-pointer">Importar datos JSON<input type="file" accept="application/json" onChange={importar} className="hidden" /></label>
                {admin && <button onClick={reiniciar} className="px-3 py-2 rounded-lg bg-rose-100 text-rose-700 text-sm font-medium">Reiniciar quiniela</button>}
              </div>
              {!admin && <p className="text-xs text-slate-400">Reiniciar requiere modo admin.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
