(() => {
 let allowed=false,version=0,selected=0,remaining=0;
 function paint(){const count=document.querySelector('#result-count'),more=document.querySelector('#load-more');if(count){count.hidden=!allowed;count.textContent=allowed?`${selected} BĐS phù hợp`:'';}if(more)more.textContent=allowed?`Xem thêm BĐS (${remaining} tin còn lại)`:'Xem thêm BĐS';}
 async function refresh(){const ticket=++version;allowed=false;paint();try{const r=await fetch('/api/catalog?view=listing-count-access',{cache:'no-store'}),data=await r.json();if(ticket!==version)return;allowed=r.ok&&data.canViewTotal===true;paint();}catch{/* Hide unless the server confirms the admin session. */}}
 window.RentalListingCounts={render(count,left){selected=count;remaining=left;paint();},refresh};
 window.addEventListener('focus',refresh);window.addEventListener('pageshow',event=>{if(event.persisted)refresh();});window.addEventListener('pagehide',()=>{version++;allowed=false;paint();});window.addEventListener('admin-session',refresh);refresh();
})();
