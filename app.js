
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];

const STORAGE_KEY = "ramFitV1";
const TODAY = ()=> new Date().toISOString().slice(0,10);

const defaults = {
  settings:{
    proteinTarget:145,
    caloriesTarget:2300,
    weightKg:73,
    reminders:true,
    mealTimes:{breakfast:"10:00",lunch:"13:30",snack:"17:00",dinner:"20:00"}
  },
  meals:{
    breakfast:[
      {id:"b1",name:"ביצים + סלט + יוגורט",protein:40,calories:500}
    ],
    lunch:[
      {id:"l1",name:"עוף + אורז",protein:50,calories:700},
      {id:"l2",name:"בולונז",protein:45,calories:750}
    ],
    snack:[
      {id:"s1",name:"שייק חלבון",protein:24,calories:160}
    ],
    dinner:[
      {id:"d1",name:"ארוחת ערב לבחירה",protein:35,calories:650}
    ]
  },
  weeklyPlan:{
    1:"workout1", // Monday
    3:"workout2", // Wednesday
    5:"workout3"  // Friday
  },
  workouts:{
    workout1:{
      name:"אימון 1",
      exercises:[
        {id:"w1e1",name:"Pull-ups",target:"3 סטים"},
        {id:"w1e2",name:"Shoulder Press",target:"3×8–12"},
        {id:"w1e3",name:"Triceps Rope Pushdown",target:"3×10–15"},
        {id:"w1e4",name:"Overhead Triceps Extension",target:"3×10–15"},
        {id:"w1e5",name:"Cable Curl",target:"3×10–15"},
        {id:"w1e6",name:"Lateral Raise",target:"3×12–20"}
      ]
    },
    workout2:{
      name:"אימון 2",
      exercises:[
        {id:"w2e1",name:"Pull-ups",target:"3 סטים"},
        {id:"w2e2",name:"Chest Press / Push-ups",target:"3×8–12"},
        {id:"w2e3",name:"Cable Fly",target:"3×10–15"},
        {id:"w2e4",name:"Bayesian Curl",target:"3×10–15"},
        {id:"w2e5",name:"Triceps Extension",target:"3×10–15"},
        {id:"w2e6",name:"Lateral Raise",target:"3×12–20"}
      ]
    },
    workout3:{
      name:"אימון 3",
      exercises:[
        {id:"w3e1",name:"Pull-ups",target:"3 סטים"},
        {id:"w3e2",name:"Lat Pulldown",target:"3×8–12"},
        {id:"w3e3",name:"Shoulder Press",target:"3×8–12"},
        {id:"w3e4",name:"EZ / Dumbbell Curl",target:"3×10–15"},
        {id:"w3e5",name:"Triceps Rope Pushdown",target:"3×10–15"},
        {id:"w3e6",name:"Cable Lateral Raise",target:"3×12–20"}
      ]
    }
  },
  logs:{}
};

function deepMerge(target, src){
  for (const k in src){
    if (src[k] && typeof src[k]==="object" && !Array.isArray(src[k])){
      target[k] = deepMerge(target[k]||{}, src[k]);
    } else if (target[k]===undefined) target[k]=src[k];
  }
  return target;
}
function load(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    return saved ? deepMerge(saved,structuredClone(defaults)) : structuredClone(defaults);
  }catch(e){ return structuredClone(defaults); }
}
let state=load();
function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }

function dayLog(date=TODAY()){
  if(!state.logs[date]) state.logs[date]={meals:{},workout:{},weight:null};
  return state.logs[date];
}
function workoutForDate(date=TODAY()){
  const dow=new Date(date+"T12:00:00").getDay();
  const id=state.weeklyPlan[dow];
  return id ? {id,...state.workouts[id]} : null;
}
function mealTypeLabel(t){
  return {breakfast:"בוקר",lunch:"צהריים",snack:"ביניים",dinner:"ערב"}[t]||t;
}
function formatDate(d=new Date()){
  return d.toLocaleDateString("he-IL",{weekday:"long",day:"numeric",month:"long"});
}
function totalsForDate(date=TODAY()){
  const log=dayLog(date);
  let p=0,c=0;
  for(const type of Object.keys(log.meals||{})){
    const picked=log.meals[type];
    if(picked?.done){
      p += Number(picked.protein||0);
      c += Number(picked.calories||0);
    }
  }
  return {protein:p,calories:c};
}
function pct(v,t){ return Math.min(100,Math.round((v/(t||1))*100)); }
function esc(s=""){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m])); }

