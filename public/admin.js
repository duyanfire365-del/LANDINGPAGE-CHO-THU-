(() => {
 const $=s=>document.querySelector(s),esc=RentalSharing.escape;
 const publicRows=window.RENTAL_LISTINGS;
 let privateRows=[];
 function clear(){privateRows=[];window.RENTAL_LISTINGS=publicRows;library.clear();show('sources');$('#admin-workspace').hidden=true;$('#admin-login').hidden=false;window.dispatchEvent(new CustomEvent('admin-session',{detail:false}))}
 const library=RentalSourceLibrary.mount($('#admin-records'),{searchText:r=>`${r.code} ${(r.legacyCodes||[]).join(' ')} ${r.title} ${r.address} ${r.hashtags.join(' ')}`,summary:r=>`${r.areaText} · ${r.price} triệu/tháng`,detail:r=>`<h3>${esc(r.privateTitle)}</h3>${RentalInventory.controls(r.slug,{admin:true})}<button class="button outline small" type="button" data-source-open="${esc(r.slug)}">Quản lý nguồn / Map riêng</button><p class="admin-address"><strong>Địa chỉ riêng tư:</strong> ${esc(r.address)}</p><p class="admin-hashtags"><strong>Hashtag gốc:</strong> ${esc(r.hashtags.join(' '))}</p>${r.privateNotes?.length?`<details><summary>Ghi chú nguồn riêng tư</summary><ul>${r.privateNotes.map(note=>`<li>${esc(note)}</li>`).join('')}</ul></details>`:''}<a href="/bds/${esc(r.slug)}" target="_blank" rel="noopener noreferrer">Xem trang khách hàng</a>${RentalSharing.markup(r)}<details class="share-caption"><summary>Bài chia sẻ kèm hashtag (đã lược số nhà/ngõ/ngách)</summary><pre>${esc(RentalSharing.text(r))}</pre></details>`});
 let view='sources';
 function show(next){view=next;$('#private-library').hidden=next!=='sources';const management=$('#management'),inbox=$('#source-inbox');if(management)management.hidden=!['posts','tools'].includes(next);if(inbox)inbox.hidden=next!=='telegram';document.querySelectorAll('[data-admin-view]').forEach(b=>{if(b.dataset.adminView===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});if(next==='posts')document.querySelector('[data-manage="posts"]')?.click();if(next==='tools'&&document.querySelector('[data-manage="posts"][aria-selected="true"]'))document.querySelector('[data-manage="inquiries"]')?.click()}
 window.RentalAdminView={show,refresh:()=>show(view)};
 document.querySelector('.admin-sections').addEventListener('click',e=>{const b=e.target.closest('[data-admin-view]');if(b)show(b.dataset.adminView)});
 async function load(){
  try{
   const response=await fetch('/api/admin',{cache:'no-store',credentials:'same-origin'}),data=await response.json();
   if(!response.ok){clear();$('#admin-status').textContent=response.status===401?'Vui lòng đăng nhập để xem thông tin riêng tư.':data.error;return}
   privateRows=data.listings.map(r=>{const safe=publicRows.find(p=>p.id===r.id);return {...r,privateTitle:r.title,title:safe.title,shareText:safe.shareText+'\n\n'+r.hashtags.join(' ')}});
   window.RENTAL_LISTINGS=privateRows;$('#admin-login').hidden=true;$('#admin-workspace').hidden=false;$('#admin-status').textContent='Đã đăng nhập. Phiên quản trị có thời hạn 8 giờ.';library.set(privateRows);window.dispatchEvent(new CustomEvent('admin-session',{detail:true}));
  }catch{clear();$('#admin-status').textContent='Chưa kết nối được trang quản trị. Anh vui lòng thử lại.'}
 }
 $('#admin-login').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.submitter;button.disabled=true;
  try{
   const password=$('#admin-password').value;$('#admin-password').value='';
   const response=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',password})}),data=await response.json();
   if(!response.ok){$('#admin-status').textContent=data.error;return}await load();
  }catch{$('#admin-status').textContent='Chưa đăng nhập được. Anh vui lòng thử lại.'}finally{button.disabled=false}
 });
 $('#admin-logout').addEventListener('click',async()=>{
  try{const response=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});if(!response.ok)throw Error();clear();$('#admin-status').textContent='Đã đăng xuất.'}
  catch{clear();$('#admin-status').textContent='Đã xóa thông tin khỏi màn hình. Chưa xác nhận kết thúc phiên trên máy chủ; anh vui lòng tải lại và đăng xuất.'}
 });
 window.addEventListener('pagehide',clear);
 window.addEventListener('pageshow',event=>{if(event.persisted)load()});
 load();
})();
