// Google Sheets sync for workout tabs A/B/C.
(function(){
  const SHEET_ID='1SFClMgTbjDfVTv57ukoUZhhcln8QL8MltdWmld53BAk';
  const tabForWorkout={workout1:'A',workout2:'B',workout3:'C'};
  const workoutForTab={A:'workout1',B:'workout2',C:'workout3'};

  const aliases={
    push_incline_db_press:['incline dumbbell press'],
    push_db_shoulder_press:['dumbbell shoulder press','machine shoulder press','shoulder press'],
    push_cable_lateral_raise:['cable lateral raise','single arm cable lateral raise','single-arm cable lateral raise','lateral raise'],
    push_cable_fly:['cable fly'],
    push_rope_pushdown:['rope pushdown','rope triceps pushdown','triceps rope pushdown'],
    push_overhead_rope_extension:['overhead rope extension','overhead rope triceps extension','overhead triceps extension'],
    pull_pullups:['pull ups','pull-ups','pullups'],
    pull_chest_supported_row:['chest supported row','chest-supported row'],
    pull_lat_pulldown:['lat pulldown','lat pull down'],
    pull_incline_db_curl:['incline dumbbell curl','incline db curl'],
    pull_cable_curl:['cable curl'],
    pull_rope_hammer_curl:['rope hammer curl','hammer rope curl'],
    arms_cable_lateral_raise:['cable lateral raise','single arm cable lateral raise','single-arm cable lateral raise','lateral raise'],
    arms_rope_pushdown:['rope pushdown','rope triceps pushdown','triceps rope pushdown'],
    arms_reverse_pec_deck:['reverse pec deck','reverse pecdeck','rear delt pec deck'],
    arms_overhead_rope_extension:['overhead rope extension','overhead rope triceps extension','overhead triceps extension'],
    arms_ez_bar_curl:['ez bar curl','ez-bar curl','ez curl'],
    arms_bayesian_curl:['bayesian curl'],
    arms_farmer_carry:['farmer carry','farmers carry','farmer’s carry','farmer\'s carry']
  };

  function norm(s){return String(s||'').toLowerCase().replace(/[–—-]/g,' ').replace(/[^a-z0-9א-ת ]/g,' ').replace(/\s+/g,' ').trim()}
  function parseCsv(text){
    const rows=[];let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='"'){
        if(q&&text[i+1]==='"'){cell+='"';i++;} else q=!q;
      } else if(ch===','&&!q){row.push(cell);cell='';}
      else if((ch==='\n'||ch==='\r')&&!q){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
      else cell+=ch;
    }
    if(cell||row.length){row.push(cell);rows.push(row);}return rows;
  }
  function numberCell(v){const n=Number(String(v||'').replace(',','.').replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:null}
  function findExerciseByText(text,workoutId){
    const w=state.workouts?.[workoutId];if(!w)return null;const n=norm(text);if(!n)return null;
    for(const e of w.exercises){
      const names=[e.name,...(aliases[e.id]||[])].map(norm);
      if(names.some(x=>x&&n.includes(x)))return e;
    }
    return null;
  }
  function parseWorkoutCsv(text,workoutId){
    const rows=parseCsv(text);if(!rows.length)throw new Error('הגיליון ריק');
    let weightCol=4,repsCol=5,rirCol=6;
    for(const r of rows){
      const nn=r.map(norm);const wi=nn.findIndex(x=>x==='משקל'||x.includes('weight')),ri=nn.findIndex(x=>x.includes('חזרות')||x==='reps'),rr=nn.findIndex(x=>x==='rir'||x.includes('רזרבה'));
      if(wi>=0)weightCol=wi;if(ri>=0)repsCol=ri;if(rr>=0)rirCol=rr;
      if(wi>=0&&ri>=0)break;
    }
    const result={};let current=null;
    for(const r of rows){
      const joined=r.filter(Boolean).join(' ');const maybe=findExerciseByText(joined,workoutId);if(maybe)current=maybe;
      const weight=numberCell(r[weightCol]),reps=numberCell(r[repsCol]),rir=numberCell(r[rirCol]);
      if(current&&weight!==null&&reps!==null&&reps>0){
        result[current.id]=result[current.id]||[];
        result[current.id].push({weight,reps,rir:rir===null?null:rir});
      }
    }
    return result;
  }
  async function fetchTab(tab){
    const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}&_=${Date.now()}`;
    const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error('לא הצלחתי לגשת ל-Google Sheet');
    const text=await res.text();
    if(/<!doctype html/i.test(text)||/accounts\.google\.com/i.test(text))throw new Error('צריך להגדיר את הגיליון כ-Anyone with the link: Viewer');
    return text;
  }
  function previewHtml(tab,parsed,workoutId){
    const w=state.workouts[workoutId];const items=w.exercises.filter(e=>parsed[e.id]?.length).map(e=>`<div class="history-item"><strong>${esc(e.name)}</strong><div class="muted small">${parsed[e.id].map(s=>`${s.weight}×${s.reps}${s.rir!==null?` · RIR ${s.rir}`:''}`).join(' | ')}</div></div>`).join('');
    return `<div class="stack">${items||'<div class="empty">לא מצאתי סטים תואמים</div>'}</div>`;
  }
  function saveParsed(tab,parsed,workoutId){
    const l=log();l.workout=l.workout||{};
    const w=state.workouts[workoutId];let count=0;
    w.exercises.forEach(e=>{
      const sets=parsed[e.id];if(!sets?.length)return;
      const maxWeight=Math.max(...sets.map(s=>s.weight||0));
      l.workout[e.id]={done:true,weight:maxWeight,reps:sets.map(s=>s.reps).join(','),rir:sets.map(s=>s.rir??'').join(','),sets,source:'google-sheet',sheet:tab,syncedAt:new Date().toISOString()};count++;
    });
    state.scheduleOverrides=state.scheduleOverrides||{};state.scheduleOverrides[TODAY()]=workoutId;save();return count;
  }
  async function syncTab(tab,button){
    const workoutId=workoutForTab[tab];const box=$('#sheetSyncStatus');
    try{
      if(button){button.disabled=true;button.textContent='מסנכרן…'}if(box)box.innerHTML='<div class="muted">מושך נתונים מ-Google Sheets…</div>';
      const csv=await fetchTab(tab),parsed=parseWorkoutCsv(csv,workoutId),exerciseCount=Object.keys(parsed).length,setCount=Object.values(parsed).reduce((s,a)=>s+a.length,0);
      if(!exerciseCount)throw new Error(`לא מצאתי תרגילים תואמים בלשונית ${tab}`);
      if(box)box.innerHTML=`<div class="card" style="margin-top:10px"><strong>מצאתי אימון ${tab}: ${exerciseCount} תרגילים · ${setCount} סטים</strong>${previewHtml(tab,parsed,workoutId)}<div class="row" style="margin-top:10px"><button class="btn" id="confirmSheetSync">ייבא להיום</button><button class="btn secondary" id="cancelSheetSync">ביטול</button></div></div>`;
      $('#confirmSheetSync').onclick=()=>{const n=saveParsed(tab,parsed,workoutId);alert(`סונכרנו ${n} תרגילים מאימון ${tab}`);render();};
      $('#cancelSheetSync').onclick=()=>{if(box)box.innerHTML='';};
    }catch(e){if(box)box.innerHTML=`<div class="empty">${esc(e.message||'שגיאת סנכרון')}</div>`;}finally{if(button){button.disabled=false;button.textContent=`Sync ${tab}`;}}
  }

  const baseRenderWorkoutsSync=renderWorkouts;
  renderWorkouts=function(){return `<section class="card"><div class="row space"><div><h2>Google Sheets</h2><div class="muted small">מושך רק מהלשוניות A, B ו-C ושומר את הביצועים להיום.</div></div></div><div class="row" style="margin-top:10px;flex-wrap:wrap"><button class="btn sync-sheet" data-tab="A">🔄 Sync A</button><button class="btn secondary sync-sheet" data-tab="B">🔄 Sync B</button><button class="btn secondary sync-sheet" data-tab="C">🔄 Sync C</button></div><div id="sheetSyncStatus"></div></section>`+baseRenderWorkoutsSync();};
  const baseBindSync=bind;
  bind=function(r){baseBindSync(r);if(r!=='workouts')return;$$('.sync-sheet').forEach(b=>b.addEventListener('click',()=>syncTab(b.dataset.tab,b)));};
})();