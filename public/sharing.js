(() => {
  const files = new Map();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = listing => new URL(listing.href||'/bds/'+listing.slug,location.protocol==='https:'?location.origin:'https://nguonchothue.vn').href;
  const text = listing => `${listing.shareText}\n\nXem thông tin: ${url(listing)}`;
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
  async function share(listing, element) {
    if (!navigator.share) {
      const ok = await copy(listing, element);
      status(element, ok ? 'Đã sao chép nội dung. Trình duyệt chưa hỗ trợ chia sẻ ảnh trực tiếp; dán bài kèm liên kết vào Facebook/Zalo để có ảnh xem trước.' : 'Trình duyệt chưa hỗ trợ chia sẻ trực tiếp. Anh/chị có thể chọn và sao chép bài đăng bên dưới.');
      return;
    }
    try {
      const file = await prepare(listing), payload = {title:listing.title, text:text(listing)};
      if (file && navigator.canShare?.({files:[file]})) payload.files = [file]; else payload.url = url(listing);
      await navigator.share(payload);
      status(element, 'Đã mở chức năng chia sẻ của thiết bị. Anh/chị tự chọn ứng dụng, nhóm và xác nhận đăng.');
    } catch (error) {
      if (error.name !== 'AbortError') status(element, 'Chưa mở được chia sẻ. Anh/chị dùng Sao chép bài đăng hoặc thử lại trên điện thoại.');
    }
  }
  function markup(listing) {
    return `<div class="sharing-tools"><div class="share-buttons"><button type="button" data-share-id="${listing.id}" data-share-action="copy">Sao chép bài đăng</button><button type="button" data-share-id="${listing.id}" data-share-action="native">Chia sẻ bài & ảnh</button><a data-share-id="${listing.id}" data-share-action="facebook" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url(listing))}" target="_blank" rel="noopener noreferrer">Facebook</a><a data-share-id="${listing.id}" data-share-action="zalo" href="https://chat.zalo.me/" target="_blank" rel="noopener noreferrer">Zalo</a></div><p class="share-status" role="status"></p><p class="sharing-note">Trên điện thoại hỗ trợ, chọn Facebook/Zalo trong bảng chia sẻ để gửi bài và ảnh. Anh/chị tự chọn nhóm và bấm đăng. Nếu Facebook chỉ nhận liên kết và ảnh xem trước, dán thêm phần bài đã sao chép.</p></div>`;
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-share-action]'); if (!target) return;
    const listing = window.RENTAL_LISTINGS?.find(h => h.id === Number(target.dataset.shareId)); if (!listing) return;
    const action = target.dataset.shareAction;
    if (action === 'copy') copy(listing, target);
    else if (action === 'native') share(listing, target);
    else if (action === 'facebook') copy(listing, target);
    else if (action === 'zalo') { if (navigator.share) { event.preventDefault(); share(listing, target); } else copy(listing, target); }
  });
  document.addEventListener('pointerover', event => {
    const element = event.target.closest('[data-share-id]');
    if (element) { const listing = window.RENTAL_LISTINGS?.find(h => h.id === Number(element.dataset.shareId)); if (listing) prepare(listing); }
  });
  window.RentalSharing = {url, text, copy, share, prepare, markup, escape};
})();