function setRoute(route){
  location.hash=route;
}
function currentRoute(){ return location.hash.replace("#","")||"today"; }

function render(){
  const route=currentRoute();
  $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.route===route));
  $("#todayDate").textContent=formatDate();
  const view=$("#view");
  if(route==="today") view.innerHTML=renderToday();
  if(route==="workouts") view.innerHTML=renderWorkouts();
  if(route==="food") view.innerHTML=renderFood();
  if(route==="progress") view.innerHTML=renderProgress();
  if(route==="settings") view.innerHTML=renderSettings();
  bindHandlers(route);
}

function renderToday(){
  const totals=totalsForDate();
  const w=workoutForDate();
  const log=dayLog();
  const workoutDone = w && w.exercises.every(ex=>log.workout?.[ex.id]?.done);
  return `
    <div class="grid two">
      <section class="card">
        <div class="row space">
          <div>
            <div class="muted small">חלבון היום</div>
            <div class="kpi">${totals.protein}<span class="small"> / ${state.settings.proteinTarget} ג׳</span></div>
          </div>
          <span class="tag ${totals.protein>=state.settings.proteinTarget?"success":""}">${pct(totals.protein,state.settings.proteinTarget)}%</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${pct(totals.protein,state.settings.proteinTarget)}%"></div></div>
      </section>
      <section class="card">
        <div class="row space">
          <div>
            <div class="muted small">קלוריות היום</div>
            <div class="kpi">${totals.calories}<span class="small"> / ${state.settings.caloriesTarget}</span></div>
          </div>
          <span class="tag">${pct(totals.calories,state.settings.caloriesTarget)}%</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${pct(totals.calories,state.settings.caloriesTarget)}%"></div></div>
      </section>
    </div>

    <div class="section-title"><h2>האימון של היום</h2></div>
    <section class="card">
      ${w ? `
        <div class="row space">
          <div><h3>${esc(w.name)}</h3><div class="muted small">${w.exercises.length} תרגילים</div></div>
          <span class="tag ${workoutDone?"success":""}">${workoutDone?"הושלם":"מתוכנן"}</span>
        </div>
        <hr>
        <button class="btn" data-go="workouts">${workoutDone?"צפה באימון":"התחל אימון"}</button>
      ` : `<div class="empty">היום הוא יום מנוחה 🛋️</div>`}
    </section>

    <div class="section-title"><h2>הארוחות של היום</h2><button class="btn secondary" data-go="food">עריכה</button></div>
    <div class="stack">
      ${["breakfast","lunch","snack","dinner"].map(type=>renderTodayMeal(type)).join("")}
    </div>
  `;
}

function renderTodayMeal(type){
  const log=dayLog();
  const picked=log.meals?.[type];
  const defaultMeal=state.meals[type]?.[0];
  const meal=picked?.name?picked:defaultMeal;
  const done=!!picked?.done;
  return `<div class="meal ${done?"done":""}">
    <div class="row space">
      <div>
        <strong>${mealTypeLabel(type)} · ${state.settings.mealTimes[type]||""}</strong>
        <div>${esc(meal?.name||"לא הוגדרה ארוחה")}</div>
        <div class="muted small">${meal?.protein||0} ג׳ חלבון · ${meal?.calories||0} קק״ל</div>
      </div>
      <input class="check meal-check" type="checkbox" data-type="${type}" ${done?"checked":""} />
    </div>
  </div>`;
}

