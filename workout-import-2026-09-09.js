// One-time import of Workout A from the user's 2026-09-09 training sheet.
(function(){
  const IMPORT='workout-a-2026-09-09-v1';
  state.imports=state.imports||{};
  if(state.imports[IMPORT]) return;
  const d='2026-09-09';
  state.logs[d]=state.logs[d]||{meals:{},workout:{},weight:null};
  state.logs[d].workout=state.logs[d].workout||{};
  const put=(id,sets)=>{
    const volume=sets.reduce((s,x)=>s+(Number(x.weight)||0)*(Number(x.reps)||0),0);
    const top=Math.max(...sets.map(x=>Number(x.weight)||0));
    state.logs[d].workout[id]={
      ...(state.logs[d].workout[id]||{}),
      done:true,
      sets,
      weight:top,
      reps:sets.map(x=>x.reps).join(','),
      volume:Math.round(volume*10)/10
    };
  };
  put('push_incline_db_press',[
    {weight:18,reps:10,rir:2},{weight:20,reps:8,rir:2},{weight:20,reps:9,rir:1},{weight:20,reps:9,rir:0}
  ]);
  put('push_db_shoulder_press',[
    {weight:14,reps:8,rir:1},{weight:14,reps:8,rir:1},{weight:14,reps:8,rir:0}
  ]);
  put('push_cable_lateral_raise',[
    {weight:5,reps:10,rir:1},{weight:5,reps:10,rir:0},{weight:5,reps:8,rir:0},{weight:2.5,reps:13,rir:0}
  ]);
  put('push_cable_fly',[
    {weight:12.5,reps:10,rir:1},{weight:12.5,reps:10,rir:0},{weight:10,reps:11,rir:0}
  ]);
  put('push_rope_pushdown',[
    {weight:20,reps:11,rir:1},{weight:20,reps:10,rir:0},{weight:17.5,reps:8,rir:0}
  ]);
  put('push_overhead_rope_extension',[
    {weight:15,reps:9,rir:0},{weight:12.5,reps:10,rir:0},{weight:12.5,reps:10,rir:0}
  ]);
  state.logs[d].workoutMeta={...(state.logs[d].workoutMeta||{}),workoutId:'workout1',name:'A — Push',imported:true};
  state.imports[IMPORT]=true;
  save();
})();