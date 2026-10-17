(() => {
 fetch('/api/catalog',{cache:'no-store'}).then(async response=>{if(!response.ok)return;const data=await response.json();if(Array.isArray(data.posts))window.dispatchEvent(new CustomEvent('catalog-ready',{detail:data.posts}))}).catch(()=>{});
})();