function renderWorkouts(){
  const w=workoutForDate();
  if(!w){
    return `<section class="card"><h2>אימונים</h2><div class="empty">אין אימון מתוכנן להיום. אפשר לשנות את ימי האימון בהגדרות.</div></section>
    ${renderAllWorkouts()}`;
  }
  const log=dayLog();
  return `
    <section class="card">
      <div class="row space">
        <div><h2>${esc(w.name)}</h2><div class="muted">האימון של היום</div></div>
        <span class="tag">${w.exercises.length} תרגילים</span>
      </div>
    </section>
    <div class="section-title"><h2>תרגילים</h2></div>
    <div class="stack">
      ${w.exercises.map((ex,i)=>{
        const l=log.workout?.[ex.id]||{};
        return `<div class="exercise ${l.done?"done":""}">
          <div class="row space">
            <div><strong>${i+1}. ${esc(ex.name)}</strong><div class="muted small">${esc(ex.target)}</div></div>
            <input class="check ex-check" type="checkbox" data-ex="${ex.id}" ${l.done?"checked":""}/>
          </div>
          <div class="form-grid" style="margin-top:10px">
            <div><label>משקל</label><input type="number" step="0.5" class="ex-weight" data-ex="${ex.id}" value="${l.weight??""}" placeholder="ק״ג"></div>
            <div><label>חזרות</label><input class="ex-reps" data-ex="${ex.id}" value="${esc(l.reps??"")}" placeholder="למשל 12,12,10"></div>
          </div>
          <div style="margin-top:10px"><label>הערה</label><input class="ex-note" data-ex="${ex.id}" value="${esc(l.note??"")}" placeholder="קל / קשה / כאב / טכניקה"></div>
        </div>`
      }).join("")}
    </div>
    <button class="btn" id="saveWorkout" style="width:100%;margin-top:14px">שמור אימון</button>
    ${renderPreviousWorkout(w.id)}
  `;
}
function renderPreviousWorkout(workoutId){
  const entries=Object.entries(state.logs).filter(([d,l])=>{
    const wd=workoutForDate(d);
    return wd?.id===workoutId && Object.keys(l.workout||{}).length;
  }).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,3);
  if(!entries.length) return "";
  return `<div class="section-title"><h2>אימונים קודמים</h2></div>
    <div class="stack">${entries.map(([d,l])=>`<div class="history-item"><strong>${d}</strong><div class="muted small">${Object.values(l.workout).filter(x=>x.done).length} תרגילים הושלמו</div></div>`).join("")}</div>`;
}
function renderAllWorkouts(){
  return `<div class="section-title"><h2>התוכנית</h2></div><div class="stack">
    ${Object.entries(state.workouts).map(([id,w])=>`<section class="card"><h3>${esc(w.name)}</h3><div class="muted small">${w.exercises.map(x=>esc(x.name)).join(" · ")}</div></section>`).join("")}
  </div>`;
}

function renderFood(){
  return `
    <section class="card">
      <h2>תפריט יומי</h2>
      <div class="muted">בחר ארוחה בכל קטגוריה. הסימון "אכלתי" נספר מול היעדים.</div>
    </section>
    ${["breakfast","lunch","snack","dinner"].map(type=>renderMealSection(type)).join("")}
    <div class="section-title"><h2>הוספת ארוחה</h2></div>
    <section class="card">
      <div class="form-grid">
        <div><label>סוג</label><select id="newMealType">
          <option value="breakfast">בוקר</option><option value="lunch">צהריים</option>
          <option value="snack">ביניים</option><option value="dinner">ערב</option>
        </select></div>
        <div><label>שם</label><input id="newMealName" placeholder="למשל קוטג׳ + לחם"></div>
        <div><label>חלבון (ג׳)</label><input id="newMealProtein" type="number"></div>
        <div><label>קלוריות</label><input id="newMealCalories" type="number"></div>
      </div>
      <button class="btn" id="addMeal" style="margin-top:12px">הוסף</button>
    </section>
  `;
}
function renderMealSection(type){
  const log=dayLog();
  const current=log.meals?.[type];
  const list=state.meals[type]||[];
  return `<div class="section-title"><h2>${mealTypeLabel(type)} · ${state.settings.mealTimes[type]||""}</h2></div>
    <div class="stack">${list.map(m=>{
      const chosen=current?.id===m.id || (!current && list[0]?.id===m.id);
      const done=chosen && current?.done;
      return `<div class="meal ${done?"done":""}">
        <div class="row space">
          <label style="margin:0;display:flex;gap:10px;align-items:center;color:inherit">
            <input type="radio" name="meal-${type}" class="meal-choice" data-type="${type}" data-id="${m.id}" ${chosen?"checked":""}>
            <span><strong>${esc(m.name)}</strong><div class="muted small">${m.protein} ג׳ · ${m.calories} קק״ל</div></span>
          </label>
          ${chosen?`<input class="check meal-check" type="checkbox" data-type="${type}" ${done?"checked":""}/>`:""}
        </div>
      </div>`;
    }).join("")}</div>`;
}

