const V="maya-gym-v7",CORE=["./","index.html","config.js","cloud.js","manifest.webmanifest","icons/favicon.svg","icons/icon-192.png","icons/apple-touch-icon.png"],EX=["ex/ab-crunch.gif","ex/abduction.gif","ex/back-ext.gif","ex/bb-curl.gif","ex/bench-press.gif","ex/cable-curl.gif","ex/cable-pullover.gif","ex/calf-raise.gif","ex/chest-press.gif","ex/dip-machine.gif","ex/front-raise.gif","ex/hammer-curl.gif","ex/hanging-raise.gif","ex/hip-thrust.gif","ex/incline-db.gif","ex/kickback.gif","ex/lat-pulldown.gif","ex/lateral-raise.gif","ex/leg-curl.gif","ex/leg-ext.gif","ex/leg-press.gif","ex/machine-row.gif","ex/overhead-ext.gif","ex/pec-deck.gif","ex/plank.gif","ex/pushdown.gif","ex/rear-delt.gif","ex/seated-row.gif","ex/shoulder-press.gif","ex/smith-squat.gif"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE).then(()=>c.addAll(EX).catch(()=>{}))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=="GET"||u.hostname.endsWith("supabase.co"))return;
  if(r.mode==="navigate"||u.origin===location.origin&&/\.(html|js|webmanifest)$/.test(u.pathname)){
    e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res}).catch(()=>caches.match(r).then(m=>m||caches.match("index.html"))));return}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==="opaque"){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res})));
});
