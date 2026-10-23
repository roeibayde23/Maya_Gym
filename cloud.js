/* Maya GYM – optional cloud sync (Supabase, email magic-link). Falls back to local mode when not configured/offline. */
(function(){
  const C=window.GYM_CONFIG||{};
  
  const api={user:null,ready:false,push(){},ui(){}};
  Cloud=api;window.Cloud=api;
  if(!C.url||!C.key||!localMode){return}
  let sb=null,timer=null,busy=false;
  const snap=()=>({d:DATA,h:L.get("gym:history",[]),n:L.get("gym:name","")});
  function ui(){
    const box=document.getElementById("cloudbox"),nt=document.getElementById("savenote");if(!box)return;
    box.replaceChildren();
    if(api.user){
      box.append(el("button",{class:"cloud on","aria-label":"מחוברת לשמירה בענן – לחיצה להתנתקות",text:"☁️ נשמר בענן · "+(api.user.email||""),on:{click:async()=>{if(confirm("להתנתק מהענן? הנתונים יישארו גם בטלפון הזה.")){await sb.auth.signOut();api.user=null;ui()}}}}));
      if(nt)nt.textContent="☁️ הכול נשמר בענן ומסתנכרן בין המכשירים";
    }else{
      box.append(el("button",{class:"cloud","aria-label":"התחברות עם אימייל לשמירה בענן",text:"☁️ שמירה בענן (כניסה עם אימייל)",on:{click:login}}));
    }
  }
  function login(){
    const em=el("input",{type:"email",placeholder:"האימייל שלך",autocomplete:"email",dir:"ltr"}),msg=el("div",{class:"mu"});
    const go=el("button",{class:"btn",text:"שלחי לי קוד כניסה",on:{click:async()=>{
      if(!/\S+@\S+\.\S+/.test(em.value)){msg.textContent="צריך אימייל תקין";return}
      go.disabled=true;msg.textContent="שולח…";
      const{error}=await sb.auth.signInWithOtp({email:em.value.trim(),options:{emailRedirectTo:location.origin+location.pathname}});
      if(error){msg.textContent="לא הצלחתי לשלוח ("+error.message+")";go.disabled=false;return}
      msg.textContent="נשלח! הקלידי כאן את הקוד מהמייל (או לחצי על הקישור שבו).";code.style.display="";vb.style.display="";code.focus();
    }}});
    const code=el("input",{inputmode:"numeric",autocomplete:"one-time-code",placeholder:"קוד מהמייל",dir:"ltr",style:"display:none;text-align:center;letter-spacing:.3em;font-size:22px"});
    const vb=el("button",{class:"btn",style:"display:none;width:100%",text:"כניסה",on:{click:async()=>{
      const t=code.value.replace(/\D/g,"");if(t.length<6){msg.textContent="צריך את הקוד מהמייל";return}
      vb.disabled=true;msg.textContent="בודק…";
      const{error}=await sb.auth.verifyOtp({email:em.value.trim(),token:t,type:"email"});
      if(error){msg.textContent="הקוד לא נכון או שפג תוקפו – נסי שוב";vb.disabled=false}else{msg.textContent="מחוברת ✓";setTimeout(()=>ov(),700)}
    }}});
    ov(el("div",{class:"wk"},el("b",{text:"☁️ שמירה בענן"}),closeBtn(()=>ov())),
      el("p",{class:"mu",text:"כניסה עם אימייל שומרת את התרגילים, האימונים, הלוז וההיסטוריה בענן – כך שהם לא נמחקים ועובדים מכל מכשיר."}),em,go,code,vb,msg);
  }
  async function pull(){
    const{data,error}=await sb.from("gym_state").select("data,updated_at").eq("user_id",api.user.id).maybeSingle();
    if(error)throw error;
    if(L.get("gym:dirty",false)){
      if(data&&data.data&&data.data.d){const c=data.data.d;["ex","wk","sch"].forEach(k=>{const ids=new Set((DATA[k]||[]).map(x=>x.id));(c[k]||[]).forEach(x=>{if(!ids.has(x.id))DATA[k].push(x)})});
        const lh=L.get("gym:history",[]),ts=new Set(lh.map(r=>r.t));(data.data.h||[]).forEach(r=>{if(!ts.has(r.t))lh.push(r)});lh.sort((a,b)=>b.t-a.t);L.set("gym:history",lh.slice(0,200));
        saveLocal();render();updFab();}
      await doPush();return}
    if(data&&data.data&&data.data.d){
      DATA=Object.assign({ex:[],wk:[],sch:[]},data.data.d);
      if(Array.isArray(data.data.h))L.set("gym:history",data.data.h);
      if(data.data.n)L.set("gym:name",data.data.n);
      saveLocal();render();updFab();
    }else await doPush();
  }
  async function doPush(){
    if(!api.user)return;busy=true;
    const{error}=await sb.from("gym_state").upsert({user_id:api.user.id,data:snap(),updated_at:new Date().toISOString()});
    busy=false;
    if(!error)L.set("gym:dirty",false);
    if(error){setStatus("השמירה בענן נכשלה – השינויים שמורים בטלפון הזה.",false);return}
    setStatus("");toast("נשמר בענן ☁️");
  }
  api.ui=ui;api.push=()=>{L.set("gym:dirty",true);if(!api.user)return;clearTimeout(timer);timer=setTimeout(doPush,250)};
  const flush=()=>{if(api.user&&L.get("gym:dirty",false)){clearTimeout(timer);doPush()}};
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flush()});
  window.addEventListener("pagehide",flush);
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  s.onload=async()=>{
    try{
      sb=supabase.createClient(C.url,C.key,{auth:{storageKey:"gym:auth",persistSession:true,detectSessionInUrl:true}});
      const{data:{session}}=await sb.auth.getSession();
      api.user=session?session.user:null;ui();
      if(api.user)await pull();
      sb.auth.onAuthStateChange(async(ev,ses)=>{const was=api.user&&api.user.id;api.user=ses?ses.user:null;ui();if(api.user&&api.user.id!==was)try{await pull()}catch(_){}});
      window.addEventListener("online",()=>api.push());
    }catch(_){ui()}
  };
  s.onerror=()=>{/* offline: stay local */};
  document.head.append(s);
})();
