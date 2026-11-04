(() => {
 if(window.__rentalTrafficLoaded)return;window.__rentalTrafficLoaded=true;
 if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
 const allowed=()=>['/','/index.html','/tin','/tin.html'].includes(location.pathname)||/^\/bds\/(?:hn-\d{3}|live-\d{10,20})(?:\/|\/index\.html)?$/.test(location.pathname);if(!allowed())return;
 const validId=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v),id=()=>crypto.randomUUID(),key='rental-traffic-v1';let sent=false,lastSent=0,memory=null;
 function state(){let old;try{old=JSON.parse(localStorage.getItem(key)||'null')}catch{old=memory}const now=Date.now();let ref='';try{const u=new URL(document.referrer);if(u.origin!==location.origin)ref=u.hostname}catch{}const utm=new URLSearchParams(location.search).get('utm_source')||'';const fresh=!old||!validId(old.visitor)||now-old.created>366*86400000;
  if(fresh)old={visitor:id(),created:now};if(!validId(old.session)||!Number.isFinite(old.last)||now-old.last>30*60000||now<old.last){old.session=id();old.utm=utm.slice(0,80);old.ref=ref.slice(0,120)}old.last=now;memory=old;try{localStorage.setItem(key,JSON.stringify(old))}catch{}return old;
 }
 function send(){if(sent||document.visibilityState==='hidden')return;sent=true;lastSent=Date.now();try{const s=state(),slug=new URLSearchParams(location.search).get('slug'),page=['/tin','/tin.html'].includes(location.pathname)?'/tin?slug='+encodeURIComponent(slug||''):location.pathname;fetch('/api/catalog?view=visit',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:id(),visitorId:s.visitor,sessionId:s.session,page,utmSource:s.utm||'',referrerHost:s.ref||''}),keepalive:true}).catch(()=>{})}catch{/* Analytics must never block the website. */}}
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-lastSent>30*60000)sent=false;send()});window.addEventListener('pageshow',e=>{if(e.persisted){sent=false;send()}});send();
})();