function renderProgress(){
  const dates=Object.keys(state.logs).sort().reverse().slice(0,14);
  const avgProtein = dates.length ? Math.round(dates.reduce((s,d)=>s+totalsForDate(d).protein,0)/dates.length) : 0;
  const hitDays = dates.filter(d=>totalsForDate(d).protein>=state.settings.proteinTarget).length;
  return `
    <div class="grid two">
      <section class="card"><div class="muted small">ממוצע חלבון</div><div class="kpi">${avgProtein}<span class="small"> ג׳</span></div></section>
      <section class="card"><div class="muted small">ימים ביעד</div><div class="kpi">${hitDays}<span class="small"> / ${dates.length}</span></div></section>
    </div>
    <div class="section-title"><h2>משקל גוף</h2></div>
    <section class="card">
      <div class="row">
        <input id="todayWeight" type="number" step="0.1" value="${dayLog().weight??state.settings.weightKg}" />
        <button class="btn" id="saveWeight">שמור</button>
      </div>
    </section>
    <div class="section-title"><h2>14 ימים אחרונים</h2></div>
    <div class="stack">
      ${dates.length?dates.map(d=>{
        const t=totalsForDate(d), l=state.logs[d];
        return `<div class="history-item row space">
          <div><strong>${d}</strong><div class="muted small">${l.weight?l.weight+" ק״ג · ":""}${t.protein} ג׳ חלבון</div></div>
          <span class="tag ${t.protein>=state.settings.proteinTarget?"success":"warn"}">${pct(t.protein,state.settings.proteinTarget)}%</span>
        </div>`
      }).join(""):`<div class="empty">עדיין אין מספיק נתונים.</div>`}
    </div>
  `;
}

function renderSettings(){
  const s=state.settings;
  const dayMap={1:"ב׳",2:"ג׳",3:"ד׳",4:"ה׳",5:"ו׳",6:"ש׳",0:"א׳"};
  return `
    <section class="card">
      <h2>יעדים</h2>
      <div class="form-grid">
        <div><label>חלבון יומי (ג׳)</label><input id="proteinTarget" type="number" value="${s.proteinTarget}"></div>
        <div><label>קלוריות יומיות</label><input id="caloriesTarget" type="number" value="${s.caloriesTarget}"></div>
      </div>
    </section>
    <div class="section-title"><h2>שעות ארוחות</h2></div>
    <section class="card">
      <div class="form-grid">
        ${["breakfast","lunch","snack","dinner"].map(t=>`<div><label>${mealTypeLabel(t)}</label><input class="meal-time" data-type="${t}" type="time" value="${s.mealTimes[t]}"></div>`).join("")}
      </div>
    </section>
    <div class="section-title"><h2>ימי אימון</h2></div>
    <section class="card">
      <div class="stack">
        ${[0,1,2,3,4,5,6].map(d=>`<div class="row space"><strong>${dayMap[d]}</strong><select class="day-workout" data-day="${d}">
          <option value="">מנוחה</option>
          ${Object.entries(state.workouts).map(([id,w])=>`<option value="${id}" ${state.weeklyPlan[d]===id?"selected":""}>${esc(w.name)}</option>`).join("")}
        </select></div>`).join("")}
      </div>
    </section>
    <button class="btn" id="saveSettings" style="width:100%;margin-top:14px">שמור הגדרות</button>
    <button class="btn danger" id="resetData" style="width:100%;margin-top:10px">אפס את כל הנתונים</button>
  `;
}

