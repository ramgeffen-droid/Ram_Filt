// Ram Fit v17 — allow multiple menu choices in the same meal period.
(function(){
  const TYPES=['breakfast','lunch','snack','dinner'];

  function ensureSelectionsForLog(dayLog){
    dayLog.mealSelections=dayLog.mealSelections||{};
    dayLog.meals=dayLog.meals||{};
    TYPES.forEach(type=>{
      if(Array.isArray(dayLog.mealSelections[type])) return;
      const old=dayLog.meals[type];
      if(old?.id){
        const base=(state.meals[type]||[]).find(m=>m.id===old.id);
        dayLog.mealSelections[type]=[{id:old.id,done:!!old.done,ingredients:structuredClone(old.ingredients||base?.ingredients||[])}];
      } else dayLog.mealSelections[type]=[];
    });
  }
  Object.values(state.logs||{}).forEach(ensureSelectionsForLog);
  ensureSelectionsForLog(log());
  state.mealMultiSelectVersion=1;
  save();

  function selections(type,d=TODAY()){
    const l=log(d); ensureSelectionsForLog(l); return l.mealSelections[type];
  }
  function selectedEntry(type,id,d=TODAY()){return selections(type,d).find(x=>x.id===id);}
  function selectedMeal(type,entry){
    const base=(state.meals[type]||[]).find(m=>m.id===entry.id);
    if(!base) return null;
    return {...base,ingredients:structuredClone(entry.ingredients||base.ingredients||[])};
  }
  function sumMeal(m){return (m?.ingredients||[]).reduce((a,i)=>({p:a.p+(+i.p||0),k:a.k+(+i.k||0)}),{p:0,k:0});}

  // Authoritative totals: all completed selected menu meals + manual/barcode foods.
  totals=function(d=TODAY()){
    const l=log(d); ensureSelectionsForLog(l); let p=0,k=0;
    TYPES.forEach(type=>selections(type,d).forEach(entry=>{if(entry.done){const z=sumMeal(selectedMeal(type,entry));p+=z.p;k+=z.k;}}));
    (l.manualMeals||[]).forEach(m=>{p+=+m.p||0;k+=+m.k||0;});
    return {p:Math.round(p),k:Math.round(k)};
  };

  function editorMulti(type,entry,m){
    return `<details style="margin-top:10px"><summary><strong>שנה כמויות</strong></summary>${(m.ingredients||[]).map((i,n)=>`<div class="row space" style="margin-top:10px"><div><strong>${esc(i.name)}</strong><div class="muted small">${esc(i.note||'')}</div></div><div class="row"><input class="multi-amt" data-type="${type}" data-id="${entry.id}" data-i="${n}" type="number" step="0.1" value="${i.amount}" style="width:90px"><span>${esc(i.unit)}</span></div></div>`).join('')}<button class="btn secondary save-multi-amts" data-type="${type}" data-id="${entry.id}" style="margin-top:10px">שמור כמויות</button></details>`;
  }

  renderFood=function(){
    return `<section class="card"><h2>תפריט מדויק</h2><div class="muted">אפשר לבחור יותר ממנה אחת בכל ארוחה. למשל בצהריים גם בולונז וגם עוף. סמן ✓ "אכלתי" לכל מנה שאכלת בפועל.</div></section>`+
      TYPES.map(type=>{
        const sel=selections(type);
        return `<div class="section-title"><h2>${labels[type]} · ${state.settings.mealTimes[type]}</h2></div><div class="stack">${(state.meals[type]||[]).map(base=>{
          const entry=sel.find(x=>x.id===base.id),chosen=!!entry,m=entry?selectedMeal(type,entry):base,z=sumMeal(m);
          return `<div class="meal ${entry?.done?'done':''}"><div class="row space" style="align-items:flex-start"><label style="display:flex;gap:8px;color:inherit;flex:1"><input class="multi-choice" type="checkbox" data-type="${type}" data-id="${base.id}" ${chosen?'checked':''}><span><strong>${esc(base.name)}</strong>${ingredients(m)}<div style="margin-top:7px"><strong>${Math.round(z.p)} ג׳ · ${Math.round(z.k)} קק״ל</strong></div></span></label>${chosen?`<label class="small" style="display:flex;gap:6px;align-items:center;white-space:nowrap"><input class="check multi-done" data-type="${type}" data-id="${base.id}" type="checkbox" ${entry.done?'checked':''}> אכלתי</label>`:''}</div>${chosen?editorMulti(type,entry,m):''}</div>`;
        }).join('')}</div>`;
      }).join('');
  };

  renderTodayMeal=function(type){
    const sel=selections(type);
    if(!sel.length)return `<div class="meal"><strong>${labels[type]} · ${state.settings.mealTimes[type]}</strong><div class="muted small" style="margin-top:5px">לא נבחרה מנה</div></div>`;
    return `<div class="meal"><strong>${labels[type]} · ${state.settings.mealTimes[type]}</strong><div class="stack" style="margin-top:8px">${sel.map(entry=>{const m=selectedMeal(type,entry),z=sumMeal(m);return `<div class="history-item ${entry.done?'done':''}"><div class="row space"><div><strong>${esc(m?.name||entry.id)}</strong><div class="muted small">${Math.round(z.p)} ג׳ חלבון · ${Math.round(z.k)} קק״ל</div></div><span>${entry.done?'✓ נאכל':'מתוכנן'}</span></div></div>`}).join('')}</div></div>`;
  };

  const oldBindMulti=bind;
  bind=function(r){
    oldBindMulti(r);
    if(r!=='food') return;
    $$('.multi-choice').forEach(el=>el.addEventListener('change',()=>{
      const type=el.dataset.type,id=el.dataset.id,arr=selections(type),i=arr.findIndex(x=>x.id===id);
      if(el.checked && i<0){const base=(state.meals[type]||[]).find(m=>m.id===id);arr.push({id,done:false,ingredients:structuredClone(base?.ingredients||[])});}
      if(!el.checked && i>=0) arr.splice(i,1);
      save();render();
    }));
    $$('.multi-done').forEach(el=>el.addEventListener('change',()=>{const e=selectedEntry(el.dataset.type,el.dataset.id);if(e){e.done=el.checked;save();render();}}));
    $$('.save-multi-amts').forEach(btn=>btn.addEventListener('click',()=>{
      const type=btn.dataset.type,id=btn.dataset.id,e=selectedEntry(type,id);if(!e)return;
      const base=(state.meals[type]||[]).find(m=>m.id===id);e.ingredients=structuredClone(e.ingredients||base?.ingredients||[]);
      $$(`.multi-amt[data-type="${type}"][data-id="${id}"]`).forEach(inp=>{const n=+inp.dataset.i,old=e.ingredients[n],amount=+inp.value||0,baseAmount=+(base?.ingredients?.[n]?.amount||old?.amount||1);if(old){const ratio=baseAmount?amount/baseAmount:1;old.amount=amount;old.p=(base?.ingredients?.[n]?.p||old.p||0)*ratio;old.k=(base?.ingredients?.[n]?.k||old.k||0)*ratio;}});
      save();render();
    }));
  };
})();