// Keep buying/selling presentation separate from the editable rental layout.
(() => {
 const hero=document.querySelector('main > .hero');if(!hero)return;
 let sale=new URLSearchParams(location.search).get('transaction')==='sale';
 const escape=text=>{const node=document.createElement('span');node.textContent=text;return node.innerHTML};
 const specs=[
  ['heroEyebrow','.hero .eyebrow','NGUỒN BĐS HÀ NỘI · 0906 215 365'],
  ['heroTitle','.hero h1','Tìm nguồn Mua/Bán BĐS tại Hà Nội'],
  ['heroSlogan','.hero-slogan','TÌM ĐÚNG BĐS – CHỌN ĐÚNG NHU CẦU'],
  ['heroButton','.hero .button','Xem BĐS mua/bán'],
  ['heroSecondary','.hero-secondary a','Tư vấn mua/bán BĐS'],
  ['heroNote','.hero-disclaimer','Tin theo nguồn cung cấp; cần xác nhận giá bán, hiện trạng và hồ sơ pháp lý. Ảnh minh họa bằng AI.'],
  ['contactEyebrow','.contact > div > .eyebrow','CẦN MUA BĐS HAY KÝ GỬI BÁN?'],
  ['contactIntro','.contact > div > p:not(.eyebrow)','Chia sẻ nhu cầu mua BĐS hoặc ký gửi bán, kèm khu vực, loại BĐS và mức giá để được tư vấn trực tiếp.'],
  [null,'.sample-note','Thông tin theo nguồn cung cấp; cần xác nhận giá bán, hiện trạng, tình trạng giao dịch và hồ sơ pháp lý. Ảnh minh họa có ghi chú; ảnh nguồn cần đối chiếu thực tế.'],
  [null,'[data-lead-intent="tenant"]','KH quan tâm mua BĐS']
 ];
 const fields=specs.map(([key,selector,text])=>({key,node:document.querySelector(selector),text})).filter(f=>f.node);
 for(const f of fields)f.original=f.rental=f.node.innerHTML;
 const desc=hero.querySelector('.hero-desc'),originalDescription=desc.innerHTML;
 const saleDescription=document.createElement('p');saleDescription.append('Chọn khu vực, loại BĐS và ngân sách mua phù hợp.',document.createElement('br'),'Cần hỗ trợ mua/bán? Gọi ');
 for(const node of desc.childNodes){if(node.nodeType===1&&node.matches('a')){if(saleDescription.querySelector('a'))saleDescription.append(' hoặc ');saleDescription.append(node.cloneNode(true));}}
 saleDescription.append(' để trao đổi trực tiếp.');
 const description={original:originalDescription,rental:originalDescription,sale:saleDescription.innerHTML};
 const image=hero.querySelector('.hero-photo > img'),originalImage={src:image.getAttribute('src'),alt:image.alt};let rentalImage=originalImage.src;
 const quick=document.querySelector('[data-quick-rental]');
 const quickNodes=quick?[quick.querySelector('strong'),quick.querySelector('.quick-rental-copy > span')]:[];
 const quickOriginal=quickNodes.map(n=>n.textContent);let quickRental=[...quickOriginal];
 const links=new WeakMap(),footerFields=new Map();
 function rememberFooter(){for(const selector of ['.footer-brand > p','.footer-browse']){const node=document.querySelector(selector);if(node)footerFields.set(node,node.innerHTML);}}
 rememberFooter();
 function sync(){
  for(const f of fields)f.node.innerHTML=sale?escape(f.text):f.rental;
  desc.innerHTML=sale?description.sale:description.rental;
  image.src=sale?'/sale-banner.webp':rentalImage;image.alt=sale?'Minh họa mua bán BĐS tại Hà Nội: nhà phố, căn hộ và đất.':originalImage.alt;
  quickNodes.forEach((node,i)=>node.textContent=sale?['TÌM BĐS PHÙ HỢP','Hỗ trợ tìm mua BĐS theo nhu cầu và ngân sách'][i]:quickRental[i]);
  for(const [node,rental]of footerFields)node.innerHTML=sale?escape(node.matches('.footer-browse')?'Xem BĐS mua/bán →':'Kết nối nhu cầu mua và nguồn BĐS chào bán tại Hà Nội.'):rental;
  for(const node of document.querySelectorAll('header nav a,.footer-bottom nav a,.footer-browse')){
   if(!links.has(node))links.set(node,{text:node.textContent,href:node.getAttribute('href')});
   const original=links.get(node);let target;try{target=new URL(original.href,location.href)}catch{continue}
   if(target.origin!==location.origin||!['/','/index.html'].includes(target.pathname))continue;
   if(!sale){node.setAttribute('href',original.href);if(!node.matches('[data-quick-rental],.footer-browse'))node.textContent=original.text;continue}
   if(['#bat-dong-san','#quy-trinh','#tu-van'].includes(target.hash)){
    target.searchParams.set('transaction','sale');node.setAttribute('href',target.pathname+target.search+target.hash);
    if(!node.matches('[data-quick-rental],.footer-browse')&&/thuê/iu.test(original.text))node.textContent=target.hash==='#bat-dong-san'?'Xem BĐS mua/bán':target.hash==='#quy-trinh'?'Cách tìm BĐS':'Mua BĐS / Ký gửi bán';
   }
  }
  const grid=document.querySelector('.category-grid');if(grid)grid.setAttribute('aria-label',sale?'Danh mục BĐS mua bán':'Danh mục bất động sản cho thuê');
  const form=document.querySelector('#lead-form');if(form?.elements.intent.value==='tenant'&&sale){document.querySelector('#lead-area-label').textContent='Khu vực muốn mua';document.querySelector('#lead-type-label').textContent='BĐS muốn mua';}
  const land=form?.elements.preferredType.querySelector('option[value="Đất cho thuê"]');if(land)land.textContent=sale?'Đất':'Đất cho thuê';
 }
 function layout(content){const config=content?.layout||{},values=config.fields||{};for(const f of fields)if(f.key)f.rental=Object.hasOwn(values,f.key)?escape(values[f.key]):f.original;description.rental=Object.hasOwn(values,'heroDescription')?escape(values.heroDescription):description.original;rentalImage=config.banner||originalImage.src;quickRental=[config.quick?.title||quickOriginal[0],config.quick?.text||quickOriginal[1]];sync();}
 window.addEventListener('transaction-changed',event=>{sale=event.detail==='sale';sync()});
 window.addEventListener('site-layout-ready',event=>layout(event.detail));
 window.addEventListener('site-layout-apply',event=>queueMicrotask(()=>layout(event.detail)));
 window.addEventListener('site-content-rendered',()=>{rememberFooter();sync()});
 document.querySelector('#lead-form')?.addEventListener('rental-intent',sync);
 sync();
})();
