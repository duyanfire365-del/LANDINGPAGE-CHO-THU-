(() => {
 const $=s=>document.querySelector(s),status=text=>$('#portal-status').textContent=text,esc=RentalSharing.escape;
 let profile=null;
 const request=async body=>{const response=await fetch('/api/members',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json();if(!response.ok)throw Error(data.error);return data};
 document.querySelectorAll('[data-auth-tab]').forEach(button=>button.addEventListener('click',()=>{const login=button.dataset.authTab==='login';$('#member-login').hidden=!login;$('#member-register').hidden=login;document.querySelectorAll('[data-auth-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)))}));
 async function posts(){
  const response=await fetch('/api/workspace',{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error);
  for(const post of data.posts)if(post.status==='published')RentalSharing.register(post.public_data);
  $('#member-posts').innerHTML=data.posts.length?data.posts.map(post=>`<article class="portal-record"><h3>${esc(post.public_data.title)}</h3>${data.canPost?RentalInventory.controls(post.public_data.slug):RentalInventory.badge(post.public_data.slug)}<p>${esc(({pending:'Chờ duyệt',published:'Đã đăng',rejected:'Chưa được duyệt'})[post.status])}</p><p>${esc(post.public_data.description)}</p><button type="button" class="button outline small" data-source-open="${esc(post.public_data.slug)}">Nguồn / Map của tin này</button>${post.status==='published'?RentalSharing.markup(post.public_data):''}</article>`).join(''):'<p>Chưa có tin được gửi.</p>';
  try{const shared=await fetch('/api/workspace?view=source-shared',{cache:'no-store'}),result=await shared.json();if(shared.ok&&result.sources?.length)$('#member-posts').insertAdjacentHTML('beforeend','<h3>Nguồn được cấp quyền xem</h3>'+result.sources.map(r=>`<p>${esc(r.code)} · ${esc(r.title)} <button type="button" class="button outline small" data-source-open="${esc(r.slug)}">Xem nguồn / Map được chia sẻ</button></p>`).join(''))}catch{}
  $('#member-posts').innerHTML+='<h3>Nhu cầu đã gửi</h3>'+((data.inquiries||[]).map(r=>`<p>${({tenant:'Cần thuê',owner:'Ký gửi cho thuê',owner_sale:'Ký gửi bán',owner_transfer:'Chuyển nhượng'})[r.intent]||r.intent} · ${esc(r.area||'Chưa chọn khu vực')} · ${esc(r.type||'Chưa chọn danh mục')}</p>`).join('')||'<p>Chưa có nhu cầu được ghi nhận trong tài khoản.</p>');
 }
 let customerMount;
 async function load(){
  try{const response=await fetch('/api/members',{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error);profile=data.profile;
   $('#member-auth').hidden=!!profile;$('#member-workspace').hidden=!profile;
   if(!data.enabled){status('Hệ thống thành viên đang được kết nối. Anh/chị có thể gọi hotline hoặc gửi nhu cầu qua Zalo trong thời gian này.');return}
   status('');if(!profile){customerMount?.clear();customerMount=null;document.querySelector('#customer-member-root')?.remove();return;}if(!customerMount){const root=document.createElement('section');root.id='customer-member-root';root.className='portal-card';$('#member-workspace').append(root);customerMount=RentalCustomers.mount(root)}
   $('#member-profile').textContent=`${profile.full_name} · ${profile.kind==='sales'?'Sale / Cộng tác viên':'Khách hàng'}`;
   const canPost=profile.kind==='sales'&&profile.can_post;$('#member-posting').hidden=!canPost;
   $('#posting-permission').textContent=canPost?'Anh/chị đã được cấp quyền gửi tin. Mọi tin đều cần quản trị viên duyệt.':profile.kind==='sales'?'Tài khoản đang chờ quản trị viên cấp quyền gửi tin.':'Anh/chị có thể gửi nhu cầu cần thuê hoặc ký gửi qua biểu mẫu.';
   if(canPost)RentalEditor.mount($('#member-posting'),{onSubmitted:posts});await posts();
  }catch(error){status(error.message)}
 }
 for(const action of ['login','register'])$('#member-'+action).addEventListener('submit',async event=>{
  event.preventDefault();const button=event.submitter;button.disabled=true;
  try{const body=Object.fromEntries(new FormData(event.target));body.action=action;body.consent=event.target.elements.consent?.checked===true;const data=await request(body);event.target.reset();if(action==='login')await load();else status(data.message)}catch(error){status(error.message)}finally{button.disabled=false}
 });
 $('#member-logout').addEventListener('click',async()=>{try{customerMount?.clear();customerMount=null;document.querySelector('#customer-member-root')?.remove();RentalSources.close();await request({action:'logout'});$('#member-posting').replaceChildren();$('#member-posts').replaceChildren();await load()}catch(error){status(error.message)}});
 window.addEventListener('pagehide',()=>{customerMount?.clear();customerMount=null;document.querySelector('#customer-member-root')?.remove();$('#member-posting').replaceChildren();$('#member-posts').replaceChildren();$('#member-profile').textContent=''});
 window.addEventListener('pageshow',event=>{if(event.persisted)load()});load();
})();
