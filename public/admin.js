(() => {
 const $=s=>document.querySelector(s),esc=RentalSharing.escape;
 const publicRows=window.RENTAL_LISTINGS;
 let privateRows=[];
 function clear(){privateRows=[];window.RENTAL_LISTINGS=publicRows;$('#admin-records').replaceChildren();$('#admin-query').value='';$('#admin-count').textContent='';$('#admin-workspace').hidden=true;$('#admin-login').hidden=false;window.dispatchEvent(new CustomEvent('admin-session',{detail:false}))}
 function render(){
  const query=$('#admin-query').value.trim().toLocaleLowerCase('vi');
  const rows=privateRows.filter(r=>`${r.code} ${(r.legacyCodes||[]).join(' ')} ${r.title} ${r.address}`.toLocaleLowerCase('vi').includes(query)||[r.code,...(r.legacyCodes||[])].some(code=>String(code).toLocaleLowerCase('vi').replace(/[\s–—-]+/g,'')===query.replace(/[\s–—-]+/g,'')));
  $('#admin-count').textContent=`${rows.length} BĐS`;
  $('#admin-records').innerHTML=rows.map(r=>`<article class="admin-record"><p class="eyebrow">${esc(r.code)} · ${esc(r.type)}</p><h2>${esc(r.privateTitle)}</h2><p class="admin-address"><strong>Địa chỉ riêng tư:</strong> ${esc(r.address)}</p><p class="admin-hashtags"><strong>Hashtag gốc:</strong> ${esc(r.hashtags.join(' '))}</p>${r.privateNotes?.length?`<details><summary>Ghi chú nguồn riêng tư</summary><ul>${r.privateNotes.map(note=>`<li>${esc(note)}</li>`).join('')}</ul></details>`:''}<a href="/bds/${esc(r.slug)}" target="_blank" rel="noopener noreferrer">Xem trang khách hàng</a>${RentalSharing.markup(r)}<details class="share-caption"><summary>Bài chia sẻ kèm hashtag (đã lược số nhà/ngõ/ngách)</summary><pre>${esc(RentalSharing.text(r))}</pre></details></article>`).join('');
 }
 async function load(){
  try{
   const response=await fetch('/api/admin',{cache:'no-store',credentials:'same-origin'}),data=await response.json();
   if(!response.ok){clear();$('#admin-status').textContent=response.status===401?'Vui lòng đăng nhập để xem thông tin riêng tư.':data.error;return}
   privateRows=data.listings.map(r=>{const safe=publicRows.find(p=>p.id===r.id);return {...r,privateTitle:r.title,title:safe.title,shareText:safe.shareText+'\n\n'+r.hashtags.join(' ')}});
   window.RENTAL_LISTINGS=privateRows;$('#admin-login').hidden=true;$('#admin-workspace').hidden=false;$('#admin-status').textContent='Đã đăng nhập. Phiên quản trị có thời hạn 8 giờ.';render();window.dispatchEvent(new CustomEvent('admin-session',{detail:true}));
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
 $('#admin-query').addEventListener('input',render);
 window.addEventListener('pagehide',clear);
 window.addEventListener('pageshow',event=>{if(event.persisted)load()});
 load();
})();
