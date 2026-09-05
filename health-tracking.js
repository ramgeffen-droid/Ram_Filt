// Manual meals, InBody tracking, and 22:00 daily summary.
state.inbody = state.inbody || [];
state.dailySummaryTime = state.dailySummaryTime || "22:00";
save();

// Include manually logged food in daily totals.
const baseTotalsHealth = totals;
totals = function(d = TODAY()) {
  const z = baseTotalsHealth(d);
  const manual = state.logs?.[d]?.manualMeals || [];
  return {
    p: Math.round(z.p + manual.reduce((s,m)=>s+(+m.p||0),0)),
    k: Math.round(z.k + manual.reduce((s,m)=>s+(+m.k||0),0))
  };
};

function manualMealsSection(){
  const items = log().manualMeals || [];
  return `
    <div class="section-title"><h2>ארוחה ידנית</h2></div>
    <section class="card">
      <div class="muted" style="margin-bottom:10px">אכלת משהו שלא מופיע בתפריט? הוסף אותו והוא ייכנס לחישוב היומי.</div>
      <div class="form-grid">
        <div><label>מה אכלתי</label><input id="manualMealName" placeholder="למשל סנדוויץ׳ גבינה"></div>
        <div><label>שעה</label><input id="manualMealTime" type="time" value="${new Date().toTimeString().slice(0,5)}"></div>
        <div><label>חלבון (ג׳)</label><input id="manualMealProtein" type="number" step="0.1" placeholder="0"></div>
        <div><label>קלוריות</label><input id="manualMealCalories" type="number" step="1" placeholder="0"></div>
      </div>
      <button id="addManualMeal" class="btn" style="margin-top:12px">הוסף למה שאכלתי היום</button>
      ${items.length?`<hr><div class="stack">${items.map((m,i)=>`<div class="history-item row space"><div><strong>${esc(m.time||"")} · ${esc(m.name)}</strong><div class="muted small">${Math.round(+m.p||0)} ג׳ חלבון · ${Math.round(+m.k||0)} קק״ל</div></div><button class="btn danger delete-manual-meal" data-i="${i}">מחק</button></div>`).join("")}</div>`:""}
    </section>`;
}

const baseRenderFoodHealth = renderFood;
renderFood = function(){ return baseRenderFoodHealth() + manualMealsSection(); };

function inbodyAnalysis(){
  const arr=[...(state.inbody||[])].sort((a,b)=>a.date.localeCompare(b.date));
  if(arr.length<2) return `<div class="muted">אחרי שתי מדידות לפחות יוצג כאן ניתוח ההתקדמות.</div>`;
  const first=arr[0], last=arr[arr.length-1];
  const d=(key,unit)=>{
    if(first[key]===null||first[key]===undefined||last[key]===null||last[key]===undefined||first[key]===""||last[key]==="") return "";
    const diff=(+last[key])-(+first[key]);
    const sign=diff>0?"+":"";
    return `${sign}${diff.toFixed(1)} ${unit}`;
  };
  return `<div class="stack">
    ${d("weight","ק״ג")?`<div><strong>משקל:</strong> ${d("weight","ק״ג")}</div>`:""}
    ${d("bodyFat","נק׳ אחוז")?`<div><strong>אחוז שומן:</strong> ${d("bodyFat","נק׳ אחוז")}</div>`:""}
    ${d("muscle","ק״ג")?`<div><strong>מסת שריר שלדית:</strong> ${d("muscle","ק״ג")}</div>`:""}
    ${d("visceral","רמות")?`<div><strong>שומן ויסרלי:</strong> ${d("visceral","רמות")}</div>`:""}
    <div class="muted small">השוואה מהמדידה הראשונה לאחרונה.</div>
  </div>`;
}

