// Ram Fit v19 — Google Sheets sync using the real workout tab names.
(function(){
  const SHEET_ID='1SFClMgTbjDfVTv57ukoUZhhcln8QL8MltdWmld53BAk';
  const workoutForTab={A:'workout1',B:'workout2',C:'workout3'};
  const tabForWorkout={workout1:'A',workout2:'B',workout3:'C'};
  const tabCandidates={
    A:['A - PUSH','A – PUSH','A — PUSH','A','אימון A','Workout A'],
    B:['B - PULL','B – PULL','B — PULL','B','אימון B','Workout B'],
    C:['C - SHOULDERS + ARMS','C – SHOULDERS + ARMS','C — SHOULDERS + ARMS','C - SHOULDERS & ARMS','C - ARMS','C','אימון C','Workout C']
  };
  const knownGids={A:'1086243005'};
  const aliases={
    push_incline_db_press:['incline dumbbell press','incline press'],
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
    arms_farmer_carry:['farmer carry','farmers carry','farmer’s carry',"farmer's carry"]
  };

  function norm(s){return String(s||'').toLowerCase().replace(/[–—-]/g,' ').replace(/[^a-z0-9א-ת.% ]/g,' ').replace(/\s+/g,' ').trim();}
  function parseCsv(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(q&&text[i+1]==='"'){cell+='"';i++;}else q=!q;}else if(ch===','&&!q){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!q){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}else cell+=ch;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
  function num(v){const s=String(v??'').trim().replace(',','.');if(!s)return null;const m=s.match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):null;}
  function findExercise(text,workoutId){const w=state.workouts?.[workoutId],n=norm(text);if(!w||!n)return null;for(const e of w.exercises){const names=[e.name,...(aliases[e.id]||[])].map(norm);if(names.some(x=>x&&(n===x||n.includes(x))))return e;}return null;}
  function detectCols(rows){const cols={exercise:null,weight:null,reps:null,rir:null,set:null};for(const r of rows.slice(0,25)){r.forEach((v,i)=>{const n=norm(v);if(cols.exercise===null&&(n.includes('exercise')||n.includes('תרגיל')))cols.exercise=i;if(cols.weight===null&&(n.includes('weight')||n.includes('משקל')||n==='kg'||n.includes('ק ג')))cols.weight=i;if(cols.reps===null&&(n==='reps'||n.includes('repetition')||n.includes('חזרות')))cols.reps=i;if(cols.rir===null&&(n==='rir'||n.includes('reserve')||n.includes('רזרבה')))cols.rir=i;if(cols.set===null&&(n==='set'||n==='סט'||n.includes('set number')||n.includes('מספר סט')))cols.set=i;});}return cols;}
  function parseWorkoutCsv(text,workoutId){const rows=parseCsv(text);if(!rows.length)throw new Error('הלשונית ריקה');const cols=detectCols(rows),result={};let current=null;
    for(const r of rows){const exerciseText=cols.exercise!==null?r[cols.exercise]:r.filter(Boolean).join(' ');const maybe=findExercise(exerciseText,workoutId)||findExercise(r.filter(Boolean).join(' '),workoutId);if(maybe)current=maybe;if(!current)continue;
      let weight=cols.weight!==null?num(r[cols.weight]):null,reps=cols.reps!==null?num(r[cols.reps]):null,rir=cols.rir!==null?num(r[cols.rir]):null;
      if(weight===null||reps===null){const ns=r.map(num).filter(x=>x!==null);if(ns.length>=2){if(weight===null)weight=ns.length>=4?ns[ns.length-3]:ns[0];if(reps===null)reps=ns.length>=3?ns[ns.length-2]:ns[1];if(rir===null&&ns.length>=3)rir=ns[ns.length-1];}}
      if(weight!==null&&reps!==null&&reps>0){result[current.id]=result[current.id]||[];result[current.id].push({weight,reps,rir});}
    }
    return result;
  }
  async function fetchUrl(url){const res=await fetch(url,{cache:'no-store',redirect:'follow'});if(!res.ok)throw new Error(`HTTP ${res.status}`);const text=await res.text();if(/<!doctype html/i.test(text)||/accounts\.google\.com/i.test(text)||/Sign in/i.test(text))throw new Error('PRIVATE');return text;}
  async function fetchByName(name){return fetchUrl(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}&_=${Date.now()}`);}
  async function fetchByGid(gid){return fetchUrl(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(gid)}&_=${Date.now()}`);}
  async function fetchTab(tab){
    let lastErr=null;
    if(knownGids[tab]){try{const text=await fetchByGid(knownGids[tab]);if(text?.trim().length>5)return{text,name:`${tab} (gid ${knownGids[tab]})`};}catch(e){lastErr=e;}}
    for(const name of tabCandidates[tab]){try{const text=await fetchByName(name);if(text?.trim().length>5)return{text,name};}catch(e){lastErr=e;if(e.message==='PRIVATE')throw e;}}
    throw lastErr||new Error(`לא מצאתי את לשונית ${tab}`);
  }
  function previewHtml(parsed,workoutId){const w=state.workouts[workoutId];return `<div class="stack" style="margin-top:10px">${w.exercises.filter(e=>parsed[e.id]?.length).map(e=>`<div class="history-item"><strong>${esc(e.name)}</strong><div class="muted small">${parsed[e.id].map(s=>`${s.weight}×${s.reps}${s.rir!==null?` · RIR ${s.rir}`:''}`).join(' | ')}</div></div>`).join('')||'<div class="empty">לא זוהו סטים</div>'}</div>`;}
  function saveParsed(tab,parsed,workoutId){const l=log();l.workout=l.workout||{};let count=0;for(const e of state.workouts[workoutId].exercises){const sets=parsed[e.id];if(!sets?.length)continue;const maxWeight=Math.max(...sets.map(s=>s.weight||0));l.workout[e.id]={done:true,weight:maxWeight,reps:sets.map(s=>s.reps).join(','),rir:sets.map(s=>s.rir??'').join(','),sets,volume:sets.reduce((sum,s)=>sum+(+s.weight||0)*(+s.reps||0),0),source:'google-sheet',sheet:tab,syncedAt:new Date().toISOString()};count++;}state.scheduleOverrides=state.scheduleOverrides||{};state.scheduleOverrides[TODAY()]=workoutId;state.lastSheetSync={tab,date:TODAY(),at:new Date().toISOString(),count};save();return count;}
  async function syncTab(tab,button){const workoutId=workoutForTab[tab],box=$('#sheetSyncStatus');try{if(button){button.disabled=true;button.textContent='מסנכרן…';}if(box)box.innerHTML='<div class="muted">מושך את האימון מה-Google Sheet…</div>';const got=await fetchTab(tab),parsed=parseWorkoutCsv(got.text,workoutId),exerciseCount=Object.keys(parsed).filter(k=>parsed[k]?.length).length,setCount=Object.values(parsed).reduce((s,a)=>s+a.length,0);if(!exerciseCount)throw new Error(`הצלחתי לקרוא את הלשונית "${got.name}", אבל לא זיהיתי את מבנה הסטים.`);if(box)box.innerHTML=`<div class="card" style="margin-top:10px"><strong>✓ נמצא אימון ${tab}</strong><div class="muted small">${exerciseCount} תרגילים · ${setCount} סטים</div>${previewHtml(parsed,workoutId)}<button class="btn" id="confirmSheetSync" style="width:100%;margin-top:10px">שמור את האימון באפליקציה</button></div>`;$('#confirmSheetSync').onclick=()=>{const n=saveParsed(tab,parsed,workoutId);alert(`סונכרנו ${n} תרגילים מאימון ${tab}`);render();};}
    catch(e){let msg=e.message||'שגיאת סנכרון';if(msg==='PRIVATE')msg='Google מחזיר דף התחברות במקום נתוני הגיליון.';if(box)box.innerHTML=`<div class="empty"><strong>ה-Sync לא הצליח</strong><div class="small" style="margin-top:6px">${esc(msg)}</div></div>`;}finally{if(button){button.disabled=false;button.textContent='🔄 Sync';}}}

  const baseRenderWorkoutsSync=renderWorkouts;
  renderWorkouts=function(){
    const active=workout(),defaultTab=tabForWorkout[active?.id]||state.lastSheetSync?.tab||'A',ls=state.lastSheetSync;
    return `<section class="card"><h2>סנכרון מהאקסל</h2><div class="muted small">אחרי שסיימת להזין ב-Google Sheets, בחר את האימון ולחץ Sync.</div><div class="row" style="margin-top:10px"><select id="sheetWorkoutSelect"><option value="A" ${defaultTab==='A'?'selected':''}>A — Push</option><option value="B" ${defaultTab==='B'?'selected':''}>B — Pull</option><option value="C" ${defaultTab==='C'?'selected':''}>C — Shoulders + Arms</option></select><button class="btn" id="sheetSyncBtn">🔄 Sync</button></div>${ls?`<div class="muted small" style="margin-top:8px">סנכרון אחרון: ${esc(ls.tab)} · ${esc(ls.date)} · ${ls.count} תרגילים</div>`:''}<div id="sheetSyncStatus"></div></section>`+baseRenderWorkoutsSync();
  };
  const baseBindSync=bind;bind=function(r){baseBindSync(r);if(r!=='workouts')return;$('#sheetSyncBtn')?.addEventListener('click',e=>syncTab($('#sheetWorkoutSelect').value,e.currentTarget));};
})();