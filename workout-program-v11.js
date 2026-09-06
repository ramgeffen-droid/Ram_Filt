// Ram Fit v11 — authoritative workout program reset.
// User explicitly approved overwriting the old workout definitions.
(function(){
  const PROGRAM_VERSION='push-pull-arms-v11';
  const program={
    workout1:{name:'A — Push',exercises:[
      {id:'push_incline_db_press',name:'Incline Dumbbell Press',target:'3×8–12'},
      {id:'push_db_shoulder_press',name:'Dumbbell Shoulder Press',target:'3×8–12'},
      {id:'push_cable_lateral_raise',name:'Cable Lateral Raise',target:'3×12–20'},
      {id:'push_cable_fly',name:'Cable Fly',target:'3×10–15'},
      {id:'push_rope_pushdown',name:'Rope Pushdown',target:'3×10–15'},
      {id:'push_overhead_rope_extension',name:'Overhead Rope Extension',target:'3×10–15'}
    ]},
    workout2:{name:'B — Pull',exercises:[
      {id:'pull_pullups',name:'Pull-Ups',target:'3 סטים'},
      {id:'pull_chest_supported_row',name:'Chest Supported Row',target:'3×8–12'},
      {id:'pull_lat_pulldown',name:'Lat Pulldown',target:'3×8–12'},
      {id:'pull_incline_db_curl',name:'Incline Dumbbell Curl',target:'3×8–12'},
      {id:'pull_cable_curl',name:'Cable Curl',target:'3×10–15'},
      {id:'pull_rope_hammer_curl',name:'Rope Hammer Curl',target:'3×10–15'}
    ]},
    workout3:{name:'C — כתפיים + ידיים',exercises:[
      {id:'arms_cable_lateral_raise',name:'Cable Lateral Raise',target:'3×12–20'},
      {id:'arms_rope_pushdown',name:'Rope Pushdown',target:'3×10–15'},
      {id:'arms_reverse_pec_deck',name:'Reverse Pec Deck',target:'3×12–20'},
      {id:'arms_overhead_rope_extension',name:'Overhead Rope Extension',target:'3×10–15'},
      {id:'arms_ez_bar_curl',name:'EZ Bar Curl',target:'3×8–12'},
      {id:'arms_bayesian_curl',name:'Bayesian Curl',target:'3×10–15'},
      {id:'arms_farmer_carry',name:'Farmer Carry',target:'3×30–60 שנ׳'}
    ]}
  };
  if(state.workoutProgramVersion!==PROGRAM_VERSION){
    state.workouts=structuredClone(program);
    state.workoutProgramVersion=PROGRAM_VERSION;
    // Keep food/body/history data. Remove only explicit day overrides that may point to obsolete workouts.
    state.scheduleOverrides={};
    save();
  }
})();