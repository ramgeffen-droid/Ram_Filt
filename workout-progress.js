// Workout progression: compare recent performances, suggest the next target, and add a progress dashboard.
(function(){
  function repsArray(v){
    return String(v||'').split(/[,;\s/]+/).map(Number).filter(n=>Number.isFinite(n)&&n>0);
  }
  function history(exerciseId){
    return Object.keys(state.logs||{}).sort().reverse().map(date=>({date,...(state.logs[date]?.workout?.[exerciseId]||{})})).filter(x=>x.weight||x.reps);
  }
  function score(x){
    const reps=repsArray(x.reps); return {weight:+x.weight||0,total:reps.reduce((a,b)=>a+b,0),min:reps.length?Math.min(...reps):0,reps};
  }
  function targetRange(target){
    const m=String(target||'').match(/(\d+)\s*[×x]\s*(\d+)\s*[–-]\s*(\d+)/i);
    return m?{sets:+m[1],min:+m[2],max:+m[3]}:null;
  }
  function progression(exercise){
    const h=history(exercise.id), latest=h[0], prev=h[1];
    if(!latest) return {status:'new',label:'אין עדיין נתונים',next:'מטרה: לרשום ביצוע ראשון'};
    const a=score(latest), b=prev?score(prev):null;
    let status='same',label='ביצוע ראשון שנרשם';
    if(b){
      if(a.weight>b.weight) {status='up';label=`↑ משקל ${b.weight||0} → ${a.weight} ק״ג`;}
      else if(a.weight===b.weight && a.total>b.total){status='up';label=`↑ חזרות ${b.total} → ${a.total}`;}
      else if(a.weight===b.weight && a.total===b.total){status='same';label='→ ללא שינוי';}
      else {status='down';label='↓ ירידה לעומת הפעם הקודמת';}
    }
    const range=targetRange(exercise.target);
    let next='נסה לשפר מעט את הביצוע הקודם';
    if(range && a.reps.length){
      if(a.min>=range.max){
        const bump=a.weight>=20?2.5:1;
        next=a.weight?`יעד הבא: ${Math.round((a.weight+bump)*10)/10} ק״ג, לפחות ${range.min} חזרות בכל סט`:`יעד הבא: הוסף עומס קטן ושמור לפחות ${range.min} חזרות`;
      } else {
        next=`יעד הבא: שמור ${a.weight?`${a.weight} ק״ג`:'אותו עומס'} והוסף לפחות חזרה אחת בסך הכול`;
      }
    } else if(a.reps.length){
      next='יעד הבא: הוסף לפחות חזרה אחת בסך הכול';
    }
    return {status,label,next,latest,a};
  }

  // Upgrade the line shown under every exercise in the workout screen.
  previousLine=function(exerciseId){
    let exercise=null;
    Object.values(state.workouts||{}).some(w=>{exercise=w.exercises.find(e=>e.id===exerciseId);return !!exercise});
    if(!exercise)return '<div class="muted small">אין נתוני התקדמות</div>';
    const p=progression(exercise);
    if(!p.latest)return `<div class="muted small" style="margin-top:5px">${p.label} · ${p.next}</div>`;
    const parts=[]; if(p.latest.weight)parts.push(`${esc(p.latest.weight)} ק״ג`); if(p.latest.reps)parts.push(`${esc(p.latest.reps)} חזרות`);
    const icon=p.status==='up'?'🟢':p.status==='down'?'🟠':'⚪';
    return `<div class="small" style="margin-top:6px"><strong>פעם קודמת:</strong> ${parts.join(' · ')} <span class="muted">(${p.latest.date})</span></div><div class="small" style="margin-top:3px">${icon} ${esc(p.label)}</div><div class="small" style="margin-top:3px"><strong>${esc(p.next)}</strong></div>`;
  };

  function progressDashboard(){
    const cards=Object.values(state.workouts||{}).map(w=>`<section class="card"><h3>${esc(w.name)}</h3><div class="stack">${w.exercises.map(e=>{const p=progression(e),h=history(e.id);const last=p.latest;const icon=p.status==='up'?'🟢':p.status==='down'?'🟠':'⚪';return `<div class="history-item"><div class="row space"><strong>${esc(e.name)}</strong><span>${icon}</span></div><div class="muted small">${last?(last.weight?last.weight+' ק״ג · ':'')+(last.reps||''):'אין עדיין ביצוע'}</div><div class="small" style="margin-top:4px">${esc(p.label)}</div><div class="small" style="margin-top:3px"><strong>${esc(p.next)}</strong></div>${h.length?`<div class="muted small" style="margin-top:3px">${h.length} ביצועים שמורים</div>`:''}</div>`}).join('')}</div></section>`).join('');
    return `<div class="section-title"><h2>התקדמות באימונים</h2></div><div class="muted" style="margin-bottom:10px">המערכת משווה משקל וחזרות בין האימונים ומציעה יעד לפעם הבאה לפי progressive overload.</div><div class="stack">${cards}</div>`;
  }

  const baseRenderProgressWorkout=renderProgress;
  renderProgress=function(){return baseRenderProgressWorkout()+progressDashboard();};
})();