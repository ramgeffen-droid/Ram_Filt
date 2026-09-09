// Barcode food lookup using Open Food Facts, with persistent autofill library.
(function(){
  let foundProduct=null;
  state.savedBarcodeFoods=state.savedBarcodeFoods||{};
  save();

  function savedFoods(){return Object.values(state.savedBarcodeFoods||{}).sort((a,b)=>(b.lastUsed||'').localeCompare(a.lastUsed||''));}
  function barcodeSection(){
    const foods=savedFoods();
    return `<div class="section-title"><h2>סריקת מוצר</h2></div><section class="card">
      <div class="muted" style="margin-bottom:10px">סרוק ברקוד או הקלד את המספר. כל מוצר שתוסיף נשמר אוטומטית לשימוש חוזר.</div>
      ${foods.length?`<div style="margin-bottom:12px"><label>מוצרים שמורים</label><select id="savedBarcodeFood"><option value="">בחר מוצר…</option>${foods.map(p=>`<option value="${esc(p.code)}">${esc(p.name)}</option>`).join('')}</select><div class="muted small" style="margin-top:5px">בחירה כאן ממלאת אוטומטית את המוצר והכמות האחרונה.</div></div>`:''}
      <div class="row"><button id="scanBarcode" class="btn">📷 סרוק ברקוד</button><input id="barcodeInput" inputmode="numeric" placeholder="או הקלד ברקוד" style="flex:1"><button id="lookupBarcode" class="btn secondary">חפש</button></div>
      <div id="barcodeReader" style="display:none;margin-top:12px"></div><div id="productResult" style="margin-top:12px"></div>
    </section>`;
  }
  const oldRenderFoodBarcode=renderFood; renderFood=function(){return oldRenderFoodBarcode()+barcodeSection();};

  async function lookup(code){
    code=String(code||'').replace(/\D/g,''); if(!code)return alert('לא זוהה ברקוד');
    const saved=state.savedBarcodeFoods?.[code]; if(saved){foundProduct={...saved};renderProduct(saved);return;}
    const box=$('#productResult'); if(box)box.innerHTML='<div class="muted">מחפש מוצר…</div>';
    try{
      const url=`https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(code)}?fields=code,product_name,brands,serving_size,serving_quantity,nutriments,image_front_small_url`;
      const res=await fetch(url); if(!res.ok)throw new Error('not found'); const data=await res.json(),p=data.product;if(!p)throw new Error('not found');
      const n=p.nutriments||{}; foundProduct={code,name:p.product_name||p.brands||`מוצר ${code}`,brands:p.brands||'',kcal100:Number(n['energy-kcal_100g']??n['energy-kcal']??0),protein100:Number(n.proteins_100g??n.proteins??0),serving:Number(p.serving_quantity||0),servingText:p.serving_size||'',image:p.image_front_small_url||''};renderProduct();
    }catch(e){foundProduct=null;if(box)box.innerHTML='<div class="empty">המוצר לא נמצא במאגר. אפשר עדיין להזין אותו ידנית למטה.</div>';}
  }

  function renderProduct(prefill={}){
    const p=foundProduct,box=$('#productResult');if(!p||!box)return;
    const defaultUnitWeight=Number(prefill.lastUnitWeight||p.lastUnitWeight||p.serving||0),defaultMode=prefill.lastMode||p.lastMode||(defaultUnitWeight?'units':'grams'),defaultUnits=Number(prefill.lastUnits||p.lastUnits||1),defaultGrams=Number(prefill.lastGrams||p.lastGrams||100);
    box.innerHTML=`<div class="history-item"><div class="row" style="align-items:flex-start">${p.image?`<img src="${esc(p.image)}" alt="" style="width:64px;height:64px;object-fit:contain;border-radius:8px">`:''}<div><strong>${esc(p.name)}</strong><div class="muted small">${esc(p.brands)}${p.servingText?` · מנה: ${esc(p.servingText)}`:''}</div><div class="small">ל-100 גרם: ${Math.round(p.protein100*10)/10} ג׳ חלבון · ${Math.round(p.kcal100)} קק״ל</div></div></div>
    <div style="margin-top:12px"><label>איך להזין?</label><select id="productMode"><option value="units" ${defaultMode==='units'?'selected':''}>יחידות / מנות</option><option value="grams" ${defaultMode==='grams'?'selected':''}>גרמים</option></select></div>
    <div id="unitsBlock" style="margin-top:10px;${defaultMode==='units'?'':'display:none'}"><div class="form-grid"><div><label>כמה יחידות אכלתי?</label><input id="productUnits" type="number" step="0.1" value="${defaultUnits}"></div><div><label>משקל ליחידה (גרם)</label><input id="unitWeight" type="number" step="0.1" value="${defaultUnitWeight||''}" placeholder="למשל 14.2"></div></div></div>
    <div id="gramsBlock" style="margin-top:10px;${defaultMode==='grams'?'':'display:none'}"><div><label>כמה אכלתי (גרם)</label><input id="productGrams" type="number" step="1" value="${defaultGrams}"></div></div>
    <div style="margin-top:10px"><label>שעה</label><input id="productTime" type="time" value="${new Date().toTimeString().slice(0,5)}"></div><div id="productCalculated" class="muted" style="margin-top:8px"></div><button id="addScannedProduct" class="btn" style="margin-top:10px">הוסף למה שאכלתי היום</button><div class="muted small" style="margin-top:8px">המוצר והכמות האחרונה יישמרו אוטומטית לפעם הבאה.</div></div>`;
    function calc(){const mode=$('#productMode').value;let grams=0,label='';if(mode==='units'){const units=Number($('#productUnits').value||0),uw=Number($('#unitWeight').value||0);grams=units*uw;label=`${units} יח׳ × ${uw||0} ג׳ = ${Math.round(grams*10)/10} ג׳`;}else{grams=Number($('#productGrams').value||0);label=`${Math.round(grams*10)/10} ג׳`;}const protein=p.protein100*grams/100,kcal=p.kcal100*grams/100;$('#productCalculated').textContent=`${label} · ${Math.round(protein*10)/10} ג׳ חלבון · ${Math.round(kcal)} קק״ל`;return{grams,protein,kcal,mode};}
    $('#productMode').addEventListener('change',()=>{const u=$('#productMode').value==='units';$('#unitsBlock').style.display=u?'block':'none';$('#gramsBlock').style.display=u?'none':'block';calc();});['productUnits','unitWeight','productGrams'].forEach(id=>$('#'+id)?.addEventListener('input',calc));calc();
    $('#addScannedProduct').onclick=()=>{const c=calc();if(!c.grams)return alert('צריך להזין כמות');const units=Number($('#productUnits')?.value||0),uw=Number($('#unitWeight')?.value||0),amountText=c.mode==='units'?`${units} יח׳ (${Math.round(c.grams*10)/10} גרם)`:`${Math.round(c.grams*10)/10} גרם`;log().manualMeals=log().manualMeals||[];log().manualMeals.push({name:`${p.name} — ${amountText}`,time:$('#productTime').value,p:c.protein,k:c.kcal,barcode:p.code,source:'Open Food Facts',quantityMode:c.mode,units:c.mode==='units'?units:null,unitWeight:c.mode==='units'?uw:null,grams:c.grams});state.savedBarcodeFoods[p.code]={...p,lastMode:c.mode,lastUnits:c.mode==='units'?units:null,lastUnitWeight:c.mode==='units'?uw:null,lastGrams:c.grams,lastUsed:new Date().toISOString()};save();render();};
  }
  async function startScanner(){const reader=$('#barcodeReader');if(!('BarcodeDetector'in window)){reader.style.display='block';reader.innerHTML='<div class="muted">הסריקה הישירה אינה נתמכת בדפדפן הזה. הקלד את המספר שמופיע מתחת לברקוד.</div>';return;}try{const formats=await BarcodeDetector.getSupportedFormats(),wanted=['ean_13','ean_8','upc_a','upc_e'].filter(x=>formats.includes(x)),detector=new BarcodeDetector({formats:wanted.length?wanted:formats}),stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});reader.style.display='block';reader.innerHTML='<video id="barcodeVideo" autoplay playsinline style="width:100%;border-radius:12px"></video><div class="muted small">כוון את המצלמה לברקוד…</div>';const video=$('#barcodeVideo');video.srcObject=stream;const timer=setInterval(async()=>{try{const codes=await detector.detect(video);if(codes.length){clearInterval(timer);stream.getTracks().forEach(t=>t.stop());const code=codes[0].rawValue;$('#barcodeInput').value=code;reader.style.display='none';lookup(code);}}catch{}},350);setTimeout(()=>{clearInterval(timer);stream.getTracks().forEach(t=>t.stop());},30000);}catch(e){reader.style.display='block';reader.innerHTML='<div class="muted">לא הצלחתי לפתוח את המצלמה. אפשר להקליד את הברקוד ידנית.</div>';}}
  const oldBindBarcode=bind;bind=function(r){oldBindBarcode(r);if(r!=='food')return;$('#lookupBarcode')?.addEventListener('click',()=>lookup($('#barcodeInput').value));$('#barcodeInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')lookup(e.target.value)});$('#scanBarcode')?.addEventListener('click',startScanner);$('#savedBarcodeFood')?.addEventListener('change',e=>{const p=state.savedBarcodeFoods?.[e.target.value];if(p){foundProduct={...p};renderProduct(p);}});};
})();