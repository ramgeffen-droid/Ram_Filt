// Daily/weekly combined reports for sharing to ChatGPT.
(function(){
  function fmtDate(d){return new Date(d+'T12:00:00').toLocaleDateString('he-IL',{day:'numeric',month:'numeric',year:'numeric'});}
  function dateRange(days){
    const out=[]; const end=new Date(TODAY()+'T12:00:00');
    for(let i=days-1;i>=0;i--){const d=new Date(end);d.setDate(end.getDate()-i);out.push(d.toISOString().slice(0,10));}
    return out;
  }
  function workoutSummary(d){
    const l=state.logs?.[d]; if(!l) return 'אין נתונים';
    const entries=Object.entries(l.workout||{}).filter(([,x])=>x&&(x.done||x.weight||x.reps));
    if(!entries.length) return 'לא נרשם אימון';
    const names={}; Object.values(state.workouts||{}).forEach(w=>(w.exercises||[]).forEach(e=>names[e.id]=e.name));
    return entries.map(([id,x])=>`${names[id]||id}: ${x.weight?x.weight+' ק״ג':''}${x.weight&&x.reps?' · ':''}${x.reps?x.reps+' חזרות':''}${x.done?' ✓':''}`).join('; ');
  }
  function mealsSummary(d){
    const l=state.logs?.[d]; if(!l) return 'אין נתונים';
    const parts=[];
    Object.keys(labels).forEach(t=>{
      const x=l.meals?.[t]; if(!x?.done) return;
      const m=x.ingredients?x:baseMeal(t,x.id); if(!m)return;
      const items=(m.ingredients||[]).map(i=>`${i.amount} ${i.unit} ${i.name}`).join(', ');
      const z=mt(m); parts.push(`${labels[t]}: ${items} (${Math.round(z.p)}g חלבון, ${Math.round(z.k)} kcal)`);
    });
    (l.manualMeals||[]).forEach(m=>parts.push(`ידני ${m.time||''}: ${m.name} (${Math.round(+m.p||0)}g חלבון, ${Math.round(+m.k||0)} kcal)`));
    return parts.length?parts.join('; '):'לא נרשמו ארוחות';
  }
  function inbodySummary(dates){
    const set=new Set(dates); const arr=(state.inbody||[]).filter(x=>set.has(x.date)).sort((a,b)=>a.date.localeCompare(b.date));
    if(!arr.length) return 'אין מדידת InBody בטווח';
    return arr.map(x=>`${fmtDate(x.date)}: משקל ${x.weight||'-'} ק״ג, שומן ${x.bodyFat||'-'}%, מסת שריר ${x.muscle||'-'} ק״ג, שומן ויסרלי ${x.visceral||'-'}, BMI ${x.bmi||'-'}`).join(' | ');
  }
  function buildReport(days){
    const dates=dateRange(days), title=days===1?'דוח יומי':'דוח שבועי';
    const lines=[`Ram Fit — ${title}`,`טווח: ${fmtDate(dates[0])}${days>1?' עד '+fmtDate(dates[dates.length-1]):''}`,''];
    dates.forEach(d=>{const z=totals(d);lines.push(`--- ${fmtDate(d)} ---`,`תזונה: ${z.p}/${state.settings.proteinTarget} ג׳ חלבון, ${z.k}/${state.settings.caloriesTarget} קק״ל`,`ארוחות: ${mealsSummary(d)}`,`אימון: ${workoutSummary(d)}`,'');});
    lines.push(`InBody: ${inbodySummary(dates)}`,'',
      'בבקשה נתח את הדוח הזה כמאמן תזונה ואימונים:','1. תן סיכום קצר של הביצועים והעמידה ביעדים.','2. ציין מגמות חיוביות ובעיות שחוזרות על עצמן.','3. התייחס להתקדמות באימונים, לחלבון/קלוריות ול-InBody אם יש נתונים.','4. תן 3–5 המלצות פרקטיות לתקופה הבאה.','5. אם הנתונים לא מספיקים למסקנה מסוימת, אמור זאת במפורש.');
    return lines.join('\n');
  }
  async function shareReport(days){
    const text=buildReport(days); const title=days===1?'Ram Fit — דוח יומי':'Ram Fit — דוח שבועי';
    if(navigator.share){
      try{await navigator.share({title,text});return;}catch(e){if(e?.name==='AbortError')return;}
    }
    try{await navigator.clipboard.writeText(text);alert('הדוח הועתק. פתח ChatGPT והדבק אותו.');window.open('https://chatgpt.com/','_blank');}
    catch(e){prompt('העתק את הדוח ל-ChatGPT:',text);}
  }
  const baseRenderProgressReport=renderProgress;
  renderProgress=function(){return baseRenderProgressReport()+`
    <div class="section-title"><h2>דוח ל-ChatGPT</h2></div>
    <section class="card">
      <div class="muted" style="margin-bottom:12px">מייצר דוח משולב של אימונים, ארוחות, יעדים ו-InBody עם בקשה לניתוח והמלצות.</div>
      <div class="row" style="flex-wrap:wrap">
        <button class="btn share-report" data-days="1">שתף דוח יומי</button>
        <button class="btn secondary share-report" data-days="7">שתף דוח שבועי</button>
        <button class="btn ghost copy-report" data-days="7">העתק דוח שבועי</button>
      </div>
      <div class="muted small" style="margin-top:10px">בטלפון ייפתח מסך השיתוף; אם ChatGPT מותקן ומופיע ברשימה, אפשר לבחור אותו ישירות.</div>
    </section>`;};
  const baseBindReport=bind;
  bind=function(r){baseBindReport(r);if(r==='progress'){
    $$('.share-report').forEach(b=>b.addEventListener('click',()=>shareReport(+b.dataset.days)));
    $$('.copy-report').forEach(b=>b.addEventListener('click',async()=>{const text=buildReport(+b.dataset.days);try{await navigator.clipboard.writeText(text);alert('הדוח הועתק');}catch(e){prompt('העתק:',text);}}));
  }};
})();
