// Ram Fit v13 — workout volume charts for A/B/C.
(function(){
  function repsArray(v){return String(v||'').split(/[,;\s/]+/).map(Number).filter(n=>Number.isFinite(n)&&n>0)}
  function exerciseVolume(entry){
    if(!entry)return 0;
    const weight=Number(entry.weight||0);
    const reps=repsArray(entry.reps);
    if(!weight||!reps.length)return 0;
    return weight*reps.reduce((a,b)=>a+b,0);
  }
  function workoutHistory(workoutId){
    const w=state.workouts?.[workoutId]; if(!w)return [];
    const ids=new Set(w.exercises.map(e=>e.id));
    return Object.keys(state.logs||{}).sort().map(date=>{
      const wl=state.logs[date]?.workout||{};
      let volume=0,logged=0;
      ids.forEach(id=>{const x=wl[id];if(x&&(x.weight||x.reps)){logged++;volume+=exerciseVolume(x)}});
      return {date,volume:Math.round(volume),logged};
    }).filter(x=>x.logged>0);
  }
  function shortDate(d){const [,m,day]=String(d).split('-');return `${day}/${m}`}
  function chartSvg(data){
    if(data.length<2)return `<div class="empty">אחרי שני אימונים עם משקל וחזרות יוצג כאן גרף Volume.</div>`;
    const pts=data.slice(-12), W=640,H=220,padL=52,padR=18,padT=20,padB=42;
    const vals=pts.map(x=>x.volume), max=Math.max(...vals,1), min=Math.min(...vals,0), span=Math.max(max-min,1);
    const x=i=>padL+(i*(W-padL-padR)/Math.max(pts.length-1,1));
    const y=v=>padT+((max-v)/span)*(H-padT-padB);
    const poly=pts.map((p,i)=>`${x(i)},${y(p.volume)}`).join(' ');
    const yTicks=[max,Math.round((max+min)/2),min];
    const labels=pts.map((p,i)=>`<text x="${x(i)}" y="${H-12}" text-anchor="middle" font-size="11">${shortDate(p.date)}</text>`).join('');
    const dots=pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.volume)}" r="4"><title>${p.date}: ${p.volume.toLocaleString('he-IL')} ק״ג×חזרות</title></circle>`).join('');
    const grid=yTicks.map(v=>`<g><line x1="${padL}" x2="${W-padR}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" opacity=".12"/><text x="${padL-8}" y="${y(v)+4}" text-anchor="end" font-size="11">${Math.round(v).toLocaleString('he-IL')}</text></g>`).join('');
    return `<div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="גרף volume" style="width:100%;min-width:520px;height:auto;color:currentColor">${grid}<polyline points="${poly}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg></div>`;
  }
  function summary(data){
    if(!data.length)return '';
    const last=data[data.length-1], prev=data[data.length-2];
    if(!prev)return `<div class="muted small">Volume אחרון: ${last.volume.toLocaleString('he-IL')}</div>`;
    const diff=last.volume-prev.volume, pct=prev.volume?Math.round(diff/prev.volume*100):0;
    const icon=diff>0?'↑':diff<0?'↓':'→';
    return `<div class="row space" style="margin-bottom:8px"><strong>${last.volume.toLocaleString('he-IL')} ק״ג×חזרות</strong><span class="tag">${icon} ${diff===0?'0':(diff>0?'+':'')+pct}% מהאימון הקודם</span></div>`;
  }
  function volumeDashboard(){
    const order=['workout1','workout2','workout3'];
    const cards=order.map(id=>{const w=state.workouts?.[id];if(!w)return'';const h=workoutHistory(id);return `<section class="card"><h3>${esc(w.name)} — Volume</h3><div class="muted small" style="margin-bottom:10px">Volume = משקל שהוזן × סך החזרות בכל התרגילים באימון.</div>${summary(h)}${chartSvg(h)}</section>`}).join('');
    return `<div class="section-title"><h2>Volume לפי אימון</h2></div><div class="muted" style="margin-bottom:10px">כך אפשר לראות אם נפח העבודה הכולל ב-A, B ו-C עולה לאורך זמן. תרגילים ללא משקל מספרי לא נכנסים לחישוב.</div><div class="stack">${cards}</div>`;
  }
  const baseRenderProgressVolume=renderProgress;
  renderProgress=function(){return baseRenderProgressVolume()+volumeDashboard();};
})();