function inbodySection(){
  const arr=[...(state.inbody||[])].sort((a,b)=>b.date.localeCompare(a.date));
  return `
    <div class="section-title"><h2>InBody</h2></div>
    <section class="card">
      <h3>הוסף מדידה</h3>
      <div class="form-grid">
        <div><label>תאריך</label><input id="ibDate" type="date" value="${TODAY()}"></div>
        <div><label>משקל (ק״ג)</label><input id="ibWeight" type="number" step="0.1"></div>
        <div><label>אחוז שומן</label><input id="ibBodyFat" type="number" step="0.1"></div>
        <div><label>מסת שריר שלדית (ק״ג)</label><input id="ibMuscle" type="number" step="0.1"></div>
        <div><label>שומן ויסרלי</label><input id="ibVisceral" type="number" step="0.1"></div>
        <div><label>BMI</label><input id="ibBmi" type="number" step="0.1"></div>
      </div>
      <div style="margin-top:12px"><label>צרף צילום / PDF של תוצאות InBody</label><input id="ibFile" type="file" accept="image/*,application/pdf"></div>
      <div class="muted small" style="margin-top:7px">הקובץ נשמר מקומית במכשיר. כרגע יש להזין את המספרים ידנית; קריאה אוטומטית מהצילום תתווסף עם שכבת ה-AI.</div>
      <button id="saveInbody" class="btn" style="margin-top:12px">שמור מדידה</button>
    </section>
    <div class="section-title"><h2>ניתוח InBody</h2></div>
    <section class="card">${inbodyAnalysis()}</section>
    ${arr.length?`<div class="section-title"><h2>מדידות קודמות</h2></div><div class="stack">${arr.map((x,i)=>`<div class="history-item"><strong>${esc(x.date)}</strong><div class="muted small">${x.weight!==""?x.weight+" ק״ג · ":""}${x.bodyFat!==""?x.bodyFat+"% שומן · ":""}${x.muscle!==""?x.muscle+" ק״ג שריר":""}${x.fileName?` · 📎 ${esc(x.fileName)}`:""}</div></div>`).join("")}</div>`:""}`;
}

const baseRenderProgressHealth = renderProgress;
renderProgress = function(){ return baseRenderProgressHealth() + inbodySection(); };

function saveInbodyFile(file, id){
  if(!file) return;
  const req=indexedDB.open("RamFitFiles",1);
  req.onupgradeneeded=()=>req.result.createObjectStore("files");
  req.onsuccess=()=>{
    const tx=req.result.transaction("files","readwrite");
    tx.objectStore("files").put(file,id);
  };
}

function dailySummaryBody(){
  const z=totals();
  const pTarget=+state.settings.proteinTarget||0, kTarget=+state.settings.caloriesTarget||0;
  const w=workout();
  let workoutText="יום מנוחה";
  if(w){
    const done=w.exercises.filter(e=>log().workout?.[e.id]?.done).length;
    workoutText=`אימון: ${done}/${w.exercises.length} תרגילים`;
  }
  const proteinText=`חלבון ${z.p}/${pTarget} ג׳`;
  const calText=`קלוריות ${z.k}/${kTarget}`;
  return `${proteinText} · ${calText} · ${workoutText}`;
}

function checkDailySummary(){
  if(!state.settings.reminders||!("Notification" in window)||Notification.permission!=="granted") return;
  const now=new Date(), hm=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
  if(hm!==state.dailySummaryTime) return;
  const key=`summary-${TODAY()}-${hm}`;
  if(state.reminderLog[key]) return;
  new Notification("Ram Fit · סיכום יום",{body:dailySummaryBody(),icon:"./icon-192.png"});
  state.reminderLog[key]=1;save();
}

const baseRenderSettingsHealth = renderSettings;
renderSettings = function(){
  return baseRenderSettingsHealth()+`<div class="section-title"><h2>סיכום יום</h2></div><section class="card"><div class="row space"><strong>שעת סיכום יומי</strong><input id="dailySummaryTime" type="time" value="${state.dailySummaryTime}" style="width:130px"></div></section>`;
};

const baseBindHealth=bind;
bind=function(r){
  baseBindHealth(r);
  if(r==="food"){
    $('#addManualMeal')?.addEventListener('click',()=>{
      const name=$('#manualMealName').value.trim();
      if(!name) return alert('כתוב מה אכלת');
      log().manualMeals=log().manualMeals||[];
      log().manualMeals.push({name,time:$('#manualMealTime').value,p:+$('#manualMealProtein').value||0,k:+$('#manualMealCalories').value||0});
      save();render();
    });
    $$('.delete-manual-meal').forEach(b=>b.addEventListener('click',()=>{log().manualMeals.splice(+b.dataset.i,1);save();render();}));
  }
  if(r==="progress"){
    $('#saveInbody')?.addEventListener('click',()=>{
      const id='ib-'+Date.now(), file=$('#ibFile').files?.[0];
      const entry={id,date:$('#ibDate').value||TODAY(),weight:$('#ibWeight').value,bodyFat:$('#ibBodyFat').value,muscle:$('#ibMuscle').value,visceral:$('#ibVisceral').value,bmi:$('#ibBmi').value,fileName:file?.name||""};
      state.inbody.push(entry);saveInbodyFile(file,id);save();render();
    });
  }
  if(r==="settings"){
    const old=$('#saveSettings');
    old?.addEventListener('click',()=>{state.dailySummaryTime=$('#dailySummaryTime')?.value||"22:00";save();},{once:true});
  }
};

setInterval(checkDailySummary,20000);
checkDailySummary();
