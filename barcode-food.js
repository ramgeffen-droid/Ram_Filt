// Barcode food lookup using Open Food Facts.
(function(){
  let foundProduct=null;

  function barcodeSection(){
    return `<div class="section-title"><h2>סריקת מוצר</h2></div>
    <section class="card">
      <div class="muted" style="margin-bottom:10px">סרוק ברקוד או הקלד את המספר. Ram Fit ינסה להשלים שם, קלוריות וחלבון מ-Open Food Facts.</div>
      <div class="row">
        <button id="scanBarcode" class="btn">📷 סרוק ברקוד</button>
        <input id="barcodeInput" inputmode="numeric" placeholder="או הקלד ברקוד" style="flex:1">
        <button id="lookupBarcode" class="btn secondary">חפש</button>
      </div>
      <div id="barcodeReader" style="display:none;margin-top:12px"></div>
      <div id="productResult" style="margin-top:12px"></div>
    </section>`;
  }

  const oldRenderFoodBarcode=renderFood;
  renderFood=function(){return oldRenderFoodBarcode()+barcodeSection();};

  async function lookup(code){
    code=String(code||'').replace(/\D/g,'');
    if(!code)return alert('לא זוהה ברקוד');
    const box=$('#productResult'); if(box)box.innerHTML='<div class="muted">מחפש מוצר…</div>';
    try{
      const url=`https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(code)}?fields=code,product_name,brands,serving_size,serving_quantity,nutriments,image_front_small_url`;
      const res=await fetch(url);
      if(!res.ok)throw new Error('not found');
      const data=await res.json(), p=data.product;
      if(!p)throw new Error('not found');
      const n=p.nutriments||{};
      const kcal100=Number(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0);
      const protein100=Number(n.proteins_100g ?? n.proteins ?? 0);
      foundProduct={code,name:p.product_name||p.brands||`מוצר ${code}`,brands:p.brands||'',kcal100,protein100,serving:Number(p.serving_quantity||0),servingText:p.serving_size||'',image:p.image_front_small_url||''};
      renderProduct();
    }catch(e){
      foundProduct=null;
      if(box)box.innerHTML='<div class="empty">המוצר לא נמצא במאגר. אפשר עדיין להזין אותו ידנית למטה.</div>';
    }
  }

  function renderProduct(){
    const p=foundProduct, box=$('#productResult'); if(!p||!box)return;
    const defaultGrams=p.serving||100;
    box.innerHTML=`<div class="history-item">
      <div class="row" style="align-items:flex-start">${p.image?`<img src="${esc(p.image)}" alt="" style="width:64px;height:64px;object-fit:contain;border-radius:8px">`:''}<div><strong>${esc(p.name)}</strong><div class="muted small">${esc(p.brands)}${p.servingText?` · מנה: ${esc(p.servingText)}`:''}</div><div class="small">ל-100 גרם: ${Math.round(p.protein100*10)/10} ג׳ חלבון · ${Math.round(p.kcal100)} קק״ל</div></div></div>
      <div class="form-grid" style="margin-top:10px"><div><label>כמה אכלתי (גרם)</label><input id="productGrams" type="number" step="1" value="${defaultGrams}"></div><div><label>שעה</label><input id="productTime" type="time" value="${new Date().toTimeString().slice(0,5)}"></div></div>
      <div id="productCalculated" class="muted" style="margin-top:8px"></div>
      <button id="addScannedProduct" class="btn" style="margin-top:10px">הוסף למה שאכלתי היום</button>
      <div class="muted small" style="margin-top:8px">מקור: Open Food Facts. כדאי להשוות לתווית שעל האריזה אם הנתון נראה חריג.</div>
    </div>`;
    const update=()=>{const g=Number($('#productGrams')?.value||0);$('#productCalculated').textContent=`${Math.round(p.protein100*g/10)/10} ג׳ חלבון · ${Math.round(p.kcal100*g/100)} קק״ל`;};
    $('#productGrams').addEventListener('input',update);update();
    $('#addScannedProduct').onclick=()=>{
      const g=Number($('#productGrams').value||0); if(!g)return;
      log().manualMeals=log().manualMeals||[];
      log().manualMeals.push({name:`${p.name} — ${g} גרם`,time:$('#productTime').value,p:p.protein100*g/100,k:p.kcal100*g/100,barcode:p.code,source:'Open Food Facts'});
      save();render();
    };
  }

  async function startScanner(){
    const reader=$('#barcodeReader');
    if(!('BarcodeDetector' in window)){
      reader.style.display='block';
      reader.innerHTML='<div class="muted">הסריקה הישירה אינה נתמכת בדפדפן הזה. הקלד את המספר שמופיע מתחת לברקוד.</div>';
      return;
    }
    try{
      const formats=await BarcodeDetector.getSupportedFormats();
      const wanted=['ean_13','ean_8','upc_a','upc_e'].filter(x=>formats.includes(x));
      const detector=new BarcodeDetector({formats:wanted.length?wanted:formats});
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});
      reader.style.display='block';
      reader.innerHTML='<video id="barcodeVideo" autoplay playsinline style="width:100%;border-radius:12px"></video><div class="muted small">כוון את המצלמה לברקוד…</div>';
      const video=$('#barcodeVideo'); video.srcObject=stream;
      const timer=setInterval(async()=>{
        try{const codes=await detector.detect(video);if(codes.length){clearInterval(timer);stream.getTracks().forEach(t=>t.stop());const code=codes[0].rawValue;$('#barcodeInput').value=code;reader.style.display='none';lookup(code);}}catch{}
      },350);
      setTimeout(()=>{clearInterval(timer);stream.getTracks().forEach(t=>t.stop());},30000);
    }catch(e){reader.style.display='block';reader.innerHTML='<div class="muted">לא הצלחתי לפתוח את המצלמה. אפשר להקליד את הברקוד ידנית.</div>';}
  }

  const oldBindBarcode=bind;
  bind=function(r){
    oldBindBarcode(r);
    if(r!=='food')return;
    $('#lookupBarcode')?.addEventListener('click',()=>lookup($('#barcodeInput').value));
    $('#barcodeInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')lookup(e.target.value)});
    $('#scanBarcode')?.addEventListener('click',startScanner);
  };
})();