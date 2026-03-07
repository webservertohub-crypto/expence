import React from "react";
import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PALETTE  = ["#2EC4B6","#7B61FF","#F5A623","#34C37A","#F05252","#3B82F6","#EC4899","#10B981","#F97316","#8B5CF6"];
const EMOJI_MAP = {food:"🍔",rent:"🏠",transport:"🚗",shopping:"🛍️",education:"📚",health:"💊",entertainment:"🎬",utilities:"💡",gym:"💪",travel:"✈️",subscriptions:"📺",coffee:"☕"};
const getEmoji  = n => EMOJI_MAP[n.toLowerCase().trim()] ?? "📌";
const fmt       = n => Number(n||0).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2});
const SKEY      = "exp_records_v2";

const DEF_CATS = [
  {id:"food",  name:"Food",      amount:""},
  {id:"rent",  name:"Rent",      amount:""},
  {id:"trans", name:"Transport", amount:""},
  {id:"shop",  name:"Shopping",  amount:""},
];

function useWidth() {
  const [w, setW] = useState(700);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

/* ── Chart tooltip ──────────────────────────────── */
function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"#1E2340",color:"#fff",padding:"8px 14px",borderRadius:9,fontSize:13,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,0.25)",pointerEvents:"none"}}>
      <div style={{color:"rgba(255,255,255,0.4)",fontSize:10,marginBottom:2}}>{payload[0].name}</div>
      ${fmt(payload[0].value)}
    </div>
  );
}

