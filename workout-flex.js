// Flexible workout scheduling + always-visible workout plan
state.scheduleOverrides = state.scheduleOverrides || {};
save();

const baseWeeklyWorkout = workout;
workout = function(d = TODAY()) {
  const override = state.scheduleOverrides?.[d];
  if (override === "rest") return null;
  if (override && state.workouts[override]) return { id: override, ...state.workouts[override] };
  return baseWeeklyWorkout(d);
};

function workoutOptions(selectedId) {
  return `<option value="rest" ${!selectedId ? "selected" : ""}>מנוחה היום</option>` +
    Object.entries(state.workouts).map(([id,w]) =>
      `<option value="${id}" ${selectedId===id?"selected":""}>${esc(w.name)}</option>`
    ).join("");
}

function exerciseLogger(w) {
  if (!w) return `<div class="empty">אין אימון פעיל להיום. אפשר לבחור אחד למעלה.</div>`;
  const l = log();
  return `<div class="section-title"><h2>${esc(w.name)} — ביצוע היום</h2></div>
  <div class="stack">${w.exercises.map((e,n)=>{const x=l.workout[e.id]||{};return `
    <div class="exercise">
      <div class="row space"><strong>${n+1}. ${esc(e.name)}</strong><input class="check ex-check" data-ex="${e.id}" type="checkbox" ${x.done?"checked":""}></div>
      <div class="muted small">${esc(e.target)}</div>
      <div class="form-grid" style="margin-top:8px">
        <input class="ex-weight" data-ex="${e.id}" type="number" step=".5" value="${x.weight||""}" placeholder="משקל ק״ג">
        <input class="ex-reps" data-ex="${e.id}" value="${x.reps||""}" placeholder="חזרות 12,12,10">
      </div>
    </div>`}).join("")}</div>
    <button id="saveWorkout" class="btn" style="width:100%;margin-top:12px">שמור אימון</button>`;
}

renderWorkouts = function() {
  const active = workout();
  return `
    <section class="card">
      <h2>מה אני עושה היום?</h2>
      <div class="muted" style="margin-bottom:10px">אפשר להזיז אימון יום קדימה/אחורה בלי לשנות את התוכנית הקבועה.</div>
      <div class="row">
        <select id="todayWorkoutSelect">${workoutOptions(active?.id)}</select>
        <button class="btn" id="setTodayWorkout">עדכן היום</button>
      </div>
    </section>

    ${exerciseLogger(active)}

    <div class="section-title"><h2>כל תוכנית האימונים</h2></div>
    <div class="stack">
      ${Object.entries(state.workouts).map(([id,w])=>`
        <section class="card">
          <div class="row space">
            <div><h3>${esc(w.name)}</h3><div class="muted small">${w.exercises.length} תרגילים</div></div>
            ${active?.id===id?`<span class="tag success">היום</span>`:`<button class="btn secondary do-today" data-id="${id}">עשה היום</button>`}
          </div>
          <hr>
          <div class="stack">
            ${w.exercises.map((e,n)=>`<div class="row space"><span><strong>${n+1}. ${esc(e.name)}</strong></span><span class="muted small">${esc(e.target)}</span></div>`).join("")}
          </div>
        </section>`).join("")}
    </div>`;
};

const baseBindFlex = bind;
bind = function(r) {
  baseBindFlex(r);
  if (r !== "workouts") return;

  $('#setTodayWorkout')?.addEventListener('click',()=>{
    const v = $('#todayWorkoutSelect').value;
    state.scheduleOverrides[TODAY()] = v === 'rest' ? 'rest' : v;
    save(); render();
  });

  $$('.do-today').forEach(b=>b.addEventListener('click',()=>{
    state.scheduleOverrides[TODAY()] = b.dataset.id;
    save(); render();
  }));
};
