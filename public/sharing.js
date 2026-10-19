(() => {
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
    if(navigator.share&&ready)return nativeShare(listing,element,ready);
    const promise=prepareAll(listing);
    if(navigator.share){const prepared=await promise;if(navigator.userActivation?.isActive!==false)return nativeShare(listing,element,prepared)}
    return composer(listing,element,'');
  }
  async function png(file){if(file.type==='image/png')return file;const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Không tạo được ảnh PNG.')),'image/png'))}
  function composer(listing,element,platform=''){
    document.querySelector('#share-composer')?.close();const dialog=document.createElement('dialog');dialog.id='share-composer';dialog.className='share-composer';let urls=[],disposed=false;
    const name=platform==='facebook'?'Facebook':platform==='zalo'?'Zalo':'Facebook / Zalo';
    dialog.innerHTML=`<div class="share-composer-heading"><h2>Chia sẻ lên ${name}</h2><button type="button" data-share-close aria-label="Đóng">×</button></div><p>Bài và ảnh được chuẩn bị sẵn. Chọn nơi đăng và xác nhận trong ứng dụng.</p><label>Bài đăng<textarea rows="6" readonly>${escape(text(listing))}</textarea></label><div class="share-buttons"><button type="button" data-copy-caption>Sao chép bài</button><button type="button" data-native-prepared disabled>Đang chuẩn bị ảnh…</button><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">Mở Facebook để đăng bài</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url(listing))}" target="_blank" rel="noopener noreferrer">Chia sẻ liên kết Facebook</a><a href="https://chat.zalo.me/" target="_blank" rel="noopener noreferrer">Mở Zalo</a></div><p class="share-composer-status" role="status">Đang tải ảnh…</p><div class="share-composer-images"></div><p class="sharing-note">Điện thoại: chọn “Chia sẻ bài & ảnh”, rồi chọn Facebook/Zalo. Máy tính: sao chép bài, mở trình soạn bài trên Facebook/Zalo và dán; sau đó sao chép ảnh để dán hoặc tải ảnh nếu trình duyệt không hỗ trợ. Facebook/Zalo có thể chỉ nhận ảnh hoặc liên kết; website không tự điền hay tự bấm đăng thay anh/chị.</p>`;
    document.body.append(dialog);dialog.addEventListener('close',()=>{disposed=true;urls.forEach(URL.revokeObjectURL);dialog.remove()});dialog.querySelector('[data-share-close]').onclick=()=>dialog.close();dialog.showModal();
    const message=value=>{if(!disposed)dialog.querySelector('.share-composer-status').textContent=value};
    const copyCaption=async()=>{const ok=await copy(listing,element);message(ok?'Đã sao chép bài. Anh/chị dán vào ô đăng bài bằng Ctrl+V / Dán.':'Chọn nội dung bài trong ô phía trên để sao chép.');};
    dialog.querySelector('[data-copy-caption]').onclick=copyCaption;
    // Copy while the click gesture is still active; photo sharing gets its own later click.
    copyCaption();
    prepareAll(listing).then(prepared=>{if(disposed)return;const native=dialog.querySelector('[data-native-prepared]');native.textContent=navigator.share?(canShareFiles(prepared)?'Chia sẻ bài & '+prepared.length+' ảnh':'Chia sẻ liên kết'):'Thiết bị chưa hỗ trợ chia sẻ trực tiếp';native.disabled=!navigator.share;native.onclick=()=>nativeShare(listing,element,prepared).then(ok=>{if(ok)message('Đã mở chia sẻ của thiết bị. Anh/chị chọn ứng dụng rồi kiểm tra bài và ảnh trước khi đăng.')});
      message(prepared.length?'Đã chuẩn bị '+prepared.length+' / '+imageSources(listing).length+' ảnh. Dùng các nút bên dưới để sao chép hoặc tải ảnh.':'Chưa tải được ảnh. Anh/chị vẫn chia sẻ được bài và liên kết.');
      prepared.forEach((file,i)=>{const objectURL=URL.createObjectURL(file);urls.push(objectURL);const article=document.createElement('article');article.innerHTML=`<img src="${objectURL}" alt="Ảnh ${i+1} của tin đăng"><div class="share-buttons"><button type="button" data-copy-photo disabled>Đang chuẩn bị…</button><a href="${objectURL}" download="${escape(file.name)}">Tải ảnh ${i+1}</a></div><p role="status"></p>`;dialog.querySelector('.share-composer-images').append(article);const button=article.querySelector('button'),label=article.querySelector('p');
        if(!window.ClipboardItem||!navigator.clipboard?.write){button.textContent='Trình duyệt chưa hỗ trợ sao chép ảnh';return}
        png(file).then(blob=>{if(disposed)return;button.disabled=false;button.textContent='Sao chép ảnh '+(i+1);button.onclick=()=>{navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(()=>label.textContent='Đã sao chép ảnh. Dán vào ô đăng bài trên Facebook/Zalo.').catch(()=>label.textContent='Chưa sao chép được ảnh. Dùng nút Tải ảnh rồi chọn ảnh trong ứng dụng.')}}).catch(()=>{button.textContent='Dùng Tải ảnh để lấy ảnh này'})
      });
    });
    return dialog;
  }
  function markup(listing) {
    return `<div class="sharing-tools"><div class="share-buttons"><button type="button" data-share-id="${listing.id}" data-share-action="copy">Sao chép bài đăng</button><button type="button" data-share-id="${listing.id}" data-share-action="native">Chia sẻ bài & ảnh</button><a data-share-id="${listing.id}" data-share-action="facebook" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url(listing))}" target="_blank" rel="noopener noreferrer">Facebook</a><a data-share-id="${listing.id}" data-share-action="zalo" href="https://chat.zalo.me/" target="_blank" rel="noopener noreferrer">Zalo</a></div><p class="share-status" role="status"></p><p class="sharing-note">Bấm Facebook/Zalo để chuẩn bị bài và ảnh. Trên thiết bị hỗ trợ, dùng bảng chia sẻ; trên máy tính có nút sao chép bài, sao chép ảnh và tải ảnh. Anh/chị chọn nơi đăng rồi xác nhận trong ứng dụng.</p></div>`;
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
  function register(listing){const rows=window.RENTAL_LISTINGS||[];const index=rows.findIndex(row=>row.id===listing.id);if(index<0)rows.push(listing);else rows[index]=listing;}
  window.RentalSharing = {register,url, text, copy, share, prepare, markup, escape, prepareAll,composer,publicCaption,invalidate:listing=>{files.delete(listing.id);albums.delete(listing.id);readyFiles.delete(listing.id)}};
})();
