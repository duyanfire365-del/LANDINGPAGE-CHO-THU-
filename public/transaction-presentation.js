// Transaction-aware links and form labels complement each tab's editable layout.
(() => {
 const hero=document.querySelector('main > .hero');if(!hero)return;
 let sale=new URLSearchParams(location.search).get('transaction')==='sale';
 const note=document.querySelector('.sample-note'),rentalNote=note?.textContent,tenant=document.querySelector('[data-lead-intent="tenant"]'),rentalTenant=tenant?.textContent;
 const originalLinks=new WeakMap();
 function sync(content){
  if(note)note.textContent=sale?'Thông tin theo nguồn cung cấp; cần xác nhận giá bán, hiện trạng, tình trạng giao dịch và hồ sơ pháp lý. Ảnh minh họa có ghi chú; ảnh nguồn cần đối chiếu thực tế.':rentalNote;
  if(tenant)tenant.textContent=sale?'KH quan tâm mua BĐS':rentalTenant;
  for(const node of document.querySelectorAll('header nav a,.footer-bottom nav a,.footer-browse')){
   if(!originalLinks.has(node))originalLinks.set(node,node.getAttribute('href'));
   const original=originalLinks.get(node);let url;try{url=new URL(original,location.href)}catch{continue}
   if(url.origin!==location.origin||!['/','/index.html'].includes(url.pathname))continue;
   if(sale&&url.hash){url.searchParams.set('transaction','sale');node.setAttribute('href',url.pathname+url.search+url.hash)}else node.setAttribute('href',original);
  }
  const grid=document.querySelector('.category-grid');if(grid)grid.setAttribute('aria-label',sale?'Danh mục BĐS mua bán':'Danh mục bất động sản cho thuê');
  const form=document.querySelector('#lead-form');if(form?.elements.intent.value==='tenant'&&sale){document.querySelector('#lead-area-label').textContent='Khu vực muốn mua';document.querySelector('#lead-type-label').textContent='BĐS muốn mua';}
  const land=form?.elements.preferredType.querySelector('option[value="Đất cho thuê"]');if(land)land.textContent=sale?'Đất':'Đất cho thuê';
  const desc=hero.querySelector('.hero-desc');
  if(sale&&content?.layout?.fields?.heroDescription==='Chọn khu vực, loại BĐS và ngân sách mua phù hợp.'){
   desc.replaceChildren(document.createTextNode(content.layout.fields.heroDescription),document.createElement('br'),document.createTextNode('Cần hỗ trợ mua/bán? Gọi '));
   const phone=document.createElement('a');phone.href='tel:'+content.phone.replace(/[^+0-9]/g,'');phone.textContent=content.phoneLabel;desc.append(phone,document.createTextNode(' hoặc '));
   const zalo=document.createElement('a');zalo.href=content.socials.find(s=>s.label.toLowerCase()==='zalo')?.url||'https://zalo.me/0906215365';zalo.className='zalo-link';zalo.textContent='Chat Zalo';zalo.target='_blank';zalo.rel='noopener noreferrer';desc.append(zalo,document.createTextNode(' để trao đổi trực tiếp.'));
  }
 }
 window.addEventListener('transaction-changed',event=>{sale=event.detail==='sale';sync()});
 window.addEventListener('site-layout-ready',event=>sync(event.detail));
 window.addEventListener('site-content-rendered',event=>sync(event.detail));
 document.querySelector('#lead-form')?.addEventListener('rental-intent',()=>sync());
 sync();
})();
