(() => {
  const priceText=value=>Number(value)>0?new Intl.NumberFormat('vi-VN').format(value)+' triệu đồng/tháng':'Giá liên hệ';
  const sizeText=value=>Number(value)>0?new Intl.NumberFormat('vi-VN').format(value)+' m²':'Diện tích đang cập nhật';
  const transferText=post=>'Giá chuyển nhượng: '+(Number(post.transferPrice)>0?new Intl.NumberFormat('vi-VN').format(post.transferPrice)+' triệu đồng':'Liên hệ')+(post.transferNegotiable?' — Có thể thương lượng':'');
  const files = new Map(), albums = new Map();
  const readyFiles = new Map();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = listing => new URL(listing.href||'/bds/'+listing.slug,location.protocol==='https:'?location.origin:'https://nguonchothue.vn').href;
  const publicCaption = value => String(value||'').replace(/(^|[^\p{L}\p{N}_])(?:(?:hoa\s*hồng|hoa\s*hong|phí\s*môi\s*giới|phi\s*moi\s*gioi)\s*[:：=]\s*[^\n]*|(?:hoa\s*hồng|hoa\s*hong|hh)\s*[:：=]?\s*(?=\d|thỏa\s*thuận|thoa\s*thuan|thương\s*lượng|thuong\s*luong)[^\n]*|h\s*\d+(?:[.,]\d+)?\s*%[^\n]*)/gimu,'$1').replace(/\s+#\s*(?=\n|$)/g,'').replace(/\n{3,}/g,'\n\n').trim();
  const text = listing => `${publicCaption(listing.shareText)}\n\nXem thông tin: ${url(listing)}`;
  function status(element, message) {
    const target = element?.closest('.sharing-tools')?.querySelector('.share-status') || document.querySelector('#share-status');
    if (target) target.textContent = message;
  }
  async function copy(listing, element) {
    try {
      await navigator.clipboard.writeText(text(listing));
      status(element, 'Đã sao chép bài đăng và liên kết. Anh/chị có thể dán để chia sẻ.');
      return true;
    } catch {
      const field = document.createElement('textarea');
      field.value = text(listing); field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field); field.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch {} field.remove();
      status(element, ok ? 'Đã sao chép bài đăng.' : 'Chưa sao chép được. Anh/chị chọn nội dung trong mục Bài đăng để chia sẻ.');
      return ok;
    }
  }
  function prepare(listing) {
    if (!files.has(listing.id)) files.set(listing.id, fetch(listing.shareImage || listing.image).then(r => {
      if (!r.ok) throw Error('image'); return r.blob();
    }).then(blob => new File([blob], `${listing.code}.${blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg'}`, {type:blob.type || 'image/jpeg'})).catch(() => null));
    return files.get(listing.id);
  }
  function imageSources(listing){
    const media=(listing.media||[]).filter(m=>m.kind==='image');
    return media.length?media.slice(0,12).map(m=>'/api/files?action=media&id='+encodeURIComponent(m.id)+'&slug='+encodeURIComponent(listing.slug)):[listing.shareImage||listing.image];
  }
  function prepareAll(listing){
    if(!albums.has(listing.id))albums.set(listing.id,(async()=>{const sources=imageSources(listing),results=await Promise.all(sources.map(async(src,i)=>{try{const response=await fetch(src);if(!response.ok)throw Error('image');const blob=await response.blob();if(!/^image\/(?:jpeg|png|webp)$/.test(blob.type))throw Error('image');return new File([blob],`${listing.code.replace(/[^A-Z0-9-]/gi,'-')}-${i+1}.${blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg'}`,{type:blob.type})}catch{return null}}));const prepared=results.filter(Boolean);readyFiles.set(listing.id,prepared);return prepared})());
    return albums.get(listing.id);
  }
  function canShareFiles(prepared){try{return !!prepared.length&&!!navigator.canShare?.({files:prepared})}catch{return false}}
  async function nativeShare(listing,element,prepared){
    const payload={title:publicCaption(listing.title),text:text(listing)};
    if(canShareFiles(prepared))payload.files=prepared;else payload.url=url(listing);
    try{await navigator.share(payload);status(element,'Đã gửi yêu cầu chia sẻ. Chọn Facebook/Zalo, nơi đăng và xác nhận trong ứng dụng. Nếu ứng dụng không nhận phần chữ, dán bài đã sao chép.');return true}
    catch(error){if(error.name!=='AbortError')status(element,'Chưa chia sẻ được trực tiếp. Anh/chị dùng bảng sao chép bài và ảnh.');return false}
  }
  async function share(listing,element){
    const ready=readyFiles.get(listing.id);
    if(navigator.share&&ready){if(await nativeShare(listing,element,ready))return true;return composer(listing,element,'');}
    const promise=prepareAll(listing);
    if(navigator.share){const prepared=await promise;if(navigator.userActivation?.isActive!==false&&await nativeShare(listing,element,prepared))return true}
    return composer(listing,element,'');
  }
  async function png(file){if(file.type==='image/png')return file;const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Không tạo được ảnh PNG.')),'image/png'))}
  // Standard ZIP (stored entries) built locally; photos and caption never leave the browser.
  function photoBundle(listing,selected){
    const encoder=new TextEncoder(),table=new Uint32Array(256);
    for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}
    const crc=bytes=>{let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0};
    return (async()=>{const chunks=[],directory=[];let offset=0;
      const entries=[{name:'BAI-DANG-VA-LINK.txt',blob:new Blob([text(listing)],{type:'text/plain;charset=utf-8'})},...selected.map((file,i)=>({name:`anh-${i+1}.${file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'}`,blob:file}))];
      for(const entry of entries){const bytes=new Uint8Array(await entry.blob.arrayBuffer()),name=encoder.encode(entry.name),checksum=crc(bytes),local=new Uint8Array(30+name.length),v=new DataView(local.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,0x21,true);v.setUint32(14,checksum,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);local.set(name,30);
        const central=new Uint8Array(46+name.length),d=new DataView(central.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,0x21,true);d.setUint32(16,checksum,true);d.setUint32(20,bytes.length,true);d.setUint32(24,bytes.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);central.set(name,46);chunks.push(local,bytes);directory.push(central);offset+=local.length+bytes.length;
      }
      const size=directory.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);return new Blob([...chunks,...directory,end],{type:'application/zip'});
    })();
  }
  function composer(listing,element,platform=''){
    document.querySelector('#share-composer')?.close();const dialog=document.createElement('dialog');dialog.id='share-composer';dialog.className='share-composer';let urls=[],disposed=false;const photos=[];
    const name=platform==='facebook'?'Facebook':platform==='zalo'?'Zalo':'Facebook / Zalo';
    dialog.innerHTML=`<div class="share-composer-heading"><h2>Đăng bài & ảnh lên ${name}</h2><button type="button" data-share-close aria-label="Đóng">×</button></div><ol class="share-steps"><li>Chọn ảnh muốn đính kèm bên dưới, hoặc thêm ảnh từ máy.</li><li>Sao chép bài: nội dung đã kèm link website.</li><li>Điện thoại: chia sẻ ảnh qua ứng dụng. Máy tính: mở Facebook, dán bài rồi chọn Ảnh/video để thêm ảnh.</li></ol><label>Bài đăng kèm link website<textarea rows="6" readonly>${escape(text(listing))}</textarea></label><div class="share-buttons"><button type="button" data-copy-caption>1. Sao chép bài & link</button><button type="button" data-native-prepared disabled>Đang chuẩn bị ảnh…</button><button type="button" data-download-bundle disabled>Tải bộ ảnh & bài (ZIP)</button><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">Mở Facebook để đăng bài</a><a href="https://chat.zalo.me/" target="_blank" rel="noopener noreferrer">Mở Zalo</a></div><label class="share-add-photos">Thêm ảnh từ máy (không lưu lên website)<input type="file" data-add-share-photos accept="image/jpeg,image/png,image/webp" multiple disabled></label><p class="share-composer-status" role="status">Đang tải ảnh…</p><div class="share-composer-images"></div><details class="share-link-only"><summary>Chỉ muốn chia sẻ liên kết?</summary><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url(listing))}" target="_blank" rel="noopener noreferrer">Chia sẻ liên kết Facebook</a></details><p class="sharing-note">Facebook không cho cửa sổ chia sẻ liên kết tự đính ảnh từ website. Chia sẻ qua thiết bị có thể không giữ phần chữ/link: hãy dán bài đã sao chép nếu thiếu. Trên máy tính, tải từng ảnh hoặc giải nén bộ ZIP rồi chọn ảnh trong ô Ảnh/video của Facebook. Anh/chị kiểm tra và bấm Đăng trong ứng dụng.</p>`;
    document.body.append(dialog);dialog.addEventListener('close',()=>{disposed=true;urls.forEach(URL.revokeObjectURL);dialog.remove()});dialog.querySelector('[data-share-close]').onclick=()=>dialog.close();dialog.showModal();
    const message=value=>{if(!disposed)dialog.querySelector('.share-composer-status').textContent=value};
    const selected=()=>photos.filter(p=>p.checkbox.checked).map(p=>p.file),native=dialog.querySelector('[data-native-prepared]'),download=dialog.querySelector('[data-download-bundle]');
    function update(){const count=selected().length;native.textContent=navigator.share?(canShareFiles(selected())?'2. Chia sẻ bài & '+count+' ảnh':'Chia sẻ liên kết (thiết bị chưa gửi được ảnh)'):'Chia sẻ ảnh trực tiếp không khả dụng';native.disabled=!navigator.share;download.disabled=!count;download.textContent=count?'Tải '+count+' ảnh & bài (ZIP)':'Chọn ảnh để tải bộ ZIP';}
    const copyCaption=async()=>{const ok=await copy(listing,element);message(ok?'Đã sao chép bài và link website. Dán vào nội dung bài đăng trên Facebook/Zalo.':'Chọn nội dung bài trong ô phía trên để sao chép.');};
    dialog.querySelector('[data-copy-caption]').onclick=copyCaption;copyCaption();
    native.onclick=async()=>{const chosen=selected();if(!canShareFiles(chosen))message('Thiết bị chỉ hỗ trợ gửi liên kết. Để đăng kèm ảnh, dùng Tải ảnh hoặc Sao chép ảnh bên dưới.');const ok=await nativeShare(listing,element,chosen);if(ok)message(canShareFiles(chosen)?'Đã gửi ảnh và bài kèm link tới bảng chia sẻ. Chọn Facebook, kiểm tra nội dung; nếu thiếu chữ/link hãy dán bài đã sao chép.':'Đã mở chia sẻ liên kết. Muốn đính ảnh, dùng Sao chép ảnh / Tải ảnh rồi thêm vào bài Facebook.');else message('Chưa hoàn tất chia sẻ. Anh/chị có thể chọn lại hoặc tải ảnh, sao chép bài để đăng thủ công.');};
    download.onclick=async()=>{const chosen=selected();if(!chosen.length)return;download.disabled=true;try{const blob=await photoBundle(listing,chosen);if(disposed)return;const objectURL=URL.createObjectURL(blob);urls.push(objectURL);const a=document.createElement('a');a.href=objectURL;a.download=(listing.code||'bai-dang').replace(/[^A-Z0-9-]/gi,'-')+'-facebook.zip';dialog.append(a);a.click();a.remove();message('Đã chuẩn bị bộ ZIP gồm ảnh đã chọn và BAI-DANG-VA-LINK.txt. Giải nén, dán bài rồi chọn ảnh trong Facebook.')}catch{message('Chưa tạo được bộ ZIP. Anh/chị tải từng ảnh bên dưới.')}finally{if(!disposed)update()}};
    function addPhoto(file){const i=photos.length,objectURL=URL.createObjectURL(file);urls.push(objectURL);const article=document.createElement('article');article.innerHTML=`<label class="share-photo-choice"><input type="checkbox" checked> Đính kèm ảnh ${i+1}</label><img src="${objectURL}" alt="Ảnh ${i+1} của tin đăng"><div class="share-buttons"><button type="button" data-copy-photo disabled>Đang chuẩn bị…</button><a href="${objectURL}" download="${escape(file.name)}">Tải ảnh ${i+1}</a></div><p role="status"></p>`;dialog.querySelector('.share-composer-images').append(article);const checkbox=article.querySelector('input'),button=article.querySelector('button'),label=article.querySelector('p');photos.push({file,checkbox});checkbox.onchange=update;
      if(!window.ClipboardItem||!navigator.clipboard?.write){button.textContent='Dùng Tải ảnh để chèn ảnh';return}
      png(file).then(blob=>{if(disposed)return;button.disabled=false;button.textContent='Sao chép ảnh '+(i+1);button.onclick=()=>{navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(()=>label.textContent='Đã sao chép ảnh. Dán vào ô đăng bài trên Facebook/Zalo.').catch(()=>label.textContent='Chưa sao chép được ảnh. Dùng nút Tải ảnh rồi chọn ảnh trong ứng dụng.')}}).catch(()=>{button.textContent='Dùng Tải ảnh để lấy ảnh này'});
    }
    const upload=dialog.querySelector('[data-add-share-photos]');upload.onchange=()=>{const added=[...upload.files];let rejected=0;for(const file of added){if(!/^image\/(?:jpeg|png|webp)$/.test(file.type)||file.size>10*1024*1024||photos.length>=12||photos.reduce((n,p)=>n+p.file.size,0)+file.size>40*1024*1024){rejected++;continue}addPhoto(file)}upload.value='';update();message('Đã chuẩn bị '+photos.length+' ảnh; đang chọn '+selected().length+' ảnh.'+(rejected?' Một số tệp bị bỏ qua: chỉ nhận JPG/PNG/WebP, tối đa 10 MB/ảnh, 12 ảnh và tổng 40 MB.':' Ảnh thêm từ máy chỉ dùng để chia sẻ, không tải lên website.'));};
    prepareAll(listing).then(prepared=>{if(disposed)return;prepared.forEach(file=>{if(file.size<=10*1024*1024&&photos.reduce((n,p)=>n+p.file.size,0)+file.size<=40*1024*1024)addPhoto(file)});upload.disabled=false;update();message(photos.length?'Đã chuẩn bị '+photos.length+' / '+imageSources(listing).length+' ảnh kèm bài và link. Bỏ tích ảnh không muốn chia sẻ hoặc thêm ảnh từ máy.':'Chưa tải được ảnh của tin. Anh/chị có thể thêm ảnh từ máy để chia sẻ kèm bài và link.');});
    return dialog;
  }
  function markup(listing) {
    return `<div class="sharing-tools"><div class="share-buttons"><button type="button" data-share-id="${listing.id}" data-share-action="copy">Sao chép bài đăng</button><button type="button" data-share-id="${listing.id}" data-share-action="native">Chia sẻ bài & ảnh</button><a data-share-id="${listing.id}" data-share-action="facebook" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url(listing))}" target="_blank" rel="noopener noreferrer">Facebook · Bài & ảnh</a><a data-share-id="${listing.id}" data-share-action="zalo" href="https://chat.zalo.me/" target="_blank" rel="noopener noreferrer">Zalo</a></div><p class="share-status" role="status"></p><p class="sharing-note">Bấm Facebook/Zalo để chuẩn bị bài và ảnh. Trên thiết bị hỗ trợ, dùng bảng chia sẻ; trên máy tính có nút sao chép bài, sao chép ảnh và tải ảnh. Anh/chị chọn nơi đăng rồi xác nhận trong ứng dụng.</p></div>`;
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-share-action]'); if (!target) return;
    const listing = window.RENTAL_LISTINGS?.find(h => h.id === Number(target.dataset.shareId)); if (!listing) return;
    const action = target.dataset.shareAction;
    if (action === 'copy') copy(listing, target);
    else if (action === 'native') share(listing, target);
    else if (action === 'facebook') {event.preventDefault();composer(listing,target,'facebook');}
    else if (action === 'zalo') {event.preventDefault();composer(listing,target,'zalo');}
  });
  document.addEventListener('pointerover', event => {
    const element = event.target.closest('[data-share-id]');
    if (element) { const listing = window.RENTAL_LISTINGS?.find(h => h.id === Number(element.dataset.shareId)); if (listing) {prepare(listing);if(element.dataset.shareAction!=='copy')prepareAll(listing);} }
  });
  window.addEventListener('pagehide',()=>document.querySelector('#share-composer')?.close());
  function register(listing){const rows=window.RENTAL_LISTINGS||(window.RENTAL_LISTINGS=[]);const index=rows.findIndex(row=>row.id===listing.id);if(index>=0&&JSON.stringify([rows[index].image,rows[index].shareImage,rows[index].mediaRevision,rows[index].media])!==JSON.stringify([listing.image,listing.shareImage,listing.mediaRevision,listing.media])){files.delete(listing.id);albums.delete(listing.id);readyFiles.delete(listing.id)}if(index<0)rows.push(listing);else rows[index]=listing;}
  window.RentalSharing = {register,priceText,sizeText,transferText,url, text, copy, share, prepare, markup, escape, prepareAll,composer,publicCaption,photoBundle,invalidate:listing=>{files.delete(listing.id);albums.delete(listing.id);readyFiles.delete(listing.id)}};
})();