function chooseMeal(type,id){
  const meal=(state.meals[type]||[]).find(m=>m.id===id);
  if(!meal) return;
  const old=dayLog().meals[type]||{};
  dayLog().meals[type]={...meal,done:!!old.done};
  save();
}
function toggleMeal(type,done){
  let entry=dayLog().meals[type];
  if(!entry){
    const m=state.meals[type]?.[0];
    if(m) entry=dayLog().meals[type]={...m};
  }
  if(entry){ entry.done=done; save(); }
}
function bindHandlers(route){
  $$("[data-go]").forEach(b=>b.onclick=()=>setRoute(b.dataset.go));
  $$(".meal-check").forEach(ch=>ch.onchange=()=>{toggleMeal(ch.dataset.type,ch.checked);render()});
  $$(".meal-choice").forEach(r=>r.onchange=()=>{chooseMeal(r.dataset.type,r.dataset.id);render()});

  if(route==="workouts"){
    $("#saveWorkout")?.addEventListener("click",()=>{
      const log=dayLog();
      $$(".exercise").forEach(box=>{
        const ex=box.querySelector(".ex-check")?.dataset.ex;
        if(!ex) return;
        log.workout[ex]={
          done:box.querySelector(".ex-check").checked,
          weight:box.querySelector(".ex-weight").value,
          reps:box.querySelector(".ex-reps").value,
          note:box.querySelector(".ex-note").value
        };
      });
      save(); alert("האימון נשמר"); render();
    });
  }
  if(route==="food"){
    $("#addMeal")?.addEventListener("click",()=>{
      const type=$("#newMealType").value;
      const name=$("#newMealName").value.trim();
      if(!name) return alert("צריך שם לארוחה");
      state.meals[type].push({
        id:"m"+Date.now(),name,
        protein:Number($("#newMealProtein").value||0),
        calories:Number($("#newMealCalories").value||0)
      });
      save(); render();
    });
  }
  if(route==="progress"){
    $("#saveWeight")?.addEventListener("click",()=>{
      dayLog().weight=Number($("#todayWeight").value);
      state.settings.weightKg=dayLog().weight;
      save(); render();
    });
  }
  if(route==="settings"){
    $("#saveSettings")?.addEventListener("click",()=>{
      state.settings.proteinTarget=Number($("#proteinTarget").value);
      state.settings.caloriesTarget=Number($("#caloriesTarget").value);
      $$(".meal-time").forEach(i=>state.settings.mealTimes[i.dataset.type]=i.value);
      $$(".day-workout").forEach(s=>{
        if(s.value) state.weeklyPlan[s.dataset.day]=s.value;
        else delete state.weeklyPlan[s.dataset.day];
      });
      save(); alert("ההגדרות נשמרו"); render();
    });
    $("#resetData")?.addEventListener("click",()=>{
      if(confirm("למחוק את כל הנתונים?")){
        localStorage.removeItem(STORAGE_KEY);state=structuredClone(defaults);save();render();
      }
    });
  }
}
$$(".nav-btn").forEach(b=>b.onclick=()=>setRoute(b.dataset.route));
window.addEventListener("hashchange",render);

$("#notifBtn").onclick=async()=>{
  if(!("Notification" in window)) return alert("הדפדפן הזה לא תומך בהתראות.");
  const p=await Notification.requestPermission();
  if(p==="granted") new Notification("Ram Fit",{body:"התראות הופעלו. בשלב הבא נחבר תזכורות אמיתיות."});
};

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
render();
