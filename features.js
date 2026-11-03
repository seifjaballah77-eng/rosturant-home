/* Matbakhi feature layer — preserves existing recipe and user-storage keys. */
(()=>{
 "use strict";
 const $=s=>document.querySelector(s),$=s=>[...document.querySelectorAll(s)];
 if(!localStorage.getItem("matbakhi-theme")){document.body.classList.add("light");localStorage.setItem("matbakhi-theme","light")};
 const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){if(typeof toast==="function")toast("مساحة التخزين ممتلئة؛ تعذر حفظ هذا التغيير")}};
 const labels={ar:{home:"الرئيسية",discover:"اكتشف الوصفات",smart:"ماذا أطبخ اليوم؟",shopping:"قائمة المشتريات",saved:"وصفاتي المحفوظة",planner:"مخطط الوجبات",title:"وصفات تستحق التجربة",search:"ابحث باسم الطبق أو المكوّن أو البلد…",suggest:"اقترح وصفات مناسبة"},fr:{home:"Accueil",discover:"Découvrir",smart:"Que cuisiner ?",shopping:"Liste de courses",saved:"Favoris",planner:"Planificateur",title:"Recettes à découvrir",search:"Chercher un plat ou ingrédient…",suggest:"Trouver des recettes"},en:{home:"Home",discover:"Discover recipes",smart:"What should I cook?",shopping:"Shopping list",saved:"Saved recipes",planner:"Meal planner",title:"Recipes to try",search:"Search dish or ingredient…",suggest:"Suggest recipes"},es:{home:"Inicio",discover:"Descubrir recetas",smart:"¿Qué cocino hoy?",shopping:"Lista de compras",saved:"Favoritos",planner:"Plan semanal",title:"Recetas para probar",search:"Buscar plato o ingrediente…",suggest:"Sugerir recetas"},it:{home:"Home",discover:"Scopri ricette",smart:"Cosa cucino oggi?",shopping:"Lista della spesa",saved:"Preferiti",planner:"Piano pasti",title:"Ricette da provare",search:"Cerca piatto o ingrediente…",suggest:"Suggerisci ricette"}};
 let currentLang=localStorage.getItem("matbakhi-language")||"ar";
 const originalRender=window.render,originalOpen=window.openRecipe,originalShow=window.showView;
 let quickFilter="all",cookIndex=0,cookRecipe=null;
 function applyLanguage(){
  const t=labels[currentLang]||labels.ar;
  document.documentElement.lang=currentLang;document.documentElement.dir=currentLang==="ar"?"rtl":"ltr";
  const side={home:"home",discover:"discover",smart:"smart",shopping:"shopping",saved:"saved",planner:"planner"};
  qa(".side-link").forEach(b=>{const k=side[b.dataset.view];if(k){const span=b.querySelectorAll("span");if(span[1])span[1].textContent=t[k]}});
  q1("#searchInput").placeholder=t.search;q1("#smartSuggest").textContent=t.suggest;
  if(q1("#sectionTitle"))q1("#sectionTitle").textContent=t.title;
  q1("#langBtn").textContent=currentLang.toUpperCase();
  write("matbakhi-language",currentLang);
 }
 function matchIngredients(r){
  const wanted=(ingredients||[]).map(x=>x.toLocaleLowerCase());
  if(!wanted.length)return 0;
  const list=(r.ingredients||[]).map(x=>(typeof x==="string"?x:x.name||"").toLocaleLowerCase());
  let hits=0;wanted.forEach(w=>{if(list.some(v=>v.includes(w)||w.includes(v)))hits++});
  return hits/wanted.length;
 }
 function isHealthy(r){const s=(r.name+" "+r.desc+" "+(r.ingredients||[]).map(x=>typeof x==="string"?x:x.name).join(" ")).toLowerCase();return /سلطة|شوربة|خضار|عدس|حمص|سمك|مشوي|steamed|salad|vegetable|lentil|fish/.test(s)&&!/مقلي|fried|كر[ييم]|كريمة|سكر/.test(s)}
 function isCheap(r){const s=(r.name+" "+r.desc+" "+(r.ingredients||[]).map(x=>typeof x==="string"?x:x.name).join(" ")).toLowerCase();return !/سلمون|جمبري|روبيان|صنوبر|زعفران|لوز|ماسكاربوني|سلمون|steak/.test(s)}
 window.render=function(list){
  let source=Array.isArray(list)?list.slice():recipes.slice();
  if(quickFilter==="fast")source=source.filter(r=>(r.totalTime??r.time??999)<=30);
  if(quickFilter==="cheap")source=source.filter(isCheap);
  if(quickFilter==="healthy")source=source.filter(isHealthy);
  if(!Array.isArray(list)&&quickFilter==="all")source=recipes;
  originalRender(source);
  const ratings=read("matbakhi-ratings-v1",{});
  qa(".recipe-card[data-id]").forEach(card=>{
   const r=recipes.find(x=>x.id===Number(card.dataset.id));if(!r)return;
   const info=card.querySelector(".recipe-info");if(!info)return;
   const badges=document.createElement("div");badges.className="feature-badges";
   const tags=[];if((r.totalTime??r.time??999)<=30)tags.push(["سريع",""]);if(isCheap(r))tags.push(["اقتصادي",""]);if(isHealthy(r))tags.push(["خفيف",""]);
   if(r.category==="sweet")tags.push(["حلو","warm"]);if(r.category==="hot")tags.push(["حار","warm"]);
   badges.innerHTML=tags.slice(0,3).map(x=>'<span class="feature-badge '+x[1]+'">'+x[0]+'</span>').join("");
   const rating=ratings[r.id];if(rating)badges.innerHTML+='<span class="feature-badge warm">★ '+rating.avg.toFixed(1)+'</span>';
   info.insertBefore(badges,info.firstChild);
  });
 };
 function addFeaturePanel(r){
  const detail=q1("#detailView .detail-card");if(!detail||!r)return;
  const panel=document.createElement("section");panel.className="recipe-tools";
  const servings=Number(r.servings)||4;
  panel.innerHTML='<div class="tool-heading"><b>أدوات الوصفة</b><span>خصص التجربة حسب حاجتك</span></div><div class="tool-row"><label>عدد الحصص <input id="servingCount" type="number" min="1" max="40" value="'+servings+'"></label><button class="action-btn" id="cookModeBtn">ابدأ وضع الطبخ خطوة بخطوة</button><button class="action-btn" id="videoSearchBtn">ابحث عن فيديو التحضير</button><button class="action-btn" id="offlineSaveBtn">احفظ الوصفة دون اتصال</button></div><div id="scaledIngredients" class="scaled-ingredients"></div><div class="rating-box"><b>قيّم الوصفة</b><div id="ratingStars" class="rating-stars">'+[1,2,3,4,5].map(n=>'<button type="button" data-rate="'+n+'" aria-label="'+n+' نجوم">☆</button>').join("")+'</div><textarea id="recipeComment" rows="2" placeholder="ملاحظتك لهذه الوصفة (تحفظ على جهازك)"></textarea><button class="action-btn" id="saveCommentBtn">حفظ التقييم والملاحظة</button><small id="ratingSummary"></small></div>';
  const target=detail.querySelector(".detail-actions");if(target)target.after(panel);else detail.appendChild(panel);
  const amountText=x=>{const raw=String(x.amount||"حسب الحاجة"),m=raw.match(/^\s*(\d+(?:[.,]\d+)?)(.*)$/);if(!m)return raw;const factor=(Number(q1("#servingCount").value)||servings)/servings;const n=Number(m[1].replace(",","."))*factor;return (Number.isInteger(n)?n:Number(n.toFixed(2)))+m[2]};
  const drawScaled=()=>{q1("#scaledIngredients").innerHTML='<b>المقادير بعد تعديل الحصص</b><div class="scaled-grid">'+(r.ingredients||[]).map(x=>{x=typeof x==="string"?{name:x,amount:"حسب الحاجة"}:x;return '<span>'+x.name+' <strong>'+amountText(x)+'</strong></span>'}).join("")+'</div>'};
  q1("#servingCount").addEventListener("input",drawScaled);drawScaled();
  q1("#cookModeBtn").onclick=()=>startCookMode(r);
  q1("#videoSearchBtn").onclick=()=>{const q=encodeURIComponent((r.name||"")+" طريقة التحضير");window.open("https://www.youtube.com/results?search_query="+q,"_blank","noopener");toast("فتحنا نتائج فيديو التحضير على YouTube")};
  q1("#offlineSaveBtn").onclick=()=>{const packs=read("matbakhi-offline-recipes-v1",[]);if(!packs.includes(r.id))packs.push(r.id);write("matbakhi-offline-recipes-v1",packs);toast("حُفظت بيانات الوصفة على هذا الجهاز. الصور تحتاج اتصالاً أول مرة.")};
  const old=read("matbakhi-ratings-v1",{}),entry=old[r.id]||{avg:0,count:0,comment:""};let selected=0;
  q1("#ratingSummary").textContent=entry.count?"متوسط "+entry.avg.toFixed(1)+" من 5 · "+entry.count+" تقييم":"لا توجد تقييمات بعد على هذا الجهاز";
  q1("#recipeComment").value=entry.comment||"";
  qa("#ratingStars button").forEach(b=>b.onclick=()=>{selected=Number(b.dataset.rate);qa("#ratingStars button").forEach(x=>x.textContent=Number(x.dataset.rate)<=selected?"★":"☆")});
  q1("#saveCommentBtn").onclick=()=>{if(!selected&&!q1("#recipeComment").value.trim()){toast("اختر تقييماً أو اكتب ملاحظة أولاً");return}const prev=read("matbakhi-ratings-v1",{}),oldEntry=prev[r.id]||{avg:0,count:0};if(selected){oldEntry.avg=Number(((oldEntry.avg*oldEntry.count+selected)/(oldEntry.count+1)).toFixed(1));oldEntry.count++}oldEntry.comment=q1("#recipeComment").value.trim();prev[r.id]=oldEntry;write("matbakhi-ratings-v1",prev);toast("حُفظ تقييمك على هذا الجهاز");q1("#ratingSummary").textContent="متوسط "+oldEntry.avg.toFixed(1)+" من 5 · "+oldEntry.count+" تقييم";};
 }
 function startCookMode(r){
  cookRecipe=r;cookIndex=0;const steps=r.steps||[];if(!steps.length){toast("لا توجد خطوات مسجلة لهذه الوصفة بعد");return}
  let modal=q1("#cookMode");if(!modal){modal=document.createElement("div");modal.id="cookMode";modal.className="cook-overlay";document.body.appendChild(modal)}
  function paint(){modal.innerHTML='<div class="cook-sheet"><button id="cookClose" class="cook-close">×</button><span class="eyebrow">وضع الطبخ · '+(cookIndex+1)+' / '+steps.length+'</span><div class="cook-progress"><i style="width:'+((cookIndex+1)/steps.length*100)+'%"></i></div><h2>'+r.name+'</h2><p class="cook-step">'+steps[cookIndex]+'</p><div class="cook-controls"><button id="cookSpeak" class="action-btn">🔊 استمع للخطوة</button><button id="cookPrev" class="action-btn" '+(cookIndex===0?"disabled":"")+'>السابق</button><button id="cookNext" class="primary-btn">'+(cookIndex===steps.length-1?"إنهاء":"الخطوة التالية")+'</button></div><p class="cook-tip">ضع الجهاز في مكان آمن واتبع الخطوات بالترتيب.</p></div>';
   q1("#cookClose").onclick=()=>modal.classList.remove("show");q1("#cookSpeak").onclick=()=>{if("speechSynthesis"in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(steps[cookIndex]);u.lang=currentLang==="ar"?"ar":currentLang+"-"+currentLang.toUpperCase();speechSynthesis.speak(u)}else toast("القراءة الصوتية غير مدعومة في هذا المتصفح")};q1("#cookPrev").onclick=()=>{cookIndex=Math.max(0,cookIndex-1);paint()};q1("#cookNext").onclick=()=>{if(cookIndex===steps.length-1){modal.classList.remove("show");toast("أحسنت! انتهيت من خطوات الوصفة.");return}cookIndex++;paint()}}
  paint();modal.classList.add("show");
 }
 const oldShow=originalShow;
 window.showView=function(view){
  if(view==="smart"){
   q1("#detailView").classList.add("hidden");q1("#secondaryView").classList.add("hidden");q1("#recipeGrid").classList.remove("hidden");q1("#sectionTitle").textContent="وصفات تناسب مكوناتك";
   const terms=(ingredients||[]);let list=recipes.map(r=>({r,score:matchIngredients(r)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.r);
   if(!terms.length){q1("#sectionTitle").textContent="أضف مكوناتك أولاً لنقترح وصفات";list=recipes.slice(0,12)}
   window.render(list);qa(".side-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));q1("#sidebar").classList.remove("open");return;
  }
  if(view==="planner"){
   q1("#detailView").classList.add("hidden");q1("#recipeGrid").classList.add("hidden");q1("#secondaryView").classList.remove("hidden");qa(".side-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));q1("#sidebar").classList.remove("open");
   const plan=read("matbakhi-week-plan-v1",{}),days=["السبت","الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];
   q1("#sectionTitle").textContent="مخطط وجبات الأسبوع";
   q1("#secondaryView").innerHTML='<div class="detail-card"><h2>خطّط أسبوعك</h2><p>اختر وصفة لكل يوم. تُحفظ الخطة محلياً على هذا الجهاز.</p><div class="plan-grid">'+days.map((d,i)=>'<label>'+d+'<select data-day="'+i+'"><option value="">بدون وصفة</option>'+recipes.map(r=>'<option value="'+r.id+'" '+(String(plan[i])===String(r.id)?"selected":"")+'>'+r.name.replace(/</g,"&lt;")+'</option>').join("")+'</select></label>').join("")+'</div><button class="primary-btn" id="saveWeekPlan">حفظ خطة الأسبوع</button></div>';
   q1("#saveWeekPlan").onclick=()=>{const next={};qa("[data-day]").forEach(x=>{if(x.value)next[x.dataset.day]=Number(x.value)});write("matbakhi-week-plan-v1",next);toast("تم حفظ مخطط وجباتك")};return;
  }
  oldShow(view);
 };
 window.openRecipe=function(id){originalOpen(id);const r=recipes.find(x=>x.id===id);if(r)addFeaturePanel(r)};
 q1("#smartSuggest").onclick=()=>window.showView("smart");
 q1("#searchBtn").onclick=()=>{quickFilter="all";const q=q1("#searchInput").value.trim().toLowerCase();const terms=[q,...(ingredients||[])].filter(Boolean);const list=recipes.map(r=>({r,score:matchIngredients(r)})).filter(({r,score})=>!terms.length||(r.name+" "+r.desc+" "+r.country+" "+(r.ingredients||[]).map(x=>typeof x==="string"?x:x.name).join(" ")).toLowerCase().includes(q)||score>0).sort((a,b)=>b.score-a.score).map(x=>x.r);q1("#sectionTitle").textContent="نتائج البحث والوصفات المناسبة";window.render(list);q1("#detailView").classList.add("hidden")};
 qa(".mini-filter").forEach(b=>b.onclick=()=>{quickFilter=b.dataset.quick===quickFilter?"all":b.dataset.quick;qa(".mini-filter").forEach(x=>x.classList.toggle("active",x===b&&quickFilter!=="all"));window.render();q1("#sectionTitle").textContent=quickFilter==="fast"?"وصفات سريعة":quickFilter==="cheap"?"وصفات اقتصادية":quickFilter==="healthy"?"وصفات خفيفة ومتوازنة":"كل الوصفات"});
 q1("#clearFilters").addEventListener("click",()=>{quickFilter="all";qa(".mini-filter").forEach(x=>x.classList.remove("active"))});
 q1("#ingredientPhoto").addEventListener("change",e=>{const file=e.target.files&&e.target.files[0];if(!file)return;const url=URL.createObjectURL(file);q1("#photoAssist").classList.remove("hidden");q1("#photoAssist").innerHTML='<b>صورة المكونات جاهزة</b><p>هذه النسخة لا تتعرف آلياً على الطعام من الصورة بعد. أضف أسماء ما يظهر في الصورة في خانة المكونات أعلاه للحصول على اقتراحات دقيقة.</p><img alt="معاينة الصورة المختارة" src="'+url+'">';});
 q1("#langBtn").onclick=()=>{const order=["ar","fr","en","es","it"];currentLang=order[(order.indexOf(currentLang)+1)%order.length];applyLanguage();toast("تغيرت لغة عناصر الواجهة. ترجمة نصوص الوصفات نفسها ما زالت تحتاج خدمة ترجمة.")};
 const oldToast=window.toast;
 window.toast=function(message){if(oldToast)oldToast(message)};
 const originalTimerStart=q1("#startTimer"); // timer controls are re-created for each recipe
 const originalOpenRecipe=window.openRecipe;
 // Wrap each timer after original detail renderer has created its controls.
 const enhanceTimer=()=>{const start=q1("#startTimer"),stop=q1("#stopTimer"),display=q1("#timerDisplay");if(!start||!display)return;let seconds=300,interval=null;const update=()=>display.textContent=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");const alarm=()=>{try{const C=window.AudioContext||window.webkitAudioContext;if(C){const ctx=new C();[0,.35,.7].forEach(t=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=880;gain.gain.value=.14;osc.connect(gain);gain.connect(ctx.destination);osc.start(ctx.currentTime+t);osc.stop(ctx.currentTime+t+.22)});setTimeout(()=>ctx.close(),1500)}}catch(_){}if(navigator.vibrate)navigator.vibrate([300,150,300,150,500]);if("Notification"in window&&Notification.permission==="granted")new Notification("مطبخي",{body:"انتهى وقت الطهي!"})};
  start.onclick=()=>{clearInterval(interval);interval=setInterval(()=>{seconds=Math.max(0,seconds-1);update();if(seconds===0){clearInterval(interval);toast("انتهى وقت المؤقت!");alarm()}},1000);toast("بدأ المؤقت")};
  stop.onclick=()=>{clearInterval(interval);toast("تم إيقاف المؤقت")};
  qa(".step-timer").forEach(b=>b.onclick=()=>{seconds=Number(b.dataset.min||5)*60;update();toast("تم ضبط المؤقت")});
  };
 const originalRecipeOpen=window.openRecipe;
 window.openRecipe=function(id){originalRecipeOpen(id);enhanceTimer()};
 applyLanguage();
 if("serviceWorker"in navigator){navigator.serviceWorker.ready.then(reg=>reg.update().catch(()=>{})).catch(()=>{})}
})();