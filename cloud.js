/* Maya GYM – optional cloud sync (Supabase, email magic-link). Falls back to local mode when not configured/offline. */
(function(){
  const C=window.GYM_CONFIG||{};
  const box=document.getElementById("cloudbox");
  const api={user:null,ready:false,push(){}};
  Cloud=api;window.Cloud=api;
  if(!C.url||!C.key||!localMode){return}
  let sb=null,timer=null,busy=false;
  const snap=()=>({d:DATA,h:L.get("gym:history",[])});
  function ui(){
    box.replaceChildren();
    if(api.user){
      box.append(el("button",{class:"cloud on","aria-label":"מחוברת לשמירה בענן – לחיצה להתנתקות",text:"☁️ נשמר בענן · "+(api.user.email||""),on:{click:async()=>{if(confirm("להתנתק מהענן? הנתונים יישארו גם בטלפון הזה.")){await sb.auth.signOut();api.user=null;ui()}}}}));
      $("#note").textContent="☁️ הכול נשמר בענן ומסתנכרן בין המכשירים";
    }else{
      box.append(el("button",{class:"cloud","aria-label":"התחברות עם אימייל לשמירה בענן",text:"☁️ שמירה בענן (כניסה עם אימייל)",on:{click:login}}));
    }
  }
  function login(){
    const em=el("input",{type:"email",placeholder:"האימייל שלך",autocomplete:"email",dir:"ltr"}),msg=el("div",{class:"mu"});
    const go=el("button",{class:"btn",text:"שלחי לי קישור כניסה",on:{click:async()=>{
      if(!/\S+@\S+\.\S+/.test(em.value)){msg.textContent="צריך אימייל תקין";return}
      go.disabled=true;msg.textContent="שולח…";
      const{error}=await sb.auth.signInWithOtp({email:em.value.trim(),options:{emailRedirectTo:location.origin+location.pathname}});
      if(error){msg.textContent="לא הצלחתי לשלוח ("+error.message+")";go.disabled=false}else msg.textContent="נשלח! פתחי את המייל ולחצי על הקישור – בטלפון הזה או בכל מכשיר אחר.";
    }}});
    ov(el("div",{class:"wk"},el("b",{text:"☁️ שמירה בענן"}),closeBtn(()=>ov())),
      el("p",{class:"mu",text:"כניסה עם אימייל שומרת את התרגילים, האימונים, הלוז וההיסטוריה בענן – כך שהם לא נמחקים ועובדים מכל מכשיר."}),em,go,msg);
  }
  async function pull(){
    const{data,error}=await sb.from("gym_state").select("data,updated_at").eq("user_id",api.user.id).maybeSingle();
    if(error)throw error;
    if(data&&data.data&&data.data.d){
      DATA=Object.assign({ex:[],wk:[],sch:[]},data.data.d);
      if(Array.isArray(data.data.h))L.set("gym:history",data.data.h);
      saveLocal();render();updFab();
    }else await doPush();
  }
  async function doPush(){
    if(!api.user)return;busy=true;
    const{error}=await sb.from("gym_state").upsert({user_id:api.user.id,data:snap(),updated_at:new Date().toISOString()});
    busy=false;
    if(error){setStatus("השמירה בענן נכשלה – השינויים שמורים בטלפון הזה.",false);return}
    setStatus("");toast("נשמר בענן ☁️");
  }
  api.push=()=>{if(!api.user)return;clearTimeout(timer);timer=setTimeout(doPush,600)};
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