/* ── Storage Panel ──────────────────────────────── */
function StoragePanel({ records, onDelete, onClose }) {
  const w   = useWidth();
  const mob = w < 580;

  const dlCSV = (rec) => {
    const tExp = rec.cats.reduce((a, c) => a + (parseFloat(c.amount)||0), 0);
    const sav  = rec.income - tExp;
    let s = `Expense Control Report\nRecord: ${rec.name||"Untitled"}\nDate: ${rec.savedAt}\n\nIncome,$${rec.income}\n\nExpenses\n`;
    rec.cats.filter(c => parseFloat(c.amount) > 0).forEach(c => {
      const p = tExp > 0 ? Math.round((parseFloat(c.amount)||0)/tExp*100) : 0;
      s += `${c.name},$${parseFloat(c.amount)||0},${p}%\n`;
    });
    s += `\nTotal Expenses,$${tExp}\nNet Savings,$${sav}`;
    const blob = new Blob([s], {type:"text/csv;charset=utf-8;"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `expense-${(rec.name||"record").replace(/\s+/g,"-")}.csv`;
    a.style.display = "none";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(10,12,30,0.4)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"relative",zIndex:501,width:mob?"100vw":"min(480px,100vw)",height:"100vh",background:"#fff",boxShadow:"-4px 0 32px rgba(30,35,64,0.16)",display:"flex",flexDirection:"column",animation:"slideIn 0.28s cubic-bezier(0.4,0,0.2,1)"}}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* header */}
        <div style={{padding:"18px 20px",borderBottom:"1px solid #EEF0F5",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontWeight:700,fontSize:16,color:"#1E2340"}}>🗄 Saved Records</div>
            <div style={{fontSize:12,color:"#8E97B4",marginTop:2}}>{records.length} record{records.length!==1?"s":""} stored</div>
          </div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:9,border:"1.5px solid #E0E3EE",background:"#F8F9FB",cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",color:"#8E97B4",fontFamily:"inherit"}}>×</button>
        </div>

        {/* list */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 40px",display:"flex",flexDirection:"column",gap:14}}>
          {records.length === 0 ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:14,color:"#A0A8BF",padding:"40px 20px",textAlign:"center"}}>
              <div style={{fontSize:56,opacity:0.15}}>🗄</div>
              <div style={{fontSize:15,fontWeight:600}}>No records yet</div>
              <div style={{fontSize:12,lineHeight:1.7}}>Fill in income &amp; expenses on the dashboard then click 💾 Save Data</div>
            </div>
          ) : records.map((rec) => {
            const tExp = rec.cats.reduce((s, c) => s + (parseFloat(c.amount)||0), 0);
            const sav  = rec.income - tExp;
            const over = sav < 0;
            return (
              <div key={rec.id} style={{borderRadius:16,border:"1.5px solid #EEF0F5",overflow:"hidden",boxShadow:"0 2px 12px rgba(30,35,64,0.06)"}}>
                {/* record header */}
                <div style={{background:"linear-gradient(135deg,#1E2340,#2D3461)",padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rec.name||"Untitled Record"}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",marginTop:2}}>{rec.savedAt}</div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={() => dlCSV(rec)} style={{padding:"5px 10px",borderRadius:7,border:"1.5px solid rgba(46,196,182,0.5)",background:"rgba(46,196,182,0.12)",color:"#2EC4B6",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>📊 CSV</button>
                    <button onClick={() => onDelete(rec.id)} style={{padding:"5px 10px",borderRadius:7,border:"1.5px solid rgba(240,82,82,0.4)",background:"rgba(240,82,82,0.12)",color:"#ff7070",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑 Delete</button>
                  </div>
                </div>

                {/* table body */}
                <div style={{padding:"14px 16px",background:"#fff"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderRadius:9,background:"#F0F2FF",marginBottom:10}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#1E2340",display:"flex",alignItems:"center",gap:7}}>
                      <span style={{width:26,height:26,borderRadius:7,background:"#E0E4FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💵</span>
                      Income
                    </span>
                    <span style={{fontFamily:"monospace",fontSize:15,fontWeight:700,color:"#1E2340"}}>${fmt(rec.income)}</span>
                  </div>

                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#8E97B4",margin:"4px 0 8px 2px"}}>Expenses</div>
                  <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>
                    {rec.cats.filter(c => parseFloat(c.amount) > 0).length === 0
                      ? <div style={{fontSize:12,color:"#A0A8BF",padding:"6px 10px",fontStyle:"italic"}}>No expenses recorded</div>
                      : rec.cats.filter(c => parseFloat(c.amount) > 0).map((c, i) => {
                          const amt = parseFloat(c.amount);
                          const pct = tExp > 0 ? Math.round(amt/tExp*100) : 0;
                          const col = PALETTE[i % PALETTE.length];
                          return (
                            <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:"#F8F9FB",border:"1px solid #ECEEF3"}}>
                              <span style={{width:9,height:9,borderRadius:"50%",background:col,flexShrink:0}}/>
                              <span style={{fontSize:13,fontWeight:600,color:"#4A5272",flex:1,display:"flex",alignItems:"center",gap:5,minWidth:0,overflow:"hidden"}}>
                                <span style={{flexShrink:0}}>{getEmoji(c.name)}</span>
                                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
                              </span>
                              <div style={{width:50,height:5,borderRadius:3,background:"#ECEEF3",overflow:"hidden",flexShrink:0}}>
                                <div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:3}}/>
                              </div>
                              <span style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:"#1E2340",minWidth:60,textAlign:"right"}}>${fmt(amt)}</span>
                            </div>
                          );
                        })
                    }
                  </div>

                  <div style={{borderTop:"1px solid #EEF0F5",paddingTop:10,display:"flex",flexDirection:"column",gap:4}}>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 10px"}}>
                      <span style={{fontSize:12,color:"#8E97B4",fontWeight:500}}>Total Expenses</span>
                      <span style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:"#F05252"}}>${fmt(tExp)}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",borderRadius:9,background:over?"rgba(240,82,82,0.07)":"rgba(52,195,122,0.07)"}}>
                      <span style={{fontSize:13,fontWeight:700,color:over?"#C0392B":"#1F9B5B"}}>Net Savings</span>
                      <span style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:over?"#C0392B":"#1F9B5B"}}>{over?"-$":"$"}{fmt(Math.abs(sav))}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Main App ───────────────────────────────────── */
