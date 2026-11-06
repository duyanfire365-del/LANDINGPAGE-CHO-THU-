(() => {
 // A restored document must recheck its server session before showing dates.
 window.addEventListener('pagehide',()=>document.querySelectorAll('.news-reader time').forEach(n=>n.remove()));
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
})();
