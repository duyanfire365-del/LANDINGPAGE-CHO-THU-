(() => {
 const nav=document.querySelector('header nav');
 if(nav&&!nav.querySelector('[data-quick-rental]')){const link=document.createElement('a');link.href='/?nhucau=tenant#tu-van';link.className='quick-rental-link';link.dataset.quickRental='true';link.innerHTML=`<span class="quick-rental-effects" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i class="quick-rental-spark" style="--spark-angle:${(i%8)*45}deg;--spark-delay:${-(i%8)*.23}s;--spark-x:${i<8?'15%':i<16?'86%':'54%'};--spark-y:${i<8?'72%':i<16?'30%':'4%'}"></i>`).join('')}</span><span class="quick-rental-hot"><span class="quick-rental-flame" aria-hidden="true">🔥</span><span>CLICK → HOT</span><span class="quick-rental-hand" aria-hidden="true">👉</span></span><span class="quick-rental-copy"><strong>TÌM NGUỒN THUÊ NGAY</strong><span>Hỗ trợ tìm thuê nhanh &amp; chính xác theo nhu cầu</span></span>`;nav.append(link);}
 function openRentalForm({focus=true}={}){const form=document.querySelector('#lead-form'),intent=form?.elements.intent;if(!form||!intent)return false;intent.value='tenant';intent.dispatchEvent(new Event('change'));form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});if(focus)form.elements.preferredArea?.focus({preventScroll:true});return true;}
 document.querySelector('[data-quick-rental]')?.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;if(document.querySelector('#lead-form')){event.preventDefault();openRentalForm();history.replaceState(null,'',location.pathname+location.search+'#tu-van')}});
 if(new URLSearchParams(location.search).get('nhucau')==='tenant')requestAnimationFrame(()=>openRentalForm());
 document.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>{
  let ownReferrer=false;try{ownReferrer=new URL(document.referrer).origin===location.origin}catch{}
  if(ownReferrer&&history.length>1)history.back();else location.assign('/');
 }));
})();

// Public header logo; keep the original brand intact until the custom image loads.
(() => {
 const brand=document.querySelector('header a.logo');if(!brand)return;const original=[...brand.childNodes],originalLabel=brand.getAttribute('aria-label');let version=0;
 async function refresh(){const ticket=++version;try{const r=await fetch('/api/catalog?view=website-brand',{cache:'no-store'});if(!r.ok)return;const data=await r.json();if(ticket!==version)return;if(!data.custom){brand.replaceChildren(...original);brand.classList.remove('website-logo-custom');if(originalLabel)brand.setAttribute('aria-label',originalLabel);else brand.removeAttribute('aria-label');return}if(typeof data.url!=='string'||!data.url.startsWith('/api/files?action=website-logo&'))return;const image=new Image();image.className='website-header-logo';image.alt=data.alt||'Logo website';image.width=data.width;image.height=data.height;image.onload=()=>{if(ticket!==version)return;brand.replaceChildren(image);brand.classList.add('website-logo-custom');brand.setAttribute('aria-label',image.alt+' — Trang chủ')};image.src=data.url}catch{/* Keep the original brand if configuration or image cannot load. */}}
 window.RentalSiteBrand={refresh};window.addEventListener('website-logo-updated',refresh);refresh();
})();