export default function App() {
  const w    = useWidth();
  const mob  = w < 580;
  const desk = w >= 900;

  const [incRaw,    setIncRaw]    = useState("");
  const [income,    setIncome]    = useState(0);
  const [cats,      setCats]      = useState(DEF_CATS);
  const [newName,   setNewName]   = useState("");
  const [addOpen,   setAddOpen]   = useState(false);
  const [chartT,    setChartT]    = useState("pie");
  const [saving,    setSaving]    = useState(false);
  const [loaded,    setLoaded]    = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [records,   setRecords]   = useState([]);
  const [recName,   setRecName]   = useState("");
  const [toast,     setToast]     = useState({msg:"",on:false,col:"#1E2340"});
  const tref = useRef(null);

  const showToast = (msg, col="#1E2340") => {
    clearTimeout(tref.current);
    setToast({msg,col,on:true});
    tref.current = setTimeout(() => setToast(s => ({...s,on:false})), 2600);
  };

  useEffect(() => {
    try { const r = localStorage.getItem(SKEY); if (r) setRecords(JSON.parse(r)); } catch(e){}
    setLoaded(true);
  }, []);

  const handleSave = () => {
    setSaving(true);
    try {
      const now = new Date().toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"});
      const rec = {id:"r"+Date.now(), name:recName.trim()||"Untitled Record", income, cats:[...cats], savedAt:now};
      const updated = [rec, ...records];
      localStorage.setItem(SKEY, JSON.stringify(updated));
      setRecords(updated);
      setIncome(0); setIncRaw("");
      setCats(DEF_CATS.map(c => ({...c,amount:""})));
      setRecName(""); setAddOpen(false);
      showToast("💾 Saved & form cleared!", "#1A9E92");
    } catch(e) { showToast("❌ Save failed","#C0392B"); }
    setSaving(false);
  };

  const deleteRecord = (id) => {
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem(SKEY, JSON.stringify(updated));
    setRecords(updated);
    showToast("🗑 Record deleted");
  };

  const totalExp = cats.reduce((s,c) => s + (parseFloat(c.amount)||0), 0);
  const savings  = income - totalExp;
  const over     = income > 0 && savings < 0;
  const expRate  = income > 0 ? Math.min(100, Math.round(totalExp/income*100)) : 0;
  const savPct   = income > 0 ? Math.max(0, Math.min(100, Math.round(savings/income*100))) : 0;
  const highId   = cats.reduce((b,c) => (parseFloat(c.amount)||0) > (parseFloat(b?.amount)||0) ? c : b, cats[0])?.id;
  const chartData= cats.filter(c => parseFloat(c.amount)>0).map(c => ({name:c.name,value:parseFloat(c.amount)}));

  const addCat = () => {
    const name = newName.trim(); if (!name) return;
    setCats(p => [...p,{id:"c"+Date.now(),name,amount:""}]);
    setNewName(""); setAddOpen(false); showToast(`✅ "${name}" added`,"#1A9E92");
  };
  const removeCat = id => {
    const c = cats.find(x => x.id===id);
    setCats(p => p.filter(x => x.id!==id));
    showToast(`🗑 "${c?.name}" removed`);
  };
  const updateAmt = (id,val) => setCats(p => p.map(c => c.id===id ? {...c,amount:val} : c));

  const sc   = over ? "#C0392B" : "#1F9B5B";
  const cols = desk ? "1fr 1fr 1fr" : mob ? "1fr" : "1fr 1fr";
  const cp   = mob ? 16 : 22;
  const inp  = (ex={}) => ({padding:"9px 13px",borderRadius:10,border:"1.5px solid #DDE1EC",fontSize:14,outline:"none",fontFamily:"inherit",background:"#F8F9FB",color:"#1E2340",width:"100%",boxSizing:"border-box",...ex});

  if (!loaded) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#EEF0F6",gap:16}}>
      <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#2EC4B6,#7B61FF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>💰</div>
      <div style={{fontSize:14,color:"#8E97B4",fontWeight:600}}>Loading…</div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#EEF0F6",minHeight:"100vh",color:"#1E2340"}}>
      <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield;appearance:textfield}*{box-sizing:border-box}`}</style>

      {/* ── HEADER ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #E0E3EE",padding:`0 ${mob?12:24}px`,height:58,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 8px rgba(30,35,64,0.07)",position:"sticky",top:0,zIndex:300,gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:9,fontWeight:700,fontSize:16,flexShrink:0}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#2EC4B6,#7B61FF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>💰</div>
          {mob?"Expenses":"Expense Control"}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <button onClick={() => setShowPanel(true)} style={{display:"flex",alignItems:"center",gap:6,padding:mob?"7px 9px":"7px 14px",borderRadius:9,border:"1.5px solid #DDE1EC",background:"#F8F9FB",color:"#4A5272",fontWeight:700,fontSize:mob?11:12,cursor:"pointer",fontFamily:"inherit",position:"relative"}}>
            🗄{!mob&&" Storage"}
            {records.length>0 && <span style={{position:"absolute",top:-7,right:-7,width:19,height:19,borderRadius:"50%",background:"#7B61FF",color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{records.length}</span>}
          </button>
          <button onClick={handleSave} disabled={saving} style={{display:"flex",alignItems:"center",gap:6,padding:mob?"7px 10px":"7px 16px",borderRadius:9,border:"none",background:saving?"#A0C4C2":"linear-gradient(135deg,#2EC4B6,#1A9E92)",color:"#fff",fontWeight:700,fontSize:mob?11:12,cursor:saving?"not-allowed":"pointer",boxShadow:"0 2px 8px rgba(46,196,182,0.3)",fontFamily:"inherit"}}>
            {saving?"⏳":"💾"}{!mob&&(saving?" Saving…":" Save Data")}
          </button>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{maxWidth:1120,margin:"0 auto",padding:mob?"12px 10px 50px":"22px 18px 50px",display:"grid",gridTemplateColumns:cols,gap:mob?10:16}}>

        {/* RECORD NAME */}
        <div style={{gridColumn:"1/-1",background:"#fff",borderRadius:14,padding:`${cp}px`,boxShadow:"0 2px 18px rgba(30,35,64,0.07)",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,rgba(123,97,255,0.15),rgba(46,196,182,0.15))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏷️</div>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"#8E97B4",marginBottom:6}}>Record Name</div>
            <input type="text" value={recName} onChange={e=>setRecName(e.target.value)} placeholder="e.g. January 2025 Budget, Monthly Expenses…" maxLength={48} style={inp()}/>
          </div>
          {recName && <div style={{fontSize:10,color:"#A0A8BF",whiteSpace:"nowrap",flexShrink:0}}>{48-recName.length} left</div>}
        </div>

        {/* INCOME */}
        <div style={{background:"linear-gradient(145deg,#1E2340,#2D3461)",borderRadius:18,padding:cp,boxShadow:"0 2px 18px rgba(30,35,64,0.13)",gridColumn:desk?"1":"1/-1"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"1.3px",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:9,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#2EC4B6",display:"inline-block"}}/>Income
          </div>
          <div style={{fontFamily:"monospace",fontSize:mob?26:34,fontWeight:700,color:"#fff",letterSpacing:"-1.5px",margin:"4px 0 14px",lineHeight:1}}>
            <span style={{fontSize:mob?15:20,opacity:0.4}}>$</span>{fmt(income)}
          </div>
          <input type="number" min="0" inputMode="decimal" value={incRaw} placeholder="Enter income…"
            onChange={e=>{setIncRaw(e.target.value);setIncome(parseFloat(e.target.value)||0);}}
            style={inp({background:"rgba(255,255,255,0.09)",border:"1.5px solid rgba(255,255,255,0.18)",color:"#fff"})}/>
        </div>

        {/* OVERVIEW */}
        <div style={{background:"#fff",borderRadius:18,padding:cp,boxShadow:"0 2px 18px rgba(30,35,64,0.08)"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"1.3px",textTransform:"uppercase",color:"#8E97B4",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#7B61FF",display:"inline-block"}}/>Overview
          </div>
          {[
            {icon:"💵",label:"Income",   val:"$"+fmt(income),                                    vc:"#1E2340",bg:"#F0F2FF"},
            {icon:"📤",label:"Expenses", val:"$"+fmt(totalExp),                                  vc:"#F05252", bg:"#FDECEA"},
            {icon:"💚",label:"Savings",  val:(over?"-$":"$")+fmt(Math.abs(savings)),             vc:over?"#E03030":"#34C37A",bg:over?"#FDECEA":"#E8F8EF"},
            {icon:"📈",label:"Exp Rate", val:expRate+"%",                                        vc:"#7B61FF", bg:"#F0EEFF"},
          ].map((r,i,a)=>(
            <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<a.length-1?"1px solid #EEF0F5":"none"}}>
              <span style={{fontSize:12,color:"#8E97B4",fontWeight:500,display:"flex",alignItems:"center",gap:7}}>
                <span style={{width:26,height:26,borderRadius:7,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{r.icon}</span>
                {r.label}
              </span>
              <span style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:r.vc,marginLeft:6}}>{r.val}</span>
            </div>
          ))}
        </div>

        {/* SAVINGS */}
        <div style={{background:over?"linear-gradient(145deg,#FDECEA,#FDD)":"linear-gradient(145deg,#E8F8EF,#D0F5E6)",borderRadius:18,padding:cp,boxShadow:"0 2px 18px rgba(30,35,64,0.08)",border:`1.5px solid ${over?"rgba(240,82,82,0.22)":"rgba(52,195,122,0.22)"}`}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"1.3px",textTransform:"uppercase",color:`${sc}99`,marginBottom:9,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:over?"#F05252":"#34C37A",display:"inline-block"}}/>Savings
          </div>
          <div style={{fontFamily:"monospace",fontSize:mob?26:34,fontWeight:700,color:sc,letterSpacing:"-1.5px",margin:"4px 0 10px",lineHeight:1}}>
            <span style={{fontSize:mob?15:20,opacity:0.45}}>{over?"-$":"$"}</span>{fmt(Math.abs(savings))}
          </div>
          <span style={{display:"inline-flex",alignItems:"center",padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:700,background:over?"rgba(240,82,82,0.12)":"rgba(52,195,122,0.15)",color:sc}}>
            {over?"⚠ Over budget":savPct>=20?"🎯 Great savings!":income>0?"✦ On track":"✦ Enter income"}
          </span>
          <div style={{marginTop:13,background:over?"rgba(240,82,82,0.15)":"rgba(52,195,122,0.15)",borderRadius:10,height:7,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:10,width:`${over?100:savPct}%`,background:over?"linear-gradient(90deg,#F05252,#F5A623)":"linear-gradient(90deg,#34C37A,#2EC4B6)",transition:"width 0.5s ease"}}/>
          </div>
          <p style={{fontSize:11,color:sc,opacity:0.6,marginTop:6,fontFamily:"monospace"}}>
            {over?"Spending exceeds income":`${savPct}% of income saved`}
          </p>
        </div>

        {/* CATEGORIES */}
        <div style={{background:"#fff",borderRadius:18,padding:cp,boxShadow:"0 2px 18px rgba(30,35,64,0.08)",gridColumn:desk?"1/3":"1/-1"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:10,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:15,fontWeight:700}}>Expense Categories</div>
              <div style={{fontSize:12,color:"#8E97B4",marginTop:3}}>Enter amounts then click 💾 Save Data</div>
            </div>
            <button onClick={()=>setAddOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:10,border:`1.5px dashed ${addOpen?"#2EC4B6":"#DDE1EC"}`,background:addOpen?"#E4F5F2":"transparent",color:addOpen?"#1A9E92":"#8E97B4",fontWeight:600,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>
              {addOpen?"✕ Cancel":"＋ Add Category"}
            </button>
          </div>

          {addOpen && (
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              <input autoFocus placeholder="e.g. Education, Coffee…" value={newName} maxLength={22}
                onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat()}
                style={inp({flex:1,minWidth:130,width:"auto"})}/>
              <button onClick={addCat} style={{padding:"9px 16px",borderRadius:10,border:"none",background:"#2EC4B6",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(auto-fill,minmax(165px,1fr))",gap:10}}>
            {cats.map(cat=>{
              const amt=parseFloat(cat.amount)||0;
              const isH=cat.id===highId&&amt>0;
              const pct=totalExp>0?Math.round(amt/totalExp*100):0;
              return(
                <div key={cat.id} style={{borderRadius:12,padding:13,background:isH?"#FFF0F0":"#F8F9FB",border:`1.5px solid ${isH?"rgba(240,82,82,0.28)":"#ECEEF3"}`,transition:"all 0.2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isH?5:8}}>
                    <span style={{fontSize:12,fontWeight:600,color:isH?"#C0392B":"#4A5272",display:"flex",alignItems:"center",gap:4,minWidth:0,overflow:"hidden"}}>
                      <span style={{flexShrink:0}}>{getEmoji(cat.name)}</span>
                      <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat.name}</span>
                    </span>
                    <button onClick={()=>removeCat(cat.id)} style={{width:20,height:20,borderRadius:5,border:"none",background:"transparent",color:"#C8CEDA",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0,fontFamily:"inherit"}}>×</button>
                  </div>
                  {isH&&<div style={{marginBottom:7}}><span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:"rgba(240,82,82,0.12)",color:"#C0392B",fontWeight:700}}>▲ HIGHEST</span></div>}
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontFamily:"monospace",fontSize:13,color:"#8E97B4",pointerEvents:"none"}}>$</span>
                    <input type="number" min="0" inputMode="decimal" value={cat.amount} placeholder="0"
                      onChange={e=>updateAmt(cat.id,e.target.value)}
                      style={{width:"100%",padding:"8px 8px 8px 22px",borderRadius:8,border:`1.5px solid ${isH?"rgba(240,82,82,0.28)":"#DDE1EC"}`,fontFamily:"monospace",fontSize:15,fontWeight:600,color:"#1E2340",background:"#fff",outline:"none",boxSizing:"border-box"}}/>
                  </div>
                  <div style={{marginTop:8,background:isH?"rgba(240,82,82,0.1)":"#ECEEF3",borderRadius:4,height:4,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:4,width:`${pct}%`,background:isH?"linear-gradient(90deg,#F05252,#F5A623)":"linear-gradient(90deg,#2EC4B6,#7B61FF)",transition:"width 0.4s ease"}}/>
                  </div>
                  <div style={{fontSize:10,fontWeight:600,color:isH?"rgba(192,57,43,0.55)":"#A0A8BF",marginTop:4,textAlign:"right",fontFamily:"monospace"}}>{pct>0?`${pct}%`:"–"}</div>
                </div>
              );
            })}
          </div>

          <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #EEF0F5",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
            <div style={{fontSize:12,color:"#A0A8BF"}}>💡 After saving, form resets to empty</div>
            <button onClick={handleSave} disabled={saving} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 22px",borderRadius:11,border:"none",background:saving?"#A0C4C2":"linear-gradient(135deg,#2EC4B6,#1A9E92)",color:"#fff",fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",boxShadow:"0 3px 12px rgba(46,196,182,0.3)",fontFamily:"inherit"}}>
              {saving?"⏳ Saving…":"💾 Save Data"}
            </button>
          </div>
        </div>

        {/* CHART */}
        <div style={{background:"#fff",borderRadius:18,padding:cp,boxShadow:"0 2px 18px rgba(30,35,64,0.08)"}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>Spending Breakdown</div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {["pie","bar"].map(t=>(
              <button key={t} onClick={()=>setChartT(t)} style={{padding:"5px 13px",borderRadius:20,border:`1.5px solid ${chartT===t?"#1E2340":"#DDE1EC"}`,background:chartT===t?"#1E2340":"transparent",color:chartT===t?"#fff":"#8E97B4",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.18s",textTransform:"capitalize",fontFamily:"inherit"}}>{t}</button>
            ))}
          </div>
          {chartData.length===0?(
            <div style={{height:210,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#A0A8BF",gap:10}}>
              <div style={{fontSize:40,opacity:0.22}}>📊</div>
              <div style={{fontSize:13,fontWeight:500}}>Enter expenses to see chart</div>
            </div>
          ):chartT==="pie"?(
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="45%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {chartData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                </Pie>
                <Tooltip content={<ChartTip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,fontWeight:600,color:"#4A5272",paddingTop:6}}/>
              </PieChart>
            </ResponsiveContainer>
          ):(
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={chartData} barCategoryGap="38%" margin={{top:4,right:4,left:0,bottom:0}}>
                <XAxis dataKey="name" tick={{fontSize:10,fill:"#8E97B4",fontWeight:600}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#8E97B4"}} axisLine={false} tickLine={false} tickFormatter={v=>"$"+fmt(v)} width={50}/>
                <Tooltip content={<ChartTip/>} cursor={{fill:"rgba(30,35,64,0.04)"}}/>
                <Bar dataKey="value" radius={[7,7,0,0]}>
                  {chartData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{gridColumn:"1/-1",textAlign:"center",fontSize:11,color:"#B0B8CC",paddingTop:2}}>
          💾 Data saved locally · No account needed
        </div>
      </div>

      {showPanel && <StoragePanel records={records} onDelete={deleteRecord} onClose={()=>setShowPanel(false)}/>}

      {/* Toast */}
      <div style={{position:"fixed",bottom:20,right:20,zIndex:9999,background:toast.col,color:"#fff",padding:"10px 18px",borderRadius:12,fontSize:13,fontWeight:600,boxShadow:"0 8px 28px rgba(0,0,0,0.22)",transform:toast.on?"translateY(0) scale(1)":"translateY(60px) scale(0.94)",opacity:toast.on?1:0,transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1),opacity 0.25s ease",pointerEvents:"none",maxWidth:"calc(100vw - 40px)"}}>
        {toast.msg}
      </div>
    </div>
  );
}
