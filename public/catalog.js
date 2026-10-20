(() => {
 (window.RENTAL_CATALOG_PROMISE||fetch('/api/catalog',{cache:'no-store'}).then(r=>r.json())).then(data=>{if(Array.isArray(data.posts))window.dispatchEvent(new CustomEvent('catalog-ready',{detail:data.posts}))}).catch(()=>{});
})();
