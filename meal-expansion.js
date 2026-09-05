// Extra meal choices + manual-food visibility on Today.
(function(){
  const additions={
    lunch:[
      {id:'l3',name:'פרגית + אורז + ירקות',ingredients:[
        {name:'פרגית ללא עור',amount:180,unit:'גרם',p:45,k:375,note:'משקל אחרי בישול'},
        {name:'אורז',amount:180,unit:'גרם',p:4.9,k:234,note:'משקל אחרי בישול'},
        {name:'ירקות',amount:200,unit:'גרם',p:3,k:70,note:'בקירוב'}
      ]},
      {id:'l4',name:'שניצל עוף + תפוחי אדמה + סלט',ingredients:[
        {name:'שניצל חזה עוף',amount:180,unit:'גרם',p:42,k:390,note:'אחרי בישול; הציפוי והשמן משנים קלוריות'},
        {name:'תפוחי אדמה אפויים',amount:250,unit:'גרם',p:5,k:230,note:'משקל מוכן'},
        {name:'סלט / ירקות',amount:200,unit:'גרם',p:3,k:60,note:'ללא רוטב'}
      ]},
      {id:'l5',name:'קציצות בקר + אורז + ירקות',ingredients:[
        {name:'קציצות בקר',amount:180,unit:'גרם',p:40,k:430,note:'משקל אחרי בישול; תלוי באחוז השומן'},
        {name:'אורז',amount:180,unit:'גרם',p:4.9,k:234,note:'משקל אחרי בישול'},
        {name:'ירקות',amount:200,unit:'גרם',p:3,k:70,note:'בקירוב'}
      ]},
      {id:'l6',name:'קבב בקר + פיתה + סלט',ingredients:[
        {name:'קבב בקר',amount:180,unit:'גרם',p:37,k:455,note:'משקל אחרי בישול'},
        {name:'פיתה',amount:1,unit:'יח׳',p:6,k:240,note:'פיתה בינונית'},
        {name:'סלט / ירקות',amount:200,unit:'גרם',p:3,k:60,note:'ללא רוטב'}
      ]},
      {id:'l7',name:'המבורגר + תפוחי אדמה + סלט',ingredients:[
        {name:'קציצת המבורגר בקר',amount:180,unit:'גרם',p:40,k:460,note:'משקל אחרי בישול'},
        {name:'תפוחי אדמה אפויים',amount:220,unit:'גרם',p:4.5,k:200,note:'משקל מוכן'},
        {name:'סלט / ירקות',amount:200,unit:'גרם',p:3,k:60,note:'ללא רוטב'}
      ]},
      {id:'l8',name:'סטייק + תפוחי אדמה + ירקות',ingredients:[
        {name:'סטייק בקר רזה יחסית',amount:180,unit:'גרם',p:50,k:410,note:'משקל אחרי בישול; משתנה לפי הנתח'},
        {name:'תפוחי אדמה אפויים',amount:250,unit:'גרם',p:5,k:230,note:'משקל מוכן'},
        {name:'ירקות',amount:200,unit:'גרם',p:3,k:70,note:'בקירוב'}
      ]}
    ],
    dinner:[
      {id:'d2',name:'ביצים + טחינה + לחם + סלט',ingredients:[
        {name:'ביצים גדולות',amount:3,unit:'יח׳',p:18.9,k:216,note:'3 ביצים'},
        {name:'טחינה מוכנה',amount:60,unit:'גרם',p:4,k:120,note:'לפי המוצר/מתכון'},
        {name:'לחם',amount:80,unit:'גרם',p:7,k:200,note:'לפי סוג הלחם'},
        {name:'סלט / ירקות',amount:200,unit:'גרם',p:3,k:60,note:'ללא רוטב'}
      ]},
      {id:'d3',name:'חומוס + ביצים + לחם + סלט',ingredients:[
        {name:'חומוס מוכן',amount:150,unit:'גרם',p:12,k:360,note:'לבדוק לפי האריזה/המקום'},
        {name:'ביצים גדולות',amount:2,unit:'יח׳',p:12.6,k:144,note:'2 ביצים'},
        {name:'לחם / פיתה',amount:80,unit:'גרם',p:7,k:210,note:'לפי הסוג'},
        {name:'סלט / ירקות',amount:200,unit:'גרם',p:3,k:60,note:'ללא רוטב'}
      ]},
      {id:'d4',name:'קוטג׳ + טחינה + לחם + ירקות',ingredients:[
        {name:'קוטג׳ / גבינה עשירה בחלבון',amount:250,unit:'גרם',p:30,k:250,note:'לפי המוצר'},
        {name:'טחינה מוכנה',amount:50,unit:'גרם',p:3.5,k:100,note:'לפי המוצר/מתכון'},
        {name:'לחם',amount:80,unit:'גרם',p:7,k:200,note:'לפי סוג הלחם'},
        {name:'ירקות',amount:200,unit:'גרם',p:3,k:60,note:'ללא רוטב'}
      ]}
    ]
  };

  function appendMissing(type){
    state.meals[type]=state.meals[type]||[];
    for(const meal of additions[type]){
      if(!state.meals[type].some(x=>x.id===meal.id)) state.meals[type].push(structuredClone(meal));
    }
  }
  appendMissing('lunch');
  appendMissing('dinner');
  save();

  function manualFoodTodaySection(){
    const items=log().manualMeals||[];
    if(!items.length) return '';
    const p=Math.round(items.reduce((s,m)=>s+(+m.p||0),0)*10)/10;
    const k=Math.round(items.reduce((s,m)=>s+(+m.k||0),0));
    return `<div class="section-title"><h2>מה הוספתי ידנית היום</h2></div>
      <section class="card">
        <div class="stack">${items.map(m=>`<div class="history-item"><strong>${esc(m.time||'')} ${m.time?'· ':''}${esc(m.name)}</strong><div class="muted small">${Math.round((+m.p||0)*10)/10} ג׳ חלבון · ${Math.round(+m.k||0)} קק״ל</div></div>`).join('')}</div>
        <hr><strong>סה״כ ידני: ${p} ג׳ חלבון · ${k} קק״ל</strong>
      </section>`;
  }

  const baseRenderTodayMealsExpanded=renderToday;
  renderToday=function(){
    return baseRenderTodayMealsExpanded()+manualFoodTodaySection();
  };
})();