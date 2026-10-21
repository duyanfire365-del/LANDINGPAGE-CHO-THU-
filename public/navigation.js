(() => {
 const nav=document.querySelector('header nav');
 if(nav&&!nav.querySelector('[data-quick-rental]')){const link=document.createElement('a');link.href='/?nhucau=tenant#tu-van';link.className='quick-rental-link';link.dataset.quickRental='true';link.innerHTML=`<span class="quick-rental-effects" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i class="quick-rental-spark" style="--spark-angle:${(i%8)*45}deg;--spark-delay:${-(i%8)*.23}s;--spark-x:${i<8?'15%':i<16?'86%':'54%'};--spark-y:${i<8?'72%':i<16?'30%':'4%'}"></i>`).join('')}</span><span class="quick-rental-hot"><span class="quick-rental-flame" aria-hidden="true">🔥</span><span>CLICK → HOT</span></span><span class="quick-rental-copy"><strong>TÌM NGUỒN THUÊ NGAY</strong><span>Hỗ trợ tìm thuê nhanh &amp; chính xác theo nhu cầu</span></span><span class="quick-rental-arrow" aria-hidden="true">→</span>`;nav.append(link);}
 function openRentalForm({focus=true}={}){const form=document.querySelector('#lead-form'),intent=form?.elements.intent;if(!form||!intent)return false;intent.value='tenant';intent.dispatchEvent(new Event('change'));form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});if(focus)form.elements.preferredArea?.focus({preventScroll:true});return true;}
 document.querySelector('[data-quick-rental]')?.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;if(document.querySelector('#lead-form')){event.preventDefault();openRentalForm();history.replaceState(null,'',location.pathname+location.search+'#tu-van')}});
 if(new URLSearchParams(location.search).get('nhucau')==='tenant')requestAnimationFrame(()=>openRentalForm());
 document.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>{
  let ownReferrer=false;try{ownReferrer=new URL(document.referrer).origin===location.origin}catch{}
  if(ownReferrer&&history.length>1)history.back();else location.assign('/');
 }));
})();
